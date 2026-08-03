import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/onboarding';
  }
  // Block protocol-relative and nested escapes
  if (next.includes('\\') || next.includes('@')) return '/onboarding';
  return next;
}

function trustedOrigin(requestOrigin: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!site) return requestOrigin;
  try {
    const allowed = new URL(site).origin;
    const incoming = new URL(requestOrigin).origin;
    if (incoming === allowed) return incoming;
    // Allow *.vercel.app previews when site is also vercel
    if (
      process.env.VERCEL === '1' &&
      incoming.endsWith('.vercel.app') &&
      allowed.endsWith('.vercel.app')
    ) {
      return incoming;
    }
    return allowed;
  } catch {
    return site;
  }
}

/**
 * Handles Supabase email confirmation / OAuth redirects.
 * Configure this URL in Supabase Auth → Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const origin = trustedOrigin(requestOrigin);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
