# MCP 介面驗證器 - 智慧介面約束與驗證

[![網站](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ 不使用 MCP 介面驗證器

AI 生成的前端和後端程式碼可能存在介面不一致問題：

- ❌ 前端 API 呼叫與後端實作不匹配
- ❌ 不一致的資料結構定義導致執行時錯誤
- ❌ 缺乏統一的介面規範，使團隊協作困難
- ❌ 手動介面一致性檢查效率低下

## ✅ 使用 MCP 介面驗證器

MCP 介面驗證器使用 OpenAPI 3.0 規範自動驗證 AI 生成的前端和後端程式碼之間的介面一致性。

在 Cursor 的提示中加入 `.use interface`：

```txt
開發包含前端表單和後端 API 的使用者登入系統。.use interface
```

```txt
建立包含 CRUD 操作的產品管理模組。.use interface
```

MCP 介面驗證器將：
- 🔍 **智慧約束注入** - 自動向 AI 提示添加介面驗證約束
- 📋 **OpenAPI 規範驗證** - 確保生成的程式碼遵循 API 規範
- 🔄 **即時介面檢查** - 驗證前端-後端介面一致性
- 🛠️ **多工具支援** - 支援 Cursor、Windsurf、Trae、Augment 和其他 AI 工具

## 🚀 核心功能

### 智慧約束系統
- **`.use interface` 指令** - 一鍵啟用介面驗證約束
- **自動提示注入** - 智慧識別並注入 OpenAPI 約束提示
- **多語言支援** - 支援中文和英文指令
- **模糊指令處理** - 處理不精確的使用者指令

### 介面驗證引擎
- **OpenAPI 3.0 支援** - 完整的 Swagger 規範驗證
- **即時驗證** - 程式碼生成期間的即時介面檢查
- **錯誤報告** - 詳細的介面不一致報告
- **自動修復建議** - 提供介面修復建議

### 多工具整合
- **Cursor** - 完整支援 Cursor AI 程式設計助手
- **Windsurf** - 與 Windsurf 開發環境整合
- **Trae** - 支援 Trae AI 工具
- **Augment** - 與 Augment 程式碼助手相容
- **Claude Desktop** - 支援 Claude Desktop 應用程式

## 🛠️ 快速開始

### 需求
- Node.js >= v18.0.0
- 支援 MCP 協定的 AI 工具（Cursor、Windsurf、Claude Desktop 等）

### 全域安裝

```bash
npm install -g mcp-interface-validator
```

### 從 GitHub 安裝

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 設定配置

### 在 Cursor 中設定

將以下設定新增至 `~/.cursor/mcp.json` 檔案：

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

### 在 Windsurf 中設定

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

### 在 Claude Desktop 中設定

將以下內容新增至 `claude_desktop_config.json`：

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

### 在 VSCode 中設定

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

### 基本使用

1. **啟用智慧約束**：在您的 AI 提示中新增 `.use interface`
2. **描述需求**：正常描述您的開發需求
3. **自動驗證**：系統自動注入介面驗證約束
4. **獲得結果**：接收符合 OpenAPI 規範的程式碼

### 範例場景

**使用者管理系統**：
```txt
開發包含前端表單驗證和後端 API 的使用者註冊和登入功能。.use interface
```

**產品管理模組**：
```txt
建立產品 CRUD 操作，前端使用 React，後端使用 Express。.use interface
```

**訂單處理系統**：
```txt
實作訂單建立、查詢和更新功能，確保前端-後端資料結構一致性。.use interface
```

## 🔧 進階設定

### 自訂約束規則

建立 `constraint-config.json` 檔案：

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

### 多語言支援

支援的指令格式：
- 中文：`.use interface`、`.使用接口`
- 英文：`.use interface`、`.apply constraints`

## 📚 文件連結

- [完整部署指南](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [智慧約束指南](./INTELLIGENT-VALIDATION-GUIDE.md)
- [疑難排解](./TROUBLESHOOTING.md)
- [API 參考](./api/README.md)
- [使用範例](./examples/README.md)

## 🌟 主要優勢

- **零設定啟動** - 安裝後即可使用，無需複雜設定
- **智慧識別** - 自動識別介面驗證需求
- **即時回饋** - 即時介面一致性檢查
- **跨平台支援** - 完整支援 Windows、macOS、Linux
- **開源且免費** - MIT 授權，完全開源

## 🤝 貢獻

歡迎 Issues 和 Pull Requests！

## 📄 授權

MIT 授權 - 詳情請參閱 [LICENSE](../LICENSE) 檔案
