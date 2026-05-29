import type { CodexFeature } from "@/types";
import {
  SettingsSection,
  SettingsSubsection,
  SettingsToggleRow,
  SettingsToggleSwitch,
} from "@/features/design-system/components/settings/SettingsPrimitives";
import type { SettingsFeaturesSectionProps } from "@settings/hooks/useSettingsFeaturesSection";
import { fileManagerName, openInFileManagerLabel } from "@utils/platformPaths";

const FEATURE_DESCRIPTION_FALLBACKS: Record<string, string> = {
  undo: "每轮创建一个 ghost commit。",
  shell_tool: "启用默认 shell 工具。",
  unified_exec: "使用单一的 PTY-backed unified exec 工具。",
  shell_zsh_fork: "试验性地为 zsh shell 会话使用 fork 流程。",
  shell_snapshot: "启用 shell 快照。",
  js_repl: "启用由持久 Node kernel 支持的 JavaScript REPL 工具。",
  code_mode: "试验中的 Code Mode 开关，普通使用不建议开启。",
  code_mode_only: "仅启用 Code Mode 的内部实验开关。",
  js_repl_tools_only: "仅将 js_repl 工具直接暴露给模型。",
  terminal_resize_reflow:
    "终端宽度变化时，重排 Codex 维护的终端输出记录，减少换行错位。",
  web_search_request: "已弃用。请改用顶层 web_search。",
  web_search_cached: "已弃用。请改用顶层 web_search。",
  search_tool: "已移除的旧搜索开关，仅为向后兼容保留。",
  codex_git_commit: "已移除的旧 Git commit 功能开关。",
  runtime_metrics: "通过手动 reader 启用运行时指标快照。",
  sqlite: "将 rollout 元数据持久化到本地 SQLite 数据库。",
  memories: "允许 Codex 从对话中生成记忆，并在新对话里引用相关记忆。",
  chronicle: "内部实验性的会话记录/历史能力。",
  child_agents_md: "把额外 AGENTS.md 指引追加到用户说明中。",
  apply_patch_freeform: "包含 freeform apply_patch 工具。",
  apply_patch_streaming_events: "为 apply_patch 输出更细粒度的 streaming events。",
  exec_permission_approvals: "使用新版命令执行权限审批流程。",
  hooks: "启用 Codex hooks，用于在关键流程前后运行自动化。",
  request_permissions_tool: "启用模型请求权限变更的内部工具。",
  use_linux_sandbox_bwrap: "使用基于 bubblewrap 的 Linux sandbox 流程。",
  use_legacy_landlock: "使用旧版 Linux Landlock sandbox 实现。",
  request_rule: "允许批准请求和 exec 规则提案。",
  experimental_windows_sandbox:
    "已移除的 Windows sandbox 开关，仅为向后兼容保留。",
  elevated_windows_sandbox:
    "已移除的 elevated Windows sandbox 开关，仅为向后兼容保留。",
  remote_models: "在 AppReady 之前刷新远程模型。",
  powershell_utf8: "强制 PowerShell 使用 UTF-8 输出。",
  enable_request_compression:
    "压缩发送到 codex-backend 的 streaming request body。",
  network_proxy: "对已有网络权限的 sandbox 会话追加网络代理限制。",
  multi_agent: "启用多智能体能力和对应工具。",
  multi_agent_v2: "启用新版多智能体内部实验能力。",
  enable_fanout: "启用内部 fanout 并行执行实验能力。",
  apps: "启用 ChatGPT Apps 集成。",
  enable_mcp_apps: "启用 MCP Apps 相关实验能力。",
  apps_mcp_path_override: "允许覆盖 Apps MCP 路径，主要用于开发调试。",
  tool_search: "已移除的工具搜索开关。",
  tool_search_always_defer_mcp_tools:
    "工具搜索始终延迟加载 MCP 工具的内部实验开关。",
  unavailable_dummy_tools: "已移除的占位工具开关。",
  tool_suggest: "启用工具建议能力。",
  plugins: "启用 Codex 插件系统。",
  plugin_hooks: "允许插件注册 hooks。",
  in_app_browser: "启用 Codex 内置浏览器工具。",
  browser_use: "启用 browser-use 浏览器自动化能力。",
  browser_use_external: "启用外部浏览器自动化能力。",
  computer_use: "启用本机应用的 Computer Use 操作能力。",
  remote_plugin: "启用远程插件相关实验能力。",
  plugin_sharing: "启用插件分享能力。",
  external_migration: "检测到可迁移的外部 agent 配置时，在启动时提示导入。",
  image_generation: "启用图片生成工具。",
  skill_mcp_dependency_install:
    "允许提示并安装缺失的 MCP 依赖。",
  skill_env_var_dependency_prompt:
    "提示缺失的 skill 环境变量依赖。",
  mentions_v2: "使用统一的 @ 提及弹窗选择文件、文件夹、Apps、插件和 Skills。",
  steer: "在 Codex 支持时启用 turn steering 能力。",
  default_mode_request_user_input:
    "允许 Default 模式下通过请求用户输入工具进行交互。",
  guardian_approval: "启用 Guardian 审批/安全提示流程。",
  goals: "启用目标跟踪能力。",
  tool_call_mcp_elicitation: "允许 MCP 工具调用触发结构化补充输入请求。",
  auth_elicitation: "启用认证相关的补充输入实验流程。",
  collaboration_modes: "启用 collaboration mode 预设。",
  personality: "启用 personality 选择。",
  artifact: "启用 artifact 相关内部实验能力。",
  fast_mode: "启用快速模式和相关服务层级选择。",
  realtime_conversation: "启用实时语音/对话实验能力。",
  remote_control: "已移除的远程控制开关。",
  image_detail_original: "已移除的原图细节输入开关。",
  tui_app_server: "已移除的 TUI app-server 兼容开关。",
  prevent_idle_sleep: "Codex 运行任务时保持电脑唤醒。",
  workspace_owner_usage_nudge: "已移除的 workspace owner 用量提醒开关。",
  responses_websockets:
    "默认对 OpenAI 使用 Responses API WebSocket transport。",
  responses_websockets_v2: "启用 Responses API WebSocket v2 模式。",
  responses_websocket_response_processed:
    "启用 Responses WebSocket response processed 事件实验。",
  remote_compaction_v2: "启用远端压缩流程 v2 实验。",
  workspace_dependencies: "启用工作区依赖运行时发现能力。",
};

function formatFeatureLabel(feature: CodexFeature): string {
  const displayName = feature.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  return feature.name
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function featureSubtitle(feature: CodexFeature): string {
  const fallbackDescription = FEATURE_DESCRIPTION_FALLBACKS[feature.name];
  const sourceDescription =
    feature.description?.trim() || feature.announcement?.trim() || "";
  if (fallbackDescription && sourceDescription) {
    return `${fallbackDescription} 原文：${sourceDescription}`;
  }
  if (fallbackDescription) {
    return fallbackDescription;
  }
  if (sourceDescription) {
    return `Codex 原文说明：${sourceDescription}`;
  }
  if (feature.stage === "deprecated") {
    return "已弃用的 feature flag。";
  }
  if (feature.stage === "removed") {
    return "为向后兼容保留的旧 feature flag。";
  }
  return `配置键：features.${feature.name}。Codex 未提供说明。`;
}

export function SettingsFeaturesSection({
  appSettings,
  hasFeatureWorkspace,
  openConfigError,
  featureError,
  featuresLoading,
  featureUpdatingKey,
  stableFeatures,
  experimentalFeatures,
  hasDynamicFeatureRows,
  onOpenConfig,
  onToggleCodexFeature,
  onUpdateAppSettings,
}: SettingsFeaturesSectionProps) {
  return (
    <SettingsSection
      title="功能"
      subtitle="管理稳定和实验性的 Codex features。"
    >
      <SettingsToggleRow
        title="配置文件"
        subtitle={`在 ${fileManagerName()} 中打开 Codex 配置。`}
      >
        <button type="button" className="ghost" onClick={onOpenConfig}>
          {openInFileManagerLabel()}
        </button>
      </SettingsToggleRow>
      {openConfigError && <div className="settings-help">{openConfigError}</div>}
      <SettingsSubsection
        title="稳定 Features"
        subtitle="默认启用、可用于生产的 features。"
      />
      <SettingsToggleRow
        title="个性"
        subtitle={
          <>
            选择 Codex 沟通风格（写入 config.toml 顶层 <code>personality</code>）。
          </>
        }
      >
        <select
          id="features-personality-select"
          className="settings-select"
          value={appSettings.personality}
          onChange={(event) =>
            void onUpdateAppSettings({
              ...appSettings,
              personality: event.target.value as (typeof appSettings)["personality"],
            })
          }
          aria-label="个性"
        >
          <option value="friendly">友好</option>
          <option value="pragmatic">务实</option>
        </select>
      </SettingsToggleRow>
      <SettingsToggleRow
        title="需要响应时暂停排队消息"
        subtitle="当 Codex 等待接受/修改计划或你的回答时，保持队列消息暂停。"
      >
        <SettingsToggleSwitch
          pressed={appSettings.pauseQueuedMessagesWhenResponseRequired}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              pauseQueuedMessagesWhenResponseRequired:
                !appSettings.pauseQueuedMessagesWhenResponseRequired,
            })
          }
        />
      </SettingsToggleRow>
      {stableFeatures.map((feature) => (
        <SettingsToggleRow
          key={feature.name}
          title={formatFeatureLabel(feature)}
          subtitle={featureSubtitle(feature)}
        >
          <SettingsToggleSwitch
            pressed={feature.enabled}
            onClick={() => onToggleCodexFeature(feature)}
            disabled={featureUpdatingKey === feature.name}
          />
        </SettingsToggleRow>
      ))}
      {hasFeatureWorkspace &&
        !featuresLoading &&
        !featureError &&
        stableFeatures.length === 0 && (
        <div className="settings-help">Codex 未返回稳定 feature flags。</div>
      )}
      <SettingsSubsection
        title="实验 Features"
        subtitle="预览和开发中的 features。"
      />
      {experimentalFeatures.map((feature) => (
        <SettingsToggleRow
          key={feature.name}
          title={formatFeatureLabel(feature)}
          subtitle={featureSubtitle(feature)}
        >
          <SettingsToggleSwitch
            pressed={feature.enabled}
            onClick={() => onToggleCodexFeature(feature)}
            disabled={featureUpdatingKey === feature.name}
          />
        </SettingsToggleRow>
      ))}
      {hasFeatureWorkspace &&
        !featuresLoading &&
        !featureError &&
        hasDynamicFeatureRows &&
        experimentalFeatures.length === 0 && (
          <div className="settings-help">
            Codex 未返回预览或开发中的 feature flags。
          </div>
        )}
      {featuresLoading && (
        <div className="settings-help">正在加载 Codex feature flags...</div>
      )}
      {!hasFeatureWorkspace && !featuresLoading && (
        <div className="settings-help">
          连接工作区以加载 Codex feature flags。
        </div>
      )}
      {featureError && <div className="settings-help">{featureError}</div>}
    </SettingsSection>
  );
}
