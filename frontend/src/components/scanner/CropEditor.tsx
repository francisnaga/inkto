'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Point, Quad } from '@/types/scanner';

interface CropEditorProps {
  originalCanvas: HTMLCanvasElement;
  initialCorners: Quad;
  onApplyCrop: (corners: Quad) => void;
  onRetake: () => void;
}

export function CropEditor({
  originalCanvas,
  initialCorners,
  onApplyCrop,
  onRetake,
}: CropEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [corners, setCorners] = useState<Quad>(initialCorners);
  const cornersRef = useRef<Quad>(initialCorners);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  useEffect(() => {
    cornersRef.current = initialCorners;
    setCorners(initialCorners);
  }, [initialCorners]);

  useEffect(() => {
    if (!canvasRef.current || !originalCanvas) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const src = originalCanvas;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 360;
    canvas.height = rect.height || 480;

    const scale = Math.min(canvas.width / src.width, canvas.height / src.height);
    const ox = (canvas.width - src.width * scale) / 2;
    const oy = (canvas.height - src.height * scale) / 2;

    const i2c = (p: Point) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
    const c2i = (x: number, y: number) => ({ x: (x - ox) / scale, y: (y - oy) / scale });

    let dragIdx = -1;
    const HANDLE_R = 14;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src, ox, oy, src.width * scale, src.height * scale);

      const cPts = cornersRef.current.map(i2c);

      // Darkened overlay outside the quadrilateral
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

      // Handles
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

    const drawLoupe = (screenX: number, screenY: number, imgCorner: Point) => {
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

      // Crosshair
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
        y: Math.max(10, screenY - size - 50),
        visible: true,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      const bRect = canvas.getBoundingClientRect();
      const px = e.clientX - bRect.left;
      const py = e.clientY - bRect.top;

      let best = HANDLE_R * 3;
      dragIdx = -1;
      cornersRef.current.forEach((c, idx) => {
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
        drawLoupe(e.clientX, e.clientY, cornersRef.current[dragIdx]);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragIdx < 0) return;
      e.preventDefault();
      const bRect = canvas.getBoundingClientRect();
      const px = e.clientX - bRect.left;
      const py = e.clientY - bRect.top;
      const ip = c2i(px, py);

      const nextCorners = [...cornersRef.current] as Quad;
      nextCorners[dragIdx] = {
        x: Math.max(0, Math.min(src.width, ip.x)),
        y: Math.max(0, Math.min(src.height, ip.y)),
      };
      cornersRef.current = nextCorners;
      setCorners(nextCorners);
      draw();
      drawLoupe(e.clientX, e.clientY, nextCorners[dragIdx]);
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
  }, [originalCanvas]);

  const handleFullPage = useCallback(() => {
    const w = originalCanvas.width;
    const h = originalCanvas.height;
    const fullQuad: Quad = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    cornersRef.current = fullQuad;
    setCorners(fullQuad);
    onApplyCrop(fullQuad);
  }, [originalCanvas, onApplyCrop]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          height: 56,
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={onRetake}
          style={{
            background: 'none',
            border: 'none',
            color: '#E4E1D9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} /> Retake
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Adjust Document Corners</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Interactive Crop Viewport */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain', touchAction: 'none' }} />

        {/* 2.5x Loupe Touch Magnifier */}
        {loupePos.visible && (
          <div
            style={{
              position: 'fixed',
              left: loupePos.x,
              top: loupePos.y,
              zIndex: 1030,
              pointerEvents: 'none',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
              border: '3px solid #22C55E',
            }}
          >
            <canvas ref={loupeCanvasRef} style={{ display: 'block' }} />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 16px))',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: 12,
          background: '#0B0D12',
        }}
      >
        <Button
          variant="outline"
          onClick={handleFullPage}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            fontWeight: 600,
          }}
        >
          Full Page
        </Button>
        <Button
          onClick={() => onApplyCrop(cornersRef.current)}
          style={{
            flex: 2,
            height: 48,
            borderRadius: 10,
            background: '#22C55E',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          <Check size={18} style={{ marginRight: 6 }} /> Apply Crop
        </Button>
      </div>
    </div>
  );
}
