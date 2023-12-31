// Get current Tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

// Initialize
var watchingUrlsStorage = [];
var watchingAttributesStorage = [];
var workingTabs = [];
var timeValue = 60;

async function initialize() {
  const defaultValues = await chrome.storage.local.get({
    watchingUrlsStorage: [],
    watchingAttributesStorage: [],
    timeValue: 60,
  });

  watchingUrlsStorage = defaultValues.watchingUrlsStorage;
  watchingAttributesStorage = defaultValues.watchingAttributesStorage;
  timeValue = defaultValues.timeValue;
}

initialize();


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


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.url) {
    handleUrlRequest(request, sendResponse);
  } else if (request.attrKey) {
    handleAttributeRequest(request, sendResponse);
  } else if (request.action === "getSelectedElement") {
    sendResponse(globalSelectedElement);
  } else if (request.type === "trigger") {
    handleTriggerRequest(request, sendResponse, sender);
  } else if (request.timevalue) {
    handleTimeValueRequest(request, sendResponse);
  } else if (request.type === "notification") {
    handleNotificationRequest(request, sender);
  } else if (request.type === "reload") {
    handleReloadRequest(request);
  } else if (request.type === "getHelp") {
    openHelpPage();
  } else if (request.type === "selectbadge") {
    createBadge(request.selector);
  }
});

// Define separate functions to handle different types of requests

function handleUrlRequest(request, sendResponse) {
  const index = watchingUrlsStorage.indexOf(request.url);
  if (index === -1) {
    watchingUrlsStorage.push(request.url);
    chrome.storage.local.set({ watchingUrlsStorage });
    sendResponse({
      status: "Done",
      message: "[+]",
      currentValue: watchingUrlsStorage,
    });
  } else {
    watchingUrlsStorage.splice(index, 1);
    chrome.storage.local.set({ watchingUrlsStorage });
    sendResponse({
      status: "Done",
      message: "[-]",
      currentValue: watchingUrlsStorage,
    });
  }
}

function handleAttributeRequest(request, sendResponse) {
  const attrKey = request.attrKey;
  const attrValue = request.attrValue;
  const index = watchingAttributesStorage.findIndex((object) => {
    return object.attrKey === attrKey && object.attrValue === attrValue;
  });
  if (index === -1) {
    const newObj = { attrKey, attrValue };
    watchingAttributesStorage.push(newObj);
  } else {
    watchingAttributesStorage.splice(index, 1);
  }
  chrome.storage.local.set({ watchingAttributesStorage });
  sendResponse({
    status: "Done",
    message: index === -1 ? "[+]" : "[-]",
    currentValue: watchingAttributesStorage,
  });
}

function handleTriggerRequest(request, sendResponse, sender) {
  const tabstatus = sender.tab.active;
  if (watchingUrlsStorage.includes(request.validateTab)) {
    sendResponse({
      status: "Done",
      validateTab: true,
      attrs: watchingAttributesStorage,
      tabstatus,
    });
  } else {
    sendResponse({ status: "Done", validateTab: false });
  }
}

function handleTimeValueRequest(request, sendResponse) {
  let temptime = request.timevalue;
  temptime = Math.min(Math.max(temptime, 60), 900); // Clamp between 60 and 900
  timeValue = typeof temptime === "number" ? temptime : 60;
  chrome.storage.local.set({ timeValue });
  sendResponse({
    status: "Done",
    currentValue: timeValue,
  });
}

function handleNotificationRequest(request, sender) {
  const msgtxt = request.msg;
  const notid = `${request.notid}_${sender.tab.id}_${sender.tab.windowId}`;
  const opts = {
    type: "basic",
    iconUrl: "icon.png",
    title: "Element found!",
    message: msgtxt,
    contextMessage: request.contexturl,
    priority: 2,
  };
  chrome.notifications.create(notid, opts);
}

function handleReloadRequest(request) {
  chrome.tabs.reload(request.tabid);
}

function openHelpPage() {
  chrome.tabs.create({
    url: "help.html"
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isChromeInternalUrl(tab.url)) {
    return;
  }

  if (changeInfo.url && isWatchedUrl(changeInfo.url)) {
    // URL has changed to a watched URL
    handleWatchedUrlChange(tabId, changeInfo.url);
  }
});

function isChromeInternalUrl(url) {
  return url && url.startsWith("chrome://");
}

function isWatchedUrl(url) {
  return watchingUrlsStorage.includes(url);
}

function handleWatchedUrlChange(tabId, changedUrl) {
  // Perform actions when a watched URL changes in a tab
  // You can implement specific logic here
}


function createBadge(status = "", customText = "SEL", customColor = "#6c0909") {
  const badgeText = status ? customText : "";
  const badgeColor = status ? customColor : [0, 0, 0, 0];

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// This callback WILL NOT be called for "_execute_action"
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (tab.url?.startsWith("chrome://")) {
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: "select" });
});

chrome.notifications.onClicked.addListener((notifId) => {
  const [_, tabId, windowId] = notifId.split("_").map(Number);

  chrome.tabs.get(tabId, (tab) => {
    chrome.tabs.highlight({ tabs: tab.index, windowId }, () => { });
  });
});