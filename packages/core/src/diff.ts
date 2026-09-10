import type { LineDiff, LineDiffType } from "./types.js";

interface RawOp {
  type: "removed" | "added" | "unchanged";
  before?: string;
  after?: string;
  beforeIndex?: number;
  afterIndex?: number;
}

interface IndexedLine {
  value: string;
  index: number;
}

interface MergedOp {
  type: LineDiffType;
  before?: string;
  after?: string;
  lineIndex: number;
}

/**
 * Line-level diff between two sequences, used to show an agent what actually
 * changed between iterations of a revision loop. LCS-based (dialogue scenes
 * are short, so O(n*m) is fine); a "removed" line immediately followed (or
 * preceded) by an "added" line is reported as one "changed" entry rather
 * than a delete/insert pair, since that's what a revision loop is doing.
 *
 * `lineIndex` on the result is the index in the "after" sequence for
 * added/changed/unchanged entries, and the index in the "before" sequence
 * for removed entries — matching how a caller would want to locate each
 * kind of change in the sequence it actually appears in.
 */
export function diffLines(before: readonly string[], after: readonly string[]): LineDiff[] {
  const rawOps = computeLcsOps(before, after);
  const merged = mergeAdjacentReplacements(rawOps);
  return merged.map(({ type, before: b, after: a, lineIndex }) => {
    const entry: LineDiff = { type, lineIndex };
    if (b !== undefined) entry.before = b;
    if (a !== undefined) entry.after = a;
    return entry;
  });
}

function computeLcsOps(before: readonly string[], after: readonly string[]): RawOp[] {
  const n = before.length;
  const m = after.length;

  // dp[i][j] = length of the LCS of before[i..n) and after[j..m)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        before[i] === after[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const ops: RawOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      ops.push({
        type: "unchanged",
        before: before[i]!,
        after: after[j]!,
        beforeIndex: i,
        afterIndex: j,
      });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      ops.push({ type: "removed", before: before[i]!, beforeIndex: i });
      i++;
    } else {
      ops.push({ type: "added", after: after[j]!, afterIndex: j });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "removed", before: before[i]!, beforeIndex: i });
    i++;
  }
  while (j < m) {
    ops.push({ type: "added", after: after[j]!, afterIndex: j });
    j++;
  }
  return ops;
}

/**
 * Collapses each contiguous run of removed/added lines (in either order,
 * since the LCS backtrack can emit either first) into paired "changed"
 * entries, with any length mismatch left over as pure removed/added.
 */
function mergeAdjacentReplacements(ops: RawOp[]): MergedOp[] {
  const merged: MergedOp[] = [];
  let idx = 0;

  while (idx < ops.length) {
    const op = ops[idx]!;
    if (op.type === "unchanged") {
      merged.push({
        type: "unchanged",
        before: op.before!,
        after: op.after!,
        lineIndex: op.afterIndex!,
      });
      idx++;
      continue;
    }

    const removedRun: IndexedLine[] = [];
    const addedRun: IndexedLine[] = [];
    let k = idx;
    const firstType = op.type;
    const secondType = firstType === "removed" ? "added" : "removed";

    while (k < ops.length && ops[k]!.type === firstType) {
      pushIndexed(ops[k]!, firstType, removedRun, addedRun);
      k++;
    }
    while (k < ops.length && ops[k]!.type === secondType) {
      pushIndexed(ops[k]!, secondType, removedRun, addedRun);
      k++;
    }

    const pairCount = Math.min(removedRun.length, addedRun.length);
    for (let p = 0; p < pairCount; p++) {
      merged.push({
        type: "changed",
        before: removedRun[p]!.value,
        after: addedRun[p]!.value,
        lineIndex: addedRun[p]!.index,
      });
    }
    for (let p = pairCount; p < removedRun.length; p++) {
      merged.push({ type: "removed", before: removedRun[p]!.value, lineIndex: removedRun[p]!.index });
    }
    for (let p = pairCount; p < addedRun.length; p++) {
      merged.push({ type: "added", after: addedRun[p]!.value, lineIndex: addedRun[p]!.index });
    }
    idx = k;
  }

  return merged;
}

function pushIndexed(
  op: RawOp,
  type: "removed" | "added",
  removedRun: IndexedLine[],
  addedRun: IndexedLine[],
): void {
  if (type === "removed") {
    removedRun.push({ value: op.before!, index: op.beforeIndex! });
  } else {
    addedRun.push({ value: op.after!, index: op.afterIndex! });
  }
}
