import assert from 'node:assert/strict';
import test from 'node:test';
import { openScratchpadSidebar } from '../src/sidebar.js';

test('opens Chrome side panel for the active browser window', async () => {
  let received;
  await openScratchpadSidebar(73, { sidePanel: { open: async (options) => { received = options; } } });
  assert.deepEqual(received, { windowId: 73 });
});

test('opens Firefox sidebar when the Chrome side-panel API is unavailable', async () => {
  let opened = false;
  await openScratchpadSidebar(73, { sidebarAction: { open: async () => { opened = true; } } });
  assert.equal(opened, true);
});
