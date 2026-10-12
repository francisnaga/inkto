'use client';

import React, { useState, useEffect } from 'react';
import { InktoLogo } from '@/components/inkto-logo';
import Link from 'next/link';
import { DeveloperCard } from '@/components/developer-card';
import { PolicyNav, MobileHeaderTocButton } from '@/components/policy-nav';

export default function AccuracyPolicyPage() {
  const sections = [
    { id: 'important-notice', title: '1. Important Notice: Inkto Can Make Mistakes' },
    { id: 'due-diligence', title: '2. Professional Due Diligence & Verification' },
    { id: 'quality-factors', title: '3. Factors Influencing Transcription Quality' },
    { id: 'limitation-liability', title: '4. Limitation of Liability' },
    { id: 'contact-support', title: '5. Contact, Support & Developer Credits' },
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
          font-family: var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
        }
        .policy-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
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
          width: 280px;
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
          padding: 0;
          cursor: pointer;
          transition: color 0.15s ease;
          line-height: 1.4;
        }
        .sidebar-nav button:hover {
          color: #2563EB;
        }
        .policy-content {
          flex: 1;
          max-width: 720px;
        }
        .policy-content h1 {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #111827;
          margin: 0 0 12px 0;
          line-height: 1.15;
        }
        .last-updated {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 32px;
        }
        .info-box-warning {
          background: #FFFBEB;
          border-left: 3px solid #D97706;
          color: #92400E;
          padding: 14px 18px;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 36px;
          font-weight: 500;
        }
        .info-box-blue {
          background: #F9FAFB;
          border-left: 3px solid #2563EB;
          color: #374151;
          padding: 14px 18px;
          font-size: 14px;
          line-height: 1.6;
          margin: 24px 0;
        }
        .policy-content section {
          margin-bottom: 48px;
        }
        .policy-content h2 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
        }
        .policy-content h3 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 20px 0 8px 0;
        }
        .policy-content p {
          font-size: 15px;
          line-height: 1.7;
          color: #4B5563;
          margin: 0 0 16px 0;
        }
        .policy-content ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
          color: #4B5563;
          font-size: 15px;
          line-height: 1.7;
        }
        .policy-content li {
          margin-bottom: 10px;
        }
        .policy-content a {
          color: #2563EB;
          text-decoration: underline;
        }
        .policy-content a:hover {
          color: #1D4ED8;
        }
        .verification-item {
          margin-bottom: 18px;
          padding-left: 14px;
          border-left: 2px solid #E5E7EB;
        }
        .verification-item h3 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }
        .verification-item p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #4B5563;
        }
        .policy-footer {
          border-top: 1px solid #F3F4F6;
          padding: 40px 20px;
          text-align: center;
          font-size: 13px;
          color: #9CA3AF;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .footer-links a {
          color: #6B7280;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-links a:hover {
          color: #2563EB;
        }
        .footer-dot {
          width: 3px;
          height: 3px;
          background: #D1D5DB;
          border-radius: 50%;
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
            <div className="header-title">AI Accuracy Policy</div>
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
          <h1>AI Accuracy, Verification & Limitations Policy</h1>
          <div className="last-updated">
            Last Updated: October 2026 &middot; Inkto Technologies (<a href="https://inkto.jointaccount.org/accuracy.html">inkto.jointaccount.org/accuracy.html</a>)
          </div>

          <div className="info-box-warning">
            ⚠ CRITICAL NOTICE: Inkto is a document productivity and transcription platform. Artificial intelligence models are probabilistic and can occasionally misread, misinterpret, or omit words. All transcriptions must be verified by a human prior to official, legal, commercial, or judicial use.
          </div>

          <section id="important-notice">
            <h2>1. Important Notice: Inkto Can Make Mistakes</h2>
            <p>
              Inkto utilizes advanced artificial intelligence and specialized vision-language machine learning models to transcribe handwritten notes, printed legal documents, and audio recordings.
            </p>
            <p>
              While Inkto is trained and specialized to achieve state-of-the-art accuracy across complex handwriting styles, Nigerian legal conventions, court records, and multi-speaker audio recordings, artificial intelligence models are probabilistic and can occasionally misread, misinterpret, or omit words.
            </p>
          </section>

          <section id="due-diligence">
            <h2>2. Professional Due Diligence & Document Verification</h2>
            <p>
              All transcripts and converted documents generated by Inkto must be reviewed and verified by a human prior to official, legal, commercial, or judicial use.
            </p>
            <p>Specifically, practitioners must verify:</p>

            <div className="verification-item">
              <h3>Court Pleadings &amp; Affidavits</h3>
              <p>
                Confirm suit numbers, parties&apos; names, dates, case citations (such as NWLR volumes and page numbers), and sworn numbered paragraphs against the physical exhibit or case file before filing.
              </p>
            </div>

            <div className="verification-item">
              <h3>Contracts, Deeds &amp; Financial Agreements</h3>
              <p>
                Verify figures, monetary sums, survey coordinates, property descriptions, boundary beacons, and covenant terms.
              </p>
            </div>

            <div className="verification-item">
              <h3>Audio Recordings &amp; Court Proceedings</h3>
              <p>
                Cross-check speaker assignments (Judge, Counsel, Witness, Speaker 1, Speaker 2) and inaudible segments (<code>[inaudible]</code>) against original court records or personal contemporaneous bench notes.
              </p>
            </div>

            <div className="info-box-blue">
              <strong>Split-Screen Verification:</strong> Inkto provides split-screen and side-by-side verification tools (&quot;Original&quot; vs. &quot;Transcription&quot;) within the editor to facilitate rapid, painless proofreading and visual alignment.
            </div>
          </section>

          <section id="quality-factors">
            <h2>3. Factors Influencing Transcription Quality</h2>
            <p>
              To maximize transcription fidelity, please observe the following recommended best practices:
            </p>

            <h3>Document Scans & Handwriting</h3>
            <ul>
              <li><strong>Lighting:</strong> Ensure adequate, even lighting without heavy shadows or glare across the text.</li>
              <li><strong>Alignment:</strong> Flatten pages to avoid optical distortion or curve along binding margins.</li>
              <li><strong>Resolution:</strong> Avoid extreme low-resolution crops or blurry camera capture.</li>
            </ul>

            <h3>Audio Recordings</h3>
            <ul>
              <li><strong>Proximity:</strong> Position recording hardware as close to the speaking parties as possible.</li>
              <li><strong>Noise Reduction:</strong> Minimize severe background ambient noise (such as generator hum, street traffic, or heavy room cross-talk).</li>
              <li><strong>Acoustic Line of Sight:</strong> In courtroom or chamber settings, ensure clear acoustic line-of-sight between the microphone, bench, and bar.</li>
            </ul>
          </section>

          <section id="limitation-liability">
            <h2>4. Limitation of Liability</h2>
            <p>
              Inkto is a technological document transcription and productivity platform. Inkto does not provide legal advice, representation, or formal court reporting certifications.
            </p>
            <p>
              Users retain full responsibility for verifying the accuracy of any text, pleading, letter, contract, or document produced using the platform before submitting, signing, or relying upon it in any legal, judicial, or commercial proceeding or transaction.
            </p>
          </section>

          <section id="contact-support">
            <h2>5. Contact & Support</h2>
            <p>
              If you encounter persistent transcription difficulties or have questions regarding our data processing and accuracy standards, please contact our engineering and developer lead:
            </p>
            <DeveloperCard />
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="policy-footer">
        <div className="footer-links">
          <Link href="/terms.html">Terms of Service</Link>
          <span className="footer-dot"></span>
          <Link href="/privacy.html">Privacy Policy</Link>
          <span className="footer-dot"></span>
          <a href="mailto:hello@francisnaga.site">hello@francisnaga.site</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Inkto &middot; Developed by Francis Naga. All rights reserved.</p>
      </footer>
    </div>
  );
}
