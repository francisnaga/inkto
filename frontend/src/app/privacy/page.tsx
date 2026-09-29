'use client';

import React from 'react';
import { InktoLogo } from '@/components/inkto-logo';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'information-we-collect', title: '2. Information We Collect' },
    { id: 'how-we-use', title: '3. How We Use Your Information' },
    { id: 'ai-processing', title: '4. AI Processing & Third-Party' },
    { id: 'data-storage', title: '5. Data Storage & Security' },
    { id: 'data-sharing', title: '6. Data Sharing' },
    { id: 'your-rights', title: '7. Your Rights' },
    { id: 'permissions', title: '8. Permissions We Request' },
    { id: 'children-privacy', title: '9. Children Privacy' },
    { id: 'data-retention', title: '10. Data Retention' },
    { id: 'international-transfers', title: '11. International Transfers' },
    { id: 'changes', title: '12. Changes to This Policy' },
    { id: 'contact-us', title: '13. Contact Us' },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="privacy-container">
      <style>{`
        .privacy-container {
          min-height: 100vh;
          background: #FFFFFF;
          color: #111827;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        .privacy-header {
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
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #111827;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.025em;
        }
        .header-title {
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
        }
        .privacy-main {
          max-width: 1152px;
          margin: 0 auto;
          padding: 64px 20px;
          display: flex;
          gap: 64px;
        }
        .privacy-sidebar {
          width: 256px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .privacy-sidebar { display: none; }
          .privacy-main { padding: 40px 20px; flex-direction: column; gap: 32px; }
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
        .privacy-content {
          max-width: 700px;
          width: 100%;
          line-height: 1.75;
          color: #374151;
        }
        .privacy-content h1 {
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
        .privacy-content section {
          margin-bottom: 56px;
          scroll-margin-top: 100px;
        }
        .privacy-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
          margin-top: 0;
        }
        .privacy-content h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-top: 32px;
          margin-bottom: 12px;
        }
        .privacy-content p {
          margin-bottom: 16px;
        }
        .privacy-content ul {
          list-style-type: disc;
          padding-left: 24px;
          margin-bottom: 16px;
        }
        .privacy-content li {
          margin-bottom: 8px;
        }
        .privacy-content a {
          color: #2563EB;
          text-decoration: none;
        }
        .privacy-content a:hover {
          text-decoration: underline;
        }
        .info-box {
          font-size: 14px;
          color: #4B5563;
          background: #F9FAFB;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #F3F4F6;
          margin-bottom: 16px;
        }
        .table-container {
          overflow-x: auto;
          margin-bottom: 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
        .privacy-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
          font-size: 14px;
        }
        .privacy-table th {
          padding: 12px 16px;
          font-weight: 700;
          color: #111827;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }
        .privacy-table td {
          padding: 12px 16px;
          color: #4B5563;
          border-bottom: 1px solid #F3F4F6;
        }
        .privacy-table th + th, .privacy-table td + td {
          border-left: 1px solid #E5E7EB;
        }
        .privacy-table tr:last-child td {
          border-bottom: none;
        }
        .privacy-footer {
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
      <header className="privacy-header">
        <div className="header-content">
          <Link href="/" className="header-logo">
            <InktoLogo size={24} />
            <span>Inkto</span>
          </Link>
          <div className="header-title">Privacy Policy</div>
        </div>
      </header>

      <div className="privacy-main">
        {/* Sticky Nav (Desktop) */}
        <aside className="privacy-sidebar">
          <div className="sidebar-inner">
            <h3 className="sidebar-title">Contents</h3>
            <nav className="sidebar-nav">
              {sections.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)}>
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="privacy-content">
          <h1>Privacy Policy</h1>
          <div className="last-updated">Last updated: 29 September 2026</div>

          <section id="introduction">
            <h2>1. Introduction</h2>
            <p>Welcome to Inkto ("we", "our", or "us"). Inkto is an AI-powered transcription and document management application designed for legal practitioners. We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data.</p>
            <p>This Privacy Policy applies to the Inkto mobile application (the "App") and any related services. By using Inkto, you agree to the practices described in this policy.</p>
          </section>

          <section id="information-we-collect">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Account Information</h3>
            <p>When you create an Inkto account, we collect:</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (stored in encrypted form — we never see your plaintext password)</li>
              <li>Profile information you optionally provide</li>
            </ul>

            <h3>2.2 Audio Recordings</h3>
            <p>When you use the dictation or audio upload features, we collect:</p>
            <ul>
              <li>Audio files you record or upload within the App</li>
              <li>Metadata about those recordings (duration, file size, date/time)</li>
            </ul>
            <div className="info-box">Audio files are temporarily processed to generate transcriptions and are not used to train AI models. You may delete your audio files at any time.</div>

            <h3>2.3 Documents and Images</h3>
            <p>When you scan documents or upload images, we collect:</p>
            <ul>
              <li>Images captured via your device camera</li>
              <li>PDF files or images you upload from your device</li>
              <li>Page-by-page image representations of your documents</li>
            </ul>

            <h3>2.4 Transcription Content</h3>
            <p>We store the text transcriptions generated from your audio and documents. This content is associated with your account and accessible only by you.</p>

            <h3>2.5 Usage Data</h3>
            <p>We automatically collect limited technical data to operate and improve the App:</p>
            <ul>
              <li>Device type and operating system version</li>
              <li>App version</li>
              <li>Feature usage patterns (e.g., which transcription type was used)</li>
              <li>Error logs and crash reports</li>
            </ul>
            <div className="info-box">We do not collect advertising identifiers or sell your data to advertisers.</div>

            <h3>2.6 Payment Information</h3>
            <p>If you purchase Inkto Credits, payment is processed by our payment provider (Paystack). We do not store your card number or banking details. We only receive a confirmation of payment success and the credit amount to add to your account.</p>
          </section>

          <section id="how-we-use">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            
            <div className="table-container">
              <table className="privacy-table">
                <thead>
                  <tr>
                    <th>Purpose</th>
                    <th>Data Used</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Provide AI transcription of your audio and documents</td>
                    <td>Audio files, document images</td>
                  </tr>
                  <tr>
                    <td>Store and display your transcriptions</td>
                    <td>Transcription text, document data</td>
                  </tr>
                  <tr>
                    <td>Manage your account and credits balance</td>
                    <td>Account information, payment confirmations</td>
                  </tr>
                  <tr>
                    <td>Send you notifications about completed transcriptions</td>
                    <td>Email address, device push tokens</td>
                  </tr>
                  <tr>
                    <td>Diagnose technical errors and improve the App</td>
                    <td>Error logs, usage patterns</td>
                  </tr>
                  <tr>
                    <td>Comply with legal obligations</td>
                    <td>Account data, usage records</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="info-box" style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E40AF' }}>
              We do not use your legal documents or audio recordings for advertising purposes.
            </div>
          </section>

          <section id="ai-processing">
            <h2>4. AI Processing and Third-Party Services</h2>
            <p>Inkto uses Google Gemini AI to process and transcribe your content. When you initiate a transcription:</p>
            <ul>
              <li>Your audio or document images are securely transmitted to Google's AI infrastructure</li>
              <li>Google processes the content solely to generate the transcription text</li>
              <li><strong>Google's use of this data is governed by Google's Privacy Policy and their API usage terms, which prohibit using your content to train their models</strong></li>
            </ul>
            <p>Your files are stored on Cloudflare R2 (cloud object storage). We use Firebase Authentication (Google) for secure login.</p>
          </section>

          <section id="data-storage">
            <h2>5. Data Storage and Security</h2>
            <ul>
              <li>All data is encrypted in transit using TLS (HTTPS)</li>
              <li>Files stored in cloud storage are encrypted at rest</li>
              <li>Access to your data is protected by authenticated sessions</li>
              <li>Only you can access your documents and transcriptions</li>
              <li>You may delete your account and all associated data at any time from within the App</li>
            </ul>
          </section>

          <section id="data-sharing">
            <h2>6. Data Sharing</h2>
            <p>We do not sell, rent, or trade your personal information. We share data only in these limited circumstances:</p>
            <ul>
              <li><strong>AI service providers (Google Gemini):</strong> to perform transcription</li>
              <li><strong>Cloud infrastructure (Cloudflare):</strong> to store your files securely</li>
              <li><strong>Payment processor (Paystack):</strong> to process credit purchases</li>
              <li><strong>Legal requirement:</strong> if required by law, court order, or governmental authority</li>
              <li><strong>Business transfer:</strong> if Inkto is acquired, your data may transfer with equivalent protections</li>
            </ul>
          </section>

          <section id="your-rights">
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all data at any time in App settings</li>
              <li>Export your transcriptions in PDF, DOCX, or TXT format</li>
              <li>Withdraw consent by stopping use and requesting deletion</li>
            </ul>
            <p>Contact: <a href="mailto:privacy@inkto.app">privacy@inkto.app</a></p>
          </section>

          <section id="permissions">
            <h2>8. Permissions We Request</h2>
            <div className="table-container">
              <table className="privacy-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Why We Need It</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Microphone</strong></td>
                    <td>To record audio for dictation</td>
                  </tr>
                  <tr>
                    <td><strong>Camera</strong></td>
                    <td>To scan physical documents</td>
                  </tr>
                  <tr>
                    <td><strong>Storage / Files</strong></td>
                    <td>To import documents or audio from your device</td>
                  </tr>
                  <tr>
                    <td><strong>Notifications</strong></td>
                    <td>To alert you when a transcription is complete</td>
                  </tr>
                  <tr>
                    <td><strong>Internet</strong></td>
                    <td>To upload files and fetch transcriptions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="children-privacy">
            <h2>9. Children's Privacy</h2>
            <p>Inkto is designed for professional legal use and is not intended for persons under 18. We do not knowingly collect data from children.</p>
          </section>

          <section id="data-retention">
            <h2>10. Data Retention</h2>
            <ul>
              <li><strong>Transcription data:</strong> retained until you delete it or close your account</li>
              <li><strong>Audio and document files:</strong> retained until deleted or account closed</li>
              <li><strong>Account information:</strong> deleted 30 days after account closure</li>
              <li><strong>Error logs:</strong> automatically deleted after 90 days</li>
            </ul>
          </section>

          <section id="international-transfers">
            <h2>11. International Data Transfers</h2>
            <p>Your data may be processed outside Nigeria, including the United States and the EU, where our service providers operate. We ensure appropriate safeguards are in place for international transfers.</p>
          </section>

          <section id="changes">
            <h2>12. Changes to This Policy</h2>
            <p>We will notify you of material changes via email or in-app notification and update the date at the top of this page.</p>
          </section>

          <section id="contact-us">
            <h2>13. Contact Us</h2>
            <p>Inkto Email: <a href="mailto:privacy@inkto.app">privacy@inkto.app</a></p>
            <p>Support: <a href="mailto:support@inkto.app">support@inkto.app</a></p>
            <p style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #F3F4F6', fontSize: '14px', color: '#6B7280' }}>
              This Privacy Policy complies with the Nigeria Data Protection Regulation (NDPR) and, where applicable, the EU General Data Protection Regulation (GDPR).
            </p>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="privacy-footer">
        <div className="footer-links">
          <a href="mailto:privacy@inkto.app">privacy@inkto.app</a>
          <span className="footer-dot"></span>
          <a href="mailto:support@inkto.app">support@inkto.app</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Inkto. All rights reserved.</p>
      </footer>
    </div>
  );
}
