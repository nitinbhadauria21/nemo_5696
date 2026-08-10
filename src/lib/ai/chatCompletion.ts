import { callAIEndpoint, friendlyAiError } from './aiClient';

const ENDPOINT = '/api/ai/chat-completion';

export async function getChatCompletion(
  provider: string,
  model: string,
  messages: object[],
  parameters: object = {},
  task?: string
) {
  return callAIEndpoint(ENDPOINT, {
    provider,
    model,
    messages,
    stream: false,
    parameters,
    ...(task ? { task } : {}),
  });
}

export async function getStreamingChatCompletion(
  provider: string,
  model: string,
  messages: object[],
  onChunk: (chunk: any) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  parameters: object = {},
  task?: string
) {
  let settled = false;
  const complete = () => {
    if (settled) return;
    settled = true;
    onComplete();
  };
  const fail = (error: Error) => {
    if (settled) return;
    settled = true;
    onError(error);
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        messages,
        stream: true,
        parameters,
        ...(task ? { task } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(friendlyAiError(data.error, response.status));
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';
    let receivedContent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk' && data.chunk) {
              const content = data.chunk?.choices?.[0]?.delta?.content;
              if (content) receivedContent = true;
              onChunk(data.chunk);
            } else if (data.type === 'done') {
              if (!receivedContent) {
                fail(new Error(friendlyAiError('ai_empty_response')));
              } else {
                complete();
              }
            } else if (data.type === 'error') {
              console.error('API Route Error:', {
                error: data.error,
                details: data.details,
              });
              fail(new Error(friendlyAiError(data.error, 503)));
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    if (!settled) {
      if (!receivedContent) {
        fail(new Error(friendlyAiError('ai_empty_response')));
      } else {
        complete();
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    fail(error instanceof Error ? error : new Error('Streaming error'));
  }
}
