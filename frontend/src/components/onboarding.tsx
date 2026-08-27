'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

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
  warmMid: '#C8C4BA',
};

const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';

export default function Onboarding({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);

  const SLIDES = [
    {
      title: 'Handwritten docs, typed in seconds',
      body: 'Convert legal affidavits, court notices, and handwritten notes into clean, editable digital documents instantly.',
      visual: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280, margin: '0 auto' }}>
          <div style={{ background: '#EDEAE3', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Handwritten Input</span>
            <p style={{ fontFamily: DISPLAY, fontSize: 13, color: C.inkMid, margin: '6px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
              I hereby declare that the said property belongs to...
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', color: C.warmMid }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          </div>
          <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Typed Word Document</span>
            <p style={{ fontFamily: DISPLAY, fontSize: 13, color: C.ink, margin: '6px 0 0', lineHeight: 1.4 }}>
              I hereby declare that the said property belongs to...
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Scan, dictate, or draft',
      body: 'Photograph physical files, dictate case notes, or draft legal agreements using structured document templates.',
      visual: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280, margin: '0 auto' }}>
          {[
            { tag: 'SCAN', label: 'Affidavits & Filings' },
            { tag: 'DICTATE', label: 'Audio Case Notes' },
            { tag: 'DRAFT', label: 'Lease & Deed Templates' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#FFFFFF' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, background: '#EEF2F8', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>{item.tag}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.inkMid }}>{item.label}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Pick up on any device',
      body: 'Transcribe on your mobile browser, and access your full history and downloadable Word documents from your laptop anytime.',
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, width: '100%', maxWidth: 280, margin: '0 auto', padding: '10px 0' }}>
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
        </div>
      )
    }
  ];

  const current = SLIDES[slide];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: C.paper, fontFamily: UI, padding: '24px 20px', boxSizing: 'border-box' }}>
      
      {/* Header with Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: 24 }}>
        {slide < 2 && (
          <button
            onClick={onComplete}
            style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: C.inkMute, cursor: 'pointer', fontFamily: UI }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Visual Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
        {current.visual}
      </div>

      {/* Content Area */}
      <div style={{ textAlign: 'center', paddingBottom: 24 }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: C.ink, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 14, color: C.inkMute, lineHeight: 1.6, margin: '0 auto', maxWidth: 320 }}>
          {current.body}
        </p>
      </div>

      {/* Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {SLIDES.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: idx === slide ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: idx === slide ? C.blue : C.border,
              transition: 'width 200ms ease, background 200ms ease',
            }}
          />
        ))}
      </div>

      {/* Primary Action Button */}
      <div style={{ paddingBottom: 16 }}>
        {slide < 2 ? (
          <button
            onClick={() => setSlide(n => n + 1)}
            style={{
              width: '100%', height: 48, background: C.blue, border: 'none', borderRadius: 6,
              fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onComplete}
            style={{
              width: '100%', height: 48, background: C.blue, border: 'none', borderRadius: 6,
              fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            Get Started
          </button>
        )}
      </div>

    </div>
  );
}
