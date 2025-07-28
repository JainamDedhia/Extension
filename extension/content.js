// Text Input Reflector - Working Version (with Debounce and Replace)
(function() {
    'use strict';
    
    console.log('TEXT REFLECTOR: Script loaded!');
    
    let lastText = '';
    let debounceTimer;
    let lastActiveElement = null; // Store reference to the last active text input element

    // Debounce function to limit how often a function is called
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    function saveText(text, source, element) {
        if (text !== lastText) {
            lastText = text;
            lastActiveElement = element; // Store the element reference
            console.log('TEXT REFLECTOR: Saving:', text.substring(0, 50));
            
            try {
                chrome.storage.local.set({
                    currentText: text,
                    timestamp: Date.now(),
                    source: source,
                    url: location.href
                });
            } catch (e) {
                console.error('TEXT REFLECTOR: Storage error:', e);
            }
        }
    }
    
    function checkInputs() {
        // Prioritize focused element if it's a text input
        const activeElement = document.activeElement;
        if (activeElement) {
            if (activeElement.tagName === 'TEXTAREA') {
                if (activeElement.value.trim()) {
                    saveText(activeElement.value, 'textarea', activeElement);
                    return;
                }
            } else if (activeElement.tagName === 'INPUT' && activeElement.type === 'text') {
                if (activeElement.value.trim()) {
                    saveText(activeElement.value, 'input', activeElement);
                    return;
                }
            } else if (activeElement.getAttribute('contenteditable') === 'true') {
                if (activeElement.textContent.trim()) {
                    saveText(activeElement.textContent, 'contenteditable', activeElement);
                    return;
                }
            } else if (activeElement.id === 'prompt-textarea') { // ChatGPT specific
                if (activeElement.textContent.trim()) {
                    saveText(activeElement.textContent, 'ChatGPT', activeElement);
                    return;
                }
            } else if (activeElement.classList.contains('ProseMirror')) { // ProseMirror specific
                if (activeElement.textContent.trim()) {
                    saveText(activeElement.textContent, 'ProseMirror', activeElement);
                    return;
                }
            }
        }

        // If no active element or active element is empty, check others
        // Check ChatGPT specific elements first
        let element = document.querySelector('#prompt-textarea');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ChatGPT', element);
            return;
        }
        
        // Check ProseMirror (another common editor, e.g., in ChatGPT)
        element = document.querySelector('.ProseMirror');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ProseMirror', element);
            return;
        }
        
        // Check any textarea
        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
            if (textarea.value && textarea.value.trim()) {
                saveText(textarea.value, 'textarea', textarea);
                return;
            }
        }
        
        // Check text inputs
        const inputs = document.querySelectorAll('input[type="text"]');
        for (let input of inputs) {
            if (input.value && input.value.trim()) {
                saveText(input.value, 'input', input);
                return;
            }
        }
        
        // Check contenteditable
        const editables = document.querySelectorAll('[contenteditable="true"]');
        for (let editable of editables) {
            if (editable.textContent && editable.textContent.trim()) {
                saveText(editable.textContent, 'contenteditable', editable);
                return;
            }
        }
        
        // No text found, save empty if previously text was present
        if (lastText !== '') { // Only save empty if there was text before
             saveText('', 'none', null); // Clear lastActiveElement
        }
    }
    
    // Listen for messages from the popup script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'replaceText') {
            // Verify the URL to ensure the message is for this tab
            if (request.targetUrl !== location.href) {
                console.warn('TEXT REFLECTOR: Received replaceText message for incorrect URL.');
                sendResponse({ success: false, message: 'URL mismatch.' });
                return true; // Indicate that the response will be sent asynchronously
            }

            if (lastActiveElement) {
                // Check if the element is still in the DOM
                if (document.body.contains(lastActiveElement)) {
                    // Determine how to set the value based on element type
                    if (lastActiveElement.tagName === 'TEXTAREA' || lastActiveElement.tagName === 'INPUT') {
                        lastActiveElement.value = request.newText;
                    } else if (lastActiveElement.getAttribute('contenteditable') === 'true' || 
                               lastActiveElement.id === 'prompt-textarea' || 
                               lastActiveElement.classList.contains('ProseMirror')) {
                        lastActiveElement.textContent = request.newText;
                    }
                    // Trigger an input event to ensure other scripts on the page react to the change
                    lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
                    lastActiveElement.dispatchEvent(new Event('change', { bubbles: true })); // For some cases
                    console.log('TEXT REFLECTOR: Text replaced successfully.');
                    sendResponse({ success: true });
                } else {
                    console.warn('TEXT REFLECTOR: lastActiveElement not found in DOM.');
                    sendResponse({ success: false, message: 'Target element not found on page.' });
                }
            } else {
                console.warn('TEXT REFLECTOR: No active element to replace text in.');
                sendResponse({ success: false, message: 'No active text input detected.' });
            }
        }
        return true; // Important: Indicates that the response will be sent asynchronously
    });

    // Run every second consistently
    setInterval(checkInputs, 1000);
    
    // Run on events with a debounce to prevent excessive calls
    // The debounce will ensure checkInputs is called at most every 100ms
    const debouncedCheckInputs = debounce(checkInputs, 100);
    document.addEventListener('input', debouncedCheckInputs);
    document.addEventListener('keyup', debouncedCheckInputs);
    document.addEventListener('focus', debouncedCheckInputs);
    
    // Initial check after a slight delay
    setTimeout(() => {
        console.log('TEXT REFLECTOR: Starting checks...');
        checkInputs();
    }, 1000);
    
})();
