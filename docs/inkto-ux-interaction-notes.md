# Inkto — UX Interaction Notes
Companion to `inkto-wireframes-v2.html` and `inkto-complete-flowchart.mermaid`.
This covers what a static wireframe can't: motion, timing, and behavioral
detail. Final visual styling (color, type, branding) is a separate pass —
this is about behavior, not appearance.

Motion — keep it functional, not decorative
Per the frontend-design principle of restraint: spend animation budget
only where it communicates state, not as flourish.

Capture → Review transition: the captured photo should visibly
"settle" into its corrected/cropped position (a brief animated crop),
since this is the moment that proves the enhancement worked — worth
one deliberate animation here.

Conversion loading state: a simple, calm spinner/pulse — avoid a
progress bar with a fake percentage, since you don't actually know
how long Gemini will take; a percentage that stalls or jumps looks
broken even when it isn't.

Comparison view toggle (Split/Original/Result): slide, not fade —
reinforces that these are the same document in different views, not
three unrelated screens.

Everywhere else: standard, fast (150-200ms) transitions only.
No page-load animation sequences, no scroll-triggered reveals — this
is a utility tool used repeatedly by professionals under time
pressure, not a marketing site. Speed of use beats visual flourish.

Loading & error states (apply consistently across all AI actions)
Loading: show what's happening in plain language ("Reading your
document...", "Transcribing your recording...") rather than a generic
spinner alone — reduces perceived wait time.

Timeout/error: always give a specific next step, never just
"Something went wrong." E.g. "Couldn't process this document — try
retaking the photo in better light" rather than a raw error.

Rate-limit hit (server busy): distinguish this from a real error —
"High demand right now, retrying..." with an automatic retry, rather
than dumping the user into a dead-end error screen for something
that's often transient.

Settings (Account tab — full list, only summarized in wireframe)
Default export format: Word / PDF (used to skip the format-choice
step for repeat users who always want the same thing)

History retention preference (within plan limits — can't set beyond
what the tier allows)

Notification preference: email me when a conversion is ready (useful
if processing ever takes long enough to not wait in-app)

Language/accent hint for voice (optional — if testing shows accuracy
varies enough by accent to warrant letting the user flag theirs, add
this; skip it if testing shows the model handles it well without a hint)

Delete account / export all my data (required for basic data
handling hygiene, even at small scale — don't skip this because the
user base is small at launch)

Empty states — treat as guidance, not dead ends
Every empty state (History, Templates category with no entries yet)
should tell the user what to do next, not just state absence. "No
documents yet" alone is a dead end; "No documents yet — scan, dictate,
or draft something and it'll show up here" gives them the next action.

Confirmation vs. silent action
Destructive actions (delete a history entry, log out, cancel
subscription): always confirm with a specific description of what's
being lost — "Delete this document? This can't be undone" not a bare
"Are you sure?"

Non-destructive actions (save, send, export): no confirmation
dialog needed — show a brief inline success state instead (a toast
or inline checkmark), since a modal here just adds friction to
something low-risk.

Accessibility baseline (non-negotiable, not a nice-to-have)
Visible focus states on every interactive element (buttons, inputs,
list items) — needed for keyboard/switch-control navigation.
Minimum tap target size 44×44px on mobile — several buttons in the
wireframe are shown small for layout density; enforce this minimum
in actual implementation regardless of how the wireframe box looks.
Respect the OS-level "reduce motion" setting — disable the
crop-settle and slide-toggle animations above when it's on.

What's intentionally NOT specified here
Exact color values, typography, spacing scale, and any signature visual
element — that's the next phase, using the frontend-design process
(token system, then build) once this structural/behavioral spec is
approved and stable. Designing visuals against a structure that's still
changing wastes both passes.
