import type { GitPanelMode } from "../types";
import ArrowLeftRight from "lucide-react/dist/esm/icons/arrow-left-right";
import Download from "lucide-react/dist/esm/icons/download";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";

type GitMode = GitPanelMode;

type GitPanelModeStatusProps = {
  mode: GitMode;
  diffStatusLabel: string;
  perFileDiffStatusLabel: string;
  logCountLabel: string;
  logSyncLabel: string;
  logUpstreamLabel: string;
  issuesLoading: boolean;
  issuesTotal: number;
  pullRequestsLoading: boolean;
  pullRequestsTotal: number;
};

export function GitPanelModeStatus({
  mode,
  diffStatusLabel,
  perFileDiffStatusLabel,
  logCountLabel,
  logSyncLabel,
  logUpstreamLabel,
  issuesLoading,
  issuesTotal,
  pullRequestsLoading,
  pullRequestsTotal,
}: GitPanelModeStatusProps) {
  if (mode === "diff") {
    return <div className="diff-status">{diffStatusLabel}</div>;
  }

  if (mode === "perFile") {
    return <div className="diff-status">{perFileDiffStatusLabel}</div>;
  }

  if (mode === "log") {
    return (
      <>
        <div className="diff-status">{logCountLabel}</div>
        <div className="git-log-sync">
          <span>{logSyncLabel}</span>
          {logUpstreamLabel && (
            <>
              <span className="git-log-sep">·</span>
              <span>{logUpstreamLabel}</span>
            </>
          )}
        </div>
      </>
    );
  }

  if (mode === "issues") {
    return (
      <>
        <div className="diff-status diff-status-issues">
          <span>GitHub issues</span>
          {issuesLoading && <span className="git-panel-spinner" aria-hidden />}
        </div>
        <div className="git-log-sync">
          <span>{issuesTotal} 个打开</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="diff-status diff-status-issues">
        <span>GitHub pull requests</span>
        {pullRequestsLoading && <span className="git-panel-spinner" aria-hidden />}
      </div>
      <div className="git-log-sync">
        <span>{pullRequestsTotal} 个打开</span>
      </div>
    </>
  );
}

type GitBranchRowProps = {
  mode: GitMode;
  branchName: string;
  onPull?: () => void | Promise<void>;
  pullLoading: boolean;
  onFetch?: () => void | Promise<void>;
  fetchLoading: boolean;
};

export function GitBranchRow({
  mode,
  branchName,
  onPull,
  pullLoading,
  onFetch,
  fetchLoading,
}: GitBranchRowProps) {
  if (mode !== "diff" && mode !== "perFile" && mode !== "log") {
    return null;
  }

  const isBusy = pullLoading || fetchLoading;

  return (
    <div className="diff-branch-row">
      <div className="diff-branch-meta">
        <span className="diff-branch-label">分支</span>
        <div className="diff-branch">{branchName || "未知"}</div>
      </div>
      <div className="diff-branch-actions" role="group" aria-label="当前分支操作">
        <button
          type="button"
          className="diff-branch-refresh"
          onClick={() => void onPull?.()}
          disabled={!onPull || isBusy}
          title={pullLoading ? "正在 Pull 当前分支..." : "Pull 当前分支"}
          aria-label={pullLoading ? "正在 Pull 当前分支" : "Pull 当前分支"}
        >
          {pullLoading ? (
            <span className="git-panel-spinner" aria-hidden />
          ) : (
            <Download size={12} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className="diff-branch-refresh"
          onClick={() => void onFetch?.()}
          disabled={!onFetch || isBusy}
          title={fetchLoading ? "正在获取远端..." : "获取远端"}
          aria-label={fetchLoading ? "正在获取远端" : "获取远端"}
        >
          {fetchLoading ? (
            <span className="git-panel-spinner" aria-hidden />
          ) : (
            <RotateCw size={12} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

type GitRootCurrentPathProps = {
  mode: GitMode;
  hasGitRoot: boolean;
  gitRoot: string | null;
  onScanGitRoots?: () => void;
  gitRootScanLoading: boolean;
};

export function GitRootCurrentPath({
  mode,
  hasGitRoot,
  gitRoot,
  onScanGitRoots,
  gitRootScanLoading,
}: GitRootCurrentPathProps) {
  if (mode === "issues" || !hasGitRoot) {
    return null;
  }

  return (
    <div className="git-root-current">
      <div className="git-root-current-main">
        <span className="git-root-label">仓库根目录</span>
        <span className="git-root-path" title={gitRoot ?? ""}>
          {gitRoot}
        </span>
      </div>
      {onScanGitRoots && (
        <button
          type="button"
          className="ghost git-root-button git-root-button--icon"
          onClick={onScanGitRoots}
          disabled={gitRootScanLoading}
        >
          <ArrowLeftRight className="git-root-button-icon" aria-hidden />
          更改
        </button>
      )}
    </div>
  );
}
