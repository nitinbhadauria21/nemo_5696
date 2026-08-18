const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function isRealHttpUrl(value: string | null | undefined): boolean {
  const v = typeof value === 'string' ? value.trim() : '';
  return /^https?:\/\//i.test(v);
}

export function youtubeVideoIdFrom(value?: string | null): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  const fromUrl = raw.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
  );
  if (fromUrl?.[1]) return fromUrl[1];

  const param = raw.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (param?.[1]) return param[1];

  // Raw ids: require a digit or uppercase so English placeholders like "not-a-video" are rejected.
  if (YT_ID.test(raw) && /[A-Z0-9]/.test(raw)) return raw;
  return null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function isRealSourceMedia(input: {
  url?: string | null;
  thumbnail?: string | null;
}): boolean {
  return isRealHttpUrl(input.url) || isRealHttpUrl(input.thumbnail);
}

export function sourceCaption(input: {
  url?: string | null;
  views?: string | null;
  creator?: string | null;
}): string {
  const views = typeof input.views === 'string' ? input.views.trim() : '';
  const creator = typeof input.creator === 'string' ? input.creator.trim() : '';
  const dead = !views || /^source$/i.test(views) || views === '—' || views === '-';
  if (!dead && views) return views;
  if (creator) return `by ${creator}`;
  if (isRealHttpUrl(input.url)) return 'View post';
  return '';
}
