# crucible-prose

Track B of [Crucible](https://github.com/SirStig/Crucible): deterministic
craft grading for game dialogue and UI text. No model calls, no API key.

```sh
npm install crucible-prose
```

```ts
import { gradeProsePattern, parseDialogueFile } from "crucible-prose";

const lines = parseDialogueFile("Marta: This is a testament to our resolve.");
const result = gradeProsePattern(lines);

result.status; // "warn"
result.findings[0];
// {
//   id: "prose.ai-tell-phrase",
//   ruleId: "testament-to",
//   severity: "warn",
//   message: '"a testament to" reads as a stock AI-tell phrase ...',
//   location: { line: 1, charStart: 9, charEnd: 23, excerpt: "..." },
//   fixHint: "Cut the phrase, restate the connection plainly, or drop it."
// }
```

Tier 1 detectors run on pattern matching alone: AI-tell phrasing, said-bookisms,
uniform sentence rhythm, adjacent-line redundancy, and word repetition. They
prove text is _clean_. Catching whether it's _good_ is Tier 2, which hands a
named rubric item to a calling agent instead of deciding on its own.

The phrase and bookism lists in `data/` are meant to be edited. Fork the data,
not the package, or override per call with `phrasesFile` / `bookismsFile`.

Requires Node 22.12 or newer. MIT licensed.
