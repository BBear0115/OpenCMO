# OpenCMO

**あなたのAI最高マーケティング責任者 — マーケティングより開発に集中したいインディー開発者のために。**

[🇺🇸 English](README.md) | [🇨🇳 中文](README_zh.md) | 🇯🇵 日本語 | [🇰🇷 한국어](README_ko.md) | [🇪🇸 Español](README_es.md)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

---

## OpenCMOとは？

OpenCMOは、AIマーケティングチームとして機能するオープンソースのマルチエージェントシステムです。プロダクトのURLを入力するだけで、ウェブサイトをクロールし、主要なセールスポイントを抽出し、各プラットフォームに最適化されたマーケティングコンテンツを生成します — すべてシンプルなCLIで完結します。

**インディー開発者、個人創業者、小規模チーム**のために設計されています。優れたプロダクトを持っているけれど、すべてのプラットフォーム向けにマーケティング文章を書く時間（や意欲）がない方に最適です。

## 機能

- **🐦 Twitter/Xエキスパート** — スクロールを止めるフックを備えたツイートのバリエーションやスレッドを生成
- **🤖 Redditエキスパート** — r/SideProjectやニッチなサブレディット向けに、リアルでストーリー性のある投稿を作成
- **💼 LinkedInエキスパート** — 企業っぽくならない、データに基づいたプロフェッショナルな投稿を作成
- **🚀 Product Huntエキスパート** — タグライン、説明文、メイカーのファーストコメントを作成
- **📰 Hacker Newsエキスパート** — 控えめで技術にフォーカスしたShow HN投稿を作成
- **📝 ブログ/SEOエキスパート** — MediumやDev.to向けのSEOに強い記事の構成を作成

## アーキテクチャ

```
User → CMO Agent (オーケストレーター)
            │
            ├── 🔧 crawl_website ツール (プロダクトのウェブサイトを取得)
            │
            ├── 🤝 handoff → Twitter/Xエキスパート
            ├── 🤝 handoff → Redditエキスパート
            ├── 🤝 handoff → LinkedInエキスパート
            ├── 🤝 handoff → Product Huntエキスパート
            ├── 🤝 handoff → Hacker Newsエキスパート
            └── 🤝 handoff → ブログ/SEOエキスパート
```

**CMO Agent**がウェブサイトをクロールし、ワンライナー説明、主要なセールスポイント、ターゲットオーディエンスのプロフィールを抽出した後、リクエストに応じて適切なプラットフォームエキスパートに引き継ぎます。

## クイックスタート

### 1. インストール

```bash
pip install -e .
crawl4ai-setup
```

### 2. 設定

```bash
cp .env.example .env
# .envを編集してOpenAI APIキーを追加してください
```

### 3. 実行

```bash
opencmo
```

## セッション例

```
============================================================
  OpenCMO - Your AI Chief Marketing Officer
  Type a product URL and what you need, or 'quit' to exit.
============================================================

You: Help me write a tweet for https://crawl4ai.com/

CMO is working...

[Twitter/X Expert]
Here are 3 tweet variants for Crawl4AI:

1. "Tired of writing web scrapers from scratch?
   Crawl4AI gives you LLM-ready markdown from any URL in one line of Python.
   Open source. Blazing fast. #OpenSource #AI"

2. ...

You: Make it more casual and fun

CMO is working...

[Twitter/X Expert]
Sure! Here's a more casual take:
...

You: Now write me a Product Hunt launch post

CMO is working...

[Product Hunt Expert]
...

You: quit
Goodbye!
```

## ロードマップ

- [ ] リアルタイムストリーミング対応のWeb UI
- [ ] フルチャネルモード：1つのコマンドで6つのプラットフォーム全てのコンテンツを生成
- [ ] API連携によるプラットフォームへの自動投稿
- [ ] コンテンツカレンダーとスケジューリング
- [ ] A/Bテストの提案
- [ ] その他のプラットフォームエキスパート（YouTube、Instagram、TikTokなど）
- [ ] カスタムブランドボイスのトレーニング

## コントリビューション

コントリビューションを歓迎します！以下の方法でご参加いただけます：

1. リポジトリを**フォーク**する
2. フィーチャーブランチを**作成**する（`git checkout -b feature/amazing-feature`）
3. 変更を**コミット**する（`git commit -m 'Add amazing feature'`）
4. ブランチに**プッシュ**する（`git push origin feature/amazing-feature`）
5. **プルリクエスト**を作成する

コントリビューションのアイデア：
- 新しいプラットフォームエキスパートエージェント
- 既存エージェントのプロンプト改善
- Web UIフロントエンド
- テストとドキュメント

## ライセンス

このプロジェクトはApache License 2.0の下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

---

OpenCMOが役に立ったら、スターをお願いします！ ⭐
