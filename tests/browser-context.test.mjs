import assert from "node:assert/strict";
import test from "node:test";

import {
  getBrowserContext,
  watchBrowserContext,
} from "../src/browser-context.js";

test("uses the active tab in the side panel's own browser window", async () => {
  let received;
  const context = await getBrowserContext({
    windows: { getCurrent: async () => ({ id: 73 }) },
    tabs: {
      query: async (query) => {
        received = query;
        return [{ windowId: 73, url: "https://docs.example.com/guide" }];
      },
    },
  });

  assert.deepEqual(received, { active: true, windowId: 73 });
  assert.deepEqual(context, { windowId: 73, host: "docs.example.com" });
});

function browserEvent() {
  let listener;
  return {
    addListener(next) {
      listener = next;
    },
    removeListener(next) {
      if (listener === next) listener = undefined;
    },
    fire(...args) {
      return listener?.(...args);
    },
    hasListener() {
      return Boolean(listener);
    },
  };
}

test("tracks active-tab and navigation changes in the panel's window", async () => {
  const activated = browserEvent();
  const updated = browserEvent();
  const contexts = [];
  let activeUrl = "https://www.youtube.com/";
  const api = {
    tabs: {
      onActivated: activated,
      onUpdated: updated,
      query: async (query) => [
        { active: true, windowId: query.windowId, url: activeUrl },
      ],
    },
  };

  const stop = watchBrowserContext(73, api, (context) => {
    contexts.push(context);
  });

  await activated.fire({ windowId: 99, tabId: 1 });
  assert.deepEqual(contexts, []);

  await activated.fire({ windowId: 73, tabId: 2 });
  assert.deepEqual(contexts.at(-1), {
    windowId: 73,
    host: "www.youtube.com",
  });

  activeUrl = "https://docs.example.com/guide";
  await updated.fire(
    2,
    { url: activeUrl },
    { active: true, windowId: 73, url: activeUrl },
  );
  assert.deepEqual(contexts.at(-1), {
    windowId: 73,
    host: "docs.example.com",
  });

  stop();
  assert.equal(activated.hasListener(), false);
  assert.equal(updated.hasListener(), false);
});
