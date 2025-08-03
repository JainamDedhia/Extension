# 🚀 Prompt Enhancer - Chrome Extension

> Transform your prompts with AI-powered enhancements for better results on any website

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/yourusername/prompt-enhancer)
[![License](https://img.shields.io/badge/license-MIT-red.svg)](LICENSE)

## ✨ Features

- **🎯 Smart Text Detection**: Automatically detects text inputs across all websites
- **🧠 AI-Powered Enhancement**: Uses Groq API to intelligently improve your prompts
- **🎨 Three Enhancement Types**: 
  - **Context**: Adds relevant background information
  - **Structure**: Improves clarity and organization
  - **Details**: Expands with technical specifications
- **⚡ One-Click Replace**: Instantly replace original text with enhanced versions
- **🌐 Universal Compatibility**: Works on ChatGPT, Claude, Gemini, and any text input field
- **💾 Smart Memory**: Remembers your API key and recent prompts
- **🎨 Beautiful UI**: Modern, responsive design with floating enhancer icon

## 🖼️ Screenshots

### Floating Enhancer Icon
The extension adds a smart floating icon next to your text inputs:

```
[Text Input Field]               🧠
```

### Enhancement Popup
Click the brain icon to open the enhancement interface:

```
┌─────────────────────────────────────┐
│  ✨ Prompt Enhancer                 │
├─────────────────────────────────────┤
│  Original Prompt:                   │
│  ┌─────────────────────────────────┐ │
│  │ [Your text here]                │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [✨ Enhance Prompt]                │
└─────────────────────────────────────┘
```

### Enhanced Results
Get three professionally enhanced versions:

```
┌─────────────────────────────────────┐
│  ✨ Enhanced Prompts                │
├─────────────────────────────────────┤
│  🎯 Context                         │
│  [Enhanced with background info]    │
├─────────────────────────────────────┤
│  🎨 Structure                       │
│  [Improved clarity & organization]  │
├─────────────────────────────────────┤
│  📝 Details                         │
│  [Expanded with specifications]     │
└─────────────────────────────────────┘
```

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore) *(coming soon)*
2. Click "Add to Chrome"
3. Confirm installation

### Manual Installation (For Development)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/prompt-enhancer.git
   cd prompt-enhancer
   ```

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the cloned repository folder
   - The extension will appear in your toolbar

## 🔧 Setup

### 1. Get a Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Configure the Extension
1. Click the extension icon in your Chrome toolbar
2. Enter your Groq API key in the input field
3. The key will be saved automatically

## 📖 Usage

### Basic Usage
1. **Navigate to any website** with text inputs (ChatGPT, Claude, etc.)
2. **Start typing** in any text field
3. **Look for the brain icon** 🧠 that appears near your text
4. **Click the brain icon** to open the enhancer
5. **Click "Enhance Prompt"** to generate improvements
6. **Choose an enhanced version** to replace your original text

### Supported Websites
- ✅ ChatGPT (chat.openai.com)
- ✅ Claude (claude.ai)
- ✅ Google Gemini (gemini.google.com)
- ✅ Any website with text inputs, textareas, or contenteditable fields

### Smart Model Selection
The extension automatically chooses the best AI model based on your prompt content:

- **Code-related prompts** → `llama-3.3-70b-versatile`
- **Writing prompts** → `gemma2-9b-it`
- **General prompts** → `llama-3.1-8b-instant`

## 🏗️ Technical Details

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content.js    │    │  Background.js  │    │   Popup.html    │
│                 │    │                 │    │                 │
│ • Text Detection│◄──►│ • API Calls     │◄──►│ • User Interface│
│ • UI Rendering  │    │ • Model Selection│    │ • Settings      │
│ • Text Replace  │    │ • Error Handling│    │ • Status Display│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Groq API      │
                    │                 │
                    │ • Llama 3.1     │
                    │ • Llama 3.3     │
                    │ • Gemma 2       │
                    └─────────────────┘
```

### File Structure
```
prompt-enhancer/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for text detection
├── popup.html            # Extension popup interface
├── popup.js             # Popup functionality
└── README.md            # This file
```

### Key Features Implementation

#### 🔍 Text Detection
- Monitors multiple input types: `textarea`, `input[type="text"]`, `[contenteditable]`
- Debounced detection to prevent excessive API calls
- Smart element tracking for text replacement

#### 🎨 UI Components
- Floating enhancer icon with smooth animations
- Draggable popup with optimal positioning
- Responsive design that adapts to screen size
- Beautiful gradients and modern styling

#### 🔄 Text Replacement
- Maintains focus and cursor position
- Triggers proper events for framework compatibility
- Cross-browser compatible implementation

## ⚙️ Configuration

### manifest.json
```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",           // Save API keys and settings
    "activeTab",         // Access current tab content
    "scripting"          // Inject content scripts
  ],
  "host_permissions": [
    "https://api.groq.com/*"  // API access
  ]
}
```

### Storage Schema
```javascript
{
  currentText: String,      // Currently detected text
  timestamp: Number,        // Last detection time
  url: String,             // Source page URL
  groqApiKey: String,      // User's API key
  enhancedPrompts: Array,  // Generated enhancements
  isProcessing: Boolean    // Current processing state
}
```

## 🛠️ Development

### Prerequisites
- Chrome/Chromium browser
- Groq API account
- Basic knowledge of Chrome Extensions

### Local Development Setup
1. **Clone and install**:
   ```bash
   git clone https://github.com/yourusername/prompt-enhancer.git
   cd prompt-enhancer
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. **Development workflow**:
   - Make changes to files
   - Click reload button in `chrome://extensions/`
   - Test changes on various websites

### Testing
Test the extension on these platforms:
- [ChatGPT](https://chat.openai.com)
- [Claude](https://claude.ai)
- [Google Gemini](https://gemini.google.com)
- Any website with text inputs

### Debugging
- **Content Script**: Open Developer Tools on any webpage
- **Background Script**: Go to `chrome://extensions/` → Details → Inspect views: background page
- **Popup**: Right-click extension icon → Inspect popup

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues
1. Check existing issues first
2. Create detailed bug reports with:
   - Chrome version
   - Website where issue occurred
   - Steps to reproduce
   - Console errors (if any)

### Feature Requests
1. Open an issue with the "enhancement" label
2. Describe the feature and its benefits
3. Include mockups or examples if applicable

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request with detailed description

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on multiple websites
- Ensure responsive design
- Maintain compatibility with Chrome MV3

## 📝 API Integration

### Groq API Models
The extension uses these Groq models:

| Model | Use Case | Strengths |
|-------|----------|-----------|
| `llama-3.3-70b-versatile` | Code prompts | Complex reasoning, technical accuracy |
| `gemma2-9b-it` | Writing prompts | Creative writing, narrative structure |
| `llama-3.1-8b-instant` | General prompts | Fast response, balanced performance |

### Rate Limits
- Groq free tier: 30 requests/minute
- Extension includes smart debouncing
- Automatic retry on rate limit errors

### Error Handling
```javascript
// Example error handling
try {
  const response = await groqAPI.enhance(prompt);
  return response.enhancedPrompts;
} catch (error) {
  if (error.status === 429) {
    return 'Rate limit exceeded. Please wait.';
  }
  return 'Enhancement failed. Please try again.';
}
```

## 🔒 Privacy & Security

- **API Keys**: Stored locally in Chrome storage, never transmitted except to Groq
- **Text Data**: Only processed when you explicitly click enhance
- **No Tracking**: No analytics or user tracking
- **Secure Communication**: All API calls use HTTPS
- **Minimal Permissions**: Only requests necessary permissions

## 🐛 Troubleshooting

### Common Issues

**Q: The brain icon doesn't appear**
- Check if you're typing in a supported text field
- Refresh the page and try again
- Ensure the extension is enabled

**Q: "API key required" error**
- Enter your Groq API key in the extension popup
- Verify the key is correct (starts with `gsk_`)
- Check your Groq account status

**Q: Enhancement fails**
- Check your internet connection
- Verify Groq API key is valid
- Try with shorter text (under 4000 characters)

**Q: Text replacement doesn't work**
- Ensure you're on the same tab where text was detected
- Try clicking directly in the text field first
- Some websites may have custom input handling

### Debug Mode
Enable debug logging by opening Developer Tools and checking the console for messages starting with "TEXT REFLECTOR:" or "POPUP:".

## 📋 Roadmap

### Upcoming Features
- [ ] **Custom Enhancement Templates**: Create your own prompt patterns
- [ ] **Prompt History**: Save and reuse previous enhancements
- [ ] **Team Sharing**: Share enhanced prompts with team members
- [ ] **Multiple API Providers**: Support for OpenAI, Anthropic, etc.
- [ ] **Prompt Analytics**: Track enhancement effectiveness
- [ ] **Voice Input**: Speak your prompts instead of typing
- [ ] **Multi-language Support**: Enhance prompts in different languages

### Version History
- **v1.0** - Initial release with core functionality
- **v1.1** *(planned)* - Custom templates and history
- **v2.0** *(planned)* - Multi-provider support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast and reliable AI API
- **Chrome Extensions Team** for excellent documentation
- **Open Source Community** for inspiration and best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/prompt-enhancer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/prompt-enhancer/discussions)
- **Email**: support@promptenhancer.com

---

<div align="center">

**Made with ❤️ for the AI community**

[⭐ Star this repo](https://github.com/yourusername/prompt-enhancer) • [🐛 Report Bug](https://github.com/yourusername/prompt-enhancer/issues) • [💡 Request Feature](https://github.com/yourusername/prompt-enhancer/issues)

</div>a
