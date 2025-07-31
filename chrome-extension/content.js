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
    // FLOATING ICON + MINI POPUP UI WITH GLASSMORPHISM
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
        iconImg.style.objectFit = "contain";
        iconImg.style.padding = "6px";
        iconImg.style.borderRadius = "50%";
        iconImg.style.display = "block";
        iconImg.style.filter = "drop-shadow(0 0 8px rgba(255,255,255,0.3))";
            
        // Enhanced glassmorphism floating icon
        enhancerIcon.style.cssText = `
            position: absolute;
            right: 8px;
            bottom: 8px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(42, 42, 42, 0.2);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            animation: cognixPulse 3s ease-in-out infinite;
        `;
        
        // Clear and add the styled icon
        enhancerIcon.innerHTML = '';
        enhancerIcon.appendChild(iconImg);
        
        const rect = targetElement.getBoundingClientRect();
        enhancerIcon.style.top = `${window.scrollY + rect.bottom - 52}px`;
        enhancerIcon.style.left = `${window.scrollX + rect.right - 52}px`;

        enhancerIcon.addEventListener('mouseenter', () => {
            enhancerIcon.style.transform = 'scale(1.1) translateY(-2px)';
            enhancerIcon.style.background = 'rgba(64, 64, 64, 0.3)';
            enhancerIcon.style.boxShadow = `
                0 12px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                0 0 20px rgba(229, 229, 229, 0.1)
            `;
        });

        enhancerIcon.addEventListener('mouseleave', () => {
            enhancerIcon.style.transform = 'scale(1) translateY(0)';
            enhancerIcon.style.background = 'rgba(42, 42, 42, 0.2)';
            enhancerIcon.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `;
        });

        enhancerIcon.addEventListener('click', () => {
            togglePopup(targetElement, lastText);
        });

        document.body.appendChild(enhancerIcon);
    }

    function togglePopup(targetElement, promptText) {
        if (enhancerPopup) {
            enhancerPopup.style.opacity = '0';
            enhancerPopup.style.transform = 'translateY(-20px) scale(0.9)';
            setTimeout(() => {
                enhancerPopup.remove();
                enhancerPopup = null;
            }, 300);
            return;
        }

        enhancerPopup = document.createElement('div');
        enhancerPopup.style.cssText = `
            position: absolute;
            width: 480px;
            padding: 0;
            background: rgba(26, 26, 26, 0.1);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border-radius: 24px;
            color: #e5e5e5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 
                0 25px 80px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            z-index: 2147483647;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        enhancerPopup.innerHTML = `
            <div style="
                padding: 28px 28px 24px 28px;
                background: rgba(42, 42, 42, 0.2);
                backdrop-filter: blur(10px);
                position: relative;
                border-radius: 24px 24px 0 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
                    pointer-events: none;
                "></div>
                <button id="closePopupBtn" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: rgba(64, 64, 64, 0.3);
                    backdrop-filter: blur(10px);
                    color: #e5e5e5;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 300;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                "
                >×</button>
                <div style="
                    font-weight: 300;
                    font-size: 20px;
                    color: #ffffff;
                    margin-bottom: 10px;
                    text-align: center;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                    position: relative;
                    z-index: 1;
                ">
                    cognix prompter
                </div>
                <div style="
                    font-size: 14px;
                    color: rgba(176, 176, 176, 0.8);
                    text-align: center;
                    opacity: 0.9;
                    position: relative;
                    z-index: 1;
                ">
                    Transform your prompts with AI
                </div>
            </div>
            
            <div style="padding: 28px; position: relative; overflow: hidden;">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
                    pointer-events: none;
                "></div>
                
                <div style="margin-bottom: 24px; position: relative; z-index: 1;">
                    <label style="
                        display: block;
                        font-weight: 500;
                        font-size: 14px;
                        color: rgba(176, 176, 176, 0.9);
                        margin-bottom: 10px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    ">Your prompt...</label>
                    <textarea
                        id="promptTextarea"
                        placeholder="Enter your prompt here..."
                        style="
                            width: 100%;
                            height: 110px;
                            padding: 18px;
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 16px;
                            background: rgba(42, 42, 42, 0.15);
                            backdrop-filter: blur(10px);
                            color: #e5e5e5;
                            font-size: 14px;
                            font-family: inherit;
                            resize: none;
                            outline: none;
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                            box-shadow: 
                                inset 0 2px 8px rgba(0, 0, 0, 0.2),
                                0 0 0 1px rgba(255, 255, 255, 0.02);
                        "
                    >${promptText}</textarea>
                    <div id="characterDisplay" style="
                        font-size: 12px;
                        text-align: right;
                        color: rgba(136, 136, 136, 0.8);
                        margin-top: 6px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    "></div>
                </div>
                
                <button id="enhancePromptBtn" style="
                    width: 100%;
                    padding: 18px 28px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    background: rgba(42, 42, 42, 0.2);
                    backdrop-filter: blur(15px);
                    color: #e5e5e5;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 28px;
                    box-shadow: 
                        0 4px 20px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    position: relative;
                    overflow: hidden;
                "
                >
                    <span style="position: relative; z-index: 1;">Enhance Prompt</span>
                </button>
                
                <div id="enhancedResults" style="display: none; position: relative; z-index: 1;">
                    <div style="
                        font-weight: 600;
                        font-size: 16px;
                        color: #e5e5e5;
                        margin-bottom: 20px;
                        text-align: center;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">Enhanced Prompts</div>
                    
                    <div id="promptOptions" style="
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    "></div>
                </div>
                
                <div id="loadingState" style="
                    display: none;
                    text-align: center;
                    padding: 45px 20px;
                    color: rgba(136, 136, 136, 0.8);
                    position: relative;
                    z-index: 1;
                ">
                    <div style="
                        width: 44px;
                        height: 44px;
                        border: 3px solid rgba(255, 255, 255, 0.1);
                        border-top: 3px solid rgba(229, 229, 229, 0.6);
                        border-radius: 50%;
                        animation: cognixSpin 1.2s linear infinite;
                        margin: 0 auto 20px;
                        backdrop-filter: blur(5px);
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                    "></div>
                    <div style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">Enhancing your prompt...</div>
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
                    enhancerPopup.style.top = `${window.scrollY + rect.top - 320}px`;
                    enhancerPopup.style.left = `${window.scrollX + rect.left - 200}px`;
                }
            });
        }

        document.body.appendChild(enhancerPopup);

        // Animate in
        setTimeout(() => {
            enhancerPopup.style.opacity = '1';
            enhancerPopup.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // Add enhanced CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes cognixSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes cognixPulse {
                0%, 100% { 
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        0 0 0 0 rgba(229, 229, 229, 0.3);
                }
                50% { 
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        0 0 0 8px rgba(229, 229, 229, 0.1);
                }
            }
            
            @keyframes cognixShimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
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
        
        const enhancedSectionWidth = 420;
        const enhancedSectionHeight = 520;
        const margin = 25;
        
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
        const margin = 25;
        
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
                characterDisplay.style.color = 'rgba(255, 107, 107, 0.9)';
                enhanceBtn.disabled = true;
                enhanceBtn.style.opacity = '0.5';
                enhanceBtn.style.cursor = 'not-allowed';
                enhanceBtn.innerHTML = '<span style="position: relative; z-index: 1;">Text too long</span>';
            } else if (count === 0) {
                enhanceBtn.disabled = true;
                enhanceBtn.style.opacity = '0.5';
                enhanceBtn.style.cursor = 'not-allowed';
                enhanceBtn.innerHTML = '<span style="position: relative; z-index: 1;">Enter text to enhance</span>';
            } else {
                characterDisplay.style.color = 'rgba(136, 136, 136, 0.8)';
                enhanceBtn.disabled = false;
                enhanceBtn.style.opacity = '1';
                enhanceBtn.style.cursor = 'pointer';
                enhanceBtn.innerHTML = '<span style="position: relative; z-index: 1;">Enhance Prompt</span>';
            }
        }

        updateCharacterCount(textarea.value);

        textarea.addEventListener('input', () => {
            updateCharacterCount(textarea.value);
        });

        // Enhanced focus/blur effects with glassmorphism
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            textarea.style.background = 'rgba(51, 51, 51, 0.2)';
            textarea.style.boxShadow = `
                inset 0 2px 8px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                0 0 20px rgba(229, 229, 229, 0.05)
            `;
        });

        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            textarea.style.background = 'rgba(42, 42, 42, 0.15)';
            textarea.style.boxShadow = `
                inset 0 2px 8px rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.02)
            `;
        });

        // Enhanced button hover effects
        enhanceBtn.addEventListener('mouseenter', () => {
            if (!enhanceBtn.disabled) {
                enhanceBtn.style.background = 'rgba(51, 51, 51, 0.3)';
                enhanceBtn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                enhanceBtn.style.transform = 'translateY(-1px)';
                enhanceBtn.style.boxShadow = `
                    0 6px 25px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15),
                    0 0 20px rgba(229, 229, 229, 0.05)
                `;
                
                // Add shimmer effect
                const shimmer = document.createElement('div');
                shimmer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    animation: cognixShimmer 0.8s ease-out;
                    pointer-events: none;
                `;
                enhanceBtn.appendChild(shimmer);
                setTimeout(() => shimmer.remove(), 800);
            }
        });

        enhanceBtn.addEventListener('mouseleave', () => {
            enhanceBtn.style.background = 'rgba(42, 42, 42, 0.2)';
            enhanceBtn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            enhanceBtn.style.transform = 'translateY(0)';
            enhanceBtn.style.boxShadow = `
                0 4px 20px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `;
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(85, 85, 85, 0.4)';
            closeBtn.style.transform = 'scale(1.05)';
            closeBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(64, 64, 64, 0.3)';
            closeBtn.style.transform = 'scale(1)';
            closeBtn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
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
        
        // Create enhanced section as separate floating element with glassmorphism
        let enhancedSection = document.getElementById('promptEnhancerResults');
        if (enhancedSection) {
            enhancedSection.remove();
        }
        
        enhancedSection = document.createElement('div');
        enhancedSection.id = 'promptEnhancerResults';
        enhancedSection.style.cssText = `
            position: fixed;
            width: 420px;
            max-height: 520px;
            background: rgba(26, 26, 26, 0.1);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border-radius: 20px;
            box-shadow: 
                0 25px 80px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            z-index: 2147483648;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow-y: auto;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        enhancedSection.innerHTML = `
            <div style="
                padding: 24px 24px 20px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(42, 42, 42, 0.2);
                backdrop-filter: blur(10px);
                border-radius: 20px 20px 0 0;
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
                    pointer-events: none;
                "></div>
                <div style="
                    font-weight: 300;
                    font-size: 18px;
                    color: #ffffff;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                    position: relative;
                    z-index: 1;
                ">
                    Enhanced Prompts
                </div>
            </div>
            <div style="
                padding: 24px; 
                position: relative; 
                overflow: hidden;
            " id="enhancedPromptCards">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
                    pointer-events: none;
                "></div>
            </div>
        `;
        
        document.body.appendChild(enhancedSection);
        
        // Position the enhanced section optimally
        const popupRect = enhancerPopup.getBoundingClientRect();
        const optimalPosition = positionEnhancedSection(enhancedSection, popupRect);
        
        promptOptions.innerHTML = '';
        const enhancedPromptCards = enhancedSection.querySelector('#enhancedPromptCards');
        
        const categories = [
            { title: 'Context', color: 'rgba(100, 100, 255, 0.1)' },
            { title: 'Structure', color: 'rgba(100, 255, 100, 0.1)' },
            { title: 'Details', color: 'rgba(255, 100, 100, 0.1)' }
        ];
        
        prompts.forEach((prompt, index) => {
            const category = categories[index] || categories[0];
            const promptCard = document.createElement('div');
            promptCard.style.cssText = `
                padding: 24px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                background: rgba(42, 42, 42, 0.15);
                backdrop-filter: blur(15px);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                margin-bottom: 18px;
                overflow: hidden;
                box-shadow: 
                    0 4px 20px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            `;
            
            promptCard.innerHTML = `
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${category.color};
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                "></div>
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 14px;
                    position: relative;
                    z-index: 1;
                ">
                    <span style="
                        font-weight: 600;
                        font-size: 13px;
                        color: rgba(136, 136, 136, 0.9);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    ">${category.title}</span>
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: ${category.color.replace('0.1', '0.6')};
                        border-radius: 50%;
                        box-shadow: 0 0 8px ${category.color.replace('0.1', '0.3')};
                    "></div>
                </div>
                <div style="
                    font-size: 14px;
                    line-height: 1.7;
                    color: #e5e5e5;
                    position: relative;
                    z-index: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                ">${prompt}</div>
                <div style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(64, 64, 64, 0.3);
                    backdrop-filter: blur(10px);
                    color: #e5e5e5;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 500;
                    opacity: 0;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    z-index: 2;
                ">Click to Use</div>
            `;
            
            promptCard.addEventListener('mouseenter', () => {
                promptCard.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                promptCard.style.background = 'rgba(51, 51, 51, 0.2)';
                promptCard.style.transform = 'translateY(-2px)';
                promptCard.style.boxShadow = `
                    0 8px 30px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 20px rgba(229, 229, 229, 0.05)
                `;
                promptCard.querySelector('div:first-child').style.opacity = '1';
                promptCard.querySelector('div:last-child').style.opacity = '1';
                promptCard.querySelector('div:last-child').style.transform = 'translateY(-2px)';
            });
            
            promptCard.addEventListener('mouseleave', () => {
                promptCard.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                promptCard.style.background = 'rgba(42, 42, 42, 0.15)';
                promptCard.style.transform = 'translateY(0)';
                promptCard.style.boxShadow = `
                    0 4px 20px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                `;
                promptCard.querySelector('div:first-child').style.opacity = '0';
                promptCard.querySelector('div:last-child').style.opacity = '0';
                promptCard.querySelector('div:last-child').style.transform = 'translateY(0)';
            });
            
            promptCard.addEventListener('click', () => {
                // Add click animation
                promptCard.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    promptCard.style.transform = 'scale(1)';
                    replaceTextWithPrompt(prompt);
                    enhancedSection.remove();
                }, 150);
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
                enhancedSection.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    enhancedSection.remove();
                    document.removeEventListener('click', closeEnhancedSection);
                }, 300);
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
            top: 24px;
            right: 24px;
            padding: 18px 24px;
            border-radius: 16px;
            color: #e5e5e5;
            font-weight: 500;
            font-size: 14px;
            z-index: 2147483648;
            opacity: 0;
            transform: translateX(120px) scale(0.9);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 320px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        `;
        
        if (type === 'success') {
            notification.style.background = 'rgba(42, 42, 42, 0.2)';
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 20px; 
                        height: 20px; 
                        background: rgba(100, 255, 100, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64ff64;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 0 10px rgba(100, 255, 100, 0.3);
                    ">✓</div>
                    <span>${message}</span>
                </div>
            `;
        } else if (type === 'error') {
            notification.style.background = 'rgba(42, 31, 31, 0.2)';
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 20px; 
                        height: 20px; 
                        background: rgba(255, 100, 100, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #ff6464;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 0 10px rgba(255, 100, 100, 0.3);
                    ">✗</div>
                    <span>${message}</span>
                </div>
            `;
        } else {
            notification.style.background = 'rgba(42, 42, 42, 0.2)';
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 20px; 
                        height: 20px; 
                        background: rgba(100, 100, 255, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6464ff;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 0 10px rgba(100, 100, 255, 0.3);
                    ">ℹ</div>
                    <span>${message}</span>
                </div>
            `;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0) scale(1)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(120px) scale(0.9)';
            setTimeout(() => notification.remove(), 400);
        }, 3500);
    }

    function closePopup() {
        if (enhancerPopup) {
            // Also close enhanced section if open
            const enhancedSection = document.getElementById('promptEnhancerResults');
            if (enhancedSection) {
                enhancedSection.remove();
            }
            
            enhancerPopup.style.opacity = '0';
            enhancerPopup.style.transform = 'translateY(-20px) scale(0.9)';
            setTimeout(() => {
                enhancerPopup.remove();
                enhancerPopup = null;
            }, 300);
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
            popup.style.cursor = 'grabbing';
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
                popup.style.cursor = 'default';
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
