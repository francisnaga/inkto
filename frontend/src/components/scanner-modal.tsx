'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, Check, ScanLine, ChevronLeft, ChevronRight, FileText, Download, Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail silently — we fall back to plain capture
    document.head.appendChild(s);
  });
}

declare global {
  interface Window { jscanify: any; jspdf: any; }
}

type Phase = 'scanning' | 'reviewing' | 'gallery';

export default function ScannerModal({ onScanComplete, onConvertToText, onClose }: ScannerModalProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const animRef     = useRef<number>(0);
  const scannerRef  = useRef<any>(null);

  const [phase, setPhase]                 = useState<Phase>('scanning');
  const [pages, setPages]                 = useState<File[]>([]);
  const [pageUrls, setPageUrls]           = useState<string[]>([]);
  const [currentReview, setCurrentReview] = useState<{ blob: Blob; url: string } | null>(null);
  const [galleryIndex, setGalleryIndex]   = useState(0);
  const [scannerReady, setScannerReady]   = useState(false);
  const [videoReady, setVideoReady]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [capturing, setCapturing]         = useState(false);

  // ── Load jscanify + jsPDF from CDN (best-effort, non-blocking) ──────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript('https://unpkg.com/jscanify@1.3.1/src/jscanify.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        // Give OpenCV up to 8 seconds to init
        await Promise.race([
          new Promise<void>(res => {
            const t = setInterval(() => {
              if ((window as any).cv?.Mat) { clearInterval(t); res(); }
            }, 200);
          }),
          new Promise<void>(res => setTimeout(res, 8000)),
        ]);
        if (!cancelled && window.jscanify) {
          scannerRef.current = new window.jscanify();
        }
      } catch { /* jscanify is optional enhancement */ }
      if (!cancelled) setScannerReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Start rear camera ────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setVideoReady(false);
    try {
      // Stop any existing stream first
      streamRef.current?.getTracks().forEach(t => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoReady(true);
      }
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera access was denied. Please allow camera access in your browser settings, then try again.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Could not start camera: ${err?.message || 'Unknown error'}. Try retaking.`;
      setError(msg);
    }
  }, []);

  // ── Stop camera helper ───────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    if (phase === 'scanning') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [phase, startCamera, stopCamera]);

  // ── Draw edge-guide overlay on live video ────────────────────────────────
  useEffect(() => {
    if (phase !== 'scanning') return;

    const draw = () => {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || video.readyState < 2) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      overlay.width  = video.videoWidth  || overlay.clientWidth;
      overlay.height = video.videoHeight || overlay.clientHeight;
      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (scannerRef.current) {
        try {
          const tmp = document.createElement('canvas');
          tmp.width = overlay.width; tmp.height = overlay.height;
          tmp.getContext('2d')!.drawImage(video, 0, 0, tmp.width, tmp.height);
          const result = scannerRef.current.highlightPaper(tmp);
          if (result) { ctx.drawImage(result, 0, 0, overlay.width, overlay.height); }
          else { drawGuide(ctx, overlay.width, overlay.height); }
        } catch { drawGuide(ctx, overlay.width, overlay.height); }
      } else {
        drawGuide(ctx, overlay.width, overlay.height);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, scannerReady]);

  // ── Capture single frame on shutter press ───────────────────────────────
  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturing) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      setError('Camera is not ready yet. Please wait a moment and try again.');
      return;
    }

    setCapturing(true);
    cancelAnimationFrame(animRef.current);

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    // Try perspective correction via jscanify; fall back to raw capture
    let outputCanvas: HTMLCanvasElement = canvas;
    if (scannerRef.current) {
      try {
        const corrected = scannerRef.current.extractPaper(canvas, canvas.width, canvas.height);
        if (corrected && corrected.width > 10) outputCanvas = corrected;
      } catch { /* use raw */ }
    }

    outputCanvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return; }
      setCurrentReview({ blob, url: URL.createObjectURL(blob) });
      setPhase('reviewing');
      setCapturing(false);
    }, 'image/jpeg', 0.92);
  }, [capturing]);

  // ── Accept reviewed page ─────────────────────────────────────────────────
  const acceptPage = useCallback(() => {
    if (!currentReview) return;
    const file = new File([currentReview.blob], `page-${pages.length + 1}.jpg`, { type: 'image/jpeg' });
    setPages(prev => [...prev, file]);
    setPageUrls(prev => [...prev, currentReview.url]);
    setCurrentReview(null);
    setPhase('gallery');
  }, [currentReview, pages.length]);

  // ── Retake ────────────────────────────────────────────────────────────────
  const retake = useCallback(() => {
    if (currentReview) URL.revokeObjectURL(currentReview.url);
    setCurrentReview(null);
    setPhase('scanning');
  }, [currentReview]);

  // ── Remove a page ─────────────────────────────────────────────────────────
  const removePage = useCallback((idx: number) => {
    URL.revokeObjectURL(pageUrls[idx]);
    setPages(prev => prev.filter((_, i) => i !== idx));
    setPageUrls(prev => prev.filter((_, i) => i !== idx));
    setGalleryIndex(g => Math.max(0, Math.min(g, pages.length - 2)));
  }, [pageUrls, pages.length]);

  // ── Generate PDF ─────────────────────────────────────────────────────────
  const generatePdf = useCallback(async (): Promise<Blob> => {
    const { jsPDF } = window.jspdf;
    let pdf: any = null;
    for (let i = 0; i < pages.length; i++) {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = pageUrls[i];
      });
      const w = img.naturalWidth, h = img.naturalHeight;
      const isLandscape = w > h;
      const [pw, ph] = isLandscape ? [297, 210] : [210, 297];
      if (!pdf) {
        pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      } else {
        pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
      }
      pdf.addImage(pageUrls[i], 'JPEG', 0, 0, pw, ph);
    }
    return pdf.output('blob');
  }, [pages, pageUrls]);

  // ── Save as PDF ───────────────────────────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (pages.length === 0) return;
    setGeneratingPdf(true);
    try {
      const pdfBlob = await generatePdf();
      onScanComplete(pages, pdfBlob);
    } catch {
      // jsPDF not loaded? fall back to passing images
      onScanComplete(pages, new Blob(pages, { type: 'application/pdf' }));
    } finally {
      setGeneratingPdf(false);
    }
  }, [pages, generatePdf, onScanComplete]);

  // ── Convert to Text ───────────────────────────────────────────────────────
  const handleConvert = useCallback(() => {
    if (pages.length === 0) return;
    onConvertToText(pages);
  }, [pages, onConvertToText]);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const s = {
    wrap:   { position: 'fixed' as const, inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' as const, fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', minHeight: 56, flexShrink: 0 },
    body:   { flex: 1, position: 'relative' as const, overflow: 'hidden', background: '#111' },
    footer: { padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' as const, gap: 10, flexShrink: 0 },
    iconBtn:(extra?: object) => ({ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', ...extra }),
    hint:   { position: 'absolute' as const, top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' as const },
  };

  const pageLabel = phase === 'scanning'
    ? (pages.length > 0 ? `Page ${pages.length + 1}` : 'Scan document')
    : phase === 'reviewing' ? 'Review page'
    : `${pages.length} page${pages.length !== 1 ? 's' : ''} scanned`;

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <ScanLine size={18} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{pageLabel}</span>
        </div>
        <button onClick={onClose} style={s.iconBtn()}><X size={16} /></button>
      </div>

      {/* Body */}
      <div style={s.body}>

        {/* SCANNING */}
        {phase === 'scanning' && !error && (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            <div style={s.hint}>
              <span style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 20, backdropFilter: 'blur(6px)' }}>
                {!videoReady ? 'Starting camera…' : scannerReady ? 'Aim at document — tap shutter to capture' : 'Point camera at document and tap capture'}
              </span>
            </div>
          </>
        )}

        {/* REVIEWING */}
        {phase === 'reviewing' && currentReview && (
          <img
            src={currentReview.url}
            alt="Scanned page"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block',
              // Spec: captured photo should "settle" into its corrected position
              animation: 'scanSettle 0.28s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}

        {/* GALLERY */}
        {phase === 'gallery' && pages.length > 0 && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img src={pageUrls[galleryIndex]} alt={`Page ${galleryIndex + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                {galleryIndex + 1} / {pages.length}
              </div>
              <button onClick={() => removePage(galleryIndex)}
                style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={14} />
              </button>

              {pages.length > 1 && (
                <>
                  <button onClick={() => setGalleryIndex(i => Math.max(0, i - 1))} disabled={galleryIndex === 0}
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', opacity: galleryIndex === 0 ? 0.3 : 1 }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setGalleryIndex(i => Math.min(pages.length - 1, i + 1))} disabled={galleryIndex === pages.length - 1}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', opacity: galleryIndex === pages.length - 1 ? 0.3 : 1 }}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {pages.length > 1 && (
              <div style={{ height: 76, display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', background: 'rgba(0,0,0,0.7)', alignItems: 'center' }}>
                {pageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Thumb ${i + 1}`} onClick={() => setGalleryIndex(i)}
                    style={{ height: 56, width: 44, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                      border: i === galleryIndex ? '2px solid #3B82F6' : '2px solid transparent',
                      flexShrink: 0, opacity: i === galleryIndex ? 1 : 0.55, transition: 'opacity 0.15s, border-color 0.15s' }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center', padding: 32, gap: 20 }}>
            <Camera size={40} style={{ opacity: 0.5 }} />
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 300 }}>{error}</p>
            <button onClick={startCamera}
              style={{ padding: '11px 28px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Settle animation */}
      <style>{`
        @keyframes scanSettle {
          from { opacity: 0.6; transform: scale(0.96); }
          to   { opacity: 1;   transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes scanSettle { from {} to {} }
        }
      `}</style>

      {/* Footer */}
      <div style={s.footer}>

        {/* SCANNING controls */}
        {phase === 'scanning' && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>

            {/* Thumbnail of last page (if any) */}
            {pages.length > 0 ? (
              <button onClick={() => setPhase('gallery')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <img src={pageUrls[pageUrls.length - 1]} alt=""
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '2px solid rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: -6, right: -6, background: '#2563EB', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pages.length}
                  </div>
                </div>
                Review
              </button>
            ) : (
              <div style={{ width: 40 }} />
            )}

            {/* Shutter button */}
            <button
              onClick={captureFrame}
              disabled={!videoReady || capturing}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'transparent',
                border: `4px solid ${videoReady ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'}`,
                cursor: videoReady ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s',
              }}>
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: capturing ? '#94A3B8' : videoReady ? '#fff' : '#4B5563',
                transition: 'background 0.2s',
              }} />
            </button>

            <div style={{ width: 40 }} />
          </div>
        )}

        {/* REVIEWING controls */}
        {phase === 'reviewing' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" onClick={retake}
              style={{ flex: 1, height: 52, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', gap: 6, fontSize: 15, fontWeight: 600 }}>
              <RotateCcw size={16} /> Retake
            </Button>
            <Button onClick={acceptPage}
              style={{ flex: 1, height: 52, gap: 6, fontSize: 15, fontWeight: 600 }}>
              <Check size={16} /> Use this page
            </Button>
          </div>
        )}

        {/* GALLERY controls */}
        {phase === 'gallery' && (
          <>
            <Button variant="outline" onClick={() => setPhase('scanning')}
              style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', gap: 6, fontSize: 14, fontWeight: 600 }}>
              <Plus size={16} /> Scan another page
            </Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={handleDone} disabled={generatingPdf}
                style={{ flex: 1, height: 52, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', gap: 6, fontSize: 14, fontWeight: 600 }}>
                <Download size={16} />
                {generatingPdf ? 'Building PDF…' : `Save PDF (${pages.length}p)`}
              </Button>
              <Button onClick={handleConvert}
                style={{ flex: 1, height: 52, gap: 6, fontSize: 14, fontWeight: 600 }}>
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
  const pad = 32;
  ctx.setLineDash([12, 6]);
  ctx.strokeStyle = 'rgba(59,130,246,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.setLineDash([]);

  const c = 22;
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  [[pad, pad], [w - pad, pad], [pad, h - pad], [w - pad, h - pad]].forEach(([x, y]) => {
    const dx = x < w / 2 ? c : -c;
    const dy = y < h / 2 ? c : -c;
    ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy); ctx.stroke();
  });
}