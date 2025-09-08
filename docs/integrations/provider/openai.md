---
title: OpenAI Integration
slug: /integrations/provider/openai
sidebar_label: OpenAI
sidebar_class_name: integrations
tags: [langchainjs, integrations, openai]
---

# OpenAI Integration

OpenAI の GPT モデルとの統合方法について説明します。

## インストール

```bash
npm install @langchain/openai
```

## 基本的な使用方法

```javascript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
});
```

## 設定オプション

- `modelName`: 使用するモデル名
- `temperature`: 生成のランダム性
- `maxTokens`: 最大トークン数
