# CanvasLoop — PRD / TRD
*(working title — easy to rename)*

**Status:** Draft v0.3
**Date:** September 10, 2026
**Author:** Joshua Kac (drafted with Claude)

---

## 0. Scope Note

This version adds a second track. The problem you're describing for dialogue/quests/UI text is structurally the *same* problem as the visual one — an agent that has the raw capability but not the craft know-how, producing output that needs many manual rounds to fix. So this document now covers two parallel tracks under one project:

- **Track A — Visual Craft Loop**: sprites, foliage, tiles, UI art (unchanged from the prior draft, included here for completeness).
- **Track B — Prose Craft Loop**: dialogue, quest text, UI copy, any user-facing string — games as the primary driver, general prose as the secondary use case.

One honest note before diving in: combining two craft domains under one project is more ambitious than either alone, and doing "everything" was flagged as a real risk earlier in this doc. The mitigation is architectural, not aspirational — the two tracks share only the outer pattern (generate → check → grounded critique → fix loop) and the MCP server shell. Their rubric libraries, detectors, and tools are fully independent, so either track can ship, get used, and be judged on its own without waiting on the other.

---

## 1. Problem Statement

**Track A (visual):** the agent writes drawing code blind (Problem A — no render feedback) and, once geometry is roughly right, doesn't know what separates "geometrically valid" from "actually good" (Problem B — no craft knowledge). See the pixel-art rubric in Section 8 for how that's addressed.

**Track B (prose):** the same two-layer problem shows up in text. The agent can write dialogue and quest text fluently, but the output reliably has specific, nameable issues — it doesn't *sound* human, it over-explains things a character would never actually say out loud, and it needs many rounds of "no, not like that" before it lands. This isn't vague either. Two bodies of craft knowledge, both well documented, describe exactly what's going wrong:

1. **"AI writing tells"** — a widely cataloged, current (2026) set of patterns that make text read as machine-generated regardless of topic: overused transition words ("furthermore," "moreover," "delve into"), balanced/parallel sentence constructions ("it's not just X, it's Y"), uniform sentence-length rhythm where human writing varies, hedging phrases ("it's worth noting"), consistent unshifting formality, and "said-bookisms" (dialogue tags like "exclaimed" or "asserted" standing in for a plain "said" or an action beat).
2. **Narrative-craft failures specific to dialogue** — on-the-nose dialogue (a character states an emotion or motivation directly — "I am sad" — instead of it coming through indirectly), exposition dumps disguised as dialogue (characters explaining things they'd already know, purely for the player's benefit — sometimes called "ATM-style" NPCs, mere information repositories), and lack of subtext (no gap between what's said and what's meant).

Same shape as Track A: a chunk of this is actually **pattern-detectable in text with no model call** (word/phrase blacklists, sentence-length variance, repeated construction patterns, dialogue-tag lexicon checks), and the genuinely judgment-based remainder (on-the-nose-ness, exposition-dump detection, whether a character's voice is distinguishable from the rest of the cast) gets a narrow, rubric-grounded model check instead of an open "does this sound natural" prompt.

---

## 2. Goals

- **Track A:** close the visual render/see loop and ground critique in named craft knowledge (pixel-art rubric first).
- **Track B:** ground dialogue/prose critique in named craft knowledge the same way — computable "AI tells" first, judgment-based narrative craft (on-the-nose-ness, exposition, voice) second.
- Both tracks: work on the actual content type (code-drawn art / generated text), not a downstream "humanizer" pass bolted on after the fact.
- Ship as an MCP server first, CLI second, for both tracks.
- Make as much of each rubric computable as the real failure modes allow; reserve model calls for what's genuinely a judgment call.
- Stay free and self-hostable at the core.

### Non-Goals (v1)

- Not a diffusion image generator (Track A) or a generic "AI detector"/plagiarism tool (Track B) — different problems, already served elsewhere.
- Not a 3D pipeline, not an engine plugin, not a full narrative-design tool (branching logic, quest-state management — Ink/Yarn Spinner already do that well; this only grades the *prose*, not the structure).
- Not a replacement for creative judgment in either track — it removes avoidable, nameable mistakes, not creative decisions.

---

## 3. Target User

Solo/indie developers using an AI coding agent to produce both game art *and* game text via code/generation rather than hiring artists and writers — again, the position you're in with Kurogane Saga, now covering both the visual and narrative side of that same problem.

---

## 4. Core Workflows

**Track A (unchanged from prior draft):**
```
code → render → Tier 1 structural grader → Tier 2 craft rubric
  (computable checks, then narrow vision-grounded checks) → export
```

**Track B (new):**
```
Developer: "write the blacksmith's line rejecting the player's
  underpriced offer — gruff, doesn't waste words"
        │
        ▼
Agent drafts the line(s)
        │
        ▼
TIER 1 — Pattern Grader (deterministic, free, instant)
  banned/overused AI-tell phrases · sentence-length variance vs.
  a human baseline · repeated "balanced pair" constructions ·
  said-bookism dialogue tags · redundant restating between
  adjacent lines (semantic-similarity check)
        │
        ├── fail → specific flagged phrase/pattern + line → agent revises → loop
        ▼ (pass)
TIER 2 — Narrative Craft Rubric (model-assisted, one named item at a time)
  on-the-nose dialogue check: "does this line state the emotion/
    intent directly rather than implying it?"
  exposition-dump check: "does this line explain something the
    character would already know, for the player's benefit?"
  voice-consistency check: "does this read distinguishably as
    THIS character, vs. interchangeable with the rest of the cast?"
        │
        ├── fail/warn → named issue + fix hint → agent revises → loop
        ▼ (pass)
Line accepted → written into the dialogue file (Ink/Yarn format)
```

---

## 5. Functional Requirements

**Track A — Visual** *(unchanged from prior draft — see Section 8 for the rubric)*
FR1–FR13 as previously specified: renderer, structural grader, palette/frame checks, procedural-technique library, deterministic craft detectors (banding, jaggies, outline consistency, dithering, contrast), rubric-grounded vision critique, loop controller, MCP tools, export.

**Track B — Prose**

| ID | Requirement | Notes |
|----|-------------|-------|
| FR14 | Pattern Grader (Tier 1) | Deterministic, no model call: banned/overused-phrase list (living, updatable — see Risks), sentence-length variance check against a target human baseline, repeated-construction detection ("it's not just X, it's Y" and similar templated patterns), said-bookism lexicon check on dialogue tags. |
| FR15 | Redundant-restating check | Adjacent lines/sentences compared for semantic similarity above a threshold — catches the AI habit of saying the same thing twice in slightly different words. |
| FR16 | Narrative Craft Rubric Library | Named, defined entries: on-the-nose dialogue, exposition-dump ("as-you-know" pattern), subtext absence, voice inconsistency across characters — each with a definition and a fix strategy, same structure as the Track A visual rubric. |
| FR17 | Rubric-grounded model critique (Tier 2) | One named rubric item checked at a time, definition supplied in-context — not an open "does this sound natural" prompt. |
| FR18 | Style/voice profile input | Per-project or per-character configuration (register, verbosity, vocabulary constraints, "gruff and terse" vs. "florid and formal") so the rubric checks against *your* target voice, not a single generic "sounds human" default. |
| FR19 | MCP tools | `grade_prose_pattern`, `grade_prose_craft`, `iterate_prose`. |
| FR20 | Export | Write accepted lines directly into Ink/Yarn Spinner format (or plain UI-string files) rather than loose prose needing reformatting. |

---

## 6. Non-Functional Requirements

- **Cost:** Track B's Tier 1 is essentially free — string/regex/statistical analysis on text, no rendering, no GPU, cheaper even than Track A's deterministic layer. Tier 2 model calls are narrow and only run after Tier 1 passes.
- **Speed:** Tier 1 checks on a line or a short scene should be near-instant.
- **Living data:** the phrase-blacklist and pattern list in FR14 is explicitly *not* a one-time hardcoded list — "AI tells" drift as models change (today's list already looks different from 2024's), so this needs to be an updatable data file, not baked into code.
- **Configurability:** FR18 exists specifically so the tool doesn't just push every project toward one generic "human-sounding" register — a gruff blacksmith and a formal court scribe need different targets, and the rubric has to know that.

---

## 7. Technical Architecture

Shared shell: one MCP server, one loop-controller pattern, two independent rubric engines.

1. **Loop Controller** *(shared)* — orchestrates generate → Tier 1 → Tier 2 → report → agent-fixes → re-check, for either track. Max-iteration cutoff, pass/warn/fail, diffing between iterations.
2. **Track A: Renderer + Visual Rubric Engine** — as previously specified (Section 7 of the prior draft): SVG renderer, structural grader, deterministic + vision-grounded craft detectors.
3. **Track B: Prose Rubric Engine** *(new)*:
   - **Pattern Grader**: regex/lexicon-based phrase matching (FR14), a sentence-length-variance statistic compared against a configurable human baseline, a lightweight embedding-similarity check between adjacent lines for FR15.
   - **Narrative Rubric Library**: same data-driven shape as the visual one — `{name, definition, detectable: bool, detector_fn | model_prompt_template, fix_hint}`. On-the-nose and exposition-dump checks are genuinely judgment calls (Tier 2); a "does this line restate information already conveyed" check can be partially automated by cross-referencing against a quest/lore state file if one exists.
   - **Style Profile store**: per-project/per-character config (FR18) that every Tier 1 and Tier 2 check reads from, so "human-sounding" is defined relative to *your* target, not a universal default.
4. **Export adapters** — Track A to sprite-sheet/engine formats, Track B directly into Ink/Yarn Spinner syntax or plain string tables.
5. **MCP server + CLI** *(shared shell, track-specific tools)*.

---

## 8. Concrete Rubric Examples

**Track A (unchanged — pixel-art visual rubric):**

| Failure mode | Definition | Detection | Fix hint |
|---|---|---|---|
| Pillow shading | Shading from outline inward instead of one light direction | Vision-grounded | "Pick one light direction, shade relative to it" |
| Banding | Parallel same-value color bands along a contour | Computable (run-length analysis) | "Break the parallel run" |
| Jaggies | Irregular pixel-step sequence on diagonals | Computable (step-pattern comparison) | "Regularize the step pattern" |
| Dithering overuse | Dither covering a solid field instead of buffering a transition | Computable (pattern-frequency) | "Commit to flat color or add a palette step" |
| Outline inconsistency | Outline width/presence varies with no reason | Computable (contour sampling) | "Match outline to rest of silhouette" |
| Too many similar colors | Unique colors exceed the effective palette | Computable (clustering) | "Collapse near-identical colors" |

**Track B (new — prose/dialogue rubric):**

| Failure mode | Definition | Detection | Fix hint |
|---|---|---|---|
| AI-tell phrasing | Overused transitional/hedging words, templated "not just X, it's Y" constructions | Computable (phrase/pattern list) | "Cut the phrase, restate the connection plainly or drop it" |
| Uniform sentence rhythm | Every sentence/line takes about the same length to read, no variation | Computable (length-variance statistic) | "Split one, shorten another — vary the beat" |
| Said-bookisms | Dialogue tags like "exclaimed," "asserted" instead of "said" or an action beat | Computable (lexicon check) | "Replace with 'said' or cut to an action beat" |
| Redundant restating | Adjacent lines say the same thing in different words | Computable (semantic-similarity check) | "Cut one of the two, they're saying the same thing" |
| On-the-nose dialogue | Character states the emotion/intent directly instead of implying it | Vision/text-model-grounded, single named check | "Have them avoid the subject, deflect, or act instead of stating it" |
| Exposition dump | Character explains lore/backstory they'd already know, purely for the player | Vision/text-model-grounded, single named check | "Cut this to what the character would actually say, move the rest to an item description or environment" |
| Voice inconsistency | This character's lines read interchangeably with another character's | Vision/text-model-grounded, single named check, references the style profile | "Adjust vocabulary/rhythm to match this character's profile" |

---

## 9. Scope Phasing

**v0.1 (MVP) — both tracks, Tier 1 only**
- Track A: SVG renderer + structural grader + deterministic craft detectors (banding, jaggies, outline, dithering, contrast)
- Track B: Pattern Grader (FR14) + redundant-restating check (FR15)
- Neither track needs a model call yet — this is the fully free, fully local version, and on its own already catches a large share of what you've been hand-fixing.
- L-system foliage generator, sprite-sheet grid helper, MCP server, CLI (both tracks' tools).

**v0.2 — both tracks, Tier 2**
- Track A: vision-grounded checks (pillow shading, light-source consistency)
- Track B: narrative rubric (on-the-nose, exposition-dump, voice consistency), style-profile config (FR18)
- Export: Unity/Godot sprite sheets, Ink/Yarn Spinner output

**v0.3+**
- Track A: Swift/SpriteKit renderer, second visual rubric for smoother/vector styles
- Track B: quest-state cross-referencing for restated-information detection, plugin system for community-contributed rubric entries on both tracks

---

## 10. How You'd Know It's Working

- Iteration count on your own assets *and* your own dialogue/quest lines, isolating Tier 1 (free, mechanical) from Tier 2 (model-assisted) so you can see which layer is doing the actual work in each track.
- Whether the Track B phrase list and pattern checks catch what you've personally been manually flagging in Kurogane Saga dialogue — the most direct validation available.
- Dogfooding on both fronts: do you stop needing "a million iterations" for sprites *and* for dialogue.
- Distribution: pickup on MCP aggregator sites (MCP Market, PulseMCP, Fastio) — for either track independently is a fine outcome, they don't need to succeed together.

---

## 11. Risks & Open Questions

- **Scope, restated honestly:** two tracks is a bigger build than one. The mitigation is that they don't share logic, only the outer loop pattern and the MCP shell — you could ship Track B alone, or Track A alone, and each stands on its own.
- **The phrase-blacklist in FR14 will go stale.** "AI tells" change as models change — this has to be a living data file you can update, not a fixed list baked into v0.1 and never revisited.
- **Over-correcting is a real failure mode.** A rubric strict about "sounds human" could just as easily strip a deliberate stylistic choice as fix a real problem — this is exactly why FR18 (style profile) exists: the target has to be *your* character's voice, not one universal "human" default.
- **Tier 2 prose checks are softer than Tier 2 visual checks.** "Is this on-the-nose" is a fuzzier judgment than "is the light source consistent" — narrowing to one named check at a time helps, but this tier will need more iteration to get reliable than the visual equivalent.
- Track A's existing risks (Swift/SpriteKit rendering, deterministic-vs-judgment split) carry over unchanged.

---

## 12. Why This One Specifically

Generic "make AI writing sound human" tools exist (Quillbot Humanize and similar), but they're built for blog posts and marketing copy — they know about hedging phrases and transition words, not about on-the-nose dialogue or exposition dumps disguised as NPC lines. Game-narrative craft knowledge (subtext, "ATM-style" NPCs, exposition-vs-pacing) is well documented in narrative-design writing, but nothing grounds an AI agent's dialogue output against it automatically. That intersection — general "AI-tell" detection *plus* game-dialogue-specific craft knowledge, in one grounded loop — is exactly as open as the visual one, and for the same reason: everyone's building either the general layer or the domain layer, not both together.
