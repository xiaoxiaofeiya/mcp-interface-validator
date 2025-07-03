# MCP インターフェースバリデーター - インテリジェントなインターフェース制約と検証

[![ウェブサイト](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ MCP インターフェースバリデーターなし

AI生成のフロントエンドとバックエンドコードには、インターフェースの不整合問題がある可能性があります：

- ❌ フロントエンドのAPI呼び出しがバックエンドの実装と一致しない
- ❌ 一貫性のないデータ構造定義がランタイムエラーを引き起こす
- ❌ 統一されたインターフェース仕様の欠如により、チーム協力が困難
- ❌ 手動でのインターフェース整合性チェックは非効率

## ✅ MCP インターフェースバリデーターあり

MCP インターフェースバリデーターは、OpenAPI 3.0仕様を使用してAI生成のフロントエンドとバックエンドコード間のインターフェース整合性を自動的に検証します。

Cursorのプロンプトに `.use interface` を追加：

```txt
フロントエンドフォームとバックエンドAPIを含むユーザーログインシステムを開発する。.use interface
```

```txt
CRUD操作を含む製品管理モジュールを作成する。.use interface
```

MCP インターフェースバリデーターは：
- 🔍 **インテリジェント制約注入** - AIプロンプトにインターフェース検証制約を自動追加
- 📋 **OpenAPI仕様検証** - 生成されたコードがAPI仕様に従うことを保証
- 🔄 **リアルタイムインターフェースチェック** - フロントエンド-バックエンドインターフェース整合性を検証
- 🛠️ **マルチツールサポート** - Cursor、Windsurf、Trae、AugmentなどのAIツールをサポート

## 🚀 コア機能

### インテリジェント制約システム
- **`.use interface` コマンド** - ワンクリックでインターフェース検証制約を有効化
- **自動プロンプト注入** - OpenAPI制約プロンプトのインテリジェント認識と注入
- **多言語サポート** - 中国語と英語のコマンドをサポート
- **曖昧な指示処理** - 不正確なユーザー指示を処理

### インターフェース検証エンジン
- **OpenAPI 3.0サポート** - 完全なSwagger仕様検証
- **リアルタイム検証** - コード生成中のリアルタイムインターフェースチェック
- **エラーレポート** - 詳細なインターフェース不整合レポート
- **自動修正提案** - インターフェース修復提案を提供

### マルチツール統合
- **Cursor** - Cursor AIプログラミングアシスタントの完全サポート
- **Windsurf** - Windsurf開発環境との統合
- **Trae** - Trae AIツールのサポート
- **Augment** - Augmentコードアシスタントと互換
- **Claude Desktop** - Claude Desktopアプリケーションのサポート

## 🛠️ クイックスタート

### 要件
- Node.js >= v18.0.0
- MCPプロトコルをサポートするAIツール（Cursor、Windsurf、Claude Desktopなど）

### グローバルインストール

```bash
npm install -g mcp-interface-validator
```

### GitHubからインストール

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 設定セットアップ

### Cursorでの設定

`~/.cursor/mcp.json` ファイルに以下の設定を追加：

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### Windsurfでの設定

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### Claude Desktopでの設定

`claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### VSCodeでの設定

```json
{
  "servers": {
    "interface-validator": {
      "type": "stdio",
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

## 🎯 使用方法

### 基本的な使用方法

1. **インテリジェント制約を有効化**: AIプロンプトに `.use interface` を追加
2. **要件を記述**: 開発ニーズを通常通り記述
3. **自動検証**: システムが自動的にインターフェース検証制約を注入
4. **結果を取得**: OpenAPI仕様に準拠したコードを受け取る

### 例のシナリオ

**ユーザー管理システム**:
```txt
フロントエンドフォーム検証とバックエンドAPIを含むユーザー登録とログイン機能を開発する。.use interface
```

**製品管理モジュール**:
```txt
製品CRUD操作を作成、フロントエンドはReact、バックエンドはExpressを使用。.use interface
```

**注文処理システム**:
```txt
注文作成、クエリ、更新機能を実装し、フロントエンド-バックエンドデータ構造の整合性を確保する。.use interface
```

## 🔧 高度な設定

### カスタム制約ルール

`constraint-config.json` ファイルを作成：

```json
{
  "openapi": {
    "version": "3.0.0",
    "strictMode": true,
    "validateResponses": true
  },
  "validation": {
    "realTime": true,
    "autoFix": true
  }
}
```

### 多言語サポート

サポートされるコマンド形式：
- 中国語: `.use interface`、`.使用接口`
- 英語: `.use interface`、`.apply constraints`

## 📚 ドキュメントリンク

- [完全デプロイメントガイド](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [インテリジェント制約ガイド](./INTELLIGENT-VALIDATION-GUIDE.md)
- [トラブルシューティング](./TROUBLESHOOTING.md)
- [APIリファレンス](./api/README.md)
- [使用例](./examples/README.md)

## 🌟 主な利点

- **ゼロ設定スタートアップ** - インストール後すぐに使用可能、複雑な設定不要
- **インテリジェント認識** - インターフェース検証要件を自動認識
- **リアルタイムフィードバック** - 即座のインターフェース整合性チェック
- **クロスプラットフォームサポート** - Windows、macOS、Linuxの完全サポート
- **オープンソース＆無料** - MITライセンス、完全にオープンソース

## 🤝 貢献

IssueとPull Requestを歓迎します！

## 📄 ライセンス

MITライセンス - 詳細は [LICENSE](../LICENSE) ファイルを参照
