'use client';

import React, { useState } from 'react';
import { User, Link2, CreditCard, Palette, Bell, Code2 } from 'lucide-react';
import ProfileTab from './ProfileTab';
import ConnectedAccountsTab from './ConnectedAccountsTab';
import SubscriptionTab from './SubscriptionTab';
import StyleDefaultsTab from './StyleDefaultsTab';
import NotificationsTab from './NotificationsTab';
import APIKeyTab from './APIKeyTab';
import NichesTab from './NichesTab';
import PlatformsTab from './PlatformsTab';
import MCPConfigTab from './MCPConfigTab';


type TabId = 'profile' | 'niches' | 'platforms' | 'accounts' | 'subscription' | 'style' | 'notifications' | 'api';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'niches', label: 'Niches', icon: Palette },
  { id: 'platforms', label: 'Platforms', icon: Link2 },
  { id: 'accounts', label: 'Connected Accounts', icon: Link2 },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'style', label: 'Style Defaults', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API & Developer', icon: Code2, badge: 'DEV' },
];

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [apiSection, setApiSection] = useState<'keys' | 'mcp'>('keys');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'niches': return <NichesTab />;
      case 'platforms': return <PlatformsTab />;
      case 'accounts': return <ConnectedAccountsTab />;
      case 'subscription': return <SubscriptionTab />;
      case 'style': return <StyleDefaultsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'api':
        return (
          <div className="space-y-5">
            <div className="flex gap-2">
              <button
                onClick={() => setApiSection('keys')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold font-sans transition-all ${
                  apiSection === 'keys' ? 'bg-primary text-white shadow-flame-sm' : 'bg-muted text-muted-foreground hover:text-foreground border-2 border-border'
                }`}
              >
                API Keys
              </button>
              <button
                onClick={() => setApiSection('mcp')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold font-sans transition-all ${
                  apiSection === 'mcp' ? 'bg-primary text-white shadow-flame-sm' : 'bg-muted text-muted-foreground hover:text-foreground border-2 border-border'
                }`}
              >
                MCP & Docs
              </button>
            </div>
            {apiSection === 'keys' ? <APIKeyTab /> : <MCPConfigTab />}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">Manage your account, integrations, and developer tools</p>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6 max-w-screen-2xl mx-auto">
        <div className="flex gap-6">
          {/* Left tab nav */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary border-2 border-primary/20' :'text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-bold font-sans truncate">{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-auto text-[10px] font-mono-custom font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile tab nav */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold font-sans whitespace-nowrap flex-shrink-0 transition-all ${
                      isActive ? 'bg-primary text-white' : 'bg-card border-2 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border-2 border-border rounded-2xl p-5 sm:p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}