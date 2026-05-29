import { useEffect, useRef } from "react";
import { ModalShell } from "../../design-system/components/modal/ModalShell";

type WorkspaceFromPathPromptProps = {
  path: string;
  error: string | null;
  isBusy: boolean;
  canSubmit: boolean;
  onPathChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkspaceFromPathPrompt({
  path,
  error,
  isBusy,
  canSubmit,
  onPathChange,
  onCancel,
  onConfirm,
}: WorkspaceFromPathPromptProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <ModalShell
      ariaLabel="从路径添加工作区"
      className="workspace-from-url-modal"
      cardClassName="workspace-from-url-modal-card"
      onBackdropClick={() => {
        if (!isBusy) {
          onCancel();
        }
      }}
    >
      <div className="workspace-from-url-modal-content">
        <div className="ds-modal-title">从路径添加工作区</div>
        <label className="ds-modal-label" htmlFor="workspace-path-input">
          本地文件夹路径
        </label>
        <input
          id="workspace-path-input"
          ref={inputRef}
          className="ds-modal-input"
          value={path}
          onChange={(event) => onPathChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSubmit && !isBusy) {
              onConfirm();
            }
          }}
          placeholder="/Users/you/dev/project"
        />
        <div className="ds-modal-subtitle">
          会复用普通添加工作区流程，只是把系统选择器换成手动输入路径。
        </div>
        {error && <div className="ds-modal-error">{error}</div>}
        <div className="ds-modal-actions">
          <button className="ghost ds-modal-button" onClick={onCancel} disabled={isBusy}>
            取消
          </button>
          <button
            className="primary ds-modal-button"
            onClick={onConfirm}
            disabled={isBusy || !canSubmit}
          >
            {isBusy ? "正在添加…" : "添加"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
