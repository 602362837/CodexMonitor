type WorkspaceHomeGitInitBannerProps = {
  isLoading: boolean;
  onInitGitRepo: () => void | Promise<void>;
};

export function WorkspaceHomeGitInitBanner({
  isLoading,
  onInitGitRepo,
}: WorkspaceHomeGitInitBannerProps) {
  return (
    <div className="workspace-home-git-banner" role="region" aria-label="Git 设置">
      <div className="workspace-home-git-banner-title">
        此项目尚未初始化 Git。
      </div>
      <div className="workspace-home-git-banner-actions">
        <button
          type="button"
          className="primary"
          onClick={() => void onInitGitRepo()}
          disabled={isLoading}
        >
          {isLoading ? "正在初始化..." : "初始化 Git"}
        </button>
      </div>
    </div>
  );
}
