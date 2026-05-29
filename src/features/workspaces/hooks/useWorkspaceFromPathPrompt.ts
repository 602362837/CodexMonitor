import { useCallback, useMemo, useState } from "react";

type WorkspaceFromPathPromptState = {
  path: string;
  error: string | null;
  isSubmitting: boolean;
} | null;

type UseWorkspaceFromPathPromptOptions = {
  onSubmit: (path: string) => Promise<void>;
};

export function useWorkspaceFromPathPrompt({ onSubmit }: UseWorkspaceFromPathPromptOptions) {
  const [prompt, setPrompt] = useState<WorkspaceFromPathPromptState>(null);

  const openPrompt = useCallback(() => {
    setPrompt({
      path: "",
      error: null,
      isSubmitting: false,
    });
  }, []);

  const closePrompt = useCallback(() => {
    setPrompt(null);
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(prompt?.path.trim());
  }, [prompt]);

  const submitPrompt = useCallback(async () => {
    if (!prompt || prompt.isSubmitting) {
      return;
    }
    const path = prompt.path.trim();
    if (!path) {
      setPrompt((prev) => (prev ? { ...prev, error: "本地文件夹路径不能为空。" } : prev));
      return;
    }

    setPrompt((prev) => (prev ? { ...prev, isSubmitting: true, error: null } : prev));
    try {
      await onSubmit(path);
      setPrompt(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPrompt((prev) => (prev ? { ...prev, isSubmitting: false, error: message } : prev));
    }
  }, [onSubmit, prompt]);

  return {
    workspaceFromPathPrompt: prompt,
    openWorkspaceFromPathPrompt: openPrompt,
    closeWorkspaceFromPathPrompt: closePrompt,
    submitWorkspaceFromPathPrompt: submitPrompt,
    updateWorkspaceFromPathPath: (path: string) =>
      setPrompt((prev) => (prev ? { ...prev, path, error: null } : prev)),
    canSubmitWorkspaceFromPathPrompt: canSubmit,
  };
}
