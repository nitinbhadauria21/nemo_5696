'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type PlanId = 'free' | 'pro' | 'agency';

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  niches?: string[];
  platforms?: string[];
  plan?: PlanId;
  onboarding_complete?: boolean;
  ai_usage_count?: number;
  ai_usage_period?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  supabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setLocalPlan: (plan: PlanId) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_SESSION_KEY = 'nemo_local_session';
const LOCAL_PLAN_KEY = 'nemo_plan';

const DEMO_USERS: Record<string, { password: string; name: string; plan: PlanId }> = {
  'priya.mehta@studio.in': { password: 'Nemo@2026', name: 'Priya Mehta', plan: 'pro' },
  'admin@nemo.app': { password: 'NEMO_MASTER_2026', name: 'Nemo Admin', plan: 'agency' },
};

function readLocalSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeLocalSession(profile: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (!profile) localStorage.removeItem(LOCAL_SESSION_KEY);
  else localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseReady = isSupabaseConfigured();

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        niches: data.niches ?? [],
        platforms: data.platforms ?? [],
        plan: (data.plan as PlanId) || 'free',
        onboarding_complete: data.onboarding_complete,
        ai_usage_count: data.ai_usage_count,
        ai_usage_period: data.ai_usage_period,
      });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const supabase = createClient();
      if (!supabase) {
        const local = readLocalSession();
        if (mounted) {
          setProfile(local);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);

      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    }

    const demo = DEMO_USERS[email];
    if (!demo || demo.password !== password) {
      return { error: 'Invalid credentials — use demo accounts or configure Supabase' };
    }
    const localPlan = (typeof window !== 'undefined'
      ? (localStorage.getItem(LOCAL_PLAN_KEY) as PlanId | null)
      : null) || demo.plan;
    const localProfile: UserProfile = {
      id: `local-${email}`,
      email,
      full_name: demo.name,
      plan: localPlan,
      onboarding_complete: true,
      niches: [],
      platforms: [],
      ai_usage_count: 0,
    };
    writeLocalSession(localProfile);
    setProfile(localProfile);
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: error.message };
      return {};
    }

    const localProfile: UserProfile = {
      id: `local-${email}`,
      email,
      full_name: name,
      plan: 'free',
      onboarding_complete: false,
      niches: [],
      platforms: [],
      ai_usage_count: 0,
    };
    writeLocalSession(localProfile);
    setProfile(localProfile);
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    writeLocalSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const setLocalPlan = useCallback((plan: PlanId) => {
    if (typeof window !== 'undefined') localStorage.setItem(LOCAL_PLAN_KEY, plan);
    setProfile((prev) => {
      const next = prev ? { ...prev, plan } : null;
      if (next) writeLocalSession(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      supabaseReady,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      setLocalPlan,
    }),
    [user, profile, loading, supabaseReady, signIn, signUp, signOut, refreshProfile, setLocalPlan]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
