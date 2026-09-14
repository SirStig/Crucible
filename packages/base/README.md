# crucible-base

Shared types and the loop controller behind every [Crucible](https://github.com/SirStig/Crucible)
craft track. Track-agnostic: it knows about findings, grades and iteration
state, not about prose or pixels.

```sh
npm install crucible-base
```

```ts
import { LoopController, diffLines } from "crucible-base";
```

`LoopController` tracks a generate/check/fix session: it records each
iteration, diffs the new draft against the previous one, and enforces a
max-iteration cutoff so an agent can't loop forever.

Most people don't install this directly. It arrives as a dependency of
[`crucible-prose`](https://www.npmjs.com/package/crucible-prose) and
[`crucible-visual`](https://www.npmjs.com/package/crucible-visual).

Requires Node 22.12 or newer. MIT licensed.
