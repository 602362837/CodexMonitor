import Search from "lucide-react/dist/esm/icons/search";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelOption } from "../../../types";
import { ModalShell } from "../../design-system/components/modal/ModalShell";

type ComposerModelPickerModalProps = {
  models: ModelOption[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  onClose: () => void;
  onRefreshModels?: () => Promise<void> | void;
};

const UNTAGGED_FILTER = "__untagged__";

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareModelsByName(a: ModelOption, b: ModelOption): number {
  const aLabel = a.displayName.trim() || a.model.trim();
  const bLabel = b.displayName.trim() || b.model.trim();
  return collator.compare(aLabel, bLabel);
}

function modelProviderTags(model: ModelOption): string[] {
  return model.providerTags ?? [];
}

function hasNoProviderTags(model: ModelOption): boolean {
  return modelProviderTags(model).length === 0;
}

function shouldShowModelSlug(model: ModelOption): boolean {
  return model.displayName.trim().toLowerCase() !== model.model.trim().toLowerCase();
}

function matchesQuery(model: ModelOption, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const haystack = [
    model.displayName,
    model.model,
    model.description,
    ...modelProviderTags(model),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function ComposerModelPickerModal({
  models,
  selectedModelId,
  onSelectModel,
  onClose,
  onRefreshModels,
}: ComposerModelPickerModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? null,
    [models, selectedModelId],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    let hasUntagged = false;
    for (const model of models) {
      const providerTags = modelProviderTags(model);
      if (providerTags.length === 0) {
        hasUntagged = true;
      }
      for (const tag of providerTags) {
        const trimmed = tag.trim();
        if (trimmed.length > 0) {
          tags.add(trimmed);
        }
      }
    }
    const orderedTags = Array.from(tags).sort(collator.compare);
    return hasUntagged ? ["无标签", ...orderedTags] : orderedTags;
  }, [models]);

  const visibleModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...models]
      .sort(compareModelsByName)
      .filter((model) => matchesQuery(model, normalizedQuery))
      .filter((model) => {
        if (selectedTags.length === 0) {
          return true;
        }
        const tags = new Set(modelProviderTags(model));
        return selectedTags.some((tag) =>
          tag === UNTAGGED_FILTER ? hasNoProviderTags(model) : tags.has(tag),
        );
      });
  }, [models, query, selectedTags]);

  const handleToggleTag = (tag: string) => {
    const normalizedTag = tag === "无标签" ? UNTAGGED_FILTER : tag;
    setSelectedTags((current) =>
      current.includes(normalizedTag)
        ? current.filter((currentTag) => currentTag !== normalizedTag)
        : [...current, normalizedTag],
    );
  };

  const handleRefresh = async () => {
    if (!onRefreshModels || isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    try {
      await onRefreshModels();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <ModalShell
      className="composer-model-picker-modal"
      cardClassName="composer-model-picker-modal-card"
      onBackdropClick={onClose}
      ariaLabel="选择模型"
    >
      <div className="composer-model-picker-header">
        <div className="ds-modal-title">选择模型</div>
        <div className="ds-modal-subtitle">
          {selectedModel?.displayName?.trim() || selectedModel?.model || "尚未选择模型"}
        </div>
      </div>
      <div className="composer-model-picker-search">
        <Search size={14} aria-hidden />
        <input
          ref={inputRef}
          className="composer-model-picker-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="搜索模型或提供商"
        />
      </div>
      <div className="composer-model-picker-tags-row">
        <div className="composer-model-picker-tags" role="group" aria-label="提供商筛选">
          {allTags.map((tag) => {
            const normalizedTag = tag === "无标签" ? UNTAGGED_FILTER : tag;
            const active = selectedTags.includes(normalizedTag);
            return (
              <button
                key={tag}
                type="button"
                className={`composer-model-picker-tag${active ? " is-active" : ""}`}
                onClick={() => handleToggleTag(tag)}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="icon-button composer-model-picker-refresh"
          onClick={handleRefresh}
          disabled={!onRefreshModels || isRefreshing}
          aria-label="刷新模型列表"
          title="刷新模型列表"
        >
          <RefreshCw
            size={14}
            aria-hidden
            className={
              isRefreshing
                ? "composer-model-picker-refresh-icon spinning"
                : "composer-model-picker-refresh-icon"
            }
          />
        </button>
      </div>
      <div className="composer-model-picker-list" role="listbox" aria-label="模型列表">
        {visibleModels.length === 0 ? (
          <div className="composer-model-picker-empty">没有匹配的模型</div>
        ) : (
          visibleModels.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                type="button"
                className={`composer-model-picker-item${isSelected ? " is-selected" : ""}`}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                role="option"
                aria-selected={isSelected}
              >
                <div className="composer-model-picker-item-head">
                  <span className="composer-model-picker-item-name">
                    {model.displayName || model.model}
                  </span>
                  {modelProviderTags(model).length > 0 && (
                    <span className="composer-model-picker-item-tags">
                      {modelProviderTags(model).map((tag) => (
                        <span key={tag} className="composer-model-picker-item-tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {shouldShowModelSlug(model) && (
                  <div className="composer-model-picker-item-model">{model.model}</div>
                )}
                {model.description.trim().length > 0 && (
                  <div className="composer-model-picker-item-description">
                    {model.description}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </ModalShell>
    ,
    document.body,
  );
}
