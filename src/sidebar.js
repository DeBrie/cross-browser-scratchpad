export async function openScratchpadSidebar(windowId, browserApi) {
  if (browserApi.sidePanel?.open) return browserApi.sidePanel.open({ windowId });
  if (browserApi.sidebarAction?.open) return browserApi.sidebarAction.open();
  throw new Error('Sidebar is unavailable in this browser');
}
