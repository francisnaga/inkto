'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-md mx-auto pt-8 pb-16 px-4 text-stone-800 dark:text-stone-200">
      <header className="mb-8">
        <Link href="/app" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Back to App
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-3">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mt-1">Last Updated: August 2026</p>
      </header>

      <div className="space-y-6 text-xs leading-relaxed">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
          ⚠ GENERAL DISCLAIMER: Inkto is a document productivity tool, not a law firm, and does not provide legal advice or representation.
        </div>

        <section>
          <h2 className="text-sm font-bold mb-2">1. Acceptable Use & AI Disclaimer</h2>
          <p>
            Inkto provides AI-powered document scanning, handwriting-to-text transcription, template fitting, and drafting. Because artificial intelligence can make errors or produce inaccurate citations, you agree that you are solely responsible for reviewing, correcting, and verifying all text outputs before using them in any legal context or filing.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">2. Subscriptions & Payments</h2>
          <p>
            Paid features (such as voice dictation and unlimited text conversions) require a monthly or annual subscription. Billing is processed securely via Paystack.
          </p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li><strong>Billing Cycle:</strong> Subscriptions are billed in advance on a recurring basis and renew automatically unless canceled.</li>
            <li><strong>Cancellation:</strong> You can cancel your subscription at any time from your Account screen. Your access to paid features will continue until the end of the current billing period.</li>
            <li><strong>Refunds:</strong> All payments are non-refundable except as required by applicable consumer protection laws in Nigeria.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">3. User Accounts</h2>
          <p>
            Accounts are created and authenticated using a One-Time Password (OTP) sent to your email address. You are responsible for maintaining the security of your account and the device used to access it.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">4. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Inkto and its operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of, or inability to use, our service, including but not limited to any legal errors, missed deadlines, or formatting anomalies in transcribed or generated legal documents.
          </p>
        </section>
      </div>
    </div>
  );
}
