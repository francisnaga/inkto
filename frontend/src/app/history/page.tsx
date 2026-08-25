'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Clock, FileText, Mic, ScanLine } from 'lucide-react';

interface HistoryEntry {
  id: string;
  preview: string;
  createdAt: string;
  sourceImageCount: number;
  type?: string;
}

const TYPE_ICONS = {
  scan: ScanLine,
  transcription: FileText,
  voice: Mic,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scan' | 'transcription' | 'voice'>('all');

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    fetch('/api/history', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.history) setHistory(data.history);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show login wall
  if (!user) {
    return (
      <div className="flex flex-col h-full pt-16 pb-4 items-center text-center">
        <Clock className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2">Your History</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Sign in to access your saved documents and transcriptions.
        </p>
        <Link href="/login">
          <Button size="lg" className="w-full">Sign in to view history</Button>
        </Link>
      </div>
    );
  }

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);

  return (
    <div className="flex flex-col h-full pt-8 pb-4">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'scan', 'transcription', 'voice'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No documents yet.</p>
          <Link href="/" className="mt-4">
            <Button variant="outline" size="sm">Capture your first document</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map(entry => {
            const Icon = TYPE_ICONS[entry.type as keyof typeof TYPE_ICONS] || FileText;
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.preview || 'Untitled document'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(entry.createdAt)} · {entry.sourceImageCount} {entry.sourceImageCount === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
