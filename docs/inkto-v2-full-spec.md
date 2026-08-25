# Inkto v2 — Full Product Spec (Mobile-First, Nigerian Legal Practitioners)

**Read alongside `inkto-compliance-ops-addendum.md`** — data privacy,
reliability, and business-operations requirements not covered in this
feature spec live there, and Section 1-2 of that document are launch
blockers per the agent guardrails.

## Honest Constraints First (read before building anything)

1. **No accuracy number is promised without testing.** Before telling any
   lawyer "90%+ accurate," run a real test: 20-30 sample audio clips across
   different Nigerian English accents/tribes, and 20-30 handwriting samples
   of varying legibility. Measure actual word-error-rate. Only then decide
   what number, if any, goes in marketing.
2. **Free tier cannot survive real marketing spend.** Organic traffic alone
   already hit Gemini's free rate limit. A funded push to lawyers needs a
   real API budget and a subscription model from day one — not "free until
   it breaks."
3. **Scanning and transcription are separate pipelines.** Scanning is
   client-side computer vision (edge detection, perspective correction,
   contrast enhancement) — no AI, no cost, produces an exact visual copy
   as PDF/image. Transcription is a separate AI step that produces
   editable content. A user can do either, or both in sequence.

---

## Feature Breakdown

### A. Document Scanner (CamScanner-style — no AI needed)
- Camera capture → automatic edge detection and perspective correction
  (crop to just the document, straighten skewed angle)
- Image enhancement: contrast/brightness adjustment so text and stamps
  are crisp, not just a raw photo
- Multi-page capture into one PDF
- Output: a clean PDF or image, preserving stamps, signatures, seals
  exactly as they appear — no AI transcription involved in this path
- Implementation: client-side using a library like `jscanify` or
  `opencv.js` for edge detection, run entirely in-browser before upload —
  keeps this fast and free (no API cost for this feature)

### B. Convert to Editable Word Document (Gemini-only pipeline)

The default output for ALL conversions is a Word document, not a plain
text screen — lawyers work in Word/PDF, not raw text, so the in-app
editor should visually render actual formatting (real headings, bold,
indents, numbered lists) rather than a flat text box. What the user
edits in-app should look like what they get in the exported .docx —
no gap between the two.

**Two different structure expectations, handled differently:**

- **Typed/printed scanned documents:** Gemini transcribes while marking
  structural elements (headings, numbered clauses, paragraphs, tables)
  explicitly, and `generateDocx()` renders these as real Word formatting
  — actual headings, actual numbered lists, actual tables — preserving
  the document's structure and clause order. Anything that only exists
  visually (stamps, signatures, seals, watermarks) is omitted, since a
  text editor has no way to represent those.
  Honest limit: this produces a *faithfully structured* document (same
  paragraphs, same numbering, same order), not a *pixel-identical*
  photocopy of the original layout — true pixel-perfect layout
  reproduction needs dedicated document-layout-analysis tooling, not a
  general vision AI call, and isn't worth the complexity for what
  lawyers actually need here.
- **Handwritten notes and voice dictation:** no structure-matching
  expectation, since the source has no existing structure to be
  faithful to. Output is a clean, well-formatted Word document
  (paragraphs, obvious lists if dictated as one) — not a re-creation
  of anything.

**Comparison view (new, required for every conversion):** after any
conversion, show a side-by-side or toggle view — original image/scan
on one side, the AI output on the other — so the user visually verifies
the result before trusting it. This is the real mechanism for accuracy
confidence, more meaningful than any published percentage, since the
lawyer checks the specific document in front of them rather than
trusting a marketing claim.

- Sends to Gemini vision (Gemini 2.5 Flash recommended — cheapest paid
  tier with vision + audio support in one model, so the same provider
  covers both text and voice pipelines). Claude is dropped for this
  version — no API credits available and none planned for now.
- Test on the free tier (15 RPM / 1,500 requests per day) during
  development. This is fine for solo testing but will NOT hold once
  real users are marketing-driven — move to Gemini's paid tier before
  the Play Store launch or any ad spend, not after problems appear.
- Output: Word document (primary) and PDF (secondary export option)

### C. Voice-to-Text (new, Gemini-only)
- Record audio directly in-app (for dictation) or upload an existing
  audio file (for recorded court proceedings)
- Send directly to Gemini 2.5 Flash's native audio input (no separate
  ASR provider needed — one model handles vision, text, and audio,
  which simplifies both the codebase and the billing)
- Output: editable transcript, same editor as the text-transcription flow
- **Before shipping this feature at all:** test with real recordings
  across a range of accents your dad's practice actually encounters.
  Do not advertise this to lawyers until that test has actually
  happened and you know the real error rate, not an assumed one.

**Offline recording (required):** recording itself must work with no
network — the mic and local storage don't need internet, only the
transcription step does. When offline:
- Detect connectivity status before/during recording (`navigator.onLine`
  plus an actual reachability check, since `navigator.onLine` alone is
  unreliable).
- If offline, recording proceeds normally (same UI, waveform, timer),
  but on stop, save the raw audio file to local device storage (IndexedDB
  or the Cache API for a PWA) instead of uploading — labeled clearly as
  "Pending — will transcribe when back online" rather than shown as an
  error or blocked action.
- Queued recordings appear in History with a distinct pending state
  (see UX notes for the visual treatment) — not mixed in as if already
  transcribed.
- On reconnect, detected via an online event listener, automatically
  upload and transcribe each queued recording in order, without
  requiring the user to manually retry each one.
- If the app is closed/killed while offline recordings are queued, they
  must persist (local storage survives app restarts) and still process
  automatically next time the app opens with a connection.

### D. Unified History
- One history view covering all three types: scans, transcriptions,
  and voice-to-text — filterable by type
- Each entry: type icon, name (see naming below), date, preview snippet
- Documents table (extends what's already built):
  ```
  documents
    id (uuid)
    email (text, indexed)
    type (enum: 'scan', 'transcription', 'voice')
    title (text — see naming below)
    content_text (text, nullable — for transcription/voice)
    file_url (text, nullable — for scan PDFs, stored in object storage
              e.g. Vercel Blob or Supabase Storage, not in the DB)
    audio_url (text, nullable — original audio, kept if reprocessing
               or re-verification is ever needed)
    created_at (timestamp)
    expires_at (timestamp)
  ```
- **Naming:** auto-generate a title from the first line of content
  (already effectively how history previews work), but let the user
  rename any entry — a simple tap-to-edit on the title field. Search
  by typing in the history screen filters by title and content text.

### E. Document Templates (new)
- A library of standard legal document templates lawyers currently
  have no dedicated source for — right now they reuse and edit old
  documents as makeshift templates, which is the actual gap being
  solved here.
- Categories: e.g. affidavits, agreements, letters, pleadings — sourced
  from your dad and any lawyer contacts, since template accuracy and
  correct legal phrasing matters far more here than in any other part
  of the app. Don't AI-generate template content; get real templates
  from real lawyers and store them as-is.
- Flow: browse/search templates by category → each template shows TWO
  clearly separate actions, always both visible, never one hidden behind
  the other: **"Use Blank"** (opens the template's structure directly in
  the editor, empty fields, zero AI cost, unlimited even on free tier)
  and **"AI-Fit"** (see below). Do not make AI-fit the only path to a
  template — the free, no-AI option must always be available and
  equally prominent.
- Templates are static content (no AI cost to serve them) — only the
  final export/editing uses the same infrastructure as everything else.
- Storage: a separate `templates` table (id, category, title, content,
  created_at) — not tied to any user's history, since these are shared
  across all users, not personal documents.
- **AI-fit-to-template (second path, NOT a replacement for blank use):**
  user provides their own content (typed, scanned, transcribed, or
  dictated) and selects a target template category. Gemini restructures
  the user's content into that template's standard section order and
  formatting, preserving the substantive content while applying the
  correct structure.
  **Important caution:** this carries real professional risk if the AI
  misplaces or drops substantive legal content while restructuring.
  The output must always open in the comparison/editor view first —
  never auto-finalize or auto-export — and the app should visibly frame
  this as a drafting aid for the lawyer to review, not an autonomous
  output they can trust unread.

### F. Document Drafting (new — Phase 1.5, see roadmap)
- User describes what they need ("draft a 12-month tenancy agreement
  between [Party A] and [Party B] at ₦X/year") or starts from a chosen
  template category, and Gemini generates a full draft from scratch —
  a text-generation call, no image/audio processing involved, simpler
  than the transcription pipeline technically.
- Output opens in the same Editor screen, same comparison-style review
  expectation as template-fitting.
- **This is the highest-liability feature in the app** — the AI is
  authoring original legal language, not reorganizing something a
  lawyer already wrote. It must never auto-export or auto-save; it
  always opens for mandatory review first, and the UI must visibly
  label AI-drafted content as a starting point requiring lawyer review,
  not a finished document.

### G. Legal Research — DEFERRED, not in this build
Do not implement a "ask the AI about case law" feature in this phase.
General-purpose AI models (Gemini included) are documented to sometimes
generate case citations or legal claims that sound plausible but are
false — this is the same failure mode that has gotten real lawyers
sanctioned for submitting AI-hallucinated citations in real filings.
If research is ever built, it requires either (a) search-grounding so
every claim is tied to a real, clickable source the lawyer can verify,
or (b) integration with an actual Nigerian legal database (e.g.
LawPavilion) — both are separate, larger projects, not something to
bolt onto this app casually. Treat as a future, standalone phase.

---

## Offline File Access
Exports must save to the device's actual file system (or trigger the
native Android/iOS share/save sheet) rather than only producing a
cloud link — once saved, the file is a normal on-device file,
accessible offline via any standard viewer (Word, Google Docs, native
file browser), with no involvement from the app itself needed at
that point.

---

## Phased Roadmap (for a solo developer — build in this order, not all at once)

**Phase 1 — Core (build and test this first, fully, before touching Phase 1.5):**
- A. Document Scanner
- B. Convert to Editable Word Document (typed + handwritten)
- D. Unified History
- E. Document Templates (browse-and-fill only, no AI-fit yet)
- Registration & Auth (OTP)
- Freemium tier structure, Paystack integration

**Phase 1.5 — Add once Phase 1 is tested and trusted by real users:**
- C. Voice-to-Text (requires real accent testing before shipping, see
  Honest Constraints)
- E (extended). AI-fit-to-template
- F. Document Drafting

**Phase 2 — Future, not scoped in detail here:**
- G. Legal Research (requires search-grounding or a legal database
  integration — a separate project)

**Why this order:** Phase 1 features carry the least professional risk
(scanning is deterministic, template browsing is static content,
transcription has the comparison view as a safeguard). Phase 1.5
features all involve the AI generating or restructuring original
content, which is where real mistakes have real consequences — shipping
these only after Phase 1 has proven the core product works, and only
after the specific testing each one requires, protects both your
credibility and your dad's professional reputation.

---

## Mobile App Structure

### Bottom Navigation (4 tabs)
```
[ Home ]   [ Templates ]   [ History ]   [ Account ]
```
- **Home** — the default screen. Two clear actions, not buried in a
  menu: a big central **Capture** button (camera/scan) and a **Record**
  button next to it for voice dictation. Tapping Capture asks "Scan"
  vs "Scan & Convert" *after* the photo is taken, not before — less
  friction than making the user decide upfront.
- **Templates** — browse/search by category, tap a template to open
  it in the editor pre-filled with the template's content.
- **History** — unified list, filter chips at top (All / Scans /
  Text / Voice), search bar, tap any entry to reopen in its editor.
- **Account** — email/subscription status, upgrade prompt if on free
  tier, settings (default export format, retention preference).

### Core Screens
1. **Capture screen** — camera view, capture button, gallery import
   option, multi-page toggle for documents with several pages.
2. **Review & Enhance screen** — shown right after capture: cropped/
   corrected preview, option to retake, adjust crop manually if the
   auto-detection got it wrong, then choose "Save as-is" or "Convert
   to text."
3. **Voice recording screen** — reached from the Home screen's Record
   button: record, stop, routes straight to the Editor once transcribed.
4. **Editor screen** (shared by transcription, voice, and template
   output) — the existing editable-text view, now also entry point for
   Save to History / Send Email / Export .docx / Export .pdf.
5. **Templates screen** — category list → template list → tap to open
   in Editor pre-filled.
6. **History screen** — search, filter, list, tap-through to Editor
   or PDF viewer depending on entry type.
7. **Account/Subscription screen** — plan status, upgrade button,
   usage this month (X of Y free scans/minutes used).

### Registration & Auth (required now that payment is involved)
Since paid subscriptions need a persistent identity, this replaces the
purely anonymous session model — but keep it as close to frictionless
as the old flow, not a traditional password signup:

- **Sign-up/login: email + one-time code (OTP), no password.** User
  enters their email, receives a 6-digit code, types it into the app.
  This is the mobile-native equivalent of the magic-link flow already
  built for history — same passwordless principle, adapted so the user
  doesn't have to leave the app to click a link.
- Once verified, issue a long-lived session token stored on-device
  (e.g. 60 days) so they aren't asked to re-verify constantly — this is
  what keeps it feeling frictionless day-to-day despite requiring
  registration up front.
- Free-tier users still go through this same OTP flow (it's now the
  single account system for everyone, not a separate paid-only step) —
  it just doesn't require a card until they hit a paid feature or limit.
- Subscription/payment: use Paystack (strong Nigerian support, handles
  recurring billing) tied to the verified email — when a user upgrades,
  create a Paystack subscription and store `subscription_status` and
  `plan_expires_at` on their account row, checked on every AI request.

---

## Freemium Model & Pricing (based on real Gemini 2.5 Flash rates)

Gemini 2.5 Flash paid pricing (as of Aug 2026): $0.30/M input tokens
(text/image), $2.50/M output tokens, $1.00/M for audio input. These
numbers WILL drift over time — recheck Google's pricing page before
finalizing a price, this is a starting estimate, not a locked figure.

**Rough cost per action** (estimated, verify with real usage once live):
- One document transcription (image in, text out, plus the accuracy
  verification pass): roughly $0.005 per document.
- One minute of voice dictation transcribed: roughly $0.0024 per minute.

**A realistic heavy user** (a busy lawyer): ~15 documents/day and
~20 minutes of dictation/day, 22 working days/month ≈
(330 docs × $0.005) + (440 minutes × $0.0024) ≈ **$1.65 + $1.06 ≈ $2.70/month**
in raw AI cost for a heavy single user.

**Suggested subscription price: $6-10/month** (convert to naira at the
current rate when setting the actual price — don't hardcode a naira
figure, since FX moves). This covers the ~$2.70 raw AI cost with
roughly 2-3x margin, leaving room for Paystack fees, Supabase/Vercel
hosting, and the buffer needed because real usage will vary more than
this estimate — some users will process far more than 15 docs/day.

**Tier structure:**
- **Free:** Unlimited document scanning (client-side, no API cost).
  5 text conversions/day. No voice-to-text (the most expensive feature
  stays paid-only). 7-day history retention.
- **Paid ($6-10/month):** Unlimited text conversion. Voice-to-text
  included with a fair-use cap (e.g. 2 hours/month — recalculate this
  cap once real usage data exists). 30-90 day history retention.
  Access to the full template library (or make templates free-tier too,
  as a growth lever — see note below).
- **Growth consideration:** keeping templates free even on the free
  tier costs you nothing (static content) and gives free users a
  genuine reason to open the app repeatedly, which is what eventually
  converts them to paid for the AI features. Don't paywall the one
  feature that has zero marginal cost.

---

## Testing Plan (do this before wide launch)

1. **Accuracy testing (both handwriting and voice):** collect a real
   sample set — a range of handwriting legibility, a range of accents/
   tribes for voice — and measure actual error rates before claiming
   any number publicly.
2. **Closed beta with a small group of lawyers** (your dad's colleagues,
   as discussed) — real usage, real feedback, before any Play Store
   listing or ad spend.
3. **Load testing** — simulate concurrent users hitting the transcription
   endpoint to confirm the rate-limiting and fallback chain hold up
   under real traffic, not just single-user testing.
4. **Play Store path:** wrap the existing PWA as a Trusted Web Activity
   (TWA) rather than rewriting natively — this publishes your existing
   web app to the Play Store with minimal extra work, and is the
   standard route for PWAs reaching app stores.

---

## What's Explicitly Deferred
- Bluetooth/offline file transfer — not feasible for a cloud-AI-dependent
  product; replaced by offline capture + auto-sync-on-reconnect if that
  need resurfaces.
- Any accuracy claim in marketing copy — wait for real test results.
