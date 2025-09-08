import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "LangChain.js 非公式日本語ドキュメント",
  tagline: "Unofficial Japanese docs for LangChain.js",
  favicon: "img/favicon.ico",

  // GitHub Pages デプロイ設定
  deploymentBranch: "gh-pages",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://ryugo.github.io",

  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/langchainjs-docs-ja/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "ryugou", // Usually your GitHub org/user name.
  projectName: "langchainjs-docs-ja", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "ja",
    locales: ["ja"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "LangChain.js 非公式日本語ドキュメント",
      logo: {
        alt: "LangChain.js",
        src: "https://js.langchain.com/img/brand/wordmark.png",
        srcDark: "https://js.langchain.com/img/brand/wordmark-dark.png",
      },

      items: [
        {
          type: "doc",
          docId: "introduction",
          position: "left",
          label: "ドキュメント",
        },
        {
          type: "doc",
          docId: "integrations/index",
          position: "left",
          label: "Integrations",
        },
        {
          type: "doc",
          docId: "api-reference",
          position: "left",
          label: "API Reference",
        },
        {
          href: "https://js.langchain.com/",
          label: "原文(公式)",
          position: "right",
        },
        {
          href: "https://github.com/ryugou/langchainjs-docs-ja",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `© ${new Date().getFullYear()} Unofficial LangChain.js Japanese Docs.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
