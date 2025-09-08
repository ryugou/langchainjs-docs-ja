import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "introduction",
    {
      type: "category",
      label: "チュートリアル",
      items: ["tutorials/index", "tutorials/llm-chain"],
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
