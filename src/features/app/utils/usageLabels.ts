import type { LocalUsageSnapshot, RateLimitSnapshot } from "../../../types";
import { formatRelativeTime } from "../../../utils/time";

type UsageLabels = {
  sessionPercent: number | null;
  weeklyPercent: number | null;
  sessionResetLabel: string | null;
  weeklyResetLabel: string | null;
  creditsLabel: string | null;
  showWeekly: boolean;
};

export type LocalUsageSummaryLabels = {
  hasUsage: boolean;
  todayLabel: string;
  weekLabel: string;
  updatedLabel: string | null;
};

const clampPercent = (value: number) =>
  Math.min(Math.max(Math.round(value), 0), 100);

function formatResetLabel(resetsAt?: number | null) {
  if (typeof resetsAt !== "number" || !Number.isFinite(resetsAt)) {
    return null;
  }
  const resetMs = resetsAt > 1_000_000_000_000 ? resetsAt : resetsAt * 1000;
  const relative = formatRelativeTime(resetMs)
    .replace(/^in\s+/i, "")
    .replace(/后$/, "");
  return `${relative}后重置`;
}

function formatCreditsLabel(accountRateLimits: RateLimitSnapshot | null) {
  const credits = accountRateLimits?.credits ?? null;
  if (!credits?.hasCredits) {
    return null;
  }
  if (credits.unlimited) {
    return "可用 Credits：无限";
  }
  const balance = credits.balance?.trim() ?? "";
  if (!balance) {
    return null;
  }
  const intValue = Number.parseInt(balance, 10);
  if (Number.isFinite(intValue) && intValue > 0) {
    return `可用 Credits：${intValue}`;
  }
  const floatValue = Number.parseFloat(balance);
  if (Number.isFinite(floatValue) && floatValue > 0) {
    const rounded = Math.round(floatValue);
    return rounded > 0 ? `可用 Credits：${rounded}` : null;
  }
  return null;
}

function formatCompactTokens(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1000)}K`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(Math.round(value));
}

export function getLocalUsageSummaryLabels(
  localUsageSnapshot: LocalUsageSnapshot | null,
): LocalUsageSummaryLabels {
  const days = localUsageSnapshot?.days ?? [];
  const latestDay = days[days.length - 1] ?? null;
  const last7DaysTokens = days
    .slice(-7)
    .reduce((total, day) => total + day.totalTokens, 0);
  const hasUsage =
    Boolean(localUsageSnapshot) &&
    (last7DaysTokens > 0 || days.some((day) => day.agentRuns > 0 || day.agentTimeMs > 0));

  return {
    hasUsage,
    todayLabel: `${formatCompactTokens(latestDay?.totalTokens ?? 0)} tokens`,
    weekLabel: `${formatCompactTokens(last7DaysTokens)} tokens`,
    updatedLabel: localUsageSnapshot
      ? `${formatRelativeTime(localUsageSnapshot.updatedAt)
          .replace(/^in\s+/i, "")
          .replace(/后$/, "")}更新`
      : null,
  };
}

export function getUsageLabels(
  accountRateLimits: RateLimitSnapshot | null,
  showRemaining: boolean,
): UsageLabels {
  const usagePercent = accountRateLimits?.primary?.usedPercent;
  const globalUsagePercent = accountRateLimits?.secondary?.usedPercent;
  const sessionPercent =
    typeof usagePercent === "number"
      ? showRemaining
        ? 100 - clampPercent(usagePercent)
        : clampPercent(usagePercent)
      : null;
  const weeklyPercent =
    typeof globalUsagePercent === "number"
      ? showRemaining
        ? 100 - clampPercent(globalUsagePercent)
        : clampPercent(globalUsagePercent)
      : null;

  return {
    sessionPercent,
    weeklyPercent,
    sessionResetLabel: formatResetLabel(accountRateLimits?.primary?.resetsAt),
    weeklyResetLabel: formatResetLabel(accountRateLimits?.secondary?.resetsAt),
    creditsLabel: formatCreditsLabel(accountRateLimits),
    showWeekly: Boolean(accountRateLimits?.secondary),
  };
}
