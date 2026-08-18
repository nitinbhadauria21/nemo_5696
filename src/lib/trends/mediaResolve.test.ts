import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isRealHttpUrl,
  isRealSourceMedia,
  sourceCaption,
  youtubeThumbnailUrl,
  youtubeVideoIdFrom,
  youtubeWatchUrl,
} from './mediaResolve';

describe('youtubeVideoIdFrom', () => {
  it('extracts ids from watch, shorts, youtu.be, and raw ids', () => {
    assert.equal(youtubeVideoIdFrom('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(youtubeVideoIdFrom('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(youtubeVideoIdFrom('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(youtubeVideoIdFrom('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('returns null for missing or non-youtube values', () => {
    assert.equal(youtubeVideoIdFrom(null), null);
    assert.equal(youtubeVideoIdFrom(''), null);
    assert.equal(youtubeVideoIdFrom('not-a-video'), null);
    assert.equal(youtubeVideoIdFrom('https://instagram.com/p/abc'), null);
  });
});

describe('youtube media URLs', () => {
  it('builds a real watch URL and i.ytimg thumbnail from an id', () => {
    assert.equal(youtubeWatchUrl('dQw4w9WgXcQ'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(
      youtubeThumbnailUrl('dQw4w9WgXcQ'),
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    );
  });
});

describe('isRealSourceMedia', () => {
  it('is true when url or thumbnail is a real http(s) URL', () => {
    assert.equal(isRealSourceMedia({ url: 'https://youtube.com/watch?v=abc' }), true);
    assert.equal(
      isRealSourceMedia({ thumbnail: 'https://i.ytimg.com/vi/abc/hqdefault.jpg' }),
      true
    );
    assert.equal(isRealSourceMedia({ url: null, thumbnail: null }), false);
    assert.equal(isRealSourceMedia({ url: '', thumbnail: 'Source' }), false);
  });
});

describe('sourceCaption', () => {
  it('never labels a linked post as Source', () => {
    assert.equal(sourceCaption({ url: 'https://youtu.be/abc', views: 'Source' }), 'View post');
    assert.equal(sourceCaption({ url: 'https://youtu.be/abc', creator: 'Ada' }), 'by Ada');
    assert.equal(sourceCaption({ url: 'https://youtu.be/abc', views: '12K views' }), '12K views');
  });

  it('omits the dead Source label when there is no url', () => {
    assert.equal(sourceCaption({ views: 'Source' }), '');
    assert.equal(sourceCaption({ creator: 'Ada' }), 'by Ada');
  });
});

describe('isRealHttpUrl', () => {
  it('rejects placeholders', () => {
    assert.equal(isRealHttpUrl('https://i.ytimg.com/vi/x/hqdefault.jpg'), true);
    assert.equal(isRealHttpUrl('Source'), false);
    assert.equal(isRealHttpUrl(''), false);
  });
});
