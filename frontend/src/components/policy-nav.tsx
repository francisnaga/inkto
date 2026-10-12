'use client';

import React, { useEffect } from 'react';

export interface SectionItem {
  id: string;
  title: string;
}

interface PolicyNavProps {
  sections: SectionItem[];
  activeSection: string;
  onSelectSection: (id: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function PolicyNav({
  sections,
  activeSection,
  onSelectSection,
  mobileOpen,
  setMobileOpen,
}: PolicyNavProps) {
  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleItemClick = (id: string) => {
    onSelectSection(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      <style>{`
        /* ================= Tree / Branch Navigation ================= */
        .branch-tree {
          position: relative;
          padding-left: 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Continuous trunk line */
        .branch-tree::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 14px;
          bottom: 16px;
          width: 2px;
          background: #E5E7EB;
          border-radius: 1px;
        }

        .branch-node {
          position: relative;
          display: flex;
          align-items: flex-start;
          padding: 8px 12px 8px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          font-size: 13.5px;
          line-height: 1.45;
          color: #4B5563;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Horizontal branch connector elbow */
        .branch-node::before {
          content: '';
          position: absolute;
          left: -9px;
          top: 17px;
          width: 18px;
          height: 1.5px;
          background: #E5E7EB;
          transition: all 0.15s ease;
        }

        /* Branch junction dot / node */
        .branch-node::after {
          content: '';
          position: absolute;
          left: -11px;
          top: 14px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #9CA3AF;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .branch-node:hover {
          color: #1D4ED8;
          background: #F8FAFC;
        }

        .branch-node:hover::before {
          background: #93C5FD;
        }

        .branch-node:hover::after {
          border-color: #2563EB;
          background: #DBEAFE;
          transform: scale(1.2);
        }

        .branch-node.active {
          color: #1E40AF;
          font-weight: 600;
          background: #EFF6FF;
        }

        .branch-node.active::before {
          background: #2563EB;
          height: 2px;
        }

        .branch-node.active::after {
          border-color: #2563EB;
          background: #2563EB;
          box-shadow: 0 0 0 3px #BFDBFE;
          transform: scale(1.25);
        }

        /* Desktop Sidebar Container */
        .policy-sidebar {
          width: 270px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .policy-sidebar {
            display: none !important;
          }
        }

        .sidebar-inner {
          position: sticky;
          top: 104px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          padding-right: 8px;
        }

        .sidebar-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-left: 4px;
        }

        .sidebar-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9CA3AF;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .count-pill {
          background: #F3F4F6;
          color: #6B7280;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 9999px;
          border: 1px solid #E5E7EB;
        }

        /* ================= Mobile Header Toggle Button ================= */
        .mobile-toc-toggle {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-toc-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #F3F4F6;
            color: #1F2937;
            border: 1px solid #E5E7EB;
            border-radius: 9999px;
            padding: 5px 12px;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .mobile-toc-toggle:hover {
            background: #E5E7EB;
          }
          .mobile-toc-toggle:active {
            transform: scale(0.96);
          }
        }

        /* ================= Mobile Floating Action Pill ================= */
        .mobile-floating-pill {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-floating-pill {
            position: fixed;
            bottom: 22px;
            right: 18px;
            z-index: 45;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #111827;
            color: #FFFFFF;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 9999px;
            padding: 9px 16px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .mobile-floating-pill:active {
            transform: scale(0.95);
          }
        }

        /* ================= Mobile Drawer Modal ================= */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .drawer-sheet {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 86%;
          max-width: 340px;
          background: #FFFFFF;
          z-index: 101;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
          transform: translateX(100%);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .drawer-sheet.open {
          transform: translateX(0);
        }

        .drawer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #F3F4F6;
          background: #FAFAFA;
        }

        .drawer-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .drawer-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6B7280;
          transition: all 0.15s ease;
        }

        .drawer-close:hover {
          background: #F3F4F6;
          color: #111827;
        }

        .drawer-hint {
          padding: 12px 20px 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9CA3AF;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px 18px 24px;
          -webkit-overflow-scrolling: touch;
        }

        .drawer-footer {
          padding: 14px 20px;
          border-top: 1px solid #F3F4F6;
          background: #FAFAFA;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #9CA3AF;
        }

        .drawer-top-btn {
          background: none;
          border: none;
          color: #2563EB;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="policy-sidebar">
        <div className="sidebar-inner">
          <div className="sidebar-header-row">
            <h3 className="sidebar-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="3" x2="6" y2="15"/>
                <circle cx="18" cy="6" r="3"/>
                <circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 0 1-9 9"/>
              </svg>
              Contents
            </h3>
            <span className="count-pill">{sections.length}</span>
          </div>

          <nav className="branch-tree">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`branch-node ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => handleItemClick(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Floating Trigger */}
      <button
        className="mobile-floating-pill"
        onClick={() => setMobileOpen(true)}
        aria-label="View section outline"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15"/>
          <circle cx="18" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <path d="M18 9a9 9 0 0 1-9 9"/>
        </svg>
        <span>Contents</span>
      </button>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`drawer-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer Sheet */}
      <div className={`drawer-sheet ${mobileOpen ? 'open' : ''}`}>
        <div className="drawer-top">
          <div className="drawer-title-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/>
              <circle cx="18" cy="6" r="3"/>
              <circle cx="6" cy="18" r="3"/>
              <path d="M18 9a9 9 0 0 1-9 9"/>
            </svg>
            <span className="drawer-title">Document Outline</span>
            <span className="count-pill">{sections.length}</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="drawer-hint">Select a section to jump</div>

        <div className="drawer-body">
          <nav className="branch-tree">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`branch-node ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => handleItemClick(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </div>

        <div className="drawer-footer">
          <span>Inkto Policy Hub</span>
          <button
            className="drawer-top-btn"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setMobileOpen(false);
            }}
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </>
  );
}

export function MobileHeaderTocButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      className="mobile-toc-toggle"
      onClick={onClick}
      aria-label="Open document contents"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15"/>
        <circle cx="18" cy="6" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <path d="M18 9a9 9 0 0 1-9 9"/>
      </svg>
      <span>Outline</span>
      <span style={{
        background: '#E5E7EB',
        color: '#4B5563',
        fontSize: '11px',
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: '9999px',
        marginLeft: '2px'
      }}>{count}</span>
    </button>
  );
}
