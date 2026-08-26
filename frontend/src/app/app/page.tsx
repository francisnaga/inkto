'use client';

import { Camera, Mic, FileText, X, Download, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ThumbnailGrid = dynamic(() => import('@/components/thumbnail-grid'), { ssr: false });
const OutputBox     = dynamic(() => import('@/components/output-box'), { ssr: false });
const ScannerModal  = dynamic(() => import('@/components/scanner-modal'), { ssr: false });
const DictateModal  = dynamic(() => import('@/components/dictate-modal'), { ssr: false });

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
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showDictate, setShowDictate] = useState(false);
  const [savedPdf, setSavedPdf]       = useState<{ url: string; name: string } | null>(null);
  const [procStep, setProcStep]       = useState(0);
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc');

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

  /* ── Error ───────────────────────────────────────── */
  if (state === 'error') {
    return (
      <div style={{ paddingTop: 48, fontFamily: UI }}>
        <p style={{ fontSize: 13, color: C.red, marginBottom: 16, lineHeight: 1.6 }}>
          {error || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          style={{ height: 44, padding: '0 24px', background: C.blue, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI }}
        >
          Try again
        </button>
      </div>
    );
  }

  /* ── Files staged / Processing ───────────────────── */
  if (state === 'uploading' || state === 'processing') {
    const processing = state === 'processing';
    return (
      <div style={{ paddingTop: 28, paddingBottom: 32, fontFamily: UI }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, letterSpacing: '-0.02em' }}>
            {processing ? 'Converting…' : `${files.length} page${files.length !== 1 ? 's' : ''} staged`}
          </h2>
          {!processing && (
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMute, padding: 0, display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Rule */}
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* Thumbnails */}
        <div style={{ marginBottom: 24 }}>
          <ThumbnailGrid files={files} onRemove={processing ? () => {} : removeFile} />
        </div>

        {/* Processing steps */}
        {processing && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              In progress
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {PROC_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {i < procStep
                    ? <CheckCircle2 size={16} color={C.blue} />
                    : i === procStep
                      ? <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                      : <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${C.border}`, flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 13, color: i <= procStep ? C.ink : C.warmMid, fontWeight: i <= procStep ? 600 : 400 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {!processing && (
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
        )}

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
      {showDictate && (
        <DictateModal
          onClose={() => setShowDictate(false)}
          onTranscribeComplete={(_, id) => { setShowDictate(false); fetchSession(id); }}
        />
      )}

      <div style={{ paddingTop: 32, paddingBottom: 32, fontFamily: UI }}>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.warmMid, margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {greeting}
          </p>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 28,
              fontWeight: 700,
              color: C.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            {firstName || 'Inkto'}
          </h1>
          <p style={{ fontSize: 13, color: C.inkMute, margin: 0 }}>What would you like to do today?</p>
        </div>

        {/* PDF download banner — uses Seal Brass as the one premium accent */}
        {savedPdf && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', marginBottom: 16 }}>
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
            <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
          </>
        )}

        {/* Action list — horizontal rules, not cards */}
        <div>
          {ACTIONS.map(({ id, icon, label, sub, trigger }, i) => (
            <div key={id}>
              {i > 0 && <div style={{ height: 1, background: C.border }} />}
              {trigger === 'upload' ? (
                <label
                  htmlFor="file-upload"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ActionRow icon={icon} label={label} sub={sub} />
                </label>
              ) : (
                <button
                  onClick={() => trigger === 'scanner' ? setShowScanner(true) : setShowDictate(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: UI, WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ActionRow icon={icon} label={label} sub={sub} />
                </button>
              )}
            </div>
          ))}
          <div style={{ height: 1, background: C.border }} />
        </div>

        {/* File inputs */}
        <input
          id="file-upload"
          type="file"
          style={{ display: 'none' }}
          multiple
          accept="image/*,application/pdf"
          onChange={handleInput}
        />
      </div>
    </>
  );
}

function ActionRow({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0B0D12', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{label}</p>
        <p style={{ fontSize: 12, color: '#6B6760', margin: 0, lineHeight: 1.4 }}>{sub}</p>
      </div>
      <ChevronRight size={16} color="#C8C4BA" />
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
