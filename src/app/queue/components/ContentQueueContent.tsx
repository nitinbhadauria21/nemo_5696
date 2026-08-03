'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  PlusIcon,
  ListBulletIcon,
  ViewColumnsIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

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

const STATUS_TO_API: Record<QueueItem['status'], string> = {
  todo: 'ideas',
  in_progress: 'in_progress',
  published: 'published',
};

const STATUS_FROM_API: Record<string, QueueItem['status']> = {
  ideas: 'todo',
  in_progress: 'in_progress',
  published: 'published',
};

const PLATFORM_COLORS: Record<string, string> = {
  'YouTube Shorts': 'bg-red-500/10 text-red-600 border border-red-500/20',
  'Instagram Reels': 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
  TikTok: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
  LinkedIn: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  'Twitter / X': 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
};

const COLUMNS = [
  {
    id: 'todo',
    label: 'To Do',
    color: 'border-amber-400/50',
    dot: 'bg-amber-400',
    bg: 'bg-amber-400/5',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    color: 'border-blue-400/50',
    dot: 'bg-blue-400',
    bg: 'bg-blue-400/5',
  },
  {
    id: 'published',
    label: 'Published',
    color: 'border-green-400/50',
    dot: 'bg-green-400',
    bg: 'bg-green-400/5',
  },
] as const;

export default function ContentQueueContent() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    platform: 'YouTube Shorts',
    niche: 'AI & Tech',
    notes: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/queue')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.items)) return;
        setItems(
          data.items.map(
            (i: {
              id: string;
              title: string;
              platform?: string;
              status?: string;
              notes?: string;
              created_at?: string;
            }) => ({
              id: i.id,
              title: i.title,
              platform: i.platform || 'YouTube Shorts',
              niche: 'General',
              status: STATUS_FROM_API[i.status || 'ideas'] || 'todo',
              nemoScore: 70,
              addedAt: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'recently',
              notes: i.notes,
            })
          )
        );
      })
      .catch(() => {});
  }, []);

  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = async (status: QueueItem['status']) => {
    if (!dragId) return;
    setItems((prev) => prev.map((i) => (i.id === dragId ? { ...i, status } : i)));
    setDragId(null);
    try {
      await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dragId, status: STATUS_TO_API[status] }),
      });
      toast.success('Item moved');
    } catch {
      toast.error('Could not update item');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title,
          platform: newItem.platform,
          notes: newItem.notes,
          status: STATUS_TO_API.todo,
        }),
      });
      const data = await res.json();
      const item: QueueItem = {
        id: data.item?.id || `q-${Date.now()}`,
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
    } catch {
      toast.error('Could not add item');
    }
  };

  const handleExport = () => {
    const csv = [
      'Title,Platform,Niche,Status,Nemo Score,Added',
      ...items.map(
        (i) =>
          `"${i.title}","${i.platform}","${i.niche}","${i.status}",${i.nemoScore},"${i.addedAt}"`
      ),
    ].join('\n');
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
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <ViewColumnsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Content Queue</h1>
            <p className="text-base text-foreground/65 font-sans mt-0.5">
              {items.length} items · Drag to move between stages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
              title="Kanban view"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-border text-base font-bold font-sans text-foreground/65 hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-flame flex items-center gap-2 px-4 py-2.5 rounded-xl"
          >
            <PlusIcon className="w-4 h-4" />
            Add Manually
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4">
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
                  className={`rounded-2xl border-2 ${col.color} ${col.bg} p-4 min-h-[400px]`}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                    <h3 className="font-display font-bold text-foreground text-lg">{col.label}</h3>
                    <span className="ml-auto text-sm font-mono-custom font-bold bg-card border border-border text-foreground/65 px-2.5 py-0.5 rounded-full">
                      {colItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        className="bg-card border-2 border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-card transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <p className="text-base font-bold font-sans text-foreground leading-snug flex-1">
                            {item.title}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-red-500 transition-all flex-shrink-0 p-0.5"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          <span
                            className={`text-sm px-2.5 py-0.5 rounded-full font-bold font-sans ${PLATFORM_COLORS[item.platform] || 'bg-muted text-foreground/65'}`}
                          >
                            {item.platform}
                          </span>
                          <span className="text-sm px-2.5 py-0.5 rounded-full bg-muted text-foreground/65 font-sans font-semibold border border-border">
                            {item.niche}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-foreground/60 font-sans italic mb-2.5">
                            {item.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/55 font-sans">
                            {item.addedAt}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                router.push(`/carousel?topic=${encodeURIComponent(item.title)}`)
                              }
                              className="text-xs font-bold font-sans px-2 py-1 rounded-lg border border-border text-foreground/60 hover:text-white hover:border-[#002FA7] transition-all"
                              style={{ background: 'transparent' }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#002FA7';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  'transparent';
                              }}
                              title="Make Carousel"
                            >
                              🎠 Make Carousel
                            </button>
                            <span className="text-base font-mono-custom font-extrabold text-primary">
                              {item.nemoScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {colItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-base text-foreground/50 font-sans font-medium">
                          Drop items here
                        </p>
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
          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <table className="w-full font-sans">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="text-left px-5 py-4 text-sm font-bold text-foreground">Title</th>
                  <th className="text-left px-5 py-4 text-sm font-bold text-foreground hidden sm:table-cell">
                    Platform
                  </th>
                  <th className="text-left px-5 py-4 text-sm font-bold text-foreground hidden md:table-cell">
                    Niche
                  </th>
                  <th className="text-left px-5 py-4 text-sm font-bold text-foreground">Status</th>
                  <th className="text-right px-5 py-4 text-sm font-bold text-foreground">Score</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const col = COLUMNS.find((c) => c.id === item.status);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors`}
                    >
                      <td className="px-5 py-4 text-base font-bold text-foreground">
                        {item.title}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${PLATFORM_COLORS[item.platform] || 'bg-muted text-muted-foreground'}`}
                        >
                          {item.platform}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-medium hidden md:table-cell">
                        {item.niche}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${col?.dot}`} />
                          <span className="text-sm text-muted-foreground font-semibold capitalize">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono-custom font-extrabold text-primary text-lg">
                        {item.nemoScore}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card border-2 border-border rounded-2xl p-6 w-full max-w-md shadow-nav animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-extrabold text-foreground">Add to Queue</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Content Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. 5 AI Tools Every Creator Needs"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-base font-sans placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Platform</label>
                  <select
                    value={newItem.platform}
                    onChange={(e) => setNewItem((p) => ({ ...p, platform: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border-2 border-border bg-background text-foreground text-sm font-sans focus:outline-none focus:border-primary/50"
                  >
                    {Object.keys(PLATFORM_COLORS).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Niche</label>
                  <select
                    value={newItem.niche}
                    onChange={(e) => setNewItem((p) => ({ ...p, niche: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border-2 border-border bg-background text-foreground text-sm font-sans focus:outline-none focus:border-primary/50"
                  >
                    {[
                      'AI & Tech',
                      'Finance',
                      'Fitness',
                      'Food',
                      'Travel',
                      'Fashion',
                      'Gaming',
                      'Education',
                      'Business',
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any notes about this content..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
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
