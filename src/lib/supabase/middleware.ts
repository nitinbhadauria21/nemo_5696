import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

function allowLocalDemoAuth() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return false;
  return process.env.ALLOW_DEMO_AUTH === 'true';
}

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/sign-up-login-screen',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/pricing',
  '/payment-success',
  '/admin/login',
];

const AUTH_FLOW_PATHS = [
  '/verify-email',
  '/onboarding',
  '/login',
  '/signup',
  '/sign-up-login-screen',
  '/auth/callback',
];

/** Redirect while keeping any cookies Supabase wrote onto supabaseResponse. */
function redirectWithSession(url: URL, supabaseResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value);
  });
  return redirect;
}

function isPublicPath(path: string) {
  return (
    PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path.startsWith('/api/') ||
    path.startsWith('/_next') ||
    path.includes('.')
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isPublic = isPublicPath(path);

  if (!isSupabaseConfigured()) {
    // Production / Vercel must never skip auth due to missing env
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
      }
      return new NextResponse('Service unavailable — authentication is misconfigured.', {
        status: 503,
      });
    }
    // Local offline: only allow protected app routes when demo auth is explicitly enabled
    if (!allowLocalDemoAuth() && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? '/admin/login' : '/login';
      if (!isAdminRoute) url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? '/admin/login' : '/login';
    if (!isAdminRoute) url.searchParams.set('next', path);
    return redirectWithSession(url, supabaseResponse);
  }

  // Admin UI requires an authenticated user; is_admin is enforced in API routes
  if (isAdminRoute && path !== '/admin/login' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return redirectWithSession(url, supabaseResponse);
  }

  if (user) {
    const onAuthFlow = AUTH_FLOW_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

    if (
      !user.email_confirmed_at &&
      !path.startsWith('/verify-email') &&
      !path.startsWith('/api/') &&
      !path.startsWith('/admin') &&
      // Always allow login/signup so CTAs are never bounced to a guest dashboard
      path !== '/login' &&
      path !== '/signup' &&
      path !== '/sign-up-login-screen'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/verify-email';
      if (user.email) url.searchParams.set('email', user.email);
      return redirectWithSession(url, supabaseResponse);
    }

    if (
      user.email_confirmed_at &&
      !onAuthFlow &&
      !path.startsWith('/api/') &&
      !path.startsWith('/admin')
    ) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      if (
        profile &&
        profile.onboarding_complete === false &&
        !path.startsWith('/onboarding') &&
        !path.startsWith('/reset-password') &&
        !path.startsWith('/forgot-password')
      ) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return redirectWithSession(url, supabaseResponse);
      }
    }

    // Do NOT server-redirect /login or /signup → /dashboard.
    // That bounce hid the auth UI and, when the browser client failed to
    // hydrate the session, left users on the dashboard labeled "Guest".
    // AuthScreen redirects client-side only after useAuth confirms a user.
  }

  return supabaseResponse;
}
