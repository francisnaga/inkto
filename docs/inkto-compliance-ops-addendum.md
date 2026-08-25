# Inkto — Compliance, Reliability & Operations Addendum

Companion to `inkto-v2-full-spec.md`. This covers what a feature spec
doesn't: data handling obligations, reliability, and the operational
pieces needed around the product, not just in it.

## 1. Data Privacy & Confidentiality (address before wide launch)

This is the most consequential gap in the whole project — Inkto handles
attorney-client privileged content and third parties' personal data,
a different risk category than a general productivity app.

- **Confirm and disclose Gemini's data handling.** Verify whether
  Google's API tier in use trains on input data, and state this
  plainly in the privacy policy — don't assume, confirm it directly
  from Google's current API terms before launch.
- **NDPA 2023 (Nigeria Data Protection Act) applies.** Inkto processes
  Nigerians' personal data (client names, case details, financial
  figures) commercially. This requires: a real privacy policy, a
  stated lawful basis for processing, and honoring data subject
  deletion requests.
- **Add a user-triggered "delete now" action** on every document —
  automatic expiry (7/30/90 days) isn't sufficient for privileged
  content; a lawyer needs to purge something the moment they're done
  with it, not wait out a retention window.
- **Encryption at rest** for stored transcripts and audio — confirm
  Supabase's default encryption covers this, and state it explicitly
  rather than assuming.

## 2. Formal Legal Documents (required for Play Store submission anyway)
- Terms of Service
- Privacy Policy (informed by section 1 above)
- In-app disclaimer: "Inkto is a document tool, not a law firm, and
  does not provide legal advice" — separate from the AI-draft-specific
  review warning already in the spec, this is a general product-level
  disclaimer.

## 3. Reliability & Data Durability
- **Backup/disaster recovery plan** for Supabase — even a basic
  scheduled export/snapshot strategy is better than none. Losing a
  lawyer's saved documents is a serious trust failure, not a minor bug.
- **Partial-failure handling:** define what happens if upload/
  transcription is interrupted by a dropped connection or the app being
  closed mid-request — the document should not be lost or left in a
  broken half-state; either it fully queues (like the offline voice
  flow already spec'd) or fails cleanly with a clear retry path.
- **Crash/error monitoring** (e.g. Sentry free tier) so you learn about
  production issues directly, rather than relying on users to report
  them.

## 4. Content Edge Cases
- **Mixed-content documents** (typed text with handwritten marginal
  notes/annotations on the same page) — the current typed-vs-handwritten
  branching assumes a page is one or the other. Update the transcription
  prompt to handle both existing on one page: transcribe typed content
  with structure preservation, transcribe handwritten annotations
  inline or flagged separately, rather than forcing a single mode per
  document.
- **Nigerian Pidgin / local-language mixed into dictation or
  handwriting** — accent testing (already spec'd) should include
  samples with code-switching into Pidgin or a local language, not
  English-only samples, since that's realistic for informal dictation.

## 5. Personal Templates (extends Section E of the main spec)
In addition to the shared public template library, let users save
their own frequently-used documents as private templates:
- New table: `user_templates` (id, email, title, content, created_at) —
  same shape as `documents`, but explicitly reusable as a template
  rather than a one-off record.
- Accessible from the Templates tab under a "My Templates" section,
  separate from the shared library.
- Same two actions apply: use blank or (once drafting exists) as a
  base for further AI work.

## 6. Business Operations
- **In-app support channel** — even a simple "Report an issue" that
  emails you directly is enough at this stage; don't leave paying
  users with no way to reach you.
- **Referral mechanic** — since lawyer-to-lawyer word of mouth is the
  actual validated growth channel (not paid ads yet), add a simple
  referral: a unique link per user, both parties get a benefit (e.g.
  a free month or extra voice minutes) when a referral converts to
  paid. Turns an organic pattern into something trackable.
- **Enable all Paystack payment methods**, not just card — bank
  transfer and USSD are commonly preferred in Nigeria and matter for
  conversion.
- **Business funnel analytics**, separate from page-view analytics —
  track free-tier limit hits and upgrade conversions specifically, since
  this is what actually validates or invalidates the $6-10/month pricing
  decision. Vercel/GA4 traffic numbers don't show this on their own.

## 7. Device & Compatibility
- Set and test against a minimum supported Android WebView/OS version —
  older Android devices are common in the target market; don't assume
  your own development phone represents typical users.

## 8. Subscription Edge Cases
- Define behavior on payment failure or cancellation explicitly: does
  history retention drop from 90 to 7 days immediately, or run out the
  current billing period first? Pick one and implement it consistently,
  don't leave it undefined until a real user hits it.

---
Related: `inkto-v2-full-spec.md` (features), `inkto-PRD.md` (goals),
`inkto-agent-guardrails.md` (build rules).
