import test from 'node:test';
import assert from 'node:assert/strict';

import { createNote, deleteNote, migrateLegacyNotes, normaliseHost, noteKey, canPersist, notesForScope, uiScopeKey } from '../src/note-store.js';

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

test('migrates an existing site note into a titled library record', () => {
  const notes = migrateLegacyNotes({ 'site:docs.example.com': '# Useful docs' }, 'site', { host: 'docs.example.com' }, 500);
  assert.equal(notes.length, 1);
  assert.deepEqual(notes[0], {
    id: 'legacy-site-docs-example-com', title: 'Useful docs', body: '# Useful docs', scope: 'site', host: 'docs.example.com', createdAt: 500, updatedAt: 500,
  });
});

test('creates a persistent note with a safe default title', () => {
  const note = createNote({ scope: 'global', now: 700, id: 'note-1' });
  assert.deepEqual(note, { id: 'note-1', title: 'Untitled note', body: '', scope: 'global', host: null, createdAt: 700, updatedAt: 700 });
});

test('deletes a note with a syncable tombstone and removes it from its space', () => {
  const note = createNote({ scope: 'global', now: 700, id: 'note-1' });
  const deleted = deleteNote([note], 'note-1', 900);
  assert.deepEqual(deleted[0], { ...note, deletedAt: 900, updatedAt: 900 });
  assert.deepEqual(notesForScope(deleted, 'global'), []);
});
