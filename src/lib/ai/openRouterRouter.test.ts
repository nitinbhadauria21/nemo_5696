import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFreeModelChain,
  inferTaskFromMessages,
  isOpenRouterAllowedModel,
  isOpenRouterFreeModel,
  isOpenRouterPaidFallbackAllowed,
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
    assert.equal(isOpenRouterFreeModel('google/gemma-4-31b-it'), false);
  });

  it('allowlists ultra-cheap paid twins for emergency use', () => {
    assert.equal(isOpenRouterAllowedModel('google/gemma-4-31b-it'), true);
    assert.equal(isOpenRouterAllowedModel('meta-llama/llama-3.1-8b-instruct'), true);
    assert.equal(isOpenRouterAllowedModel('anthropic/claude-sonnet-4'), false);
  });

  it('defaults paid fallback off unless OPENROUTER_ALLOW_PAID_FALLBACK=true', () => {
    assert.equal(isOpenRouterPaidFallbackAllowed({}), false);
    assert.equal(
      isOpenRouterPaidFallbackAllowed({ OPENROUTER_ALLOW_PAID_FALLBACK: 'false' }),
      false
    );
    assert.equal(isOpenRouterPaidFallbackAllowed({ OPENROUTER_ALLOW_PAID_FALLBACK: 'true' }), true);
    assert.equal(isOpenRouterPaidFallbackAllowed({ OPENROUTER_ALLOW_PAID_FALLBACK: 'TRUE' }), true);
  });

  it('builds a free-only quality-first chain by default', () => {
    const chain = getFreeModelChain('script', null, {});
    assert.ok(chain.length >= 2 && chain.length <= OPENROUTER_MAX_MODELS);
    assert.ok(
      chain.every((id) => isOpenRouterFreeModel(id)),
      chain.join(',')
    );
    for (const id of chain) {
      assert.equal(isOpenRouterAllowedModel(id), true, id);
    }
  });

  it('includes cheap paid twins only when paid fallback env is enabled', () => {
    const freeOnly = getFreeModelChain('script', null, {});
    assert.ok(freeOnly.every((id) => isOpenRouterFreeModel(id)));

    const withPaid = getFreeModelChain('script', null, {
      OPENROUTER_ALLOW_PAID_FALLBACK: 'true',
    });
    assert.equal(isOpenRouterFreeModel(withPaid[0]), true);
    assert.ok(
      withPaid.some((id) => !isOpenRouterFreeModel(id)),
      withPaid.join(',')
    );
    assert.ok(withPaid.length <= OPENROUTER_MAX_MODELS);
  });

  it('puts a free model first for script when available', () => {
    const script = getFreeModelChain('script', null, {});
    assert.equal(isOpenRouterFreeModel(script[0]), true);
  });

  it('prefers AI_MODEL when it is an allowlisted free id', () => {
    const preferred = OPENROUTER_FREE_MODELS.find((id) => id.endsWith(':free'))!;
    const chain = getFreeModelChain('chat', preferred, {});
    assert.equal(chain[0], preferred);
    assert.ok(chain.length <= OPENROUTER_MAX_MODELS);
  });

  it('ignores paid preferred models when paid fallback is off', () => {
    const chain = getFreeModelChain('analysis', 'google/gemma-4-31b-it', {});
    assert.notEqual(chain[0], 'google/gemma-4-31b-it');
    assert.equal(isOpenRouterFreeModel(chain[0]), true);
  });

  it('ignores paid preferred models that are not allowlisted', () => {
    const chain = getFreeModelChain('analysis', 'anthropic/claude-3.5-sonnet', {});
    assert.notEqual(chain[0], 'anthropic/claude-3.5-sonnet');
    assert.equal(isOpenRouterAllowedModel(chain[0]), true);
  });

  it('selectOpenRouterRoute returns agent decision metadata', () => {
    const route = selectOpenRouterRoute('SCRIPT', null, {});
    assert.equal(route.task, 'script');
    assert.equal(route.strategy, 'quality_first_retry_fallback');
    assert.equal(route.primary, route.models[0]);
    assert.equal(route.paidFallbackEnabled, false);
    assert.ok(route.models.every((id) => isOpenRouterFreeModel(id)));
    assert.ok(route.reason.length > 10);
    assert.equal(OPENROUTER_ATTEMPTS_PER_MODEL, 1);
  });

  it('prefers free Google Gemma for script, then a non-Google free fallback', () => {
    const script = getFreeModelChain('script', null, {});
    assert.equal(script[0], 'google/gemma-4-26b-a4b-it:free');
    assert.equal(script[1], 'google/gemma-4-31b-it:free');
    assert.ok(script.some((id) => id.endsWith(':free') && !id.startsWith('google/')));
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
