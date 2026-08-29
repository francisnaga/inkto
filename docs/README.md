<div align="center">

# Inkto

**Turn handwritten documents, scans, and voice dictation into clean, editable Word documents.**

Built for Nigerian legal practitioners.

</div>

-----

## Overview

Inkto helps lawyers turn the work they already handwrite, scan, and
dictate into usable digital documents. Point a phone at a document or
record your voice, and Inkto returns a properly formatted, editable
Word file — with a template library and searchable document history
built around how Nigerian legal practice actually works.

## Features

- **Scan** — Document capture powered by Google ML Kit’s Document
  Scanner: automatic edge detection, perspective correction, and
  multi-page support.
- **Transcribe** — Convert handwritten or typed documents into
  structured, editable Word documents. Every result includes a
  side-by-side comparison against the original for verification.
- **Dictate** — Record or upload audio and get a formatted transcript.
  Automatic punctuation and paragraph detection are tuned for Nigerian
  legal dictation conventions — numbered affidavit paragraphs, motions,
  pleadings, and correspondence.
- **Templates** — A shared library of standard legal document
  templates. Use any template blank at no cost, or auto-fill it from
  your own content with AI.
- **Document Library** — Every scan, transcript, and recording is
  saved to a searchable, filterable history.

## Tech Stack

|Layer             |Technology                                                |
|------------------|----------------------------------------------------------|
|Frontend          |Next.js                                                   |
|Mobile            |Capacitor (Android), with Google ML Kit as a native plugin|
|Backend / Database|Supabase (Postgres + Supabase Auth)                       |
|Hosting           |Vercel                                                    |
|Email             |Resend                                                    |
|AI                |Google Gemini (vision + audio)                            |
|Payments          |Paystack                                                  |

## Getting Started

> The values below are placeholders reflecting the stack above — replace
> with the project’s actual setup commands and environment variables.

```bash
git clone <repo-url>
cd inkto
npm install
```

Create a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
PAYSTACK_SECRET_KEY=
```

```bash
npm run dev
```

### Android build (Capacitor)

```bash
npx cap sync android
npx cap open android
```

## Project Status

Actively in development.

- [x] Authentication (Supabase Auth, email OTP)
- [x] Document scanning (Google ML Kit)
- [x] Handwriting and typed-document transcription
- [x] Voice dictation
- [x] Document templates (blank + AI-fit)
- [ ] AI document drafting
- [ ] Matter/case-based organization
- [ ] Verified legal research

## Roadmap

**Phase 1 (current)** — Scanning, transcription, templates, document
library, authentication, subscription tiers.

**Phase 1.5** — Voice-to-text refinement, AI document drafting.

**Phase 2+** — Matter/case-based organization, verified legal research.
Legal research is deferred intentionally: general-purpose AI models are
prone to fabricating case citations, and this will only ship once it’s
backed by a verified legal corpus or search-grounded sourcing.

## Working on This Project

- This application processes privileged legal content — data handling,
  retention, and storage decisions are governed by the project’s
  compliance documentation, not left to individual judgment.
- AI-generated or AI-restructured content (drafting, template-fit) must
  always pass through the mandatory human-review step before export —
  never bypass this gate.
- Scope changes should be checked against the project’s specification
  documents before implementation.

## License

Proprietary. All rights reserved.

## Contact

Built for Nigerian legal practitioners. Feedback from lawyers actually
using the app shapes the roadmap more than anything else — reach out
with what’s working and what isn’t.