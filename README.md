<div align="center">

<svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 50 L36 28 L54 38 L54 62 L36 72 Z" fill="#2563EB"/>
  <circle cx="30" cy="50" r="3.5" fill="white"/>
  <line x1="16" y1="50" x2="36" y2="50" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="36" y1="28" x2="36" y2="72" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <rect x="57" y="30" width="28" height="7" rx="3.5" fill="#2563EB"/>
  <rect x="57" y="46.5" width="26" height="7" rx="3.5" fill="#2563EB"/>
  <rect x="57" y="63" width="20" height="7" rx="3.5" fill="#2563EB"/>
</svg>

# Inkto

**AI-powered handwriting transcription — upload a photo, get clean text or a `.docx` back.**  
Built specifically for Nigerian legal documents: affidavits, court filings, case notes.

<br/>

[![Live App](https://img.shields.io/badge/Live%20App-Inkto-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://efobifrancis.vercel.app)
[![Built with React](https://img.shields.io/badge/React-Vite%20PWA-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev)
[![Claude Vision](https://img.shields.io/badge/AI-Claude%20Vision-2563EB?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Accuracy](https://img.shields.io/badge/Accuracy-96%25-22c55e?style=for-the-badge)](#)

</div>

-----

## The Problem

A lawyer’s handwritten notes travel a slow road — scrawled on paper, photographed on a phone, WhatsApp’d to someone who types it up manually, then sent back. If the secretary is unavailable, the document waits.

**Inkto cuts that loop entirely.**

Upload a photo. Get back clean, formatted text — or a ready-to-edit `.docx` — in seconds.

-----

## How It Works

```
📷 Upload photo / PDF          →   Client-side compression (Canvas API)
📄 PDF pages                   →   Converted to images via pdfjs-dist
🧠 Claude Vision (primary)     →   Transcription with legal document tuning
🤖 Gemini (fallback)           →   Redundancy layer if primary fails
✉️  Send to email               →   Delivered as plain text or .docx
```

**Legal-specific tuning:**

- Omits crossed-out text automatically
- Includes caret-inserted (`^`) additions
- Flags illegible words as `[?]` for human review
- Structured around Nigerian court document formatting

-----

## Features

|Feature              |Detail                           |
|---------------------|---------------------------------|
|📸 Photo or PDF upload|Drag-and-drop or camera capture  |
|🧠 AI transcription   |Claude Vision + Gemini fallback  |
|📄 Export formats     |Plain text or formatted `.docx`  |
|✉️ Email delivery     |Sent directly to your inbox      |
|🕓 Document history   |Tied to email — no login required|
|📱 PWA                |Installable, works offline       |
|⚡ No account needed  |Open link, upload, done          |

-----

## Tech Stack

```
Frontend     React + Vite (PWA)
Backend      Node.js serverless functions on Vercel
AI Primary   Claude Vision API (Anthropic)
AI Fallback  Gemini
PDF Parsing  pdfjs-dist
Compression  Canvas API (client-side, before upload)
Export       docx generation (server-side)
```

-----

## Why No Login?

Inkto was built for a specific user: a lawyer who needed to upload a document and get the text back — no friction, no account, no app to install. Open a link. Upload. Done.

History is scoped to an email address (via magic link) — documents only appear in history if an email was captured during the session. Anonymous one-off sessions stay anonymous.

-----

## Accuracy

**96%** on handwritten Nigerian legal documents tested across affidavits, court forms, and case notes. Illegible sections are flagged `[?]` rather than guessed.

-----

## Local Development

```bash
git clone https://github.com/francisnaga/Legal-Text-Ai-Transcriber
cd inkto
npm install
npm run dev
```

Add your environment variables:

```env
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

-----

## Built By

<div align="center">

Full-stack developer · Marine Engineering student · Nigerian Maritime University

[![GitHub](https://img.shields.io/badge/GitHub-francisnaga-181717?style=flat-square&logo=github)](https://github.com/francisnaga)
[![Portfolio](https://img.shields.io/badge/Portfolio-efobifrancis.vercel.app-2563EB?style=flat-square&logo=vercel)](https://efobifrancis.vercel.app)

*Solves a real problem.*

</div>
