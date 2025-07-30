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