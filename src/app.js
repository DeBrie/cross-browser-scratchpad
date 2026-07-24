import { renderMarkdown } from './markdown.js';
import { canPersist, loadNote, normaliseHost, noteKey, saveNote, uiScopeKey } from './note-store.js';
import { restoreSession, signIn, signUp, syncNotes } from './sync-client.js';

const SAVE_DELAY = 350;

const elements = {
  tabs: [...document.querySelectorAll('.tab')],
  editor: document.querySelector('#editor'),
  preview: document.querySelector('#preview'),
  context: document.querySelector('#context-label'),
  mode: document.querySelector('#mode-button'),
  anchor: document.querySelector('#anchor-button'),
  storage: document.querySelector('#storage-status'),
  save: document.querySelector('#save-status'),
  unavailable: document.querySelector('#site-unavailable'),
  sync: document.querySelector('#sync-button'), dialog: document.querySelector('#sync-dialog'), form: document.querySelector('#sync-form'), email: document.querySelector('#sync-email'), password: document.querySelector('#sync-password'), error: document.querySelector('#sync-error'),
};

const state = {
  scope: 'global',
  host: null,
  windowId: null,
  isPreview: false,
  saveTimer: null,
  note: '',
  isLoaded: false,
  vault: null,
  syncMerged: false,
};

function contextForNote() {
  return { host: state.host, windowId: state.windowId };
}

function setSaveStatus(kind, label) {
  const dotClass = kind === 'saving' ? 'is-saving' : kind === 'error' ? 'is-error' : 'is-saved';
  elements.save.innerHTML = `<span class="status-dot ${dotClass}" aria-hidden="true"></span> ${label}`;
}

function updateFooter() {
  if (state.scope === 'ephemeral') {
    elements.storage.classList.add('is-session');
    elements.storage.innerHTML = '<span class="database-icon" aria-hidden="true">○</span> This window only';
    elements.save.innerHTML = '<span class="status-dot" aria-hidden="true"></span> Not saved to storage';
  } else {
    elements.storage.classList.remove('is-session');
    elements.storage.innerHTML = `<span class="database-icon" aria-hidden="true">▣</span> ${state.vault ? 'Encrypted sync enabled' : 'Not syncing between browsers'}`;
    setSaveStatus('saved', state.syncMerged ? 'Merged notes safely' : 'Saved just now');
  }
}

function updateContext() {
  if (state.scope === 'global') elements.context.textContent = 'Available everywhere';
  if (state.scope === 'site') elements.context.textContent = state.host ? `Only for ${state.host}` : 'Unavailable on this page';
  if (state.scope === 'ephemeral') elements.context.textContent = 'Clears when this window closes';
}

function updateMode() {
  elements.editor.hidden = state.isPreview;
  elements.preview.hidden = !state.isPreview;
  elements.mode.textContent = state.isPreview ? 'Edit' : 'Preview';
  if (state.isPreview) elements.preview.innerHTML = renderMarkdown(state.note) || '<p class="empty-preview">Nothing to preview yet.</p>';
}

function renderScope() {
  const isUnavailable = state.scope === 'site' && !state.host;
  elements.tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.scope === state.scope));
  elements.editor.disabled = isUnavailable;
  elements.editor.hidden = isUnavailable || state.isPreview;
  elements.preview.hidden = isUnavailable || !state.isPreview;
  elements.unavailable.hidden = !isUnavailable;
  elements.mode.hidden = isUnavailable;
  updateContext();
  updateFooter();
  updateMode();
}

async function persistNow() {
  window.clearTimeout(state.saveTimer);
  if (!canPersist(state)) return;
  if (state.scope !== 'ephemeral') setSaveStatus('saving', 'Saving…');
  try {
    await saveNote(state.scope, contextForNote(), state.note);
    if (state.vault && state.scope !== 'ephemeral') {
      const key = noteKey(state.scope, contextForNote());
      await chrome.storage.local.set({ [`updated:${key}`]: Date.now() });
      await syncNotes(state.vault, state.vault.token);
    }
    if (state.scope !== 'ephemeral') setSaveStatus('saved', 'Saved just now');
  } catch (error) {
    console.error('Unable to save note', error);
    if (state.scope !== 'ephemeral') setSaveStatus('error', 'Could not save');
  }
}

function scheduleSave() {
  window.clearTimeout(state.saveTimer);
  if (state.scope !== 'ephemeral') setSaveStatus('saving', 'Saving…');
  state.saveTimer = window.setTimeout(persistNow, SAVE_DELAY);
}

async function loadScope(scope) {
  if (state.isLoaded) await persistNow();
  state.scope = scope;
  const scopeKey = uiScopeKey(state.windowId);
  if (scopeKey) await chrome.storage.session.set({ [scopeKey]: scope });
  state.isPreview = false;
  state.note = state.scope === 'site' && !state.host ? '' : await loadNote(state.scope, contextForNote());
  state.isLoaded = true;
  elements.editor.value = state.note;
  renderScope();
  if (!(state.scope === 'site' && !state.host)) elements.editor.focus();
}

async function getBrowserContext() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const currentWindow = await chrome.windows.getCurrent();
  state.windowId = tab?.windowId ?? currentWindow.id;
  state.host = normaliseHost(tab?.url);
}

elements.tabs.forEach((tab) => tab.addEventListener('click', () => loadScope(tab.dataset.scope)));
elements.editor.addEventListener('input', () => {
  state.note = elements.editor.value;
  scheduleSave();
});
elements.mode.addEventListener('click', () => {
  state.isPreview = !state.isPreview;
  updateMode();
});
elements.anchor.addEventListener('click', async () => {
  try {
    await chrome.sidePanel.open({ windowId: state.windowId });
  } catch (error) {
    console.error('Unable to open side panel', error);
    setSaveStatus('error', 'Could not open side panel');
  }
});
elements.sync.addEventListener('click', () => elements.dialog.showModal());
elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const action = event.submitter?.value;
  if (action === 'cancel') return elements.dialog.close();
  try {
    elements.error.textContent = 'Unlocking encrypted vault…';
    state.vault = action === 'signup' ? await signUp(elements.email.value, elements.password.value) : await signIn(elements.email.value, elements.password.value);
    state.syncMerged = (await syncNotes(state.vault, state.vault.token)).merged;
    elements.dialog.close(); updateFooter();
  } catch (error) { elements.error.textContent = error.message; }
});
window.addEventListener('pagehide', () => persistNow());

getBrowserContext()
  .then(async () => {
    state.vault = await restoreSession();
    if (state.vault) state.syncMerged = (await syncNotes(state.vault, state.vault.token)).merged;
    const scopeKey = uiScopeKey(state.windowId);
    const savedScope = scopeKey ? (await chrome.storage.session.get(scopeKey))[scopeKey] : null;
    await loadScope(['global', 'site', 'ephemeral'].includes(savedScope) ? savedScope : 'global');
  })
  .catch((error) => {
    console.error('Unable to read current tab', error);
    state.windowId = null;
    loadScope('global');
  });
