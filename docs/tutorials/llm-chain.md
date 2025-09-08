---
title: チャットモデルとプロンプトテンプレートでシンプルな LLM アプリを作る
slug: /tutorials/llm-chain
sidebar_label: チャットモデルとプロンプトテンプレートでシンプルな LLM アプリを作る
tags: [langchainjs, tutorial, llm-chain]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# チャットモデルとプロンプトテンプレートでシンプルな LLM アプリを作る

このクイックスタートでは、LangChain を使って「英語テキストを別の言語へ翻訳する」シンプルな LLM アプリを作成します。単一の LLM 呼び出しに少しのプロンプトを組み合わせただけの、比較的シンプルな構成ですが、LangChain を始めるのに最適です。実のところ、多くの機能は「適切なプロンプト＋ 1 回の LLM 呼び出し」だけで実装できます。

このチュートリアルを読むと、次の概要がわかります。

- [言語モデル](/concepts/chat_models)の使い方

- [プロンプトテンプレート](/concepts/prompt_templates)の使い方

- [LangSmith](https://docs.langchain.com/langsmith/home) を使ったアプリのデバッグ／トレース方法

さっそく始めましょう！

## セットアップ

### インストール

LangChain をインストールします。

<Tabs>
  <TabItem value="npm" label="npm">
    ```bash
   npm i langchain @langchain/core
    ```
  </TabItem>
  <TabItem value="yarn" label="npm">
    ```bash
   yarn add langchain @langchain/core
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm add langchain @langchain/core
    ```
  </TabItem>
</Tabs>

より詳しくはインストールガイドをご覧ください。

### LangSmith

LangChain で作る多くのアプリは、複数ステップ・複数回の LLM 呼び出しを含みます。複雑になるほど、チェーンやエージェントの内部で「何が起きているか」を確認できることが重要になります。そこで役立つのが [LangSmith](https://docs.langchain.com/langsmith/home) です。

上記リンクからサインアップしたら、トレースを記録できるように環境変数を設定してください。

```bash
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="..."
# サーバレス環境でなければ、トレースの遅延を減らす設定も可能
# export LANGCHAIN_CALLBACKS_BACKGROUND=true
```

## 言語モデルの使用

まずは言語モデル単体の使い方を学びます。LangChain は相互に置き換え可能な多数の言語モデルをサポートしています。特定モデルの始め方は「対応インテグレーション」を参照してください。

<Tabs>
  <TabItem value="Groq" label="Groq">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
            ```bash
        npm i @langchain/groq
            ```
        </TabItem>
        <TabItem value="yarn" label="npm">
            ```bash
        yarn add langchain @langchain/groq
            ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
            ```bash
            pnpm add langchain @langchain/groq
            ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    GROQ_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatGroq } from "@langchain/groq";

    const model = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0
    });
    ```

  </TabItem>
  <TabItem value="OpenAI" label="OpenAI">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
            ```bash
        npm i @langchain/openai
            ```
        </TabItem>
        <TabItem value="yarn" label="npm">
            ```bash
        yarn add langchain @langchain/openai
            ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
            ```bash
            pnpm add langchain @langchain/openai
            ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    OPENAI_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatOpenAI } from "@langchain/openai";

    const model = new ChatOpenAI({ model: "gpt-4" });
    ```

  </TabItem>
  <TabItem value="Anthropic" label="Anthropic">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
            ```bash
        npm i @langchain/anthropic
            ```
        </TabItem>
        <TabItem value="yarn" label="npm">
            ```bash
        yarn add langchain @langchain/anthropic
            ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
            ```bash
            pnpm add langchain @langchain/anthropic
            ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    ANTHROPIC_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatAnthropic } from "@langchain/anthropic";

    const model = new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0
    });
    ```

</TabItem>

<TabItem value="Google Gemini" label="Google Gemini">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
            ```bash
        npm i @langchain/google-genai
            ```
        </TabItem>
        <TabItem value="yarn" label="npm">
            ```bash
        yarn add langchain @langchain/google-genai
            ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
            ```bash
            pnpm add langchain @langchain/google-genai
            ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    GOOGLE_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature: 0
    });
    ```

 </TabItem>

<TabItem value="FireworksAI" label="FireworksAI">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
        ```bash
        npm i @langchain/community
        ```
        </TabItem>
        <TabItem value="yarn" label="npm">
        ```bash
        yarn add langchain @langchain/community
        ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
        ```bash
        pnpm add langchain @langchain/community
        ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    FIREWORKS_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatFireworks } from "@langchain/community/chat_models/fireworks";

    const model = new ChatFireworks({
        model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
        temperature: 0
    });
    ```

  </TabItem>
  <TabItem value="MistralAI" label="MistralAI">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
        ```bash
        npm i @langchain/mistralai
        ```
        </TabItem>
        <TabItem value="yarn" label="npm">
        ```bash
        yarn add langchain @langchain/mistralai
        ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
        ```bash
        pnpm add langchain @langchain/mistralai
        ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    MISTRAL_API_KEY=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatMistralAI } from "@langchain/mistralai";

    const model = new ChatMistralAI({
        model: "mistral-large-latest",
        temperature: 0
    });
    ```

  </TabItem>

  <TabItem value="VertexAI" label="VertexAI">
    :::tip
    インテグレーションパッケージの一般的なインストール手順は該当セクション参照
    :::
    <Tabs>
        <TabItem value="npm" label="npm">
        ```bash
        npm i @langchain/google-vertexai 
        ```
        </TabItem>
        <TabItem value="yarn" label="npm">
        ```bash
        yarn add langchain @langchain/google-vertexai 
        ```
        </TabItem>
        <TabItem value="pnpm" label="pnpm">
        ```bash
        pnpm add langchain @langchain/google-vertexai 
        ```
        </TabItem>
    </Tabs>

    環境変数を追加
    ```bash
    GOOGLE_APPLICATION_CREDENTIALS=your-api-key
    ```
    モデルの生成
    ```typescript
    import { ChatVertexAI } from "@langchain/google-vertexai";

    const model = new ChatVertexAI({
        model: "gemini-1.5-flash",
        temperature: 0
    });
    ```

  </TabItem>
</Tabs>
まずはモデルを「直接」使ってみます。ChatModel は LangChain の Runnable（標準インターフェイスを持つ実行可能オブジェクト）で、.invoke にメッセージの配列を渡して呼び出せます。
    ```typescript
    import { HumanMessage, SystemMessage } from "@langchain/core/messages";

    const messages = [
        new SystemMessage("以下の英文をイタリア語に翻訳してください"),
        new HumanMessage("こんにちは！"),
    ];

    await model.invoke(messages);
    ```

    ```json
    AIMessage {
        "id": "chatcmpl-AekSfJkg3QIOsk42BH6Qom4Gt159j",
        "content": "Ciao!",
        "additional_kwargs": {},
        "response_metadata": {
            "tokenUsage": {
            "promptTokens": 20,
            "completionTokens": 3,
            "totalTokens": 23
            },
            "finish_reason": "stop",
            "usage": {
            "prompt_tokens": 20,
            "completion_tokens": 3,
            "total_tokens": 23,
            "prompt_tokens_details": {
                "cached_tokens": 0,
                "audio_tokens": 0
            },
            "completion_tokens_details": {
                "reasoning_tokens": 0,
                "audio_tokens": 0,
                "accepted_prediction_tokens": 0,
                "rejected_prediction_tokens": 0
            }
            },
            "system_fingerprint": "fp_6fc10e10eb"
        },
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
            "output_tokens": 3,
            "input_tokens": 20,
            "total_tokens": 23,
            "input_token_details": {
            "audio": 0,
            "cache_read": 0
            },
            "output_token_details": {
            "audio": 0,
            "reasoning": 0
            }
        }
    }
    ```

:::Tip
LangSmith を有効化していれば、この実行は LangSmith に記録され、[トレースを確認](https://smith.langchain.com/public/45f1a650-38fb-41e1-9b61-becc0684f2ce/r)できます。トレースではトークン使用量、レイテンシ、温度などの標準パラメータ、その他の情報が表示されます。
:::

ChatModel は メッセージオブジェクト を入力に受け取り、出力としてもメッセージオブジェクトを返します。テキスト以外に、会話ロール、ツールコール、トークンカウントなどの重要な情報を保持します。

LangChain は 文字列 や OpenAI 形式 の入力にも対応しています。以下は同等です。

```typescript
await model.invoke("こんにちは");
await model.invoke([{ role: "user", content: "こんにちは" }]);
await model.invoke([new HumanMessage("こんにちは!")]);
```

### ストリーミング

Runnable なので、非同期やストリーミングでの呼び出しにも標準対応します。個々のトークンをストリームで受け取る例

```typescript
const stream = await model.stream(messages);

const chunks = [];
for await (const chunk of stream) {
  chunks.push(chunk);
  console.log(`${chunk.content}|`);
}
```

```bash
|
C|
iao|
!|
|
|
```

## プロンプトテンプレート

今はメッセージ配列を直接モデルへ渡していますが、実際にはその配列は ユーザー入力＋アプリのロジック から構築されます。たとえば、システムメッセージの付与や、ユーザー入力をテンプレートへ整形する、といった変換です。

プロンプトテンプレート は、この変換を支援するための LangChain の概念です。生のユーザー入力を受け取り、言語モデルに渡せる形（プロンプト）に整えて返します。

ここでは、2 つの変数を取るテンプレートを作ります。

- language：翻訳先の言語

- text：翻訳するテキスト

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
```

まず、システムメッセージ用の文字列を用意します。

```typescript
const systemTemplate = "Translate the following from English into {language}";
```

次に、上の systemTemplate と、ユーザーのテキストを入れる簡単なテンプレートを組み合わせて ChatPromptTemplate を作成します。

```typescript
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);
```

ChatPromptTemplate は 複数のメッセージロール を 1 つのテンプレートで扱えます。language はシステムメッセージへ、ユーザーの text はユーザーメッセージへ埋め込みます。

このテンプレートの入力は 辞書（オブジェクト） です。テンプレート単体で挙動を確かめてみましょう。

```typescript
const promptValue = await promptTemplate.invoke({
  language: "イタリア語",
  text: "hi!",
});

promptValue;
```

```json
ChatPromptValue {
    lc_serializable: true,
    lc_kwargs: {
        messages: [
            SystemMessage {
                "content": "Translate the following from English into italian",
                "additional_kwargs": {},
                "response_metadata": {}
            },
            HumanMessage {
                "content": "hi!",
                "additional_kwargs": {},
                "response_metadata": {}
            }
        ]
    },
    lc_namespace: [ 'langchain_core', 'prompt_values' ],
    messages: [
        SystemMessage {
            "content": "Translate the following from English into italian",
            "additional_kwargs": {},
            "response_metadata": {}
        },
        HumanMessage {
            "content": "hi!",
            "additional_kwargs": {},
            "response_metadata": {}
        }
    ]
}
```

2 つのメッセージからなる ChatPromptValue が返っているのがわかります。メッセージを直接取り出したい場合は次の通りです。

```typescript
promptValue.toChatMessages();
```

```json
[
    SystemMessage {
        "content": "Translate the following from English into italian",
        "additional_kwargs": {},
        "response_metadata": {}
    },
    HumanMessage {
        "content": "hi!",
        "additional_kwargs": {},
        "response_metadata": {}
    }
]
```

最後に、整形済みプロンプトでチャットモデルを呼び出します。

```typescript
const response = await model.invoke(promptValue);
console.log(`${response.content}`);
```

```bash
Ciao!
```

LangSmith のトレースを見ると、（1）プロンプトテンプレート →（2）モデル呼び出し →（3）応答 の 3 コンポーネントが確認できます。

## まとめ

以上です！このチュートリアルでは、最初のシンプルな LLM アプリの作り方を学び、言語モデルの利用、プロンプトテンプレートの作成、そして LangSmith による高い可観測性 を体験しました。

これは AI エンジニアとして習得すべき内容の「入口」にすぎませんが、幸いにも他にも多くのリソースがあります。

LangChain の中核概念については 概念ガイド（Conceptual Guides） を参照してください。

より具体的な使い方は How-to ガイド の次のセクションが役立ちます。

- チャットモデル

- プロンプトテンプレート

LangSmith のドキュメント も合わせてご覧ください。

- LangSmith
