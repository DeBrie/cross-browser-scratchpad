import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { scratchpadSurface } from "../src/surface.js";

test("distinguishes popup and docked Scratchpad surfaces", () => {
  assert.equal(
    scratchpadSurface("chrome-extension://id/src/index.html?surface=popup"),
    "popup",
  );
  assert.equal(
    scratchpadSurface("chrome-extension://id/src/index.html?surface=side-panel"),
    "side-panel",
  );
  assert.equal(
    scratchpadSurface("moz-extension://id/src/index.html?surface=sidebar"),
    "sidebar",
  );
});

test("browser manifests identify popup and docked entry points", async () => {
  const [chromeManifest, firefoxManifest] = await Promise.all([
    readFile(new URL("../manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../firefox/manifest.json", import.meta.url), "utf8"),
  ]);
  const chrome = JSON.parse(chromeManifest);
  const firefox = JSON.parse(firefoxManifest);

  assert.equal(chrome.action.default_popup, "src/index.html?surface=popup");
  assert.equal(
    chrome.side_panel.default_path,
    "src/index.html?surface=side-panel",
  );
  assert.equal(firefox.action.default_popup, "src/index.html?surface=popup");
  assert.equal(
    firefox.sidebar_action.default_panel,
    "src/index.html?surface=sidebar",
  );
});
