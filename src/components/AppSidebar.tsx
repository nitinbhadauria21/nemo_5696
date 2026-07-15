'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'HomeIcon', group: 'main' },
  { label: 'Explore', href: '/explore', icon: 'MagnifyingGlassIcon', group: 'main' },
  { label: 'Trend Detail', href: '/trend-detail', icon: 'FireIcon', group: 'main' },
  { label: 'Content Queue', href: '/queue', icon: 'QueueListIcon', group: 'create' },
  { label: 'Viral Script Writer', href: '/viral-script-writer', icon: 'PencilSquareIcon', group: 'create' },
  { label: 'Saved Scripts', href: '/saved-scripts', icon: 'ArchiveBoxIcon', group: 'create' },
  { label: 'Analytics', href: '/analytics', icon: 'PresentationChartLineIcon', group: 'insights' },
  { label: 'Reports', href: '/reports', icon: 'ChartBarIcon', group: 'insights' },
  { label: 'Pricing', href: '/pricing', icon: 'CreditCardIcon', group: 'account' },
  { label: 'Settings', href: '/settings-developer-tools', icon: 'Cog6ToothIcon', group: 'account' },
];

const NAV_GROUPS = [
  { id: 'main', label: 'Discover' },
  { id: 'create', label: 'Create' },
  { id: 'insights', label: 'Insights' },
  { id: 'account', label: 'Account' },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenChat?: () => void;
}

type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light', icon: 'SunIcon', label: 'Light' },
  { mode: 'dark', icon: 'MoonIcon', label: 'Dark' },
  { mode: 'auto', icon: 'ComputerDesktopIcon', label: 'Auto' },
];

export default function AppSidebar({ collapsed, onToggle, onOpenChat }: AppSidebarProps) {
  const pathname = usePathname();
  const { mode, setMode } = useTheme();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col sidebar-transition overflow-hidden ${
        collapsed ? 'w-[68px]' : 'w-64'
      } flame-gradient border-r border-white/10`}
      style={{ boxShadow: '4px 0 32px rgba(0,0,0,0.18)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/15 min-h-[72px] ${collapsed ? 'justify-center px-0' : ''}`}>
        {collapsed ? (
          <AppLogo size={38} src="/assets/images/3-1784112678359.png" />
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <AppImage
              src="/assets/images/Nemo_Logo_in_LD___1_-1784112484010.png"
              alt="Nemo Wordmark"
              width={148}
              height={44}
              className="flex-shrink-0 object-contain"
              priority={true}
            />
            <span className="text-[10px] font-mono-custom font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
              Beta
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const groupItems = NAV_ITEMS.filter((item) => item.group === group.id);
          return (
            <div key={group.id} className={`mb-1 ${collapsed ? 'px-1' : 'px-3'}`}>
              {!collapsed && (
                <p className="font-mono-custom text-xs font-bold uppercase tracking-[0.1em] text-white/70 px-2 mb-1.5 mt-3">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-white/10" />}
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={`nav-${item.href}`}>
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
                          isActive
                            ? 'bg-white/25 text-white nav-active-glow' : 'text-white/85 hover:text-white hover:bg-white/15'
                        } ${collapsed ? 'justify-center px-0 mx-0.5' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white" />
                        )}
                        <Icon
                          name={item.icon as any}
                          size={20}
                          variant={isActive ? 'solid' : 'outline'}
                          className={isActive ? 'text-white' : 'text-white/85 group-hover:text-white transition-colors'}
                        />
                        {!collapsed && (
                          <span className="font-display text-[1rem] font-600 truncate leading-none text-white">
                            {item.label}
                          </span>
                        )}
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-xs font-mono-custom font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {collapsed && (
                          <span className="absolute left-full ml-3 px-3 py-1.5 bg-card border border-border text-foreground text-sm font-sans font-semibold rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-nav">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* AI Chat nav item */}
        <div className={`mt-1 mb-1 ${collapsed ? 'px-1' : 'px-3'}`}>
          {!collapsed && (
            <p className="font-mono-custom text-xs font-bold uppercase tracking-[0.1em] text-white/70 px-2 mb-1.5 mt-3">
              AI Tools
            </p>
          )}
          {collapsed && <div className="my-2 border-t border-white/10" />}
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={onOpenChat}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative w-full text-white/85 hover:text-white hover:bg-white/15 ${
                  collapsed ? 'justify-center px-0 mx-0.5' : ''
                }`}
                title={collapsed ? 'AI Chat' : undefined}
              >
                <Icon name="ChatBubbleLeftRightIcon" size={20} variant="outline" className="text-white/85 group-hover:text-white transition-colors" />
                {!collapsed && (
                  <span className="font-display text-[1rem] font-600 truncate leading-none text-white">AI Chat</span>
                )}
                {!collapsed && (
                  <span className="ml-auto text-xs font-mono-custom font-bold bg-accent/40 text-white px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-3 py-1.5 bg-card border border-border text-foreground text-sm font-sans font-semibold rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-nav">
                    AI Chat
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom: theme + user + collapse */}
      <div className="border-t border-white/15 p-3 space-y-2">

        {/* Theme Toggle */}
        {collapsed ? (
          <div className="relative group">
            <button
              onClick={() => {
                const idx = THEME_OPTIONS.findIndex((o) => o.mode === mode);
                const next = THEME_OPTIONS[(idx + 1) % THEME_OPTIONS.length];
                setMode(next.mode);
              }}
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-all duration-200"
              title={`Theme: ${mode}`}
              suppressHydrationWarning
            >
              <Icon
                name={THEME_OPTIONS.find((o) => o.mode === mode)?.icon as any ?? 'MoonIcon'}
                size={18}
              />
            </button>
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-card border border-border text-foreground text-sm font-sans font-semibold rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-nav capitalize">
              {mode} mode
            </span>
          </div>
        ) : (
          <div>
            <p className="font-mono-custom text-xs font-bold uppercase tracking-[0.1em] text-white/70 px-1 mb-2">
              Theme
            </p>
            <div className="flex items-center gap-1 bg-white/15 rounded-xl p-1">
              {THEME_OPTIONS.map((opt) => {
                const isActive = mode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => setMode(opt.mode)}
                    title={`${opt.label} mode`}
                    suppressHydrationWarning
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/30 text-white shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    <Icon name={opt.icon as any} size={13} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-all duration-200 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon
            name={collapsed ? 'ChevronDoubleRightIcon' : 'ChevronDoubleLeftIcon'}
            size={17}
          />
          {!collapsed && <span className="text-sm font-semibold text-white">Collapse</span>}
        </button>

        {/* User profile */}
        <Link
          href="/sign-up-login-screen"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-all duration-200 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Account' : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 border border-white/40">
            <span className="text-white text-sm font-display font-bold">N</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white truncate">Nitin Sharma</p>
                <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Pro</span>
              </div>
              <p className="text-xs text-white/70 truncate font-mono-custom">20/∞ trends used</p>
            </div>
          )}
        </Link>

        {/* Upgrade CTA */}
        {!collapsed && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-all duration-200 border border-white/30"
          >
            <Icon name="SparklesIcon" size={14} />
            Upgrade Plan
          </Link>
        )}

        {/* Social connect status */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/20 border border-accent/35">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <span className="text-xs text-white font-sans font-semibold">3 accounts connected</span>
          </div>
        )}
      </div>
    </aside>
  );
}