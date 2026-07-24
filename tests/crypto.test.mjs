import test from 'node:test';
import assert from 'node:assert/strict';
import { createVault, decryptRecord, encryptRecord, exportVaultKey, importVaultKey, restoreVault } from '../src/crypto.js';

test('creates separate authentication and encryption material', async () => {
  const vault = await createVault('me@example.com', 'correct horse battery staple');
  const restored = await restoreVault('me@example.com', 'correct horse battery staple', vault.salt);
  assert.equal(vault.accountId, restored.accountId);
  assert.equal(vault.authProof, restored.authProof);
  assert.notEqual(vault.authProof, vault.vaultKey);
});

test('restores a session-only exported vault key after a popup closes', async () => {
  const vault = await createVault('me@example.com', 'correct horse battery staple');
  const restoredKey = await importVaultKey(await exportVaultKey(vault.vaultKey));
  const record = await encryptRecord(restoredKey, 'global', 'kept for this browser session');
  assert.equal(await decryptRecord(vault.vaultKey, record), 'kept for this browser session');
});

test('encrypts a note without retaining readable source and decrypts it locally', async () => {
  const vault = await createVault('me@example.com', 'correct horse battery staple');
  const record = await encryptRecord(vault.vaultKey, 'global', 'classified note', 100);
  assert.doesNotMatch(record.ciphertext, /classified note/);
  assert.equal(await decryptRecord(vault.vaultKey, record), 'classified note');
});
