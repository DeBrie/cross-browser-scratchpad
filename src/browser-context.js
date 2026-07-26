import { normaliseHost } from "./note-store.js";

export async function getBrowserContext(browserApi, windowId) {
  const window = Number.isInteger(windowId)
    ? { id: windowId }
    : await browserApi.windows.getCurrent();
  const [tab] = await browserApi.tabs.query({
    active: true,
    windowId: window.id,
  });
  return {
    windowId: window.id,
    host: normaliseHost(tab?.url),
  };
}

export function watchBrowserContext(windowId, browserApi, onChange) {
  const refresh = async () =>
    onChange(await getBrowserContext(browserApi, windowId));
  const activated = (activeInfo) => {
    if (activeInfo.windowId === windowId) return refresh();
  };
  const updated = (_tabId, changeInfo, tab) => {
    if (
      tab.windowId === windowId &&
      tab.active &&
      (changeInfo.url || changeInfo.status === "loading")
    )
      return refresh();
  };

  browserApi.tabs.onActivated.addListener(activated);
  browserApi.tabs.onUpdated.addListener(updated);
  return () => {
    browserApi.tabs.onActivated.removeListener(activated);
    browserApi.tabs.onUpdated.removeListener(updated);
  };
}
