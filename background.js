// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Textarea Reflector extension installed');
  
  // Initialize storage
  chrome.storage.local.set({
    currentText: '',
    timestamp: null,
    url: '',
    elementType: ''
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // The popup will automatically open, no additional action needed
});