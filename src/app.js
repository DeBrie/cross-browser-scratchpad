import { renderMarkdown } from "./markdown.js";
import {
  createNote,
  deleteNote,
  loadNotes,
  normaliseHost,
  notesForScope,
  saveNotes,
  searchNotes,
  uiLibraryKey,
  uiScopeKey,
} from "./note-store.js";
import { restoreSession, signIn, signUp, syncNotes } from "./sync-client.js";
import { openScratchpadSidebar } from "./sidebar.js";
import { requestFirefoxSyncConsent } from "./firefox-consent.js";

const SAVE_DELAY = 350;
const elements = {
  tabs: [...document.querySelectorAll(".tab")],
  library: document.querySelector("#library"),
  newNote: document.querySelector("#new-note"),
  search: document.querySelector("#note-search"),
  list: document.querySelector("#note-list"),
  libraryTitle: document.querySelector("#library-title"),
  collapse: document.querySelector("#collapse-library"),
  title: document.querySelector("#note-title"),
  deleteNote: document.querySelector("#delete-note"),
  editor: document.querySelector("#editor"),
  context: document.querySelector("#context-label"),
  anchor: document.querySelector("#anchor-button"),
  storage: document.querySelector("#storage-status"),
  save: document.querySelector("#save-status"),
  unavailable: document.querySelector("#site-unavailable"),
  sync: document.querySelector("#sync-button"),
  dialog: document.querySelector("#sync-dialog"),
  form: document.querySelector("#sync-form"),
  email: document.querySelector("#sync-email"),
  password: document.querySelector("#sync-password"),
  error: document.querySelector("#sync-error"),
};
const state = {
  scope: "global",
  host: null,
  windowId: null,
  notes: [],
  selectedId: null,
  saveTimer: null,
  isLoaded: false,
  vault: null,
  syncMerged: false,
  collapsed: false,
};
const context = () => ({ host: state.host, windowId: state.windowId });
const selectionScope = () =>
  state.scope === "site" ? `site:${state.host}` : state.scope;
const activeNotes = () => notesForScope(state.notes, state.scope, context());
const selected = () =>
  state.notes.find((note) => note.id === state.selectedId) ?? null;

function labeled(target, className, symbol, label) {
  const icon = document.createElement("span");
  icon.className = className;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = symbol;
  target.replaceChildren(icon, document.createTextNode(` ${label}`));
}
function setSave(kind, label) {
  labeled(
    elements.save,
    `status-dot ${kind === "saving" ? "is-saving" : kind === "error" ? "is-error" : "is-saved"}`,
    "",
    label,
  );
}
function updateFooter() {
  if (state.scope === "ephemeral") {
    elements.storage.classList.add("is-session");
    labeled(elements.storage, "database-icon", "○", "This window only");
    labeled(elements.save, "status-dot", "", "Not saved to storage");
  } else {
    elements.storage.classList.remove("is-session");
    labeled(
      elements.storage,
      "database-icon",
      "▣",
      state.vault ? "Encrypted sync enabled" : "Not syncing between browsers",
    );
    setSave(
      "saved",
      state.syncMerged ? "Merged notes safely" : "Saved just now",
    );
  }
}
function updateContext() {
  elements.context.textContent =
    state.scope === "global"
      ? "Available everywhere"
      : state.scope === "site"
        ? state.host
          ? `Only for ${state.host}`
          : "Unavailable on this page"
        : "Clears when this window closes";
  elements.libraryTitle.textContent =
    state.scope === "global"
      ? "All notes"
      : state.scope === "site"
        ? state.host || "This site"
        : "This window";
}
function setCaretAtEnd() {
  const range = document.createRange();
  range.selectNodeContents(elements.editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
function inlineMarkdownFrom(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.classList?.contains("markdown-syntax")) return "";
  if (node.nodeName === "BR") return "\n";
  const value = [...node.childNodes].map(inlineMarkdownFrom).join("");
  if (node.nodeName === "STRONG" || node.nodeName === "B") return `**${value}**`;
  if (node.nodeName === "EM" || node.nodeName === "I") return `*${value}*`;
  if (node.nodeName === "CODE") return `\`${value}\``;
  if (node.nodeName === "A") return `[${value}](${node.getAttribute("href")})`;
  return value;
}
function markdownFromEditor() {
  return [...elements.editor.childNodes].map((node) => {
    const value = inlineMarkdownFrom(node);
    if (/^H[1-3]$/.test(node.nodeName)) return `${"#".repeat(Number(node.nodeName[1]))} ${value.trim()}`;
    if (node.nodeName === "UL" || node.nodeName === "OL") return [...node.children].map((item, index) => {
      const task = item.querySelector("input[type=checkbox]");
      const text = [...item.childNodes].filter((child) => child !== task).map(inlineMarkdownFrom).join("").trim();
      const prefix = node.nodeName === "OL" ? `${index + 1}.` : "-";
      return `${prefix} ${task ? `[${task.checked ? "x" : " "}] ` : ""}${text}`;
    }).join("\n");
    if (node.nodeName === "BLOCKQUOTE") return [...node.childNodes].map((child) => `> ${inlineMarkdownFrom(child)}`).join("\n");
    if (node.nodeName === "HR") return "---";
    if (node.nodeName === "PRE") return `\`\`\`\n${node.textContent}\n\`\`\``;
    return value;
  }).filter((value) => value.trim()).join("\n\n");
}
function renderLiveMarkdown(markdown, keepCaret = false) {
  const rendered = renderMarkdown(markdown);
  if (!rendered) { elements.editor.replaceChildren(); return; }
  const parsed = new DOMParser().parseFromString(rendered, "text/html");
  elements.editor.replaceChildren(...[...parsed.body.children].map((node) => node.cloneNode(true)));
  decorateMarkdownSyntax();
  if (keepCaret) setCaretAtEnd();
}
function decorateMarkdownSyntax() {
  for (const heading of elements.editor.querySelectorAll("h1, h2, h3")) {
    if (heading.querySelector(".markdown-syntax")) continue;
    const syntax = document.createElement("span");
    syntax.className = "markdown-syntax";
    syntax.textContent = `${"#".repeat(Number(heading.nodeName[1]))} `;
    heading.prepend(syntax);
  }
}
function updateFocusedLine() {
  for (const line of elements.editor.querySelectorAll(".is-focused-line")) line.classList.remove("is-focused-line");
  const selection = window.getSelection();
  if (!selection?.anchorNode || !elements.editor.contains(selection.anchorNode)) return;
  const node = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  node?.closest?.("h1, h2, h3, p, li")?.classList.add("is-focused-line");
}
function updateEditedNote() {
  const note = selected();
  if (!note) return;
  note.body = markdownFromEditor();
  note.updatedAt = Date.now();
  renderList();
  scheduleSave();
}
function activeEditableBlock() {
  const node = window.getSelection()?.anchorNode;
  const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  return element?.closest?.("p, div") || elements.editor;
}
function convertHeadingShortcut(event) {
  if (event.key !== " ") return;
  const block = activeEditableBlock();
  const match = /^(#{1,3})$/.exec(block?.textContent || "");
  if (!match) return;
  event.preventDefault();
  const heading = document.createElement(`h${match[1].length}`);
  const syntax = document.createElement("span");
  syntax.className = "markdown-syntax";
  syntax.textContent = `${match[1]} `;
  heading.append(syntax);
  if (block === elements.editor) elements.editor.replaceChildren(heading); else block.replaceWith(heading);
  const range = document.createRange();
  range.selectNodeContents(heading);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  updateFocusedLine();
  updateEditedNote();
}
function renderList() {
  const filtered = searchNotes(activeNotes(), elements.search.value);
  elements.list.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = elements.search.value
      ? "No matching notes."
      : "No notes yet.";
    elements.list.append(empty);
    return;
  }
  for (const note of filtered) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `note-row${note.id === state.selectedId ? " is-active" : ""}`;
    const title = document.createElement("strong");
    title.textContent = note.title || "Untitled note";
    const summary = document.createElement("span");
    summary.textContent = note.body.replace(/\s+/g, " ").trim() || "Empty note";
    row.append(title, summary);
    row.addEventListener("click", () => selectNote(note.id));
    elements.list.append(row);
  }
}
function renderWorkspace() {
  const note = selected();
  const unavailable = state.scope === "site" && !state.host;
  elements.tabs.forEach((tab) =>
    tab.classList.toggle("is-active", tab.dataset.scope === state.scope),
  );
  elements.title.disabled = unavailable || !note;
  elements.deleteNote.disabled = unavailable || !note;
  elements.deleteNote.hidden = unavailable || !note;
  elements.editor.contentEditable = unavailable || !note ? "false" : "true";
  elements.title.hidden = unavailable;
  elements.editor.hidden = unavailable;
  elements.unavailable.hidden = !unavailable;
  elements.title.value = note?.title || "";
  updateContext();
  updateFooter();
  renderLiveMarkdown(note?.body || "");
}
function render() {
  elements.library.classList.toggle("is-collapsed", state.collapsed);
  elements.collapse.setAttribute("aria-expanded", String(!state.collapsed));
  renderList();
  renderWorkspace();
}

async function saveUiState() {
  const key = uiLibraryKey(state.windowId);
  if (!key) return;
  const values = await chrome.storage.session.get(key);
  await chrome.storage.session.set({
    [key]: {
      ...(values[key] || {}),
      collapsed: state.collapsed,
      [selectionScope()]: state.selectedId,
    },
  });
}
async function persistNow() {
  window.clearTimeout(state.saveTimer);
  if (!state.isLoaded) return;
  const note = selected();
  if (!note) return;
  if (state.scope !== "ephemeral") setSave("saving", "Saving…");
  try {
    await saveNotes(state.scope, context(), state.notes);
    if (state.vault && state.scope !== "ephemeral") {
      await syncNotes(state.vault, state.vault.token);
    }
    if (state.scope !== "ephemeral") setSave("saved", "Saved just now");
  } catch (error) {
    console.error("Unable to save note", error);
    if (state.scope !== "ephemeral") setSave("error", "Could not save");
  }
}
function scheduleSave() {
  window.clearTimeout(state.saveTimer);
  if (state.scope !== "ephemeral") setSave("saving", "Saving…");
  state.saveTimer = window.setTimeout(persistNow, SAVE_DELAY);
}
async function selectNote(id) {
  if (state.selectedId === id) return;
  await persistNow();
  state.selectedId = id;
  await saveUiState();
  render();
}
async function createNewNote() {
  const now = Date.now();
  const note = createNote({ scope: state.scope, host: state.host, now });
  state.notes = [...state.notes, note];
  state.selectedId = note.id;
  await saveUiState();
  await persistNow();
  render();
  elements.title.focus();
}
async function deleteSelectedNote() {
  const note = selected();
  if (!note || !window.confirm(`Delete “${note.title || "Untitled note"}”?`)) return;
  state.notes = deleteNote(state.notes, note.id);
  state.selectedId = activeNotes()[0]?.id ?? null;
  await saveNotes(state.scope, context(), state.notes);
  if (state.vault && state.scope !== "ephemeral") await syncNotes(state.vault, state.vault.token);
  await saveUiState();
  render();
  if (state.selectedId) elements.editor.focus();
}
async function loadScope(scope) {
  if (state.isLoaded) await persistNow();
  state.scope = scope;
  const key = uiScopeKey(state.windowId);
  if (key) await chrome.storage.session.set({ [key]: scope });
  state.notes =
    state.scope === "site" && !state.host
      ? []
      : await loadNotes(state.scope, context());
  const uiKey = uiLibraryKey(state.windowId);
  const ui = uiKey ? (await chrome.storage.session.get(uiKey))[uiKey] : null;
  state.collapsed = Boolean(ui?.collapsed);
  const candidates = activeNotes();
  state.selectedId = candidates.some(
    (note) => note.id === ui?.[selectionScope()],
  )
    ? ui[selectionScope()]
    : (candidates[0]?.id ?? null);
  state.isLoaded = true;
  render();
  if (!state.selectedId && !(state.scope === "site" && !state.host))
    await createNewNote();
  else if (state.selectedId) elements.editor.focus();
}
async function getBrowserContext() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const currentWindow = await chrome.windows.getCurrent();
  state.windowId = tab?.windowId ?? currentWindow.id;
  state.host = normaliseHost(tab?.url);
}

elements.tabs.forEach((tab) =>
  tab.addEventListener("click", () => loadScope(tab.dataset.scope)),
);
elements.newNote.addEventListener("click", createNewNote);
elements.deleteNote.addEventListener("click", deleteSelectedNote);
elements.search.addEventListener("input", renderList);
elements.collapse.addEventListener("click", async () => {
  state.collapsed = !state.collapsed;
  await saveUiState();
  render();
});
elements.title.addEventListener("input", () => {
  const note = selected();
  if (!note) return;
  note.title = elements.title.value;
  note.updatedAt = Date.now();
  renderList();
  scheduleSave();
});
elements.editor.addEventListener("input", () => {
  updateEditedNote();
});
elements.editor.addEventListener("keydown", convertHeadingShortcut);
elements.editor.addEventListener("focus", updateFocusedLine);
elements.editor.addEventListener("blur", () => {
  for (const line of elements.editor.querySelectorAll(".is-focused-line")) line.classList.remove("is-focused-line");
});
document.addEventListener("selectionchange", updateFocusedLine);
elements.anchor.addEventListener("click", async () => {
  try {
    await openScratchpadSidebar(state.windowId, globalThis.browser ?? chrome);
  } catch (error) {
    console.error("Unable to open side panel", error);
    setSave("error", "Could not open side panel");
  }
});
elements.sync.addEventListener("click", () => elements.dialog.showModal());
elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const action = event.submitter?.value;
  if (action === "cancel") return elements.dialog.close();
  try {
    if (!(await requestFirefoxSyncConsent(globalThis.browser))) {
      elements.error.textContent =
        "Firefox data consent is required to enable sync.";
      return;
    }
    elements.error.textContent = "Unlocking encrypted vault…";
    state.vault =
      action === "signup"
        ? await signUp(elements.email.value, elements.password.value)
        : await signIn(elements.email.value, elements.password.value);
    state.syncMerged = (await syncNotes(state.vault, state.vault.token)).merged;
    state.notes = await loadNotes(state.scope, context());
    elements.dialog.close();
    render();
  } catch (error) {
    elements.error.textContent = error.message;
  }
});
window.addEventListener("pagehide", () => persistNow());
getBrowserContext()
  .then(async () => {
    state.vault = await restoreSession();
    if (state.vault)
      state.syncMerged = (
        await syncNotes(state.vault, state.vault.token)
      ).merged;
    const key = uiScopeKey(state.windowId);
    const savedScope = key
      ? (await chrome.storage.session.get(key))[key]
      : null;
    await loadScope(
      ["global", "site", "ephemeral"].includes(savedScope)
        ? savedScope
        : "global",
    );
  })
  .catch((error) => {
    console.error("Unable to read current tab", error);
    state.windowId = null;
    loadScope("global");
  });
