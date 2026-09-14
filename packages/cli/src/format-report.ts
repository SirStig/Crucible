import type { Finding } from "canvasloop-core";
import type { ProseGradeResult } from "canvasloop-prose";

const SEVERITY_LABEL: Record<Finding["severity"], string> = {
  fail: "[FAIL]",
  warn: "[WARN]",
  info: "[INFO]",
};

const SEVERITY_ORDER: Record<Finding["severity"], number> = { fail: 0, warn: 1, info: 2 };

/** Renders a grade result as a plain-text report grouped by severity, most severe first. */
export function formatReport(result: ProseGradeResult, sourceLabel: string): string {
  const header = `CanvasLoop prose grade: ${sourceLabel} — ${result.status.toUpperCase()}`;

  if (result.summary.empty) {
    return `${header}\n  (no content to grade)`;
  }

  if (result.findings.length === 0) {
    return `${header}\n  No issues found across ${result.summary.lineCount} line(s).`;
  }

  const sorted = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const body = sorted.map((finding) => {
    const location =
      finding.location?.line !== undefined ? `line ${finding.location.line}` : "document";
    return `  ${SEVERITY_LABEL[finding.severity]} (${location}) ${finding.ruleId}: ${finding.message}\n         fix: ${finding.fixHint}`;
  });

  const counts = countBySeverity(result.findings);
  const summaryLine = `  ${counts.fail} fail, ${counts.warn} warn, ${counts.info} info — out of ${result.summary.lineCount} line(s).`;

  return [header, ...body, "", summaryLine].join("\n");
}

function countBySeverity(findings: readonly Finding[]): Record<Finding["severity"], number> {
  const counts: Record<Finding["severity"], number> = { fail: 0, warn: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}
