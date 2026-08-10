import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent, touchSession } from '@/lib/analytics/track';
import { heartbeatSession } from '@/lib/analytics/session';

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
    const isHeartbeat = eventName === 'session.heartbeat' || body.heartbeat === true;
    const isLogin = eventName === 'auth.login' || eventName === 'auth.signup';
    const activeMsDelta =
      typeof (properties as Record<string, unknown>).active_ms_delta === 'number'
        ? Number((properties as Record<string, unknown>).active_ms_delta)
        : 30_000;

    if (isHeartbeat && sessionId) {
      await heartbeatSession({
        sessionId,
        userId,
        userAgent: request.headers.get('user-agent'),
        pagePath,
        activeMsDelta,
      });
      return NextResponse.json({ ok: true });
    }

    if (isLogin && userId) {
      const { syncLastLoginAt } = await import('@/lib/analytics/session');
      await syncLastLoginAt(userId);
    }

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
            entryPath: isPageView ? pagePath : null,
            exitPath: pagePath,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics/event] error', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
