// Popup script
console.log('POPUP: Script loaded');

const statusEl = document.getElementById('status');
const contentEl = document.getElementById('content');
const infoEl = document.getElementById('info');

function updateDisplay() {
    chrome.storage.local.get(['currentText', 'timestamp', 'source', 'url'], (data) => {
        console.log('POPUP: Got data:', data);
        
        if (data.currentText) {
            statusEl.textContent = `Found ${data.currentText.length} characters from ${data.source || 'unknown'}`;
            contentEl.textContent = data.currentText;
            
            if (data.timestamp) {
                const time = new Date(data.timestamp).toLocaleTimeString();
                infoEl.textContent = `Last updated: ${time}`;
            }
        } else {
            statusEl.textContent = 'No text detected';
            contentEl.innerHTML = '<div class="empty">Type something on the webpage!</div>';
            infoEl.textContent = '';
        }
    });
}

// Update immediately
updateDisplay();

// Update every second
setInterval(updateDisplay, 1000);

// Listen for storage changes
chrome.storage.onChanged.addListener(() => {
    updateDisplay();
});