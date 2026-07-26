import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isScratchpadSidebarOpen,
  openScratchpadSidebar,
  registerScratchpadSidebar,
} from '../src/sidebar.js';

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

test('recognises an open Chrome side panel for this window', async () => {
  let received;
  const open = await isScratchpadSidebarOpen(73, {
    runtime: {
      getContexts: async (filter) => {
        received = filter;
        return [{ contextType: 'SIDE_PANEL' }];
      },
    },
    sidePanel: {},
  });

  assert.equal(open, true);
  assert.deepEqual(received, {
    contextTypes: ['SIDE_PANEL'],
    windowIds: [73],
  });
});

test('uses a live side-panel handshake before Chrome context enumeration', async () => {
  let listener;
  let removed;
  let contextLookups = 0;
  const runtime = {
    onMessage: {
      addListener: (nextListener) => { listener = nextListener; },
      removeListener: (nextListener) => { removed = nextListener; },
    },
    sendMessage: async (message) => {
      let response;
      listener(message, {}, (value) => { response = value; });
      return response;
    },
    getContexts: async () => {
      contextLookups += 1;
      return [];
    },
  };
  const stop = registerScratchpadSidebar(73, { runtime });

  assert.equal(await isScratchpadSidebarOpen(73, { runtime, sidePanel: {} }), true);
  assert.equal(contextLookups, 0);
  stop();
  assert.equal(removed, listener);
});

test('recognises Firefox’s unpinned and open sidebar states', async () => {
  const api = { sidebarAction: { isOpen: async ({ windowId }) => windowId === 73 } };

  assert.equal(await isScratchpadSidebarOpen(72, api, 'moz-extension://example/src/index.html'), false);
  assert.equal(await isScratchpadSidebarOpen(73, api, 'moz-extension://example/src/index.html'), true);
});
