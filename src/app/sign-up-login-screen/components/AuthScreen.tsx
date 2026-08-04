'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, CheckCheck } from 'lucide-react';

import NemoWordmark from '@/components/ui/NemoWordmark';
import TrendSparkline from '@/components/ui/TrendSparkline';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup';

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const DEMO_CREDENTIALS =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ALLOW_DEMO_AUTH === 'true'
    ? [
        { role: 'Creator', email: 'priya.mehta@studio.in', password: 'Nemo@2026' },
        { role: 'Admin', email: 'admin@nemo.app', password: 'NEMO_MASTER_2026' },
      ]
    : [];

const TEASER_STATS = [
  { label: 'Trends tracked today', value: '2,847', sparkline: [20, 35, 28, 52, 71, 88, 91] },
  { label: 'Avg NEMO Score', value: '61.4', sparkline: [50, 55, 48, 60, 62, 58, 61] },
  { label: 'Creators active 24h', value: '38.2K', sparkline: [30, 42, 38, 45, 50, 48, 52] },
];

interface AuthScreenProps {
  initialMode?: AuthMode;
}

export default function AuthScreen({ initialMode = 'login' }: AuthScreenProps) {
  const searchParams = useSearchParams();
  const { signIn, signUp, supabaseReady } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup' || m === 'login') setMode(m);
    else if (initialMode) setMode(initialMode);
  }, [searchParams, initialMode]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>();
  const signupForm = useForm<SignupFormData>();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const result = await signIn(data.email, data.password);
    setIsLoading(false);
    if (result.error) {
      loginForm.setError('email', { message: result.error });
      return;
    }
    toast.success('Welcome back to NEMO');
    // Let middleware route: unverified → verify-email, incomplete → onboarding, else next/dashboard
    const next = searchParams.get('next') || '/dashboard';
    window.location.href = next;
  };

  const handleSignupSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (data.password.length < 6) {
      signupForm.setError('password', { message: 'Password must be at least 6 characters' });
      return;
    }
    setIsLoading(true);
    const result = await signUp(data.email, data.password, data.name);
    setIsLoading(false);
    if (result.error) {
      signupForm.setError('email', { message: result.error });
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nemo_pending_email', data.email);
      sessionStorage.setItem('nemo_pending_name', data.name);
    }
    if (result.needsVerification) {
      toast.success('Account created — verify your email to continue');
      window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
      return;
    }
    toast.success("Account created — let's set up your profile");
    window.location.href = '/onboarding';
  };

  const fillCredentials = (email: string, password: string) => {
    loginForm.setValue('email', email);
    loginForm.setValue('password', password);
    toast('Demo credentials filled — click Sign In', { icon: '✅' });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-shrink-0 flex-col relative overflow-hidden flame-gradient p-10">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <NemoWordmark size="lg" variant="onFlame" />
        </div>

        {/* Tagline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-6">
          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight">
              Catch the wave.
              <br />
              Before it crashes.
            </h2>
            <p className="mt-4 text-white/80 font-sans text-lg leading-relaxed">
              Real-time trend intelligence across Google, YouTube, Instagram & LinkedIn — powered by
              AI.
            </p>
          </div>

          {/* Live stats teaser */}
          <div className="flex flex-col gap-3">
            {TEASER_STATS.map((stat) => (
              <div
                key={`teaser-${stat.label}`}
                className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-white/70 text-xs font-sans uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-white font-mono-custom font-bold text-xl tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <TrendSparkline
                  data={stat.sparkline}
                  width={64}
                  height={28}
                  color="rgba(255,255,255,0.8)"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/50 text-xs font-sans">
          © 2026 NEMO · v1.0 · Made with 🔥 in India
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <NemoWordmark size="md" variant="onLight" />
        </div>

        <div className="w-full max-w-md">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-muted rounded-full p-1 mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-all duration-150 ${
                mode === 'login'
                  ? 'bg-primary text-white shadow-flame-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-all duration-150 ${
                mode === 'signup'
                  ? 'bg-primary text-white shadow-flame-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social auth */}
          <div className="flex flex-col gap-2 mb-6">
            <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm font-sans font-medium hover:bg-muted transition-all">
              <PlatformIcon platform="google" size={16} withTile={false} />
              Continue with Google
            </button>
            <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm font-sans font-medium hover:bg-muted transition-all">
              <PlatformIcon platform="linkedin" size={16} withTile={false} />
              Continue with LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-sans">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form
              onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...loginForm.register('email', { required: 'Email is required' })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400 font-sans">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginForm.register('password', { required: 'Password is required' })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400 font-sans">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...loginForm.register('remember')}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-sans text-muted-foreground">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-sans text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-flame w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  'Sign In to NEMO →'
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form
              onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Priya Mehta"
                  {...signupForm.register('name', { required: 'Name is required' })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...signupForm.register('email', { required: 'Email is required' })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    {...signupForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                    })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    {...signupForm.register('confirmPassword', {
                      required: 'Please confirm password',
                    })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-flame w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  'Start Trending Free →'
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground font-sans">
                By signing up you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          )}

          {/* Demo Credentials — development offline only (never shipped in prod bundle UI) */}
          {mode === 'login' && !supabaseReady && DEMO_CREDENTIALS.length > 0 && (
            <div className="mt-6 p-4 bg-muted border border-border rounded-xl">
              <p className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
                Demo Accounts
              </p>
              <div className="space-y-2">
                {DEMO_CREDENTIALS.map((cred) => (
                  <div
                    key={`demo-${cred.role}`}
                    className="flex items-center justify-between gap-2 p-2 bg-card rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono-custom text-primary font-bold mr-2">
                        {cred.role}
                      </span>
                      <span className="text-xs font-sans text-muted-foreground truncate">
                        {cred.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(cred.email, `${cred.role}-email`)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Copy email"
                      >
                        {copiedField === `${cred.role}-email` ? (
                          <CheckCheck size={12} className="text-accent" />
                        ) : (
                          <Copy size={12} className="text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => fillCredentials(cred.email, cred.password)}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-sans font-semibold hover:bg-primary/20 transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
