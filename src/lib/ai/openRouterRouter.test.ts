import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFreeModelChain,
  inferTaskFromMessages,
  isOpenRouterAllowedModel,
  isOpenRouterFreeModel,
  isOpenRouterPrivacyBlock,
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

  it('allows ultra-cheap paid twins used as privacy fallbacks', () => {
    assert.equal(isOpenRouterAllowedModel('google/gemma-4-31b-it'), true);
    assert.equal(isOpenRouterAllowedModel('meta-llama/llama-3.1-8b-instruct'), true);
    assert.equal(isOpenRouterAllowedModel('anthropic/claude-sonnet-4'), false);
  });

  it('builds a quality-first chain that includes a non-free fallback within 3 slots', () => {
    const chain = getFreeModelChain('script');
    assert.ok(chain.length >= 2 && chain.length <= OPENROUTER_MAX_MODELS);
    assert.ok(chain.some((id) => !id.endsWith(':free') && id !== 'openrouter/free'));
    for (const id of chain) {
      assert.equal(isOpenRouterAllowedModel(id), true, id);
    }
  });

  it('puts a free model first for script when available', () => {
    const script = getFreeModelChain('script');
    assert.equal(isOpenRouterFreeModel(script[0]), true);
  });

  it('prefers AI_MODEL when it is an allowlisted free id', () => {
    const preferred = OPENROUTER_FREE_MODELS.find((id) => id.endsWith(':free'))!;
    const chain = getFreeModelChain('chat', preferred);
    assert.equal(chain[0], preferred);
    assert.ok(chain.length <= OPENROUTER_MAX_MODELS);
  });

  it('ignores paid preferred models that are not allowlisted', () => {
    const chain = getFreeModelChain('analysis', 'anthropic/claude-3.5-sonnet');
    assert.notEqual(chain[0], 'anthropic/claude-3.5-sonnet');
    assert.equal(isOpenRouterAllowedModel(chain[0]), true);
  });

  it('selectOpenRouterRoute returns agent decision metadata', () => {
    const route = selectOpenRouterRoute('SCRIPT');
    assert.equal(route.task, 'script');
    assert.equal(route.strategy, 'quality_first_retry_fallback');
    assert.equal(route.primary, route.models[0]);
    assert.ok(route.reason.length > 10);
    assert.equal(OPENROUTER_ATTEMPTS_PER_MODEL, 2);
  });

  it('detects OpenRouter privacy/guardrail blocks', () => {
    assert.equal(
      isOpenRouterPrivacyBlock(
        new Error(
          'No endpoints available matching your guardrail restrictions and data policy. Configure: https://openrouter.ai/settings/privacy'
        )
      ),
      true
    );
    assert.equal(isOpenRouterPrivacyBlock(new Error('rate limit')), false);
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
