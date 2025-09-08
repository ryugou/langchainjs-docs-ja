---
title: Anthropic Integration
slug: /integrations/provider/anthropic
sidebar_label: Anthropic
sidebar_class_name: integrations
tags: [langchainjs, integrations, anthropic]
---

# Anthropic Integration

Anthropic の Claude モデルとの統合方法について説明します。

## インストール

```bash
npm install @langchain/anthropic
```

## 基本的な使用方法

```javascript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  modelName: "claude-3-sonnet-20240229",
  temperature: 0.7,
});
```
