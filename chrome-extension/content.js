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
       const iconImg = document.createElement('img');
        iconImg.src = chrome.runtime.getURL("images/cognix.svg");
        iconImg.alt = "Enhancer Icon";
            
        // Style the icon image to fit perfectly in a circle
        iconImg.style.width = "100%";
        iconImg.style.height = "100%";
        iconImg.style.objectFit = "contain"; // use "cover" if you want full coverage
        iconImg.style.padding = "4px";
        iconImg.style.borderRadius = "50%";
        iconImg.style.display = "block";
        iconImg.style.backgroundColor = "#fff"; // optional for contrast
            
        // Style the enhancerIcon container itself (circular)
        enhancerIcon.style.width = "32px";
        enhancerIcon.style.height = "32px";
        enhancerIcon.style.borderRadius = "50%";
        enhancerIcon.style.overflow = "hidden";
        enhancerIcon.style.display = "flex";
        enhancerIcon.style.alignItems = "center";
        enhancerIcon.style.justifyContent = "center";
        enhancerIcon.style.boxShadow = "0 0 4px rgba(0,0,0,0.4)"; // optional shadow
            
        // Clear and add the styled icon
        enhancerIcon.innerHTML = '';
        enhancerIcon.appendChild(iconImg);

        enhancerIcon.style.cssText = `
            position: absolute;
            right: 8px;
            bottom: 8px;
            width: 40px;
            height: 40px;
            border-radius: 20px;
            background: #2a2a2a;
            color: #e5e5e5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 0 8px 25px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            border: 1px solid #404040;
            transition: all 0.3s ease;
        `;
        
        const rect = targetElement.getBoundingClientRect();
        enhancerIcon.style.top = `${window.scrollY + rect.bottom - 44}px`;
        enhancerIcon.style.left = `${window.scrollX + rect.right - 44}px`;

        enhancerIcon.addEventListener('mouseenter', () => {
            enhancerIcon.style.background = '#333';
            enhancerIcon.style.borderColor = '#555';
        });

        enhancerIcon.addEventListener('mouseleave', () => {
            enhancerIcon.style.background = '#2a2a2a';
            enhancerIcon.style.borderColor = '#404040';
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
            width: 450px;
            padding: 0;
            background: #1a1a1a;
            border-radius: 20px;
            color: #e5e5e5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.6);
            z-index: 2147483647;
            border: 1px solid #333;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        enhancerPopup.innerHTML = `
            <div style="
                padding: 24px 24px 20px 24px;
                background: #2a2a2a;
                position: relative;
                border-radius: 20px 20px 0 0;
                border-bottom: 1px solid #333;
            ">
                <button id="closePopupBtn" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: #404040;
                    color: #e5e5e5;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                "
                >×</button>
                <div style="
                    font-weight: 400;
                    font-size: 18px;
                    color: #ffffff;
                    margin-bottom: 8px;
                    text-align: center;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                ">
                    cognix prompter
                </div>
                <div style="
                    font-size: 14px;
                    color: #b0b0b0;
                    text-align: center;
                    opacity: 0.9;
                ">
                    Transform your prompts with AI
                </div>
            </div>
            
            <div style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        font-weight: 500;
                        font-size: 14px;
                        color: #b0b0b0;
                        margin-bottom: 8px;
                    ">Your prompt...</label>
                    <textarea
                        id="promptTextarea"
                        placeholder="Enter your prompt here..."
                        style="
                            width: 100%;
                            height: 100px;
                            padding: 16px;
                            border: 1px solid #404040;
                            border-radius: 12px;
                            background: #2a2a2a;
                            color: #e5e5e5;
                            font-size: 14px;
                            font-family: inherit;
                            resize: none;
                            outline: none;
                            transition: all 0.2s ease;
                            box-sizing: border-box;
                        "
                    >${promptText}</textarea>
                    <div id="characterDisplay" style="
                        font-size: 12px;
                        text-align: right;
                        color: #888;
                        margin-top: 4px;
                    "></div>
                </div>
                
                <button id="enhancePromptBtn" style="
                    width: 100%;
                    padding: 16px 24px;
                    border: 1px solid #404040;
                    border-radius: 12px;
                    background: #2a2a2a;
                    color: #e5e5e5;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 24px;
                "
                >
                    Enhance Prompt
                </button>
                
                <div id="enhancedResults" style="display: none;">
                    <div style="
                        font-weight: 600;
                        font-size: 16px;
                        color: #e5e5e5;
                        margin-bottom: 16px;
                        text-align: center;
                    ">Enhanced Prompts</div>
                    
                    <div id="promptOptions" style="
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    "></div>
                </div>
                
                <div id="loadingState" style="
                    display: none;
                    text-align: center;
                    padding: 40px 20px;
                    color: #888;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid #404040;
                        border-top: 3px solid #e5e5e5;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <div>Enhancing your prompt...</div>
                </div>
            </div>
        `;

        // Position popup
        if (enhancerIcon) {
            chrome.storage.local.get('enhancerPopupPosition', (data) => {
                if (data?.enhancerPopupPosition) {
                    enhancerPopup.style.top = data.enhancerPopupPosition.top;
                    enhancerPopup.style.left = data.enhancerPopupPosition.left;
                } else {
                    const rect = enhancerIcon.getBoundingClientRect();
                    enhancerPopup.style.top = `${window.scrollY + rect.top - 300}px`;
                    enhancerPopup.style.left = `${window.scrollX + rect.left - 190}px`;
                }
            });
        }

        document.body.appendChild(enhancerPopup);

        // Animate in
        setTimeout(() => {
            enhancerPopup.style.opacity = '1';
            enhancerPopup.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        setupPopupEvents();
        makePopupDraggable(enhancerPopup);
    }

    function calculateOptimalPosition(popupRect) {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };
        
        const enhancedSectionWidth = 400;
        const enhancedSectionHeight = 500;
        const margin = 20;
        
        // Calculate available space in each direction
        const spaceRight = viewport.width - (popupRect.right - viewport.scrollX);
        const spaceLeft = popupRect.left - viewport.scrollX;
        const spaceBelow = viewport.height - (popupRect.bottom - viewport.scrollY);
        const spaceAbove = popupRect.top - viewport.scrollY;
        
        let position = 'right';
        let maxSpace = spaceRight;
        
        if (spaceLeft > maxSpace && spaceLeft >= enhancedSectionWidth + margin) {
            position = 'left';
            maxSpace = spaceLeft;
        }
        
        if (spaceBelow > maxSpace && spaceBelow >= enhancedSectionHeight + margin) {
            position = 'bottom';
            maxSpace = spaceBelow;
        }
        
        if (spaceAbove > maxSpace && spaceAbove >= enhancedSectionHeight + margin) {
            position = 'top';
            maxSpace = spaceAbove;
        }
        
        return position;
    }
    
    function positionEnhancedSection(enhancedSection, popupRect) {
        const position = calculateOptimalPosition(popupRect);
        const margin = 20;
        
        // Reset any previous positioning
        enhancedSection.style.position = 'fixed';
        enhancedSection.style.zIndex = '2147483648';
        
        switch (position) {
            case 'right':
                enhancedSection.style.left = `${popupRect.right + margin}px`;
                enhancedSection.style.top = `${popupRect.top}px`;
                enhancedSection.style.transform = 'translateX(0)';
                break;
                
            case 'left':
                enhancedSection.style.right = `${window.innerWidth - popupRect.left + margin}px`;
                enhancedSection.style.top = `${popupRect.top}px`;
                enhancedSection.style.left = 'auto';
                enhancedSection.style.transform = 'translateX(0)';
                break;
                
            case 'bottom':
                enhancedSection.style.left = `${popupRect.left}px`;
                enhancedSection.style.top = `${popupRect.bottom + margin}px`;
                enhancedSection.style.transform = 'translateY(0)';
                break;
                
            case 'top':
                enhancedSection.style.left = `${popupRect.left}px`;
                enhancedSection.style.bottom = `${window.innerHeight - popupRect.top + margin}px`;
                enhancedSection.style.top = 'auto';
                enhancedSection.style.transform = 'translateY(0)';
                break;
        }
        
        return position;
    }

    function setupPopupEvents() {
        const textarea = enhancerPopup.querySelector('#promptTextarea');
        const characterDisplay = enhancerPopup.querySelector('#characterDisplay');
        const enhanceBtn = enhancerPopup.querySelector('#enhancePromptBtn');
        const closeBtn = enhancerPopup.querySelector('#closePopupBtn');

        // Character count updates
        function updateCharacterCount(text) {
            const count = text.length;
            const limit = 4000;
            characterDisplay.textContent = `${count}/${limit} characters`;
            
            if (count > limit) {
                characterDisplay.style.color = '#ff6b6b';
                enhanceBtn.disabled = true;
                enhanceBtn.style.opacity = '0.5';
                enhanceBtn.style.cursor = 'not-allowed';
                enhanceBtn.innerHTML = 'Text too long';
            } else if (count === 0) {
                enhanceBtn.disabled = true;
                enhanceBtn.style.opacity = '0.5';
                enhanceBtn.style.cursor = 'not-allowed';
                enhanceBtn.innerHTML = 'Enter text to enhance';
            } else {
                characterDisplay.style.color = '#888';
                enhanceBtn.disabled = false;
                enhanceBtn.style.opacity = '1';
                enhanceBtn.style.cursor = 'pointer';
                enhanceBtn.innerHTML = 'Enhance Prompt';
            }
        }

        updateCharacterCount(textarea.value);

        textarea.addEventListener('input', () => {
            updateCharacterCount(textarea.value);
        });

        // Focus/blur effects
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = '#555';
            textarea.style.background = '#333';
        });

        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = '#404040';
            textarea.style.background = '#2a2a2a';
        });

        // Button hover effects
        enhanceBtn.addEventListener('mouseenter', () => {
            if (!enhanceBtn.disabled) {
                enhanceBtn.style.background = '#333';
                enhanceBtn.style.borderColor = '#555';
            }
        });

        enhanceBtn.addEventListener('mouseleave', () => {
            enhanceBtn.style.background = '#2a2a2a';
            enhanceBtn.style.borderColor = '#404040';
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#555';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#404040';
        });

        // Event listeners
        enhanceBtn.addEventListener('click', handleEnhanceClick);
        closeBtn.addEventListener('click', closePopup);
        
        // Update enhanced section position when popup is dragged
        const observer = new MutationObserver(() => {
            const enhancedSection = document.getElementById('enhancedResults');
            if (enhancedSection && enhancedSection.style.display !== 'none') {
                const popupRect = enhancerPopup.getBoundingClientRect();
                positionEnhancedSection(enhancedSection, popupRect);
            }
        });
        
        observer.observe(enhancerPopup, {
            attributes: true,
            attributeFilter: ['style']
        });
    }

    function handleEnhanceClick() {
        const textarea = enhancerPopup.querySelector('#promptTextarea');
        const currentText = textarea.value.trim();
        
        if (!currentText) {
            showNotification('Please enter some text to enhance', 'error');
            return;
        }

        showLoadingState();

        const HARDCODED_API_KEY = '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';

        chrome.runtime.sendMessage({
            action: 'enhancePrompt',
            text: currentText,
            apiKey: HARDCODED_API_KEY
        }, (response) => {
            hideLoadingState();
            
            if (response && response.success && response.enhancedPrompts) {
                displayEnhancedPrompts(response.enhancedPrompts);
                showNotification('Prompts enhanced successfully!', 'success');
            } else {
                showNotification('Enhancement failed: ' + (response?.error || 'unknown error'), 'error');
            }
        });
    }

    function showLoadingState() {
        const loadingState = enhancerPopup.querySelector('#loadingState');
        const enhancedResults = enhancerPopup.querySelector('#enhancedResults');
        
        loadingState.style.display = 'block';
        enhancedResults.style.display = 'none';
    }

    function hideLoadingState() {
        const loadingState = enhancerPopup.querySelector('#loadingState');
        loadingState.style.display = 'none';
    }

    function displayEnhancedPrompts(prompts) {
        const enhancedResults = enhancerPopup.querySelector('#enhancedResults');
        const promptOptions = enhancerPopup.querySelector('#promptOptions');
        
        // Create enhanced section as separate floating element
        let enhancedSection = document.getElementById('promptEnhancerResults');
        if (enhancedSection) {
            enhancedSection.remove();
        }
        
        enhancedSection = document.createElement('div');
        enhancedSection.id = 'promptEnhancerResults';
        enhancedSection.style.cssText = `
            position: fixed;
            width: 400px;
            max-height: 500px;
            background: #1a1a1a;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.6);
            z-index: 2147483648;
            border: 1px solid #333;
            overflow-y: auto;
            opacity: 0;
            transform: scale(0.95);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        enhancedSection.innerHTML = `
            <div style="
                padding: 20px 20px 16px 20px;
                border-bottom: 1px solid #333;
                background: #2a2a2a;
                border-radius: 16px 16px 0 0;
            ">
                <div style="
                    font-weight: 400;
                    font-size: 18px;
                    color: #ffffff;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                ">
                    Enhanced Prompts
                </div>
            </div>
            <div style="padding: 20px;" id="enhancedPromptCards"></div>
        `;
        
        document.body.appendChild(enhancedSection);
        
        // Position the enhanced section optimally
        const popupRect = enhancerPopup.getBoundingClientRect();
        const optimalPosition = positionEnhancedSection(enhancedSection, popupRect);
        
        promptOptions.innerHTML = '';
        const enhancedPromptCards = enhancedSection.querySelector('#enhancedPromptCards');
        
        const categories = [
            { title: 'Context', color: '#555' },
            { title: 'Structure', color: '#555' },
            { title: 'Details', color: '#555' }
        ];
        
        prompts.forEach((prompt, index) => {
            const category = categories[index] || categories[0];
            const promptCard = document.createElement('div');
            promptCard.style.cssText = `
                padding: 20px;
                border: 1px solid #333;
                border-radius: 16px;
                background: #2a2a2a;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                margin-bottom: 16px;
            `;
            
            promptCard.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                ">
                    <span style="
                        font-weight: 600;
                        font-size: 14px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">${category.title}</span>
                </div>
                <div style="
                    font-size: 14px;
                    line-height: 1.6;
                    color: #e5e5e5;
                ">${prompt}</div>
                <div style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: #404040;
                    color: #e5e5e5;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                ">Click to Use</div>
            `;
            
            promptCard.addEventListener('mouseenter', () => {
                promptCard.style.borderColor = '#555';
                promptCard.style.background = '#333';
                promptCard.querySelector('div:last-child').style.opacity = '1';
            });
            
            promptCard.addEventListener('mouseleave', () => {
                promptCard.style.borderColor = '#333';
                promptCard.style.background = '#2a2a2a';
                promptCard.querySelector('div:last-child').style.opacity = '0';
            });
            
            promptCard.addEventListener('click', () => {
                replaceTextWithPrompt(prompt);
                enhancedSection.remove();
            });
            
            enhancedPromptCards.appendChild(promptCard);
        });
        
        // Animate in
        setTimeout(() => {
            enhancedSection.style.opacity = '1';
            enhancedSection.style.transform = 'scale(1)';
        }, 100);
        
        // Close enhanced section when clicking outside
        const closeEnhancedSection = (e) => {
            if (!enhancedSection.contains(e.target) && !enhancerPopup.contains(e.target)) {
                enhancedSection.style.opacity = '0';
                enhancedSection.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    enhancedSection.remove();
                    document.removeEventListener('click', closeEnhancedSection);
                }, 200);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeEnhancedSection);
        }, 100);
    }

    function replaceTextWithPrompt(newText) {
        if (lastActiveElement && document.body.contains(lastActiveElement)) {
            if (lastActiveElement.tagName === 'TEXTAREA' || lastActiveElement.tagName === 'INPUT') {
                lastActiveElement.value = newText;
            } else if (
                lastActiveElement.getAttribute('contenteditable') === 'true' ||
                lastActiveElement.id === 'prompt-textarea' ||
                lastActiveElement.classList.contains('ProseMirror')
            ) {
                lastActiveElement.textContent = newText;
            }
            
            lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
            lastActiveElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            showNotification('Prompt replaced successfully!', 'success');
            closePopup();
        } else {
            showNotification('Target element not found', 'error');
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 12px;
            color: #e5e5e5;
            font-weight: 500;
            font-size: 14px;
            z-index: 2147483648;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #404040;
        `;
        
        if (type === 'success') {
            notification.style.background = '#2a2a2a';
            notification.innerHTML = `✓ ${message}`;
        } else if (type === 'error') {
            notification.style.background = '#2a1f1f';
            notification.innerHTML = `✗ ${message}`;
        } else {
            notification.style.background = '#2a2a2a';
            notification.innerHTML = `ℹ ${message}`;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function closePopup() {
        if (enhancerPopup) {
            // Also close enhanced section if open
            const enhancedSection = document.getElementById('promptEnhancerResults');
            if (enhancedSection) {
                enhancedSection.remove();
            }
            
            enhancerPopup.style.opacity = '0';
            enhancerPopup.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                enhancerPopup.remove();
                enhancerPopup = null;
            }, 200);
        }
    }

    function removeEnhancerUI() {
        if (enhancerIcon) {
            enhancerIcon.remove();
            enhancerIcon = null;
        }
        if (enhancerPopup) {
            enhancerPopup.remove();
            enhancerPopup = null;
        }
        const enhancedSection = document.getElementById('promptEnhancerResults');
        if (enhancedSection) {
            enhancedSection.remove();
        }
    }

    function makePopupDraggable(popup) {
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;

        popup.addEventListener('mousedown', (e) => {
            if (e.target.closest('textarea') || e.target.closest('button') || e.target.closest('#promptOptions')) return;

            isDragging = true;
            offsetX = e.clientX - popup.getBoundingClientRect().left;
            offsetY = e.clientY - popup.getBoundingClientRect().top;
            popup.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                popup.style.transition = '';
                chrome.storage.local.set({
                    enhancerPopupPosition: {
                        top: popup.style.top,
                        left: popup.style.left
                    }
                });
            }
        });
    }

})();