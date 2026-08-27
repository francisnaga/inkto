'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X, RotateCcw, Check, ScanLine, ChevronLeft, ChevronRight,
  FileText, Download, Plus, Camera, Loader2, ZapIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}
type Phase = 'scanning' | 'adjusting' | 'reviewing' | 'choice';
type EnhanceMode = 'auto' | 'color' | 'bw';
interface Pt { x: number; y: number; }
type Quad = [Pt, Pt, Pt, Pt];

// ── Script loader (idempotent) ──────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise(res => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => res();
    s.onerror = () => res(); // silently continue even if CDN fails
    document.head.appendChild(s);
  });
}
declare global { interface Window { jscanify: any; jspdf: any; cv: any; } }

// ── Geometry helpers ────────────────────────────────────────────────────────
function dist(a: Pt, b: Pt) { 
  if (!a || !b) return 0;
  return Math.sqrt(((a.x || 0) - (b.x || 0)) ** 2 + ((a.y || 0) - (b.y || 0)) ** 2); 
}
function quadSize(corners: Quad) {
  if (!corners || !Array.isArray(corners) || corners.length < 4) {
    return { w: 800, h: 1000 };
  }
  const [tl, tr, br, bl] = corners;
  if (!tl || !tr || !br || !bl) return { w: 800, h: 1000 };
  const w = Math.max(100, Math.round((dist(tl, tr) + dist(bl, br)) / 2));
  const h = Math.max(100, Math.round((dist(tl, bl) + dist(tr, br)) / 2));
  return { w: isNaN(w) || w <= 0 ? 800 : w, h: isNaN(h) || h <= 0 ? 1000 : h };
}
function defaultCorners(W: number, H: number): Quad {
  const p = 0.10;
  const safeW = Math.max(100, W || 800);
  const safeH = Math.max(100, H || 1000);
  return [{ x: safeW * p, y: safeH * p }, { x: safeW * (1 - p), y: safeH * p }, { x: safeW * (1 - p), y: safeH * (1 - p) }, { x: safeW * p, y: safeH * (1 - p) }];
}
type TR = { scale: number; ox: number; oy: number };
function getTransform(iW: number, iH: number, cW: number, cH: number): TR {
  const safeIW = Math.max(1, iW || 1);
  const safeIH = Math.max(1, iH || 1);
  const scale = Math.min(cW / safeIW, cH / safeIH);
  return { scale: isNaN(scale) || scale <= 0 ? 1 : scale, ox: (cW - safeIW * scale) / 2, oy: (cH - safeIH * scale) / 2 };
}
function i2c(p: Pt, t: TR) { return { x: t.ox + (p?.x || 0) * t.scale, y: t.oy + (p?.y || 0) * t.scale }; }
function c2i(x: number, y: number, t: TR) { return { x: (x - t.ox) / t.scale, y: (y - t.oy) / t.scale }; }

// ── Pure-JS bilinear perspective warp (OpenCV fallback) ─────────────────────
function computeHomography(src: Pt[], dst: Pt[]): number[] {
  if (!src || !dst || src.length < 4 || dst.length < 4) {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }
  // 8-point DLT
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x: X = 0, y: Y = 0 } = src[i] || {};
    const { x: u = 0, y: v = 0 } = dst[i] || {};
    A.push([-X, -Y, -1, 0, 0, 0, u * X, u * Y, u]);
    A.push([0, 0, 0, -X, -Y, -1, v * X, v * Y, v]);
  }
  const n = 8;
  const M: number[][] = A.map(row => [...row.slice(0, n), -row[n]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r]?.[col] || 0) > Math.abs(M[maxRow]?.[col] || 0)) maxRow = r;
    }
    if (M[maxRow] && M[col]) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
    }
    if (!M[col] || Math.abs(M[col][col]) < 1e-10) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const h = M.map((row, i) => {
    const divisor = row?.[i];
    return !divisor || Math.abs(divisor) < 1e-10 ? 0 : (row[n] / divisor);
  });
  return [...h, 1];
}

function jsWarp(srcCanvas: HTMLCanvasElement, corners: Quad): HTMLCanvasElement {
  if (!srcCanvas || !corners || corners.length < 4) return srcCanvas;
  const { w, h } = quadSize(corners);
  const [tl, tr, br, bl] = corners;
  if (!tl || !tr || !br || !bl) return srcCanvas;

  const srcPts = [tl, tr, br, bl];
  const dstPts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  const H = computeHomography(dstPts, srcPts);

  const out = document.createElement('canvas');
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);
  const ctx = out.getContext('2d');
  const srcCtx = srcCanvas.getContext('2d');
  if (!ctx || !srcCtx) return srcCanvas;

  try {
    const srcImg = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const dstImg = ctx.createImageData(out.width, out.height);
    const sW = srcCanvas.width, sH = srcCanvas.height;
    const sd = srcImg.data, dd = dstImg.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const denom = H[6] * x + H[7] * y + H[8];
        if (Math.abs(denom) < 1e-10) continue;
        const sx = (H[0] * x + H[1] * y + H[2]) / denom;
        const sy = (H[3] * x + H[4] * y + H[5]) / denom;
        if (sx < 0 || sy < 0 || sx >= sW - 1 || sy >= sH - 1 || isNaN(sx) || isNaN(sy)) continue;
        const fx = Math.floor(sx), fy = Math.floor(sy);
        const dx = sx - fx, dy = sy - fy;
        const i00 = (fy * sW + fx) * 4;
        const i10 = (fy * sW + fx + 1) * 4;
        const i01 = ((fy + 1) * sW + fx) * 4;
        const i11 = ((fy + 1) * sW + fx + 1) * 4;
        const di = (y * w + x) * 4;
        if (i00 < 0 || i11 + 3 >= sd.length || di < 0 || di + 3 >= dd.length) continue;
        for (let c = 0; c < 3; c++) {
          dd[di + c] = Math.round(
            sd[i00 + c] * (1 - dx) * (1 - dy) +
            sd[i10 + c] * dx * (1 - dy) +
            sd[i01 + c] * (1 - dx) * dy +
            sd[i11 + c] * dx * dy
          );
        }
        dd[di + 3] = 255;
      }
    }
    ctx.putImageData(dstImg, 0, 0);
    return out;
  } catch (err) {
    console.warn("jsWarp error fallback:", err);
    return srcCanvas;
  }
}

// ── OpenCV-based warp (preferred when available) ────────────────────────────
function ocvWarp(src: HTMLCanvasElement, corners: Quad): HTMLCanvasElement {
  const cv = window.cv;
  if (!cv || !cv.imread || !corners || corners.length < 4) return jsWarp(src, corners);
  const [tl, tr, br, bl] = corners;
  if (!tl || !tr || !br || !bl) return jsWarp(src, corners);
  const { w, h } = quadSize(corners);
  let srcMat: any, dstMat: any, srcPts: any, dstPts: any, M: any;
  try {
    srcMat = cv.imread(src);
    dstMat = new cv.Mat();
    srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
    dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
    M = cv.getPerspectiveTransform(srcPts, dstPts);
    cv.warpPerspective(srcMat, dstMat, M, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    cv.imshow(out, dstMat);
    return out;
  } catch (e) {
    console.warn("ocvWarp failed, falling back to jsWarp:", e);
    return jsWarp(src, corners);
  } finally {
    try { srcMat?.delete(); } catch {}
    try { dstMat?.delete(); } catch {}
    try { srcPts?.delete(); } catch {}
    try { dstPts?.delete(); } catch {}
    try { M?.delete(); } catch {}
  }
}

function perspectiveWarp(src: HTMLCanvasElement, corners: Quad): HTMLCanvasElement {
  if (window.cv?.Mat) {
    try { return ocvWarp(src, corners); } catch { /* fall through to JS warp */ }
  }
  return jsWarp(src, corners);
}

// ── Image enhancement ────────────────────────────────────────────────────────
function enhance(src: HTMLCanvasElement, mode: EnhanceMode): HTMLCanvasElement {
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  const id = ctx.getImageData(0, 0, out.width, out.height);
  const d = id.data;
  if (mode === 'bw') {
    // Greyscale + adaptive threshold
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) { const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = g; sum += g; }
    const thr = (sum / (d.length / 4)) * 0.80;
    for (let i = 0; i < d.length; i += 4) { const v = d[i] >= thr ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  } else if (mode === 'auto') {
    // Auto-levels (sample every 8th pixel for speed)
    let [mnR, mxR, mnG, mxG, mnB, mxB] = [255, 0, 255, 0, 255, 0];
    for (let i = 0; i < d.length; i += 32) {
      if (d[i] < mnR) mnR = d[i]; if (d[i] > mxR) mxR = d[i];
      if (d[i + 1] < mnG) mnG = d[i + 1]; if (d[i + 1] > mxG) mxG = d[i + 1];
      if (d[i + 2] < mnB) mnB = d[i + 2]; if (d[i + 2] > mxB) mxB = d[i + 2];
    }
    const rR = mxR - mnR || 1, rG = mxG - mnG || 1, rB = mxB - mnB || 1;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, ((d[i] - mnR) / rR) * 270);
      d[i + 1] = Math.min(255, ((d[i + 1] - mnG) / rG) * 262);
      d[i + 2] = Math.min(255, ((d[i + 2] - mnB) / rB) * 248);
    }
  } else {
    // Colour boost
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.18 + 136));
      d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.18 + 136));
      d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.18 + 136));
    }
  }
  ctx.putImageData(id, 0, 0);
  return out;
}

// ── Corner guide overlay ─────────────────────────────────────────────────────
function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 28, c = 22;
  ctx.setLineDash([8, 5]); ctx.strokeStyle = 'rgba(99,179,237,0.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2); ctx.setLineDash([]);
  ctx.strokeStyle = '#60A5FA'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[pad, pad], [w - pad, pad], [pad, h - pad], [w - pad, h - pad]].forEach(([x, y]) => {
    const dx = x < w / 2 ? c : -c, dy = y < h / 2 ? c : -c;
    ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy); ctx.stroke();
  });
}

// ────────────────────────────────────────────────────────────────────────────
export default function ScannerModal({ onScanComplete, onConvertToText, onClose }: ScannerModalProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const adjustRef   = useRef<HTMLCanvasElement>(null);
  // Reusable detection canvas — allocated once, reused every tick
  const detCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const animRef     = useRef<number>(0);
  const detIntRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const scannerRef  = useRef<any>(null);
  const capturedRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef     = useRef<HTMLCanvasElement | null>(null);
  const liveCornersRef = useRef<Quad | null>(null);
  const lastQuadRef    = useRef<Quad | null>(null);
  // Guard: only one detection running at a time
  const detectingRef = useRef(false);

  const [phase, setPhase]           = useState<Phase>('scanning');
  const [pages, setPages]           = useState<File[]>([]);
  const [pageUrls, setPageUrls]     = useState<string[]>([]);
  const [reviewUrl, setReviewUrl]   = useState<string | null>(null);
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>('auto');
  const [galleryIdx, setGalleryIdx]   = useState(0);
  const [scannerReady, setScannerReady] = useState(false);
  const [videoReady, setVideoReady]     = useState(false);
  const [docDetected, setDocDetected]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [processing, setProcessing]       = useState(false);
  const [procMsg, setProcMsg]             = useState('');
  const [loadingMsg, setLoadingMsg]       = useState('Loading scanner…');

  // ── Load OpenCV + jscanify ONLY when this modal mounts ───────────────────
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoadingMsg('Loading edge detector…');
        // Use a smaller, faster OpenCV build
        await loadScript('https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.2/dist/opencv.min.js');

        // Wait for cv runtime (poll, max 15s)
        await new Promise<void>((res, rej) => {
          let attempts = 0;
          const check = () => {
            if (window.cv?.Mat) { res(); return; }
            if (++attempts > 150) { res(); return; } // timeout — continue without OCV
            setTimeout(check, 100);
          };
          check();
        });

        if (dead) return;
        setLoadingMsg('Loading jscanify…');
        await loadScript('https://unpkg.com/jscanify@1.3.1/src/jscanify.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

        if (!dead) {
          if (window.jscanify) {
            try { scannerRef.current = new window.jscanify(); } catch {}
          }
          setScannerReady(true);
        }
      } catch (e) {
        // Library failed — still allow camera capture with pure-JS warp
        if (!dead) setScannerReady(true);
      }
    })();
    return () => { dead = true; };
  }, []);

  // ── Camera management ─────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    cancelAnimationFrame(animRef.current);
    if (detIntRef.current) { clearInterval(detIntRef.current); detIntRef.current = null; }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null); setVideoReady(false); setDocDetected(false);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      // Cap at 1280×720 — crucial for mobile memory budget
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoReady(true);
      }
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError' ? 'Camera access denied — allow it in browser settings, then tap Try again.'
          : err?.name === 'NotFoundError' ? 'No camera found on this device.'
          : `Could not start camera: ${err?.message || 'unknown error'}`
      );
    }
  }, []);

  useEffect(() => {
    if (phase === 'scanning') startCamera(); else stopCamera();
    return stopCamera;
  }, [phase, startCamera, stopCamera]);

  // ── Edge detection — throttled, reuses single canvas ────────────────────
  useEffect(() => {
    if (phase !== 'scanning' || !scannerReady) return;
    const id = setInterval(() => {
      // Skip if a detection is already in flight
      if (detectingRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || !scannerRef.current) return;
      detectingRef.current = true;
      try {
        // Reuse a single canvas rather than creating one every tick
        if (!detCanvasRef.current) {
          detCanvasRef.current = document.createElement('canvas');
        }
        const tmp = detCanvasRef.current;
        tmp.width = video.videoWidth;
        tmp.height = video.videoHeight;
        const ctx2d = tmp.getContext('2d');
        if (!ctx2d) return;
        ctx2d.drawImage(video, 0, 0);

        let contour: any = null;
        try {
          contour = scannerRef.current.findPaperContour(tmp);
          if (contour && !contour.empty?.()) {
            const cornersObj = scannerRef.current.getCornerPoints(contour);
            if (cornersObj?.topLeftCorner) {
              lastQuadRef.current = [
                cornersObj.topLeftCorner,
                cornersObj.topRightCorner,
                cornersObj.bottomRightCorner,
                cornersObj.bottomLeftCorner,
              ];
              setDocDetected(true);
            } else {
              lastQuadRef.current = null; setDocDetected(false);
            }
          } else {
            lastQuadRef.current = null; setDocDetected(false);
          }
        } finally {
          try { contour?.delete?.(); } catch {}
        }
      } catch {
        lastQuadRef.current = null; setDocDetected(false);
      } finally {
        detectingRef.current = false;
      }
    }, 300); // 300ms — slightly slower than before to reduce CPU pressure
    detIntRef.current = id;
    return () => clearInterval(id);
  }, [phase, scannerReady]);

  // ── 60fps overlay draw ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'scanning') return;
    const draw = () => {
      const video = videoRef.current, ov = overlayRef.current;
      if (!ov || !video) { animRef.current = requestAnimationFrame(draw); return; }
      const vw = video.videoWidth || ov.clientWidth, vh = video.videoHeight || ov.clientHeight;
      if (ov.width !== ov.clientWidth) ov.width = ov.clientWidth;
      if (ov.height !== ov.clientHeight) ov.height = ov.clientHeight;
      const ctx = ov.getContext('2d')!; ctx.clearRect(0, 0, ov.width, ov.height);
      const quad = lastQuadRef.current;
      if (quad) {
        const sx = ov.width / vw, sy = ov.height / vh;
        const m = quad.map(p => ({ x: p.x * sx, y: p.y * sy }));
        ctx.beginPath(); m.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath();
        ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(34,197,94,0.10)'; ctx.fill();
        m.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
          ctx.fillStyle = '#22C55E'; ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
        });
      } else {
        drawGuide(ctx, ov.width, ov.height);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    try {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        setError('Camera not ready — wait a moment and try again.'); return;
      }
      stopCamera();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      capturedRef.current = canvas;
      liveCornersRef.current = lastQuadRef.current ?? defaultCorners(canvas.width, canvas.height);
      setPhase('adjusting');
    } catch (e: any) {
      setError(`Couldn't capture photo — ${e?.message || 'try again'}.`);
    }
  }, [stopCamera]);

  // ── Interactive corner canvas ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'adjusting') return;
    const canvas = adjustRef.current, img = capturedRef.current;
    if (!canvas || !img) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
    const HANDLE_R = 24;
    let dragIdx = -1;
    const corners: Quad = [...(liveCornersRef.current ?? defaultCorners(img.width, img.height))] as Quad;

    const draw = () => {
      try {
        const ctx = canvas.getContext('2d')!, t = getTransform(img.width, img.height, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, t.ox, t.oy, img.width * t.scale, img.height * t.scale);
        const m = corners.map(p => i2c(p, t));
        // Dim outside selection
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.moveTo(m[0].x, m[0].y); m.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y)); ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill('evenodd'); ctx.restore();
        // Border
        ctx.beginPath(); m.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath();
        ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2.5; ctx.stroke();
        // Handles
        m.forEach((p, i) => {
          ctx.beginPath(); ctx.arc(p.x, p.y, HANDLE_R, 0, 2 * Math.PI);
          ctx.fillStyle = i === dragIdx ? '#1D4ED8' : 'rgba(59,130,246,0.9)'; ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x + 8, p.y); ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x, p.y + 8);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        });
      } catch {}
    };

    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(), sx = canvas.width / r.width, sy = canvas.height / r.height; return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }; };
    const onDown = (e: PointerEvent) => {
      const p = pos(e), t = getTransform(img.width, img.height, canvas.width, canvas.height); dragIdx = -1; let best = HANDLE_R * 2.5;
      corners.forEach((c, i) => { const cp = i2c(c, t), d = Math.hypot(p.x - cp.x, p.y - cp.y); if (d < best) { best = d; dragIdx = i; } });
      if (dragIdx >= 0) { e.preventDefault(); canvas.setPointerCapture(e.pointerId); draw(); }
    };
    const onMove = (e: PointerEvent) => {
      if (dragIdx < 0) return; e.preventDefault();
      const p = pos(e), t = getTransform(img.width, img.height, canvas.width, canvas.height), ip = c2i(p.x, p.y, t);
      corners[dragIdx] = { x: Math.max(0, Math.min(img.width, ip.x)), y: Math.max(0, Math.min(img.height, ip.y)) };
      liveCornersRef.current = [...corners] as Quad; draw();
    };
    const onUp = () => { dragIdx = -1; draw(); };

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    draw();
    return () => { canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); };
  }, [phase]);

  // ── Apply perspective correction ──────────────────────────────────────────
  const applyTransform = useCallback(async () => {
    const src = capturedRef.current, corners = liveCornersRef.current;
    if (!src || !corners || !Array.isArray(corners) || corners.length < 4) {
      setError("Couldn't apply the crop — try adjusting the corners again.");
      return;
    }
    setProcessing(true); setProcMsg('Applying perspective correction…');
    await new Promise(r => setTimeout(r, 40));
    let corrected: HTMLCanvasElement;
    try {
      if (scannerRef.current) {
        try {
          const [tl, tr, br, bl] = corners;
          const { w, h } = quadSize(corners);
          corrected = scannerRef.current.extractPaper(src, w, h, {
            topLeftCorner: tl, topRightCorner: tr, bottomRightCorner: br, bottomLeftCorner: bl,
          });
          if (!corrected) corrected = perspectiveWarp(src, corners);
        } catch {
          corrected = perspectiveWarp(src, corners);
        }
      } else {
        corrected = perspectiveWarp(src, corners);
      }
      if (!corrected) {
        corrected = src;
      }
    } catch (e: any) {
      console.warn("Perspective crop error:", e);
      setError("Couldn't apply the crop — try adjusting the corners again.");
      setProcessing(false);
      return;
    }
    baseRef.current = corrected;
    setProcMsg('Enhancing image…'); await new Promise(r => setTimeout(r, 40));
    try {
      const enhanced = enhance(corrected, 'auto'); setEnhanceMode('auto');
      enhanced.toBlob(blob => {
        if (!blob) {
          setError("Couldn't apply the crop — try adjusting the corners again.");
          setProcessing(false);
          return;
        }
        if (reviewUrl) URL.revokeObjectURL(reviewUrl);
        setReviewUrl(URL.createObjectURL(blob)); setReviewBlob(blob);
        setPhase('reviewing'); setProcessing(false); setProcMsg('');
      }, 'image/jpeg', 0.92);
    } catch (e: any) {
      console.warn("Enhance error:", e);
      setError("Couldn't apply the crop — try adjusting the corners again.");
      setProcessing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Enhance mode switch ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'reviewing' || !baseRef.current) return;
    try {
      const enhanced = enhance(baseRef.current, enhanceMode);
      enhanced.toBlob(blob => {
        if (!blob) return;
        setReviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob!); });
        setReviewBlob(blob);
      }, 'image/jpeg', 0.92);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhanceMode, phase]);

  // ── Page management ───────────────────────────────────────────────────────
  const addAnotherPage = useCallback(() => {
    if (!reviewBlob || !reviewUrl) return;
    const file = new File([reviewBlob], `page-${pages.length + 1}.jpg`, { type: 'image/jpeg' });
    setPages(p => [...p, file]);
    setPageUrls(u => [...u, reviewUrl]);
    setReviewUrl(null);
    setReviewBlob(null);
    lastQuadRef.current = null;
    setPhase('scanning');
  }, [reviewBlob, reviewUrl, pages.length]);

  const doneReviewing = useCallback(() => {
    if (!reviewBlob || !reviewUrl) return;
    const file = new File([reviewBlob], `page-${pages.length + 1}.jpg`, { type: 'image/jpeg' });
    setPages(p => [...p, file]);
    setPageUrls(u => [...u, reviewUrl]);
    setReviewUrl(null);
    setReviewBlob(null);
    setPhase('choice');
  }, [reviewBlob, reviewUrl, pages.length]);

  const retake = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null); setReviewBlob(null); lastQuadRef.current = null; setPhase('scanning');
  }, [reviewUrl]);

  // ── PDF generation ────────────────────────────────────────────────────────
  const generatePdf = useCallback(async (currentPages: File[], currentUrls: string[]): Promise<Blob> => {
    const { jsPDF } = window.jspdf; let pdf: any = null;
    for (let i = 0; i < currentPages.length; i++) {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = rej;
        el.src = currentUrls[i];
      });
      const landscape = img.naturalWidth > img.naturalHeight;
      const [pw, ph] = landscape ? [297, 210] : [210, 297];
      if (!pdf) pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      else pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
      pdf.addImage(currentUrls[i], 'JPEG', 0, 0, pw, ph);
    }
    return pdf.output('blob');
  }, []);

  const handleSaveAsScan = useCallback(async () => {
    if (!pages.length) return;
    setGeneratingPdf(true);
    try {
      const pdfBlob = await generatePdf(pages, pageUrls);
      onScanComplete(pages, pdfBlob);
    } catch {
      onScanComplete(pages, new Blob(pages, { type: 'application/pdf' }));
    } finally {
      setGeneratingPdf(false);
    }
  }, [pages, pageUrls, generatePdf, onScanComplete]);

  const handleConvertToWord = useCallback(() => {
    if (!pages.length) return;
    onConvertToText(pages);
  }, [pages, onConvertToText]);

  const headerLabel = phase === 'scanning' ? (pages.length > 0 ? `Page ${pages.length + 1}` : 'Scan Document')
    : phase === 'adjusting' ? 'Adjust Corners'
    : phase === 'reviewing' ? 'Review & Enhance'
    : 'Choose Save Option';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', minHeight: 60, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanLine size={16} color="#60A5FA" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>{headerLabel}</span>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>
          <X size={18} />
        </button>
      </div>

      {/* Main viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a', minHeight: 0 }}>

        {/* Scanning phase */}
        {phase === 'scanning' && !error && (<>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          {/* Status pill */}
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{
              background: docDetected ? 'rgba(21,128,61,0.88)' : !videoReady || !scannerReady ? 'rgba(0,0,0,0.70)' : 'rgba(0,0,0,0.60)',
              color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 24,
              backdropFilter: 'blur(8px)', transition: 'background 0.35s', letterSpacing: '0.2px',
              border: docDetected ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.10)',
            }}>
              {!videoReady ? '⏳ Starting camera…' : !scannerReady ? `⏳ ${loadingMsg}` : docDetected ? '✦ Document detected — tap to capture' : 'Aim at document on contrasting surface'}
            </span>
          </div>
        </>)}

        {/* Adjusting phase */}
        {phase === 'adjusting' && (<>
          <canvas ref={adjustRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
          {processing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#60A5FA', animation: 'spin 0.85s linear infinite' }} />
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{procMsg}</span>
            </div>
          )}
          {!processing && (
            <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ background: 'rgba(0,0,0,0.65)', color: '#93C5FD', fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, backdropFilter: 'blur(8px)', border: '1px solid rgba(147,197,253,0.25)' }}>
                Drag the blue handles to fit the document edges
              </span>
            </div>
          )}
        </>)}

        {/* Reviewing phase */}
        {phase === 'reviewing' && reviewUrl && (<>
          <img src={reviewUrl} alt="Processed" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', animation: 'scanSettle 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Enhancement pills */}
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {(['auto', 'color', 'bw'] as EnhanceMode[]).map(m => (
              <button key={m} onClick={() => setEnhanceMode(m)} style={{
                padding: '7px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: enhanceMode === m ? '#fff' : 'rgba(0,0,0,0.65)', color: enhanceMode === m ? '#1C1917' : '#fff',
                backdropFilter: 'blur(8px)', transition: 'all 0.18s', boxShadow: enhanceMode === m ? '0 0 0 2.5px #3B82F6' : 'none',
                letterSpacing: '0.2px',
              }}>
                {m === 'auto' ? '✦ Auto' : m === 'color' ? '🎨 Colour' : '◐ B&W'}
              </button>
            ))}
          </div>
        </>)}

        {/* Choice phase */}
        {phase === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: 320, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                Scan Complete
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 20 }}>
                {pages.length} Page{pages.length !== 1 ? 's' : ''} Scanned
              </div>
              
              {/* Horizontal thumbnail strips */}
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0 16px', marginBottom: 16, justifyContent: 'center' }}>
                {pageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', height: 76, width: 56, borderRadius: 6, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0 20px' }} />
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Save directly to your history as a PDF scan, or send to AI to convert into an editable document.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center', padding: '32px 24px', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} style={{ opacity: 0.7 }} />
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 300, color: '#E2E8F0' }}>{error}</p>
            <button onClick={() => { setError(null); startCamera(); }} style={{ padding: '13px 32px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes scanSettle{from{opacity:.4;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){@keyframes scanSettle{from{}to{}}}`}</style>

      {/* Bottom controls */}
      <div style={{ padding: '20px 20px', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>

        {/* Scanning controls */}
        {phase === 'scanning' && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
            {pages.length > 0 ? (
              <button onClick={() => setPhase('choice')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>
                <div style={{ position: 'relative', width: 46, height: 46 }}>
                  <img src={pageUrls[pageUrls.length - 1]} alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 10, border: '2px solid rgba(255,255,255,0.28)' }} />
                  <div style={{ position: 'absolute', top: -7, right: -7, background: '#24467A', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pages.length}</div>
                </div>
                DONE
              </button>
            ) : <div style={{ width: 46 }} />}

            {/* Shutter button */}
            <button onClick={captureFrame} disabled={!videoReady}
              style={{ width: 80, height: 80, borderRadius: '50%', background: 'transparent', border: `5px solid ${videoReady ? (docDetected ? '#22C55E' : 'rgba(255,255,255,0.75)') : 'rgba(255,255,255,0.18)'}`, cursor: videoReady ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.3s', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: videoReady ? (docDetected ? '#22C55E' : '#fff') : '#374151', transition: 'background 0.25s' }} />
            </button>

            <div style={{ width: 46 }} />
          </div>
        )}

        {/* Adjusting controls */}
        {phase === 'adjusting' && !processing && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { lastQuadRef.current = null; setPhase('scanning'); }} style={{ flex: 1, height: 54, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
              <RotateCcw size={15} /> Retake
            </button>
            <button onClick={applyTransform} style={{ flex: 2, height: 54, background: '#24467A', border: 'none', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(36,70,122,0.3)' }}>
              <ZapIcon size={15} /> Apply Correction
            </button>
          </div>
        )}

        {/* Reviewing controls */}
        {phase === 'reviewing' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={retake} style={{ flex: 1, height: 50, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <RotateCcw size={14} /> Retake
            </button>
            <button onClick={addAnotherPage} style={{ flex: 1.2, height: 50, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Plus size={14} /> Add Page
            </button>
            <button onClick={doneReviewing} style={{ flex: 1.2, height: 50, background: '#24467A', border: 'none', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(36,70,122,0.3)' }}>
              <Check size={14} /> Done ({pages.length + 1})
            </button>
          </div>
        )}

        {/* Choice controls */}
        {phase === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveAsScan} disabled={generatingPdf} style={{ flex: 1, height: 52, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', opacity: generatingPdf ? 0.65 : 1 }}>
                {generatingPdf ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
                {generatingPdf ? 'Building PDF…' : `Save as Scan`}
              </button>
              <button onClick={handleConvertToWord} style={{ flex: 1, height: 52, background: '#24467A', border: 'none', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(36,70,122,0.35)' }}>
                <FileText size={15} /> Convert to Word
              </button>
            </div>
            <button onClick={() => setPhase('scanning')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
              ← Scan more pages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
