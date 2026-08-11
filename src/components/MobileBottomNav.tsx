'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Bookmark, Bell, Clock, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Home', Icon: Home },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/saved', label: 'Saved', Icon: Bookmark },
  { href: '/alerts', label: 'Alerts', Icon: Bell },
  { href: '/history', label: 'History', Icon: Clock },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden safe-area-pb">
      <ul className="grid grid-cols-6 gap-0 px-1 py-1.5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[0.65rem] font-semibold ${
                  active ? 'text-primary' : 'text-foreground/55'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
