import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileNotes, shouldApplyRemote } from '../src/sync-store.js';

test('applies only newer remote records', () => {
  assert.equal(shouldApplyRemote({ updatedAt: 10 }, { updatedAt: 11 }), true);
  assert.equal(shouldApplyRemote({ updatedAt: 11 }, { updatedAt: 10 }), false);
});

test('never replaces non-empty content with an empty note during first sync', () => {
  assert.deepEqual(reconcileNotes('', 'kept remotely', 'Chrome', 'Firefox').value, 'kept remotely');
  assert.deepEqual(reconcileNotes('kept locally', '', 'Chrome', 'Firefox').value, 'kept locally');
});

test('preserves both divergent non-empty notes as Markdown sections', () => {
  const result = reconcileNotes('local idea', 'remote idea', 'Chrome', 'Firefox');
  assert.equal(result.merged, true);
  assert.match(result.value, /## From Chrome[\s\S]*local idea/);
  assert.match(result.value, /## From Firefox[\s\S]*remote idea/);
});
