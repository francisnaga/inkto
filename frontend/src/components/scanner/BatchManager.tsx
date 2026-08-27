'use client';
import { Plus, X, Trash2, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ScannedPage } from '@/types/scanner';

interface BatchManagerProps {
  pages: ScannedPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onAddMore: () => void;
  onSavePdf: () => void;
  onConvertText: () => void;
  onClose: () => void;
}

export function BatchManager({
  pages,
  activePageIndex,
  onSelectPage,
  onDeletePage,
  onAddMore,
  onSavePdf,
  onConvertText,
  onClose,
}: BatchManagerProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0B0D12' }}>
      {/* Top Bar */}
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
          onClick={onAddMore}
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
          <Plus size={16} /> Add More
        </motion.button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Document Pages ({pages.length})</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#E4E1D9', cursor: 'pointer' }}
        >
          <X size={20} />
        </motion.button>
      </div>

      {/* Grid of Pages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: 16,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
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
              onClick={() => onSelectPage(idx)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              Page {idx + 1}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                onDeletePage(idx);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(178,58,52,0.85)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Export Actions Bar */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 16px))',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#0B0D12',
        }}
      >
        <Button
          onClick={onSavePdf}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 10,
            background: '#22C55E',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <Download size={18} style={{ marginRight: 8 }} /> Save Document as PDF
        </Button>
        <Button
          onClick={onConvertText}
          variant="outline"
          style={{
            width: '100%',
            height: 48,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <FileText size={18} style={{ marginRight: 8 }} /> Convert to Word / Editable Text
        </Button>
      </div>
    </div>
  );
}
