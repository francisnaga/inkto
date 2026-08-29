'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  FileText, FileAudio, Clock, Trash2, Search, MoreVertical,
  Check, X, PenTool, Loader2, FileX,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
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

const P = '#5A45FF';
const Ps = '#EDE9FE';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const UI = '"Inter", -apple-system, sans-serif';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  scan:          { icon: FileText,  color: '#5A45FF', bg: '#EDE9FE', label: 'Document' },
  transcription: { icon: FileText,  color: '#5A45FF', bg: '#EDE9FE', label: 'Document' },
  voice:         { icon: FileAudio, color: '#F97316', bg: '#FFF7ED', label: 'Audio' },
  draft:         { icon: PenTool,   color: '#0EA5E9', bg: '#E0F2FE', label: 'Draft' },
};

function RenameInput({ initial, onSave, onCancel }: { initial: string; onSave: (t: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
        style={{
          flex: 1, height: 36, fontSize: 13, fontWeight: 500,
          border: `1.5px solid ${P}`, borderRadius: 8,
          padding: '0 10px', outline: 'none',
          background: 'white', color: TEXT, fontFamily: UI,
          boxShadow: `0 0 0 3px ${Ps}`,
        }}
        maxLength={200}
      />
      <button
        onClick={() => onSave(val)}
        style={{ width: 32, height: 32, borderRadius: 8, background: P, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Check size={14} />
      </button>
      <button
        onClick={onCancel}
        style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [history, setHistory]     = useState<HistoryEntry[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [filter, setFilter]       = useState<'all' | 'scan' | 'voice' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const data = await apiGet<{ documents: HistoryEntry[] }>('/history', { limit: '100' });
        setHistory(data.documents || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleRename = async (id: string, newTitle: string) => {
    setRenamingId(null);
    if (!newTitle.trim()) return;
    const oldTitle = history.find(h => h.id === id)?.title;
    if (oldTitle === newTitle) return;
    setHistory(prev => prev.map(h => (h.id === id ? { ...h, title: newTitle } : h)));
    try {
      await apiPost('/rename-document', { id, newTitle });
    } catch {
      setHistory(prev => prev.map(h => (h.id === id ? { ...h, title: oldTitle! } : h)));
      alert('Failed to rename — try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document forever?')) return;
    setDeletingId(id); setMenuOpenId(null);
    try {
      await apiPost('/delete-document', { id });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      alert('Failed to delete — try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const FILTER_TABS = [
    { key: 'all',   label: 'All' },
    { key: 'voice', label: 'Audio' },
    { key: 'scan',  label: 'Documents' },
    { key: 'draft', label: 'Drafts' },
  ] as const;

  const filtered = history.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter || (filter === 'scan' && item.type === 'transcription');
    const matchesSearch = !searchQuery || (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div style={{ minHeight: '100svh', background: '#F8FAFC', fontFamily: UI }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ paddingTop: 24, paddingBottom: 16 }}>
          <h1 style={{ fontFamily: '"Poppins", sans-serif', fontSize: 22, fontWeight: 700, color: TEXT, margin: 0 }}>
            My Files
          </h1>
          <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>
            {history.length} {history.length === 1 ? 'document' : 'documents'}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} color={MUTED} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search files…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: 48,
              paddingLeft: 42, paddingRight: 16,
              background: 'white',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 14, fontSize: 14, color: TEXT,
              outline: 'none', fontFamily: UI, boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = P; e.target.style.boxShadow = `0 0 0 3px ${Ps}`; }}
            onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: filter === tab.key ? P : 'white',
                color: filter === tab.key ? '#fff' : MUTED,
                boxShadow: filter === tab.key ? `0 2px 8px rgba(90,69,255,0.3)` : `0 0 0 1px ${BORDER}`,
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={24} color={P} style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 64 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: Ps, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileX size={28} color={P} />
            </div>
            <h3 style={{ fontFamily: '"Poppins", sans-serif', fontSize: 16, fontWeight: 600, color: TEXT, margin: '0 0 8px' }}>
              {searchQuery ? 'No results found' : 'No files yet'}
            </h3>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
              {searchQuery ? 'Try a different search term' : 'Scan a document or record audio to get started'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {filtered.map((item, i) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.scan;
                const Icon = cfg.icon;
                const isDeleting = deletingId === item.id;
                const isRenaming = renamingId === item.id;
                const isMenuOpen = menuOpenId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      background: 'white',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 16,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: isRenaming ? 'default' : 'pointer',
                      position: 'relative',
                      opacity: isDeleting ? 0.5 : 1,
                      transition: 'opacity 200ms',
                    }}
                    onClick={() => {
                      if (isRenaming || isMenuOpen) return;
                      router.push(`/app?doc=${item.id}`);
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} color={cfg.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isRenaming ? (
                        <div onClick={e => e.stopPropagation()}>
                          <RenameInput
                            initial={item.title}
                            onSave={t => handleRename(item.id, t)}
                            onCancel={() => setRenamingId(null)}
                          />
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title || 'Untitled Document'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: MUTED }}>{formatDate(item.createdAt)}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 7px',
                              borderRadius: 20, color: cfg.color, background: cfg.bg,
                            }}>
                              {cfg.label}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Context menu */}
                    {!isRenaming && (
                      <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpenId(isMenuOpen ? null : item.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: isMenuOpen ? Ps : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}
                        >
                          {isDeleting
                            ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <MoreVertical size={16} />
                          }
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -4 }}
                              transition={{ duration: 0.12 }}
                              style={{
                                position: 'absolute', right: 0, top: 36, zIndex: 20,
                                background: 'white', border: `1px solid ${BORDER}`,
                                borderRadius: 12, overflow: 'hidden',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                minWidth: 140,
                              }}
                            >
                              <button
                                onClick={() => { setMenuOpenId(null); setRenamingId(item.id); }}
                                style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: TEXT, textAlign: 'left', display: 'block' }}
                              >
                                ✏️ Rename
                              </button>
                              <div style={{ height: 1, background: BORDER }} />
                              <button
                                onClick={() => handleDelete(item.id)}
                                style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#EF4444', textAlign: 'left', display: 'block' }}
                              >
                                🗑️ Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
