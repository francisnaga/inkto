'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X, RotateCw, Check, ChevronLeft,
  FileText, Download, Plus, Camera, Loader2, Zap, ZapOff,
  Crop as CropIcon, Trash2, Sliders, Sparkles, Sun, Image as ImageIcon,
  SwitchCamera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { scannerBridge, Pt, Quad, CamFilter } from '@/lib/scanner-bridge';
import { compilePdfFromCanvases, canvasToFile } from '@/lib/pdf';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}

type Phase = 'scanning' | 'adjusting' | 'reviewing' | 'batch_summary';

interface ScannedPage {
  id: string;
  originalCanvas: HTMLCanvasElement;
  corners: Quad;
  warpedCanvas: HTMLCanvasElement;
  enhancedCanvas: HTMLCanvasElement;
  filter: CamFilter;
  rotation: number;
}

const UI = '-apple-system, "Segoe UI", Roboto, sans-serif';

const FILTERS: { id: CamFilter; label: string; icon: any }[] = [
  { id: 'magic_color', label: 'Magic Color', icon: Sparkles },
  { id: 'bw',          label: 'B&W Clean',   icon: FileText },
  { id: 'no_shadow',   label: 'No Shadow',   icon: Sun },
  { id: 'lighten',     label: 'Lighten',     icon: Sliders },
  { id: 'original',    label: 'Original',    icon: ImageIcon },
];

export default function ScannerModal({ onScanComplete, onConvertToText, onClose }: ScannerModalProps) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [procMsg, setProcMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Camera stream & controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedLiveCorners, setDetectedLiveCorners] = useState<Quad | null>(null);

  // Crop & Loupe (touch magnifier)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const liveCornersRef = useRef<Quad | null>(null);

  // File input fallback
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 1. WebRTC Camera Stream ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraReady(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch(() => {});
        setCameraReady(true);
      }

      // Check flash / torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));
    } catch (e: any) {
      console.warn('Camera error:', e);
      setError('Camera access unavailable. You can upload document photos directly using the Import button.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
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

  const toggleCameraLens = useCallback(() => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Failed to toggle torch:', e);
      }
    }
  }, [torchOn]);

  // ── 2. Live Corner Detection Loop on Video Stream ───────────────────────────
  useEffect(() => {
    if (phase !== 'scanning' || !cameraReady) return;

    let animId: number;
    let lastScanTime = 0;

    const detectLoop = async (time: number) => {
      if (videoRef.current && liveCanvasRef.current && videoRef.current.videoWidth > 0) {
        const video = videoRef.current;
        const canvas = liveCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 640) || 480;
        }

        if (time - lastScanTime > 350 && ctx && canvas.width > 0 && canvas.height > 0) {
          lastScanTime = time;
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const corners = await scannerBridge.detectCorners(canvas);
            setDetectedLiveCorners(corners);
          } catch {}
        }
      }
      animId = requestAnimationFrame(detectLoop);
    };

    animId = requestAnimationFrame(detectLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, cameraReady]);

  // ── 3. Shutter Capture ───────────────────────────────────────────────────────
  const captureFrame = useCallback(async () => {
    if (!videoRef.current) return;
    if (navigator.vibrate) navigator.vibrate(40);

    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 1920;
    captureCanvas.height = video.videoHeight || 1080;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    setProcessing(true);
    setProcMsg('Finding document corners…');

    let corners: Quad;
    try {
      corners = await scannerBridge.detectCorners(captureCanvas);
    } catch {
      corners = [
        { x: Math.round(captureCanvas.width * 0.08), y: Math.round(captureCanvas.height * 0.08) },
        { x: Math.round(captureCanvas.width * 0.92), y: Math.round(captureCanvas.height * 0.08) },
        { x: Math.round(captureCanvas.width * 0.92), y: Math.round(captureCanvas.height * 0.92) },
        { x: Math.round(captureCanvas.width * 0.08), y: Math.round(captureCanvas.height * 0.92) },
      ];
    }

    liveCornersRef.current = corners;

    const newPage: ScannedPage = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      originalCanvas: captureCanvas,
      corners,
      warpedCanvas: captureCanvas,
      enhancedCanvas: captureCanvas,
      filter: 'magic_color',
      rotation: 0,
    };

    setPages(prev => [...prev, newPage]);
    setActivePageIndex(pages.length);
    setProcessing(false);
    setPhase('adjusting');
  }, [pages.length]);

  // Manual File Upload Fallback
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    setProcessing(true);
    setProcMsg('Importing documents…');

    const newPages: ScannedPage[] = [];

    for (const file of files) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise(res => { img.onload = res; img.src = url; });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 1600;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const corners = await scannerBridge.detectCorners(canvas);
      newPages.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        originalCanvas: canvas,
        corners,
        warpedCanvas: canvas,
        enhancedCanvas: canvas,
        filter: 'magic_color',
        rotation: 0,
      });
    }

    setPages(prev => [...prev, ...newPages]);
    setActivePageIndex(pages.length);
    liveCornersRef.current = newPages[0]?.corners || null;
    setProcessing(false);
    setPhase('adjusting');
    if (e.target) e.target.value = '';
  }, [pages.length]);

  // ── 4. Interactive 4-Point Cropping & Loupe Magnifier ───────────────────────
  const activePage = pages[activePageIndex];

  useEffect(() => {
    if (phase !== 'adjusting' || !adjustCanvasRef.current || !activePage) return;

    const canvas = adjustCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const src = activePage.originalCanvas;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 360;
    canvas.height = rect.height || 480;

    const corners = liveCornersRef.current || activePage.corners;
    liveCornersRef.current = corners;

    const scale = Math.min(canvas.width / src.width, canvas.height / src.height);
    const ox = (canvas.width - src.width * scale) / 2;
    const oy = (canvas.height - src.height * scale) / 2;

    const i2c = (p: Pt) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
    const c2i = (x: number, y: number) => ({ x: (x - ox) / scale, y: (y - oy) / scale });

    let dragIdx = -1;
    const HANDLE_R = 14;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src, ox, oy, src.width * scale, src.height * scale);

      const cPts = corners.map(i2c);

      // Shaded overlay outside polygon
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(cPts[0].x, cPts[0].y);
      ctx.lineTo(cPts[1].x, cPts[1].y);
      ctx.lineTo(cPts[2].x, cPts[2].y);
      ctx.lineTo(cPts[3].x, cPts[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Border guidelines
      ctx.beginPath();
      ctx.moveTo(cPts[0].x, cPts[0].y);
      ctx.lineTo(cPts[1].x, cPts[1].y);
      ctx.lineTo(cPts[2].x, cPts[2].y);
      ctx.lineTo(cPts[3].x, cPts[3].y);
      ctx.closePath();
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Corner handles
      cPts.forEach((cp, idx) => {
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, HANDLE_R, 0, Math.PI * 2);
        ctx.fillStyle = idx === dragIdx ? '#15803D' : '#22C55E';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });
    };

    const drawLoupe = (screenX: number, screenY: number, imgCorner: Pt) => {
      if (!loupeCanvasRef.current) return;
      const loupe = loupeCanvasRef.current;
      const lCtx = loupe.getContext('2d');
      if (!lCtx) return;

      const size = 110;
      loupe.width = size;
      loupe.height = size;

      lCtx.clearRect(0, 0, size, size);

      lCtx.save();
      lCtx.beginPath();
      lCtx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      lCtx.clip();

      const zoom = 2.5;
      const cropW = size / zoom;
      const cropH = size / zoom;
      const sx = imgCorner.x - cropW / 2;
      const sy = imgCorner.y - cropH / 2;

      lCtx.drawImage(src, sx, sy, cropW, cropH, 0, 0, size, size);

      lCtx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
      lCtx.lineWidth = 1.5;
      lCtx.beginPath();
      lCtx.moveTo(size / 2, 0);
      lCtx.lineTo(size / 2, size);
      lCtx.moveTo(0, size / 2);
      lCtx.lineTo(size, size / 2);
      lCtx.stroke();

      lCtx.restore();

      setLoupePos({
        x: Math.max(10, Math.min(window.innerWidth - size - 10, screenX - size / 2)),
        y: Math.max(10, screenY - size - 45),
        visible: true,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      const bRect = canvas.getBoundingClientRect();
      const px = e.clientX - bRect.left;
      const py = e.clientY - bRect.top;

      let best = HANDLE_R * 3;
      dragIdx = -1;
      corners.forEach((c, idx) => {
        const cp = i2c(c);
        const d = Math.hypot(px - cp.x, py - cp.y);
        if (d < best) {
          best = d;
          dragIdx = idx;
        }
      });

      if (dragIdx >= 0) {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        draw();
        drawLoupe(e.clientX, e.clientY, corners[dragIdx]);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragIdx < 0) return;
      e.preventDefault();
      const bRect = canvas.getBoundingClientRect();
      const px = e.clientX - bRect.left;
      const py = e.clientY - bRect.top;
      const ip = c2i(px, py);

      corners[dragIdx] = {
        x: Math.max(0, Math.min(src.width, ip.x)),
        y: Math.max(0, Math.min(src.height, ip.y)),
      };
      liveCornersRef.current = [...corners] as Quad;
      draw();
      drawLoupe(e.clientX, e.clientY, corners[dragIdx]);
    };

    const onPointerUp = () => {
      dragIdx = -1;
      setLoupePos(prev => ({ ...prev, visible: false }));
      draw();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    draw();

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [phase, activePage]);

  // ── 5. Perspective Correction & CamScanner Filter ───────────────────────────
  const applyCropAndFilter = useCallback(async () => {
    if (!activePage || !liveCornersRef.current) return;
    setProcessing(true);
    setProcMsg('Applying perspective warp…');

    try {
      const corners = liveCornersRef.current;
      const warped = await scannerBridge.warp(activePage.originalCanvas, corners);
      
      setProcMsg('Enhancing image…');
      const enhanced = await scannerBridge.applyFilter(warped, activePage.filter);

      setPages(prev => {
        const next = [...prev];
        next[activePageIndex] = {
          ...next[activePageIndex],
          corners,
          warpedCanvas: warped,
          enhancedCanvas: enhanced,
        };
        return next;
      });

      setPhase('reviewing');
    } catch (e: any) {
      console.error(e);
      setError("Couldn't apply the crop — please adjust the corners and try again.");
    } finally {
      setProcessing(false);
    }
  }, [activePage, activePageIndex]);

  const handleFilterChange = useCallback(async (filter: CamFilter) => {
    if (!activePage) return;
    setProcessing(true);
    setProcMsg(`Applying ${filter.replace('_', ' ')}…`);

    try {
      const enhanced = await scannerBridge.applyFilter(activePage.warpedCanvas, filter);
      setPages(prev => {
        const next = [...prev];
        next[activePageIndex] = {
          ...next[activePageIndex],
          filter,
          enhancedCanvas: enhanced,
        };
        return next;
      });
    } catch (e) {
      console.warn('Filter failed:', e);
    } finally {
      setProcessing(false);
    }
  }, [activePage, activePageIndex]);

  const handleRotate = useCallback(async () => {
    if (!activePage) return;
    setProcessing(true);
    setProcMsg('Rotating page…');

    const src = activePage.warpedCanvas;
    const rotated = document.createElement('canvas');
    rotated.width = src.height;
    rotated.height = src.width;
    const ctx = rotated.getContext('2d');
    if (ctx) {
      ctx.translate(rotated.width / 2, rotated.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(src, -src.width / 2, -src.height / 2);
    }

    const enhanced = await scannerBridge.applyFilter(rotated, activePage.filter);

    setPages(prev => {
      const next = [...prev];
      next[activePageIndex] = {
        ...next[activePageIndex],
        rotation: (next[activePageIndex].rotation + 90) % 360,
        warpedCanvas: rotated,
        enhancedCanvas: enhanced,
      };
      return next;
    });
    setProcessing(false);
  }, [activePage, activePageIndex]);

  const handleDeletePage = useCallback((index: number) => {
    setPages(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length === 0) {
        setPhase('scanning');
        return [];
      }
      setActivePageIndex(Math.max(0, index - 1));
      return filtered;
    });
  }, []);

  // ── 6. PDF Export / Convert to Text ─────────────────────────────────────────
  const handleSavePdf = useCallback(async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setProcMsg('Compiling high-resolution A4 PDF…');

    try {
      const canvases = pages.map(p => p.enhancedCanvas);
      const pdfBlob = await compilePdfFromCanvases(canvases, `Scan-${new Date().toISOString().slice(0, 10)}`);
      
      const filePromises = pages.map((p, idx) => 
        canvasToFile(p.enhancedCanvas, `page-${idx + 1}.jpg`)
      );
      const pageFiles = await Promise.all(filePromises);

      onScanComplete(pageFiles, pdfBlob);
    } catch (e: any) {
      console.error('PDF Export Error:', e);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [pages, onScanComplete]);

  const handleConvertText = useCallback(async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setProcMsg('Preparing pages for transcription…');

    try {
      const filePromises = pages.map((p, idx) => 
        canvasToFile(p.enhancedCanvas, `page-${idx + 1}.jpg`)
      );
      const pageFiles = await Promise.all(filePromises);
      onConvertToText(pageFiles);
    } catch (e: any) {
      console.error('Convert Error:', e);
      setError('Failed to prepare pages. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [pages, onConvertToText]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        background: '#0B0D12',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#FFFFFF',
        fontFamily: UI,
      }}
    >
      {/* ── Processing Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 1010, background: 'rgba(11, 13, 18, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}
          >
            <Loader2 size={36} color="#22C55E" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E4E1D9' }}>{procMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1020, background: '#B23A34', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* ── PHASE 1: Real-Time Camera Screen ────────────────────────────────── */}
      {phase === 'scanning' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {/* Top Bar */}
          <div style={{ flexShrink: 0, height: 56, padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 20 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </motion.button>

            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
              {pages.length > 0 ? `${pages.length} Page${pages.length > 1 ? 's' : ''} Scanned` : 'Document Scanner'}
            </span>

            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleCameraLens} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <SwitchCamera size={18} />
              </motion.button>
              {hasTorch && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTorch} style={{ background: torchOn ? '#22C55E' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                  {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
                </motion.button>
              )}
            </div>
          </div>

          {/* Camera Viewfinder Area */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={liveCanvasRef} style={{ display: 'none' }} />

            {/* Glowing CamScanner Viewfinder Brackets */}
            <div style={{ position: 'absolute', inset: '12% 8%', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12 }}>
              {/* Corner Reticles */}
              <div style={{ position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTop: '4px solid #22C55E', borderLeft: '4px solid #22C55E', borderRadius: '4px 0 0 0' }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTop: '4px solid #22C55E', borderRight: '4px solid #22C55E', borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottom: '4px solid #22C55E', borderLeft: '4px solid #22C55E', borderRadius: '0 0 0 4px' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottom: '4px solid #22C55E', borderRight: '4px solid #22C55E', borderRadius: '0 0 4px 0' }} />

              {/* Scanning Laser Line */}
              <motion.div
                animate={{ top: ['0%', '98%', '0%'] }}
                transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
                style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #22C55E, transparent)', boxShadow: '0 0 10px #22C55E' }}
              />
            </div>

            {/* Live Detected OpenCV Polygon */}
            {detectedLiveCorners && liveCanvasRef.current && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <polygon
                  points={detectedLiveCorners.map(p => `${(p.x / liveCanvasRef.current!.width) * 100}%,${(p.y / liveCanvasRef.current!.height) * 100}%`).join(' ')}
                  fill="rgba(34, 197, 94, 0.12)"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
              </svg>
            )}
          </div>

          {/* Bottom Shutter & Controls Bar — Fixed visible height */}
          <div
            style={{
              flexShrink: 0,
              minHeight: 110,
              padding: '16px 24px calc(16px + env(safe-area-inset-bottom, 16px))',
              background: '#0B0D12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Gallery Import */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 60,
                background: 'none',
                border: 'none',
                color: '#E4E1D9',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={20} color="#E4E1D9" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Import</span>
            </motion.button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />

            {/* Shutter Button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={captureFrame}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '4px solid #22C55E',
                boxShadow: '0 0 24px rgba(34, 197, 94, 0.45)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#22C55E' }} />
            </motion.button>

            {/* Finish Batch Button */}
            {pages.length > 0 ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setPhase('batch_summary')}
                style={{
                  width: 60,
                  background: 'none',
                  border: 'none',
                  color: '#22C55E',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={22} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>Done ({pages.length})</span>
              </motion.button>
            ) : (
              <div style={{ width: 60 }} />
            )}
          </div>
        </div>
      )}

      {/* ── PHASE 2: Interactive 4-Point Cropping & Touch Loupe Screen ──────── */}
      {phase === 'adjusting' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
          {/* Top Bar */}
          <div style={{ flexShrink: 0, height: 56, padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase('scanning')} style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <ChevronLeft size={18} /> Retake
            </motion.button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Adjust Document Corners</span>
            <div style={{ width: 60 }} />
          </div>

          {/* Canvas with Loupe Touch Magnifier */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <canvas ref={adjustCanvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain', touchAction: 'none' }} />

            {/* Magnifier Loupe (2.5x Zoom) */}
            {loupePos.visible && (
              <div style={{ position: 'fixed', left: loupePos.x, top: loupePos.y, zIndex: 1030, pointerEvents: 'none', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.7)', border: '3px solid #22C55E' }}>
                <canvas ref={loupeCanvasRef} style={{ display: 'block' }} />
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div style={{ flexShrink: 0, padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 16px))', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, background: '#0B0D12' }}>
            <Button
              variant="outline"
              onClick={() => {
                if (activePage) {
                  const w = activePage.originalCanvas.width;
                  const h = activePage.originalCanvas.height;
                  liveCornersRef.current = [
                    { x: 0, y: 0 },
                    { x: w, y: 0 },
                    { x: w, y: h },
                    { x: 0, y: h },
                  ];
                  applyCropAndFilter();
                }
              }}
              style={{ flex: 1, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }}
            >
              Full Page
            </Button>
            <Button
              onClick={applyCropAndFilter}
              style={{ flex: 2, height: 48, borderRadius: 10, background: '#22C55E', color: '#fff', fontWeight: 700 }}
            >
              <Check size={18} style={{ marginRight: 6 }} /> Apply Crop
            </Button>
          </div>
        </div>
      )}

      {/* ── PHASE 3: CamScanner Filter & Review Screen ───────────────────────── */}
      {phase === 'reviewing' && activePage && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
          {/* Top Bar */}
          <div style={{ flexShrink: 0, height: 56, padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase('adjusting')} style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <CropIcon size={16} /> Re-crop
            </motion.button>

            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Page {activePageIndex + 1} of {pages.length}
            </span>

            <motion.button whileTap={{ scale: 0.9 }} onClick={handleRotate} style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <RotateCw size={18} />
            </motion.button>
          </div>

          {/* Render Preview */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflow: 'hidden' }}>
            <img
              src={activePage.enhancedCanvas.toDataURL('image/jpeg', 0.92)}
              alt="Enhanced Document Scan"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
            />
          </div>

          {/* CamScanner Filter Selector Carousel */}
          <div style={{ flexShrink: 0, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', display: 'flex', gap: 8, justifyContent: 'center' }}>
            {FILTERS.map(f => {
              const Icon = f.icon;
              const isSelected = activePage.filter === f.id;
              return (
                <motion.button
                  key={f.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleFilterChange(f.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isSelected ? '#22C55E' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#fff' : '#E4E1D9',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: 68,
                  }}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500 }}>{f.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div style={{ flexShrink: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 14px))', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, background: '#0B0D12' }}>
            <Button
              variant="outline"
              onClick={() => setPhase('scanning')}
              style={{ flex: 1, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }}
            >
              <Plus size={16} style={{ marginRight: 6 }} /> Add Page
            </Button>
            <Button
              onClick={() => setPhase('batch_summary')}
              style={{ flex: 1.5, height: 48, borderRadius: 10, background: '#24467A', color: '#fff', fontWeight: 700 }}
            >
              <Check size={18} style={{ marginRight: 6 }} /> Done ({pages.length})
            </Button>
          </div>
        </div>
      )}

      {/* ── PHASE 4: Multi-Page Batch Document Manager ──────────────────────── */}
      {phase === 'batch_summary' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
          {/* Top Bar */}
          <div style={{ flexShrink: 0, height: 56, padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase('scanning')} style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <Plus size={16} /> Add More
            </motion.button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Document Pages ({pages.length})</span>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer' }}>
              <X size={20} />
            </motion.button>
          </div>

          {/* Grid of Pages */}
          <div style={{ flex: 1, minHeight: 0, padding: 16, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {pages.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  background: '#1C1917',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: idx === activePageIndex ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.15)',
                  aspectRatio: '3/4',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <img
                  src={p.enhancedCanvas.toDataURL('image/jpeg', 0.85)}
                  alt={`Page ${idx + 1}`}
                  onClick={() => {
                    setActivePageIndex(idx);
                    setPhase('reviewing');
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                />
                <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                  Page {idx + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePage(idx);
                  }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(178,58,52,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Final Export Choices */}
          <div style={{ flexShrink: 0, padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 16px))', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10, background: '#0B0D12' }}>
            <Button
              onClick={handleSavePdf}
              style={{ width: '100%', height: 48, borderRadius: 10, background: '#22C55E', color: '#fff', fontWeight: 700, fontSize: 14 }}
            >
              <Download size={18} style={{ marginRight: 8 }} /> Save Document as PDF
            </Button>
            <Button
              onClick={handleConvertText}
              variant="outline"
              style={{ width: '100%', height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 14 }}
            >
              <FileText size={18} style={{ marginRight: 8 }} /> Convert to Word / Editable Text
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
