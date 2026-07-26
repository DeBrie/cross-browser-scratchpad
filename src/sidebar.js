export async function openScratchpadSidebar(windowId, browserApi) {
  if (browserApi["sidePanel"]?.open)
    return browserApi["sidePanel"].open({ windowId });
  if (browserApi.sidebarAction?.open) return browserApi.sidebarAction.open();
  throw new Error("Sidebar is unavailable in this browser");
}

export function registerScratchpadSidebar(windowId, browserApi) {
  if (!browserApi.runtime?.onMessage) return () => {};
  const listener = (message, _sender, sendResponse) => {
    if (
      message?.type !== "scratchpad-side-panel-probe" ||
      message.windowId !== windowId
    )
      return;
    sendResponse({ open: true, windowId });
    return true;
  };
  browserApi.runtime.onMessage.addListener(listener);
  return () => browserApi.runtime.onMessage.removeListener(listener);
}

export async function isScratchpadSidebarOpen(windowId, browserApi) {
  if (browserApi.sidePanel && browserApi.runtime?.sendMessage) {
    try {
      const response = await browserApi.runtime.sendMessage({
        type: "scratchpad-side-panel-probe",
        windowId,
      });
      if (response?.open && response.windowId === windowId) return true;
    } catch {
      // Fall through to Chrome's context enumeration when no panel replies.
    }
  }
  if (browserApi.sidePanel && browserApi.runtime?.getContexts) {
    try {
      const contexts = await browserApi.runtime.getContexts({
        contextTypes: ["SIDE_PANEL"],
        windowIds: [windowId],
      });
      return contexts.length > 0;
    } catch {
      return false;
    }
  }
  if (browserApi.sidebarAction?.isOpen)
    return browserApi.sidebarAction.isOpen({ windowId });
  return false;
}
