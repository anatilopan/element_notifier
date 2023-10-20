// Load specificURLs from local storage
chrome.storage.local.get({ specificURLs: [] }, (result) => {
  specificURLs = result.specificURLs;
});
chrome.storage.local.get({ KeyValuesToTrack: [][] }, (result) => {
  KeyValuesToTrack = result.KeyValuesToTrack;
});
