'use client';

import { Camera, Mic, X, Download, Loader2, FileText, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ThumbnailGrid = dynamic(() => import('@/components/thumbnail-grid'), { ssr: false });
const OutputBox     = dynamic(() => import('@/components/output-box'), { ssr: false });
const ScannerModal  = dynamic(() => import('@/components/scanner-modal'), { ssr: false });
const DictateModal  = dynamic(() => import('@/components/dictate-modal'), { ssr: false });

// Processing step checklist — visible during transcription
const STEPS = [
  'Reading image files',
  'Detecting handwriting regions',
  'Running AI transcription',
  'Formatting result',
];

function ProcessingView({ files, fileCount, onReset, onTranscribe, state }: {
  files: File[]; fileCount: number; onReset: () => void; onTranscribe: () => void; state: string;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    if (state !== 'processing') return;
    const interval = setInterval(() => setStepIdx(i => Math.min(i + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeUp 0.35s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', letterSpacing: '-0.5px', margin: 0 }}>
            {state === 'processing' ? 'Converting…' : 'Ready to convert'}
          </h1>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>
            {fileCount} page{fileCount !== 1 ? 's' : ''} selected
          </p>
        </div>
        <button onClick={onReset} style={{ width: 38, height: 38, borderRadius: '50%', background: '#F5F5F4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716C' }}>
          <X size={16} />
        </button>
      </div>

      {/* Thumbnails */}
      <div style={{ marginBottom: 24 }}>
        <ThumbnailGrid files={files} onRemove={state !== 'processing' ? () => {} : undefined} />
      </div>

      {/* Processing checklist */}
      {state === 'processing' && (
        <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E4', borderRadius: 18, padding: '20px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#44403C', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Processing
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < stepIdx ? '#22C55E' : i === stepIdx ? '#2563EB' : '#E7E5E4', transition: 'background 0.4s' }}>
                  {i < stepIdx ? (
                    <CheckCircle2 size={13} color="#fff" />
                  ) : i === stepIdx ? (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1s ease-in-out infinite' }} />
                  ) : null}
                </div>
                <span style={{ fontSize: 14, fontWeight: i <= stepIdx ? 600 : 400, color: i <= stepIdx ? '#1C1917' : '#A8A29E', transition: 'all 0.3s' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {state !== 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onTranscribe}
            style={{ width: '100%', height: 56, background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)', border: 'none', borderRadius: 18, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(37,99,235,0.35)', transition: 'transform 0.1s, box-shadow 0.1s' }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.985)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          >
            <Sparkles size={18} />
            Convert to Text ({fileCount} page{fileCount !== 1 ? 's' : ''})
          </button>
          <label htmlFor="file-upload-more" style={{ width: '100%', height: 48, background: '#F5F5F4', border: '1.5px solid #E7E5E4', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#44403C', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            + Add more pages
          </label>
          <input id="file-upload-more" type="file" style={{ display: 'none' }} multiple accept="image/*,application/pdf" onChange={e => { if (e.target.files) { /* addFiles handled outside */ } }} />
        </div>
      )}
    </div>
  );
}

function AppPageContent() {
  const { state, files, error, transcribedText, sessionId, sessionImages, audioUrl, addFiles, removeFile, transcribe, reset, fetchSession } = useTranscribe();
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showDictate, setShowDictate] = useState(false);
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);
  const [savedPdfName, setSavedPdfName] = useState('');
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc');

  useEffect(() => { if (docId) fetchSession(docId); }, [docId, fetchSession]);

  // Offline recording sync
  useEffect(() => {
    const syncOffline = async () => {
      if (!navigator.onLine) return;
      try {
        const { getOfflineRecordings, deleteOfflineRecording } = await import('@/lib/indexeddb');
        const offline = await getOfflineRecordings();
        for (const item of offline) {
          const fd = new FormData(); fd.append('files', item.blob, 'offline-dictation.wav');
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          if (res.ok) await deleteOfflineRecording(item.id);
        }
      } catch {}
    };
    syncOffline();
    window.addEventListener('online', syncOffline);
    return () => window.removeEventListener('online', syncOffline);
  }, []);

  const handleScanComplete = useCallback(async (pages: File[], pdfBlob: Blob) => {
    setShowScanner(false);
    if (savedPdfUrl) URL.revokeObjectURL(savedPdfUrl);
    const url = URL.createObjectURL(pdfBlob);
    const name = `scan-${new Date().toISOString().slice(0, 10)}-${pages.length}p.pdf`;
    setSavedPdfUrl(url); setSavedPdfName(name);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    try {
      const fd = new FormData(); fd.append('file', pdfBlob, name); fd.append('title', name);
      await fetch('/api/save-scan', { method: 'POST', body: fd });
    } catch {}
  }, [savedPdfUrl]);

  const handleConvertToText = useCallback((pages: File[]) => { setShowScanner(false); addFiles(pages); }, [addFiles]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.length) return; addFiles(Array.from(e.target.files)); if (e.target) e.target.value = ''; };

  // ── Fetching session ──────────────────────────────────────────────────────
  if (state === 'fetching_session') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E7E5E4', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 14, color: '#78716C', fontWeight: 500 }}>Loading document…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return <OutputBox text={transcribedText} sessionId={sessionId} images={sessionImages} audioUrl={audioUrl} onReset={reset} />;
  }

  // ── File review / processing ──────────────────────────────────────────────
  if (state === 'uploading' || state === 'processing') {
    return (
      <>
        {error && (
          <div style={{ margin: '16px 0', padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
            {error}
          </div>
        )}
        <ProcessingView
          files={files}
          fileCount={files.length}
          onReset={reset}
          onTranscribe={() => transcribe()}
          state={state}
        />
        <input id="file-upload-more" type="file" style={{ display: 'none' }} multiple accept="image/*,application/pdf" onChange={handleInputChange} />
      </>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={24} color="#EF4444" />
        </div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C1917', margin: '0 0 6px' }}>Something went wrong</h3>
          <p style={{ fontSize: 13, color: '#78716C', margin: 0, lineHeight: 1.6 }}>{error || 'An unexpected error occurred.'}</p>
        </div>
        <button onClick={reset} style={{ padding: '12px 28px', background: '#1C1917', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
          Try again
        </button>
      </div>
    );
  }

  // ── Idle home screen ──────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {showScanner && (
        <ScannerModal onScanComplete={handleScanComplete} onConvertToText={handleConvertToText} onClose={() => setShowScanner(false)} />
      )}
      {showDictate && (
        <DictateModal onClose={() => setShowDictate(false)} onTranscribeComplete={(text, id) => { setShowDictate(false); fetchSession(id); }} />
      )}

      <div style={{ paddingTop: 20, paddingBottom: 24, animation: 'fadeUp 0.4s ease' }}>

        {/* Greeting header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#A8A29E', margin: '0 0 4px', letterSpacing: '0.2px' }}>{greeting}</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0C0A09', margin: 0, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            {user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Inkto'}
          </h1>
          <p style={{ fontSize: 14, color: '#78716C', margin: '6px 0 0', lineHeight: 1.5 }}>
            What would you like to do today?
          </p>
        </div>

        {/* PDF banner */}
        {savedPdfUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)', border: '1px solid #BFDBFE', borderRadius: 16, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Download size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{savedPdfName}</p>
              <p style={{ fontSize: 11, color: '#60A5FA', margin: '2px 0 0' }}>Saved to Downloads</p>
            </div>
            <a href={savedPdfUrl} download={savedPdfName} style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Re-download
            </a>
          </div>
        )}

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>

          {/* Scan Document */}
          <button
            onClick={() => setShowScanner(true)}
            style={{ width: '100%', padding: '18px 20px', background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontFamily: 'inherit' }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.985)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #DBEAFE, #EFF6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={24} color="#2563EB" strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1917', margin: 0, letterSpacing: '-0.3px' }}>Scan Document</p>
              <p style={{ fontSize: 12, color: '#78716C', margin: '3px 0 0', lineHeight: 1.4 }}>Crop, flatten, enhance · Save as PDF</p>
            </div>
            <ChevronRight size={18} color="#D6D3D1" />
          </button>

          {/* Convert Handwriting */}
          <label
            htmlFor="file-upload"
            style={{ width: '100%', padding: '18px 20px', background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontFamily: 'inherit', boxSizing: 'border-box' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={24} color="#D97706" strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1917', margin: 0, letterSpacing: '-0.3px' }}>Handwriting to Text</p>
              <p style={{ fontSize: 12, color: '#78716C', margin: '3px 0 0', lineHeight: 1.4 }}>Upload photos, gallery images, or PDFs</p>
            </div>
            <ChevronRight size={18} color="#D6D3D1" />
          </label>

          {/* Voice Dictation */}
          <button
            onClick={() => setShowDictate(true)}
            style={{ width: '100%', padding: '18px 20px', background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontFamily: 'inherit' }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.985)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #DCFCE7, #F0FDF4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mic size={24} color="#16A34A" strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1917', margin: 0, letterSpacing: '-0.3px' }}>Voice Dictation</p>
              <p style={{ fontSize: 12, color: '#78716C', margin: '3px 0 0', lineHeight: 1.4 }}>Record, pause, save audio or transcribe</p>
            </div>
            <ChevronRight size={18} color="#D6D3D1" />
          </button>
        </div>

        {/* Quick tip / status */}
        <div style={{ background: '#F5F5F4', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', marginTop: 5, flexShrink: 0, boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
          <p style={{ fontSize: 12, color: '#78716C', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#44403C' }}>Tip:</strong> Scan multi-page documents, then tap{' '}
            <strong style={{ color: '#44403C' }}>Convert to Text</strong> inside the scanner to get a full editable transcript.
          </p>
        </div>

        {/* Hidden file inputs */}
        <input id="file-upload-camera" type="file" style={{ display: 'none' }} accept="image/*" capture="environment" onChange={handleInputChange} />
        <input id="file-upload" type="file" style={{ display: 'none' }} multiple accept="image/*,application/pdf" onChange={handleInputChange} />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E7E5E4', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <AppPageContent />
    </Suspense>
  );
}
