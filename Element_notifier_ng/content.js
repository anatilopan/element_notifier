// Check if tabs have the page url in storage list

// If not:
// 1. Send a notification to the workstation that the page is monitored
// 2. Start a timer (60 seconds)
// 3. Refresh the page
// 4. Check if the page loaded fully
// 4.1 Check if page contain specific key and values from the popup

let currentURL = window.location.href;
let selectToFind = false;
let selectedElement;
let checked = false;
let secondsToWait = 60;
(async () => {
  secondsToWait = (await chrome.storage.local.get("timeValue")).timeValue || 60;
})
let delaytime = secondsToWait * 1000;



async function toggleSelectToFind() {
  selectedElement = undefined;
  selectToFind = !selectToFind;
  const response = await chrome.runtime.sendMessage({
    type: "selectbadge",
    selector: selectToFind,
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

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.action === "reload") {
//   window.location.reload();
//   }
// });

async function checkPage() {
  const response = await chrome.runtime.sendMessage({
    type: "trigger",
    validateTab: currentURL,
  });
  var elements = [];
  waitForPageToLoad(function () {
    const attrs = response.attrs;
    const elements = []; // Create an array to store the matching elements
    const foundElements = []; // Create an array to store the found elements
    let selector = "";
    for (const attr of attrs) {
      if (attr.attrKey === "selector") {
        selector = `${attr.attrValue}`;
      } else {
        selector = `[${attr.attrKey}='${attr.attrValue}']`;
      }

      const matchingElements = document.querySelectorAll(selector);
      if (matchingElements.length > 0) {
        (async () => {
          const datenow = Date.now()
          const msgtxt = `${matchingElements.length} elements were found on ${currentURL}`
          const response = await chrome.runtime.sendMessage({
            type: "notification",
            notid: datenow.toString(),
            msg: msgtxt,
            contexturl: currentURL,
          });
        })();
      }
    }
  });
  setTimeout(runningPage, delaytime);
}

// checkPage();
// Page is refreshed even if is not on the monitor list anymore...
async function runningPage() {
  const response = await chrome.runtime.sendMessage({
    type: "trigger",
    validateTab: currentURL,
  });
  // if page is validated adn not active
  if (response.validateTab && !response.tabstatus) {
    // refresh page
    window.location.reload();
  } else {
    setTimeout(runningPage, delaytime);
  }
}

function handleElementHover(event) {
  if (selectToFind) {
    if (selectedElement) {
      var generateQuerySelector = function (el) {
        if (el.tagName.toLowerCase() == "html") return "HTML";
        var str = el.tagName;
        str += el.id != "" ? "#" + el.id : "";
        if (el.className) {
          var classes = el.className.split(/\s/);
          for (var i = 0; i < classes.length; i++) {
            str += "." + classes[i];
          }
        }
        return generateQuerySelector(el.parentNode) + " > " + str;
      };
      var qStr = generateQuerySelector(selectedElement);
      selectedElement.style.border = "none";
      alert(qStr);
      selectedElement = null;
      toggleSelectToFind()
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
// setInterval(runningPage, 1 * 60 * 1000)
