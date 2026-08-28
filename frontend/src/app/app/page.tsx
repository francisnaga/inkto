'use client';

import { Camera, Mic, FileText, X, Download, Loader2, ChevronRight, CheckCircle2, Crown, Sparkles, Plus, FolderOpen, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useAuth } from '@/contexts/auth-context';
import { Capacitor } from '@capacitor/core';
import { DocumentScanner } from '@capacitor-mlkit/document-scanner';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InktoWordmark } from '@/components/inkto-logo';
import { BottomNav } from '@/components/bottom-nav';
import { motion } from 'framer-motion';
import { ScannerService } from '@/lib/ScannerService';
import { PostScanResult } from '@/components/scanner/PostScanResult';
import { startBackgroundTranscription } from '@/lib/background-transcriber';
import { LocalQueue } from '@/lib/local-queue';

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

/* Action rows â€” thin horizontal rules between, no card boxes */
const ACTIONS = [
  {
    id: 'scan',
    icon: <Camera size={18} color={C.blue} strokeWidth={1.8} />,
    label: 'Scan Document',
    sub: 'Photograph Â· crop Â· flatten Â· save as PDF',
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
    batchProgress, pdfProgress,
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
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [postScanData, setPostScanData] = useState<{ pages: File[], pdfBlob?: Blob } | null>(null);
  const [postScanProcessing, setPostScanProcessing] = useState(false);
  
  const [activeDraft, setActiveDraft] = useState<{ id: string; audioUrl: string } | null>(null);
  const [procStep, setProcStep]       = useState(0);
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc');
  const resumeId = searchParams.get('resume');

  const [recents, setRecents] = useState<HistoryEntry[]>([]);
  const [recentsLoading, setRecentsLoading] = useState(true);

  useEffect(() => {
    if (resumeId) {
      fetch(`https://inkto.jointaccount.org/api/session?id=${resumeId}`)
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
        const res = await fetch(`https://inkto.jointaccount.org/api/history?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const localJobs = LocalQueue.getJobs().filter(j => j.status === 'processing');
          const merged = [...(data.history || [])];
          for (const job of localJobs) {
            const idx = merged.findIndex(h => h.id === job.id);
            if (idx !== -1) {
              if (!merged[idx].hasText) merged[idx].title = 'Processing: ' + merged[idx].title;
            } else {
              merged.unshift({
                id: job.id, title: 'Processing: ' + job.title, preview: '', createdAt: new Date(job.createdAt).toISOString(), sourceImageCount: 0, type: 'transcription', fileUrl: null, hasText: false
              } as HistoryEntry);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecents(merged.slice(0, 3));
        }
      } catch (e) {
        console.error('Failed to load recent items:', e);
      } finally {
        setRecentsLoading(false);
      }
    };
    loadRecents();
  }, [state, postScanProcessing]);

  useEffect(() => { if (docId) fetchSession(docId); }, [docId, fetchSession]);

  /* Offline sync */
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;
      try {
        const { getOfflineRecordings, deleteOfflineRecording } = await import('@/lib/indexeddb');
        for (const item of await getOfflineRecordings()) {
          const fd = new FormData(); fd.append('files', item.blob, 'offline-dictation.wav');
          if ((await fetch('https://inkto.jointaccount.org/api/transcribe', { method: 'POST', credentials: 'include', body: fd })).ok) await deleteOfflineRecording(item.id);
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

  const startNativeScanner = async () => {
    setShowActionSheet(false);
    if (Capacitor.isNativePlatform()) {
      const res = await ScannerService.scanNative();
      if (res && res.pages.length > 0) setPostScanData(res);
    } else {
      alert('You are using the web version of Inkto. Google ML Kit is a native Android feature and only works when you install the actual APK. Falling back to the web scanner...');
      setShowScanner(true);
    }
  };

  const handleWebScanComplete = (pages: File[], pdfBlob: Blob) => {
    setShowScanner(false);
    setPostScanData({ pages, pdfBlob });
  };

  const uploadPdfToStorage = async (blob: Blob, pagesCount: number): Promise<{url: string, id: string}> => {
    const name = `scan-${new Date().toISOString().slice(0, 10)}-${pagesCount}p.pdf`;
    const fd = new FormData(); 
    fd.append('file', blob, name); 
    fd.append('title', name); 
    const res = await fetch('https://inkto.jointaccount.org/api/save-scan', { method: 'POST', credentials: 'include', body: fd });
    const data = await res.json();
    return { url: '', id: data.id };
  };

  const handlePostScanSavePdf = async () => {
    if (!postScanData?.pdfBlob) {
        setPostScanData(null);
        return;
    }
    setPostScanProcessing(true);
    try {
      await uploadPdfToStorage(postScanData.pdfBlob, postScanData.pages.length);
      setPostScanData(null);
      router.push('/history');
    } catch (e) {
      alert('Failed to save PDF');
    } finally { setPostScanProcessing(false); }
  };

  const handlePostScanTranscribe = async () => {
    if (!postScanData) return;
    setPostScanProcessing(true);
    try {
      await startBackgroundTranscription(postScanData.pages);
      setPostScanData(null);
      router.push('/history');
    } catch {} finally { setPostScanProcessing(false); }
  };

  const handlePostScanSaveAndTranscribe = async () => {
    if (!postScanData) return;
    setPostScanProcessing(true);
    try {
      let existingId = undefined;
      if (postScanData.pdfBlob) {
        const { id } = await uploadPdfToStorage(postScanData.pdfBlob, postScanData.pages.length);
        existingId = id;
      }
      await startBackgroundTranscription(postScanData.pages, '', existingId);
      setPostScanData(null);
      router.push('/history');
    } catch {} finally { setPostScanProcessing(false); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.length) return; addFiles(Array.from(e.target.files)); if (e.target) e.target.value = ''; };

  /* â”€â”€ Loading session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (state === 'fetching_session') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, fontFamily: UI }}>
        <Loader2 size={20} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14, color: C.inkMute }}>Loading documentâ€¦</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* â”€â”€ Result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€ Preparing PDF (extracting pages client-side) â”€â”€ */
  if (state === 'preparing_pdf') {
    const cur = (pdfProgress as any)?.current || 1;
    const tot = (pdfProgress as any)?.total || 1;
    const pct = Math.max(5, Math.round((cur / tot) * 100));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: UI, textAlign: 'center', padding: 24 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: C.blueSub,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          animation: 'pulse 1.5s infinite'
        }}>
          <FileText size={32} color={C.blue} />
        </div>
        <h2 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>
          Preparing PDF for Transcriptionâ€¦
        </h2>
        <p style={{ fontSize: 13, color: C.inkMute, margin: '0 0 20px', maxWidth: 320, lineHeight: 1.5 }}>
          {(pdfProgress as any)?.fileName ? `${(pdfProgress as any).fileName} â€” ` : ''}Extracting page {cur} of {tot} ({pct}%)
        </p>
        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 280, height: 6, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: C.blue, borderRadius: 99, transition: 'width 0.2s ease' }} />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  /* â”€â”€ Files staged / Processing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (state === 'uploading' || state === 'processing') {
    const processing = state === 'processing';
    if (processing) {
      const cur = batchProgress?.current || 0;
      const tot = batchProgress?.total || files.length || 1;
      const pct = Math.min(100, Math.max(5, Math.round((cur / tot) * 100)));
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: UI, textAlign: 'center', padding: 24 }}>
          {/* Calm pulse animation container */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
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
                50% { transform: scale(1.08); opacity: 0.8; }
              }
            `}</style>
          </div>
          <h2 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Transcribing Legal Documentâ€¦
          </h2>
          <p style={{ fontSize: 13, color: C.inkMute, margin: '0 0 20px', maxWidth: 300, lineHeight: 1.5 }}>
            Inkto AI is transcribing page {Math.min(cur + 1, tot)} of {tot} ({pct}% complete)
          </p>

          {/* Progress Bar */}
          <div style={{ width: '100%', maxWidth: 280, height: 6, background: C.border, borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: C.blue, borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.inkMid, fontWeight: 500 }}>
            <Loader2 size={13} color={C.blue} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processing {batchProgress?.concurrency || 3} pages in parallel</span>
          </div>
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
              Convert to text â†’
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
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.email
    ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  return (
    <>
      {showScanner && (
        <ScannerModal
          onScanComplete={handleWebScanComplete}
          onConvertToText={(pages) => { setShowScanner(false); addFiles(pages); }}
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

      {postScanData && (
        <PostScanResult
          pages={postScanData.pages}
          pdfBlob={postScanData.pdfBlob}
          isProcessing={postScanProcessing}
          onAddPage={() => alert('Adding pages is supported via initial scan limit.')}
          onRetake={startNativeScanner}
          onSaveAsPdf={handlePostScanSavePdf}
          onTranscribe={handlePostScanTranscribe}
          onSaveAndTranscribe={handlePostScanSaveAndTranscribe}
          onCancel={() => setPostScanData(null)}
        />
      )}

      <div style={{ paddingTop: 32, paddingBottom: 100, fontFamily: UI, minHeight: '100vh', background: C.paper }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 20px' }}>
          <InktoWordmark size={30} />
          <button
            onClick={() => router.push('/account')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: C.blueSub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.blue, border: 'none' }}
          >
            {firstName ? firstName[0].toUpperCase() : 'U'}
          </button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 14, color: C.inkMute, marginBottom: 4 }}>{greeting},</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 24 }}>{firstName}</h1>
          
          <Button 
            onClick={() => setShowActionSheet(true)}
            className="w-full h-14 rounded-xl text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={20} /> New document
          </Button>

          <div style={{ marginTop: 36 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">Recent</h2>
              <Link href="/history" className="text-sm font-semibold text-blue-600">View all</Link>
            </div>
            
            <div className="space-y-3">
              {recentsLoading ? (
                <div className="animate-pulse h-16 bg-gray-200 rounded-xl w-full"></div>
              ) : recents.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No recent documents.</div>
              ) : (
                recents.map(r => (
                  <Link href={r.hasText ? '/app?doc=' + r.id : (r.type === 'draft' ? '/app?resume=' + r.id : '/history')} key={r.id}>
                    <div className="bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-300 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-600">
                        {r.type === 'voice' || r.type === 'draft' ? <Mic size={18} /> : (r.type === 'scan' ? <Camera size={18} /> : <FileText size={18} />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{r.title}</h3>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{new Date(r.createdAt).toLocaleDateString()} · {r.type}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {showActionSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowActionSheet(false)} />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative bg-white rounded-t-3xl p-6 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-lg font-bold text-gray-900 mb-4">New document</h2>
              <div className="space-y-2">
                <button onClick={startNativeScanner} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Camera size={20} /></div>
                  <div><div className="font-bold text-gray-900">Scan document</div><div className="text-xs text-gray-500 mt-0.5">Scan paper documents with Inkto</div></div>
                </button>
                <label className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FolderOpen size={20} /></div>
                  <div><div className="font-bold text-gray-900">Import file</div><div className="text-xs text-gray-500 mt-0.5">PDF, image or document</div></div>
                  <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={e => { if (e.target.files) { addFiles(Array.from(e.target.files)); setShowActionSheet(false); } }} />
                </label>
                <button onClick={() => { setShowDictate(true); setShowActionSheet(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mic size={20} /></div>
                  <div><div className="font-bold text-gray-900">Dictate</div><div className="text-xs text-gray-500 mt-0.5">Speak and create a document</div></div>
                </button>
                <button onClick={() => router.push('/templates')} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FileEdit size={20} /></div>
                  <div><div className="font-bold text-gray-900">Start from template</div><div className="text-xs text-gray-500 mt-0.5">Use an existing legal format</div></div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <BottomNav />
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


