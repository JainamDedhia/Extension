// Popup script
console.log('POPUP: Script loaded');

const statusEl = document.getElementById('status');
const contentEl = document.getElementById('content');
const infoEl = document.getElementById('info');
const replaceTextInput = document.getElementById('replaceTextInput');
const replaceButton = document.getElementById('replaceButton');
const messageBox = document.getElementById('messageBox');

let currentDetectedUrl = ''; // Store the URL of the tab where text was detected

function showMessageBox(message, duration = 2000) {
    messageBox.textContent = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

function updateDisplay() {
    chrome.storage.local.get(['currentText', 'timestamp', 'source', 'url'], (data) => {
        console.log('POPUP: Got data:', data);
        
        if (data.currentText) {
            statusEl.textContent = `Found ${data.currentText.length} characters from ${data.source || 'unknown'}`;
            contentEl.textContent = data.currentText;
            currentDetectedUrl = data.url; // Update the URL
            
            if (data.timestamp) {
                const time = new Date(data.timestamp).toLocaleTimeString();
                infoEl.textContent = `Last updated: ${time}`;
            }
        } else {
            statusEl.textContent = 'No text detected';
            contentEl.innerHTML = '<div class="empty">Type something on the webpage!</div>';
            infoEl.textContent = '';
            currentDetectedUrl = ''; // Clear URL if no text
        }
    });
}

// Handle replace button click
replaceButton.addEventListener('click', () => {
    const newText = replaceTextInput.value;
    if (!newText.trim()) {
        showMessageBox('Please enter text to replace with.');
        return;
    }

    if (!currentDetectedUrl) {
        showMessageBox('No active text input detected on a page to replace.');
        return;
    }

    // Query for the active tab that matches the URL where text was detected
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url === currentDetectedUrl) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                action: 'replaceText',
                newText: newText,
                targetUrl: currentDetectedUrl // Send the URL for verification in content script
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('POPUP: Message sending error:', chrome.runtime.lastError);
                    showMessageBox('Error sending message to content script.');
                    return;
                }
                if (response && response.success) {
                    showMessageBox('Text replaced successfully!');
                    replaceTextInput.value = ''; // Clear the input field
                } else {
                    showMessageBox(response && response.message ? response.message : 'Failed to replace text. Element not found or active.');
                }
            });
        } else {
            showMessageBox('The detected text is from a different tab or not the active one. Please switch to the correct tab.');
        }
    });
});

// Update immediately
updateDisplay();

// Update every second
setInterval(updateDisplay, 1000);

// Listen for storage changes
chrome.storage.onChanged.addListener(() => {
    updateDisplay();
});
