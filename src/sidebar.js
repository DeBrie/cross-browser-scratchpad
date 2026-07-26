export async function openScratchpadSidebar(windowId, browserApi) {
  if (browserApi["sidePanel"]?.open)
    return browserApi["sidePanel"].open({ windowId });
  if (browserApi.sidebarAction?.open) return browserApi.sidebarAction.open();
  throw new Error("Sidebar is unavailable in this browser");
}

export async function isScratchpadSidebarOpen(windowId, browserApi, documentUrl) {
  if (browserApi.sidePanel && browserApi.runtime?.getContexts) {
    try {
      const contexts = await browserApi.runtime.getContexts({
        contextTypes: ["SIDE_PANEL"],
        documentUrls: [documentUrl],
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
