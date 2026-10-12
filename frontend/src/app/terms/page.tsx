'use client';

import React, { useState, useEffect } from 'react';
import { InktoLogo } from '@/components/inkto-logo';
import Link from 'next/link';
import { DeveloperCard } from '@/components/developer-card';
import { PolicyNav, MobileHeaderTocButton } from '@/components/policy-nav';

export default function TermsPage() {
  const sections = [
    { id: 'acceptable-use', title: '1. Acceptable Use & AI Disclaimer' },
    { id: 'credits-payments', title: '2. Credits & Payments' },
    { id: 'user-accounts', title: '3. User Accounts' },
    { id: 'limitation-liability', title: '4. Limitation of Liability' },
    { id: 'contact', title: '5. Contact & Developer Credits' },
  ];

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
    }
  };

  return (
    <div className="policy-container">
      <style>{`
        .policy-container {
          min-height: 100vh;
          background: #FFFFFF;
          color: #111827;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        .policy-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #F3F4F6;
        }
        .header-content {
          max-width: 1152px;
          margin: 0 auto;
          padding: 0 20px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .header-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-shrink: 1;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #111827;
          font-weight: 700;
          font-size: 17px;
          letter-spacing: -0.025em;
          flex-shrink: 0;
        }
        .header-divider {
          width: 1px;
          height: 18px;
          background: #E5E7EB;
          flex-shrink: 0;
        }
        .header-title {
          font-size: 14px;
          font-weight: 500;
          color: #4B5563;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 640px) {
          .header-content {
            padding: 0 16px;
            gap: 16px;
          }
          .header-brand-group {
            gap: 8px;
          }
          .header-logo {
            font-size: 16px;
            gap: 8px;
          }
          .header-divider {
            height: 15px;
          }
          .header-title {
            font-size: 13px;
          }
        }
        @media (max-width: 440px) {
          .header-content {
            padding: 0 12px;
            gap: 12px;
          }
          .header-title {
            font-size: 12px;
          }
        }
        .policy-main {
          max-width: 1152px;
          margin: 0 auto;
          padding: 64px 20px;
          display: flex;
          gap: 64px;
        }
        .policy-sidebar {
          width: 256px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .policy-sidebar { display: none; }
          .policy-main { padding: 40px 20px; flex-direction: column; gap: 32px; }
        }
        .sidebar-inner {
          position: sticky;
          top: 120px;
        }
        .sidebar-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9CA3AF;
          margin-bottom: 16px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-nav button {
          text-align: left;
          font-size: 14px;
          color: #4B5563;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s;
        }
        .sidebar-nav button:hover {
          color: #2563EB;
        }
        .policy-content {
          max-width: 700px;
          width: 100%;
          line-height: 1.75;
          color: #374151;
        }
        .policy-content h1 {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #111827;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .last-updated {
          color: #6B7280;
          font-size: 14px;
          margin-bottom: 48px;
        }
        .policy-content section {
          margin-bottom: 56px;
          scroll-margin-top: 100px;
        }
        .policy-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
          margin-top: 0;
        }
        .policy-content p {
          margin-bottom: 16px;
        }
        .policy-content ul {
          list-style-type: disc;
          padding-left: 24px;
          margin-bottom: 16px;
        }
        .policy-content li {
          margin-bottom: 8px;
        }
        .policy-content a {
          color: #2563EB;
          text-decoration: none;
        }
        .policy-content a:hover {
          text-decoration: underline;
        }
        .info-box-warning {
          font-size: 14px;
          color: #92400E;
          background: #FFFBEB;
          padding: 14px 18px;
          border-left: 3px solid #D97706;
          margin-bottom: 32px;
          font-weight: 500;
          line-height: 1.6;
        }
        .policy-footer {
          border-top: 1px solid #F3F4F6;
          background: #F9FAFB;
          padding: 48px 20px;
          text-align: center;
          font-size: 14px;
          color: #6B7280;
          margin-top: 48px;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-bottom: 16px;
        }
        .footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #D1D5DB;
        }
      `}</style>

      {/* Header */}
      <header className="policy-header">
        <div className="header-content">
          <div className="header-brand-group">
            <Link href="/" className="header-logo">
              <InktoLogo size={22} />
              <span>Inkto</span>
            </Link>
            <div className="header-divider"></div>
            <div className="header-title">Terms of Service</div>
          </div>
          <MobileHeaderTocButton 
            count={sections.length} 
            onClick={() => setMobileNavOpen(true)} 
          />
        </div>
      </header>

      <div className="policy-main">
        {/* Tree Branch Navigation (Desktop & Mobile Drawer) */}
        <PolicyNav 
          sections={sections}
          activeSection={activeSection}
          onSelectSection={scrollTo}
          mobileOpen={mobileNavOpen}
          setMobileOpen={setMobileNavOpen}
        />

        {/* Content */}
        <main className="policy-content">
          <h1>Terms of Service</h1>
          <div className="last-updated">Last Updated: August 2026</div>

          <div className="info-box-warning">
            ⚠ GENERAL DISCLAIMER: Inkto is a document productivity tool, not a law firm, and does not provide legal advice or representation.
          </div>

          <section id="acceptable-use">
            <h2>1. Acceptable Use & AI Disclaimer</h2>
            <p>
              Inkto provides AI-powered document scanning, handwriting-to-text transcription, template fitting, and drafting. Because artificial intelligence can make errors or produce inaccurate citations, you agree that you are solely responsible for reviewing, correcting, and verifying all text outputs before using them in any legal context or filing.
            </p>
          </section>

          <section id="credits-payments">
            <h2>2. Credits & Payments</h2>
            <p>
              Paid features (such as generating transcriptions from large audio files or lengthy documents) require Inkto Credits. You can purchase credits as needed. Billing is processed securely via Google Play.
            </p>
            <ul>
              <li><strong>Purchasing Credits:</strong> Credits are purchased on a pay-as-you-go basis. They are added to your account balance immediately upon successful payment.</li>
              <li><strong>Usage:</strong> Credits are deducted from your balance based on the volume or length of the transcription requested.</li>
              <li><strong>Refunds:</strong> All credit purchases are non-refundable except as required by applicable consumer protection laws in Nigeria.</li>
            </ul>
          </section>

          <section id="user-accounts">
            <h2>3. User Accounts</h2>
            <p>
              Accounts are created and authenticated using either Google Sign-In or a One-Time Password (OTP) sent to your email address. You are responsible for maintaining the security of your account and the device used to access it.
            </p>
          </section>

          <section id="limitation-liability">
            <h2>4. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Inkto and its operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of, or inability to use, our service, including but not limited to any legal errors, missed deadlines, or formatting anomalies in transcribed or generated legal documents.
            </p>
          </section>

          <section id="contact">
            <h2>5. Contact & Developer Credits</h2>
            <p>
              For legal inquiries, support requests, or terms clarifications, please reach out to our engineering lead:
            </p>
            <DeveloperCard />
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="policy-footer">
        <div className="footer-links">
          <Link href="/privacy.html">Privacy Policy</Link>
          <span className="footer-dot"></span>
          <Link href="/accuracy.html">AI Accuracy Policy</Link>
          <span className="footer-dot"></span>
          <a href="mailto:hello@francisnaga.site">hello@francisnaga.site</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Inkto &middot; Developed by Francis Naga. All rights reserved.</p>
      </footer>
    </div>
  );
}
