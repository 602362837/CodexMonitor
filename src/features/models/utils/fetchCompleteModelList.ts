import { getModelList } from "@/services/tauri";
import { extractModelListNextCursor } from "./modelListResponse";

export async function fetchCompleteModelList(workspaceId: string): Promise<unknown[]> {
  const pages: unknown[] = [];
  let cursor: string | null = null;
  const seenCursors = new Set<string>();

  for (let page = 0; page < 25; page += 1) {
    const response = await getModelList(workspaceId, {
      cursor,
      limit: 200,
      includeHidden: true,
    });
    pages.push(response);
    const nextCursor = extractModelListNextCursor(response);
    if (!nextCursor || seenCursors.has(nextCursor)) {
      break;
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return pages;
}
