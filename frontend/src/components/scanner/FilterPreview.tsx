'use client';
import { useState } from 'react';
import { Crop as CropIcon, RotateCw, Plus, Check, Sparkles, FileText, Sun, Sliders, Image as ImageIcon, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FilterType, ScannedPage } from '@/types/scanner';

interface FilterPreviewProps {
  page: ScannedPage;
  pageIndex: number;
  totalPages: number;
  onFilterChange: (filter: FilterType) => void;
  onRotate: () => void;
  onReCrop: () => void;
  onAddPage: () => void;
  onFinish: () => void;
}

const FILTERS: { id: FilterType; label: string; icon: any }[] = [
  { id: 'magic_color', label: 'Magic Color', icon: Sparkles },
  { id: 'clean_bw',    label: 'B&W Clean',   icon: FileText },
  { id: 'no_shadow',   label: 'No Shadow',   icon: Sun },
  { id: 'lighten',     label: 'Lighten',     icon: Sliders },
  { id: 'original',    label: 'Original',    icon: ImageIcon },
];

export function FilterPreview({
  page,
  pageIndex,
  totalPages,
  onFilterChange,
  onRotate,
  onReCrop,
  onAddPage,
  onFinish,
}: FilterPreviewProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showSliders, setShowSliders] = useState(false);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
      {/* Top Header */}
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
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onReCrop}
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
          <CropIcon size={16} /> Re-crop
        </motion.button>

        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
          Page {pageIndex + 1} of {totalPages}
        </span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRotate}
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
          <RotateCw size={18} />
        </motion.button>
      </div>

      {/* Render Scan Preview */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          overflow: 'hidden',
        }}
      >
        <img
          src={page.enhancedCanvas.toDataURL('image/jpeg', 0.92)}
          alt="Enhanced Document Scan"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            transition: 'filter 0.2s ease',
          }}
        />
      </div>

      {/* Manual Adjustments Panel */}
      {showSliders && (
        <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#A3A3A3', width: 68 }}>Brightness</span>
              <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} style={{ flex: 1, accentColor: '#22C55E' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#A3A3A3', width: 68 }}>Contrast</span>
              <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} style={{ flex: 1, accentColor: '#22C55E' }} />
            </div>
          </div>
        </div>
      )}

      {/* Tools Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <button
          onClick={() => setShowSliders(!showSliders)}
          style={{
            background: 'none', border: 'none', color: showSliders ? '#22C55E' : '#E4E1D9', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
          }}
        >
          <SlidersHorizontal size={14} /> Adjustments
        </button>
      </div>

      {/* CamScanner Filter Selector Carousel */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          overflowX: 'auto',
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {FILTERS.map(f => {
          const Icon = f.icon;
          const isSelected = page.filter === f.id;
          return (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onFilterChange(f.id)}
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

      {/* Footer Action Buttons */}
      <div
        style={{
          flexShrink: 0,
          padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 14px))',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: 12,
          background: '#0B0D12',
        }}
      >
        <Button
          variant="outline"
          onClick={onAddPage}
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
          <Plus size={16} style={{ marginRight: 6 }} /> Add Page
        </Button>
        <Button
          onClick={onFinish}
          style={{
            flex: 1.5,
            height: 48,
            borderRadius: 10,
            background: '#24467A',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          <Check size={18} style={{ marginRight: 6 }} /> Done ({totalPages})
        </Button>
      </div>
    </div>
  );
}
