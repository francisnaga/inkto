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
    <div className="dev-contact-block">
      <style>{`
        .dev-contact-block {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .dev-contact-header {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        .dev-contact-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.01em;
        }
        .dev-contact-role {
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }
        .dev-contact-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dev-contact-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          font-size: 14px;
          line-height: 1.5;
        }
        .dev-contact-label {
          width: 180px;
          flex-shrink: 0;
          color: #6B7280;
          font-size: 13px;
          font-weight: 500;
        }
        .dev-contact-value {
          color: #111827;
          font-weight: 500;
          word-break: break-all;
        }
        .dev-contact-value a {
          color: #2563EB;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .dev-contact-value a:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .dev-contact-block {
            padding: 16px;
          }
          .dev-contact-row {
            flex-direction: column;
            gap: 2px;
          }
          .dev-contact-label {
            width: auto;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="dev-contact-header">
        <span className="dev-contact-name">{title}</span>
        <span className="dev-contact-role">{subtitle}</span>
      </div>

      <div className="dev-contact-list">
        <div className="dev-contact-row">
          <span className="dev-contact-label">Direct Contact &amp; Support:</span>
          <span className="dev-contact-value">
            <a href="mailto:hello@francisnaga.site">hello@francisnaga.site</a>
          </span>
        </div>

        <div className="dev-contact-row">
          <span className="dev-contact-label">Developer Portfolio:</span>
          <span className="dev-contact-value">
            <a href="https://francisnaga.site" target="_blank" rel="noopener noreferrer">
              francisnaga.site ↗
            </a>
          </span>
        </div>

        <div className="dev-contact-row">
          <span className="dev-contact-label">Official Platform:</span>
          <span className="dev-contact-value">
            <a href="https://inkto.jointaccount.org" target="_blank" rel="noopener noreferrer">
              inkto.jointaccount.org ↗
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

