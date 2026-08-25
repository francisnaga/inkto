'use client';

import { Camera, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranscribe } from '@/hooks/useTranscribe';
import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { compressImage } from '@/lib/imageCompressor';

const ThumbnailGrid = dynamic(() => import('@/components/thumbnail-grid'), { ssr: false });
const OutputBox = dynamic(() => import('@/components/output-box'), { ssr: false });
const ScannerModal = dynamic(() => import('@/components/scanner-modal'), { ssr: false });

export default function AppPage() {
  const { state, files, error, transcribedText, sessionId, sessionImages, addFiles, removeFile, transcribe, reset } = useTranscribe();
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  // True if the browser supports camera API over a secure context
  const [cameraSupported, setCameraSupported] = useState(false);

  useEffect(() => {
    // getUserMedia requires HTTPS (or localhost). Check at runtime so we can fallback gracefully.
    const isSecure = typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    setCameraSupported(isSecure && hasMediaDevices);
  }, []);

  const handleFiles = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setIsProcessingFiles(true);
    
    const imageFiles: File[] = [];
    const pdfFiles: File[] = [];
    
    for (const f of newFiles) {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(f);
      } else {
        imageFiles.push(f);
      }
    }

    // Add images immediately so the UI transitions to "Review Scan" instantly
    if (imageFiles.length > 0) {
      addFiles(imageFiles);
    }

    // Handle PDFs asynchronously
    if (pdfFiles.length > 0) {
      try {
        const { convertPdfToImages } = await import('@/lib/pdfHelper');
        for (const pdf of pdfFiles) {
          const images = await convertPdfToImages(pdf, () => {}) as File[];
          if (images && images.length > 0) {
            addFiles(images);
          }
        }
      } catch (err) {
        console.error('PDF conversion error:', err);
      }
    }
    
    setIsProcessingFiles(false);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await handleFiles(Array.from(e.target.files));
    if (e.target) e.target.value = '';
  };

  const handleScannerCapture = async (file: File) => {
    setShowScanner(false);
    await handleFiles([file]);
  };

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
        <div className="mt-auto space-y-4">
          <Button className="w-full h-14 text-lg font-semibold rounded-xl" onClick={() => transcribe()} disabled={state === 'processing'}>
            {state === 'processing' ? 'Processing...' : 'Convert to Text'}
          </Button>
          <label htmlFor="file-upload-more" className="w-full h-14 text-lg font-medium rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center cursor-pointer">
            Add More Pages
          </label>
        </div>
        <input id="file-upload-more" type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleInputChange} />
      </div>
    );
  }

  return (
    <>
      {showScanner && <ScannerModal onCapture={handleScannerCapture} onClose={() => setShowScanner(false)} />}

      <div className="flex flex-col h-full pt-12 pb-4 animate-in fade-in">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inkto</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-[280px] mx-auto">
            Handwriting, scans & voice — typed in seconds.
          </p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 mb-12">

          {cameraSupported ? (
            /* HTTPS / localhost: use the full in-app CamScanner-style scanner */
            <button
              onClick={() => setShowScanner(true)}
              disabled={isProcessingFiles}
              className="w-48 h-48 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Camera className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-xl font-semibold">{isProcessingFiles ? 'Loading...' : 'Scan'}</span>
            </button>
          ) : (
            /* HTTP (local IP testing): use native camera via file input — works without HTTPS */
            <label
              htmlFor="file-upload-camera"
              className={`w-48 h-48 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all cursor-pointer ${isProcessingFiles ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Camera className="w-16 h-16" strokeWidth={1.5} />
              <span className="text-xl font-semibold">{isProcessingFiles ? 'Loading...' : 'Scan'}</span>
            </label>
          )}

          {/* Upload existing file / PDF */}
          <label htmlFor="file-upload" className="text-sm text-muted-foreground underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
            or upload existing file / PDF
          </label>

          <Button
            variant="outline"
            className="w-32 h-32 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border-2 hover:bg-accent"
          >
            <Mic className="w-10 h-10" strokeWidth={1.5} />
            <span className="text-lg font-medium">Dictate</span>
          </Button>
        </div>

        {/* Hidden inputs */}
        {/* Camera input — native camera app, works on HTTP */}
        <input
          id="file-upload-camera"
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
        />
        {/* File/PDF picker — no capture attribute so it shows gallery + files */}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          multiple
          accept="image/*,application/pdf"
          onChange={handleInputChange}
        />

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
