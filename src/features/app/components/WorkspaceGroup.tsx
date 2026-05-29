import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import type { DragEvent, ReactNode } from "react";

type WorkspaceGroupProps = {
  toggleId: string | null;
  groupId: string | null;
  name: string;
  isEditing?: boolean;
  editingValue?: string;
  showHeader: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  onEditingValueChange?: (value: string) => void;
  onCommitEditing?: () => void;
  onCancelEditing?: () => void;
  onRenameGroup?: (groupId: string, currentName: string) => void;
  onDeleteGroup?: (groupId: string, currentName: string) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>, groupId: string | null) => void;
  onDragEnter?: (event: DragEvent<HTMLDivElement>, groupId: string | null) => void;
  onDragLeave?: (event: DragEvent<HTMLDivElement>, groupId: string | null) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>, groupId: string | null) => void;
  isDropTarget?: boolean;
  children: ReactNode;
};

export function WorkspaceGroup({
  toggleId,
  groupId,
  name,
  isEditing = false,
  editingValue = "",
  showHeader,
  isCollapsed,
  onToggleCollapse,
  onEditingValueChange,
  onCommitEditing,
  onCancelEditing,
  onRenameGroup,
  onDeleteGroup,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDropTarget = false,
  children,
}: WorkspaceGroupProps) {
  const isToggleable = Boolean(toggleId);
  const canEditGroup = Boolean(groupId);
  return (
    <div
      className={`workspace-group${isDropTarget ? " is-drop-target" : ""}`}
      onDragOver={(event) => onDragOver?.(event, groupId)}
      onDragEnter={(event) => onDragEnter?.(event, groupId)}
      onDragLeave={(event) => onDragLeave?.(event, groupId)}
      onDrop={(event) => onDrop?.(event, groupId)}
    >
      {showHeader && (
        <div
          className={`workspace-group-header${isToggleable ? " is-toggleable" : ""}`}
          onClick={
            toggleId && !isEditing
              ? () => {
                  onToggleCollapse(toggleId);
                }
              : undefined
          }
          onKeyDown={
            toggleId && !isEditing
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggleCollapse(toggleId);
                  }
                }
              : undefined
          }
          role={isToggleable && !isEditing ? "button" : undefined}
          aria-label={
            isToggleable && !isEditing
              ? `${isCollapsed ? "展开" : "收起"}分组`
              : undefined
          }
          aria-expanded={isToggleable ? !isCollapsed : undefined}
          tabIndex={isToggleable && !isEditing ? 0 : undefined}
        >
          {isEditing ? (
            <input
              className="workspace-group-name-input"
              value={editingValue}
              autoFocus
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onEditingValueChange?.(event.target.value)}
              onBlur={() => onCommitEditing?.()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommitEditing?.();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEditing?.();
                }
              }}
              aria-label="分组名称"
            />
          ) : (
            <div className="workspace-group-label">{name}</div>
          )}
          <div className="workspace-group-actions">
            {canEditGroup && onRenameGroup && (
              <button
                className="group-action"
                onClick={(event) => {
                  event.stopPropagation();
                  if (groupId) {
                    onRenameGroup(groupId, name);
                  }
                }}
                aria-label="重命名分组"
                type="button"
              >
                <Pencil aria-hidden />
              </button>
            )}
            {canEditGroup && onDeleteGroup && (
              <button
                className="group-action"
                onClick={(event) => {
                  event.stopPropagation();
                  if (groupId) {
                    onDeleteGroup(groupId, name);
                  }
                }}
                aria-label="删除分组"
                type="button"
              >
                <Trash2 aria-hidden />
              </button>
            )}
            {isToggleable && (
              <button
                className={`group-toggle ${isCollapsed ? "" : "expanded"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!toggleId) {
                    return;
                  }
                  onToggleCollapse(toggleId);
                }}
                aria-label={isCollapsed ? "展开分组" : "收起分组"}
                aria-expanded={!isCollapsed}
                type="button"
              >
                <span className="group-toggle-icon">›</span>
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`workspace-group-list ${isCollapsed ? "collapsed" : ""}`}>
        <div className="workspace-group-content">{children}</div>
      </div>
    </div>
  );
}
