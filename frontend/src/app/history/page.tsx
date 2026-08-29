'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { FileText, FileAudio, Clock, Trash2, Search, MoreVertical, Check, X, Folder, PenTool } from 'lucide-react';

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
  scan: FileText,
  transcription: FileText,
  voice: FileAudio,
  draft: PenTool,
};

function RenameInput({
  initial,
  onSave,
  onCancel,
}: { initial: string; onSave: (t: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-2 mt-1 w-full">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 text-sm font-medium border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
        maxLength={200}
      />
      <button onClick={() => onSave(val)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4F46E5] text-white">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scan' | 'voice' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history?limit=100');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.documents || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleSearch = (q: string) => setSearchQuery(q);

  const handleRename = async (id: string, newTitle: string) => {
    setRenamingId(null);
    if (!newTitle.trim()) return;
    const oldTitle = history.find(h => h.id === id)?.title;
    if (oldTitle === newTitle) return;

    setHistory(prev => prev.map(h => (h.id === id ? { ...h, title: newTitle } : h)));
    try {
      const res = await fetch('/api/rename-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newTitle }),
      });
      if (!res.ok) throw new Error('Rename failed');
    } catch {
      setHistory(prev => prev.map(h => (h.id === id ? { ...h, title: oldTitle! } : h)));
      alert('Failed to rename — try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document forever?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/delete-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      alert('Failed to delete — try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const filtered = history.filter(h => {
    const matchesFilter = filter === 'all' ? true : h.type === filter;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (h.preview && h.preview.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-6 mt-2 md:mt-0">
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#0F172A] mb-1">My Files</h1>
        <p className="text-[#64748B] text-sm">Access, organize, and manage all your files.</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#94A3B8]" />
        </div>
        <input
          type="search"
          placeholder="Search files..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-[#0F172A]">
             <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'scan', 'voice', 'draft'] as const).map(f => {
          const filterLabels: Record<string, string> = {
            all: 'All', scan: 'Scan', voice: 'Audio', draft: 'Handwritten'
          };
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border }
            >
              {filterLabels[f]}
            </button>
          );
        })}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
            <h3 className="text-[#0F172A] font-semibold">No files found</h3>
            <p className="text-[#94A3B8] text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm divide-y divide-[#E2E8F0] overflow-hidden">
            {filtered.map(entry => {
              const Icon = TYPE_ICONS[entry.type] ?? FileText;
              const isDeleting = deletingId === entry.id;
              const isRenaming = renamingId === entry.id;
              const isAudio = entry.type === 'voice';

              return (
                <div key={entry.id} className={lex items-start p-4 transition-colors }>
                  <div className={shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4 }>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4 mt-1">
                    {isRenaming ? (
                      <RenameInput
                        initial={entry.title}
                        onSave={t => handleRename(entry.id, t)}
                        onCancel={() => setRenamingId(null)}
                      />
                    ) : (
                      <div 
                        className="cursor-pointer group"
                        onClick={() => {
                          if (!isRenaming) router.push(entry.type === 'draft' ? /draft?id= : /app?doc=);
                        }}
                      >
                        <h3 className="text-[15px] font-semibold text-[#0F172A] truncate group-hover:text-[#4F46E5] transition-colors">{entry.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-[#94A3B8] text-xs font-medium">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {entry.hasText && <span className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#64748B]">Transcribed</span>}
                        </div>
                        {entry.preview && (
                          <p className="text-sm text-[#64748B] mt-2 line-clamp-1 overflow-hidden text-ellipsis">{entry.preview}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="shrink-0 flex items-center gap-2 mt-2">
                       <button onClick={() => setRenamingId(entry.id)} className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5] hover:bg-[#E0E7FF] rounded-lg transition-colors">
                         <PenTool size={16} />
                       </button>
                       <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
