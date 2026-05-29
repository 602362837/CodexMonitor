import type { AppSettings, ModelOption } from "@/types";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsToggleSwitch,
} from "@/features/design-system/components/settings/SettingsPrimitives";

type SettingsGitSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  models: ModelOption[];
  commitMessagePromptDraft: string;
  commitMessagePromptDirty: boolean;
  commitMessagePromptSaving: boolean;
  onSetCommitMessagePromptDraft: (value: string) => void;
  onSaveCommitMessagePrompt: () => Promise<void>;
  onResetCommitMessagePrompt: () => Promise<void>;
};

export function SettingsGitSection({
  appSettings,
  onUpdateAppSettings,
  models,
  commitMessagePromptDraft,
  commitMessagePromptDirty,
  commitMessagePromptSaving,
  onSetCommitMessagePromptDraft,
  onSaveCommitMessagePrompt,
  onResetCommitMessagePrompt,
}: SettingsGitSectionProps) {
  return (
    <SettingsSection
      title="Git"
      subtitle="管理 Git 侧栏加载 diff 的方式。"
    >
      <SettingsToggleRow
        title="预加载 git diffs"
        subtitle="让查看 git diff 更快。"
      >
        <SettingsToggleSwitch
          pressed={appSettings.preloadGitDiffs}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              preloadGitDiffs: !appSettings.preloadGitDiffs,
            })
          }
        />
      </SettingsToggleRow>
      <SettingsToggleRow
        title="忽略空白字符改动"
        subtitle="在本地和 commit diffs 中隐藏仅空白字符变化。"
      >
        <SettingsToggleSwitch
          pressed={appSettings.gitDiffIgnoreWhitespaceChanges}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              gitDiffIgnoreWhitespaceChanges: !appSettings.gitDiffIgnoreWhitespaceChanges,
            })
          }
        />
      </SettingsToggleRow>
      <div className="settings-field">
        <div className="settings-field-label">提交信息提示词</div>
        <div className="settings-help">
          Used when generating commit messages. Include <code>{"{diff}"}</code> to insert the
          git diff.
        </div>
        <textarea
          className="settings-agents-textarea"
          value={commitMessagePromptDraft}
          onChange={(event) => onSetCommitMessagePromptDraft(event.target.value)}
          spellCheck={false}
          disabled={commitMessagePromptSaving}
        />
        <div className="settings-field-actions">
          <button
            type="button"
            className="ghost settings-button-compact"
            onClick={() => {
              void onResetCommitMessagePrompt();
            }}
            disabled={commitMessagePromptSaving || !commitMessagePromptDirty}
          >
            Reset
          </button>
          <button
            type="button"
            className="primary settings-button-compact"
            onClick={() => {
              void onSaveCommitMessagePrompt();
            }}
            disabled={commitMessagePromptSaving || !commitMessagePromptDirty}
          >
            {commitMessagePromptSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
      {models.length > 0 && (
        <div className="settings-field">
          <label className="settings-field-label" htmlFor="commit-message-model-select">
            Commit message model
          </label>
          <div className="settings-help">
            The model used when generating commit messages. Leave on default to use the
            workspace model.
          </div>
          <select
            id="commit-message-model-select"
            className="settings-select"
            value={appSettings.commitMessageModelId ?? ""}
            onChange={(event) => {
              const value = event.target.value || null;
              void onUpdateAppSettings({
                ...appSettings,
                commitMessageModelId: value,
              });
            }}
          >
            <option value="">默认</option>
            {models.map((model) => (
              <option key={model.id} value={model.model}>
                {model.displayName?.trim() || model.model}
              </option>
            ))}
          </select>
        </div>
      )}
    </SettingsSection>
  );
}
