---
name: build-my-style-guide
description: >-
  Use when someone wants to capture their personal writing voice and
  communication preferences in a reusable style guide for future drafting and
  editing.
---
# Build My Style Guide

Create a personal writing style guide through a short writing interview. Instead of asking the person to describe their style abstractly, ask them to write small pieces of the kinds of messages they send regularly. Those samples reveal voice, rhythm, and mechanics more accurately than multiple-choice questions.

## What This Produces

Create a style guide containing:

- Specific, actionable voice rules derived from the person's writing.
- Quick-reference templates for common writing situations.
- An explicit avoid list.

The guide may be saved as `context/style-guide.md` when the user has a suitable workspace or knowledge-base location. If no destination is available, present the guide in the conversation.

## How to Run the Interview

Ask each question individually, one at a time. Wait for the person's response before asking the next question. Do not batch questions.

Keep transitions minimal. This should feel like a quick writing exercise rather than a form.

Before the first question, say:

> This is a short writing interview designed to capture your unique voice and tone. The output will be a personal style guide that can help draft and polish communications that sound like you. I will ask eight questions, each a short writing prompt rather than a multiple-choice question. Write naturally, the way you actually would. It should take about 10 minutes.
>
> Do not paste AI-generated or heavily polished content. If it does not sound like your unedited self, the style guide will not either. Write your answers fresh or use something you wrote yourself that you have not run through an AI tool.

Then ask for the person's first name so the guide can be titled appropriately.

## Interview Questions

### Q1: Client Email Opener

> Open an email to a client you have not contacted for a couple of weeks. Write the full opening: greeting, warm beat, and reason for writing. Aim for 3-5 sentences.

This reveals greeting punctuation and structure, whether the warm beat is specific or generic, how the reason for writing is introduced, and natural sentence rhythm.

### Q2: Delivering Bad News

> You need to tell a client that a project deadline is moving by one week. Write the full message in 3-6 sentences.

This reveals whether the person leads with the fact or cushions it, how they attribute the cause, how they construct sentences under pressure, and what follows the hard news.

### Q3: Urgent Internal Ask

> A teammate has something you need by the end of the day. Write the full message: greeting, context, ask, and anything you would add at the end. Aim for 4-6 sentences.

This reveals how the person's register changes with internal contacts, how direct they are when something is urgent, their hedging level, and how they close an urgent request.

### Q4: Quick Casual Message

> Send a teammate a quick heads-up about something minor, such as a meeting change, small FYI, or brief update. Write exactly what you would type, including greeting and sign-off. Aim for 2-4 sentences.

This reveals casual rhythm, fragments, softener words, casual vocabulary, and how brief the person becomes when little context is needed.

### Q5: Warm or Celebratory Message

> Welcome a new client or new hire with a brief opening message. Write the greeting and first 2-3 sentences.

This reveals warmth, vocabulary, greeting habits, and how the person uses exclamation marks.

### Q6: Closing Line

> You have answered someone's question and are wrapping up the message. Write the single closing line you would use before signing off.

This reveals whether the person closes with a forward action, open door, simple thanks, or another pattern.

### Q7: Handling Pushback

> A client pushes back on a recommendation you made. Write your response in 3-6 sentences. Show how you open, acknowledge the concern, and begin your reply.

This reveals whether the person defends, concedes, reframes, or redirects, and how they communicate under disagreement.

### Q8: Sign-Off

> How do you sign off on most messages? Write exactly what you would type, including any closer before your name and your name as you would sign it.

This captures the exact sign-off format and its level of formality or warmth.

## Generate the Style Guide

After collecting all eight answers, read every answer carefully before writing any rule. Then synthesize the samples into 8-12 specific, actionable rules.

A rule such as "be warm" is not useful. Prefer a rule such as:

> Open with "Hi, [Name]." Then use one sentence of specific context before the ask.

Do not invent rules the samples do not support. A shorter, accurate guide is better than a longer guide based on guesses.

## What to Extract

Look specifically for:

- **Greeting structure:** Exact punctuation, capitalization, and placement of the recipient's name.
- **Warm beat:** Whether context is specific or generic, and how long it is.
- **Sentence rhythm:** Whether sentences vary in length, use fragments, or remain consistently medium-length.
- **Characteristic softeners:** Words such as "just," "quick," "actually," "really," or "honestly."
- **Pronoun patterns:** When the person uses "we" for organizational ownership versus "I" for personal commitment.
- **Aside handling:** Whether context appears in parentheses, commas, or separate sentences.
- **Hedging level:** Whether the person uses stacked hedges or direct requests.
- **Bad-news construction:** Whether the person leads with the fact, how they attribute cause, and what follows the hard news.
- **Internal versus external register:** Whether greeting, warmth, or sentence length changes by audience.
- **Casual rhythm:** Short trailing fragments, informal vocabulary, and softeners.
- **Exclamation usage:** Where exclamation marks appear and whether they are used on greetings, reactions, requests, or decisions.
- **Closing pattern:** Forward action, open door, thanks, or direct sign-off.
- **Sign-off format:** Exact wording and line breaks.
- **Conflict approach:** Whether the person defends, concedes and reframes, or moves the conversation elsewhere.

## Synthesis Principles

Name patterns specifically and include examples from the samples where useful.

For example:

> Sentences usually run 10-20 words, often followed by a short qualifier such as "Starting in June."

When a recurring phrase or unusual construction appears consistently, name it explicitly. Do not generalize beyond the evidence.

## Output Structure

```markdown
# [Name]'s Writing Style Guide

A reference for anyone drafting communications on [Name]'s behalf.

## About This Voice

[2-3 sentences describing overall tone, register, and distinctive qualities.]

## The Rules

1. **[Rule name].** [Specific, actionable rule with examples where useful.]
2. ...

## Quick-Reference Templates

### [Common format]
> [Template using the person's actual patterns.]

### [Second format]
> [Template.]

### [Third format if applicable]
> [Template.]

## Things to Avoid

- [Specific phrase or pattern.]
```

Before saving, show the complete draft and ask whether it feels accurate and whether anything should be adjusted. Incorporate requested changes.

## Save the Guide

If a workspace or knowledge-base path is available, save the guide as:

```text
context/style-guide.md
```

Confirm the destination before writing. If the destination is unclear, ask where the person wants the guide saved.

After saving, tell the person that the guide is ready and can be updated whenever future drafts do not feel accurate.
