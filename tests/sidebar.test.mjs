import assert from 'node:assert/strict';
import test from 'node:test';
import { isScratchpadSidebarOpen, openScratchpadSidebar } from '../src/sidebar.js';

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

test('recognises an open Chrome side panel for this window and document', async () => {
  let received;
  const open = await isScratchpadSidebarOpen(73, {
    runtime: {
      getContexts: async (filter) => {
        received = filter;
        return [{ contextType: 'SIDE_PANEL' }];
      },
    },
    sidePanel: {},
  }, 'chrome-extension://example/src/index.html');

  assert.equal(open, true);
  assert.deepEqual(received, {
    contextTypes: ['SIDE_PANEL'],
    documentUrls: ['chrome-extension://example/src/index.html'],
    windowIds: [73],
  });
});

test('recognises Firefox’s unpinned and open sidebar states', async () => {
  const api = { sidebarAction: { isOpen: async ({ windowId }) => windowId === 73 } };

  assert.equal(await isScratchpadSidebarOpen(72, api, 'moz-extension://example/src/index.html'), false);
  assert.equal(await isScratchpadSidebarOpen(73, api, 'moz-extension://example/src/index.html'), true);
});
