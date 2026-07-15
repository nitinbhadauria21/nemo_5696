'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { MOCK_TRENDS } from '@/lib/mockData';

// ─── Mock Notifications ───────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'trend' | 'system' | 'upgrade';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'New Viral Trend Detected', message: '"AI Automation Tools" just hit 95 Nemo Score', time: '2m ago', read: false, type: 'trend' },
  { id: '2', title: 'Trend Alert', message: '"Morning Routine" is rising fast on Instagram', time: '15m ago', read: false, type: 'trend' },
  { id: '3', title: 'Script Saved', message: 'Your viral script for "ChatGPT Prompts" was saved', time: '1h ago', read: false, type: 'system' },
  { id: '4', title: 'Upgrade Available', message: 'Unlock unlimited trends with Pro plan', time: '3h ago', read: true, type: 'upgrade' },
  { id: '5', title: 'Weekly Report Ready', message: 'Your analytics report for this week is ready', time: '1d ago', read: true, type: 'system' },
];

// ─── User Menu Items ──────────────────────────────────────────────────────────

const USER_MENU_ITEMS = [
  { label: 'Profile', icon: 'UserCircleIcon', href: '/settings-developer-tools' },
  { label: 'Settings', icon: 'Cog6ToothIcon', href: '/settings-developer-tools' },
  { label: 'Upgrade', icon: 'SparklesIcon', href: '/pricing', highlight: true },
];

// ─── Notification Icon Helper ─────────────────────────────────────────────────

function notifIcon(type: Notification['type']): string {
  if (type === 'trend') return 'FireIcon';
  if (type === 'upgrade') return 'SparklesIcon';
  return 'BellIcon';
}

function notifColor(type: Notification['type']): string {
  if (type === 'trend') return 'text-orange-400';
  if (type === 'upgrade') return 'text-amber-400';
  return 'text-blue-400';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopNavbar() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Derived
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Live search results
  const searchResults = searchQuery.trim().length >= 2
    ? MOCK_TRENDS.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.hashtags.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSearchSelect = (href: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-2.5 flex items-center gap-3">
      {/* ── Global Search ── */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search trends, scripts, niches…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm font-sans focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="XMarkIcon" size={14} />
            </button>
          )}
        </div>

        {/* Live Dropdown */}
        {searchOpen && (searchQuery.trim().length >= 2) && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
            {searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground font-mono-custom uppercase tracking-wide">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <ul>
                  {searchResults.map((trend) => (
                    <li key={trend.id}>
                      <button
                        onClick={() => handleSearchSelect(`/trend-detail?id=${trend.id}`)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg flame-gradient flex items-center justify-center flex-shrink-0">
                          <Icon name="FireIcon" size={13} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate font-sans">{trend.title}</p>
                          <p className="text-xs text-muted-foreground font-mono-custom">{trend.category} · Score {trend.nemoScore}</p>
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          trend.status === 'hot' ? 'bg-red-500/15 text-red-400' :
                          trend.status === 'rising'? 'bg-orange-500/15 text-orange-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {trend.status.toUpperCase()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-3 py-2 border-t border-border">
                  <button
                    onClick={() => handleSearchSelect(`/explore`)}
                    className="text-xs text-primary hover:underline font-sans"
                  >
                    View all results in Explore →
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <Icon name="MagnifyingGlassIcon" size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-sans">No results for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-1.5 ml-auto">

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            aria-label="Notifications"
          >
            <Icon name="BellIcon" size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground font-sans">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline font-sans"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <ul className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.type === 'trend' ? 'bg-orange-500/15' :
                        notif.type === 'upgrade'? 'bg-amber-500/15' : 'bg-blue-500/15'
                      }`}>
                        <Icon name={notifIcon(notif.type) as any} size={15} className={notifColor(notif.type)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold font-sans truncate ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-custom mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="px-4 py-2.5 border-t border-border">
                <Link
                  href="/settings-developer-tools"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-primary hover:underline font-sans"
                >
                  Notification settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted/60 transition-all"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full flame-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-display font-bold">N</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground font-sans leading-tight">Nitin Sharma</p>
              <p className="text-[10px] text-muted-foreground font-mono-custom leading-tight">Pro Plan</p>
            </div>
            <Icon name="ChevronDownIcon" size={14} className={`text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flame-gradient flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-display font-bold">N</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground font-sans truncate">Nitin Sharma</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold leading-none">Pro</span>
                      <span className="text-[10px] text-muted-foreground font-mono-custom">20/∞ used</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <ul className="py-1">
                {USER_MENU_ITEMS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-sans transition-colors ${
                        item.highlight
                          ? 'text-amber-500 hover:bg-amber-500/10' :'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon name={item.icon as any} size={16} className={item.highlight ? 'text-amber-500' : 'text-muted-foreground'} />
                      {item.label}
                      {item.highlight && (
                        <span className="ml-auto text-[10px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">HOT</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Divider + Log Out */}
              <div className="border-t border-border py-1">
                <Link
                  href="/sign-up-login-screen"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 font-sans transition-colors"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-red-400" />
                  Log Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
