import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ALLOWED_MODELS,
  MAX_MESSAGES,
  MAX_OUTPUT_TOKENS,
  MAX_TOTAL_CHARS,
  validateChatPayload,
} from './requestPolicy';

describe('validateChatPayload', () => {
  const validMessages = [{ role: 'user' as const, content: 'hello' }];

  it('accepts allowlisted provider and model', () => {
    const result = validateChatPayload({
      provider: 'ANTHROPIC',
      model: ALLOWED_MODELS.ANTHROPIC[0],
      messages: validMessages,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.provider, 'ANTHROPIC');
      assert.equal(result.model, ALLOWED_MODELS.ANTHROPIC[0]);
      assert.equal(result.maxTokens, 1024);
    }
  });

  it('rejects unknown provider', () => {
    const result = validateChatPayload({
      provider: 'HACKER_AI',
      model: 'anything',
      messages: validMessages,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'invalid_provider');
      assert.equal(result.status, 400);
    }
  });

  it('rejects model not on allowlist', () => {
    const result = validateChatPayload({
      provider: 'OPEN_AI',
      model: 'gpt-secret-unlisted',
      messages: validMessages,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'invalid_model');
    }
  });

  it('rejects empty or oversized message lists', () => {
    assert.equal(
      validateChatPayload({
        provider: 'GEMINI',
        model: ALLOWED_MODELS.GEMINI[0],
        messages: [],
      }).ok,
      false
    );
    const tooMany = Array.from({ length: MAX_MESSAGES + 1 }, () => ({
      role: 'user' as const,
      content: 'x',
    }));
    const result = validateChatPayload({
      provider: 'GEMINI',
      model: ALLOWED_MODELS.GEMINI[0],
      messages: tooMany,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'invalid_messages');
  });

  it('rejects payload over total char budget', () => {
    const result = validateChatPayload({
      provider: 'PERPLEXITY',
      model: ALLOWED_MODELS.PERPLEXITY[0],
      messages: [{ role: 'user', content: 'a'.repeat(MAX_TOTAL_CHARS + 1) }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'payload_too_large');
  });

  it('caps max_tokens to MAX_OUTPUT_TOKENS', () => {
    const result = validateChatPayload({
      provider: 'OPEN_AI',
      model: ALLOWED_MODELS.OPEN_AI[0],
      messages: validMessages,
      parameters: { max_tokens: 99_999 },
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.maxTokens, MAX_OUTPUT_TOKENS);
  });
});
