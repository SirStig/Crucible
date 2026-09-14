# Changelog

All notable changes to this project are documented here. Versions follow
[semantic versioning](https://semver.org/). `crucible` and the four
`crucible-*` packages are released together under one version number.

## [0.1.0] - 2026-09-14

First public release.

### Added

- **Track B (prose).** Tier 1 deterministic detectors for AI-tell phrasing,
  said-bookisms, balanced-contrast constructions, uniform sentence rhythm,
  adjacent-line redundancy, and word repetition. Tier 2 craft rubric covering
  self-justifying dialogue, on-the-nose lines, exposition dumps, and voice
  consistency. Export adapters for Ink, Yarn, JSON tables, and strings tables.
- **Track A (visual).** Pixel-exact SVG rendering, structural grading, and
  Tier 1 detectors for banding, jaggies, dithering overuse, outline
  inconsistency, too-many-similar-colors, unattached fragments, and unintended
  holes. Tier 2 rubric covering pillow shading, light-source consistency, hue
  shifting, selective outlining, silhouette readability, value contrast, and
  shape plausibility. L-system foliage generation and sprite-sheet packing.
- **MCP server** exposing twelve tools across both tracks over stdio.
- **CLI** (`crucible`) for Tier 1 grading and export, exiting non-zero on a
  failing grade so it drops into CI directly.
- Per-project style profiles, and rubric data files designed to be forked
  rather than consumed as-is.
