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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 decoration-transparent hover:opacity-80 transition-opacity">
            <InktoLogo size={24} />
            <span className="font-bold text-lg tracking-tight">Inkto</span>
          </Link>
          <div className="text-sm font-medium text-gray-500">Privacy Policy</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row gap-12">
        {/* Sticky Nav (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-32">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Contents</h3>
            <nav className="flex flex-col gap-3">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="max-w-[700px] w-full mx-auto md:mx-0 prose prose-gray prose-p:leading-[1.7] prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:text-blue-800">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: 29 September 2026</p>

          <section id="introduction" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-4">Welcome to Inkto ("we", "our", or "us"). Inkto is an AI-powered transcription and document management application designed for legal practitioners. We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data.</p>
            <p>This Privacy Policy applies to the Inkto mobile application (the "App") and any related services. By using Inkto, you agree to the practices described in this policy.</p>
          </section>

          <section id="information-we-collect" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-bold mt-6 mb-2">2.1 Account Information</h3>
            <p className="mb-2">When you create an Inkto account, we collect:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (stored in encrypted form — we never see your plaintext password)</li>
              <li>Profile information you optionally provide</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-2">2.2 Audio Recordings</h3>
            <p className="mb-2">When you use the dictation or audio upload features, we collect:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Audio files you record or upload within the App</li>
              <li>Metadata about those recordings (duration, file size, date/time)</li>
            </ul>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">Audio files are temporarily processed to generate transcriptions and are not used to train AI models. You may delete your audio files at any time.</p>

            <h3 className="text-lg font-bold mt-6 mb-2">2.3 Documents and Images</h3>
            <p className="mb-2">When you scan documents or upload images, we collect:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Images captured via your device camera</li>
              <li>PDF files or images you upload from your device</li>
              <li>Page-by-page image representations of your documents</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-2">2.4 Transcription Content</h3>
            <p className="mb-4">We store the text transcriptions generated from your audio and documents. This content is associated with your account and accessible only by you.</p>

            <h3 className="text-lg font-bold mt-6 mb-2">2.5 Usage Data</h3>
            <p className="mb-2">We automatically collect limited technical data to operate and improve the App:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Device type and operating system version</li>
              <li>App version</li>
              <li>Feature usage patterns (e.g., which transcription type was used)</li>
              <li>Error logs and crash reports</li>
            </ul>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">We do not collect advertising identifiers or sell your data to advertisers.</p>

            <h3 className="text-lg font-bold mt-6 mb-2">2.6 Payment Information</h3>
            <p>If you purchase Inkto Credits, payment is processed by our payment provider (Paystack). We do not store your card number or banking details. We only receive a confirmation of payment success and the credit amount to add to your account.</p>
          </section>

          <section id="how-we-use" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            
            <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50">Purpose</th>
                    <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50 border-l border-gray-200">Data Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4">Provide AI transcription of your audio and documents</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Audio files, document images</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Store and display your transcriptions</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Transcription text, document data</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Manage your account and credits balance</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Account information, payment confirmations</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Send you notifications about completed transcriptions</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Email address, device push tokens</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Diagnose technical errors and improve the App</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Error logs, usage patterns</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Comply with legal obligations</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">Account data, usage records</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm font-medium text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100">We do not use your legal documents or audio recordings for advertising purposes.</p>
          </section>

          <section id="ai-processing" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">4. AI Processing and Third-Party Services</h2>
            <p className="mb-2">Inkto uses Google Gemini AI to process and transcribe your content. When you initiate a transcription:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Your audio or document images are securely transmitted to Google's AI infrastructure</li>
              <li>Google processes the content solely to generate the transcription text</li>
              <li><strong>Google's use of this data is governed by Google's Privacy Policy and their API usage terms, which prohibit using your content to train their models</strong></li>
            </ul>
            <p>Your files are stored on Cloudflare R2 (cloud object storage). We use Firebase Authentication (Google) for secure login.</p>
          </section>

          <section id="data-storage" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">5. Data Storage and Security</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>All data is encrypted in transit using TLS (HTTPS)</li>
              <li>Files stored in cloud storage are encrypted at rest</li>
              <li>Access to your data is protected by authenticated sessions</li>
              <li>Only you can access your documents and transcriptions</li>
              <li>You may delete your account and all associated data at any time from within the App</li>
            </ul>
          </section>

          <section id="data-sharing" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">6. Data Sharing</h2>
            <p className="mb-2">We do not sell, rent, or trade your personal information. We share data only in these limited circumstances:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>AI service providers (Google Gemini):</strong> to perform transcription</li>
              <li><strong>Cloud infrastructure (Cloudflare):</strong> to store your files securely</li>
              <li><strong>Payment processor (Paystack):</strong> to process credit purchases</li>
              <li><strong>Legal requirement:</strong> if required by law, court order, or governmental authority</li>
              <li><strong>Business transfer:</strong> if Inkto is acquired, your data may transfer with equivalent protections</li>
            </ul>
          </section>

          <section id="your-rights" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all data at any time in App settings</li>
              <li>Export your transcriptions in PDF, DOCX, or TXT format</li>
              <li>Withdraw consent by stopping use and requesting deletion</li>
            </ul>
            <p>Contact: <a href="mailto:privacy@inkto.app">privacy@inkto.app</a></p>
          </section>

          <section id="permissions" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">8. Permissions We Request</h2>
            <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50">Permission</th>
                    <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50 border-l border-gray-200">Why We Need It</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4 font-medium">Microphone</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">To record audio for dictation</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Camera</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">To scan physical documents</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Storage / Files</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">To import documents or audio from your device</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Notifications</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">To alert you when a transcription is complete</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Internet</td>
                    <td className="py-3 px-4 text-gray-600 border-l border-gray-200">To upload files and fetch transcriptions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="children-privacy" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
            <p>Inkto is designed for professional legal use and is not intended for persons under 18. We do not knowingly collect data from children.</p>
          </section>

          <section id="data-retention" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">10. Data Retention</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Transcription data:</strong> retained until you delete it or close your account</li>
              <li><strong>Audio and document files:</strong> retained until deleted or account closed</li>
              <li><strong>Account information:</strong> deleted 30 days after account closure</li>
              <li><strong>Error logs:</strong> automatically deleted after 90 days</li>
            </ul>
          </section>

          <section id="international-transfers" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
            <p>Your data may be processed outside Nigeria, including the United States and the EU, where our service providers operate. We ensure appropriate safeguards are in place for international transfers.</p>
          </section>

          <section id="changes" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">12. Changes to This Policy</h2>
            <p>We will notify you of material changes via email or in-app notification and update the date at the top of this page.</p>
          </section>

          <section id="contact-us" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
            <p className="mb-2">Inkto Email: <a href="mailto:privacy@inkto.app">privacy@inkto.app</a></p>
            <p className="mb-4">Support: <a href="mailto:support@inkto.app">support@inkto.app</a></p>
            <p className="text-sm text-gray-500 mt-8 pt-8 border-t border-gray-100">
              This Privacy Policy complies with the Nigeria Data Protection Regulation (NDPR) and, where applicable, the EU General Data Protection Regulation (GDPR).
            </p>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12 text-center text-sm text-gray-500 mt-12">
        <div className="flex justify-center items-center gap-6 mb-4">
          <a href="mailto:privacy@inkto.app" className="hover:text-gray-900 transition-colors">privacy@inkto.app</a>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <a href="mailto:support@inkto.app" className="hover:text-gray-900 transition-colors">support@inkto.app</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Inkto. All rights reserved.</p>
      </footer>
    </div>
  );
}
