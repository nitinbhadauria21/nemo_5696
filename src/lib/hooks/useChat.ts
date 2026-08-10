'use client';

import { useState, useCallback } from 'react';
import { getChatCompletion, getStreamingChatCompletion } from '@/lib/ai/chatCompletion';
import { friendlyAiError } from '@/lib/ai/aiClient';

export function useChat(provider: string, model: string, streaming: boolean = true, task?: string) {
  const [response, setResponse] = useState('');
  const [fullResponse, setFullResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (messages: object[], parameters: object = {}) => {
      setResponse('');
      setFullResponse(streaming ? [] : null);
      setIsLoading(true);
      setError(null);

      try {
        if (streaming) {
          await getStreamingChatCompletion(
            provider,
            model,
            messages,
            (chunk) => {
              setFullResponse((prev: any[]) => [...prev, chunk]);
              const content = chunk?.choices?.[0]?.delta?.content;
              if (content) setResponse((prev) => prev + content);
            },
            () => setIsLoading(false),
            (err) => {
              setError(err);
              setIsLoading(false);
            },
            parameters,
            task
          );
        } else {
          const result = await getChatCompletion(provider, model, messages, parameters, task);
          setFullResponse(result);
          const content = result?.choices?.[0]?.message?.content || '';
          if (!String(content).trim()) {
            throw new Error(friendlyAiError('ai_empty_response'));
          }
          setResponse(content);
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    },
    [provider, model, streaming, task]
  );

  return { response, fullResponse, isLoading, error, sendMessage };
}
