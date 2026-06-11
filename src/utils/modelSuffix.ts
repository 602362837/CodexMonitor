export function normalizeModelSuffixOptions(options: string[] | null | undefined): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const option of options) {
    if (typeof option !== "string") {
      continue;
    }
    const trimmed = option.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

export function normalizeSelectedModelSuffix(
  value: string | null | undefined,
  options: string[],
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return options.includes(trimmed) ? trimmed : null;
}

export function appendModelSuffix(
  model: string | null | undefined,
  suffix: string | null | undefined,
): string | null {
  const trimmedModel = typeof model === "string" ? model.trim() : "";
  if (!trimmedModel) {
    return null;
  }
  const trimmedSuffix = typeof suffix === "string" ? suffix.trim() : "";
  return trimmedSuffix ? `${trimmedModel}${trimmedSuffix}` : trimmedModel;
}
