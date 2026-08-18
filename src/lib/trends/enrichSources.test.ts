import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enrichSourceMedia } from './enrichSources';

const noSleep = async () => {};

describe('enrichSourceMedia', () => {
  it('fills YouTube watch URL and i.ytimg thumbnail from a video id', async () => {
    const result = await enrichSourceMedia({
      platform: 'youtube',
      title: "How to make your stale Fry's Crispy",
      externalId: 'dQw4w9WgXcQ',
      sleep: noSleep,
    });
    assert.equal(result.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(result.thumbnail, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('searches YouTube by title when id and url are missing', async () => {
    let searches = 0;
    const result = await enrichSourceMedia({
      platform: 'youtube',
      title: "How to make your stale Fry's Crispy",
      attempts: 3,
      delayMs: 0,
      sleep: noSleep,
      searchYouTube: async (q) => {
        searches += 1;
        assert.ok(q.includes('Crispy'));
        if (searches < 2) return null;
        return { id: 'abcABCabcAB', url: 'https://www.youtube.com/watch?v=abcABCabcAB' };
      },
    });
    assert.equal(searches, 2);
    assert.equal(result.url, 'https://www.youtube.com/watch?v=abcABCabcAB');
    assert.equal(result.thumbnail, 'https://i.ytimg.com/vi/abcABCabcAB/hqdefault.jpg');
  });

  it('keeps a real url even when thumbnail lookup fails', async () => {
    const result = await enrichSourceMedia({
      platform: 'youtube',
      title: 'Linked video',
      url: 'https://www.youtube.com/watch?v=zzzzzzzzzzz',
      sleep: noSleep,
    });
    assert.equal(result.url, 'https://www.youtube.com/watch?v=zzzzzzzzzzz');
    assert.equal(result.thumbnail, 'https://i.ytimg.com/vi/zzzzzzzzzzz/hqdefault.jpg');
  });

  it('returns empty media when every real lookup fails (no fake post)', async () => {
    const result = await enrichSourceMedia({
      platform: 'youtube',
      title: 'Unknown clip',
      attempts: 2,
      delayMs: 0,
      sleep: noSleep,
      searchYouTube: async () => null,
    });
    assert.equal(result.url, undefined);
    assert.equal(result.thumbnail, undefined);
  });
});
