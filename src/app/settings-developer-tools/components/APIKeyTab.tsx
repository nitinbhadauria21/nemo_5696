'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Copy, Trash2, Eye, EyeOff, CheckCheck, Plus } from 'lucide-react';
import { MOCK_API_KEYS } from '@/lib/mockData';

interface CreateKeyForm {
  name: string;
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string;
  created: string;
  requests: number;
}

export default function APIKeyTab() {
  const [keys, setKeys] = useState<APIKey[]>(MOCK_API_KEYS);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateKeyForm>();

  const handleCreate = (data: CreateKeyForm) => {
    // BACKEND INTEGRATION: POST /api/api-keys
    setIsCreating(true);
    setTimeout(() => {
      const newKey = `NT_${data.name.toLowerCase().replace(/\s+/g, '_').slice(0, 8)}_${Math.random().toString(36).slice(2, 8)}XXXXXXXXXXXXXXXX`;
      setNewKeyValue(newKey);
      setKeys((prev) => [
        {
          id: `key-${Date.now()}`,
          name: data.name,
          prefix: newKey.slice(0, 18),
          lastUsed: 'Never',
          created: '2026-07-12',
          requests: 0,
        },
        ...prev,
      ]);
      setIsCreating(false);
      reset();
    }, 1000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('API key copied — store it securely, it won\'t be shown again');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = (id: string) => {
    // BACKEND INTEGRATION: DELETE /api/api-keys/:id
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setDeleteConfirm(null);
    toast.success('API key revoked');
  };

  return (
    <div className="space-y-5">
      {/* New key revealed */}
      {newKeyValue && (
        <div className="p-4 bg-accent/5 border border-accent/30 rounded-xl animate-fade-in">
          <p className="text-xs font-mono-custom text-accent font-bold uppercase tracking-wide mb-2">
            ✅ New API Key — Copy Now
          </p>
          <p className="text-xs text-muted-foreground font-sans mb-3">
            This key will only be shown once. Store it securely — we don&apos;t store the full key.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 font-mono-custom text-sm text-foreground overflow-hidden">
              {showNewKey ? newKeyValue : '•'.repeat(40)}
            </div>
            <button onClick={() => setShowNewKey((s) => !s)} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
              {showNewKey ? <EyeOff size={15} className="text-muted-foreground" /> : <Eye size={15} className="text-muted-foreground" />}
            </button>
            <button onClick={() => handleCopy(newKeyValue)} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
              {copied ? <CheckCheck size={15} className="text-accent" /> : <Copy size={15} className="text-muted-foreground" />}
            </button>
          </div>
          <button
            onClick={() => setNewKeyValue(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground font-sans"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Create new key */}
      <div className="card-surface p-5">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
          Create New API Key
        </h3>
        <form onSubmit={handleSubmit(handleCreate)} className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Key name
            </label>
            <p className="text-xs text-muted-foreground font-sans mb-1.5">
              Descriptive name to identify this key&apos;s purpose (e.g. &quot;Production Dashboard&quot;)
            </p>
            <input
              type="text"
              placeholder="My Content Bot"
              {...register('name', { required: 'Key name is required' })}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreating}
              className="btn-flame flex items-center gap-1.5 px-5 py-2.5 text-sm disabled:opacity-70"
            >
              {isCreating ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Plus size={14} />
              )}
              Create Key
            </button>
          </div>
        </form>
      </div>

      {/* Key list */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
            Your API Keys ({keys.length})
          </h3>
        </div>
        {keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground font-sans">No API keys yet — create one above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Name', 'Key Preview', 'Created', 'Last Used', 'Requests', ''].map((col, i) => (
                    <th key={`th-key-${i}`} className="px-4 py-2.5 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                    <td className="px-4 py-3 text-sm font-sans font-medium text-foreground">{key.name}</td>
                    <td className="px-4 py-3 font-mono-custom text-xs text-muted-foreground">{key.prefix}…</td>
                    <td className="px-4 py-3 font-mono-custom text-xs text-muted-foreground tabular-nums">{key.created}</td>
                    <td className="px-4 py-3 font-mono-custom text-xs text-muted-foreground tabular-nums">{key.lastUsed}</td>
                    <td className="px-4 py-3 font-mono-custom text-xs text-foreground tabular-nums">{key.requests.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {deleteConfirm === key.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(key.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg">
                            Revoke
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(key.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                          title="Revoke this API key — this cannot be undone"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}