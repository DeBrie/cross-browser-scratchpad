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

export async function loadNote(scope, context) {
  const key = noteKey(scope, context);
  if (!key) return '';
  const area = scope === 'ephemeral' ? chrome.storage.session : chrome.storage.local;
  const values = await area.get(key);
  return typeof values[key] === 'string' ? values[key] : '';
}

export async function saveNote(scope, context, value) {
  const key = noteKey(scope, context);
  if (!key) return;
  const area = scope === 'ephemeral' ? chrome.storage.session : chrome.storage.local;
  await area.set({ [key]: value });
}
