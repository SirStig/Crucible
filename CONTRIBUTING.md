# Contributing

Thanks for taking a look. Bug reports and rubric additions are both welcome.

## Getting set up

Requires Node 22.12 or newer.

```sh
git clone https://github.com/SirStig/Crucible.git
cd Crucible
npm install
npm run build
```

## Before opening a pull request

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npm test
```

CI runs exactly these on Node 22.12 and 24, so a green local run should mean a
green PR.

## Adding a detector or rubric item

Tier 1 detectors must be deterministic. Same input, same findings, no model
call and no network. If a check needs judgment to decide, it belongs in a Tier 2
rubric instead, where it gets handed to the calling agent as a named item.

Every new detector needs tests covering a clear positive, a clear negative, and
whatever boundary the threshold sits on. Rubric items need a source citation:
the point of the project is that findings are traceable to named craft
knowledge rather than to taste.

## Rubric data

The JSON under `packages/prose/data/` and `packages/visual/data/` is meant to be
edited by users. Additions there should be broadly applicable rather than tuned
to one project's voice, since anything project-specific is better expressed as
a style profile.

## Releasing

All five packages share one version number and are published by hand.

Bump the version in each `packages/*/package.json`, add a dated section to
`CHANGELOG.md`, then:

```sh
npm run build && npm test
for p in crucible-base crucible-prose crucible-visual crucible-mcp-server crucible-loop; do
  npm publish --workspace "$p" || break
done
git tag -a vX.Y.Z -m "Crucible vX.Y.Z" && git push origin vX.Y.Z
```

Order matters. Cross-package dependencies are pinned to exact versions, so a
dependent published before its dependency is briefly uninstallable. The
`|| break` stops the loop rather than continuing past a failure.

A published version can never be reused, even after unpublishing, so run
`npm publish --workspace <pkg> --dry-run` first if anything looks off.
