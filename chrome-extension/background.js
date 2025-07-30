chrome.runtime.onInstalled.addListener(() => {
  console.log('Cognix Prompter extension installed');
  
  // Initialize storage
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
    enhancePromptWithGroq(request.text, request.apiKey)
      .then(enhancedPrompts => {
        sendResponse({ success: true, enhancedPrompts });
      })
      .catch(error => {
        console.error('Error enhancing prompt:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }
});

async function enhancePromptWithGroq(originalText, apiKey) {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }

  // Determine the best model based on text characteristics
  let model = 'llama-3.1-8b-instant'; // Default
  
  if (originalText.toLowerCase().includes('code') || 
      originalText.toLowerCase().includes('app') || 
      originalText.toLowerCase().includes('program') ||
      originalText.toLowerCase().includes('function') ||
      originalText.toLowerCase().includes('script')) {
    model = 'llama-3.3-70b-versatile'; // Code
  } else if (originalText.toLowerCase().includes('write') || 
             originalText.toLowerCase().includes('essay') || 
             originalText.toLowerCase().includes('article') ||
             originalText.toLowerCase().includes('story')) {
    model = 'gemma2-9b-it'; // Writing
  } else if (originalText.toLowerCase().includes('image') || 
             originalText.toLowerCase().includes('picture') || 
             originalText.toLowerCase().includes('visual') ||
             originalText.toLowerCase().includes('design')) {
    model = 'llama-3.1-8b-instant'; // Using general for now as mistral-saba-24b might not be available
  }

  const systemPrompt = `You are a prompt enhancement specialist. Given a user's input prompt, generate exactly 3 improved versions that are:

1. CONTEXTUAL: Add relevant context and background information
2. STRUCTURED: Improve clarity, structure, and specificity  
3. DETAILED: Expand with technical details and requirements

Each enhanced prompt should be significantly more detailed and actionable than the original while maintaining the core intent.

Return ONLY a JSON array with exactly 3 strings, no additional text or formatting.

Example format: ["enhanced prompt 1", "enhanced prompt 2", "enhanced prompt 3"]`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Original prompt: "${originalText}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from Groq API');
  }

  try {
    const enhancedPrompts = JSON.parse(content);
    if (!Array.isArray(enhancedPrompts) || enhancedPrompts.length !== 3) {
      throw new Error('Invalid response format');
    }
    return enhancedPrompts;
  } catch (parseError) {
    // Fallback: try to extract prompts from text response
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 3) {
      return lines.slice(0, 3).map(line => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, ''));
    }
    throw new Error('Could not parse enhanced prompts from response');
  }
}