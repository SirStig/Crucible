# Research grounding for the Tier 1 rubric

This tracks what each Tier 1 check is actually based on, so "grounded in named
craft knowledge" (the whole point of CanvasLoop per the project's own PRD/TRD)
means something concrete rather than a list of phrases someone made up. Update
this file alongside `data/ai-tell-phrases.json` and `data/said-bookisms.json`
when the sourcing changes.

## FR14a/b — AI-tell phrases & balanced-construction templates

**Primary source:** [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
— a collaboratively maintained essay cataloging patterns editors use to spot
AI-written Wikipedia articles. Most `source`-tagged entries in
`ai-tell-phrases.json` cite this directly.

**Secondary corroboration:** several independent overused-ChatGPT-phrase
compilations agree on "in today's fast-paced world," "game-changer," and
"it's not X, it's Y" as a cluster of near-canonical tells — used to justify
keeping `in-todays-fast-paced-world` at `fail` severity rather than `warn`.

**What was deliberately excluded, and why:** the Wikipedia essay was written
for a different register (encyclopedia articles) than terse game dialogue, so
several of its documented categories were left out rather than imported
wholesale:

- **Notability-emphasis phrases** ("independent coverage," "active social
  media presence," "cited in trade publications") — entirely about Wikipedia
  sourcing guidelines, no analogue in dialogue/prose.
- **Challenge-section formula** ("Despite its... faces several challenges,"
  "Future Outlook") — a biography-article structural convention, not
  applicable to dialogue.
- **Vague connection phrases** ("in connection with," "associated with") —
  bureaucratic register, plausible only for a narrow set of character voices
  (a court scribe, say) and too common in ordinary prose to flag by default.
- **Most of the "avoidance of is/are" verb list** (`marks`, `functions as`,
  `operates as`, `represents`, `features`, `maintains`, `offers`, `refers
to`) — all ordinary, extremely common verbs in any register. Flagging them
  wholesale would bury real findings in noise. `serves as` was kept, at
  `info` severity, as the one entry from this category distinctive enough to
  be worth a low-confidence flag.
- **Bare `landscape`, `robust`, `valuable`, `key`, `crucial`** as standalone
  words — each has an entirely ordinary, load-bearing meaning in a
  fantasy-RPG specifically ("the landscape," "robust armor," "a valuable
  item," "a key item," "this is crucial") that would make the bare word a
  bad signal for _this_ domain even though Wikipedia's list is right that
  they're overused in AI-written encyclopedia prose. Where a phrase-level
  form of the same word is genuinely more diagnostic (`plays a crucial
role`, `key role`), that phrase is kept.
- **Hedge words used as individual overused words** (Wikipedia notes
  "might," "could," "perhaps," "generally," "often" as overused _when they
  recur_ — a frequency signal, not a one-shot phrase match). The current
  phrase matcher fires per-occurrence; flagging any single instance of
  "might" or "could" would be absurd in dialogue. A proper implementation
  needs per-document frequency counting, which is out of scope for this
  pass — noted here as a real gap, not silently dropped.

**New addition motivated directly by this research:** the
`trailing-participial-clause` template (a sentence capped with ", fostering
X." / ", underscoring Y.") comes from Wikipedia's "Analysis-Insertion
Patterns" section — a _structural_ habit distinct from any single word on the
list, and a better fit for the template mechanism (regex + repeat-escalation)
than the flat phrase list.

## FR14c — sentence rhythm

**Concept source:** "burstiness" — the variance of sentence length/perplexity
across a document — is the actual metric used by AI-text detectors (GPTZero
and similar tools): human writing tends toward high burstiness (short and
long sentences mixed), AI output toward low burstiness (uniform length). The
coefficient-of-variation check in `sentence-rhythm.ts` is a direct,
simplified implementation of that same idea, computed on word count per
sentence rather than full perplexity (which would need a language model —
out of scope for a Tier 1, no-model-call check).

**Known, documented limitation, carried over honestly rather than hidden:**
burstiness-based detection has real, published failure modes — newer models
are getting better at mimicking it, and non-native English writers naturally
produce lower-burstiness text for reasons that have nothing to do with AI
authorship. The same caution applies here: a low coefficient of variation is
a real, named signal, not proof of anything. It's why this check's findings
should be read as "worth a second look," not a verdict — see the default
`warn`/`fail` split in `sentence-rhythm.ts` and treat both as a starting
point for judgment, not an answer.

## FR14d — said-bookisms & Tom Swifty

**Source:** the [Turkey City Lexicon](https://sfwa.org/2009/06/18/turkey-city-lexicon-a-primer-for-sf-workshops/),
a science-fiction-workshop craft glossary in continuous use since the 1980s
(Damon Knight / Turkey City Workshop, Austin) and still the standard
reference for this exact terminology. Its own `"Said" Bookism` entry names
"retorted," "inquired," and "ejaculated" as canonical bad examples — all
three are in `said-bookisms.json`, with `ejaculated` kept at `fail` since
it's the Lexicon's own headline example.

The Lexicon separately names **Tom Swifty** (a plain "said" paired with a
colorful adverb — "she said icily") as a related-but-distinct problem from
bookism proper. That's implemented as a structural check on the _allowed_
verb list in `said-bookism.ts` (`findTomSwifty`) rather than as banned-list
data, since it's about adjacency to an adverb, not a lexicon lookup. Its
adverb detector is a plain "-ly" suffix heuristic with a hand-maintained
exclusion list for common non-adverb "-ly" words (`only`, `friendly`,
`lovely`, ...) — no real part-of-speech tagging, so it will occasionally
miss or mis-flag; documented as a known limitation rather than silently
wrong.

## FR15 — redundant restating

No named craft term found for this specific check; it's a straightforward
"don't say the same thing twice" principle. The implementation choice
(Jaccard similarity on stopword-filtered, stemmed token sets, as a
model-call-free proxy for "semantic similarity") is a documented engineering
tradeoff, not a research claim — see the comment in
`detectors/redundant-restating.ts`.

## FR16/FR17 — Tier 2 rubric library (now built)

Tier 2 is live: `get_prose_craft_rubric` hands the calling agent a named
rubric item's definition; the agent applies it with its own judgment and
reports a verdict through `grade_prose_craft`, which structures it into a
`Finding`. No model call is embedded in the server — see
`data/craft-rubric.json`'s own `notes` for why.

Four rubric items exist:

- **`self-justifying-explanation`** — found through direct dogfooding, not
  external research: a line explains or justifies its own word choice or
  design decision instead of just stating the fact, or states not just what
  something IS but exhaustively what it ISN'T. **Validated against real
  production text**: applied to all 9 messages on Kurogane Saga's "Support
  the game" screen, 3 failed and 4 warned — a concrete, non-hypothetical
  catch, not a guess.
- **`on-the-nose-dialogue`** — well-documented screenwriting-craft term: a
  character states their own emotion/intent directly instead of it coming
  through subtext. [No Film School](https://nofilmschool.com/on-the-nose-dialogue).
- **`exposition-dump`** — the Turkey City Lexicon's "As You Know, Bob":
  characters explaining things to each other they'd both already know.
- **`voice-consistency`** — depends on FR18 (below); a line that reads
  interchangeably with any other character's, checked against that
  character's style profile via `get_style_profile`.

**Honest validation status for `on-the-nose-dialogue` and
`exposition-dump`**: applied to ~55 real lines (40 random NPC ambient
lines from `npcArchetypes.json`, 15 quest-board bodies from
`questTemplates.json`) — zero violations found in either. That is _not_
the same as "these items are proven useful." Kurogane Saga has no
multi-character scripted dialogue (checked — no cutscene/story-dialogue
files exist in the project); both rubric items are specifically about
character-to-character exchanges, and ambient one-liners addressed to the
player structurally can't exhibit either failure mode (there's no second
character to over-explain to, and the player isn't a character who
"already knows" the quest brief). These two items are confirmed not to
false-positive on real content, but remain unvalidated on a genuine
positive case — that would need this game (or another project) to actually
have scripted multi-character dialogue to check them against.

## FR18 — Style/voice profiles (now built)

Per-character voice targets, project-supplied — no bundled default (the
TRD is explicit: don't push every project toward one generic register).
`resolveStyleProfile()`/`applyStyleProfileToOptions()` in
`style-profile.ts`; `get_style_profile` MCP tool; `detectVoiceVocabulary()`
adds a Tier 1, deterministic check (a character's `vocabulary.avoid` list,
flagged literally) alongside the Tier 2 `voice-consistency` judgment call.
See `data/example-style-profiles.json` for the documented shape — copy it
into your own project and edit it to match your actual cast.

## Connecting Tier 1 and Tier 2

`iterate_prose` now accepts an optional `craftFindings` array — the
`Finding`(s) `grade_prose_craft` returned for the same draft — and folds
them into that iteration's grade and status. One session, one status,
instead of two disconnected tool flows.
