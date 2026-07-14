'use client';

import React, { useState } from 'react';
import { User, Link2, CreditCard, Palette, Bell, Code2 } from 'lucide-react';
import ProfileTab from './ProfileTab';
import ConnectedAccountsTab from './ConnectedAccountsTab';
import SubscriptionTab from './SubscriptionTab';
import StyleDefaultsTab from './StyleDefaultsTab';
import NotificationsTab from './NotificationsTab';
import APIKeyTab from './APIKeyTab';
import MCPConfigTab from './MCPConfigTab';

type TabId = 'profile' | 'accounts' | 'subscription' | 'style' | 'notifications' | 'api';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
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
                className={`px-4 py-2 rounded-full text-sm font-sans font-semibold transition-all ${
                  apiSection === 'keys' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                API Keys
              </button>
              <button
                onClick={() => setApiSection('mcp')}
                className={`px-4 py-2 rounded-full text-sm font-sans font-semibold transition-all ${
                  apiSection === 'mcp' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
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
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-6 py-3">
        <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground font-sans">Manage your account, integrations, and developer tools</p>
      </div>

      <div className="px-6 py-5 max-w-screen-2xl mx-auto">
        <div className="flex gap-6">
          {/* Left tab nav */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <nav className="space-y-1 sticky top-24">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={`settings-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <IconComponent size={16} className={isActive ? 'text-primary' : ''} />
                    <span className="text-sm font-sans font-medium flex-1">{tab.label}</span>
                    {tab.badge && (
                      <span className="text-xs font-mono-custom bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile tab row */}
          <div className="md:hidden w-full overflow-x-auto scrollbar-thin">
            <div className="flex gap-2 pb-2">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={`mobile-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-sans font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white' :'bg-muted text-muted-foreground'
                    }`}
                  >
                    <IconComponent size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}