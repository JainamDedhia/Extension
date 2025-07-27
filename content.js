// Text Input Reflector - Working Version (with Debounce)
(function() {
    'use strict';
    
    console.log('TEXT REFLECTOR: Script loaded!');
    
    let lastText = '';
    let debounceTimer;

    // Debounce function to limit how often a function is called
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    function saveText(text, source) {
        if (text !== lastText) {
            lastText = text;
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
        // Check ChatGPT specific elements first
        let element = document.querySelector('#prompt-textarea');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ChatGPT');
            return;
        }
        
        // Check ProseMirror (another common editor, e.g., in ChatGPT)
        element = document.querySelector('.ProseMirror');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ProseMirror');
            return;
        }
        
        // Check any textarea
        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
            if (textarea.value && textarea.value.trim()) {
                saveText(textarea.value, 'textarea');
                return;
            }
        }
        
        // Check text inputs
        const inputs = document.querySelectorAll('input[type="text"]');
        for (let input of inputs) {
            if (input.value && input.value.trim()) {
                saveText(input.value, 'input');
                return;
            }
        }
        
        // Check contenteditable
        const editables = document.querySelectorAll('[contenteditable="true"]');
        for (let editable of editables) {
            if (editable.textContent && editable.textContent.trim()) {
                saveText(editable.textContent, 'contenteditable');
                return;
            }
        }
        
        // No text found, save empty if previously text was present
        if (lastText !== '') { // Only save empty if there was text before
             saveText('', 'none');
        }
    }
    
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