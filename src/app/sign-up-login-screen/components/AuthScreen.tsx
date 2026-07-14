'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, CheckCheck } from 'lucide-react';

import AppImage from '@/components/ui/AppImage';
import TrendSparkline from '@/components/ui/TrendSparkline';

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

const DEMO_CREDENTIALS = [
  { role: 'Creator', email: 'priya.mehta@studio.in', password: 'Nemo@2026' },
  { role: 'Admin', email: 'admin@nemo.app', password: 'NEMO_MASTER_2026' },
];

const TEASER_STATS = [
  { label: 'Trends tracked today', value: '2,847', sparkline: [20, 35, 28, 52, 71, 88, 91] },
  { label: 'Avg NEMO Score', value: '61.4', sparkline: [50, 55, 48, 60, 62, 58, 61] },
  { label: 'Creators active 24h', value: '38.2K', sparkline: [30, 42, 38, 45, 50, 48, 52] },
];

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
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

  const handleLoginSubmit = (data: LoginFormData) => {
    // BACKEND INTEGRATION: POST /api/auth/login
    const valid = DEMO_CREDENTIALS.some(
      (c) => c.email === data.email && c.password === data.password
    );
    if (!valid) {
      loginForm.setError('email', {
        message: 'Invalid credentials — use the demo accounts below to sign in',
      });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Welcome back to NEMO 🔥');
      window.location.href = '/';
    }, 1200);
  };

  const handleSignupSubmit = (data: SignupFormData) => {
    // BACKEND INTEGRATION: POST /api/auth/signup
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Account created — welcome to NEMO!');
      setMode('login');
    }, 1400);
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
          <AppImage
            src="/assets/images/1_LD-1783875046029.png"
            alt="Nemo Wordmark"
            width={160}
            height={48}
            className="flex-shrink-0 object-contain"
            priority={true}
          />
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
              Real-time trend intelligence across Google, YouTube, Instagram & LinkedIn — powered by AI.
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
          <AppImage
            src="/assets/images/1_LD-1783875046029.png"
            alt="Nemo Wordmark"
            width={120}
            height={36}
            className="flex-shrink-0 object-contain"
            priority={true}
          />
        </div>

        <div className="w-full max-w-md">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-muted rounded-full p-1 mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-all duration-150 ${
                mode === 'login' ?'bg-primary text-white shadow-flame-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-all duration-150 ${
                mode === 'signup' ?'bg-primary text-white shadow-flame-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social auth */}
          <div className="flex flex-col gap-2 mb-6">
            <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm font-sans font-medium hover:bg-muted transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm font-sans font-medium hover:bg-muted transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
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
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="flex flex-col gap-4">
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
                <Link href="#" className="text-sm font-sans text-primary hover:underline">
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Sign In to NEMO →'
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="flex flex-col gap-4">
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
                  <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.name.message}</p>
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
                  <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.email.message}</p>
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
                    {...signupForm.register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.password.message}</p>
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
                    {...signupForm.register('confirmPassword', { required: 'Please confirm password' })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-flame w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Start Trending Free →'
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground font-sans">
                By signing up you agree to our{' '}
                <Link href="#" className="text-primary hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}

          {/* Demo Credentials */}
          {mode === 'login' && (
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