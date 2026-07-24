import { createVault, decryptRecord, encryptRecord, exportVaultKey, importVaultKey, restoreVault } from './crypto.js';
import { reconcileNotes, shouldApplyRemote } from './sync-store.js';

export const SYNC_URL = 'https://scratchpad-sync.james-allen1994back.workers.dev';

async function request(path, options = {}, token) {
  const response = await fetch(`${SYNC_URL}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Sync failed');
  return body;
}

export async function signUp(email, password) {
  const vault = await createVault(email, password);
  const session = await request('/v1/signup', { method: 'POST', body: JSON.stringify(vault) });
  await chrome.storage.local.set({ syncAccount: { accountId: vault.accountId, salt: vault.salt, token: session.token } });
  return persistSession({ ...vault, token: session.token });
}

export async function signIn(email, password) {
  const accountId = (await createVault(email, password)).accountId;
  const account = await request('/v1/challenge', { method: 'POST', body: JSON.stringify({ accountId }) });
  const vault = await restoreVault(email, password, account.salt);
  const session = await request('/v1/login', { method: 'POST', body: JSON.stringify({ accountId: vault.accountId, authProof: vault.authProof }) });
  await chrome.storage.local.set({ syncAccount: { accountId: vault.accountId, salt: account.salt, token: session.token } });
  return persistSession({ ...vault, token: session.token });
}

export async function persistSession(vault) {
  await chrome.storage.session.set({ syncVault: { token: vault.token, vaultKey: await exportVaultKey(vault.vaultKey) } });
  return vault;
}

export async function restoreSession() {
  const { syncVault } = await chrome.storage.session.get('syncVault');
  if (!syncVault?.token || !syncVault?.vaultKey) return null;
  return { token: syncVault.token, vaultKey: await importVaultKey(syncVault.vaultKey) };
}

export async function syncNotes(vault, token) {
  const local = await chrome.storage.local.get(null);
  const remote = await request('/v1/notes', {}, token);
  const localLabel = navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Chrome';
  const remoteLabel = localLabel === 'Firefox' ? 'Chrome or another browser' : 'Firefox or another browser';
  let merged = false;
  for (const record of remote.notes) {
    const remoteValue = await decryptRecord(vault.vaultKey, record);
    const hasRevision = Number.isFinite(local[`updated:${record.key}`]);
    if (!hasRevision && typeof local[record.key] === 'string') {
      const reconciliation = reconcileNotes(local[record.key], remoteValue, localLabel, remoteLabel);
      local[record.key] = reconciliation.value;
      local[`updated:${record.key}`] = reconciliation.merged ? Date.now() : record.updatedAt;
      merged ||= reconciliation.merged;
    } else if (shouldApplyRemote({ updatedAt: local[`updated:${record.key}`] || 0 }, record)) {
      local[record.key] = remoteValue;
      local[`updated:${record.key}`] = record.updatedAt;
    }
  }
  await chrome.storage.local.set(local);
  const current = Object.entries(local).filter(([key, value]) => (key === 'global' || key.startsWith('site:')) && typeof value === 'string');
  for (const [key, value] of current) {
    const updatedAt = local[`updated:${key}`] || Date.now();
    await request(`/v1/notes/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(await encryptRecord(vault.vaultKey, key, value, updatedAt)) }, token);
  }
  return { merged };
}
