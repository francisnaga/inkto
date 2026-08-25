'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X, RotateCcw, Check, ScanLine, ChevronLeft, ChevronRight,
  FileText, Download, Plus, Camera, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}
type Phase = 'scanning' | 'adjusting' | 'reviewing' | 'gallery';
type EnhanceMode = 'auto' | 'color' | 'bw';
interface Pt { x: number; y: number; }
type Quad = [Pt, Pt, Pt, Pt];

function loadScript(src: string): Promise<void> {
  return new Promise(res => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => res();
    document.head.appendChild(s);
  });
}
declare global { interface Window { jscanify: any; jspdf: any; cv: any; } }

function sortCorners(pts: Pt[]): Quad {
  const s = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const tl = s[0], br = s[3], [a, b] = [s[1], s[2]];
  const tr = a.x > b.x ? a : b, bl = a.x > b.x ? b : a;
  return [tl, tr, br, bl];
}
function dist(a: Pt, b: Pt) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function quadSize([tl, tr, br, bl]: Quad) {
  return { w: Math.max(100, Math.round((dist(tl, tr) + dist(bl, br)) / 2)), h: Math.max(100, Math.round((dist(tl, bl) + dist(tr, br)) / 2)) };
}
function defaultCorners(W: number, H: number): Quad {
  const p = 0.12;
  return [{ x: W*p, y: H*p }, { x: W*(1-p), y: H*p }, { x: W*(1-p), y: H*(1-p) }, { x: W*p, y: H*(1-p) }];
}
type TR = { scale: number; ox: number; oy: number };
function getTransform(iW: number, iH: number, cW: number, cH: number): TR {
  const scale = Math.min(cW / iW, cH / iH);
  return { scale, ox: (cW - iW * scale) / 2, oy: (cH - iH * scale) / 2 };
}
function i2c(p: Pt, t: TR) { return { x: t.ox + p.x * t.scale, y: t.oy + p.y * t.scale }; }
function c2i(x: number, y: number, t: TR) { return { x: (x - t.ox) / t.scale, y: (y - t.oy) / t.scale }; }

function perspectiveWarp(src: HTMLCanvasElement, corners: Quad): HTMLCanvasElement {
  const cv = window.cv;
  const [tl, tr, br, bl] = corners;
  const { w, h } = quadSize(corners);
  const srcMat = cv.imread(src), dstMat = new cv.Mat();
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  cv.warpPerspective(srcMat, dstMat, M, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  cv.imshow(out, dstMat);
  [srcMat, dstMat, srcPts, dstPts, M].forEach(m => m.delete());
  return out;
}

function enhance(src: HTMLCanvasElement, mode: EnhanceMode): HTMLCanvasElement {
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const ctx = out.getContext('2d')!;
  if (mode === 'bw') {
    ctx.filter = 'grayscale(1) contrast(1.7) brightness(1.08)'; ctx.drawImage(src, 0, 0); ctx.filter = 'none';
    const id = ctx.getImageData(0, 0, out.width, out.height); const d = id.data;
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i];
    const thr = (sum / (d.length / 4)) * 0.82;
    for (let i = 0; i < d.length; i += 4) { const v = d[i] >= thr ? 255 : 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
    ctx.putImageData(id, 0, 0);
  } else if (mode === 'auto') {
    ctx.drawImage(src, 0, 0);
    const id = ctx.getImageData(0, 0, out.width, out.height); const d = id.data;
    let [mnR,mxR,mnG,mxG,mnB,mxB] = [255,0,255,0,255,0];
    for (let i = 0; i < d.length; i += 16) {
      if (d[i]<mnR) mnR=d[i]; if (d[i]>mxR) mxR=d[i];
      if (d[i+1]<mnG) mnG=d[i+1]; if (d[i+1]>mxG) mxG=d[i+1];
      if (d[i+2]<mnB) mnB=d[i+2]; if (d[i+2]>mxB) mxB=d[i+2];
    }
    const rR=mxR-mnR||1, rG=mxG-mnG||1, rB=mxB-mnB||1;
    for (let i = 0; i < d.length; i += 4) {
      d[i]=Math.min(255,((d[i]-mnR)/rR)*270); d[i+1]=Math.min(255,((d[i+1]-mnG)/rG)*262); d[i+2]=Math.min(255,((d[i+2]-mnB)/rB)*248);
    }
    ctx.putImageData(id, 0, 0);
  } else {
    ctx.drawImage(src, 0, 0);
    const id = ctx.getImageData(0, 0, out.width, out.height); const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]=Math.min(255,Math.max(0,(d[i]-128)*1.18+136)); d[i+1]=Math.min(255,Math.max(0,(d[i+1]-128)*1.18+136)); d[i+2]=Math.min(255,Math.max(0,(d[i+2]-128)*1.18+136));
    }
    ctx.putImageData(id, 0, 0);
  }
  return out;
}

function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 32, c = 24;
  ctx.setLineDash([10,6]); ctx.strokeStyle='rgba(59,130,246,0.45)'; ctx.lineWidth=1.5;
  ctx.strokeRect(pad,pad,w-pad*2,h-pad*2); ctx.setLineDash([]);
  ctx.strokeStyle='#3B82F6'; ctx.lineWidth=4; ctx.lineCap='round';
  [[pad,pad],[w-pad,pad],[pad,h-pad],[w-pad,h-pad]].forEach(([x,y])=>{
    const dx=x<w/2?c:-c,dy=y<h/2?c:-c;
    ctx.beginPath(); ctx.moveTo(x+dx,y); ctx.lineTo(x,y); ctx.lineTo(x,y+dy); ctx.stroke();
  });
}

export default function ScannerModal({ onScanComplete, onConvertToText, onClose }: ScannerModalProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const adjustRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const animRef     = useRef<number>(0);
  const detIntRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const scannerRef  = useRef<any>(null);
  const capturedRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef     = useRef<HTMLCanvasElement | null>(null);
  const liveCornersRef = useRef<Quad | null>(null);
  const lastQuadRef    = useRef<Quad | null>(null);

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

  useEffect(() => {
    let dead = false;
    (async () => {
      // 1. Load OpenCV.js
      await loadScript('https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.2/dist/opencv.min.js');
      
      // 2. Wait for cv.Mat (OpenCV.js runtime initialized)
      await new Promise<void>(res => {
        const check = () => {
          if (window.cv && window.cv.Mat) {
            res();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });

      if (dead) return;

      // 3. Load jscanify and jspdf
      await loadScript('https://unpkg.com/jscanify@1.3.1/src/jscanify.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      if (!dead) {
        if (window.jscanify) {
          scannerRef.current = new window.jscanify();
        }
        setScannerReady(true);
      }
    })();
    return () => { dead = true; };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    cancelAnimationFrame(animRef.current);
    if (detIntRef.current) { clearInterval(detIntRef.current); detIntRef.current = null; }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null); setVideoReady(false); setDocDetected(false);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setVideoReady(true); }
    } catch (err: any) {
      setError(err?.name === 'NotAllowedError' ? 'Camera access denied — allow it in browser settings and tap Try again.'
        : err?.name === 'NotFoundError' ? 'No camera found on this device.'
        : `Could not start camera: ${err?.message || 'unknown error'}`);
    }
  }, []);

  useEffect(() => {
    if (phase === 'scanning') startCamera(); else stopCamera();
    return stopCamera;
  }, [phase, startCamera, stopCamera]);

  // 250ms edge detection interval
  useEffect(() => {
    if (phase !== 'scanning' || !scannerReady) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !scannerRef.current) return;
      const tmp = document.createElement('canvas');
      tmp.width = video.videoWidth; tmp.height = video.videoHeight;
      tmp.getContext('2d')!.drawImage(video, 0, 0);
      try {
        const contour = scannerRef.current.findPaperContour(tmp);
        if (contour && !contour.empty?.()) {
          const cornersObj = scannerRef.current.getCornerPoints(contour);
          contour.delete?.();
          if (cornersObj && cornersObj.topLeftCorner) {
            lastQuadRef.current = [
              cornersObj.topLeftCorner,
              cornersObj.topRightCorner,
              cornersObj.bottomRightCorner,
              cornersObj.bottomLeftCorner
            ];
            setDocDetected(true);
          } else {
            lastQuadRef.current = null;
            setDocDetected(false);
          }
        } else {
          contour?.delete?.();
          lastQuadRef.current = null;
          setDocDetected(false);
        }
      } catch (err) {
        lastQuadRef.current = null;
        setDocDetected(false);
      }
    }, 250);
    detIntRef.current = id;
    return () => clearInterval(id);
  }, [phase, scannerReady]);

  // 60fps overlay draw
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
        ctx.beginPath(); m.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
        ctx.strokeStyle='#22C55E'; ctx.lineWidth=3; ctx.stroke();
        ctx.fillStyle='rgba(34,197,94,0.12)'; ctx.fill();
        m.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,8,0,2*Math.PI); ctx.fillStyle='#22C55E'; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); });
      } else { drawGuide(ctx, ov.width, ov.height); }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) { setError('Camera not ready — wait a moment and try again.'); return; }
    stopCamera();
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    capturedRef.current = canvas;
    liveCornersRef.current = lastQuadRef.current ?? defaultCorners(canvas.width, canvas.height);
    setPhase('adjusting');
  }, [stopCamera]);

  // Interactive corner canvas
  useEffect(() => {
    if (phase !== 'adjusting') return;
    const canvas = adjustRef.current, img = capturedRef.current;
    if (!canvas || !img) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
    const HANDLE_R = 22;
    let dragIdx = -1;
    const corners: Quad = [...(liveCornersRef.current ?? defaultCorners(img.width, img.height))] as Quad;

    const draw = () => {
      const ctx = canvas.getContext('2d')!, t = getTransform(img.width, img.height, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, t.ox, t.oy, img.width * t.scale, img.height * t.scale);
      const m = corners.map(p => i2c(p, t));
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,canvas.width,canvas.height);
      ctx.moveTo(m[0].x,m[0].y); m.forEach((p,i) => i>0 && ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fill('evenodd'); ctx.restore();
      ctx.beginPath(); m.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.strokeStyle='#3B82F6'; ctx.lineWidth=2.5; ctx.stroke();
      m.forEach((p,i) => {
        ctx.beginPath(); ctx.arc(p.x,p.y,HANDLE_R,0,2*Math.PI);
        ctx.fillStyle=i===dragIdx?'#2563EB':'rgba(59,130,246,0.85)'; ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x-7,p.y); ctx.lineTo(p.x+7,p.y); ctx.moveTo(p.x,p.y-7); ctx.lineTo(p.x,p.y+7);
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      });
    };

    const pos = (e: PointerEvent) => { const r=canvas.getBoundingClientRect(),sx=canvas.width/r.width,sy=canvas.height/r.height; return {x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}; };
    const onDown = (e: PointerEvent) => {
      const p=pos(e), t=getTransform(img.width,img.height,canvas.width,canvas.height); dragIdx=-1; let best=HANDLE_R*2.5;
      corners.forEach((c,i)=>{ const cp=i2c(c,t),d=Math.hypot(p.x-cp.x,p.y-cp.y); if(d<best){best=d;dragIdx=i;} });
      if(dragIdx>=0){e.preventDefault();canvas.setPointerCapture(e.pointerId);draw();}
    };
    const onMove = (e: PointerEvent) => {
      if(dragIdx<0)return; e.preventDefault();
      const p=pos(e),t=getTransform(img.width,img.height,canvas.width,canvas.height),ip=c2i(p.x,p.y,t);
      corners[dragIdx]={x:Math.max(0,Math.min(img.width,ip.x)),y:Math.max(0,Math.min(img.height,ip.y))};
      liveCornersRef.current=[...corners] as Quad; draw();
    };
    const onUp = () => { dragIdx=-1; draw(); };

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    draw();
    return () => { canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); };
  }, [phase]);

  const applyTransform = useCallback(async () => {
    const src = capturedRef.current, corners = liveCornersRef.current;
    if (!src || !corners) return;
    setProcessing(true); setProcMsg('Applying perspective correction…'); await new Promise(r => setTimeout(r, 40));
    let corrected: HTMLCanvasElement;
    try {
      if (scannerRef.current) {
        const [tl, tr, br, bl] = corners;
        const { w, h } = quadSize(corners);
        corrected = scannerRef.current.extractPaper(src, w, h, {
          topLeftCorner: tl,
          topRightCorner: tr,
          bottomRightCorner: br,
          bottomLeftCorner: bl
        });
        if (!corrected) corrected = src;
      } else {
        corrected = src;
      }
    } catch (err) {
      console.error("extractPaper failed:", err);
      corrected = src;
    }
    baseRef.current = corrected;
    setProcMsg('Enhancing image…'); await new Promise(r => setTimeout(r, 40));
    const enhanced = enhance(corrected, 'auto'); setEnhanceMode('auto');
    enhanced.toBlob(blob => {
      if (!blob) { setProcessing(false); return; }
      if (reviewUrl) URL.revokeObjectURL(reviewUrl);
      setReviewUrl(URL.createObjectURL(blob)); setReviewBlob(blob);
      setPhase('reviewing'); setProcessing(false); setProcMsg('');
    }, 'image/jpeg', 0.95);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'reviewing' || !baseRef.current) return;
    const enhanced = enhance(baseRef.current, enhanceMode);
    enhanced.toBlob(blob => {
      if (!blob) return;
      setReviewUrl(prev => { if(prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob!); });
      setReviewBlob(blob);
    }, 'image/jpeg', 0.95);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhanceMode, phase]);

  const acceptPage = useCallback(() => {
    if (!reviewBlob || !reviewUrl) return;
    const file = new File([reviewBlob], `page-${pages.length+1}.jpg`, { type: 'image/jpeg' });
    setPages(p => [...p, file]); setPageUrls(u => [...u, reviewUrl]);
    setReviewUrl(null); setReviewBlob(null); setPhase('gallery');
  }, [reviewBlob, reviewUrl, pages.length]);

  const retake = useCallback(() => {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null); setReviewBlob(null); lastQuadRef.current = null; setPhase('scanning');
  }, [reviewUrl]);

  const removePage = useCallback((idx: number) => {
    URL.revokeObjectURL(pageUrls[idx]);
    setPages(p => p.filter((_,i) => i!==idx)); setPageUrls(u => u.filter((_,i) => i!==idx));
    setGalleryIdx(g => Math.max(0, Math.min(g, pages.length-2)));
  }, [pageUrls, pages.length]);

  const generatePdf = useCallback(async (): Promise<Blob> => {
    const { jsPDF } = window.jspdf; let pdf: any = null;
    for (let i = 0; i < pages.length; i++) {
      const img = await new Promise<HTMLImageElement>((res,rej) => { const el=new Image(); el.onload=()=>res(el); el.onerror=rej; el.src=pageUrls[i]; });
      const landscape = img.naturalWidth > img.naturalHeight;
      const [pw,ph] = landscape ? [297,210] : [210,297];
      if (!pdf) pdf = new jsPDF({ orientation: landscape?'landscape':'portrait', unit:'mm', format:'a4' });
      else pdf.addPage('a4', landscape?'landscape':'portrait');
      pdf.addImage(pageUrls[i], 'JPEG', 0, 0, pw, ph);
    }
    return pdf.output('blob');
  }, [pages, pageUrls]);

  const handleDone = useCallback(async () => {
    if (!pages.length) return; setGeneratingPdf(true);
    try { onScanComplete(pages, await generatePdf()); } catch { onScanComplete(pages, new Blob(pages, { type:'application/pdf' })); } finally { setGeneratingPdf(false); }
  }, [pages, generatePdf, onScanComplete]);

  const handleConvert = useCallback(() => { if (!pages.length) return; onConvertToText(pages); }, [pages, onConvertToText]);

  const headerLabel = phase==='scanning'?(pages.length>0?`Scan page ${pages.length+1}`:'Scan document'):phase==='adjusting'?'Drag corners to adjust':phase==='reviewing'?'Review — choose enhancement':`${pages.length} page${pages.length!==1?'s':''} scanned`;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000', display:'flex', flexDirection:'column', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', minHeight:56, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#fff' }}><ScanLine size={18} /><span style={{ fontWeight:600, fontSize:15 }}>{headerLabel}</span></div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}><X size={18} /></button>
      </div>

      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#111', minHeight:0 }}>
        {phase==='scanning' && !error && (<>
          <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          <canvas ref={overlayRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:14, left:0, right:0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
            <span style={{ background:docDetected?'rgba(21,128,61,0.9)':'rgba(0,0,0,0.65)', color:'#fff', fontSize:12, fontWeight:600, padding:'5px 16px', borderRadius:20, backdropFilter:'blur(6px)', transition:'background 0.3s' }}>
              {!videoReady?'Starting camera…':!scannerReady?'Loading edge detector…':docDetected?'✓ Document detected — tap shutter':'Aim at document on a contrasting surface'}
            </span>
          </div>
        </>)}

        {phase==='adjusting' && (<>
          <canvas ref={adjustRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block', touchAction:'none' }} />
          {processing && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
              <Loader2 size={40} color="#fff" style={{ animation:'spin 1s linear infinite' }} />
              <span style={{ color:'#fff', fontSize:14, fontWeight:600 }}>{procMsg}</span>
            </div>
          )}
        </>)}

        {phase==='reviewing' && reviewUrl && (<>
          <img src={reviewUrl} alt="Processed" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', animation:'scanSettle 0.28s cubic-bezier(0.4,0,0.2,1)' }} />
          <div style={{ position:'absolute', top:14, left:0, right:0, display:'flex', justifyContent:'center', gap:8 }}>
            {(['auto','color','bw'] as EnhanceMode[]).map(m => (
              <button key={m} onClick={() => setEnhanceMode(m)} style={{ padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:enhanceMode===m?'#fff':'rgba(0,0,0,0.6)', color:enhanceMode===m?'#1C1917':'#fff', backdropFilter:'blur(6px)', transition:'all 0.15s', boxShadow:enhanceMode===m?'0 0 0 2px #3B82F6':'none' }}>
                {m==='auto'?'Auto':m==='color'?'Colour':'B&W'}
              </button>
            ))}
          </div>
        </>)}

        {phase==='gallery' && pages.length>0 && (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
              <img src={pageUrls[galleryIdx]} alt={`Page ${galleryIdx+1}`} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
              <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.7)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600 }}>{galleryIdx+1} / {pages.length}</div>
              <button onClick={() => removePage(galleryIdx)} style={{ position:'absolute', top:12, left:12, background:'rgba(220,38,38,0.85)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}><X size={16} /></button>
              {pages.length>1 && (<>
                <button onClick={() => setGalleryIdx(i=>Math.max(0,i-1))} disabled={galleryIdx===0} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.55)', border:'none', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', opacity:galleryIdx===0?0.3:1 }}><ChevronLeft size={22} /></button>
                <button onClick={() => setGalleryIdx(i=>Math.min(pages.length-1,i+1))} disabled={galleryIdx===pages.length-1} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.55)', border:'none', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', opacity:galleryIdx===pages.length-1?0.3:1 }}><ChevronRight size={22} /></button>
              </>)}
            </div>
            {pages.length>1 && (
              <div style={{ height:76, display:'flex', gap:6, padding:'8px 12px', overflowX:'auto', background:'rgba(0,0,0,0.75)', alignItems:'center' }}>
                {pageUrls.map((url,i) => <img key={i} src={url} onClick={()=>setGalleryIdx(i)} style={{ height:56, width:44, objectFit:'cover', borderRadius:6, cursor:'pointer', border:i===galleryIdx?'2px solid #3B82F6':'2px solid transparent', flexShrink:0, opacity:i===galleryIdx?1:0.55 }} />)}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#fff', textAlign:'center', padding:32, gap:20 }}>
            <Camera size={44} style={{ opacity:0.4 }} />
            <p style={{ fontSize:15, lineHeight:1.7, margin:0, maxWidth:320 }}>{error}</p>
            <button onClick={startCamera} style={{ padding:'12px 32px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>Try again</button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes scanSettle{from{opacity:.5;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){@keyframes scanSettle{from{}to{}}}`}</style>

      <div style={{ padding:'16px', background:'rgba(0,0,0,0.9)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
        {phase==='scanning' && !error && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:32 }}>
            {pages.length>0?(
              <button onClick={()=>setPhase('gallery')} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:10, fontWeight:600 }}>
                <div style={{ position:'relative', width:44, height:44 }}>
                  <img src={pageUrls[pageUrls.length-1]} alt="" style={{ width:44, height:44, objectFit:'cover', borderRadius:8, border:'2px solid rgba(255,255,255,0.3)' }} />
                  <div style={{ position:'absolute', top:-6, right:-6, background:'#2563EB', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{pages.length}</div>
                </div>
                Review
              </button>
            ):<div style={{ width:44 }}/>}
            <button onClick={captureFrame} disabled={!videoReady} style={{ width:80, height:80, borderRadius:'50%', background:'transparent', border:`5px solid ${videoReady?(docDetected?'#22C55E':'rgba(255,255,255,0.6)'):'rgba(255,255,255,0.2)'}`, cursor:videoReady?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.3s', flexShrink:0 }}>
              <div style={{ width:62, height:62, borderRadius:'50%', background:videoReady?'#fff':'#374151', transition:'background 0.2s' }} />
            </button>
            <div style={{ width:44 }}/>
          </div>
        )}
        {phase==='adjusting' && !processing && (
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="outline" onClick={()=>{lastQuadRef.current=null;setPhase('scanning');}} style={{ flex:1, height:52, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', gap:6, fontSize:14, fontWeight:600 }}>
              <RotateCcw size={15} /> Retake
            </Button>
            <Button onClick={applyTransform} style={{ flex:2, height:52, gap:6, fontSize:14, fontWeight:600, background:'#2563EB', border:'none' }}>
              <Check size={15} /> Apply correction
            </Button>
          </div>
        )}
        {phase==='reviewing' && (
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="outline" onClick={retake} style={{ flex:1, height:56, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', gap:6, fontSize:15, fontWeight:600 }}>
              <RotateCcw size={15} /> Retake
            </Button>
            <Button onClick={acceptPage} style={{ flex:1, height:56, gap:6, fontSize:15, fontWeight:600, background:'#16A34A', border:'none' }}>
              <Check size={15} /> Use this page
            </Button>
          </div>
        )}
        {phase==='gallery' && (<>
          <Button variant="outline" onClick={()=>setPhase('scanning')} style={{ width:'100%', height:48, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', gap:6, fontSize:14, fontWeight:600 }}>
            <Plus size={15} /> Scan another page
          </Button>
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="outline" onClick={handleDone} disabled={generatingPdf} style={{ flex:1, height:56, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', gap:6, fontSize:14, fontWeight:600 }}>
              <Download size={15} /> {generatingPdf?'Building PDF…':`Save PDF (${pages.length}p)`}
            </Button>
            <Button onClick={handleConvert} style={{ flex:1, height:56, gap:6, fontSize:14, fontWeight:600 }}>
              <FileText size={15} /> Convert to Text
            </Button>
          </div>
        </>)}
      </div>
    </div>
  );
}
