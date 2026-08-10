import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFreeModelChain,
  inferTaskFromMessages,
  isOpenRouterFreeModel,
  OPENROUTER_FREE_MODELS,
  resolveOpenRouterTask,
} from './openRouterRouter';

describe('openRouterRouter', () => {
  it('only treats free / openrouter/free ids as free', () => {
    assert.equal(isOpenRouterFreeModel('google/gemma-4-31b-it:free'), true);
    assert.equal(isOpenRouterFreeModel('openrouter/free'), true);
    assert.equal(isOpenRouterFreeModel('anthropic/claude-sonnet-4'), false);
    assert.equal(isOpenRouterFreeModel('gpt-4o'), false);
  });

  it('builds a 2–3 model chain per task', () => {
    const chain = getFreeModelChain('script');
    assert.ok(chain.length >= 2 && chain.length <= 3);
    for (const id of chain) {
      assert.equal(isOpenRouterFreeModel(id), true);
    }
  });

  it('prefers AI_MODEL when it is an allowlisted free id', () => {
    const preferred = OPENROUTER_FREE_MODELS.find((id) => id.endsWith(':free'))!;
    const chain = getFreeModelChain('chat', preferred);
    assert.equal(chain[0], preferred);
    assert.ok(chain.length <= 3);
  });

  it('ignores paid preferred models', () => {
    const chain = getFreeModelChain('analysis', 'anthropic/claude-3.5-sonnet');
    assert.notEqual(chain[0], 'anthropic/claude-3.5-sonnet');
    assert.equal(isOpenRouterFreeModel(chain[0]), true);
  });

  it('resolves and infers tasks', () => {
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
  });
});
