import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TrendItem } from '../mockData';
import { mapTrendSourceRows, mergeSourceMediaPatch } from './persist';

function makeTrend(overrides: Partial<TrendItem> & { id: string }): TrendItem {
  return {
    title: 'Test trend',
    category: 'Fashion',
    status: 'rising',
    nemoScore: 50,
    cvs: 1,
    ss: 1,
    cps: 1,
    freshness: 1,
    freshnessMultiplier: 1,
    platforms: ['instagram'],
    creatorsCount: 1,
    mentions24h: 1,
    mentionsPrev24h: 1,
    creatorsLast6h: 1,
    creatorsLast24h: 1,
    creatorsLast72h: 1,
    sparklineData: [1],
    timeAgo: '1h ago',
    firstDetectedAt: new Date().toISOString(),
    hashtags: ['#ig'],
    description: '',
    isBookmarked: false,
    velocity: 1,
    spike: 1,
    contentType: 'TOPIC',
    ...overrides,
  };
}

const NOW = '2026-08-18T12:00:00.000Z';

describe('mapTrendSourceRows', () => {
  it('stores Instagram url and thumbnail from topContent', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'ig-1',
          sourceUrl: 'https://www.instagram.com/p/ABC/',
          topContent: [
            {
              id: 'media-1',
              title: 'Caption slice',
              views: '1200',
              platform: 'instagram',
              url: 'https://www.instagram.com/p/ABC/',
              thumbnail: 'https://scontent.cdninstagram.com/v/t51.2885-15/thumb.jpg',
            },
          ],
        }),
      ],
      NOW
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0].url, 'https://www.instagram.com/p/ABC/');
    assert.equal(rows[0].platform, 'instagram');
    assert.equal(rows[0].external_id, 'media-1');
    assert.deepEqual(rows[0].metadata, {
      views: '1200',
      historical: false,
      thumbnail: 'https://scontent.cdninstagram.com/v/t51.2885-15/thumb.jpg',
    });
  });

  it('falls back to trend.sourceUrl when item.url is missing', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'yt-1',
          platforms: ['youtube'],
          sourceUrl: 'https://www.youtube.com/watch?v=abc',
          topContent: [
            {
              id: 'vid',
              title: 'Video',
              views: '99',
              platform: 'youtube',
            },
          ],
        }),
      ],
      NOW
    );

    assert.equal(rows[0].url, 'https://www.youtube.com/watch?v=abc');
    assert.equal(rows[0].platform, 'youtube');
  });

  it('sets url null when permalink and sourceUrl are unknown', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'unk-1',
          topContent: [{ id: 'x', title: 'No link', views: '1', platform: 'instagram' }],
        }),
      ],
      NOW
    );

    assert.equal(rows[0].url, null);
    assert.deepEqual(rows[0].metadata, { views: '1', historical: false });
  });

  it('omits empty thumbnail from metadata', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'ig-2',
          topContent: [
            {
              id: 'm',
              title: 'Post',
              views: '10',
              platform: 'instagram',
              url: 'https://instagram.com/p/x',
              thumbnail: '',
            },
          ],
        }),
      ],
      NOW
    );

    const meta = rows[0].metadata as Record<string, unknown>;
    assert.equal('thumbnail' in meta, false);
    assert.equal(meta.views, '10');
  });

  it('decodes Reddit permalink from views JSON and stores thumbnail', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'r-1',
          platforms: ['reddit'],
          topContent: [
            {
              id: 'post1',
              title: 'Reddit post',
              views: JSON.stringify({
                score: 100,
                permalink: '/r/test/comments/abc/hello/',
                subreddit: 'test',
              }),
              platform: 'reddit',
              thumbnail: 'https://preview.redd.it/abc.jpg',
            },
          ],
        }),
      ],
      NOW
    );

    assert.equal(rows[0].url, 'https://reddit.com/r/test/comments/abc/hello/');
    const meta = rows[0].metadata as Record<string, unknown>;
    assert.equal(meta.thumbnail, 'https://preview.redd.it/abc.jpg');
    assert.equal(meta.score, 100);
    assert.equal(meta.historical, false);
    assert.equal(meta.permalink, undefined);
  });

  it('prefers item.url over Reddit JSON permalink', () => {
    const rows = mapTrendSourceRows(
      [
        makeTrend({
          id: 'r-2',
          platforms: ['reddit'],
          sourceUrl: 'https://reddit.com/r/fallback',
          topContent: [
            {
              id: 'post2',
              title: 'Linked post',
              views: JSON.stringify({ permalink: '/r/test/comments/xyz/' }),
              platform: 'reddit',
              url: 'https://www.reddit.com/r/test/comments/xyz/custom/',
            },
          ],
        }),
      ],
      NOW
    );

    assert.equal(rows[0].url, 'https://www.reddit.com/r/test/comments/xyz/custom/');
  });

  it('merges url and thumbnail onto an existing source without dropping metadata', () => {
    const merged = mergeSourceMediaPatch(
      { url: null, metadata: { views: '9K', historical: false } },
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      }
    );
    assert.equal(merged.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(merged.metadata.views, '9K');
    assert.equal(merged.metadata.thumbnail, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});
