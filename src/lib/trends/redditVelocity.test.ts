import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeRedditVelocities,
  clusterByTitle,
  normalizeTitleTokens,
  extractCommentKeywords,
  crossSubredditCount,
} from './redditVelocity';
import type {
  RedditCurrentMetrics,
  RedditPostSnapshot,
  RedditClusterInput,
} from './redditVelocity';

// ---------------------------------------------------------------------------
// computeRedditVelocities
// ---------------------------------------------------------------------------

describe('computeRedditVelocities', () => {
  const prior: RedditPostSnapshot = {
    external_id: 'abc123',
    score: 1000,
    num_comments: 200,
    collected_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  };

  it('returns correct per-window velocities for 1-hour delta', () => {
    const current: RedditCurrentMetrics = {
      score: 1600,
      num_comments: 260,
      collected_at: new Date().toISOString(),
    };
    const v = computeRedditVelocities(current, prior);
    assert.ok(v !== null, 'should return velocities');
    // Δscore = 600, Δhours ≈ 1 → rate ≈ 600/hr
    // 5-min window: 600 * (5/60) = 50
    assert.equal(v!.score_velocity_5min, 50);
    // 15-min window: 600 * (15/60) = 150
    assert.equal(v!.score_velocity_15min, 150);
    // 60-min window: 600
    assert.equal(v!.score_velocity_60min, 600);
    // comment velocity: 60 comments / 1 hr = 60
    assert.equal(v!.comment_velocity, 60);
  });

  it('returns null when time delta is under 10 seconds', () => {
    const now = new Date().toISOString();
    const current: RedditCurrentMetrics = { score: 1100, num_comments: 210, collected_at: now };
    const tooRecent: RedditPostSnapshot = {
      ...prior,
      collected_at: now,
    };
    assert.equal(computeRedditVelocities(current, tooRecent), null);
  });

  it('floors velocity to 0 when score decreases', () => {
    const current: RedditCurrentMetrics = {
      score: 900,
      num_comments: 180,
      collected_at: new Date().toISOString(),
    };
    const v = computeRedditVelocities(current, prior);
    assert.ok(v !== null);
    assert.equal(v!.score_velocity_5min, 0);
    assert.equal(v!.score_velocity_60min, 0);
    assert.equal(v!.comment_velocity, 0);
  });

  it('returns null for invalid collected_at timestamps', () => {
    const current: RedditCurrentMetrics = {
      score: 1200,
      num_comments: 220,
      collected_at: 'not-a-date',
    };
    assert.equal(computeRedditVelocities(current, prior), null);
  });

  it('handles fractional hour deltas correctly', () => {
    // 30-minute delta, Δscore = 300
    const priorHalf: RedditPostSnapshot = {
      external_id: 'xyz',
      score: 500,
      num_comments: 50,
      collected_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    };
    const current: RedditCurrentMetrics = {
      score: 800,
      num_comments: 80,
      collected_at: new Date().toISOString(),
    };
    const v = computeRedditVelocities(current, priorHalf);
    assert.ok(v !== null);
    // Δhours = 0.5, scorePerHour = 300 / 0.5 = 600
    assert.equal(v!.score_velocity_60min, 600);
    assert.equal(v!.score_velocity_5min, 50);
    // commentPerHour = 30 / 0.5 = 60
    assert.equal(v!.comment_velocity, 60);
  });
});

// ---------------------------------------------------------------------------
// normalizeTitleTokens
// ---------------------------------------------------------------------------

describe('normalizeTitleTokens', () => {
  it('lowercases and removes punctuation', () => {
    const tokens = normalizeTitleTokens('Hello, World!');
    assert.ok(tokens.includes('hello'));
    assert.ok(tokens.includes('world'));
  });

  it('removes stopwords', () => {
    const tokens = normalizeTitleTokens('The quick brown fox');
    assert.ok(!tokens.includes('the'));
    assert.ok(tokens.includes('quick'));
    assert.ok(tokens.includes('brown'));
    assert.ok(tokens.includes('fox'));
  });

  it('filters tokens shorter than 3 characters', () => {
    const tokens = normalizeTitleTokens('AI is a big deal');
    assert.ok(!tokens.includes('is'));
    assert.ok(!tokens.includes('a'));
    assert.ok(tokens.includes('big'));
    assert.ok(tokens.includes('deal'));
  });

  it('returns sorted tokens', () => {
    const tokens = normalizeTitleTokens('banana apple cherry');
    assert.deepEqual(tokens, [...tokens].sort());
  });

  it('deduplicates repeated tokens', () => {
    const tokens = normalizeTitleTokens('cat cat cat');
    assert.equal(tokens.filter((t) => t === 'cat').length, 1);
  });
});

// ---------------------------------------------------------------------------
// clusterByTitle
// ---------------------------------------------------------------------------

describe('clusterByTitle', () => {
  it('clusters two posts with shared title tokens under one root', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'p1', title: 'OpenAI releases ChatGPT update', subreddit: 'technology' },
      { external_id: 'p2', title: 'OpenAI ChatGPT major update released', subreddit: 'artificial' },
      { external_id: 'p3', title: 'Local cat video goes viral', subreddit: 'aww' },
    ];
    const clusters = clusterByTitle(posts, 2);

    // p1 and p2 share "openai", "chatgpt", "update" (≥2 tokens) → should be in same cluster
    const allRoots = [...clusters.keys()];
    const clusterWithBothSubs = [...clusters.values()].find(
      (subs) => subs.has('technology') && subs.has('artificial')
    );
    assert.ok(clusterWithBothSubs !== undefined, 'p1 and p2 should share a cluster');
    assert.equal(clusterWithBothSubs.size, 2);

    // p3 should be isolated
    const catCluster = [...clusters.values()].find(
      (subs) => subs.has('aww') && !subs.has('technology')
    );
    assert.ok(catCluster !== undefined, 'p3 should be in its own cluster');
    assert.equal(catCluster.size, 1);
    void allRoots;
  });

  it('returns each post in its own cluster when no titles share tokens', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'a', title: 'zebra migration season', subreddit: 'animals' },
      { external_id: 'b', title: 'rocket launch success', subreddit: 'space' },
      { external_id: 'c', title: 'chocolate cake recipe', subreddit: 'food' },
    ];
    const clusters = clusterByTitle(posts, 2);
    const allSets = [...clusters.values()];
    // Every cluster should be size 1 (all different topics)
    for (const s of allSets) {
      assert.equal(s.size, 1);
    }
  });

  it('merges three posts about the same story from different subreddits', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'x1', title: 'SpaceX Starship launch successful', subreddit: 'spacex' },
      { external_id: 'x2', title: 'SpaceX Starship successful launch', subreddit: 'space' },
      {
        external_id: 'x3',
        title: 'Starship SpaceX launches successfully',
        subreddit: 'technology',
      },
    ];
    const clusters = clusterByTitle(posts, 2);
    const bigCluster = [...clusters.values()].find((s) => s.size === 3);
    assert.ok(bigCluster !== undefined, 'all three should cluster together');
  });

  it('returns empty map for empty input', () => {
    const clusters = clusterByTitle([]);
    assert.equal(clusters.size, 0);
  });
});

// ---------------------------------------------------------------------------
// crossSubredditCount
// ---------------------------------------------------------------------------

describe('crossSubredditCount', () => {
  it('returns the count of distinct subreddits for a clustered post', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'p1', title: 'OpenAI releases ChatGPT update', subreddit: 'technology' },
      { external_id: 'p2', title: 'OpenAI ChatGPT major update released', subreddit: 'artificial' },
    ];
    const clusters = clusterByTitle(posts, 2);
    const count = crossSubredditCount('p1', posts, clusters);
    assert.equal(count, 2);
  });

  it('returns 1 for an isolated post', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'solo', title: 'unique post about nothing relevant', subreddit: 'misc' },
    ];
    const clusters = clusterByTitle(posts, 2);
    const count = crossSubredditCount('solo', posts, clusters);
    assert.equal(count, 1);
  });

  it('returns 1 for an unknown external_id', () => {
    const posts: RedditClusterInput[] = [
      { external_id: 'known', title: 'some title here today', subreddit: 'sub' },
    ];
    const clusters = clusterByTitle(posts, 2);
    assert.equal(crossSubredditCount('unknown_id', posts, clusters), 1);
  });
});

// ---------------------------------------------------------------------------
// extractCommentKeywords
// ---------------------------------------------------------------------------

describe('extractCommentKeywords', () => {
  it('returns top-N keywords by frequency', () => {
    const comments = [
      'This is amazing news about quantum computing',
      'Quantum computing will change everything',
      'I love computing and quantum physics',
      'Great news for the quantum field',
    ];
    const keywords = extractCommentKeywords(comments, 3);
    assert.equal(keywords.length, 3);
    assert.ok(keywords.includes('quantum'), 'quantum should be top keyword');
    assert.ok(keywords.includes('computing'), 'computing should rank highly');
  });

  it('filters out stopwords', () => {
    const comments = ['The and or but in on at to for of with by from', 'apple banana cherry'];
    const keywords = extractCommentKeywords(comments, 5);
    for (const kw of keywords) {
      assert.ok(kw.length >= 3, `keyword "${kw}" is too short`);
      assert.ok(!['the', 'and', 'for', 'with'].includes(kw), `stopword "${kw}" should not appear`);
    }
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(extractCommentKeywords([]), []);
  });

  it('counts each keyword at most once per comment (document frequency)', () => {
    // "spam" repeated 10x in one comment but appears in only 1 doc
    // "signal" appears once each in 3 comments
    const comments = [
      'spam spam spam spam spam spam spam spam spam spam',
      'signal shows promise here',
      'signal detected again today',
      'signal patterns emerging fast',
    ];
    const keywords = extractCommentKeywords(comments, 2);
    assert.equal(keywords[0], 'signal', 'signal (3 docs) should rank above spam (1 doc)');
  });

  it('respects the limit parameter', () => {
    const comments = ['alpha beta gamma delta epsilon zeta eta theta'];
    const kws = extractCommentKeywords(comments, 2);
    assert.equal(kws.length, 2);
  });

  it('handles comments with only stopwords gracefully', () => {
    const comments = ['the and or but', 'is are was were'];
    const keywords = extractCommentKeywords(comments, 3);
    assert.deepEqual(keywords, []);
  });
});
