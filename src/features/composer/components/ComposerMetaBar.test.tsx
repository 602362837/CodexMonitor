/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelOption } from "../../../types";
import { ComposerMetaBar } from "./ComposerMetaBar";

const models: ModelOption[] = [
  {
    id: "zeta",
    model: "zeta-model",
    displayName: "Zeta",
    description: "fast routing",
    providerTags: ["OpenAI"],
    supportedReasoningEfforts: [],
    defaultReasoningEffort: null,
    isDefault: false,
  },
  {
    id: "alpha-openai",
    model: "alpha-model",
    displayName: "Alpha",
    description: "general purpose",
    providerTags: ["OpenAI"],
    supportedReasoningEfforts: [],
    defaultReasoningEffort: null,
    isDefault: false,
  },
  {
    id: "alpha-anthropic",
    model: "alpha-claude",
    displayName: "Alpha Claude",
    description: "anthropic tuned",
    providerTags: ["Anthropic"],
    supportedReasoningEfforts: [],
    defaultReasoningEffort: null,
    isDefault: false,
  },
];

function renderMetaBar(overrides: Partial<ComponentProps<typeof ComposerMetaBar>> = {}) {
  const onSelectModel = vi.fn();
  const onRefreshModels = vi.fn().mockResolvedValue(undefined);
  const {
    modelSuffixOptions = [],
    selectedModelSuffix = null,
    onSelectModelSuffix = () => {},
    ...rest
  } = overrides;

  render(
    <ComposerMetaBar
      disabled={false}
      collaborationModes={[]}
      selectedCollaborationModeId={null}
      onSelectCollaborationMode={() => {}}
      models={models}
      selectedModelId="zeta"
      onSelectModel={onSelectModel}
      onRefreshModels={onRefreshModels}
      modelSuffixOptions={modelSuffixOptions}
      selectedModelSuffix={selectedModelSuffix}
      onSelectModelSuffix={onSelectModelSuffix}
      reasoningOptions={[]}
      selectedEffort={null}
      onSelectEffort={() => {}}
      selectedServiceTier={null}
      reasoningSupported={false}
      accessMode="current"
      onSelectAccessMode={() => {}}
      {...rest}
    />,
  );

  return { onSelectModel, onRefreshModels };
}

describe("ComposerMetaBar model picker", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens the model picker and sorts options by display name ascending", () => {
    renderMetaBar();

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));

    const dialog = screen.getByRole("dialog", { name: "选择模型" });
    const optionNames = Array.from(
      dialog.querySelectorAll(".composer-model-picker-item-name"),
    ).map((item) => item.textContent);

    expect(optionNames).toEqual(["Alpha", "Alpha Claude", "Zeta"]);
  });

  it("filters by query across model text and provider tags", () => {
    renderMetaBar();

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));

    fireEvent.change(screen.getByPlaceholderText("搜索模型或提供商"), {
      target: { value: "anthropic" },
    });

    const dialog = screen.getByRole("dialog", { name: "选择模型" });
    const listbox = within(dialog).getByRole("listbox", { name: "模型列表" });

    expect(within(listbox).getByText("Alpha Claude")).toBeTruthy();
    expect(within(listbox).queryByText("Alpha")).toBeNull();
    expect(within(listbox).queryByText("Zeta")).toBeNull();
  });

  it("supports multi-select tag filtering with OR semantics", () => {
    renderMetaBar({
      models: [
        {
          id: "one",
          model: "m-one",
          displayName: "One",
          description: "",
          providerTags: ["OpenAI", "Fast"],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
        {
          id: "two",
          model: "m-two",
          displayName: "Two",
          description: "",
          providerTags: ["OpenAI"],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
        {
          id: "three",
          model: "m-three",
          displayName: "Three",
          description: "",
          providerTags: ["Fast"],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
      ],
      selectedModelId: "one",
    });

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));
    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));
    fireEvent.click(screen.getByRole("button", { name: "Fast" }));

    const dialog = screen.getByRole("dialog", { name: "选择模型" });
    const listbox = within(dialog).getByRole("listbox", { name: "模型列表" });

    expect(within(listbox).getByText("One")).toBeTruthy();
    expect(within(listbox).getByText("Two")).toBeTruthy();
    expect(within(listbox).getByText("Three")).toBeTruthy();
  });

  it("shows an untagged filter and includes untagged models when selected", () => {
    renderMetaBar({
      models: [
        {
          id: "tagged",
          model: "tagged-model",
          displayName: "Tagged",
          description: "",
          providerTags: ["OpenAI"],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
        {
          id: "untagged",
          model: "untagged-model",
          displayName: "Untagged",
          description: "",
          providerTags: [],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
      ],
      selectedModelId: "tagged",
    });

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));
    fireEvent.click(screen.getByRole("button", { name: "无标签" }));

    const dialog = screen.getByRole("dialog", { name: "选择模型" });
    const listbox = within(dialog).getByRole("listbox", { name: "模型列表" });

    expect(within(listbox).queryByText("Tagged")).toBeNull();
    expect(within(listbox).getByText("Untagged")).toBeTruthy();
  });

  it("hides the duplicate model slug line when displayName matches model", () => {
    renderMetaBar({
      models: [
        {
          id: "same",
          model: "gpt-5.2",
          displayName: "gpt-5.2",
          description: "Optimized for professional work.",
          providerTags: [],
          supportedReasoningEfforts: [],
          defaultReasoningEffort: null,
          isDefault: false,
        },
      ],
      selectedModelId: "same",
    });

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));

    const dialog = screen.getByRole("dialog", { name: "选择模型" });
    const slugs = dialog.querySelectorAll(".composer-model-picker-item-model");

    expect(slugs).toHaveLength(0);
  });

  it("selects a model and closes the picker", () => {
    const { onSelectModel } = renderMetaBar();

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));
    fireEvent.click(screen.getByText("Alpha"));

    expect(onSelectModel).toHaveBeenCalledWith("alpha-openai");
    expect(screen.queryByRole("dialog", { name: "选择模型" })).toBeNull();
  });

  it("triggers manual refresh from the picker", async () => {
    const { onRefreshModels } = renderMetaBar();

    fireEvent.click(screen.getByRole("button", { name: "选择模型" }));
    fireEvent.click(screen.getByRole("button", { name: "刷新模型列表" }));

    await waitFor(() => expect(onRefreshModels).toHaveBeenCalledTimes(1));
  });
});
