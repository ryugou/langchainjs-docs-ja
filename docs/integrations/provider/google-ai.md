---
title: Google AI Integration
slug: /integrations/provider/google-ai
sidebar_label: Google AI
tags: [langchainjs, integrations, google-ai]
---

# Google AI Integration

Google AI の Gemini モデルとの統合方法について説明します。

## インストール

```bash
npm install @langchain/google-genai
```

## 基本的な使用方法

```javascript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0.7,
});
```
