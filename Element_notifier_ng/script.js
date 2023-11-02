
// Update the UI when the DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  displayUrls();
  displayKeyValues();
  displayTimeValue();
});


async function displayUrls(urlList = []) {
  try {
    // Check if urlList is not an array or is empty
    if (!Array.isArray(urlList) || urlList.length === 0) {
      // Attempt to get data from Chrome storage
      const data = await chrome.storage.local.get("watchingUrlsStorage");
      // Set urlList to the stored data or an empty array if not found
      urlList = data.watchingUrlsStorage || [];
    }

    // Get the 'urlsTable' element
    const urlsTable = document.getElementById('urlsTable');

    // Create the HTML content for the table
    const tableContent = `
      <div class="row">
        <div class="column column-75 column-center a-title"><span>URL</span></div>
        <!-- <div class="column column-25 column-center a-title">Actions</div>  -->
      </div>
      ${urlList.map((url) => `
        <div class="row">
          <div class="column column-75 overflow-h">${url}</div>
          <div class="column column-25 a-title">
            <button class="removeUrl" data-url="${url}">Remove</button>
          </div>
        </div>
      `).join('')}
    `;

    // Set the innerHTML of 'urlsTable' with the table content
    urlsTable.innerHTML = tableContent;

    // Attach event listeners to remove buttons
    const removeButtons = document.getElementsByClassName('removeUrl');
    for (const button of removeButtons) {
      button.addEventListener('click', (event) => {
        const urlToRemove = event.target.getAttribute('data-url');
        removeUrl(urlToRemove);
      });
    }
  } catch (error) {
    // Handle errors, e.g., log the error or display an error message
    console.error("An error occurred:", error);
  }
}


function toggleCurrentUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;

    try {
      // Send a message to the extension to process the current URL
      const response1 = await chrome.runtime.sendMessage({ url: currentUrl });
      // Send a message to the extension to reload the current tab
      const response2 = await chrome.runtime.sendMessage({ type: "reload", tabid: currentTab.id });
      // Update the URL list
      displayUrls(response1.currentValue);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });
}


// Function to remove a URL from specificURLs
function removeUrl(urlToRemove) {
  (async () => {
    try {
      const response = await chrome.runtime.sendMessage({ url: urlToRemove });
      displayUrls(response.currentValue);
    } catch (error) {
      console.error('Error while removing URL:', error);
    }
  })();
}

// Attach event listener to the "Add/Remove Current URL" button
document.getElementById('addCurrentUrl').addEventListener('click', toggleCurrentUrl);


// Function to display the KeyValuesToTrack in the popup table
async function displayKeyValues(attrList = []) {
  try {
    if (!Array.isArray(attrList) || attrList.length === 0) {
      const data = await chrome.storage.local.get("watchingAttributesStorage");
      attrList = data.watchingAttributesStorage || [];
    }

    const keyValuesTable = document.getElementById('keyValuesTable');

    keyValuesTable.innerHTML = `
      <div class="row">
        <div class="column column-40 a-title"><span>Key Type</span></div>
        <div class="column column-40 a-title"><span>Key Value</span></div>
      </div>
      ${attrList.map((item) => `
        <div class="row">
          <div class="column column-40">${item.attrKey}</div>
          <div class="column column-40 wordwrap">${item.attrValue}</div>
          <div class="column column-20">
            <button class="removeKeyValue" data-key="${item.attrKey}" data-value="${item.attrValue}">Remove</button>
          </div>
        </div>
      `).join('')}
    `;

    // Attach event listeners to remove buttons
    const removeButtons = document.getElementsByClassName('removeKeyValue');
    for (const button of removeButtons) {
      button.addEventListener('click', (event) => {
        const keyToRemove = event.target.getAttribute('data-key');
        const valueToRemove = event.target.getAttribute('data-value');
        removeKeyValue(keyToRemove, valueToRemove);
      });
    }
  } catch (error) {
    console.error('An error occurred: ', error);
  }
}

// Function to add a new KeyValue to KeyValuesToTrack
function addKeyValue() {
  const attrKeyInput = document.getElementById('Attr_name_input');
  const attrValueInput = document.getElementById('Attr_value_input');

  const attrKey = attrKeyInput.value.trim();
  const attrValue = attrValueInput.value.trim();

  if (attrKey === '' || attrValue === '') {
    console.error('Both key and value must be provided.'); // Error handling for empty inputs
    return;
  }

  (async () => {
    try {
      const response = await chrome.runtime.sendMessage({ attrKey, attrValue });
      displayKeyValues(response.currentValue);
    } catch (error) {
      console.error('Error sending the message:', error); // Error handling for the chrome.runtime.sendMessage
    }
  })();

  // Clear the input fields
  attrKeyInput.value = '';
  attrValueInput.value = '';
}

// Function to remove a KeyValue from KeyValuesToTrack
async function removeKeyValue(attrKey, attrValue) {
  try {
    const response = await chrome.runtime.sendMessage({ attrKey, attrValue });

    // Handle the response here
    displayKeyValues(response.currentValue);
  } catch (error) {
    console.error('Error sending the message:', error); // Error handling for the chrome.runtime.sendMessage
  }
}

// Attach event listener to the "Add Key Value" button
document.getElementById('addAttibute').addEventListener('click', addKeyValue);

async function displayTimeValue(timevalue = '') {
  if (timevalue === '') {
    const data = (await chrome.storage.local.get("timeValue")).timeValue || 60;
    document.getElementById('timerField').value = data;
  } else {
    document.getElementById('timerField').value = timevalue;
  }
}

async function setTimer() {
  const timerField = document.getElementById('timerField');
  let timevalue = parseInt(timerField.value) || 60;

  if (isNaN(timevalue) || timevalue < 60) {
    timevalue = 60;
  } else if (timevalue > 900) {
    timevalue = 900;
  }

  const response = await chrome.runtime.sendMessage({ timevalue: timevalue });
  displayTimeValue(response.currentValue);

  // Clear the input field
  timerField.value = timevalue;
}

document.getElementById('timerFieldBtn').addEventListener('click', setTimer);

async function getHelp() {
  const response = await chrome.runtime.sendMessage({ type: 'getHelp' });
}

document.getElementById('helpBtn').addEventListener('click', getHelp);
