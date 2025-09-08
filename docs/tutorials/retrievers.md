---
title: 文脈検索エンジンを構築する
slug: /tutorials/retrievers
sidebar_label: 文脈検索エンジンを構築する
tags: [langchainjs, tutorial, retrievers, RAG]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 文脈検索エンジンを構築する

このチュートリアルでは、LangChain の ドキュメントローダー、埋め込み（embedding）、ベクトルストアの抽象化に慣れます。これらはベクトル DB やその他のソースからデータを検索・取得し、LLM ワークフローに統合するための仕組みです。たとえば RAG（検索拡張生成） のように、推論時に参照データを取りに行くアプリケーションで重要になります（RAG のチュートリアルは別途参照）。

ここでは PDF ドキュメントに対する検索エンジンを作ります。入力クエリに似た PDF 内の文章（パッセージ）を取得できるようにします。

## コンセプト

このガイドはテキストデータのリトリーバルに焦点を当て、次の概念を扱います。

- ドキュメントとドキュメントローダー

- テキストスプリッタ

- Embeddings

- ベクトルストアとリトリーバ

## セットアップ

### Jupyter Notebook

このチュートリアル（他のチュートリアルも同様）は、Jupyter Notebook で実行するのが手軽です。インストール方法は該当ドキュメントを参照してください。

### インストール

このガイドでは `@langchain/community` と `pdf-parse` を使用します。

<Tabs>
  <TabItem value="npm" label="npm">
    ```bash
   npm i langchain @langchain/community pdf-parse
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
   yarn add langchain @langchain/community pdf-parse
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm add langchain @langchain/community pdf-parse
    ```
  </TabItem>
</Tabs>

詳細はインストールガイドへ。

### LangSmith

### LangSmith

LangChain で作る多くのアプリは、複数ステップ・複数回の LLM 呼び出しを含みます。複雑になるほど、チェーンやエージェントの内部で「何が起きているか」を確認できることが重要になります。そこで役立つのが [LangSmith](https://docs.langchain.com/langsmith/home) です。

上記リンクからサインアップしたら、トレースを記録できるように環境変数を設定してください。

```bash
export LANGSMITH_TRACING="true"
export LANGSMITH_API_KEY="..."
# サーバレス環境でなければ、トレースの遅延を減らす設定も可能
# export LANGCHAIN_CALLBACKS_BACKGROUND=true
```

## ドキュメントとドキュメントローダー

LangChain は Document 抽象化を実装しており、テキスト本体と付随メタデータの単位を表します。属性は 3 つ：

- pageContent: 文字列の本文

- metadata: 任意のメタデータ

- id: （任意）ドキュメント識別子

metadata には、ソース情報、他ドキュメントとの関係などを記録できます。個々の Document はしばしば、より大きな文書のチャンクを表します。

サンプルドキュメントを生成する例：

```typescript
import { Document } from "@langchain/core/documents";

const documents = [
  new Document({
    pageContent:
      "Dogs are great companions, known for their loyalty and friendliness.",
    metadata: { source: "mammal-pets-doc" },
  }),
  new Document({
    pageContent: "Cats are independent pets that often enjoy their own space.",
    metadata: { source: "mammal-pets-doc" },
  }),
];
```

LangChain には、よくある多数のソースと統合されたドキュメントローダーがあり、AI アプリにデータを取り込むのが容易です。

ドキュメントの読み込み

PDF を Document の配列に読み込みます。LangChain リポジトリにはサンプル PDF（NIKE の 2023 年 10-K）があり、PDFLoader でパースできます。

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("../../data/nke-10k-2023.pdf");

const docs = await loader.load();
console.log(docs.length);
```

```
107
```

:::tips
PDF ドキュメントローダーの詳細は専用ガイドを参照。
:::

PDFLoader は ページごとに 1 つの Document を生成します。各ページからは以下に簡単にアクセスできます：

- ページ本文の文字列

- ファイル名・ページ番号を含むメタデータ

```typescript
docs[0].pageContent.slice(0, 200);
```

```
Table of Contents
UNITED STATES
SECURITIES AND EXCHANGE COMMISSION
Washington, D.C. 20549
FORM 10-K
(Mark One)
☑ ANNUAL REPORT PURSUANT TO SECTION 13 OR 15(D) OF THE SECURITIES EXCHANGE ACT OF 1934
FO
```

```typescript
docs[0].metadata;
```

```json
{
  "source": "../../data/nke-10k-2023.pdf",
  "pdf": {
    "version": "1.10.100",
    "info": {
      "PDFFormatVersion": "1.4",
      "IsAcroFormPresent": false,
      "IsXFAPresent": false,
      "Title": "0000320187-23-000039",
      "Author": "EDGAR Online, a division of Donnelley Financial Solutions",
      "Subject": "Form 10-K filed on 2023-07-20 for the period ending 2023-05-31",
      "Keywords": "0000320187-23-000039; ; 10-K",
      "Creator": "EDGAR Filing HTML Converter",
      "Producer": "EDGRpdf Service w/ EO.Pdf 22.0.40.0",
      "CreationDate": "D:20230720162200-04'00'",
      "ModDate": "D:20230720162208-04'00'"
    },
    "metadata": null,
    "totalPages": 107
  },
  "loc": { "pageNumber": 1 }
}
```

## 分割

情報検索や下流の QA の観点では、ページ単位は粗すぎることがあります。最終的な目標は入力クエリに答える Document を取得することなので、PDF をさらに細かく分割して、関連箇所の意味が周辺テキストに「薄められない」ようにします。

この目的に テキストスプリッタを使います。ここでは文字ベースの単純なスプリッタを使用し、1000 文字のチャンクに 200 文字のオーバーラップで分割します。オーバーラップは、重要な文脈からの分離を緩和します。使用するのは RecursiveCharacterTextSplitter で、改行などの一般的な区切り文字を使って再帰的に分割し、所定サイズに収めます。汎用テキストには推奨のスプリッタです。

また、add_start_index=True を設定すると、元ドキュメント内で各チャンクが始まる文字インデックスが start_index としてメタデータに保持されます。

PDF 取り扱いの詳細は別ガイドを参照。

```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const allSplits = await textSplitter.splitDocuments(docs);

allSplits.length;
```

```
513
```

## 埋め込み

ベクトル検索は、非構造データ（テキストなど）を保存・検索する一般的な方法です。テキストに対応する数値ベクトルを保存し、クエリも同次元ベクトルに埋め込んで類似度（コサイン類似度など）で関連テキストを特定します。

LangChain は多数のプロバイダの埋め込みモデルをサポートします。モデルは「テキストをどのように数値化するか」を定義します。モデルを選びましょう。

<Tabs>
    <TabItem value="OpenAI" label="OpenAI">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/openai
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
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

        ```bash
        OPENAI_API_KEY=your-api-key
        ```

        ```typescript
        import { OpenAIEmbeddings } from "@langchain/openai";

        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large"
        });
        ```
    </TabItem>

    <TabItem value="Azure" label="Azure">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/openai
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
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

        ```bash
        AZURE_OPENAI_API_INSTANCE_NAME=<YOUR_INSTANCE_NAME>
        AZURE_OPENAI_API_KEY=<YOUR_KEY>
        AZURE_OPENAI_API_VERSION="2024-02-01"
        ```

        ```typescript
        import { AzureOpenAIEmbeddings } from "@langchain/openai";

        const embeddings = new AzureOpenAIEmbeddings({
        azureOpenAIApiEmbeddingsDeploymentName: "text-embedding-ada-002"
        });
        ```
    </TabItem>

    <TabItem value="AWS" label="AWS">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/aws
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
            yarn add langchain @langchain/aws
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add langchain @langchain/aws
                ```
            </TabItem>
        </Tabs>

        ```bash
        BEDROCK_AWS_REGION=your-region
        ```

        ```typescript
        import { OpenAIEmbeddings } from "@langchain/openai";

        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large"
        });
        ```
    </TabItem>

    <TabItem value="VertexAI" label="VertexAI">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/aws
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
            yarn add langchain @langchain/aws
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add langchain @langchain/aws
                ```
            </TabItem>
        </Tabs>

        ```bash
        GOOGLE_APPLICATION_CREDENTIALS=credentials.json
        ```

        ```typescript
        import { VertexAIEmbeddings } from "@langchain/google-vertexai";

        const embeddings = new VertexAIEmbeddings({
            model: "text-embedding-004"
        });
        ```
    </TabItem>

    <TabItem value="MistralAI" label="MistralAI">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/mistralai
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
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

        ```bash
        MISTRAL_API_KEY=your-api-key
        ```

        ```typescript
        import { MistralAIEmbeddings } from "@langchain/mistralai";

        const embeddings = new MistralAIEmbeddings({
            model: "mistral-embed"
        });
        ```
    </TabItem>

    <TabItem value="Cohere" label="Cohere">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
            npm i langchain @langchain/cohere
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
            yarn add langchain @langchain/cohere
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add langchain @langchain/cohere
                ```
            </TabItem>
        </Tabs>

        ```bash
        COHERE_API_KEY=your-api-key
        ```

        ```typescript
        import { CohereEmbeddings } from "@langchain/cohere";

        const embeddings = new CohereEmbeddings({
            model: "embed-english-v3.0"
        });
        ```
    </TabItem>

</Tabs>

```typescript
const vector1 = await embeddings.embedQuery(allSplits[0].pageContent);
const vector2 = await embeddings.embedQuery(allSplits[1].pageContent);

console.assert(vector1.length === vector2.length);
console.log(`Generated vectors of length ${vector1.length}\n`);
console.log(vector1.slice(0, 10));
```

```
Generated vectors of length 3072

[
    0.014310152,
    -0.01681044,
    -0.0011537228,
    0.010546423,
    0.022808468,
    -0.028327717,
    -0.00058849837,
    0.0419197,
    -0.0012900416,
    0.0661778
]
```

埋め込みモデルが用意できたので、次は効率的な類似検索をサポートするデータ構造に保存します。

## ベクトルストア

VectorStore は、テキストや Document を追加し、各種類似度指標で検索するメソッドを持ちます。初期化時に埋め込みモデルを渡すのが一般的で、テキスト → ベクトル変換方法をそこで決めます。

LangChain には様々なベクトルストア統合があります。クラウド等のホスティング型（資格情報が必要）、自己ホストやサードパーティで動かすもの（例：Postgres）、インメモリで軽負荷用途に使えるもの、など。

<Tabs>
    <TabItem value="OpenAI" label="OpenAI">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i langchain
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add langchain
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add langchain
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { MemoryVectorStore } from "langchain/vectorstores/memory";

        const vectorStore = new MemoryVectorStore(embeddings);
        ```
    </TabItem>

    <TabItem value="Chroma" label="Chroma">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/community
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/community
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/community
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { Chroma } from "@langchain/community/vectorstores/chroma";

        const vectorStore = new Chroma(embeddings, {
            collectionName: "a-test-collection",
        });
        ```
    </TabItem>

    <TabItem value="FAISS" label="FAISS">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/community
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/community
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/community
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { FaissStore } from "@langchain/community/vectorstores/faiss";

        const vectorStore = new FaissStore(embeddings, {});
        ```
    </TabItem>

    <TabItem value="MongoDB" label="MongoDB">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/mongodb
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/mongodb
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/mongodb
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
        import { MongoClient } from "mongodb";

        const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
        const collection = client
        .db(process.env.MONGODB_ATLAS_DB_NAME)
        .collection(process.env.MONGODB_ATLAS_COLLECTION_NAME);

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
        });
        ```
    </TabItem>

    <TabItem value="PGVector" label="PGVector">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/community
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/community
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/community
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

        const vectorStore = await PGVectorStore.initialize(embeddings, {});
        ```
    </TabItem>

    <TabItem value="Pinecone" label="Pinecone">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/pinecone
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/pinecone
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/pinecone
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { PineconeStore } from "@langchain/pinecone";
        import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

        const pinecone = new PineconeClient();
        const vectorStore = new PineconeStore(embeddings, {
            pineconeIndex,
            maxConcurrency: 5,
        });
        ```
    </TabItem>

    <TabItem value="Qdrant" label="Qdrant">
        依存関係のインストール

        <Tabs>
            <TabItem value="npm" label="npm">
                ```bash
                npm i @langchain/qdrant
                ```
            </TabItem>
            <TabItem value="yarn" label="yarn">
                ```bash
                yarn add @langchain/qdrant
                ```
            </TabItem>
            <TabItem value="pnpm" label="pnpm">
                ```bash
                pnpm add @langchain/qdrant
                ```
            </TabItem>
        </Tabs>

        ```typescript
        import { QdrantVectorStore } from "@langchain/qdrant";

        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: process.env.QDRANT_URL,
            collectionName: "langchainjs-testing",
        });
        ```
    </TabItem>

</Tabs>
ベクトルストアを用意したら、文書をインデックスします。

```typescript
await vectorStore.addDocuments(allSplits);
```

多くの実装では、既存のベクトルストアに接続（クライアントやインデックス名などを指定）できます。詳細は各統合のドキュメントへ。

文書が入った VectorStore はクエリできます。同期/非同期、文字列クエリ/ベクトルクエリ、スコアの返却有無、単純類似度や MMR（最大限界関連性） などに対応します。出力には一般に Document の配列が含まれます。

### 使い方

埋め込みはテキストを高密度ベクトルに表現し、意味が近いテキスト同士が几何学的に近くなります。これにより、特定のキーワードを知らなくても質問から関連情報を取得できます。

文字列クエリの類似度で文書を返す。

```typescript
const results1 = await vectorStore.similaritySearch(
  "When was Nike incorporated?"
);

results1[0];
```

```json
Document {
    pageContent: 'Table of Contents\n' +
    'PART I\n' +
    'ITEM 1. BUSINESS\n' +
    'GENERAL\n' +
    'NIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon. As used in this Annual Report on Form 10-K (this "Annual Report"), the terms "we," "us," "our,"\n' +
    '"NIKE" and the "Company" refer to NIKE, Inc. and its predecessors, subsidiaries and affiliates, collectively, unless the context indicates otherwise.\n' +
    'Our principal business activity is the design, development and worldwide marketing and selling of athletic footwear, apparel, equipment, accessories and services. NIKE is\n' +
    'the largest seller of athletic footwear and apparel in the world. We sell our products through NIKE Direct operations, which are comprised of both NIKE-owned retail stores\n' +
    'and sales through our digital platforms (also referred to as "NIKE Brand Digital"), to retail accounts and to a mix of independent distributors, licensees and sales',
    metadata: {
        source: '../../data/nke-10k-2023.pdf',
        pdf: {
            version: '1.10.100',
            info: [Object],
            metadata: null,
            totalPages: 107
        },
        loc: { pageNumber: 4, lines: [Object] }
    },
    id: undefined
}
```

スコアも返す場合。

```typescript
const results2 = await vectorStore.similaritySearchWithScore(
  "What was Nike's revenue in 2023?"
);

results2[0];
```

```json
[
  Document {
    pageContent: 'Table of Contents\n' +
      'FISCAL 2023 NIKE BRAND REVENUE HIGHLIGHTS\n' +
      'The following tables present NIKE Brand revenues disaggregated by reportable operating segment, distribution channel and major product line:\n' +
      'FISCAL 2023 COMPARED TO FISCAL 2022\n' +
      '•NIKE, Inc. Revenues were $51.2 billion in fiscal 2023, which increased 10% and 16% compared to fiscal 2022 on a reported and currency-neutral basis, respectively.\n' +
      'The increase was due to higher revenues in North America, Europe, Middle East & Africa ("EMEA"), APLA and Greater China, which contributed approximately 7, 6,\n' +
      '2 and 1 percentage points to NIKE, Inc. Revenues, respectively.\n' +
      '•NIKE Brand revenues, which represented over 90% of NIKE, Inc. Revenues, increased 10% and 16% on a reported and currency-neutral basis, respectively. This\n' +
      "increase was primarily due to higher revenues in Men's, the Jordan Brand, Women's and Kids' which grew 17%, 35%,11% and 10%, respectively, on a wholesale\n" +
      'equivalent basis.',
    metadata: {
      source: '../../data/nke-10k-2023.pdf',
      pdf: [Object],
      loc: [Object]
    },
    id: undefined
  },
  0.6992287611800424
]
```

埋め込みクエリの類似度で文書を返す場合。

```typescript
const embedding = await embeddings.embedQuery(
  "How were Nike's margins impacted in 2023?"
);

const results3 = await vectorStore.similaritySearchVectorWithScore(
  embedding,
  1
);

results3[0];
```

```json
[
  Document {
    pageContent: 'Table of Contents\n' +
      'GROSS MARGIN\n' +
      'FISCAL 2023 COMPARED TO FISCAL 2022\n' +
      'For fiscal 2023, our consolidated gross profit increased 4% to $22,292 million compared to $21,479 million for fiscal 2022. Gross margin decreased 250 basis points to\n' +
      '43.5% for fiscal 2023 compared to 46.0% for fiscal 2022 due to the following:\n' +
      '*Wholesale equivalent\n' +
      'The decrease in gross margin for fiscal 2023 was primarily due to:\n' +
      '•Higher NIKE Brand product costs, on a wholesale equivalent basis, primarily due to higher input costs and elevated inbound freight and logistics costs as well as\n' +
      'product mix;\n' +
      '•Lower margin in our NIKE Direct business, driven by higher promotional activity to liquidate inventory in the current period compared to lower promotional activity in\n' +
      'the prior period resulting from lower available inventory supply;\n' +
      '•Unfavorable changes in net foreign currency exchange rates, including hedges; and\n' +
      '•Lower off-price margin, on a wholesale equivalent basis.\n' +
      'This was partially offset by:',
    metadata: {
      source: '../../data/nke-10k-2023.pdf',
      pdf: [Object],
      loc: [Object]
    },
    id: undefined
  },
  0.7368815472158006
]
```

#### 参考

- [API リファレンス](https://v03.api.js.langchain.com/classes/_langchain_core.vectorstores.VectorStore.html)

- ハウツーガイド

- 各統合のドキュメント

## リトリーバ

VectorStore は Runnable のサブクラスではありません。一方、LangChain の Retriever は Runnable で、同期/非同期の invoke やバッチなど標準メソッドを実装します。リトリーバはベクトルストアから作れるだけでなく、非ベクトルストアのデータソース（外部 API など）ともやり取りできます。

多くのベクトルストアは asRetriever を実装しており、VectorStoreRetriever を生成します。これらは search_type と search_kwargs を持ち、下層のベクトルストアの検索方法とパラメータを指定します。

```typescript
const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  searchKwargs: {
    fetchK: 1,
  },
});

await retriever.batch([
  "When was Nike incorporated?",
  "What was Nike's revenue in 2023?",
]);
```

```json
[
  [
    Document {
      pageContent: 'Table of Contents\n' +
        'PART I\n' +
        'ITEM 1. BUSINESS\n' +
        'GENERAL\n' +
        'NIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon. As used in this Annual Report on Form 10-K (this "Annual Report"), the terms "we," "us," "our,"\n' +
        '"NIKE" and the "Company" refer to NIKE, Inc. and its predecessors, subsidiaries and affiliates, collectively, unless the context indicates otherwise.\n' +
        'Our principal business activity is the design, development and worldwide marketing and selling of athletic footwear, apparel, equipment, accessories and services. NIKE is\n' +
        'the largest seller of athletic footwear and apparel in the world. We sell our products through NIKE Direct operations, which are comprised of both NIKE-owned retail stores\n' +
        'and sales through our digital platforms (also referred to as "NIKE Brand Digital"), to retail accounts and to a mix of independent distributors, licensees and sales',
      metadata: [Object],
      id: undefined
    }
  ],
  [
    Document {
      pageContent: 'Table of Contents\n' +
        'FISCAL 2023 NIKE BRAND REVENUE HIGHLIGHTS\n' +
        'The following tables present NIKE Brand revenues disaggregated by reportable operating segment, distribution channel and major product line:\n' +
        'FISCAL 2023 COMPARED TO FISCAL 2022\n' +
        '•NIKE, Inc. Revenues were $51.2 billion in fiscal 2023, which increased 10% and 16% compared to fiscal 2022 on a reported and currency-neutral basis, respectively.\n' +
        'The increase was due to higher revenues in North America, Europe, Middle East & Africa ("EMEA"), APLA and Greater China, which contributed approximately 7, 6,\n' +
        '2 and 1 percentage points to NIKE, Inc. Revenues, respectively.\n' +
        '•NIKE Brand revenues, which represented over 90% of NIKE, Inc. Revenues, increased 10% and 16% on a reported and currency-neutral basis, respectively. This\n' +
        "increase was primarily due to higher revenues in Men's, the Jordan Brand, Women's and Kids' which grew 17%, 35%,11% and 10%, respectively, on a wholesale\n" +
        'equivalent basis.',
      metadata: [Object],
      id: undefined
    }
  ]
]
```

VectorStoreRetriever は検索タイプとして "similarity"（既定） と "mmr" をサポートします。

リトリーバは、RAG のように「質問 + 取得した文脈」を LLM のプロンプトに組み込む複雑なアプリにも容易に取り込めます。構築方法は RAG チュートリアルを参照。

### さらに学ぶ

リトリーバル戦略は奥深く、たとえば次のようなことが可能です。

- クエリからルールやフィルタを推論（例：「2020 年以降に公開された文書に限定」）

- 取得した文脈に紐づく文書（分類体系など）を返す

- 各コンテキストに複数埋め込みを生成

- 複数リトリーバのアンサンブル

- 文書に重み付け（例：新しい文書を高く評価）

ハウツーガイドの retrievers セクションで、これらの内蔵戦略を扱っています。

また、BaseRetriever を拡張してカスタムリトリーバを実装するのも容易です（該当ハウツーガイド参照）。

## 次のステップ

これで PDF ドキュメント上のセマンティック検索エンジンの作り方を見てきました。

### ドキュメントローダーについてさらに学ぶ

- 概念ガイド / ハウツーガイド / 利用可能な統合

- 埋め込みについてさらに学ぶ：

- 概念ガイド / ハウツーガイド / 利用可能な統合

### ベクトルストアについてさらに学ぶ

- 概念ガイド / ハウツーガイド / 利用可能な統合

### RAG について

- Build a Retrieval Augmented Generation (RAG) App

- [関連ハウツーガイド](/how_to/)
