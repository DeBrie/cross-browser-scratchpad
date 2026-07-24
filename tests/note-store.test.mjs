import test from 'node:test';
import assert from 'node:assert/strict';

import { normaliseHost, noteKey, canPersist, uiScopeKey } from '../src/note-store.js';

test('uses a hostname for a site key and rejects browser URLs', () => {
  assert.equal(normaliseHost('https://docs.example.com/a'), 'docs.example.com');
  assert.equal(normaliseHost('chrome://settings'), null);
  assert.equal(normaliseHost('not a url'), null);
  assert.equal(noteKey('site', { host: 'docs.example.com' }), 'site:docs.example.com');
});

test('uses stable global and per-window ephemeral keys', () => {
  assert.equal(noteKey('global'), 'global');
  assert.equal(noteKey('ephemeral', { windowId: 42 }), 'ephemeral:42');
  assert.equal(noteKey('ephemeral'), null);
  assert.equal(noteKey('site'), null);
});

test('does not persist until a scope has been loaded', () => {
  assert.equal(canPersist({ isLoaded: false, scope: 'global', host: null }), false);
  assert.equal(canPersist({ isLoaded: true, scope: 'global', host: null }), true);
  assert.equal(canPersist({ isLoaded: true, scope: 'site', host: null }), false);
});

test('uses a window-scoped UI key when carrying a selected tab to the side panel', () => {
  assert.equal(uiScopeKey(42), 'ui-scope:42');
  assert.equal(uiScopeKey(null), null);
});
