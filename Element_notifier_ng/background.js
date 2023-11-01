// Get current Tab
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// Initialize
var watchingUrlsStorage = [];
var watchingAttributesStorage = [];
var workingTabs = [];
var timeValue = 60;

async function initialize() {
  watchingUrlsStorage =
    (await chrome.storage.local.get("watchingUrlsStorage"))
      .watchingUrlsStorage || [];
  watchingAttributesStorage =
    (await chrome.storage.local.get("watchingAttributesStorage"))
      .watchingAttributesStorage || [];
  timeValue = (await chrome.storage.local.get("timeValue")).timeValue || 60;
}
initialize();
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.url) {
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
  } else if (request.attrKey) {
    let attrKey = request.attrKey;
    let attrValue = request.attrValue;

    const index = watchingAttributesStorage.findIndex((object) => {
      return object.attrKey === attrKey && object.attrValue === attrValue;
    });
    if (index === -1) {
      // Create a new object
      let newObj = { attrKey: attrKey, attrValue: attrValue };
      watchingAttributesStorage.push(newObj);
    } else {
      // Remove the object if it already exists
      watchingAttributesStorage.splice(index, 1);
    }
    chrome.storage.local.set({ watchingAttributesStorage });
    sendResponse({
      status: "Done",
      message: index === -1 ? "[+]" : "[-]",
      currentValue: watchingAttributesStorage,
    });
  } else if (request.action === "getSelectedElement") {
    sendResponse(globalSelectedElement);
  } else if (request.type === "trigger") {
    let tabstatus = sender.tab.active;
    if (watchingUrlsStorage.includes(request.validateTab)) {
      sendResponse({
        status: "Done",
        validateTab: true,
        attrs: watchingAttributesStorage,
        tabstatus: tabstatus,
      });
    } else {
      sendResponse({ status: "Done", validateTab: false });
    }
  } else if (request.timevalue) {
    let temptime = request.timevalue;
    if (temptime < 60) {
      temptime = 60;
    } else if (temptime > 900) {
      temptime = 900;
    }

    if (typeof temptime === "number") {
      timeValue = temptime;
      chrome.storage.local.set({ timeValue });
      sendResponse({
        status: "Done",
        currentValue: timeValue,
      });
    } else {
      timeValue = 60;
      chrome.storage.local.set({ timeValue });
      sendResponse({
        status: "Done",
        currentValue: timeValue,
      });
    }
  } else if (request.type === "notification") {
    let msgtxt = request.msg;
    let notid = `${request.notid}_${sender.tab.id}_${sender.tab.windowId}`;
    let opts = {
      type: "basic",
      iconUrl: "icon.png",
      title: "Element found!",
      message: msgtxt,
      contextMessage: request.contexturl,
      priority: 2,
    };
    chrome.notifications.create(notid, opts);
  } else if (request.type === "reload") {
    chrome.tabs.reload(request.tabid);
  } else if (request.type === "getHelp") {
    chrome.tabs.create({
      url: "help.html"
    });
  } else if (request.type === "selectbadge") {
    createBadge(request.selector);
  }
});

// Do stuff on tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // skip urls like "chrome://" to avoid extension error
  if (tab.url?.startsWith("chrome://")) {
    return undefined;
  } else if (changeInfo.url && watchingUrlsStorage.includes(changeInfo.url)) {
    // URL has changed to a watched URL
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: contentScriptFunc,
    args: ["action"],
  });
});

function contentScriptFunc(name) {
  alert(`"${name}" executed`);
}
function createBadge(status = "") {
  if (status) {
    chrome.action.setBadgeText({ text: "SEL" });
    chrome.action.setBadgeBackgroundColor({ color: "#6c0909" });
  } else {
    chrome.action.setBadgeText({});
  }
}

// This callback WILL NOT be called for "_execute_action"
chrome.commands.onCommand.addListener((command, tab) => {
  if (tab.url?.startsWith("chrome://")) {
    return undefined;
  }
  (async () => {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "select" });
    // createBadge(response.selector);
  })();
});

chrome.notifications.onClicked.addListener(function (notifId) {
  notifdata = notifId.split("_");
  tabId = parseInt(notifdata[1]);
  windowId = parseInt(notifdata[2]);
  chrome.tabs.get(tabId, function (tab) {
    chrome.tabs.highlight({ tabs: tab.index, windowId }, function () {});
  });
});
