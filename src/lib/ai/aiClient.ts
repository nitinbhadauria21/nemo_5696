const AI_ERROR_MESSAGES: Record<string, string> = {
  ai_not_configured:
    'AI is not configured. Add OPENROUTER_API_KEY in Vercel (or the key matching AI_PROVIDER), then redeploy.',
  ai_unavailable: 'AI provider request failed. Check the API key and model, then try again.',
  ai_empty_response: 'AI returned an empty response. Try again or shorten your prompt.',
  ai_limit_reached:
    'You have reached your plan’s monthly AI limit. Upgrade or try again next month.',
  unauthorized: 'Sign in to use AI features.',
  rate_limited: 'Too many AI requests. Wait a moment and try again.',
  invalid_provider: 'Unsupported AI provider.',
  invalid_model: 'Unsupported AI model.',
  invalid_messages: 'Invalid AI request. Please try again.',
  payload_too_large: 'Your prompt is too long. Shorten it and try again.',
  invalid_json: 'Invalid AI request. Please try again.',
};

export function friendlyAiError(code: unknown, status?: number): string {
  if (typeof code === 'string' && AI_ERROR_MESSAGES[code]) return AI_ERROR_MESSAGES[code];
  if (status === 401) return AI_ERROR_MESSAGES.unauthorized;
  if (status === 402) return AI_ERROR_MESSAGES.ai_limit_reached;
  if (status === 429) return AI_ERROR_MESSAGES.rate_limited;
  if (status === 503) {
    if (typeof code === 'string' && code === 'ai_not_configured') {
      return AI_ERROR_MESSAGES.ai_not_configured;
    }
    return AI_ERROR_MESSAGES.ai_unavailable;
  }
  return typeof code === 'string' && code.trim()
    ? code
    : `Request failed${status ? `: ${status}` : ''}`;
}

export async function callAIEndpoint(endpoint: string, payload: object) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('API Route Error:', {
        error: data.error,
        details: data.details,
      });
      throw new Error(friendlyAiError(data.error, response.status));
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
