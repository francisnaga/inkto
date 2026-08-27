'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueMid: '#3A5C94',
  warmMid: '#C8C4BA',
};

const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';

const SLIDES = [
  {
    title: 'Handwritten docs, typed in seconds',
    body: 'Convert legal affidavits, court notices, and handwritten notes into clean, editable digital documents instantly.',
    visual: (
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280, margin: '0 auto' }}
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
          style={{ background: '#EDEAE3', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, color: C.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Handwritten Input</span>
          <p style={{ fontFamily: DISPLAY, fontSize: 13, color: C.inkMid, margin: '6px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
            I hereby declare that the said property belongs to...
          </p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
          style={{ display: 'flex', justifyContent: 'center', color: C.warmMid }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
          style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Typed Word Document</span>
          <p style={{ fontFamily: DISPLAY, fontSize: 13, color: C.ink, margin: '6px 0 0', lineHeight: 1.4 }}>
            I hereby declare that the said property belongs to...
          </p>
        </motion.div>
      </motion.div>
    ),
  },
  {
    title: 'Scan, dictate, or draft',
    body: 'Photograph physical files, dictate case notes, or draft legal agreements using structured document templates.',
    visual: (
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280, margin: '0 auto' }}
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {[
          { tag: 'SCAN',    label: 'Affidavits & Filings' },
          { tag: 'DICTATE', label: 'Audio Case Notes' },
          { tag: 'DRAFT',   label: 'Lease & Deed Templates' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#FFFFFF' }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, background: '#EEF2F8', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>{item.tag}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.inkMid }}>{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    title: 'Pick up on any device',
    body: 'Transcribe on your mobile browser, and access your full history and downloadable Word documents from your laptop anytime.',
    visual: (
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, width: '100%', maxWidth: 280, margin: '0 auto', padding: '10px 0' }}
      >
        <div style={{ width: 68, height: 110, border: `2px solid ${C.ink}`, borderRadius: 8, background: '#FFFFFF', padding: 6, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
          <div style={{ width: 8, height: 2, background: C.ink, borderRadius: 1, margin: '0 auto 2px' }} />
          <div style={{ flex: 1, border: `1px dashed ${C.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.blue }}>Capture</span>
          </div>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.blue, position: 'absolute', bottom: -5, right: -5, border: '2px solid #fff' }} />
        </div>
        <div style={{ color: C.warmMid }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </div>
        <div style={{ width: 110, height: 76, border: `2px solid ${C.ink}`, borderRadius: 6, background: '#FFFFFF', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ flex: 1, border: `1px dashed ${C.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.ink }}>History</span>
          </div>
          <div style={{ width: 24, height: 4, background: C.ink, borderRadius: 1, margin: '0 auto' }} />
        </div>
      </motion.div>
    ),
  },
];

export default function Onboarding({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = backward

  const goTo = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const current = SLIDES[slide];

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -30 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: C.paper, fontFamily: UI, padding: '24px 20px', boxSizing: 'border-box' }}
    >
      {/* Header with Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: 24 }}>
        {slide < 2 && (
          <motion.button
            whileTap={{ opacity: 0.5, scale: 0.95 }}
            onClick={onComplete}
            style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: C.inkMute, cursor: 'pointer', fontFamily: UI }}
          >
            Skip
          </motion.button>
        )}
      </div>

      {/* Visual Area — animated slide transition */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ width: '100%' }}
          >
            {current.visual}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Area — also animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${slide}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ textAlign: 'center', paddingBottom: 24 }}
        >
          <h2 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: C.ink, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: C.inkMute, lineHeight: 1.6, margin: '0 auto', maxWidth: 320 }}>
            {current.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {SLIDES.map((_, idx) => (
          <motion.div
            key={idx}
            animate={{
              width: idx === slide ? 18 : 6,
              background: idx === slide ? C.blue : C.border,
            }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ height: 6, borderRadius: 3 }}
          />
        ))}
      </div>

      {/* Primary Action Button */}
      <div style={{ paddingBottom: 16 }}>
        {slide < 2 ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => goTo(slide + 1)}
            style={{
              width: '100%', height: 52, background: C.blue, border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            Continue <ChevronRight size={16} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ background: C.blueMid }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onComplete}
            style={{
              width: '100%', height: 52, background: C.blue, border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            Get Started
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
