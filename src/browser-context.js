import { normaliseHost } from "./note-store.js";

export async function getBrowserContext(browserApi) {
  const window = await browserApi.windows.getCurrent();
  const [tab] = await browserApi.tabs.query({
    active: true,
    windowId: window.id,
  });
  return {
    windowId: window.id,
    host: normaliseHost(tab?.url),
  };
}
