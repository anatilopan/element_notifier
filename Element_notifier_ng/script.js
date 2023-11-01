
document.addEventListener("DOMContentLoaded", function(){
  displayUrls();
  displayKeyValues();
  displayTimeValue();
});

async function displayUrls(urlList = []) {
  if (urlList.length === 0) {
    const data = await chrome.storage.local.get("watchingUrlsStorage")
    urlList = data.watchingUrlsStorage
  }
  const urlsTable = document.getElementById('urlsTable');
  urlsTable.innerHTML = `
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

  // Attach event listeners to remove buttons
  const removeButtons = document.getElementsByClassName('removeUrl');
  for (const button of removeButtons) {
    button.addEventListener('click', (event) => {
      const urlToRemove = event.target.getAttribute('data-url');
      removeUrl(urlToRemove);
    });
  }
}



// Function to add or remove the current URL from specificURLs
function toggleCurrentUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    (async () => {
      const response = await chrome.runtime.sendMessage({ url: currentUrl });
      // do something with response here, not outside the function
      displayUrls(response.currentValue);
    })();
    (async () => {
      const response = await chrome.runtime.sendMessage({ type: "reload", tabid: currentTab.id });
      // do something with response here, not outside the function
      displayUrls(response.currentValue);
    })();
  });
}

// Function to remove a URL from specificURLs
function removeUrl(urlToRemove) {
  (async () => {
    const response = await chrome.runtime.sendMessage({ url: urlToRemove });
    // do something with response here, not outside the function
    displayUrls(response.currentValue);
  })();
}

// Attach event listener to the "Add/Remove Current URL" button
document.getElementById('addCurrentUrl').addEventListener('click', toggleCurrentUrl);


// Function to display the KeyValuesToTrack in the popup table
async function displayKeyValues(attrList = []) {
  if (attrList.length === 0) {
    const data = await chrome.storage.local.get("watchingAttributesStorage")
    attrList = data.watchingAttributesStorage
  }
  const keyValuesTable = document.getElementById('keyValuesTable');
  keyValuesTable.innerHTML = `
        <div class="row">
          <div class="column column-40 a-title"><span>Key Type</span></div>
          <div class="column column-40 a-title" ><span>Key Value</span></div>
          <!-- <div class="column column-20 a-title"><span>Action</span></div> -->
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
}

// Function to add a new KeyValue to KeyValuesToTrack
function addKeyValue() {
  const attrKey = document.getElementById('Attr_name_input').value.trim();
  const attrValue = document.getElementById('Attr_value_input').value.trim();
  if (attrKey !== '' && attrValue !== '') {
    (async () => {
      const response = await chrome.runtime.sendMessage({ attrKey: attrKey, attrValue: attrValue });
      // do something with response here, not outside the function
      displayKeyValues(response.currentValue);
    })();

    // Clear the input field
    document.getElementById('Attr_name_input').value = '';
    document.getElementById('Attr_value_input').value = '';
  }
}

// Function to remove a KeyValue from KeyValuesToTrack
function removeKeyValue(attrKey, attrValue) {
  (async () => {
    const response = await chrome.runtime.sendMessage({ attrKey: attrKey, attrValue: attrValue });
    // do something with response here, not outside the function
    displayKeyValues(response.currentValue);
  })();
}

// Attach event listener to the "Add Key Value" button
document.getElementById('addAttibute').addEventListener('click', addKeyValue);

async function displayTimeValue(timevalue = '') {
  if (timevalue === '') {
    const data = (await chrome.storage.local.get("timeValue")).timeValue || 60;
    timevalue = data
  }
  document.getElementById('timerField').value = timevalue;
}

// Function to set the timer
function setTimer() {
  const timevalue = parseInt(document.getElementById('timerField').value) || 60;
  if (timevalue !== '' && typeof(timevalue) == 'number') {
    if (timevalue < 60) {
      timevalue = 60;
    } else if (timevalue > 900) {
      timevalue = 900;
    }
    (async () => {
      const response = await chrome.runtime.sendMessage({ timevalue: timevalue});
      // do something with response here, not outside the function
      displayTimeValue(response.currentValue);
    })();

    // Clear the input field
    document.getElementById('timerField').value = timevalue;
  }
}

document.getElementById('timerFieldBtn').addEventListener('click', setTimer);

async function getHelp(){
  (async () => {
    const response = await chrome.runtime.sendMessage({ type: 'getHelp' });
    // do something with response here, not outside the function
  })();
}

document.getElementById('helpBtn').addEventListener('click', getHelp);
