'use client';

import { useState, useCallback } from 'react';
import { untilRealResult } from '@/lib/loop/untilRealResult';
import {
  getChatCompletion,
  getStreamingChatCompletion,
  type ChatExtras,
} from '@/lib/ai/chatCompletion';
import { friendlyAiError } from '@/lib/ai/aiClient';

function completionText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const content = (result as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]
    ?.message?.content;
  return typeof content === 'string' ? content : '';
}

export function useChat(provider: string, model: string, streaming: boolean = true, task?: string) {
  const [response, setResponse] = useState('');
  const [fullResponse, setFullResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (messages: object[], parameters: object = {}, extras?: ChatExtras) => {
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
            task,
            extras
          );
        } else {
          const result = await untilRealResult({
            attempts: 3,
            delayMs: (n) => 300 * n,
            isReal: (row) => Boolean(completionText(row).trim()),
            run: async () => {
              try {
                return await getChatCompletion(provider, model, messages, parameters, task, extras);
              } catch (err) {
                const msg = err instanceof Error ? err.message : '';
                if (/sign in|unauthorized|limit/i.test(msg)) throw err;
                return { choices: [{ message: { content: '' } }] };
              }
            },
          });
          if (!result) {
            throw new Error(friendlyAiError('ai_empty_response'));
          }
          setFullResponse(result);
          setResponse(completionText(result));
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
