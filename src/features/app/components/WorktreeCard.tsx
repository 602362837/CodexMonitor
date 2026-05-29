import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import type { WorkspaceInfo } from "../../../types";
import { getWorkspaceDisplayName } from "../../workspaces/domain/workspaceDisplay";

type WorktreeCardProps = {
  worktree: WorkspaceInfo;
  worktreeName?: ReactNode;
  isActive: boolean;
  isDeleting?: boolean;
  isEditingName?: boolean;
  editingName?: string;
  onSelectWorkspace: (id: string) => void;
  onShowWorktreeMenu: (event: MouseEvent, worktree: WorkspaceInfo) => void;
  onToggleWorkspaceCollapse: (workspaceId: string, collapsed: boolean) => void;
  onConnectWorkspace: (workspace: WorkspaceInfo) => void;
  onStartEditingName?: (workspace: WorkspaceInfo) => void;
  onEditingNameChange?: (value: string) => void;
  onCommitEditingName?: () => void;
  onCancelEditingName?: () => void;
  children?: ReactNode;
};

export function WorktreeCard({
  worktree,
  worktreeName,
  isActive,
  isDeleting = false,
  isEditingName = false,
  editingName = "",
  onSelectWorkspace,
  onShowWorktreeMenu,
  onToggleWorkspaceCollapse,
  onConnectWorkspace,
  onStartEditingName,
  onEditingNameChange,
  onCommitEditingName,
  onCancelEditingName,
  children,
}: WorktreeCardProps) {
  const worktreeCollapsed = worktree.settings.sidebarCollapsed;
  const worktreeBranch = worktree.worktree?.branch ?? "";
  const worktreeLabel = getWorkspaceDisplayName(worktree).trim() || worktreeBranch;
  const worktreeMeta =
    worktreeBranch && worktreeBranch !== worktreeLabel ? worktreeBranch : null;
  const contentCollapsedClass = worktreeCollapsed ? " collapsed" : "";
  const handleEditingKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitEditingName?.();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEditingName?.();
    }
  };

  return (
    <div className={`worktree-card${isDeleting ? " deleting" : ""}`}>
      <div
        className={`worktree-row ${isActive ? "active" : ""}${isDeleting ? " deleting" : ""}`}
        role="button"
        tabIndex={isDeleting ? -1 : 0}
        aria-disabled={isDeleting}
        onClick={() => {
          if (!isDeleting && !isEditingName) {
            onSelectWorkspace(worktree.id);
          }
        }}
        onContextMenu={(event) => {
          if (!isDeleting) {
            onShowWorktreeMenu(event, worktree);
          }
        }}
        onDoubleClick={(event) => {
          if (!isDeleting) {
            event.stopPropagation();
            onStartEditingName?.(worktree);
          }
        }}
        onKeyDown={(event) => {
          if (isDeleting || isEditingName) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectWorkspace(worktree.id);
          }
        }}
      >
        <div className="worktree-copy">
          {isEditingName ? (
            <input
              className="worktree-name-input"
              value={editingName}
              autoFocus
              placeholder={worktree.name}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onChange={(event) => onEditingNameChange?.(event.target.value)}
              onBlur={() => onCommitEditingName?.()}
              onKeyDown={handleEditingKeyDown}
              data-tauri-drag-region="false"
              aria-label="编辑工作树显示名称"
            />
          ) : (
            <div className="worktree-label">{worktreeName ?? worktreeLabel}</div>
          )}
          {worktreeMeta && <div className="worktree-meta">{worktreeMeta}</div>}
        </div>
        <div className="worktree-actions">
          {isDeleting ? (
            <div className="worktree-deleting" role="status" aria-live="polite">
              <span className="worktree-deleting-spinner" aria-hidden />
              <span className="worktree-deleting-label">删除中</span>
            </div>
          ) : (
            <>
              <button
                className={`worktree-toggle ${worktreeCollapsed ? "" : "expanded"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleWorkspaceCollapse(worktree.id, !worktreeCollapsed);
                }}
                data-tauri-drag-region="false"
                aria-label={worktreeCollapsed ? "显示 agents" : "隐藏 agents"}
                aria-expanded={!worktreeCollapsed}
              >
                <span className="worktree-toggle-icon">›</span>
              </button>
              {!worktree.connected && (
                <span
                  className="connect"
                  title="连接工作区上下文到共享 Codex server"
                  onClick={(event) => {
                    event.stopPropagation();
                    onConnectWorkspace(worktree);
                  }}
                >
                  连接
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className={`worktree-card-content${contentCollapsedClass}`}
        aria-hidden={worktreeCollapsed}
        inert={worktreeCollapsed ? true : undefined}
      >
        <div className="worktree-card-content-inner">{children}</div>
      </div>
    </div>
  );
}
