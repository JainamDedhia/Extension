// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Enhancer extension installed');

  chrome.storage.local.set({
    currentText: '',
    timestamp: null,
    url: '',
    elementType: '',
    enhancedPrompts: [],
    isProcessing: false,
    groqApiKey: ''
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    enhancePromptWithGemini(request.text, request.apiKey)
      .then(enhancedPrompts => {
        sendResponse({ success: true, enhancedPrompts });
      })
      .catch(error => {
        console.error('Error enhancing prompt:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function enhancePromptWithGemini(originalText, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const prompt = `You are a prompt enhancement specialist. Given a user's input prompt, generate exactly 3 improved versions that are:

1. CONTEXTUAL: Add relevant context and background information
2. STRUCTURED: Improve clarity, structure, and specificity  
3. DETAILED: Expand with technical details and requirements

Each enhanced prompt should be significantly more detailed and actionable than the original while maintaining the core intent.

Return ONLY a JSON array with exactly 3 strings, no additional text or formatting.

Original prompt: "${originalText}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content || typeof content !== 'string') {
    console.error('Gemini response invalid:', data);
    throw new Error('No usable response from Gemini API');
  }

  try {
    const cleaned = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    const enhancedPrompts = JSON.parse(cleaned);

    if (!Array.isArray(enhancedPrompts) || enhancedPrompts.length !== 3) {
      throw new Error('Invalid response format (not 3 prompts)');
    }

    return enhancedPrompts;
  } catch (parseError) {
    // Fallback: try to extract plain text lines
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 3) {
      return lines.slice(0, 3).map(line =>
        line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '')
      );
    }

    throw new Error('Could not parse enhanced prompts from Gemini response');
  }
}
