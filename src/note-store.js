const PERSISTENT_LIBRARY_KEY = 'library:v2';

export function normaliseHost(url) {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && parsed.hostname ? parsed.hostname : null;
  } catch {
    return null;
  }
}

export function noteKey(scope, { host, windowId } = {}) {
  if (scope === 'global') return 'global';
  if (scope === 'site') return host ? `site:${host}` : null;
  if (scope === 'ephemeral') return Number.isInteger(windowId) ? `ephemeral:${windowId}` : null;
  return null;
}

export function canPersist({ isLoaded, scope, host }) {
  return Boolean(isLoaded) && !(scope === 'site' && !host);
}

export function uiScopeKey(windowId) {
  return Number.isInteger(windowId) ? `ui-scope:${windowId}` : null;
}

export function uiLibraryKey(windowId) {
  return Number.isInteger(windowId) ? `ui-library:${windowId}` : null;
}

function libraryKey(scope, { windowId } = {}) {
  return scope === 'ephemeral' ? `library:v2:ephemeral:${windowId}` : PERSISTENT_LIBRARY_KEY;
}

function titleFromBody(body) {
  const firstMeaningfulLine = String(body).split('\n').map((line) => line.replace(/^#{1,6}\s*/, '').trim()).find(Boolean);
  return firstMeaningfulLine?.slice(0, 80) || 'Untitled note';
}

function legacyId(scope, host) {
  return scope === 'site' ? `legacy-site-${host.replace(/[^a-z0-9]/gi, '-')}` : `legacy-${scope}`;
}

export function createNote({ scope, host = null, now = Date.now(), id = crypto.randomUUID(), title = 'Untitled note', body = '' }) {
  return { id, title, body, scope, host: scope === 'site' ? host : null, createdAt: now, updatedAt: now };
}

export function deleteNote(notes, id, now = Date.now()) {
  return notes.map((note) => note.id === id ? { ...note, deletedAt: now, updatedAt: now } : note);
}

export function migrateLegacyNotes(values, scope, { host } = {}, now = Date.now()) {
  const key = noteKey(scope, { host });
  if (!key || typeof values[key] !== 'string') return [];
  const body = values[key];
  if (!body) return [];
  return [createNote({ scope, host, now, id: legacyId(scope, host), title: titleFromBody(body), body })];
}

function isNote(note, scope, host) {
  return note && typeof note.id === 'string' && typeof note.title === 'string' && typeof note.body === 'string'
    && note.scope === scope && (scope !== 'site' || note.host === host);
}

export async function loadNotes(scope, context = {}) {
  const key = libraryKey(scope, context);
  const area = scope === 'ephemeral' ? chrome.storage.session : chrome.storage.local;
  const values = await area.get(null);
  const existing = Array.isArray(values[key])
    ? values[key].filter((note) => scope === 'ephemeral' ? isNote(note, scope, context.host) : ['global', 'site'].includes(note.scope))
    : [];
  const legacy = migrateLegacyNotes(values, scope, context);
  const merged = legacy.length && !existing.some((note) => note.id === legacy[0].id) ? [...existing, ...legacy] : existing;
  if (merged.length !== existing.length) await area.set({ [key]: merged });
  return merged.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveNotes(scope, context, notes) {
  const area = scope === 'ephemeral' ? chrome.storage.session : chrome.storage.local;
  await area.set({ [libraryKey(scope, context)]: notes });
}

export function notesForScope(notes, scope, { host } = {}) {
  return notes.filter((note) => !note.deletedAt && note.scope === scope && (scope !== 'site' || note.host === host));
}

export function searchNotes(notes, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return notes;
  return notes.filter((note) => `${note.title}\n${note.body}`.toLocaleLowerCase().includes(needle));
}
