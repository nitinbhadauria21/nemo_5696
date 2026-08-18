import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { untilRealResult } from './untilRealResult';

const noSleep = async () => {};

describe('untilRealResult', () => {
  it('returns the result on the 3rd try when earlier attempts are empty', async () => {
    let calls = 0;
    const result = await untilRealResult({
      attempts: 5,
      delayMs: 0,
      sleep: noSleep,
      isReal: (value) => typeof value === 'string' && value.trim().length > 0,
      run: async () => {
        calls += 1;
        return calls === 3 ? 'real-output' : '';
      },
    });
    assert.equal(result, 'real-output');
    assert.equal(calls, 3);
  });

  it('gives up after max attempts and returns undefined', async () => {
    let calls = 0;
    const result = await untilRealResult({
      attempts: 4,
      delayMs: 0,
      sleep: noSleep,
      isReal: (value) => Array.isArray(value) && value.length > 0,
      run: async () => {
        calls += 1;
        return [];
      },
    });
    assert.equal(result, undefined);
    assert.equal(calls, 4);
  });

  it('does not accept empty or placeholder results as real', async () => {
    const placeholders = ['', '   ', 'Source', 'GLOBAL', 'n/a', null, undefined];
    let i = 0;
    const result = await untilRealResult({
      attempts: placeholders.length,
      delayMs: 0,
      sleep: noSleep,
      isReal: (value) => {
        if (value == null) return false;
        const t = String(value).trim();
        if (!t) return false;
        return !/^(source|global|n\/a)$/i.test(t);
      },
      run: async () => placeholders[i++] as string | null | undefined,
    });
    assert.equal(result, undefined);
  });

  it('tries fallback runners after the primary run is exhausted', async () => {
    let primary = 0;
    let fallback = 0;
    const result = await untilRealResult({
      attempts: 2,
      delayMs: 0,
      sleep: noSleep,
      isReal: (value) => value === 'from-fallback',
      run: async () => {
        primary += 1;
        return 'empty';
      },
      fallbacks: [
        async () => {
          fallback += 1;
          return fallback === 2 ? 'from-fallback' : 'still-empty';
        },
      ],
    });
    assert.equal(result, 'from-fallback');
    assert.equal(primary, 2);
    assert.equal(fallback, 2);
  });
});
