'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, Check, ScanLine, ChevronLeft, ChevronRight, FileText, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}

// Load a CDN script only once
function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail silently
    document.head.appendChild(s);
  });
}

declare global {
  interface Window { cv: any; jscanify: any; jspdf: any; }
}

type Phase = 'scanning' | 'reviewing' | 'gallery';

export default function ScannerModal({ onScanComplete, onConvertToText, onClose }: ScannerModalProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const animRef    = useRef<number>(0);
  const scannerRef = useRef<any>(null);
  const steadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCaptureFiredRef = useRef(false);

  const [phase, setPhase]           = useState<Phase>('scanning');
  const [pages, setPages]           = useState<File[]>([]);          // accepted page blobs
  const [pageUrls, setPageUrls]     = useState<string[]>([]);        // preview URLs
  const [currentReview, setCurrentReview] = useState<{blob: Blob; url: string} | null>(null);
  const [galleryIndex, setGalleryIndex]   = useState(0);
  const [scannerReady, setScannerReady]   = useState(false);
  const [hint, setHint]             = useState('Loading scanner…');
  const [autoProgress, setAutoProgress]  = useState(0);   // 0–100 for the auto-capture ring
  const [error, setError]           = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // ── Load OpenCV + jscanify from CDN ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript('https://unpkg.com/jscanify@1.3.1/src/jscanify.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        // Wait for OpenCV to initialise (loaded by jscanify)
        await Promise.race([
          new Promise<void>(res => { const t = setInterval(() => { if (window.cv?.Mat) { clearInterval(t); res(); } }, 200); }),
          new Promise<void>(res => setTimeout(res, 10000)),
        ]);
        if (cancelled) return;
        if (window.jscanify) { scannerRef.current = new window.jscanify(); }
        setScannerReady(true);
        setHint('Hold steady — blue outline = document detected');
      } catch { if (!cancelled) { setScannerReady(true); setHint('Point camera at document and tap capture'); } }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch { setError('Camera access denied. Please allow camera access.'); }
  }, []);

  useEffect(() => {
    if (phase === 'scanning') startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
      if (steadyTimerRef.current) clearTimeout(steadyTimerRef.current);
    };
  }, [phase, startCamera]);

  // ── Overlay draw loop + auto-capture stability detection ─────────────────
  useEffect(() => {
    if (phase !== 'scanning') return;
    autoCaptureFiredRef.current = false;
    setAutoProgress(0);

    const STEADY_MS = 1800;
    const DIFF_THRESHOLD = 8; // lower = more sensitive

    let steadyStart: number | null = null;
    let lastAuto = false;

    const draw = () => {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || video.readyState < 2) { animRef.current = requestAnimationFrame(draw); return; }

      overlay.width  = video.videoWidth  || overlay.clientWidth;
      overlay.height = video.videoHeight || overlay.clientHeight;
      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // Draw video frame to temp canvas for analysis
      const tmp = document.createElement('canvas');
      tmp.width = overlay.width; tmp.height = overlay.height;
      const tmpCtx = tmp.getContext('2d')!;
      tmpCtx.drawImage(video, 0, 0, tmp.width, tmp.height);

      // Edge detection overlay
      if (scannerRef.current && scannerReady) {
        try {
          const result = scannerRef.current.highlightPaper(tmp);
          if (result) ctx.drawImage(result, 0, 0, overlay.width, overlay.height);
        } catch { drawGuide(ctx, overlay.width, overlay.height); }
      } else {
        drawGuide(ctx, overlay.width, overlay.height);
      }

      // Stability detection using frame diff
      const frame = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
      let isSteady = false;
      if (prevFrameRef.current && prevFrameRef.current.width === frame.width) {
        let diff = 0;
        const step = 8; // sample every 8th pixel for speed
        for (let i = 0; i < frame.data.length; i += step * 4) {
          diff += Math.abs(frame.data[i] - prevFrameRef.current.data[i]);
          diff += Math.abs(frame.data[i+1] - prevFrameRef.current.data[i+1]);
          diff += Math.abs(frame.data[i+2] - prevFrameRef.current.data[i+2]);
        }
        const avgDiff = diff / (frame.data.length / (step * 4) * 3);
        isSteady = avgDiff < DIFF_THRESHOLD;
      }
      prevFrameRef.current = frame;

      if (isSteady && !autoCaptureFiredRef.current) {
        if (!steadyStart) steadyStart = Date.now();
        const elapsed = Date.now() - steadyStart;
        const pct = Math.min(100, (elapsed / STEADY_MS) * 100);
        setAutoProgress(pct);

        // Draw auto-capture ring
        const cx = overlay.width / 2, cy = overlay.height - 80, r = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * pct / 100));
        ctx.strokeStyle = 'rgba(37,99,235,0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (elapsed >= STEADY_MS && !autoCaptureFiredRef.current) {
          autoCaptureFiredRef.current = true;
          captureFrame(video);
          return;
        }
        lastAuto = true;
      } else {
        if (lastAuto) { steadyStart = null; setAutoProgress(0); lastAuto = false; }
        if (!isSteady) steadyStart = null;
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, scannerReady]);

  // ── Capture a frame ───────────────────────────────────────────────────────
  const captureFrame = useCallback((videoEl?: HTMLVideoElement) => {
    const video = videoEl || videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Stop camera + animation
    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(animRef.current);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    let outputCanvas: HTMLCanvasElement = canvas;
    if (scannerRef.current) {
      try {
        const corrected = scannerRef.current.extractPaper(canvas, canvas.width, canvas.height);
        if (corrected) outputCanvas = corrected;
      } catch { /* use original */ }
    }

    outputCanvas.toBlob(blob => {
      if (!blob) return;
      setCurrentReview({ blob, url: URL.createObjectURL(blob) });
      setPhase('reviewing');
    }, 'image/jpeg', 0.95);
  }, []);

  // ── Accept the reviewed page ───────────────────────────────────────────────
  const acceptPage = useCallback(() => {
    if (!currentReview) return;
    const file = new File([currentReview.blob], `page-${pages.length + 1}.jpg`, { type: 'image/jpeg' });
    setPages(prev => [...prev, file]);
    setPageUrls(prev => [...prev, currentReview.url]);
    setCurrentReview(null);
    setPhase('gallery');
  }, [currentReview, pages.length]);

  // ── Retake current page ───────────────────────────────────────────────────
  const retake = useCallback(() => {
    if (currentReview) URL.revokeObjectURL(currentReview.url);
    setCurrentReview(null);
    prevFrameRef.current = null;
    setPhase('scanning');
  }, [currentReview]);

  // ── Remove a page from gallery ────────────────────────────────────────────
  const removePage = useCallback((idx: number) => {
    URL.revokeObjectURL(pageUrls[idx]);
    setPages(prev => prev.filter((_, i) => i !== idx));
    setPageUrls(prev => prev.filter((_, i) => i !== idx));
    setGalleryIndex(g => Math.max(0, Math.min(g, pages.length - 2)));
  }, [pageUrls, pages.length]);

  // ── Generate PDF from all pages ───────────────────────────────────────────
  const generatePdf = useCallback(async (): Promise<Blob> => {
    const { jsPDF } = window.jspdf;
    let pdf: any = null;

    for (let i = 0; i < pages.length; i++) {
      const file = pages[i];
      const url = pageUrls[i];

      // Load image to get dimensions
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = url;
      });

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const orientation = w > h ? 'landscape' : 'portrait';
      const pageW = orientation === 'portrait' ? 210 : 297;
      const pageH = orientation === 'portrait' ? 297 : 210;

      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      } else {
        pdf.addPage('a4', orientation);
      }

      pdf.addImage(url, 'JPEG', 0, 0, pageW, pageH);
    }

    return pdf.output('blob');
  }, [pages, pageUrls]);

  // ── Done: generate PDF and hand off ──────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (pages.length === 0) return;
    setGeneratingPdf(true);
    try {
      const pdfBlob = await generatePdf();
      onScanComplete(pages, pdfBlob);
    } catch (e) {
      console.error(e);
      // Fall back to just passing image pages
      onScanComplete(pages, new Blob(pages, { type: 'application/pdf' }));
    }
    setGeneratingPdf(false);
  }, [pages, generatePdf, onScanComplete]);

  // ── Convert to text immediately ───────────────────────────────────────────
  const handleConvert = useCallback(() => {
    if (pages.length === 0) return;
    onConvertToText(pages);
  }, [pages, onConvertToText]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', minHeight: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <ScanLine size={18} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {phase === 'scanning' && (pages.length > 0 ? `Page ${pages.length + 1}` : 'Scan document')}
            {phase === 'reviewing' && 'Review page'}
            {phase === 'gallery' && `${pages.length} page${pages.length !== 1 ? 's' : ''} scanned`}
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Main viewfinder / content ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#111' }}>

        {/* SCANNING phase */}
        {phase === 'scanning' && !error && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

            {/* Hint text */}
            <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
                {scannerReady ? hint : 'Loading scanner…'}
              </span>
            </div>

            {/* Auto-capture progress hint */}
            {autoProgress > 5 && (
              <div style={{ position: 'absolute', bottom: 108, left: 0, right: 0, textAlign: 'center' }}>
                <span style={{ background: 'rgba(37,99,235,0.8)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                  Hold still… auto-capturing
                </span>
              </div>
            )}
          </>
        )}

        {/* REVIEWING phase */}
        {phase === 'reviewing' && currentReview && (
          <img src={currentReview.url} alt="Scanned page" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}

        {/* GALLERY phase */}
        {phase === 'gallery' && pages.length > 0 && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Large preview */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img src={pageUrls[galleryIndex]} alt={`Page ${galleryIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

              {/* Page counter */}
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                {galleryIndex + 1} / {pages.length}
              </div>

              {/* Delete button */}
              <button
                onClick={() => removePage(galleryIndex)}
                style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <X size={14} />
              </button>

              {/* Prev / Next arrows */}
              {pages.length > 1 && (
                <>
                  <button onClick={() => setGalleryIndex(i => Math.max(0, i-1))} disabled={galleryIndex === 0}
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', opacity: galleryIndex === 0 ? 0.3 : 1 }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setGalleryIndex(i => Math.min(pages.length - 1, i+1))} disabled={galleryIndex === pages.length-1}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', opacity: galleryIndex === pages.length-1 ? 0.3 : 1 }}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {pages.length > 1 && (
              <div style={{ height: 72, display: 'flex', gap: 6, padding: '6px 12px', overflowX: 'auto', background: 'rgba(0,0,0,0.7)', alignItems: 'center' }}>
                {pageUrls.map((url, i) => (
                  <img
                    key={i} src={url} alt={`Thumb ${i+1}`}
                    onClick={() => setGalleryIndex(i)}
                    style={{ height: 56, width: 42, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: i === galleryIndex ? '2px solid #2563EB' : '2px solid transparent', flexShrink: 0, opacity: i === galleryIndex ? 1 : 0.6 }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center', padding: 24 }}>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Footer controls ── */}
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* SCANNING controls */}
        {phase === 'scanning' && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            {pages.length > 0 && (
              <button onClick={() => setPhase('gallery')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <img src={pageUrls[pageUrls.length - 1]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '2px solid rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: -6, right: -6, background: '#2563EB', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pages.length}</div>
                </div>
                Review
              </button>
            )}

            {/* Shutter */}
            <button onClick={() => captureFrame()}
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'transparent', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff' }} />
            </button>

            <div style={{ width: 36 }} />
          </div>
        )}

        {/* REVIEWING controls */}
        {phase === 'reviewing' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" onClick={retake}
              style={{ flex: 1, height: 52, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
              <RotateCcw size={16} style={{ marginRight: 6 }} /> Retake
            </Button>
            <Button onClick={acceptPage} style={{ flex: 1, height: 52 }}>
              <Check size={16} style={{ marginRight: 6 }} /> Accept
            </Button>
          </div>
        )}

        {/* GALLERY controls */}
        {phase === 'gallery' && (
          <>
            <Button variant="outline" onClick={() => { prevFrameRef.current = null; setPhase('scanning'); }}
              style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', gap: 6 }}>
              <Plus size={16} /> Scan Another Page
            </Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={handleDone} disabled={generatingPdf}
                style={{ flex: 1, height: 52, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', gap: 6 }}>
                <Download size={16} />
                {generatingPdf ? 'Building PDF…' : `Save as PDF (${pages.length}p)`}
              </Button>
              <Button onClick={handleConvert} style={{ flex: 1, height: 52, gap: 6 }}>
                <FileText size={16} /> Convert to Text
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 36;
  ctx.strokeStyle = 'rgba(37,99,235,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.setLineDash([]);
  const c = 24;
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 4;
  [[pad,pad],[w-pad,pad],[pad,h-pad],[w-pad,h-pad]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.moveTo(x + (x<w/2?c:-c), y); ctx.lineTo(x,y); ctx.lineTo(x, y+(y<h/2?c:-c)); ctx.stroke();
  });
}
