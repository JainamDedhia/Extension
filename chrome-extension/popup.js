// Popup script for Cognix Prompter
console.log('POPUP: Cognix Prompter loaded');

const statusEl = document.getElementById('status');
const originalTextSection = document.getElementById('originalTextSection');
const originalTextEl = document.getElementById('originalText');
const characterCountEl = document.getElementById('characterCount');
const enhanceButton = document.getElementById('enhanceButton');
const enhancedSection = document.getElementById('enhancedSection');
const enhancedPromptsEl = document.getElementById('enhancedPrompts');
const infoEl = document.getElementById('info');
const messageBox = document.getElementById('messageBox');
const apiKeyInput = document.getElementById('apiKeyInput');

let currentDetectedUrl = '';
let currentText = '';
let enhancedPrompts = [];

// Load saved API key
chrome.storage.local.get(['groqApiKey'], (data) => {
    if (data.groqApiKey) {
        apiKeyInput.value = data.groqApiKey;
    }
});

// Save API key when changed
apiKeyInput.addEventListener('input', () => {
    chrome.storage.local.set({
        groqApiKey: apiKeyInput.value,
        enhancedPrompts: [] // clear old prompts
    });
});

function showMessageBox(message, duration = 3000) {
    messageBox.textContent = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

function updateCharacterCount(text) {
    const count = text.length;
    const limit = 4000;
    characterCountEl.textContent = `${count}/${limit} characters`;
    
    if (count > limit) {
        characterCountEl.classList.add('over-limit');
        enhanceButton.disabled = true;
        enhanceButton.textContent = 'Text too long';
    } else {
        characterCountEl.classList.remove('over-limit');
        enhanceButton.disabled = false;
        enhanceButton.textContent = 'Enhance Prompt';
    }
}

function updateDisplay() {
    chrome.storage.local.get(['currentText', 'timestamp', 'source', 'url', 'enhancedPrompts', 'isProcessing'], (data) => {
        console.log('POPUP: Got data:', data);
        
        if (data.currentText && data.currentText.trim()) {
            currentText = data.currentText;
            currentDetectedUrl = data.url;
            
            statusEl.textContent = `Characters Detected`;
            originalTextEl.textContent = data.currentText;
            updateCharacterCount(data.currentText);
            originalTextSection.style.display = 'block';
            
            if (data.timestamp) {
                const time = new Date(data.timestamp).toLocaleTimeString();
                infoEl.textContent = `Last updated: ${time}`;
            }
            
            // Show enhanced prompts if available
            if (data.enhancedPrompts && data.enhancedPrompts.length > 0) {
                enhancedPrompts = data.enhancedPrompts;
                displayEnhancedPrompts(data.enhancedPrompts);
            } else {
                enhancedSection.style.display = 'none';
            }
            
            // Update button state based on processing
            if (data.isProcessing) {
                enhanceButton.disabled = true;
                enhanceButton.textContent = 'Enhancing...';
            }
            
        } else {
            statusEl.textContent = 'Waiting for text input...';
            originalTextSection.style.display = 'none';
            enhancedSection.style.display = 'none';
            infoEl.textContent = 'Type something on any webpage to get started!';
            currentDetectedUrl = '';
            currentText = '';
        }
    });
}

function displayEnhancedPrompts(prompts) {
    enhancedPromptsEl.innerHTML = '';
    
    const labels = ['Add Context', 'Improve Structure/Clarity', 'Add Details'];
    
    prompts.forEach((prompt, index) => {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'prompt-option';
        promptDiv.innerHTML = `
            <div class="label">${labels[index] || 'Enhanced'}</div>
            <div class="text">${prompt}</div>
        `;
        
        promptDiv.addEventListener('click', () => {
            replaceTextWithPrompt(prompt);
        });
        
        enhancedPromptsEl.appendChild(promptDiv);
    });
    
    enhancedSection.style.display = 'block';
}

function replaceTextWithPrompt(newText) {
    if (!currentDetectedUrl) {
        showMessageBox('No active text input detected');
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith('http')) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                action: 'replaceText',
                newText: newText,
                targetUrl: currentDetectedUrl
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('POPUP: Message sending error:', chrome.runtime.lastError);
                    showMessageBox('Error communicating with page');
                    return;
                }
                if (response && response.success) {
                    showMessageBox('Prompt replaced successfully!');
                    // Clear enhanced prompts after successful replacement
                    chrome.storage.local.set({ enhancedPrompts: [] });
                    enhancedSection.style.display = 'none';
                } else {
                    showMessageBox(`${response?.message || 'Failed to replace text'}`);
                }
            });
        } else {
            showMessageBox('Please switch to the correct tab');
        }
    });
}

// Handle enhance button click
enhanceButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showMessageBox('Please enter your Groq API key');
        apiKeyInput.focus();
        return;
    }
    
    if (!currentText.trim()) {
        showMessageBox('No text to enhance');
        return;
    }
    
    if (currentText.length > 4000) {
        showMessageBox('Text is too long (max 4000 characters)');
        return;
    }
    
    // Update UI to show processing
    enhanceButton.disabled = true;
    enhanceButton.textContent = 'Enhancing...';
    chrome.storage.local.set({ isProcessing: true });
    
    try {
        // Send message to background script to enhance prompt
        chrome.runtime.sendMessage({
            action: 'enhancePrompt',
            text: currentText,
            apiKey: apiKey
        }, (response) => {
            // Reset button state
            enhanceButton.disabled = false;
            enhanceButton.textContent = 'Enhance Prompt';
            chrome.storage.local.set({ isProcessing: false });
            
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                showMessageBox('Extension error occurred');
                return;
            }
            
            if (response && response.success) {
                enhancedPrompts = response.enhancedPrompts;
                chrome.storage.local.set({ enhancedPrompts: enhancedPrompts });
                displayEnhancedPrompts(enhancedPrompts);
                showMessageBox('Prompts enhanced successfully!');
            } else {
                const errorMsg = response?.error || 'Unknown error occurred';
                showMessageBox(`${errorMsg}`);
                console.error('Enhancement error:', errorMsg);
            }
        });
    } catch (error) {
        enhanceButton.disabled = false;
        enhanceButton.textContent = 'Enhance Prompt';
        chrome.storage.local.set({ isProcessing: false });
        showMessageBox('Error occurred while enhancing');
        console.error('Error:', error);
    }
});

// Update display immediately and periodically
updateDisplay();
setInterval(updateDisplay, 1000);

// Listen for storage changes
chrome.storage.onChanged.addListener(() => {
    updateDisplay();
});