import { describe, expect, it } from "vitest";
import type { WorkspaceGroup, WorkspaceInfo } from "../../../types";
import { buildGroupedWorkspaces } from "./workspaceGroups";

const workspace = (
  id: string,
  name: string,
  groupId: string | null = null,
): WorkspaceInfo => ({
  id,
  name,
  path: `/tmp/${id}`,
  connected: true,
  kind: "main",
  parentId: null,
  worktree: null,
  settings: { sidebarCollapsed: false, groupId },
});

const group = (id: string, name: string, sortOrder: number): WorkspaceGroup => ({
  id,
  name,
  sortOrder,
  copiesFolder: null,
});

describe("buildGroupedWorkspaces", () => {
  it("keeps empty groups and a synthetic ungrouped section", () => {
    const sections = buildGroupedWorkspaces(
      [workspace("ws-1", "Alpha", "group-a")],
      [group("group-a", "A", 0), group("group-b", "B", 1)],
    );

    expect(sections).toEqual([
      expect.objectContaining({
        id: "group-a",
        name: "A",
        workspaces: [expect.objectContaining({ id: "ws-1" })],
      }),
      expect.objectContaining({
        id: "group-b",
        name: "B",
        workspaces: [],
      }),
      expect.objectContaining({
        id: null,
        name: "未分组",
        workspaces: [],
      }),
    ]);
  });

  it("shows ungrouped projects under the synthetic section", () => {
    const sections = buildGroupedWorkspaces(
      [workspace("ws-1", "Alpha"), workspace("ws-2", "Beta", "missing")],
      [],
    );

    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual(
      expect.objectContaining({
        id: null,
        name: "未分组",
        workspaces: [
          expect.objectContaining({ id: "ws-1" }),
          expect.objectContaining({ id: "ws-2" }),
        ],
      }),
    );
  });
});
