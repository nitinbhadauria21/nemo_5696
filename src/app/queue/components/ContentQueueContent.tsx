'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusIcon, ListBulletIcon, ViewColumnsIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QueueItem {
  id: string;
  title: string;
  platform: string;
  niche: string;
  status: 'todo' | 'in_progress' | 'published';
  nemoScore: number;
  addedAt: string;
  notes?: string;
}

const INITIAL_ITEMS: QueueItem[] = [
  { id: 'q-1', title: 'Claude AI Tool Integrations', platform: 'YouTube Shorts', niche: 'AI & Tech', status: 'todo', nemoScore: 91, addedAt: '2h ago' },
  { id: 'q-2', title: 'Instagram Broadcast Channels', platform: 'Instagram Reels', niche: 'Marketing', status: 'todo', nemoScore: 84, addedAt: '3h ago' },
  { id: 'q-3', title: 'Viral Finance Hacks 2026', platform: 'TikTok', niche: 'Finance', status: 'in_progress', nemoScore: 78, addedAt: '5h ago', notes: 'Script drafted, need B-roll' },
  { id: 'q-4', title: 'Morning Routine Productivity', platform: 'Instagram Reels', niche: 'Fitness', status: 'in_progress', nemoScore: 72, addedAt: '1d ago' },
  { id: 'q-5', title: 'AI Tools for Creators', platform: 'YouTube Shorts', niche: 'AI & Tech', status: 'published', nemoScore: 88, addedAt: '2d ago' },
  { id: 'q-6', title: 'Budget Travel India 2026', platform: 'TikTok', niche: 'Travel', status: 'published', nemoScore: 65, addedAt: '3d ago' },
];

const PLATFORM_COLORS: Record<string, string> = {
  'YouTube Shorts': 'bg-red-100 text-red-700',
  'Instagram Reels': 'bg-pink-100 text-pink-700',
  'TikTok': 'bg-gray-100 text-gray-700',
  'LinkedIn': 'bg-blue-100 text-blue-700',
  'Twitter / X': 'bg-slate-100 text-slate-700',
};

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'border-amber-400', dot: 'bg-amber-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-400', dot: 'bg-blue-400' },
  { id: 'published', label: 'Published', color: 'border-green-400', dot: 'bg-green-400' },
] as const;

export default function ContentQueueContent() {
  const [items, setItems] = useState<QueueItem[]>(INITIAL_ITEMS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', platform: 'YouTube Shorts', niche: 'AI & Tech', notes: '' });

  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = (status: QueueItem['status']) => {
    if (!dragId) return;
    setItems((prev) => prev.map((i) => (i.id === dragId ? { ...i, status } : i)));
    setDragId(null);
    toast.success('Item moved');
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) return;
    const item: QueueItem = {
      id: `q-${Date.now()}`,
      title: newItem.title,
      platform: newItem.platform,
      niche: newItem.niche,
      status: 'todo',
      nemoScore: Math.floor(Math.random() * 30) + 60,
      addedAt: 'just now',
      notes: newItem.notes || undefined,
    };
    setItems((prev) => [item, ...prev]);
    setNewItem({ title: '', platform: 'YouTube Shorts', niche: 'AI & Tech', notes: '' });
    setShowAddModal(false);
    toast.success('Added to queue');
  };

  const handleExport = () => {
    const csv = ['Title,Platform,Niche,Status,Nemo Score,Added', ...items.map((i) => `"${i.title}","${i.platform}","${i.niche}","${i.status}",${i.nemoScore},"${i.addedAt}"`)]
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nemo-content-queue.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Queue exported as CSV');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast('Item removed from queue');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Content Queue</h1>
          <p className="text-xs text-muted-foreground font-sans">{items.length} items · Drag to move between stages</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Kanban view"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Add Manually
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colItems = items.filter((i) => i.status === col.id);
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(col.id)}
                  className={`rounded-2xl border-2 ${col.color} bg-card/50 p-4 min-h-[400px]`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className="font-sans font-bold text-foreground text-sm">{col.label}</h3>
                    <span className="ml-auto text-xs font-mono-custom bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {colItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        className="bg-card border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-sans font-semibold text-foreground leading-snug flex-1">{item.title}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all flex-shrink-0"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium ${PLATFORM_COLORS[item.platform] || 'bg-muted text-muted-foreground'}`}>
                            {item.platform}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans">
                            {item.niche}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground font-sans italic mb-2">{item.notes}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-sans">{item.addedAt}</span>
                          <span className="text-xs font-mono-custom font-bold text-primary">
                            {item.nemoScore}
                          </span>
                        </div>
                      </div>
                    ))}
                    {colItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-xs text-muted-foreground font-sans">Drop items here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-muted-foreground font-semibold">Title</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-semibold hidden sm:table-cell">Platform</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-semibold hidden md:table-cell">Niche</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-semibold">Status</th>
                  <th className="text-right px-5 py-3 text-muted-foreground font-semibold">Score</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const col = COLUMNS.find((c) => c.id === item.status);
                  return (
                    <tr key={item.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-5 py-3 font-medium text-foreground">{item.title}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[item.platform] || 'bg-muted text-muted-foreground'}`}>
                          {item.platform}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{item.niche}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${col?.dot}`} />
                          <span className="text-xs text-muted-foreground capitalize">{item.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono-custom font-bold text-primary">{item.nemoScore}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manually Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-foreground">Add to Queue</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Content Title *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. 5 AI Tools Every Creator Needs"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Platform</label>
                  <select
                    value={newItem.platform}
                    onChange={(e) => setNewItem((p) => ({ ...p, platform: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.keys(PLATFORM_COLORS).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Niche</label>
                  <select
                    value={newItem.niche}
                    onChange={(e) => setNewItem((p) => ({ ...p, niche: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {['AI & Tech', 'Finance', 'Fitness', 'Food', 'Travel', 'Fashion', 'Gaming', 'Education', 'Business'].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Notes (optional)</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any notes about this content..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  Add to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
