import { useCallback, type MouseEvent } from "react";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { WorkspaceInfo } from "../../../types";
import { pushErrorToast } from "../../../services/toasts";
import { fileManagerName } from "../../../utils/platformPaths";

type SidebarMenuHandlers = {
  onDeleteThread: (workspaceId: string, threadId: string) => void;
  onArchiveWorkspaceThreads: (workspaceId: string) => Promise<string[]>;
  onSyncThread: (workspaceId: string, threadId: string) => void;
  onPinThread: (workspaceId: string, threadId: string) => void;
  onUnpinThread: (workspaceId: string, threadId: string) => void;
  isThreadPinned: (workspaceId: string, threadId: string) => boolean;
  onRenameThread: (workspaceId: string, threadId: string) => void;
  onRenameWorkspaceDisplayName: (workspace: WorkspaceInfo) => void;
  onReloadWorkspaceThreads: (workspaceId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDeleteWorktree: (workspaceId: string) => void;
};

export function useSidebarMenus({
  onDeleteThread,
  onArchiveWorkspaceThreads,
  onSyncThread,
  onPinThread,
  onUnpinThread,
  isThreadPinned,
  onRenameThread,
  onRenameWorkspaceDisplayName,
  onReloadWorkspaceThreads,
  onDeleteWorkspace,
  onDeleteWorktree,
}: SidebarMenuHandlers) {
  const showThreadMenu = useCallback(
    async (
      event: MouseEvent,
      workspaceId: string,
      threadId: string,
      canPin: boolean,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const renameItem = await MenuItem.new({
        text: "重命名",
        action: () => onRenameThread(workspaceId, threadId),
      });
      const syncItem = await MenuItem.new({
        text: "从服务器同步",
        action: () => onSyncThread(workspaceId, threadId),
      });
      const archiveItem = await MenuItem.new({
        text: "归档",
        action: () => onDeleteThread(workspaceId, threadId),
      });
      const copyItem = await MenuItem.new({
        text: "复制 ID",
        action: async () => {
          try {
            await navigator.clipboard.writeText(threadId);
          } catch {
            // Clipboard failures are non-fatal here.
          }
        },
      });
      const items = [renameItem, syncItem];
      if (canPin) {
        const isPinned = isThreadPinned(workspaceId, threadId);
        items.push(
          await MenuItem.new({
            text: isPinned ? "取消置顶" : "置顶",
            action: () => {
              if (isPinned) {
                onUnpinThread(workspaceId, threadId);
              } else {
                onPinThread(workspaceId, threadId);
              }
            },
          }),
        );
      }
      items.push(copyItem, archiveItem);
      const menu = await Menu.new({ items });
      const appWindow = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, appWindow);
    },
    [
      isThreadPinned,
      onDeleteThread,
      onPinThread,
      onRenameThread,
      onSyncThread,
      onUnpinThread,
    ],
  );

  const showWorkspaceMenu = useCallback(
    async (event: MouseEvent, workspace: WorkspaceInfo) => {
      event.preventDefault();
      event.stopPropagation();
      const workspaceId = workspace.id;
      const renameItem = await MenuItem.new({
        text: "修改显示名称",
        action: () => onRenameWorkspaceDisplayName(workspace),
      });
      const reloadItem = await MenuItem.new({
        text: "重新加载线程",
        action: () => onReloadWorkspaceThreads(workspaceId),
      });
      const archiveAllItem = await MenuItem.new({
        text: "一键归档全部会话",
        action: async () => {
          try {
            await onArchiveWorkspaceThreads(workspaceId);
          } catch (error) {
            pushErrorToast({
              title: "归档项目会话失败",
              message: error instanceof Error ? error.message : String(error),
            });
          }
        },
      });
      const deleteItem = await MenuItem.new({
        text: "删除",
        action: () => onDeleteWorkspace(workspaceId),
      });
      const menu = await Menu.new({
        items: [renameItem, reloadItem, archiveAllItem, deleteItem],
      });
      const appWindow = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, appWindow);
    },
    [
      onArchiveWorkspaceThreads,
      onDeleteWorkspace,
      onReloadWorkspaceThreads,
      onRenameWorkspaceDisplayName,
    ],
  );

  const showWorktreeMenu = useCallback(
    async (event: MouseEvent, worktree: WorkspaceInfo) => {
      event.preventDefault();
      event.stopPropagation();
      const fileManagerLabel = fileManagerName();
      const reloadItem = await MenuItem.new({
        text: "重新加载线程",
        action: () => onReloadWorkspaceThreads(worktree.id),
      });
      const renameItem = await MenuItem.new({
        text: "修改显示名称",
        action: () => onRenameWorkspaceDisplayName(worktree),
      });
      const revealItem = await MenuItem.new({
        text: `在${fileManagerLabel}中显示`,
        action: async () => {
          if (!worktree.path) {
            return;
          }
          try {
            const { revealItemInDir } = await import(
              "@tauri-apps/plugin-opener"
            );
            await revealItemInDir(worktree.path);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            pushErrorToast({
              title: `Couldn't show worktree in ${fileManagerLabel}`,
              message,
            });
            console.warn("Failed to reveal worktree", {
              message,
              workspaceId: worktree.id,
              path: worktree.path,
            });
          }
        },
      });
      const deleteItem = await MenuItem.new({
        text: "删除工作树",
        action: () => onDeleteWorktree(worktree.id),
      });
      const menu = await Menu.new({ items: [renameItem, reloadItem, revealItem, deleteItem] });
      const appWindow = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, appWindow);
    },
    [onDeleteWorktree, onReloadWorkspaceThreads, onRenameWorkspaceDisplayName],
  );

  const showCloneMenu = useCallback(
    async (event: MouseEvent, clone: WorkspaceInfo) => {
      event.preventDefault();
      event.stopPropagation();
      const fileManagerLabel = fileManagerName();
      const reloadItem = await MenuItem.new({
        text: "重新加载线程",
        action: () => onReloadWorkspaceThreads(clone.id),
      });
      const renameItem = await MenuItem.new({
        text: "修改显示名称",
        action: () => onRenameWorkspaceDisplayName(clone),
      });
      const revealItem = await MenuItem.new({
        text: `在${fileManagerLabel}中显示`,
        action: async () => {
          if (!clone.path) {
            return;
          }
          try {
            const { revealItemInDir } = await import(
              "@tauri-apps/plugin-opener"
            );
            await revealItemInDir(clone.path);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            pushErrorToast({
              title: `Couldn't show clone in ${fileManagerLabel}`,
              message,
            });
            console.warn("Failed to reveal clone", {
              message,
              workspaceId: clone.id,
              path: clone.path,
            });
          }
        },
      });
      const deleteItem = await MenuItem.new({
        text: "删除克隆",
        action: () => onDeleteWorkspace(clone.id),
      });
      const menu = await Menu.new({ items: [renameItem, reloadItem, revealItem, deleteItem] });
      const appWindow = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, appWindow);
    },
    [onDeleteWorkspace, onReloadWorkspaceThreads, onRenameWorkspaceDisplayName],
  );

  return { showThreadMenu, showWorkspaceMenu, showWorktreeMenu, showCloneMenu };
}
