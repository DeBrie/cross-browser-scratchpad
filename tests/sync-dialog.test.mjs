import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Cancel closes the sync dialog without submitting its required fields", async () => {
  const html = await readFile(new URL("../src/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(
    html,
    /<button id="sync-cancel" type="button">Cancel<\/button\s*>/,
  );
  assert.match(
    app,
    /elements\.cancel\.addEventListener\("click", \(\) => elements\.dialog\.close\(\)\);/,
  );
});
