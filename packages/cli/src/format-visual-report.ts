import type { Finding } from "crucible-base";
import type { VisualGradeResult } from "crucible-visual";

const SEVERITY_LABEL: Record<Finding["severity"], string> = {
  fail: "[FAIL]",
  warn: "[WARN]",
  info: "[INFO]",
};

const SEVERITY_ORDER: Record<Finding["severity"], number> = { fail: 0, warn: 1, info: 2 };

function locationLabel(finding: Finding): string {
  const { x, y } = finding.location ?? {};
  if (x !== undefined && y !== undefined) return `(${x},${y})`;
  if (x !== undefined) return `x=${x}`;
  if (y !== undefined) return `y=${y}`;
  return "";
}

/** Renders a visual grade result as a plain-text report grouped by severity, most severe first. */
export function formatVisualReport(result: VisualGradeResult, sourceLabel: string): string {
  const header = `Crucible sprite grade: ${sourceLabel} — ${result.status.toUpperCase()}`;

  if (result.summary.empty) {
    return `${header}\n  (nothing was drawn)`;
  }

  if (result.findings.length === 0) {
    return `${header}\n  No issues found — ${result.summary.width}x${result.summary.height}, ${result.summary.uniqueColorCount} color(s).`;
  }

  const sorted = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const body = sorted.map((finding) => {
    const location = locationLabel(finding);
    const locationPart = location ? ` ${location}` : "";
    return `  ${SEVERITY_LABEL[finding.severity]}${locationPart} ${finding.ruleId}: ${finding.message}\n         fix: ${finding.fixHint}`;
  });

  const counts = countBySeverity(result.findings);
  const summaryLine = `  ${counts.fail} fail, ${counts.warn} warn, ${counts.info} info — ${result.summary.width}x${result.summary.height}, ${result.summary.uniqueColorCount} color(s).`;

  return [header, ...body, "", summaryLine].join("\n");
}

function countBySeverity(findings: readonly Finding[]): Record<Finding["severity"], number> {
  const counts: Record<Finding["severity"], number> = { fail: 0, warn: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}
