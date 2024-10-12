// Simple function to retrieve tab id
function getTabId() {
  return chrome.tabs.getCurrent().id;
}
// Inject the script into the current tab
chrome.scripting
  .executeScript({
    target: { tabId: getTabId() },
    files: ["script.js"],
  })
  .then(() => console.log("Blocket Sniper injected"));
