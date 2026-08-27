'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/bottom-nav';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Clock, FileText, ScanLine, Search, Trash2, Pencil, Check, X, ExternalLink, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryEntry {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  sourceImageCount: number;
  type: 'scan' | 'transcription' | 'voice' | 'draft';
  fileUrl: string | null;
  hasText: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  scan: ScanLine,
  transcription: FileText,
  voice: FileText,
  draft: Clock,
};

const TYPE_LABEL: Record<string, string> = {
  scan: 'Scan',
  transcription: 'Text',
  voice: 'Voice',
  draft: 'Draft',
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
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scan' | 'transcription' | 'voice' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConvertScan = async (entry: HistoryEntry) => {
    if (!entry.fileUrl) return;
    setConvertingId(entry.id);
    try {
      const res = await fetch('/api/transcribe-past', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, fileUrl: entry.fileUrl, title: entry.title }),
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
      const cacheBust = `t=${Date.now()}`;
      const url = q ? `/api/history?search=${encodeURIComponent(q)}&${cacheBust}` : `/api/history?${cacheBust}`;
      const r = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
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
    setDeletingId(id);
    setConfirmDeleteId(null);
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
    return null;
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
        {(['all', 'scan', 'transcription', 'voice', 'draft'] as const).map(f => {
          const filterLabels: Record<string, string> = {
            all: 'All',
            scan: 'Scans',
            transcription: 'Text',
            voice: 'Voice',
            draft: 'Drafts',
          };
          return (
            <motion.button
              key={f}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filterLabels[f] ?? f}
            </motion.button>
          );
        })}
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
          {filtered.map((entry, idx) => {
            const Icon = TYPE_ICONS[entry.type] ?? FileText;
            const isDeleting = deletingId === entry.id;
            const isRenaming = renamingId === entry.id;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2, ease: 'easeOut' }}
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
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setRenamingId(isRenaming ? null : entry.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setConfirmDeleteId(entry.id)}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                {/* Open buttons */}
                {!isRenaming && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {entry.type === 'draft' ? (
                      <Link href={`/app?resume=${entry.id}`} className="flex-1">
                        <Button size="sm" variant="default" className="w-full h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium hover:text-white border-none">
                          <Clock className="w-3 h-3" /> Resume Recording
                        </Button>
                      </Link>
                    ) : (
                      <>
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
                              <ExternalLink className="w-3 h-3" /> {entry.type === 'voice' ? 'Listen Audio' : 'View PDF'}
                            </Button>
                          </a>
                        )}
                        {((entry.type === 'scan' || entry.type === 'voice') && !entry.hasText && entry.fileUrl) && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertScan(entry)}
                            disabled={convertingId !== null}
                            className="flex-1 h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium hover:text-white"
                          >
                            {convertingId === entry.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting…
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5" /> Convert to Text
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              style={{ background: '#FFFFFF', color: '#0B0D12', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 448, padding: '28px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ width: 36, height: 4, background: '#E4E1D9', borderRadius: 2, margin: '0 auto 4px' }} />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Georgia, serif', margin: '0 0 8px 0' }}>Delete Document?</h3>
                <p style={{ fontSize: 13, color: '#6B6760', margin: 0, lineHeight: 1.5 }}>
                  Are you sure you want to delete this document? This action is permanent and cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ flex: 1, height: 44, border: '1.5px solid #E4E2DC', background: 'transparent', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#57534E', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleDelete(confirmDeleteId)}
                  style={{ flex: 1, height: 44, border: 'none', background: '#DC2626', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
