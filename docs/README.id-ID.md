# MCP Interface Validator - Batasan Interface Cerdas & Validasi

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Tanpa MCP Interface Validator

Kode frontend dan backend yang dihasilkan AI mungkin memiliki masalah inkonsistensi interface:

- ❌ Panggilan API frontend tidak cocok dengan implementasi backend
- ❌ Definisi struktur data yang tidak konsisten menyebabkan error runtime
- ❌ Kurangnya spesifikasi interface yang terpadu, membuat kolaborasi tim sulit
- ❌ Pemeriksaan konsistensi interface manual tidak efisien

## ✅ Dengan MCP Interface Validator

MCP Interface Validator secara otomatis memvalidasi konsistensi interface antara kode frontend dan backend yang dihasilkan AI menggunakan spesifikasi OpenAPI 3.0.

Tambahkan `.use interface` ke prompt Anda di Cursor:

```txt
Kembangkan sistem login pengguna dengan form frontend dan API backend. .use interface
```

```txt
Buat modul manajemen produk dengan operasi CRUD. .use interface
```

MCP Interface Validator akan:
- 🔍 **Injeksi Batasan Cerdas** - Secara otomatis menambahkan batasan validasi interface ke prompt AI
- 📋 **Validasi Spesifikasi OpenAPI** - Memastikan kode yang dihasilkan mengikuti spesifikasi API
- 🔄 **Pemeriksaan Interface Real-time** - Memvalidasi konsistensi interface frontend-backend
- 🛠️ **Dukungan Multi-tool** - Mendukung Cursor, Windsurf, Trae, Augment dan tool AI lainnya

## 🚀 Fitur Utama

### Sistem Batasan Cerdas
- **Perintah `.use interface`** - Aktivasi satu klik untuk batasan validasi interface
- **Injeksi Prompt Otomatis** - Pengenalan cerdas dan injeksi prompt batasan OpenAPI
- **Dukungan Multi-bahasa** - Dukungan untuk perintah Cina dan Inggris
- **Pemrosesan Instruksi Kabur** - Menangani instruksi pengguna yang tidak tepat

### Engine Validasi Interface
- **Dukungan OpenAPI 3.0** - Validasi spesifikasi Swagger lengkap
- **Validasi Real-time** - Pemeriksaan interface real-time selama generasi kode
- **Laporan Error** - Laporan inkonsistensi interface yang detail
- **Saran Auto-fix** - Memberikan saran perbaikan interface

### Integrasi Multi-tool
- **Cursor** - Dukungan penuh untuk asisten pemrograman AI Cursor
- **Windsurf** - Integrasi dengan lingkungan pengembangan Windsurf
- **Trae** - Dukungan untuk tool AI Trae
- **Augment** - Kompatibel dengan asisten kode Augment
- **Claude Desktop** - Dukungan untuk aplikasi Claude Desktop

## 🛠️ Mulai Cepat

### Persyaratan
- Node.js >= v18.0.0
- Tool AI yang mendukung protokol MCP (Cursor, Windsurf, Claude Desktop, dll.)

### Instalasi Global

```bash
npm install -g mcp-interface-validator
```

### Install dari GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Konfigurasi Setup

### Konfigurasi di Cursor

Tambahkan konfigurasi berikut ke file `~/.cursor/mcp.json`:

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

### Konfigurasi di Windsurf

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

### Konfigurasi di Claude Desktop

Tambahkan berikut ke `claude_desktop_config.json`:

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

### Konfigurasi di VSCode

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

## 🎯 Penggunaan

### Penggunaan Dasar

1. **Aktifkan Batasan Cerdas**: Tambahkan `.use interface` ke prompt AI Anda
2. **Deskripsikan Kebutuhan**: Deskripsikan kebutuhan pengembangan Anda secara normal
3. **Validasi Otomatis**: Sistem secara otomatis menyuntikkan batasan validasi interface
4. **Dapatkan Hasil**: Terima kode yang sesuai dengan spesifikasi OpenAPI

### Skenario Contoh

**Sistem Manajemen Pengguna**:
```txt
Kembangkan fungsionalitas registrasi dan login pengguna dengan validasi form frontend dan API backend. .use interface
```

**Modul Manajemen Produk**:
```txt
Buat operasi CRUD produk, frontend menggunakan React, backend menggunakan Express. .use interface
```

**Sistem Pemrosesan Pesanan**:
```txt
Implementasikan fungsi pembuatan, query, dan update pesanan, memastikan konsistensi struktur data frontend-backend. .use interface
```

## 🔧 Konfigurasi Lanjutan

### Aturan Batasan Kustom

Buat file `constraint-config.json`:

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

### Dukungan Multi-bahasa

Format perintah yang didukung:
- Cina: `.use interface`, `.使用接口`
- Inggris: `.use interface`, `.apply constraints`

## 📚 Link Dokumentasi

- [Panduan Deployment Lengkap](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Panduan Batasan Cerdas](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Referensi API](./api/README.md)
- [Contoh Penggunaan](./examples/README.md)

## 🌟 Keunggulan Utama

- **Startup Tanpa Konfigurasi** - Siap pakai setelah instalasi, tidak perlu konfigurasi kompleks
- **Pengenalan Cerdas** - Secara otomatis mengenali kebutuhan validasi interface
- **Feedback Real-time** - Pemeriksaan konsistensi interface instan
- **Dukungan Cross-platform** - Dukungan penuh untuk Windows, macOS, Linux
- **Open Source & Gratis** - Lisensi MIT, sepenuhnya open source

## 🤝 Berkontribusi

Issues dan Pull Requests sangat diterima!

## 📄 Lisensi

Lisensi MIT - Lihat file [LICENSE](../LICENSE) untuk detail
