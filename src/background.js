chrome.runtime.onInstalled.addListener(() => {
  chrome["sidePanel"]?.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.session.remove(`ephemeral:${windowId}`);
});
