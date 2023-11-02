let currentURL = window.location.href;
let selectToFind = false;
let selectedElement = null;
// let selectedElement;
let checked = false;
let secondsToWait = 60;
(async () => {
  secondsToWait = (await chrome.storage.local.get("timeValue")).timeValue || 60;
})
let delaytime = secondsToWait * 1000;

async function toggleSelectToFind() {
  selectToFind = !selectToFind;
  const response = await sendMessage("selectbadge", selectToFind);
}

function sendMessage(type, selector) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, selector }, (response) => {
      resolve(response);
    });
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "select") {
    toggleSelectToFind();
    sendResponse({ selector: selectToFind });
  }
  return true;
});

function waitForPageToLoad(callback) {
  if (document.readyState === "complete") {
    // Page is already fully loaded, no need to wait.
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}

function getInput(callback) {
  //on click, fire callback, user has finished input
  var answer = confirm("Prompt for user here..."); // Provides OK/Cancel button w/ passed message
  if (answer === true) {
    // The user clicked OK.
    $(document).on("click", "*", function (e) {
      $(e.target).addClass("highlight");
      callback();
    });
  } // The user clicked cancel; else logic here, if needed
}

// Function to check if one element is a parent of another
function isParent(parent, child) {
  return parent.innerHTML.contains(child.innerHTML);
}

var parents = [];
var children = [];

async function checkPage() {
  const response = await chrome.runtime.sendMessage({
    type: "trigger",
    validateTab: currentURL,
  });

  if (response.attrs && Array.isArray(response.attrs)) {
    const attrs = response.attrs;
    const foundElements = [];

    for (const attr of attrs) {
      let selector;
      if (attr.attrKey === "selector") {
        selector = attr.attrValue;
      } else {
        selector = `[${attr.attrKey}='${attr.attrValue}']`;
      }

      const matchingElements = document.querySelectorAll(selector);
      const numElements = matchingElements.length;

      if (numElements > 0) {
        (async () => {
          const datenow = Date.now();
          const msgtxt = `${numElements} elements were found on ${currentURL}`;
          const response = await chrome.runtime.sendMessage({
            type: "notification",
            notid: datenow.toString(),
            msg: msgtxt,
            contexturl: currentURL,
          });
        })();
      }
    }
  }

  setTimeout(runningPage, delaytime);
}

async function runningPage() {
  const response = await chrome.runtime.sendMessage({
    type: "trigger",
    validateTab: currentURL,
  });

  if (response.validateTab && !response.tabstatus) {
    // Refresh the page using a Promise-based approach for reliability.
    await new Promise((resolve) => {
      window.location.reload();
      resolve();
    });
  } else {
    // Use a setTimeout with an arrow function for better readability.
    setTimeout(() => runningPage(), delaytime);
  }
}

function generateQuerySelector(el) {
  if (el.tagName.toLowerCase() === "html") return "HTML";
  let str = el.tagName;
  str += el.id ? `#${el.id}` : "";
  if (el.className) {
    const classes = el.className.split(/\s/);
    str += classes.map((cls) => `.${cls}`).join("");
  }
  return el.parentNode !== null ? generateQuerySelector(el.parentNode) + " > " + str : str;
}

function handleElementHover(event) {
  if (selectToFind) {
    if (selectedElement) {
      const qStr = generateQuerySelector(selectedElement);
      selectedElement.style.border = "none";
      alert(qStr);
      selectedElement = null;
      toggleSelectToFind();
    }

    const hoveredElement = event.target;
    hoveredElement.style.border = "2px solid red";

    hoveredElement.addEventListener("click", function () {
      selectedElement = hoveredElement;
      // selectToFind = false;
    });
  }
}

document.addEventListener("mouseover", handleElementHover);

document.addEventListener("mouseout", function (event) {
  // Code to remove the border
  const element = event.target;
  element.style.border = ""; // Remove the border when not hovering
});


checkPage();
