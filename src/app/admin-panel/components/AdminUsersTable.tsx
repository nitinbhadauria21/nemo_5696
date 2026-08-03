'use client';

import React, { useState } from 'react';
import { Search, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

const PLAN_BADGE: Record<string, string> = {
  Free: 'bg-muted text-muted-foreground',
  Pro: 'bg-primary/10 text-primary',
  Agency: 'bg-secondary/10 text-secondary',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-accent/10 text-accent',
  inactive: 'bg-muted text-muted-foreground',
};

export default function AdminUsersTable() {
  const [users, setUsers] = useState(MOCK_ADMIN_USERS);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('joined');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = (id: string) => {
    // BACKEND INTEGRATION: DELETE /api/admin/user/:id
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirm(null);
    toast.success('User deleted and data removed');
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const SortIcon = ({ col }: { col: string }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ChevronUp size={12} className="text-primary" />
      ) : (
        <ChevronDown size={12} className="text-primary" />
      )
    ) : (
      <ChevronDown size={12} className="text-muted-foreground opacity-40" />
    );

  return (
    <div className="card-surface overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
          Recent Signups
        </h3>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-input border border-border rounded-full pl-8 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                { key: 'name', label: 'User' },
                { key: 'plan', label: 'Plan' },
                { key: 'status', label: 'Status' },
                { key: 'joined', label: 'Joined' },
                { key: 'bookmarks', label: 'Bookmarks' },
                { key: 'apiKeys', label: 'API Keys' },
              ].map((col) => (
                <th
                  key={`th-${col.key}`}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border hover:bg-muted/40 transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flame-gradient flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-display font-bold">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-sans font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-sans">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full ${PLAN_BADGE[user.plan]}`}
                  >
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono-custom text-muted-foreground tabular-nums">
                  {user.joined}
                </td>
                <td className="px-4 py-3 text-xs font-mono-custom text-foreground tabular-nums text-center">
                  {user.bookmarks}
                </td>
                <td className="px-4 py-3 text-xs font-mono-custom text-foreground tabular-nums text-center">
                  {user.apiKeys}
                </td>
                <td className="px-4 py-3 text-right">
                  {deleteConfirm === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-xs font-sans font-semibold text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs font-sans text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                      title="Delete user and all their data — this cannot be undone"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground font-sans">
                    No users matching &quot;{search}&quot;
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">
          Showing {filtered.length} of {users.length} users
        </p>
        <button className="text-xs font-sans font-semibold text-primary hover:underline">
          Export CSV
        </button>
      </div>
    </div>
  );
}
