import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";

import type { WorkspaceInfo } from "../../../types";

type WorkspaceGroupOption = {
  id: string;
  name: string;
};

type WorkspaceCardProps = {
  workspace: WorkspaceInfo;
  workspaceName?: ReactNode;
  summary?: string | null;
  isEditingName?: boolean;
  editingName?: string;
  isActive: boolean;
  isCollapsed: boolean;
  addMenuOpen: boolean;
  addMenuWidth: number;
  onSelectWorkspace: (id: string) => void;
  onShowWorkspaceMenu: (event: MouseEvent, workspace: WorkspaceInfo) => void;
  onToggleWorkspaceCollapse: (workspaceId: string, collapsed: boolean) => void;
  onStartEditingName?: (workspace: WorkspaceInfo) => void;
  onEditingNameChange?: (value: string) => void;
  onCommitEditingName?: () => void;
  onCancelEditingName?: () => void;
  onConnectWorkspace: (workspace: WorkspaceInfo) => void;
  workspaceGroups?: WorkspaceGroupOption[];
  onAssignWorkspaceGroup?: (workspaceId: string, groupId: string | null) => void;
  onToggleAddMenu: (anchor: {
    workspaceId: string;
    top: number;
    left: number;
    width: number;
  } | null) => void;
  onWorkspaceDragStart?: (
    event: DragEvent<HTMLDivElement>,
    workspace: WorkspaceInfo,
  ) => void;
  onWorkspaceDragEnd?: () => void;
  children?: ReactNode;
};

export function WorkspaceCard({
  workspace,
  workspaceName,
  summary = null,
  isEditingName = false,
  editingName = "",
  isActive,
  isCollapsed,
  addMenuOpen,
  addMenuWidth,
  onSelectWorkspace,
  onShowWorkspaceMenu,
  onToggleWorkspaceCollapse,
  onStartEditingName,
  onEditingNameChange,
  onCommitEditingName,
  onCancelEditingName,
  onConnectWorkspace,
  workspaceGroups = [],
  onAssignWorkspaceGroup,
  onToggleAddMenu,
  onWorkspaceDragStart,
  onWorkspaceDragEnd,
  children,
}: WorkspaceCardProps) {
  const contentCollapsedClass = isCollapsed ? " collapsed" : "";
  const showGroupSelector = !isEditingName && workspaceGroups.length > 0;
  const workspaceGroupId = workspace.settings.groupId ?? null;
  const selectedGroupId =
    workspaceGroupId && workspaceGroups.some((group) => group.id === workspaceGroupId)
      ? workspaceGroupId
      : "";
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
    <div
      className="workspace-card"
      draggable={Boolean(onWorkspaceDragStart)}
      onDragStart={
        onWorkspaceDragStart
          ? (event) => onWorkspaceDragStart(event, workspace)
          : undefined
      }
      onDragEnd={onWorkspaceDragEnd}
    >
      <div
        className={`workspace-row ${isActive ? "active" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isEditingName) {
            onSelectWorkspace(workspace.id);
          }
        }}
        onContextMenu={(event) => onShowWorkspaceMenu(event, workspace)}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onStartEditingName?.(workspace);
        }}
        onKeyDown={(event) => {
          if (isEditingName) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectWorkspace(workspace.id);
          }
        }}
      >
        <div className="workspace-copy">
          <div className="workspace-name-row">
            <div className="workspace-title">
              {isEditingName ? (
                <input
                  className="workspace-name-input"
                  value={editingName}
                  autoFocus
                  placeholder={workspace.name}
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onChange={(event) => onEditingNameChange?.(event.target.value)}
                  onBlur={() => onCommitEditingName?.()}
                  onKeyDown={handleEditingKeyDown}
                  data-tauri-drag-region="false"
                  aria-label="编辑工作区显示名称"
                />
              ) : (
                <span className="workspace-name">{workspaceName ?? workspace.name}</span>
              )}
              <button
                className={`workspace-toggle ${isCollapsed ? "" : "expanded"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleWorkspaceCollapse(workspace.id, !isCollapsed);
                }}
                data-tauri-drag-region="false"
                aria-label={isCollapsed ? "显示 agents" : "隐藏 agents"}
                aria-expanded={!isCollapsed}
              >
                <span className="workspace-toggle-icon">›</span>
              </button>
            </div>
          </div>
          {summary && <div className="workspace-summary">{summary}</div>}
        </div>
        <div className="workspace-actions">
          {showGroupSelector && (
            <select
              className="workspace-group-select"
              value={selectedGroupId}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                onAssignWorkspaceGroup?.(workspace.id, event.target.value || null);
              }}
              data-tauri-drag-region="false"
              aria-label={`修改 ${workspace.name} 分组`}
            >
              <option value="">未分组</option>
              {workspaceGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="ghost workspace-add"
            onClick={(event) => {
              event.stopPropagation();
              const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
              const left = Math.min(
                Math.max(rect.left, 12),
                window.innerWidth - addMenuWidth - 12,
              );
              const top = rect.bottom + 8;
              onToggleAddMenu(
                addMenuOpen
                  ? null
                  : {
                      workspaceId: workspace.id,
                      top,
                      left,
                      width: addMenuWidth,
                    },
              );
            }}
            data-tauri-drag-region="false"
            aria-label="添加 agent 选项"
            aria-expanded={addMenuOpen}
          >
            +
          </button>
          {!workspace.connected && (
            <span
              className="connect"
              title="连接工作区上下文到共享 Codex server"
              onClick={(event) => {
                event.stopPropagation();
                onConnectWorkspace(workspace);
              }}
            >
              连接
            </span>
          )}
        </div>
      </div>
      <div
        className={`workspace-card-content${contentCollapsedClass}`}
        aria-hidden={isCollapsed}
        inert={isCollapsed ? true : undefined}
      >
        <div className="workspace-card-content-inner">{children}</div>
      </div>
    </div>
  );
}
