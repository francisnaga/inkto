'use client';

import { Camera, Mic, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ThumbnailGrid = dynamic(() => import('@/components/thumbnail-grid'), { ssr: false });
const OutputBox     = dynamic(() => import('@/components/output-box'), { ssr: false });
const ScannerModal  = dynamic(() => import('@/components/scanner-modal'), { ssr: false });

function AppPageContent() {
  const { state, files, error, transcribedText, sessionId, sessionImages, addFiles, removeFile, transcribe, reset, fetchSession } = useTranscribe();
  const [showScanner, setShowScanner] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);
  const [savedPdfName, setSavedPdfName] = useState('');
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc');

  useEffect(() => {
    if (docId) {
      fetchSession(docId);
    }
  }, [docId, fetchSession]);

  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setCameraSupported(isSecure && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Called when user taps "Save as PDF" inside scanner
  const handleScanComplete = useCallback(async (pages: File[], pdfBlob: Blob) => {
    setShowScanner(false);
    // Revoke any old URL
    if (savedPdfUrl) URL.revokeObjectURL(savedPdfUrl);
    const url = URL.createObjectURL(pdfBlob);
    const name = `scan-${new Date().toISOString().slice(0,10)}-${pages.length}p.pdf`;
    setSavedPdfUrl(url);
    setSavedPdfName(name);
    // Trigger browser download immediately
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();

    // Save to cloud history (Phase 1 Requirement)
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, name);
      formData.append('title', name);
      await fetch('/api/save-scan', {
        method: 'POST',
        body: formData
      });
    } catch (e) {
      console.error('Failed to sync scan to history:', e);
    }
  }, [savedPdfUrl]);

  // Called when user taps "Convert to Text" inside scanner
  const handleConvertToText = useCallback((pages: File[]) => {
    setShowScanner(false);
    addFiles(pages);
  }, [addFiles]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFiles(Array.from(e.target.files));
    if (e.target) e.target.value = '';
  };

  if (state === 'fetching_session') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading document...</p>
      </div>
    );
  }

  if (state === 'success') {
    return <OutputBox text={transcribedText} sessionId={sessionId} images={sessionImages} onReset={reset} />;
  }

  if (state === 'uploading' || state === 'processing') {
    return (
      <div className="flex flex-col h-full pt-8 pb-4 animate-in fade-in">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Review Scan</h1>
          <Button variant="ghost" size="icon" onClick={reset}><X className="h-5 w-5" /></Button>
        </header>
        <div className="flex-1 overflow-y-auto mb-6">
          <ThumbnailGrid files={files} onRemove={removeFile} />
        </div>
        <div className="mt-auto space-y-3">
          <Button className="w-full h-14 text-lg font-semibold rounded-xl" onClick={() => transcribe()} disabled={state === 'processing'}>
            {state === 'processing' ? 'Converting…' : `Convert to Text (${files.length} page${files.length !== 1 ? 's' : ''})`}
          </Button>
          <label htmlFor="file-upload-more" className="w-full h-12 text-base font-medium rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center cursor-pointer">
            + Add More Pages
          </label>
        </div>
        <input id="file-upload-more" type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleInputChange} />
      </div>
    );
  }

  return (
    <>
      {showScanner && (
        <ScannerModal
          onScanComplete={handleScanComplete}
          onConvertToText={handleConvertToText}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex flex-col h-full pt-12 pb-4 animate-in fade-in">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inkto</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-[280px] mx-auto">
            Scan documents · Convert handwriting to text
          </p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 mb-12">

          {/* Primary: Scan button */}
          {cameraSupported ? (
            <button
              onClick={() => setShowScanner(true)}
              className="w-48 h-48 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <Camera className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-xl font-semibold">Scan</span>
            </button>
          ) : (
            <label htmlFor="file-upload-camera"
              className="w-48 h-48 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer">
              <Camera className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-xl font-semibold">Scan</span>
            </label>
          )}

          {/* Secondary: upload existing */}
          <label htmlFor="file-upload" className="text-sm text-muted-foreground underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
            or upload existing file / PDF
          </label>

          {/* Dictate (coming soon) */}
          <Button variant="outline" disabled
            className="w-32 h-32 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border-2 opacity-50">
            <Mic className="w-10 h-10" strokeWidth={1.5} />
            <span className="text-sm font-medium">Dictate<br/><span className="text-xs font-normal">(coming soon)</span></span>
          </Button>
        </div>

        {/* Last PDF saved banner */}
        {savedPdfUrl && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <Download className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{savedPdfName}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">Saved to Downloads</p>
            </div>
            <a href={savedPdfUrl} download={savedPdfName} className="text-xs text-blue-600 font-semibold underline shrink-0">Re-download</a>
          </div>
        )}

        {/* File inputs */}
        <input id="file-upload-camera" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleInputChange} />
        <input id="file-upload" type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleInputChange} />

        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Ready
          </p>
        </div>
      </div>
    </>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AppPageContent />
    </Suspense>
  );
}

