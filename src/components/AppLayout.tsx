'use client';

import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import AIChatPanel from './AIChatPanel';
import Icon from './ui/AppIcon';
import TopNavbar from './TopNavbar';
import AuthGate from './AuthGate';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onOpenChat={() => setChatOpen(true)}
        />
        <main
          className={`flex-1 min-w-0 min-h-screen sidebar-transition ${collapsed ? 'ml-[68px]' : 'ml-64'}`}
        >
          <TopNavbar />
          {children}
        </main>

        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl flame-gradient shadow-lg flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all duration-200 group"
          title="Open Nemo AI Chat"
          aria-label="Open AI Chat"
        >
          <Icon name="ChatBubbleLeftRightIcon" size={24} className="text-white" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        </button>

        <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </AuthGate>
  );
}
