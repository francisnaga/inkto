'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-md mx-auto pt-8 pb-16 px-4 text-stone-800 dark:text-stone-200">
      <header className="mb-8">
        <Link href="/app" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Back to App
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-3">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Last Updated: August 2026</p>
      </header>

      <div className="space-y-6 text-xs leading-relaxed">
        <section>
          <h2 className="text-sm font-bold mb-2">1. Compliance with NDPA 2023</h2>
          <p>
            Inkto is committed to protecting personal data in compliance with the Nigeria Data Protection Act (NDPA) 2023. We act as a Data Processor for the documents and files you upload to our service. Our lawful basis for processing is the performance of our contract with you (providing document transcription, template fitting, and drafting services).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">2. Data We Capture and Store</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Account Information:</strong> We store your email address to authenticate you and manage your subscription.</li>
            <li><strong>Uploaded Images & PDFs:</strong> When you scan a document, we upload it to our secure storage bucket in order to perform text extraction.</li>
            <li><strong>Audio Recordings:</strong> Voice dictations are stored temporarily or permanently based on your plan settings to generate transcripts.</li>
            <li><strong>Transcripts & Drafts:</strong> Generated text outputs are stored in our secure database to display in your History tab.</li>
            <li><strong>Payment Information:</strong> All subscription payments are processed securely via Paystack. We do not store or see your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">3. Google Gemini AI Processing</h2>
          <p>
            Inkto uses Google Gemini 2.5 Flash and related models via the Google Cloud API to perform text transcription, document template fitting, and document drafting. 
          </p>
          <p className="mt-2 font-semibold">
            Important: Because Inkto uses Google's professional Developer/API tier, Google explicitly does NOT train its AI models on your input documents, images, voice files, or generated transcripts. Your privileged legal text and client data remain confidential.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">4. Data Retention & Deletion Requests</h2>
          <p>
            Under the NDPA 2023, you have the right to request deletion of all your personal data.
          </p>
          <p className="mt-2">
            You can instantly delete any individual scan, transcript, or audio file from your account using the <strong>"Delete"</strong> button in your History page. This action permanently purges the database record and deletes any associated files from our Supabase storage bucket immediately.
          </p>
          <p className="mt-2">
            To request full account deletion, please email us at <a href="mailto:support@inkto.jointaccount.org" className="underline font-medium text-primary">support@inkto.jointaccount.org</a>. We will process and verify your request, and permanently delete all your data within 48 hours.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold mb-2">5. Data Security</h2>
          <p>
            All data stored in Supabase is encrypted at rest using industry-standard AES-256 encryption. Connections between your browser and our servers/APIs are encrypted in transit using SSL/TLS.
          </p>
        </section>
      </div>
    </div>
  );
}
