'use client';

import React from 'react';

interface DeveloperCardProps {
  title?: string;
  subtitle?: string;
}

export function DeveloperCard({ 
  title = "Francis Naga", 
  subtitle = "Creator & Engineering Lead" 
}: DeveloperCardProps) {
  return (
    <div className="dev-card">
      <style>{`
        .dev-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 22px;
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -10px rgba(0, 0, 0, 0.06);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dev-card:hover {
          border-color: #BFDBFE;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08), 0 16px 36px -12px rgba(0, 0, 0, 0.09);
        }
        .dev-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F3F4F6;
        }
        .dev-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #60A5FA 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: -0.02em;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          flex-shrink: 0;
        }
        .dev-meta {
          flex: 1;
          min-width: 0;
        }
        .dev-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 3px;
        }
        .dev-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .dev-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
          letter-spacing: 0.01em;
        }
        .dev-badge::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2563EB;
        }
        .dev-subtext {
          font-size: 13px;
          color: #6B7280;
          display: block;
        }
        .dev-channels {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        .dev-channel {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          background: #F9FAFB;
          border: 1px solid #F3F4F6;
          text-decoration: none !important;
          color: inherit;
          transition: all 0.15s ease;
        }
        .dev-channel:hover {
          background: #EFF6FF;
          border-color: #BFDBFE;
          transform: translateY(-1px);
        }
        .dev-channel-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563EB;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.15s ease;
        }
        .dev-channel:hover .dev-channel-icon {
          background: #2563EB;
          color: #FFFFFF;
          border-color: #2563EB;
        }
        .dev-channel-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .dev-channel-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9CA3AF;
          margin-bottom: 2px;
        }
        .dev-channel-val {
          font-size: 13.5px;
          font-weight: 600;
          color: #1F2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dev-channel:hover .dev-channel-val {
          color: #1D4ED8;
        }
        .dev-channel-arrow {
          color: #9CA3AF;
          font-size: 14px;
          transition: all 0.15s;
          padding-right: 4px;
        }
        .dev-channel:hover .dev-channel-arrow {
          color: #2563EB;
          transform: translateX(3px);
        }
      `}</style>

      <div className="dev-card-header">
        <div className="dev-avatar">
          <span>FN</span>
        </div>
        <div className="dev-meta">
          <div className="dev-name-row">
            <span className="dev-name">{title}</span>
            <span className="dev-badge">{subtitle}</span>
          </div>
          <span className="dev-subtext">Product Architecture &amp; System Development</span>
        </div>
      </div>

      <div className="dev-channels">
        <a href="mailto:hello@francisnaga.site" className="dev-channel">
          <div className="dev-channel-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div className="dev-channel-content">
            <span className="dev-channel-label">Direct Contact &amp; Support</span>
            <span className="dev-channel-val">hello@francisnaga.site</span>
          </div>
          <span className="dev-channel-arrow">→</span>
        </a>

        <a href="https://francisnaga.site" target="_blank" rel="noopener noreferrer" className="dev-channel">
          <div className="dev-channel-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
          <div className="dev-channel-content">
            <span className="dev-channel-label">Developer Portfolio</span>
            <span className="dev-channel-val">francisnaga.site</span>
          </div>
          <span className="dev-channel-arrow">↗</span>
        </a>

        <a href="https://inkto.jointaccount.org" target="_blank" rel="noopener noreferrer" className="dev-channel">
          <div className="dev-channel-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h10"/>
            </svg>
          </div>
          <div className="dev-channel-content">
            <span className="dev-channel-label">Official Website</span>
            <span className="dev-channel-val">inkto.jointaccount.org</span>
          </div>
          <span className="dev-channel-arrow">↗</span>
        </a>
      </div>
    </div>
  );
}
