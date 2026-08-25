# Inkto — Product Requirements Document (PRD)

## Problem
Nigerian legal practitioners spend significant time on manual document
work: retyping handwritten documents, drafting from scratch without
standard templates, and dictating notes that a secretary later
transcribes. This is slow, repetitive, and dependent on staff
availability.

## Target User
Primary: Nigerian lawyers and legal practitioners, starting with a
small, known network (the developer's father and his colleagues)
before wider marketing.
Secondary (not targeted, but compatible): anyone with a similar
document-heavy workflow — students, small office admins.

## Goals (Phase 1)
- Reduce time spent manually retyping handwritten or scanned documents
- Give lawyers a reliable, editable Word output they can trust without
  needing to double-check against the original every time (comparison
  view exists specifically to build this trust)
- Provide a starting template library so lawyers aren't reusing old
  documents as makeshift templates
- Establish a sustainable subscription model that doesn't collapse
  under real usage (unlike the free-tier-only approach that already
  hit limits)

## Non-Goals (explicitly out of scope for Phase 1 and 1.5)
- Legal research / case law lookup (deferred — see spec, Section G)
- Pixel-perfect visual replication of scanned documents in Word output
  (structure fidelity is the goal, not photocopy-identical layout)
- Any AI feature that auto-finalizes without human review

## Success Metrics (qualitative, given early stage — no user base yet
to set numeric targets against)
- Your dad and at least 2-3 of his colleagues use it repeatedly for
  real work, not just a one-time test
- Zero incidents of a factual/numeric error reaching a final exported
  document undetected (the comparison view is the safeguard for this —
  its adoption/use is itself worth observing)
- The app survives real traffic without timing out (validated via the
  paid-tier move and load testing in the spec)

## Key Risks (carried over from the technical spec, listed here for
visibility at the product level)
- AI-authored or AI-restructured legal content (drafting, template-fit)
  carries real professional liability if used unreviewed
- Accent/handwriting accuracy is unverified until real testing happens
- Free-tier infrastructure cannot support funded marketing — this is
  a hard technical/financial constraint, not a preference
- **Data privacy/confidentiality is a launch blocker, not a nice-to-have**
  — Inkto handles attorney-client privileged content; NDPA 2023
  compliance, a real privacy policy, and confirmed Gemini data-handling
  terms must be resolved before wide launch, not treated as a later
  cleanup task. See `inkto-compliance-ops-addendum.md`.

## Related Documents
- `inkto-v2-full-spec.md` — full technical specification, phased roadmap
- `inkto-agent-guardrails.md` — rules for the AI coding agent building this
- `inkto-wireframes-annotated.html` — annotated screen layouts with
  interaction notes
- `inkto-flowchart.mermaid` — complete user journey across all features
- `inkto-compliance-ops-addendum.md` — privacy, reliability, and
  business-operations requirements not covered by the feature spec
