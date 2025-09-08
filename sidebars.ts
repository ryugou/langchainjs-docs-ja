import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "introduction",
    {
      type: "category",
      label: "チュートリアル",
      items: ["tutorials/index", "tutorials/llm-chain", "tutorials/retrievers"],
    },
    {
      type: "category",
      label: "使い方ガイド",
      items: ["how_to/index"],
    },
    {
      type: "category",
      label: "コンセプトガイド",
      items: [
        "concepts/index",
        "concepts/prompt_templates",
        "concepts/chat_models",
      ],
    },
  ],
  integrations: [
    "integrations/index",
    {
      type: "category",
      label: "Provider",
      items: [
        "integrations/provider/index",
        "integrations/provider/openai",
        "integrations/provider/anthropic",
        "integrations/provider/google-ai",
        "integrations/provider/hugging-face",
      ],
    },
  ],
};
export default sidebars;
