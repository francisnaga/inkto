'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, Check, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

// Load a script from CDN once
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

declare global {
  interface Window {
    cv: any;
    jscanify: any;
  }
}

export default function ScannerModal({ onCapture, onClose }: ScannerModalProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const animRef    = useRef<number>(0);
  const scannerRef = useRef<any>(null);

  const [phase, setPhase] = useState<'scanning' | 'preview'>('scanning');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl]   = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerHint, setScannerHint]   = useState('Loading scanner...');

  // Load OpenCV + jscanify from CDN
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Load jscanify browser bundle from CDN
        await loadScript('https://unpkg.com/jscanify@1.3.1/src/jscanify.js');
        // Give OpenCV time to initialise (jscanify loads opencv.js internally)
        const waitForCV = () => new Promise<void>((res) => {
          const check = () => {
            if (window.cv && window.cv.Mat) { res(); return; }
            setTimeout(check, 200);
          };
          check();
        });
        // Try for up to 8 seconds
        await Promise.race([waitForCV(), new Promise((_, rej) => setTimeout(() => rej(new Error('cv timeout')), 8000))]);
        if (cancelled) return;
        if (window.jscanify) {
          scannerRef.current = new window.jscanify();
          setScannerReady(true);
          setScannerHint('Hold steady — align edges with the blue outline');
        }
      } catch {
        if (!cancelled) {
          // Fall back to plain capture — scanner still works, just no edge detection overlay
          setScannerReady(true);
          setScannerHint('Point camera at document and capture');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Start camera
  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch {
        setError('Camera access denied. Please allow camera access and try again.');
      }
    };
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Draw edge-detection overlay loop
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
      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (scannerRef.current && scannerReady) {
        try {
          const tmp = document.createElement('canvas');
          tmp.width = overlay.width; tmp.height = overlay.height;
          tmp.getContext('2d')!.drawImage(video, 0, 0, tmp.width, tmp.height);
          const result = scannerRef.current.highlightPaper(tmp);
          if (result) ctx.drawImage(result, 0, 0, overlay.width, overlay.height);
        } catch {
          // OpenCV not ready yet — draw guide frame
          drawGuide(ctx, overlay.width, overlay.height);
        }
      } else {
        drawGuide(ctx, overlay.width, overlay.height);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, scannerReady]);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(animRef.current);

    let outputCanvas: HTMLCanvasElement = canvas;
    if (scannerRef.current) {
      try {
        const corrected = scannerRef.current.extractPaper(canvas, canvas.width, canvas.height);
        if (corrected) outputCanvas = corrected;
      } catch { /* use original frame */ }
    }

    outputCanvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      setPhase('preview');
    }, 'image/jpeg', 0.92);
  }, []);

  const confirm = useCallback(() => {
    if (!capturedBlob) return;
    onCapture(new File([capturedBlob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }, [capturedBlob, onCapture]);

  const retake = useCallback(async () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null); setCapturedUrl(null); setPhase('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch { setError('Could not restart camera.'); }
  }, [capturedUrl]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <ScanLine size={18} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{phase === 'scanning' ? 'Position document' : 'Review scan'}</span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="#fff" />
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {phase === 'scanning' && !error && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '5px 14px', borderRadius: '20px', backdropFilter: 'blur(6px)' }}>
                {scannerHint}
              </span>
            </div>
          </>
        )}
        {phase === 'preview' && capturedUrl && (
          <img src={capturedUrl} alt="Scanned document" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.6 }}>{error}</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div style={{ padding: '20px 16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
        {phase === 'scanning' && !error && (
          <button
            onClick={capture}
            style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'transparent', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff' }} />
          </button>
        )}
        {phase === 'preview' && (
          <>
            <Button variant="outline" onClick={retake} style={{ flex: 1, height: '52px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
              <RotateCcw size={16} style={{ marginRight: '8px' }} /> Retake
            </Button>
            <Button onClick={confirm} style={{ flex: 1, height: '52px' }}>
              <Check size={16} style={{ marginRight: '8px' }} /> Use this scan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 36;
  ctx.strokeStyle = 'rgba(37,99,235,0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.setLineDash([]);
  // Corner marks
  const c = 24;
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 4;
  [[pad,pad],[w-pad,pad],[pad,h-pad],[w-pad,h-pad]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.moveTo(x + (x<w/2?c:-c), y); ctx.lineTo(x,y); ctx.lineTo(x, y + (y<h/2?c:-c)); ctx.stroke();
  });
}
