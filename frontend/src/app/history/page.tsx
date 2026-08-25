'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Clock, FileText, ScanLine, Search, Trash2, Pencil, Check, X, ExternalLink, Loader2,
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  sourceImageCount: number;
  type: 'scan' | 'transcription' | 'voice';
  fileUrl: string | null;
  hasText: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  scan: ScanLine,
  transcription: FileText,
  voice: FileText,
};

const TYPE_LABEL: Record<string, string> = {
  scan: 'Scan',
  transcription: 'Text',
  voice: 'Voice',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Inline rename input row
function RenameInput({
  initial,
  onSave,
  onCancel,
}: { initial: string; onSave: (t: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 text-sm font-medium border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        maxLength={200}
      />
      <button onClick={() => onSave(val)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scan' | 'transcription' | 'voice'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConvertScan = async (entry: HistoryEntry) => {
    if (!entry.fileUrl) return;
    setConvertingId(entry.id);
    try {
      const res = await fetch('/api/transcribe-past', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: entry.fileUrl, title: entry.title }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      window.location.href = `/app?doc=${data.id}`;
    } catch (e: any) {
      alert(e.message || 'Could not convert scan. Please try again.');
      setConvertingId(null);
    }
  };

  const fetchHistory = useCallback(async (q = '') => {
    setFetching(true);
    try {
      const url = q ? `/api/history?search=${encodeURIComponent(q)}` : '/api/history';
      const r = await fetch(url, { credentials: 'include' });
      const data = await r.json();
      if (data.history) setHistory(data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user, fetchHistory]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchHistory(q), 350);
  };

  const handleRename = async (id: string, title: string) => {
    if (!title.trim()) { setRenamingId(null); return; }
    setHistory(h => h.map(e => e.id === id ? { ...e, title } : e));
    setRenamingId(null);
    try {
      await fetch('/api/rename-document', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: title.trim() }),
      });
    } catch { /* silent — optimistic update already applied */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await fetch('/api/delete-document', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setHistory(h => h.filter(e => e.id !== id));
    } catch { alert('Failed to delete — try again.'); }
    finally { setDeletingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search documents…"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

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
            {f === 'all' ? 'All' : TYPE_LABEL[f] ?? f}
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
          <p className="text-muted-foreground text-sm">
            {searchQuery ? 'No documents match your search.' : 'No documents yet.'}
          </p>
          {!searchQuery && (
            <Link href="/app" className="mt-4">
              <Button variant="outline" size="sm">Capture your first document</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map(entry => {
            const Icon = TYPE_ICONS[entry.type] ?? FileText;
            const isDeleting = deletingId === entry.id;
            const isRenaming = renamingId === entry.id;

            return (
              <div
                key={entry.id}
                className="p-4 rounded-xl border bg-card"
                style={{ opacity: isDeleting ? 0.5 : 1 }}
              >
                {/* Header row: icon + title + actions */}
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <RenameInput
                        initial={entry.title}
                        onSave={t => handleRename(entry.id, t)}
                        onCancel={() => setRenamingId(null)}
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {entry.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(entry.createdAt)}
                      {entry.sourceImageCount > 0 && ` · ${entry.sourceImageCount} ${entry.sourceImageCount === 1 ? 'page' : 'pages'}`}
                      {' · '}<span className="capitalize">{TYPE_LABEL[entry.type] ?? entry.type}</span>
                    </p>
                    {entry.preview && !isRenaming && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                        {entry.preview}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      onClick={() => setRenamingId(isRenaming ? null : entry.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Open buttons */}
                {!isRenaming && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {entry.hasText && (
                      <Link href={`/app?doc=${entry.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5">
                          <FileText className="w-3 h-3" /> Open in editor
                        </Button>
                      </Link>
                    )}
                    {entry.fileUrl && (
                      <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5">
                          <ExternalLink className="w-3 h-3" /> View PDF
                        </Button>
                      </a>
                    )}
                    {entry.type === 'scan' && entry.fileUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleConvertScan(entry)}
                        disabled={convertingId !== null}
                        className="flex-1 h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium hover:text-white"
                      >
                        {convertingId === entry.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Converting…
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3" /> Convert to Text
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
