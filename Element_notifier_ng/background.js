// Clean context on install/update

chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});


// Do stuff on tabs

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    // skip urls like "chrome://" to avoid extension error
    if (tab.url?.startsWith("chrome://")) return undefined;
  
    if (tab.active && changeInfo.status === "complete") {
      var nothing = true;
    }
});