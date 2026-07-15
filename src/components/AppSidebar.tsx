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
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'HomeIcon' },
  { label: 'Trend Detail', href: '/trend-detail', icon: 'FireIcon' },
  { label: 'Analytics', href: '/analytics', icon: 'ChartBarIcon' },
  { label: 'Settings', href: '/settings-developer-tools', icon: 'Cog6ToothIcon' },
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
        collapsed ? 'w-16' : 'w-60'
      } flame-gradient border-r border-transparent`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/20 min-h-[68px] ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            /* Collapsed: always use the orange gradient N icon */
            <AppLogo size={36} src="/assets/images/1-1783875917780.png" />
          ) : (
            /* Expanded: white wordmark for gradient sidebar */
            <AppImage
              src="/assets/images/Nemo_Logo_in_LD_-1784112287144.png"
              alt="Nemo Wordmark"
              width={160}
              height={48}
              className="flex-shrink-0 object-contain"
              priority={true}
            />
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <div className={`px-2 mb-2 ${collapsed ? 'px-1' : ''}`}>
          {!collapsed && (
            <p className="text-xs font-mono-custom uppercase tracking-widest text-white/60 px-3 mb-3">
              Navigation
            </p>
          )}
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={`nav-${item.href}`}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                      isActive
                        ? 'bg-white/25 text-white' :'text-white/70 hover:text-white hover:bg-white/15'
                    } ${collapsed ? 'justify-center px-0 mx-1' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      name={item.icon as any}
                      size={22}
                      variant={isActive ? 'solid' : 'outline'}
                      className={isActive ? 'text-white' : ''}
                    />
                    {!collapsed && (
                      <span className="font-sans text-base font-medium truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-xs font-mono-custom bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-card border border-border text-foreground text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-card">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* AI Chat nav item */}
            <li key="nav-ai-chat">
              <button
                onClick={onOpenChat}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative w-full text-white/70 hover:text-white hover:bg-white/15 ${
                  collapsed ? 'justify-center px-0 mx-1' : ''
                }`}
                title={collapsed ? 'AI Chat' : undefined}
              >
                <Icon name="ChatBubbleLeftRightIcon" size={22} variant="outline" />
                {!collapsed && (
                  <span className="font-sans text-base font-medium truncate">AI Chat</span>
                )}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-card border border-border text-foreground text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-card">
                    AI Chat
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom: theme + collapse */}
      <div className="border-t border-white/20 p-3 space-y-2">

        {/* Theme Toggle */}
        {collapsed ? (
          /* Collapsed: cycle through modes on click */
          <div className="relative group">
            <button
              onClick={() => {
                const idx = THEME_OPTIONS.findIndex((o) => o.mode === mode);
                const next = THEME_OPTIONS[(idx + 1) % THEME_OPTIONS.length];
                setMode(next.mode);
              }}
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all duration-150"
              title={`Theme: ${mode}`}
              suppressHydrationWarning
            >
              <Icon
                name={THEME_OPTIONS.find((o) => o.mode === mode)?.icon as any ?? 'MoonIcon'}
                size={18}
              />
            </button>
            <span className="absolute left-full ml-2 px-2 py-1 bg-card border border-border text-foreground text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-card capitalize">
              {mode} mode
            </span>
          </div>
        ) : (
          /* Expanded: 3-button pill switcher */
          <div>
            <p className="text-xs font-mono-custom uppercase tracking-widest text-white/60 px-1 mb-1.5">
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white/30 text-white shadow-card'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Icon name={opt.icon as any} size={14} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all duration-150 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon
            name={collapsed ? 'ChevronDoubleRightIcon' : 'ChevronDoubleLeftIcon'}
            size={18}
          />
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>

        <Link
          href="/sign-up-login-screen"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all duration-150 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Account' : undefined}
        >
          <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-display font-bold">N</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Nitin Sharma</p>
              <p className="text-xs text-white/60 truncate">Pro Plan</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}