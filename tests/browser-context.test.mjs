import assert from "node:assert/strict";
import test from "node:test";

import { getBrowserContext } from "../src/browser-context.js";

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
