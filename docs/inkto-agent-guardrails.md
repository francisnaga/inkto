# Inkto — Agent Guardrails

Read this before starting any work. This document exists because a solo
developer working with an AI coding agent has no second engineer to
catch drift, invented features, or silent scope changes — this document
is that check.

## Rule 1: Build only what's in the spec, nothing implied or assumed
If a feature, screen, or behavior isn't explicitly described in
`inkto-v2-full-spec.md`, do not add it — even if it seems like a natural
addition or "would be nice." Example of a real past incident on this
project: a "tip the creator" button was added to a live screen without
being requested or specified, directly against an explicit instruction
to skip monetization at that time. If you think something is missing,
say so and ask, rather than adding it.

## Rule 2: Follow the phased roadmap strictly
Build Phase 1 completely — including its own testing — before starting
any Phase 1.5 feature. Do not implement voice-to-text, AI-fit-to-template,
or document drafting until explicitly told Phase 1 is confirmed working
end-to-end by the developer. If asked to "just start on everything,"
push back and confirm Phase 1 is genuinely done first.

## Rule 3: Never invent legal content, ever
For templates (Section E) — do not generate template text yourself. Use
only content explicitly provided by the developer (sourced from real
lawyers). If no template content has been provided for a category yet,
leave it as a clearly marked placeholder — do not fill the gap with
invented legal language to make the feature look complete.

## Rule 4: High-risk AI features must never auto-finalize
Document Drafting (F) and AI-fit-to-template (E extended) must always
open in the Editor/comparison view for mandatory review. Never build a
code path where AI-generated or AI-restructured legal content can be
exported, saved, or emailed without passing through that review screen
first. If you find yourself building a "one-click finalize" shortcut for
either of these two features, stop — that's against the spec.

## Rule 5: No unverified numbers in the product itself
Do not hardcode accuracy percentages, speed claims, or "X% faster" style
copy anywhere in the UI unless the developer has explicitly provided a
real, tested number to use. If UI copy needs a placeholder, use qualitative
language ("fast," "accurate for most handwriting") rather than inventing
a specific figure.

## Rule 6: Cost-sensitive tier logic must be exact
Free-tier limits (5 text conversions/day, no voice) and paid-tier caps
(e.g. 2 hours/month voice) must be enforced server-side, not just
hidden in the UI — a user should not be able to bypass a limit by
calling the API directly. If a limit isn't enforced server-side, flag
this explicitly rather than marking the feature complete.

## Rule 7: When something in the spec is ambiguous or conflicts
If two parts of the spec seem to conflict, or a technical detail isn't
fully specified (e.g. exact wording of an error message, exact spacing
in a layout), make a reasonable choice, implement it, and clearly note
the assumption you made in your response — do not silently guess and
move on without flagging it. The developer needs to know where decisions
were made on their behalf.

## Rule 8: Report deviations immediately, not at the end
If partway through a task you realize a spec requirement isn't feasible
as written (a library doesn't support something, a rate limit blocks an
approach), stop and report this immediately with the specific problem
and your suggested alternative — do not silently substitute a different
approach and present it as if it matches the spec.

## Rule 9: Testing is part of "done," not optional
A feature is not complete until it has been tested against the specific
scenarios listed in the spec's Testing Plan section (e.g. a real
itemized document rendering as an actual Word table, not just "the code
compiles and the happy path works once"). State explicitly what was
tested and how when reporting a feature as finished.

## Rule 10: This is a legal-document product — treat correctness as
the priority over speed of delivery
When in doubt between shipping something fast and getting it correct,
choose correct. A subtle bug in a general consumer app is an
inconvenience; a subtle bug here can mean a wrong figure or a dropped
clause in a legal document someone relies on professionally.

## Rule 11: Data privacy items are launch blockers, not optional polish
`inkto-compliance-ops-addendum.md` Section 1 (data privacy) and Section
2 (ToS/Privacy Policy/disclaimer) must be resolved before this app is
submitted to the Play Store or marketed publicly — not treated as
cleanup to do later. If asked to prepare a public launch and these
items aren't done, say so explicitly rather than proceeding.
