---
name: write-like-me
description: >-
  Use when someone wants original writing drafted in their personal voice,
  including emails, messages, announcements, updates, memos, posts, or other
  prose they will send or publish.
---
# Write In My Voice

Run **house-voice** first when a house canon exists. This skill drafts in the author’s voice and polishes without erasing what makes it theirs.

Draft communications that sound like the author wrote them, then polish the result against the author's writing standards without removing the patterns that make the writing distinctive.

The polish pass must remain voice-aware. If a general editing rule conflicts with an intentional pattern in the author's style guide, preserve the style-guide pattern.

## Phase 1: Find and Read the Style Guide

Before asking questions, look for the author's style guide at:

```text
context/style-guide.md
```

Read the entire guide. Then build two internal reference lists.

### Voice-Protected Patterns

Identify patterns that general editing rules might otherwise remove:

- Characteristic softener words.
- Recurring phrases.
- Deliberate ways of framing bad news or routing conflict.
- Greeting and sign-off patterns.
- Sentence-rhythm patterns, including fragments or specific openers.
- Pronoun patterns, such as distinctions between "we" and "I."

### Structural Rules

Identify preferences for:

- Length.
- Paragraph density.
- Punctuation.
- Formatting.
- Sentence rhythm.

Never use em-dashes, regardless of what the style guide contains.

If the style guide is missing or cannot be located, tell the author and suggest creating one with the `Build My Style Guide` skill. Do not draft in their voice without it.

## Phase 2: Gather Framing

Ask for the following information, one question at a time unless the author already provided it:

1. **Type:** What kind of piece is this?
2. **Audience:** Who will read it?
3. **Main points:** What needs to be communicated?
4. **Desired response:** How should the reader respond or feel?

The desired response is the central organizing goal. It includes both emotional outcomes, such as calm or alignment, and strategic outcomes, such as booking a call, agreeing to a next step, or opening a future conversation.

Do not silently infer the desired response. If the author stated a strategic goal, surface it explicitly and confirm that you are treating it as the desired outcome.

## Phase 3: Draft in the Author's Voice

Use the style guide as calibration rather than a checklist. The goal is writing that sounds like the author on a normal day, not writing that demonstrates every rule in the guide.

Apply the author's patterns in service of the desired outcome:

- Use their preferred opening and warmth level.
- Apply their pronoun distinctions.
- Route conflict according to their normal pattern.
- Match their sentence cadence.
- Use the appropriate register for the audience and piece type.

Sentence rhythm matters more than individual word choice. Read the draft back in the author's cadence. If it sounds like someone else, fix the rhythm first.

Avoid stitched-on transitions such as:

- "Furthermore"
- "In addition"
- "That said"
- "Moreover"
- "It's worth noting"
- "Ultimately"

Use the connective tissue the author actually uses, often allowing the next sentence to pick up the thread naturally.

### Non-Negotiable Drafting Constraints

Apply these before writing:

- Never use em-dashes. Use commas, parentheses, colons, periods, or a rewrite.
- Avoid a run of clipped, dramatic sentences. Vary sentence length intentionally.
- Do not use cheesy setup phrases such as "here's the thing," "here's the kicker," "the truth is," "what nobody tells you," "plot twist," or similar constructions.
- Do not use "not just X, but Y" or related contrast structures. State the point directly.

## Phase 4: Polish with Voice Protection

Apply the standards of the `Writing Coach` skill. Before making any word-level edit, check the proposed change against the voice-protected patterns from the style guide.

If the writing coach would normally remove or change something but the style guide marks it as intentional, keep it.

Examples:

- If "just" is an intentional softener, preserve it.
- If the author normally begins bad news with "Unfortunately," preserve it if the guide identifies that pattern.
- If "I'd love to" is a characteristic invitation, preserve it.
- If passive voice intentionally externalizes responsibility for external delays, preserve that use.

The style guide takes precedence at the word level. Structural clarity rules still apply.

Before delivery, ensure the draft and accompanying notes contain none of the following:

- Em-dashes.
- Staccato dramatic sentence runs.
- Cheesy setup phrases.
- "Not just X, but Y" constructions.

## Phase 5: Deliver

Output the draft unless the author requested a file. Keep the preamble short.

After the draft, include a brief note of 2-4 lines covering:

- Significant structural choices.
- Any conflict between the style guide and general editing rules.
- Anything the author may want to revisit.

If the piece is longer than 300 words or the author requested saving it, save it as a Markdown file in a suitable working location.

## When the Draft Is Not Right

If the author says the draft does not sound like them, is too formal, or misses the tone:

1. Re-read the relevant style-guide section with that feedback in mind.
2. Diagnose whether the problem is rhythm, word choice, transitions, or structure.
3. Rewrite the affected section rather than the entire piece unless a full redo is requested.
