import type { TranslationKey } from "../i18n";

export function getSeverityLabelKey(severity: string | null | undefined): TranslationKey {
  switch (severity) {
    case "critical":
      return "insights.severityCritical";
    case "high":
      return "insights.severityHigh";
    case "warning":
      return "insights.severityWarning";
    case "medium":
      return "insights.severityMedium";
    case "low":
      return "insights.severityLow";
    default:
      return "insights.severityInfo";
  }
}
