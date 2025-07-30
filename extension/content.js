// Text Input Reflector - Working Version (with Debounce and Replace)
(function () {
    'use strict';

    console.log('TEXT REFLECTOR: Script loaded!');

    let lastText = '';
    let debounceTimer;
    let lastActiveElement = null;

    // Floating enhancer elements
    let enhancerIcon = null;
    let enhancerPopup = null;

    // Debounce
    function debounce(func, delay) {
        return function (...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function saveText(text, source, element) {
        if (text !== lastText) {
            lastText = text;
            lastActiveElement = element;
            console.log('TEXT REFLECTOR: Saving:', text.substring(0, 50));

            try {
                if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                    try {
    chrome?.storage?.local?.set({
        currentText: text,
        timestamp: Date.now(),
        source: source,
        url: location.href
    });
} catch (e) {
    console.warn('Storage error (likely context invalid):', e);
}

                } else {
                    console.warn('TEXT REFLECTOR: chrome.storage.local is unavailable in this context.');
                }
            } catch (e) {
                console.error('TEXT REFLECTOR: Storage error:', e);
            }

            showEnhancerIcon(element);
        }
    }

    function checkInputs() {
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
            } else if (activeElement.id === 'prompt-textarea') {
                if (activeElement.textContent.trim()) {
                    saveText(activeElement.textContent, 'ChatGPT', activeElement);
                    return;
                }
            } else if (activeElement.classList.contains('ProseMirror')) {
                if (activeElement.textContent.trim()) {
                    saveText(activeElement.textContent, 'ProseMirror', activeElement);
                    return;
                }
            }
        }

        let element = document.querySelector('#prompt-textarea');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ChatGPT', element);
            return;
        }

        element = document.querySelector('.ProseMirror');
        if (element && element.textContent && element.textContent.trim()) {
            saveText(element.textContent, 'ProseMirror', element);
            return;
        }

        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
            if (textarea.value && textarea.value.trim()) {
                saveText(textarea.value, 'textarea', textarea);
                return;
            }
        }

        const inputs = document.querySelectorAll('input[type="text"]');
        for (let input of inputs) {
            if (input.value && input.value.trim()) {
                saveText(input.value, 'input', input);
                return;
            }
        }

        const editables = document.querySelectorAll('[contenteditable="true"]');
        for (let editable of editables) {
            if (editable.textContent && editable.textContent.trim()) {
                saveText(editable.textContent, 'contenteditable', editable);
                return;
            }
        }

        if (lastText !== '') {
            saveText('', 'none', null);
            removeEnhancerUI();
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'replaceText') {
            if (request.targetUrl !== location.href) {
                console.warn('TEXT REFLECTOR: Received replaceText message for incorrect URL.');
                sendResponse({ success: false, message: 'URL mismatch.' });
                return true;
            }

            if (lastActiveElement) {
                if (document.body.contains(lastActiveElement)) {
                    if (lastActiveElement.tagName === 'TEXTAREA' || lastActiveElement.tagName === 'INPUT') {
                        lastActiveElement.value = request.newText;
                    } else if (
                        lastActiveElement.getAttribute('contenteditable') === 'true' ||
                        lastActiveElement.id === 'prompt-textarea' ||
                        lastActiveElement.classList.contains('ProseMirror')
                    ) {
                        lastActiveElement.textContent = request.newText;
                    }
                    lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
                    lastActiveElement.dispatchEvent(new Event('change', { bubbles: true }));
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
        return true;
    });

    setInterval(checkInputs, 1000);

    const debouncedCheckInputs = debounce(checkInputs, 100);
    document.addEventListener('input', debouncedCheckInputs);
    document.addEventListener('keyup', debouncedCheckInputs);
    document.addEventListener('focus', debouncedCheckInputs);

    setTimeout(() => {
        console.log('TEXT REFLECTOR: Starting checks...');
        checkInputs();
    }, 1000);

    // -------------------------------
    // FLOATING ICON + MINI POPUP UI
    // -------------------------------

    function showEnhancerIcon(targetElement) {
        removeEnhancerUI();

        enhancerIcon = document.createElement('div');
        enhancerIcon.innerHTML = '🧠';
        enhancerIcon.style.cssText = `
            position: absolute;
            right: 8px;
            bottom: 8px;
            width: 40px;
            height: 40px;
            border-radius: 20px;
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #1e5f99 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 4px 10px rgba(74,144,226,0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        `;

        const rect = targetElement.getBoundingClientRect();
        enhancerIcon.style.top = `${window.scrollY + rect.bottom - 44}px`;
        enhancerIcon.style.left = `${window.scrollX + rect.right - 44}px`;

        enhancerIcon.addEventListener('mouseenter', () => {
            enhancerIcon.style.transform = 'scale(1.1)';
            enhancerIcon.style.boxShadow = '0 12px 35px rgba(0,0,0,0.4), 0 6px 15px rgba(74,144,226,0.3)';
        });

        enhancerIcon.addEventListener('mouseleave', () => {
            enhancerIcon.style.transform = 'scale(1)';
            enhancerIcon.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3), 0 4px 10px rgba(74,144,226,0.2)';
        });

        enhancerIcon.addEventListener('click', () => {
            togglePopup(targetElement, lastText);
        });

        document.body.appendChild(enhancerIcon);
    }

    function togglePopup(targetElement, promptText) {
        if (enhancerPopup) {
            enhancerPopup.style.opacity = '0';
            enhancerPopup.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                enhancerPopup.remove();
                enhancerPopup = null;
            }, 200);
            return;
        }

        enhancerPopup = document.createElement('div');
        enhancerPopup.style.cssText = `
            position: absolute;
            width: 320px;
            padding: 0;
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 8px 30px rgba(0,0,0,0.2);
            z-index: 2147483647;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        enhancerPopup.innerHTML = `
            <div style="
                padding: 20px 20px 0 20px;
                text-align: center;
                background: linear-gradient(135deg, rgba(74,144,226,0.1) 0%, rgba(53,122,189,0.1) 100%);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                position: relative;
            ">
                <button id="closePopupBtn" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                "
                >×</button>
                <div style="
                    font-weight: 700;
                    font-size: 18px;
                    letter-spacing: 2px;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #4a90e2, #ffffff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-transform: uppercase;
                ">
                    COGNIX<br>PROMPTER
                </div>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 16px;">
                </div>
                <div id="characterDisplay" style="
    font-size: 12px;
    text-align: right;
    color: rgba(255,255,255,0.6);
    margin-bottom: 8px;
"></div>
                <div style="margin-bottom: 20px;">
                    <textarea 
                        id="promptTextarea"
                        placeholder="Your prompt..." 
                        style="
                            width: 100%;
                            height: 100px;
                            padding: 16px;
                            border: none;
                            border-radius: 10px;
                            background: rgba(255,255,255,0.05);
                            color: rgba(255,255,255,0.9);
                            font-size: 14px;
                            font-family: inherit;
                            resize: none;
                            outline: none;
                            border: 1px solid rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                            box-sizing: border-box;
                        "
                    >${promptText}</textarea>
                </div>
                <button id="enhancePromptBtn" style="
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #2a6ba8 100%);
                    color: white;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    font-family: inherit;
                    letter-spacing: 0.5px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(74,144,226,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                "
                >
                    <span style="font-size: 16px;">✨</span>
                    Enhance Prompt
                </button>
            </div>
        `;
        if(!enhancerIcon)return;
        const rect = enhancerIcon.getBoundingClientRect();
        enhancerPopup.style.top = `${window.scrollY + rect.top - 260}px`;
        enhancerPopup.style.left = `${window.scrollX + rect.left - 140}px`;

        document.body.appendChild(enhancerPopup);

        // Animate in
        setTimeout(() => {
            enhancerPopup.style.opacity = '1';
            enhancerPopup.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // Update character count dynamically using the same logic as popup.js
        const textarea = enhancerPopup.querySelector('#promptTextarea');
        textarea.addEventListener('focus', () => {
    textarea.style.background = 'rgba(255,255,255,0.08)';
    textarea.style.borderColor = 'rgba(74,144,226,0.4)';
});

textarea.addEventListener('blur', () => {
    textarea.style.background = 'rgba(255,255,255,0.05)';
    textarea.style.borderColor = 'rgba(255,255,255,0.08)';
});

        const characterDisplay = enhancerPopup.querySelector('#characterDisplay');
        const enhanceBtn = enhancerPopup.querySelector('#enhancePromptBtn');

if (enhanceBtn) {
    enhanceBtn.addEventListener('mouseenter', () => {
        enhanceBtn.style.transform = 'translateY(-1px)';
        enhanceBtn.style.boxShadow = '0 6px 20px rgba(74,144,226,0.3)';
    });

    enhanceBtn.addEventListener('mouseleave', () => {
        enhanceBtn.style.transform = 'translateY(0)';
        enhanceBtn.style.boxShadow = '0 4px 15px rgba(74,144,226,0.2)';
    });
}

        
        function updateCharacterCount(text) {
            const count = text.length;
            const limit = 4000;
            characterDisplay.textContent = `${count}/${limit} characters detected`;
            
            if (count > limit) {
                characterDisplay.style.color = 'rgba(255,107,107,0.9)';
                enhanceBtn.disabled = true;
                enhanceBtn.style.opacity = '0.5';
                enhanceBtn.style.cursor = 'not-allowed';
                enhanceBtn.innerHTML = '<span style="font-size: 16px;">❌</span> Text too long';
            } else {
                characterDisplay.style.color = 'rgba(255,255,255,0.6)';
                enhanceBtn.disabled = false;
                enhanceBtn.style.opacity = '1';
                enhanceBtn.style.cursor = 'pointer';
                enhanceBtn.innerHTML = '<span style="font-size: 16px;">✨</span> Enhance Prompt';
            }
        }
        
        // Initialize with current text
        updateCharacterCount(promptText);
        
        textarea.addEventListener('input', () => {
            promptText = textarea.value;
            updateCharacterCount(promptText);
        });

        enhancerPopup.querySelector('#enhancePromptBtn').addEventListener('click', () => {
            const currentText = textarea.value.trim();
            if (!currentText) {
                alert('❌ Please enter some text to enhance');
                return;
            }
            
            chrome.runtime.sendMessage({
                action: 'enhancePrompt',
                text: currentText,
                apiKey: '' // Can be loaded from storage if needed
            }, (response) => {
                if (response && response.success && response.enhancedPrompts) {
                    alert('✅ Enhanced:\n\n' + response.enhancedPrompts.join('\n\n'));
                } else {
                    alert('❌ Enhancement failed.');
                }
            });
        });

        enhancerPopup.querySelector('#closePopupBtn').addEventListener('click', () => {
            enhancerPopup.style.opacity = '0';
            enhancerPopup.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                enhancerPopup.remove();
                enhancerPopup = null;
            }, 200);
        });
    }

    function removeEnhancerUI() {
        if (enhancerIcon) enhancerIcon.remove();
        if (enhancerPopup) enhancerPopup.remove();
        enhancerIcon = null;
        enhancerPopup = null;
    }
})();