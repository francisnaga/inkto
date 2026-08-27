'use client';
import { useState, useCallback, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { opencvBridge } from '@/lib/opencv-bridge';
import { compilePagesToPdf, canvasToFile } from '@/lib/pdf-compiler';
import { Quad, FilterType, ScannedPage, ScannerStage } from '@/types/scanner';

import { CameraCapture } from './CameraCapture';
import { CropEditor } from './CropEditor';
import { FilterPreview } from './FilterPreview';
import { BatchManager } from './BatchManager';

interface ScannerContainerProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}

export function ScannerContainer({
  onScanComplete,
  onConvertToText,
  onClose,
}: ScannerContainerProps) {
  const [stage, setStage] = useState<ScannerStage>('camera');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [procMsg, setProcMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pendingCornersRef = useRef<Quad | null>(null);

  // ── Stage 1: Camera Captured ──────────────────────────────────────────────
  const handleCapture = useCallback(async (canvas: HTMLCanvasElement, corners: Quad) => {
    pendingCornersRef.current = corners;
    setProcessing(true);
    setProcMsg('Auto-cropping document…');

    try {
      // Immediately apply the warp and filter (skipping manual crop step!)
      const warped = await opencvBridge.warpPerspective(canvas, corners);
      
      setProcMsg('Enhancing with Magic Color…');
      const enhanced = await opencvBridge.applyFilter(warped, 'magic_color');

      const newPage: ScannedPage = {
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        originalCanvas: canvas,
        corners,
        warpedCanvas: warped,
        enhancedCanvas: enhanced,
        filter: 'magic_color',
        rotation: 0,
      };

      setPages(prev => [...prev, newPage]);
      setActivePageIndex(pages.length);
      setStage('filter');
    } catch (e) {
      console.warn('Auto-crop failed, falling back to manual:', e);
      // Fallback to manual crop if processing fails
      const newPage: ScannedPage = {
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        originalCanvas: canvas,
        corners,
        warpedCanvas: canvas,
        enhancedCanvas: canvas,
        filter: 'magic_color',
        rotation: 0,
      };
      setPages(prev => [...prev, newPage]);
      setActivePageIndex(pages.length);
      setStage('crop');
    } finally {
      setProcessing(false);
    }
  }, [pages.length]);

  const handleImportFiles = useCallback(async (files: File[]) => {
    setProcessing(true);
    setProcMsg('Importing photo documents…');

    const importedPages: ScannedPage[] = [];

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

      const corners = await opencvBridge.detectEdges(canvas);
      
      try {
        const warped = await opencvBridge.warpPerspective(canvas, corners);
        const enhanced = await opencvBridge.applyFilter(warped, 'magic_color');
        
        importedPages.push({
          id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          originalCanvas: canvas,
          corners,
          warpedCanvas: warped,
          enhancedCanvas: enhanced,
          filter: 'magic_color',
          rotation: 0,
        });
      } catch (e) {
        importedPages.push({
          id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          originalCanvas: canvas,
          corners,
          warpedCanvas: canvas,
          enhancedCanvas: canvas,
          filter: 'magic_color',
          rotation: 0,
        });
      }
    }

    setPages(prev => [...prev, ...importedPages]);
    setActivePageIndex(pages.length);
    pendingCornersRef.current = importedPages[0]?.corners || null;
    setProcessing(false);
    setStage('filter'); // Go directly to filter preview!
  }, [pages.length]);

  // ── Stage 2: Apply Crop ───────────────────────────────────────────────────
  const activePage = pages[activePageIndex];

  const handleApplyCrop = useCallback(async (corners: Quad) => {
    if (!activePage) return;
    setProcessing(true);
    setProcMsg('Applying perspective warp…');

    try {
      const warped = await opencvBridge.warpPerspective(activePage.originalCanvas, corners);
      
      setProcMsg('Enhancing with Magic Color…');
      const enhanced = await opencvBridge.applyFilter(warped, activePage.filter);

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

      setStage('filter');
    } catch (e) {
      console.warn('Perspective warp fallback error:', e);
      setError('Could not apply crop — please adjust corners and try again.');
    } finally {
      setProcessing(false);
    }
  }, [activePage, activePageIndex]);

  // ── Stage 3: Filter & Adjustment ──────────────────────────────────────────
  const handleFilterChange = useCallback(async (filter: FilterType) => {
    if (!activePage) return;
    setProcessing(true);
    setProcMsg(`Applying ${filter.replace('_', ' ')}…`);

    try {
      const enhanced = await opencvBridge.applyFilter(activePage.warpedCanvas, filter);
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
      console.warn('Filter error:', e);
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

    const enhanced = await opencvBridge.applyFilter(rotated, activePage.filter);

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
        setStage('camera');
        return [];
      }
      setActivePageIndex(Math.max(0, index - 1));
      return filtered;
    });
  }, []);

  // ── Stage 4: Batch PDF & Text Export ──────────────────────────────────────
  const handleSavePdf = useCallback(async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setProcMsg('Compiling high-resolution A4 PDF…');

    try {
      const canvases = pages.map(p => p.enhancedCanvas);
      const pdfBlob = await compilePagesToPdf(canvases, `Scan-${new Date().toISOString().slice(0, 10)}`);
      
      const filePromises = pages.map((p, idx) => 
        canvasToFile(p.enhancedCanvas, `page-${idx + 1}.jpg`)
      );
      const pageFiles = await Promise.all(filePromises);

      onScanComplete(pageFiles, pdfBlob);
    } catch (e) {
      console.error('PDF generation error:', e);
      setError('Failed to create PDF. Please try again.');
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
    } catch (e) {
      console.error('Convert text error:', e);
      setError('Failed to prepare document pages.');
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
        fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Processing Loader Modal */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1010,
              background: 'rgba(11, 13, 18, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <Loader2 size={36} color="#22C55E" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E4E1D9' }}>{procMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1020,
            background: '#B23A34',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stage 1: Camera */}
      {stage === 'camera' && (
        <CameraCapture
          onCapture={handleCapture}
          onImportFiles={handleImportFiles}
          onFinishBatch={pages.length > 0 ? () => setStage('batch') : undefined}
          pageCount={pages.length}
          onClose={onClose}
        />
      )}

      {/* Stage 2: 4-Point Cropping */}
      {stage === 'crop' && activePage && (
        <CropEditor
          originalCanvas={activePage.originalCanvas}
          initialCorners={pendingCornersRef.current || activePage.corners}
          onApplyCrop={handleApplyCrop}
          onRetake={() => setStage('camera')}
        />
      )}

      {/* Stage 3: CamScanner Filter Preview */}
      {stage === 'filter' && activePage && (
        <FilterPreview
          page={activePage}
          pageIndex={activePageIndex}
          totalPages={pages.length}
          onFilterChange={handleFilterChange}
          onRotate={handleRotate}
          onReCrop={() => setStage('crop')}
          onAddPage={() => setStage('camera')}
          onFinish={() => setStage('batch')}
        />
      )}

      {/* Stage 4: Batch Manager */}
      {stage === 'batch' && (
        <BatchManager
          pages={pages}
          activePageIndex={activePageIndex}
          onSelectPage={idx => {
            setActivePageIndex(idx);
            setStage('filter');
          }}
          onDeletePage={handleDeletePage}
          onReorderPages={newPages => setPages(newPages)}
          onAddMore={() => setStage('camera')}
          onSavePdf={handleSavePdf}
          onConvertText={handleConvertText}
          onClose={onClose}
        />
      )}
    </div>
  );
}
