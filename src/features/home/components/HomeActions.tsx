type HomeActionsProps = {
  onAddWorkspace: () => void;
  onAddWorkspaceFromPath: () => void;
  onAddWorkspaceFromUrl: () => void;
};

export function HomeActions({
  onAddWorkspace,
  onAddWorkspaceFromPath,
  onAddWorkspaceFromUrl,
}: HomeActionsProps) {
  return (
    <div className="home-actions">
      <button
        className="home-button primary home-add-workspaces-button"
        onClick={onAddWorkspace}
        data-tauri-drag-region="false"
      >
        <span className="home-icon" aria-hidden>
          +
        </span>
        添加工作区
      </button>
      <button
        className="home-button secondary home-add-workspace-from-path-button"
        onClick={onAddWorkspaceFromPath}
        data-tauri-drag-region="false"
      >
        <span className="home-icon" aria-hidden>
          ⌁
        </span>
        从路径添加工作区
      </button>
      <button
        className="home-button secondary home-add-workspace-from-url-button"
        onClick={onAddWorkspaceFromUrl}
        data-tauri-drag-region="false"
      >
        <span className="home-icon" aria-hidden>
          ⤓
        </span>
        从 URL 添加工作区
      </button>
    </div>
  );
}
