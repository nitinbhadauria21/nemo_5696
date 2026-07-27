'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { MOCK_TRENDS } from '@/lib/mockData';

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

const USER_MENU_ITEMS = [
  { label: 'Profile', icon: 'UserCircleIcon', href: '/settings' },
  { label: 'Settings', icon: 'Cog6ToothIcon', href: '/settings' },
  { label: 'Upgrade', icon: 'SparklesIcon', href: '/pricing', highlight: true },
];

function notifIcon(type: Notification['type']): string {
  if (type === 'trend') return 'FireIcon';
  if (type === 'upgrade') return 'SparklesIcon';
  return 'BellIcon';
}

function notifColor(type: Notification['type']): string {
  if (type === 'trend') return 'text-orange-500';
  if (type === 'upgrade') return 'text-amber-500';
  return 'text-blue-500';
}

export default function TopNavbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [searchTrends, setSearchTrends] = useState(MOCK_TRENDS);

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.trends) && d.trends.length) setSearchTrends(d.trends);
      })
      .catch(() => {});
  }, []);

  const searchResults = searchQuery.trim().length >= 2
    ? searchTrends.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.hashtags.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleSearchSelect = (href: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <div className="sticky top-0 z-30 bg-background/98 backdrop-blur-md border-b border-border px-5 py-3 flex items-center gap-4" style={{ boxShadow: '0 1px 0 var(--border), 0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* ── Global Search ── */}
      <div ref={searchRef} className="relative flex-1 max-w-2xl">
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search trends, scripts, niches…"
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-card border-2 border-border text-foreground placeholder:text-foreground/45 text-base font-sans font-medium focus:outline-none focus:border-primary/60 focus:ring-0 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
            >
              <Icon name="XMarkIcon" size={16} />
            </button>
          )}
        </div>

        {/* Live Dropdown */}
        {searchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-2xl shadow-nav overflow-hidden z-50 animate-scale-in">
            {searchResults.length > 0 ? (
              <>
                <div className="px-4 py-2.5 border-b border-border bg-muted/60">
                  <p className="font-mono-custom text-sm font-bold text-foreground/70 uppercase tracking-wider">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <ul>
                  {searchResults.map((trend) => (
                    <li key={trend.id}>
                      <button
                        onClick={() => handleSearchSelect(`/trend/${trend.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
                          <Icon name="FireIcon" size={15} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-foreground truncate font-sans">{trend.title}</p>
                          <p className="text-sm text-foreground/60 font-mono-custom">{trend.category} · Score {trend.nemoScore}</p>
                        </div>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                          trend.status === 'hot' ? 'bg-red-500/15 text-red-600' :
                          trend.status === 'rising' ? 'bg-orange-500/15 text-orange-600' : 'bg-muted text-foreground/60'
                        }`}>
                          {trend.status.toUpperCase()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                  <button
                    onClick={() => handleSearchSelect('/explore')}
                    className="text-base font-semibold text-primary hover:underline font-sans"
                  >
                    View all results in Explore →
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <Icon name="MagnifyingGlassIcon" size={28} className="text-foreground/40 mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground font-sans mb-1">No results found</p>
                <p className="text-base text-foreground/60 font-sans">Try different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            aria-label="Notifications"
          >
            <Icon name="BellIcon" size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-[360px] bg-card border-2 border-border rounded-2xl shadow-nav overflow-hidden z-50 animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-foreground font-display">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-sm bg-red-500/15 text-red-600 px-2 py-0.5 rounded-full font-bold font-mono-custom">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-sm font-semibold text-primary hover:underline font-sans">
                    Mark all read
                  </button>
                )}
              </div>

              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <div className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.type === 'trend' ? 'bg-orange-500/15' :
                        notif.type === 'upgrade' ? 'bg-amber-500/15' : 'bg-blue-500/15'
                      }`}>
                        <Icon name={notifIcon(notif.type) as any} size={16} className={notifColor(notif.type)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-base font-bold font-sans truncate ${!notif.read ? 'text-foreground' : 'text-foreground/70'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-foreground/65 font-sans mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-sm text-foreground/50 font-mono-custom mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="px-4 py-3 border-t border-border bg-muted/30">
                <Link href="/settings" onClick={() => setNotifOpen(false)} className="text-base font-semibold text-primary hover:underline font-sans">
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
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full flame-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-display font-bold">N</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-base font-bold text-foreground font-sans leading-tight">Nitin Sharma</p>
              <p className="text-sm text-foreground/60 font-mono-custom leading-tight">Pro Plan</p>
            </div>
            <Icon name="ChevronDownIcon" size={14} className={`text-foreground/60 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-card border-2 border-border rounded-2xl shadow-nav overflow-hidden z-50 animate-scale-in">
              <div className="px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flame-gradient flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-base font-display font-bold">N</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground font-sans truncate">Nitin Sharma</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold leading-none">Pro</span>
                      <span className="text-sm text-foreground/60 font-mono-custom">20/∞ used</span>
                    </div>
                  </div>
                </div>
              </div>

              <ul className="py-1.5">
                {USER_MENU_ITEMS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-base font-semibold font-sans transition-colors ${
                        item.highlight ? 'text-amber-600 hover:bg-amber-500/10' : 'text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Icon name={item.icon as any} size={17} className={item.highlight ? 'text-amber-600' : 'text-foreground/60'} />
                      {item.label}
                      {item.highlight && (
                        <span className="ml-auto text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">HOT</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border py-1.5">
                <Link
                  href="/sign-up-login-screen"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-red-600 hover:bg-red-500/10 font-sans transition-colors"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={17} className="text-red-600" />
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
