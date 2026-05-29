import type { WorkspaceInfo } from "../../../types";

export function getWorkspaceDisplayName(workspace: WorkspaceInfo): string {
  return workspace.settings.displayName?.trim() || workspace.name;
}

