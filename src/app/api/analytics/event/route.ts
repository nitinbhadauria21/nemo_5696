import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent, touchSession } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventName = String(body.event_name ?? body.eventName ?? '').trim();
    if (!eventName) {
      return NextResponse.json({ error: 'event_name required' }, { status: 400 });
    }

    const userId = await getAuthUserId();
    const sessionId =
      (typeof body.session_id === 'string' && body.session_id) ||
      (typeof body.sessionId === 'string' && body.sessionId) ||
      null;
    const eventCategory =
      (typeof body.event_category === 'string' && body.event_category) ||
      (typeof body.eventCategory === 'string' && body.eventCategory) ||
      null;
    const pagePath =
      (typeof body.page_path === 'string' && body.page_path) ||
      (typeof body.pagePath === 'string' && body.pagePath) ||
      null;
    const properties =
      body.properties && typeof body.properties === 'object' ? body.properties : {};

    const isPageView = eventName === 'page.view' || eventCategory === 'page';

    await Promise.all([
      trackEvent({
        userId,
        sessionId,
        eventName,
        eventCategory: eventCategory || (isPageView ? 'page' : null),
        pagePath,
        properties,
        request,
      }),
      sessionId
        ? touchSession({
            sessionId,
            userId,
            request,
            incrementPage: isPageView,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics/event] error', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
