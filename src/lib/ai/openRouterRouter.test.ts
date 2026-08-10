import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFreeModelChain,
  inferTaskFromMessages,
  isOpenRouterFreeModel,
  OPENROUTER_ATTEMPTS_PER_MODEL,
  OPENROUTER_FREE_MODELS,
  OPENROUTER_MAX_MODELS,
  resolveOpenRouterTask,
  selectOpenRouterRoute,
} from './openRouterRouter';

describe('openRouterRouter agent', () => {
  it('only treats free / openrouter/free ids as free', () => {
    assert.equal(isOpenRouterFreeModel('google/gemma-4-31b-it:free'), true);
    assert.equal(isOpenRouterFreeModel('openrouter/free'), true);
    assert.equal(isOpenRouterFreeModel('anthropic/claude-sonnet-4'), false);
    assert.equal(isOpenRouterFreeModel('gpt-4o'), false);
  });

  it('builds a quality-first chain of up to 3 free models per task', () => {
    for (const task of ['script', 'chat', 'analysis', 'sentiment', 'ideas'] as const) {
      const chain = getFreeModelChain(task);
      assert.ok(chain.length >= 2 && chain.length <= OPENROUTER_MAX_MODELS, task);
      for (const id of chain) {
        assert.equal(isOpenRouterFreeModel(id), true, id);
      }
    }
  });

  it('puts heavier models first for script and lighter first for chat', () => {
    const script = getFreeModelChain('script');
    const chat = getFreeModelChain('chat');
    assert.match(script[0], /gemma-4-31b|nemotron-3-super|ultra/i);
    assert.match(chat[0], /nano-9b|ling-3\.0-tiny|nano-30b/i);
    assert.notEqual(script[0], chat[0]);
  });

  it('prefers AI_MODEL when it is an allowlisted free id', () => {
    const preferred = OPENROUTER_FREE_MODELS.find((id) => id.endsWith(':free'))!;
    const chain = getFreeModelChain('chat', preferred);
    assert.equal(chain[0], preferred);
    assert.ok(chain.length <= OPENROUTER_MAX_MODELS);
  });

  it('ignores paid preferred models', () => {
    const chain = getFreeModelChain('analysis', 'anthropic/claude-3.5-sonnet');
    assert.notEqual(chain[0], 'anthropic/claude-3.5-sonnet');
    assert.equal(isOpenRouterFreeModel(chain[0]), true);
  });

  it('selectOpenRouterRoute returns agent decision metadata', () => {
    const route = selectOpenRouterRoute('SCRIPT');
    assert.equal(route.task, 'script');
    assert.equal(route.strategy, 'quality_first_retry_fallback');
    assert.equal(route.primary, route.models[0]);
    assert.ok(route.reason.length > 10);
    assert.equal(OPENROUTER_ATTEMPTS_PER_MODEL, 2);
  });

  it('resolves and infers tasks from prompts', () => {
    assert.equal(resolveOpenRouterTask('SCRIPT'), 'script');
    assert.equal(resolveOpenRouterTask('nope'), 'chat');
    assert.equal(
      inferTaskFromMessages([{ role: 'system', content: 'You are NemoScript — viral scripts' }]),
      'script'
    );
    assert.equal(
      inferTaskFromMessages([{ role: 'system', content: 'You are Nemo AI chat' }]),
      'chat'
    );
    assert.equal(
      inferTaskFromMessages([
        { role: 'user', content: 'Analyze why this is trending and predicted trajectory' },
      ]),
      'analysis'
    );
    assert.equal(
      inferTaskFromMessages([
        { role: 'user', content: 'Brand safety score and audience sentiment' },
      ]),
      'sentiment'
    );
    assert.equal(
      inferTaskFromMessages([{ role: 'user', content: 'Generate 5 content angles ready to post' }]),
      'ideas'
    );
  });
});
