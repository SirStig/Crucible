# canvasloop-core

Shared types and the loop controller behind every [CanvasLoop](https://github.com/SirStig/CanvasLoop)
craft track. Track-agnostic: it knows about findings, grades and iteration
state, not about prose or pixels.

```sh
npm install canvasloop-core
```

```ts
import { LoopController, diffLines } from "canvasloop-core";
```

`LoopController` tracks a generate/check/fix session: it records each
iteration, diffs the new draft against the previous one, and enforces a
max-iteration cutoff so an agent can't loop forever.

Most people don't install this directly. It arrives as a dependency of
[`canvasloop-prose`](https://www.npmjs.com/package/canvasloop-prose) and
[`canvasloop-visual`](https://www.npmjs.com/package/canvasloop-visual).

Requires Node 22.12 or newer. MIT licensed.
