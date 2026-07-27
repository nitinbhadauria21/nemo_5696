'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import '@/styles/admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login' || pathname === '/admin') {
    return <div className="admin-shell min-h-screen">{children}</div>;
  }

  return <AdminShell>{children}</AdminShell>;
}
