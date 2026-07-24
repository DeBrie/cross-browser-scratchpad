chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.session.remove(`ephemeral:${windowId}`);
});
