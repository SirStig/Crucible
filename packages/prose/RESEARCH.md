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

## Research gathered for Tier 2 (not yet built)

Tier 2 (`grade_prose_craft` — on-the-nose dialogue, exposition dumps, voice
consistency) is out of scope for this pass, but the research for it is
already gathered and worth keeping so it isn't re-done from scratch later:

- **On-the-nose dialogue**: well-documented screenwriting-craft term —
  dialogue that states a character's thought/feeling/intent directly instead
  of through subtext (tone, indirection, action, a non-answer). See
  [No Film School's explainer](https://nofilmschool.com/on-the-nose-dialogue)
  and [ScreenCraft](https://screencraft.org/blog/how-to-avoid-writing-on-the-nose-dialogue/)
  for worked examples.
- **Exposition dumps / "As You Know, Bob"**: named directly in the Turkey
  City Lexicon — "characters tell each other things they already know
  merely to inform the reader," also called "maid and butler dialogue." The
  TRD's own "ATM-style NPC" framing is a game-specific instance of the same
  named problem.
- Both of these are fuzzier judgment calls than anything in Tier 1 (there's
  no computable phrase list for "does this line have subtext"), which is
  exactly why the TRD scopes them as model-assisted, one named rubric item
  at a time, rather than deterministic pattern matching.
