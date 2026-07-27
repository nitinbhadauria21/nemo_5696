import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
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

  const path = request.nextUrl.pathname;
  const hasAdminSession = Boolean(request.cookies.get('nemo_admin_session')?.value);
  const isAdminRoute = path.startsWith('/admin');
  const isPublic =
    PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path.startsWith('/api/') ||
    path.startsWith('/_next') ||
    path.includes('.') ||
    (isAdminRoute && hasAdminSession);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? '/admin/login' : '/login';
    if (!isAdminRoute) url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (user) {
    const onAuthFlow = AUTH_FLOW_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

    if (
      !user.email_confirmed_at &&
      !path.startsWith('/verify-email') &&
      !path.startsWith('/api/') &&
      !path.startsWith('/admin')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/verify-email';
      if (user.email) url.searchParams.set('email', user.email);
      return NextResponse.redirect(url);
    }

    if (user.email_confirmed_at && !onAuthFlow && !path.startsWith('/api/') && !path.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.onboarding_complete === false && !path.startsWith('/onboarding')) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    }

    if (onAuthFlow && path !== '/onboarding' && path !== '/verify-email') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.onboarding_complete && (path === '/login' || path === '/signup' || path === '/sign-up-login-screen')) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
