'use client';

import { Camera, Mic, FileText, X, Download, Loader2, ChevronRight, CheckCircle2, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InktoWordmark } from '@/components/inkto-logo';
import { BottomNav } from '@/components/bottom-nav';

const ThumbnailGrid = dynamic(() => import('@/components/thumbnail-grid'), { ssr: false });
const OutputBox     = dynamic(() => import('@/components/output-box'), { ssr: false });
const ScannerModal  = dynamic(() => import('@/components/scanner-modal'), { ssr: false });
const DictateModal  = dynamic(() => import('@/components/dictate-modal'), { ssr: false });

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

/* Inkto design tokens */
const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueSub: '#EEF2F8',
  brass:   '#A6822C',
  brassS:  '#F8F2E6',
  red:     '#B23A34',
  warmMid: '#C8C4BA',
};
const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';
const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

/* Action rows — thin horizontal rules between, no card boxes */
const ACTIONS = [
  {
    id: 'scan',
    icon: <Camera size={18} color={C.blue} strokeWidth={1.8} />,
    label: 'Scan Document',
    sub: 'Photograph · crop · flatten · save as PDF',
    trigger: 'scanner',
  },
  {
    id: 'handwriting',
    icon: <FileText size={18} color={C.blue} strokeWidth={1.8} />,
    label: 'Handwriting to Text',
    sub: 'Upload photos, gallery images, or PDFs',
    trigger: 'upload',
  },
  {
    id: 'voice',
    icon: <Mic size={18} color={C.blue} strokeWidth={1.8} />,
    label: 'Voice Dictation',
    sub: 'Record, save audio, or transcribe with AI',
    trigger: 'dictate',
  },
] as const;

const PROC_STEPS = [
  'Reading image files',
  'Detecting handwriting regions',
  'Running AI transcription',
  'Formatting result',
];

function AppPageContent() {
  const {
    state, files, error, transcribedText,
    sessionId, sessionImages, audioUrl,
    addFiles, removeFile, transcribe, reset, fetchSession,
  } = useTranscribe();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const [showScanner, setShowScanner] = useState(false);
  const [showDictate, setShowDictate] = useState(false);
  const [activeDraft, setActiveDraft] = useState<{ id: string; audioUrl: string } | null>(null);
  const [savedPdf, setSavedPdf]       = useState<{ url: string; name: string } | null>(null);
  const [procStep, setProcStep]       = useState(0);
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc');
  const resumeId = searchParams.get('resume');

  const [recents, setRecents] = useState<HistoryEntry[]>([]);
  const [recentsLoading, setRecentsLoading] = useState(true);

  useEffect(() => {
    if (resumeId) {
      fetch(`/api/session?id=${resumeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.session && data.session.audioUrl) {
            setActiveDraft({ id: resumeId, audioUrl: data.session.audioUrl });
          }
        })
        .catch(e => console.error('Failed to load draft for resumption:', e));
    }
  }, [resumeId]);

  useEffect(() => {
    const loadRecents = async () => {
      try {
        const res = await fetch(`/api/history?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRecents((data.history || []).slice(0, 2));
        }
      } catch (e) {
        console.error('Failed to load recent items:', e);
      } finally {
        setRecentsLoading(false);
      }
    };
    loadRecents();
  }, [state]);

  useEffect(() => { if (docId) fetchSession(docId); }, [docId, fetchSession]);

  /* Offline sync */
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;
      try {
        const { getOfflineRecordings, deleteOfflineRecording } = await import('@/lib/indexeddb');
        for (const item of await getOfflineRecordings()) {
          const fd = new FormData(); fd.append('files', item.blob, 'offline-dictation.wav');
          if ((await fetch('/api/transcribe', { method: 'POST', body: fd })).ok) await deleteOfflineRecording(item.id);
        }
      } catch {}
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);

  /* Processing step animation */
  useEffect(() => {
    if (state !== 'processing') { setProcStep(0); return; }
    const id = setInterval(() => setProcStep(n => Math.min(n + 1, PROC_STEPS.length - 1)), 1900);
    return () => clearInterval(id);
  }, [state]);

  /* Toggle body class to hide bottom navigation when scanner or dictate modal is open */
  useEffect(() => {
    if (showScanner) {
      document.body.classList.add('scanner-active');
    } else {
      document.body.classList.remove('scanner-active');
    }
  }, [showScanner]);

  useEffect(() => {
    if (showDictate) {
      document.body.classList.add('dictate-active');
    } else {
      document.body.classList.remove('dictate-active');
    }
  }, [showDictate]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('scanner-active', 'dictate-active');
    };
  }, []);

  const handleScanComplete = useCallback(async (pages: File[], pdfBlob: Blob) => {
    setShowScanner(false);
    if (savedPdf) URL.revokeObjectURL(savedPdf.url);
    const url  = URL.createObjectURL(pdfBlob);
    const name = `scan-${new Date().toISOString().slice(0, 10)}-${pages.length}p.pdf`;
    setSavedPdf({ url, name });
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    try { const fd = new FormData(); fd.append('file', pdfBlob, name); fd.append('title', name); await fetch('/api/save-scan', { method: 'POST', body: fd }); } catch {}
  }, [savedPdf]);

  const handleConvertToText = useCallback((pages: File[]) => { setShowScanner(false); addFiles(pages); }, [addFiles]);
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.length) return; addFiles(Array.from(e.target.files)); if (e.target) e.target.value = ''; };

  /* ── Loading session ─────────────────────────────── */
  if (state === 'fetching_session') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, fontFamily: UI }}>
        <Loader2 size={20} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14, color: C.inkMute }}>Loading document…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Result ──────────────────────────────────────── */
  if (state === 'success') {
    return (
      <OutputBox
        text={transcribedText}
        sessionId={sessionId}
        images={sessionImages}
        audioUrl={audioUrl}
        onReset={reset}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* ── Error ───────────────────────────────────────── */
  if (state === 'error') {
    const errStr = String(error || '');
    const isLimit = errStr.toLowerCase().includes('limit') || errStr.toLowerCase().includes('free') || errStr.toLowerCase().includes('upgrade');
    return (
      <div style={{ paddingTop: 48, fontFamily: UI, textAlign: isLimit ? 'center' : 'left' }}>
        {isLimit ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.brassS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={24} color={C.brass} />
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, margin: 0 }}>Daily Limit Reached</h2>
            <p style={{ fontSize: 13, color: C.inkMute, margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
              You have completed your 5 free conversions/drafts for today. Upgrade to Pro for unlimited document scanning, text conversions, and drafting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280, marginTop: 12 }}>
              <Link href="/account" style={{ width: '100%' }}>
                <Button style={{ width: '100%', height: 44, background: C.blue, color: '#fff', fontWeight: 700, borderRadius: 6 }}>
                  Upgrade to Pro
                </Button>
              </Link>
              <button
                onClick={reset}
                style={{ height: 44, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: 'pointer' }}
              >
                Go back
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.red, marginBottom: 16, lineHeight: 1.6 }}>
              {error || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              style={{ height: 44, padding: '0 24px', background: C.blue, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI }}
            >
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  /* ── Files staged / Processing ───────────────────── */
  if (state === 'uploading' || state === 'processing') {
    const processing = state === 'processing';
    if (processing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: UI, textAlign: 'center', padding: 24 }}>
          {/* Calm pulse animation container */}
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: C.blueSub,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              <FileText size={28} color={C.blue} />
            </div>
            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
              }
            `}</style>
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Reading your document...
          </h2>
          <p style={{ fontSize: 13, color: C.inkMute, margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
            Inkto AI is transcribing and formatting your legal text. Please hold on.
          </p>
        </div>
      );
    }

    return (
      <div style={{ paddingTop: 28, paddingBottom: 32, fontFamily: UI }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, letterSpacing: '-0.02em' }}>
            {files.length} page{files.length !== 1 ? 's' : ''} staged
          </h2>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMute, padding: 0, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Rule */}
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* Thumbnails */}
        <div style={{ marginBottom: 24 }}>
          <ThumbnailGrid files={files} onRemove={removeFile} />
        </div>

        {/* CTA */}
        <>
          <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => transcribe()}
              style={{ width: '100%', height: 48, background: C.blue, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A5C94'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.blue; }}
            >
              Convert to text →
            </button>
            <label
              htmlFor="add-more"
              style={{ width: '100%', height: 44, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: 'pointer', fontFamily: UI, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
            >
              + Add more pages
            </label>
            <input id="add-more" type="file" style={{ display: 'none' }} multiple accept="image/*,application/pdf" onChange={handleInput} />
          </div>
        </>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Idle home ───────────────────────────────────── */
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.email
    ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  return (
    <>
      {showScanner && (
        <ScannerModal
          onScanComplete={handleScanComplete}
          onConvertToText={handleConvertToText}
          onClose={() => setShowScanner(false)}
        />
      )}
      {(showDictate || activeDraft) && (
        <DictateModal
          draftId={activeDraft?.id}
          initialAudioUrl={activeDraft?.audioUrl}
          onClose={() => { setShowDictate(false); setActiveDraft(null); }}
          onTranscribeComplete={(_, id) => { setShowDictate(false); setActiveDraft(null); fetchSession(id); }}
        />
      )}

      <div style={{ paddingTop: 32, paddingBottom: 32, fontFamily: UI }}>

        {/* Top Header: Wordmark left, Profile right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <InktoWordmark size={30} />
          <button
            onClick={() => router.push('/account')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.blueSub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.blue }}>
              {firstName ? firstName[0].toUpperCase() : 'U'}
            </div>
          </button>
        </div>

        {/* Big Central Capture Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '48px 0 32px' }}>
          <button
            onClick={() => setShowScanner(true)}
            style={{
              width: 144,
              height: 144,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `3px solid ${C.blue}`,
              boxShadow: `0 8px 24px rgba(36, 70, 122, 0.06)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.blueSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={22} color={C.blue} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: UI }}>Capture</span>
          </button>
        </div>

        {/* Record & Import row */}
        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 280, margin: '0 auto 48px' }}>
          <button
            onClick={() => setShowDictate(true)}
            style={{
              flex: 1,
              height: 44,
              background: '#FFFFFF',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: C.inkMid,
              fontFamily: UI,
            }}
          >
            <Mic size={15} color={C.blue} />
            Record
          </button>
          <label
            htmlFor="file-upload"
            style={{
              flex: 1,
              height: 44,
              background: '#FFFFFF',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: C.inkMid,
              fontFamily: UI,
              boxSizing: 'border-box',
            }}
          >
            <FileText size={15} color={C.blue} />
            Import
          </label>
        </div>

        {/* PDF download banner if active */}
        {savedPdf && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', marginBottom: 24 }}>
              <Download size={15} color={C.brass} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.inkMid, margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {savedPdf.name}
                </p>
                <p style={{ fontSize: 11, color: C.warmMid, margin: 0 }}>Saved to Downloads</p>
              </div>
              <a
                href={savedPdf.url}
                download={savedPdf.name}
                style={{ fontSize: 12, fontWeight: 700, color: C.brass, textDecoration: 'none', flexShrink: 0 }}
              >
                Re-download
              </a>
            </div>
            <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
          </>
        )}

        {/* Recent Items section */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            Recent Documents
          </h3>
          
          {recentsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
              <Loader2 size={16} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: C.inkMute }}>Loading recents...</span>
            </div>
          ) : recents.length === 0 ? (
            <p style={{ fontSize: 13, color: C.inkMute, margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
              Nothing yet — capture or record something to get started.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recents.map(item => {
                const isScan = item.type === 'scan';
                const isVoice = item.type === 'voice' || item.type === 'draft';
                const Icon = isScan ? Camera : isVoice ? Mic : FileText;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => fetchSession(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: UI,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: C.blueSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={C.blue} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: 11, color: C.inkMute, margin: 0 }}>
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {item.type === 'draft' && <span style={{ color: C.red, marginLeft: 8, fontWeight: 600 }}>Draft</span>}
                      </p>
                    </div>
                    <ChevronRight size={14} color={C.warmMid} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary Action CTA: New Draft */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/draft')}
            style={{
              background: 'none',
              border: 'none',
              color: C.blue,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: UI,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>✨ Start a New Document Draft</span>
          </button>
        </div>

        {/* Hidden File Input for Native Picker */}
        <input
          id="file-upload"
          type="file"
          style={{ display: 'none' }}
          multiple
          accept="image/*,application/pdf"
          onChange={handleInput}
        />

      </div>
      {!showScanner && !showDictate && <BottomNav />}
    </>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={<div style={{ height: 200 }} />}>
      <AppPageContent />
    </Suspense>
  );
}
