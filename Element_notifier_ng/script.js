// Function to display the specificURLs in the popup table
function displayUrls() {
    const urlsTable = document.getElementById('urlsTable');
    urlsTable.innerHTML = `
      <tr>
        <th>URL</th>
        <th>Action</th>
      </tr>
      ${specificURLs.map((url) => `
        <tr>
          <td>${url}</td>
          <td><button class="removeUrl" data-url="${url}">Remove</button></td>
        </tr>
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
      const index = specificURLs.indexOf(currentUrl);
      if (index === -1) {
        specificURLs.push(currentUrl);
      } else {
        specificURLs.splice(index, 1);
      }
  
      // Save the updated specificURLs to local storage (to persist across extension reloads)
      chrome.storage.local.set({ specificURLs });
  
      // Update the popup table with the latest URLs
      displayUrls();
  
      // Send a message to content.js to trigger checkForDiv function for the newly added URL
      chrome.tabs.sendMessage(currentTab.id, { action: 'triggerCheckForDiv' });
      
    });
  }
  
  // Function to remove a URL from specificURLs
  function removeUrl(urlToRemove) {
    const index = specificURLs.indexOf(urlToRemove);
    if (index !== -1) {
      specificURLs.splice(index, 1);
  
      // Save the updated specificURLs to local storage (to persist across extension reloads)
      chrome.storage.local.set({ specificURLs });
  
      // Update the popup table with the latest URLs
      displayUrls();
    }
  }
  
  // Load specificURLs from local storage and update the popup table on load
  chrome.storage.local.get({ specificURLs: [] }, (result) => {
    specificURLs = result.specificURLs;
    displayUrls();
  });
  
  
  
  // Attach event listener to the "Add/Remove Current URL" button
  document.getElementById('addCurrentUrl').addEventListener('click', toggleCurrentUrl);
  
  
  // Function to display the KeyValuesToTrack in the popup table
  function displayKeyValues() {
    const keyValuesTable = document.getElementById('keyValuesTable');
    keyValuesTable.innerHTML = `
      <tr>
        <th>Key Value</th>
        <th>Action</th>
      </tr>
      ${KeyValuesToTrack.map((keyValue) => `
        <tr>
          <td>${keyValue}</td>
          <td><button class="removeKeyValue" data-key="${keyValue}">Remove</button></td>
        </tr>
      `).join('')}
    `;
  
    // Attach event listeners to remove buttons
    const removeButtons = document.getElementsByClassName('removeKeyValue');
    for (const button of removeButtons) {
      button.addEventListener('click', (event) => {
        const keyValueToRemove = event.target.getAttribute('data-key');
        removeKeyValue(keyValueToRemove);
      });
    }
  }
  
  // Function to add a new KeyValue to KeyValuesToTrack
  function addKeyValue() {
    const newKeyValue = document.getElementById('newKeyValue').value.trim();
    if (newKeyValue !== '') {
      KeyValuesToTrack.push(newKeyValue);
  
      // Save the updated KeyValuesToTrack to local storage (to persist across extension reloads)
      chrome.storage.local.set({ KeyValuesToTrack });
  
      // Update the popup table with the latest KeyValues
      displayKeyValues();
  
      // Clear the input field
      document.getElementById('newKeyValue').value = '';
    }
  }
  
  // Function to remove a KeyValue from KeyValuesToTrack
  function removeKeyValue(keyValueToRemove) {
    const index = KeyValuesToTrack.indexOf(keyValueToRemove);
    if (index !== -1) {
      KeyValuesToTrack.splice(index, 1);
  
      // Save the updated KeyValuesToTrack to local storage (to persist across extension reloads)
      chrome.storage.local.set({ KeyValuesToTrack });
  
      // Update the popup table with the latest KeyValues
      displayKeyValues();
    }
  }
  
  // Load KeyValuesToTrack from local storage and update the popup table on load
  chrome.storage.local.get({ KeyValuesToTrack: [] }, (result) => {
    KeyValuesToTrack = result.KeyValuesToTrack;
    displayKeyValues();
  });
  
  // Attach event listener to the "Add Key Value" button
  document.getElementById('addKeyValue').addEventListener('click', addKeyValue);
  