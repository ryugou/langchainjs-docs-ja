---
title: Hugging Face Integration
slug: /integrations/provider/hugging-face
sidebar_label: Hugging Face
tags: [langchainjs, integrations, hugging-face]
---

# Hugging Face Integration

Hugging Face のオープンソースモデルとの統合方法について説明します。

## インストール

```bash
npm install @langchain/huggingface
```

## 基本的な使用方法

```javascript
import { HuggingFaceInference } from "@langchain/huggingface";

const model = new HuggingFaceInference({
  model: "microsoft/DialoGPT-medium",
  temperature: 0.7,
});
```
