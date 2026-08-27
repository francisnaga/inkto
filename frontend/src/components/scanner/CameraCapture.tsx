'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Zap, ZapOff, SwitchCamera, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { opencvBridge } from '@/lib/opencv-bridge';
import { Quad } from '@/types/scanner';

interface CameraCaptureProps {
  onCapture: (canvas: HTMLCanvasElement, corners: Quad) => void;
  onImportFiles: (files: File[]) => void;
  onFinishBatch?: () => void;
  pageCount: number;
  onClose: () => void;
}

export function CameraCapture({
  onCapture,
  onImportFiles,
  onFinishBatch,
  pageCount,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const [detectedLiveCorners, setDetectedLiveCorners] = useState<Quad | null>(null);
  const [autoMode, setAutoMode] = useState(true);

  // Auto-capture steady state tracking
  const steadyRef = useRef({ frames: 0, lastCorners: null as Quad | null, capturing: false });

  // Poll for OpenCV readiness
  useEffect(() => {
    const interval = setInterval(() => {
      if (opencvBridge.getIsReady()) {
        setCvReady(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));
    } catch (e) {
      console.warn('Camera stream error:', e);
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
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const toggleLens = useCallback(() => {
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
      } catch {}
    }
  }, [torchOn]);

  // Shutter action
  const handleShutter = useCallback(async () => {
    if (!videoRef.current) return;
    if (navigator.vibrate) navigator.vibrate(40);
    steadyRef.current.capturing = true;

    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 1920;
    captureCanvas.height = video.videoHeight || 1080;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    let corners: Quad;
    try {
      corners = await opencvBridge.detectEdges(captureCanvas);
    } catch {
      corners = [
        { x: Math.round(captureCanvas.width * 0.08), y: Math.round(captureCanvas.height * 0.08) },
        { x: Math.round(captureCanvas.width * 0.92), y: Math.round(captureCanvas.height * 0.08) },
        { x: Math.round(captureCanvas.width * 0.92), y: Math.round(captureCanvas.height * 0.92) },
        { x: Math.round(captureCanvas.width * 0.08), y: Math.round(captureCanvas.height * 0.92) },
      ];
    }

    onCapture(captureCanvas, corners);
    
    // Reset after capture processing is handed off
    setTimeout(() => {
      steadyRef.current.capturing = false;
      steadyRef.current.frames = 0;
    }, 1500);
  }, [onCapture]);

  // Live Edge Detection loop
  useEffect(() => {
    if (!cameraReady) return;
    let animId: number;
    let lastScan = 0;

    const isSteady = (c1: Quad, c2: Quad) => {
      let maxDiff = 0;
      for (let i = 0; i < 4; i++) {
        maxDiff = Math.max(maxDiff, Math.hypot(c1[i].x - c2[i].x, c1[i].y - c2[i].y));
      }
      return maxDiff < 15; // Within 15 pixels of movement
    };

    const loop = async (time: number) => {
      if (videoRef.current && liveCanvasRef.current && videoRef.current.videoWidth > 0) {
        const video = videoRef.current;
        const canvas = liveCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 640) || 480;
        }

        if (time - lastScan > 250 && ctx && canvas.width > 0 && canvas.height > 0 && !steadyRef.current.capturing) {
          lastScan = time;
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const corners = await opencvBridge.detectEdges(canvas);
            setDetectedLiveCorners(corners);

            if (autoMode) {
              const last = steadyRef.current.lastCorners;
              if (last && isSteady(corners, last)) {
                steadyRef.current.frames += 1;
                if (steadyRef.current.frames >= 4) { // Roughly 1 second steady
                   handleShutter();
                }
              } else {
                steadyRef.current.frames = 0;
              }
              steadyRef.current.lastCorners = corners;
            } else {
              steadyRef.current.frames = 0;
            }
          } catch {}
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [cameraReady, autoMode, handleShutter]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onImportFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* CV Initialization Overlay */}
      {cameraReady && !cvReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          padding: '12px 24px',
          borderRadius: 30,
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          zIndex: 40,
        }}>
          <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Initializing AI Scanner...
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Top Controls Header */}
      <div
        style={{
          flexShrink: 0,
          height: 56,
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.65)',
          zIndex: 20,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </motion.button>

        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
          {pageCount > 0 ? `${pageCount} Page${pageCount > 1 ? 's' : ''} Scanned` : 'Scan Document'}
        </span>

        {/* Auto Mode Toggle */}
        <div
          onClick={() => setAutoMode(!autoMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: autoMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
            border: autoMode ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: 16,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            color: autoMode ? '#22C55E' : '#A3A3A3',
          }}
        >
          {autoMode ? 'AUTO' : 'MANUAL'}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleLens}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <SwitchCamera size={18} />
          </motion.button>
          {hasTorch && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTorch}
              style={{
                background: torchOn ? '#22C55E' : 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Video Viewfinder Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={liveCanvasRef} style={{ display: 'none' }} />

        {/* CamScanner Viewfinder Reticles & Laser */}
        <div style={{ position: 'absolute', inset: '12% 8%', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12 }}>
          <div style={{ position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTop: '4px solid #22C55E', borderLeft: '4px solid #22C55E', borderRadius: '4px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTop: '4px solid #22C55E', borderRight: '4px solid #22C55E', borderRadius: '0 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottom: '4px solid #22C55E', borderLeft: '4px solid #22C55E', borderRadius: '0 0 0 4px' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottom: '4px solid #22C55E', borderRight: '4px solid #22C55E', borderRadius: '0 0 4px 0' }} />

          <motion.div
            animate={{ top: ['0%', '98%', '0%'] }}
            transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
              boxShadow: '0 0 10px #22C55E',
            }}
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

      {/* Bottom Shutter Bar */}
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
        <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onFileInputChange} />

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleShutter}
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

        {pageCount > 0 && onFinishBatch ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onFinishBatch}
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
              <span style={{ fontSize: 15, fontWeight: 800 }}>✓</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Done ({pageCount})</span>
          </motion.button>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </div>
    </div>
  );
}
