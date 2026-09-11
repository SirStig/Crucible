# Research grounding for the visual rubric

This tracks what each check — Tier 1 and Tier 2 — is actually based on, so
"grounded in named craft knowledge" means something concrete rather than a
list of heuristics someone made up. Update this file alongside
`src/detectors/*.ts` and `data/craft-rubric.json` when the sourcing changes.

## Tier 1 — deterministic pixel-pattern detectors

No single canonical craft-literature source names these five checks the way
the Turkey City Lexicon names prose failure modes — they're original,
documented pixel-analysis heuristics operating on the rasterized buffer, not
proven computer-vision techniques. Each one's own file states its
limitation; summarized here:

- **Banding** (`detectors/banding.ts`) — flood-fills same-color regions,
  flags elongated, similarly-oriented, adjacent regions sharing a highly
  linear border. This operationalizes "parallel same-value strips instead
  of real shading," a named beginner mistake across pixel-art tutorials,
  but the specific elongation/linearity thresholds are original engineering
  choices, not derived from a study.
- **Jaggies** (`detectors/jaggies.ts`) — segments a silhouette edge into
  diagonal runs and flags high coefficient-of-variation in tread length.
  Deliberately reuses the exact CV-instability lesson learned from Track
  B's `sentence-rhythm.ts`: a run below the minimum length is skipped
  rather than judged on too little data.
- **Dithering overuse** (`detectors/dithering.ts`) — checkerboard-cell
  detection plus region-width thresholding: a real transition dither is a
  thin band, a wide dithered region is "covering a field" rather than
  blending a transition.
- **Outline inconsistency** (`detectors/outline-consistency.ts`) — finds
  the dominant contour color and flags what fraction of the contour
  deviates from it. This is Tier 1's blunt, non-judgment proxy for
  `selective-outlining` (Tier 2, below) — it catches accidental breaks in
  an outline, not whether the outlining _choice_ itself is good craft.
- **Too-many-similar-colors** (`detectors/color-count.ts`) — redmean
  perceptual-distance agglomerative clustering
  ([compuphase.com's redmean formula](https://www.compuphase.com/cmetric.htm),
  a well-established low-cost perceptual color-distance approximation) to
  find the _effective_ palette size versus the raw unique-color count.
- **Unattached fragments** (`detectors/attachment.ts`, the "attachment"
  check) — a color-agnostic 8-connectivity flood fill
  (`PixelGrid.connectedComponents`) finds every physically-touching blob; a
  small blob sitting close to (but not touching) the main body is flagged
  as a likely broken attachment — a limb, handle, or accessory meant to
  connect but drawn with a gap. Distance is a cheap bounding-box-gap
  approximation of nearest-pixel distance, not exact geometry, and the
  size/distance thresholds are deliberately conservative about false
  positives (a fragment that's far away or large relative to the main body
  is left alone, since sprites legitimately have separate decorative
  pieces this check has no way to tell apart from a genuine bug).
- **Unintended holes** (`detectors/enclosed-holes.ts`, the "shape" check)
  — `PixelGrid.enclosedTransparentRegions` finds transparent pixels fully
  sealed inside a silhouette (unreachable from the canvas border by a
  4-connected transparent flood fill). Small enclosed holes are flagged as
  likely accidental fill gaps; above a size cutoff the check stops flagging
  by default, since a larger enclosed region is ambiguous enough (a
  window, a ring's center) that guessing "bug" would be as likely wrong as
  right.

## Tier 2 — visual-craft rubric

Same architecture as Track B's Tier 2: no model call is embedded in the
server. `get_sprite_craft_rubric` hands the calling agent a named rubric
item's definition; the agent looks at the actual rendered image (returned
as an MCP image content block by `render_sprite`/`grade_sprite_pattern`)
and applies the rubric with its own vision and judgment, then reports a
verdict through `grade_sprite_craft`, which structures it into a `Finding`.

This tier exists because Tier 1 passing only proves a sprite is _clean_ —
no accidental bands, no ragged diagonals, a reasonably small palette. It
says nothing about whether the sprite is actually _good_: whether it has a
real light source, whether its shading reads as depth or as flat noise,
whether its silhouette is even recognizable. That gap was found directly
by dogfooding (see Validation below), the same way `self-justifying-explanation`
was found in Track B — not predicted in advance from the PRD/TRD.

**`pillow-shading` / `light-source-consistency`** — "pillow shading" (also
called "airbrushing" in some pixel-art tutorial writeups) is one of the
most commonly named beginner pixel-art mistakes: shading a form by distance
from its own silhouette edge instead of by an actual light direction.
**Source:** Derek Yu's widely-circulated "Pixel Art Tutorial" (written
alongside his _Spelunky_/_UFO 50_ work), which explicitly instructs picking
one light source and shading every form consistently with it.
`light-source-consistency` extends the same idea across multiple sprites
in one scene/tileset — not in the source tutorial verbatim, but a direct,
defensible extension of the same principle to a multi-sprite context (named
in this rubric's own `note` field as an extension, not a separate citation).

**`hue-shifting`** — shading by mixing pure black/white into a base color
produces flat, muddy results; shifting hue toward cool/saturated in shadow
and warm/light in highlight is standard pixel-art (and traditional
painting) craft advice. **Source:** the same Derek Yu tutorial.

**`selective-outlining`** — varying outline color by local light/shadow
instead of one flat outline color (usually pure black) around the whole
silhouette. **Source:** the same Derek Yu tutorial. Tier 1's
`outline-inconsistency` detector is a blunt, deterministic proxy that
catches _accidental_ outline breaks; this Tier 2 item is the actual craft
judgment about whether the outlining _choice_ itself is doing its job.

**`silhouette-readability`** — the "silhouette test": a well-designed
character/object should be identifiable from its solid silhouette alone.
**Source:** Frank Thomas & Ollie Johnston, _The Illusion of Life: Disney
Animation_ (Disney Editions, 1981) — the staging/silhouette principle,
long adopted into game character and sprite design generally, not a
pixel-art-specific source but the origin of the underlying craft idea.

**`value-contrast-range`** — form and depth read through value (lightness/
darkness), not hue; a sprite varying mostly in hue at near-constant
lightness reads flat even with a large palette. **Source:** James Gurney,
_Color and Light: A Guide for the Realist Painter_ (Andrews McMeel, 2010),
a standard reference on value's primacy over hue for legibility of form —
general art-fundamentals grounding, applied here to pixel-art specifically.

**`shape-proportion-plausibility`** — parts that should match (two legs,
two support posts, both sides of a symmetric object) should actually
match, and no part should read as broken-scale relative to the rest of the
object. **Source:** general figure/object-proportion construction method
(Andrew Loomis, _Figure Drawing for All It's Worth_) — not a
pixel-art-specific citation, the same "a form must read correctly" idea
the lighting-focused items above apply to shading, applied here to shape.
This item — plus the deterministic `unattached-fragment` and
`unintended-hole` Tier 1 checks above — was added directly in response to
user feedback that Tier 1 alone ("is it clean") wasn't catching enough of
what actually makes art read as good or broken: shape/proportion mistakes
and attachment errors are exactly the kind of thing Tier 1's pixel-pattern
detectors can't judge (proportion is a judgment call) or hadn't been built
to catch yet (attachment/holes are deterministic, but nobody had written
the detector) until this pass.

**What was deliberately left out:** genuinely vision-model-grounded checks
(e.g. automated perspective/anatomy correctness, material-specific texture
plausibility) are out of scope for a no-model-call Tier 2 — those require
either a model call embedded in the server (against the free/self-hostable
design goal) or richer CV than a flood-fill/contour pass supports. Tier 2's
job here is to hand a capable, already-in-the-loop agent named craft
concepts to apply with its own vision, not to replace that judgment with a
weaker automated approximation.

## Validation against real production art

**`Scenery.well()`**, a real procedural scenery piece from Kurogane Saga
(`Sources/KuroganeKit/Art/World/Scenery.swift`), was translated by hand
into SVG and run through the full Tier 1 pipeline: clean pass, 3 colors, no
detector findings. That result is real but incomplete — a clean Tier 1
pass does not mean the art is good, only that it has no _accidental_
pattern defects.

Applying the Tier 2 rubric by eye to the same render surfaced exactly what
Tier 1 couldn't: flat, unshaded fills (no light source at all, let alone a
consistent one), an unused palette color (`ink.accent`), and no value
range beyond the three flat fills. A revised version was built adding
directional highlights on both support posts (inset, not touching the
silhouette edge — the first attempt put a highlight directly on the
contour, which Tier 1's `outline-inconsistency` detector correctly caught
as a real defect, not a false positive), a lit curb-top edge over a shadow
recess, a roof-ridge highlight, and a bucket rim using the
previously-unused `ink.accent` color. The revised version still passes
Tier 1 cleanly (4 colors, no findings) and now has an actual, consistent
light source — exactly what `pillow-shading` and `hue-shifting` check for.

That same directional-shading fix was then applied to the real
`Scenery.well()` Swift source (not just the CanvasLoop-side SVG
translation) and verified to compile via `swift build --target KuroganeKit`.
This is the concrete case both tiers were validated against: Tier 1 alone
passed a flat sprite; Tier 2 is what caught that it still wasn't good art.

**Honest limitation:** this is one hand-picked sprite from one game,
checked by one agent applying the rubric once. It demonstrates the Tier
1/Tier 2 gap is real and that the rubric items are concretely actionable —
it does not demonstrate broad statistical validation across many sprites
or many different agents applying the same rubric. `light-source-consistency`
specifically (the cross-sprite item) has not yet been validated against a
real multi-sprite tileset from any project.
