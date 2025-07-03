# MCP Interface Validator - Akıllı Arayüz Kısıtlamaları ve Doğrulama

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ MCP Interface Validator Olmadan

AI tarafından üretilen frontend ve backend kodunda arayüz tutarsızlığı sorunları olabilir:

- ❌ Frontend API çağrıları backend implementasyonlarıyla eşleşmiyor
- ❌ Tutarsız veri yapısı tanımları çalışma zamanı hatalarına neden oluyor
- ❌ Birleşik arayüz spesifikasyonlarının eksikliği takım işbirliğini zorlaştırıyor
- ❌ Manuel arayüz tutarlılığı kontrolü verimsiz

## ✅ MCP Interface Validator İle

MCP Interface Validator, OpenAPI 3.0 spesifikasyonlarını kullanarak AI tarafından üretilen frontend ve backend kodu arasındaki arayüz tutarlılığını otomatik olarak doğrular.

Cursor'daki promptlarınıza `.use interface` ekleyin:

```txt
Frontend formu ve backend API'si ile kullanıcı giriş sistemi geliştirin. .use interface
```

```txt
CRUD işlemleri ile ürün yönetim modülü oluşturun. .use interface
```

MCP Interface Validator şunları yapacak:
- 🔍 **Akıllı Kısıtlama Enjeksiyonu** - AI promptlarına arayüz doğrulama kısıtlamalarını otomatik olarak ekler
- 📋 **OpenAPI Spesifikasyon Doğrulaması** - Üretilen kodun API spesifikasyonlarını takip etmesini sağlar
- 🔄 **Gerçek Zamanlı Arayüz Kontrolü** - Frontend-backend arayüz tutarlılığını doğrular
- 🛠️ **Çoklu Araç Desteği** - Cursor, Windsurf, Trae, Augment ve diğer AI araçlarını destekler

## 🚀 Temel Özellikler

### Akıllı Kısıtlama Sistemi
- **`.use interface` Komutu** - Arayüz doğrulama kısıtlamalarının tek tıkla etkinleştirilmesi
- **Otomatik Prompt Enjeksiyonu** - OpenAPI kısıtlama promptlarının akıllı tanınması ve enjeksiyonu
- **Çok Dilli Destek** - Çince ve İngilizce komutlar için destek
- **Belirsiz Talimat İşleme** - Kesin olmayan kullanıcı talimatlarını işleme

### Arayüz Doğrulama Motoru
- **OpenAPI 3.0 Desteği** - Tam Swagger spesifikasyon doğrulaması
- **Gerçek Zamanlı Doğrulama** - Kod üretimi sırasında gerçek zamanlı arayüz kontrolü
- **Hata Raporlama** - Detaylı arayüz tutarsızlığı raporları
- **Otomatik Düzeltme Önerileri** - Arayüz onarım önerileri sağlama

### Çoklu Araç Entegrasyonu
- **Cursor** - Cursor AI programlama asistanı için tam destek
- **Windsurf** - Windsurf geliştirme ortamı ile entegrasyon
- **Trae** - Trae AI araçları için destek
- **Augment** - Augment kod asistanı ile uyumlu
- **Claude Desktop** - Claude Desktop uygulaması için destek

## 🛠️ Hızlı Başlangıç

### Gereksinimler
- Node.js >= v18.0.0
- MCP protokolünü destekleyen AI araçları (Cursor, Windsurf, Claude Desktop, vb.)

### Global Kurulum

```bash
npm install -g mcp-interface-validator
```

### GitHub'dan Kurulum

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Yapılandırma Kurulumu

### Cursor'da Yapılandırma

`~/.cursor/mcp.json` dosyasına aşağıdaki yapılandırmayı ekleyin:

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

### Windsurf'te Yapılandırma

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

### Claude Desktop'ta Yapılandırma

`claude_desktop_config.json`'a aşağıdakini ekleyin:

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

### VSCode'da Yapılandırma

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

## 🎯 Kullanım

### Temel Kullanım

1. **Akıllı Kısıtlamaları Etkinleştir**: AI promptlarınıza `.use interface` ekleyin
2. **Gereksinimleri Açıkla**: Geliştirme ihtiyaçlarınızı normal şekilde açıklayın
3. **Otomatik Doğrulama**: Sistem otomatik olarak arayüz doğrulama kısıtlamalarını enjekte eder
4. **Sonuçları Al**: OpenAPI spesifikasyonlarına uygun kod alın

### Örnek Senaryolar

**Kullanıcı Yönetim Sistemi**:
```txt
Frontend form doğrulaması ve backend API'si ile kullanıcı kayıt ve giriş işlevselliği geliştirin. .use interface
```

**Ürün Yönetim Modülü**:
```txt
Ürün CRUD işlemleri oluşturun, frontend React kullanarak, backend Express kullanarak. .use interface
```

**Sipariş İşleme Sistemi**:
```txt
Sipariş oluşturma, sorgulama ve güncelleme işlevlerini uygulayın, frontend-backend veri yapısı tutarlılığını sağlayın. .use interface
```

## 🔧 Gelişmiş Yapılandırma

### Özel Kısıtlama Kuralları

`constraint-config.json` dosyası oluşturun:

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

### Çok Dilli Destek

Desteklenen komut formatları:
- Çince: `.use interface`, `.使用接口`
- İngilizce: `.use interface`, `.apply constraints`

## 📚 Dokümantasyon Bağlantıları

- [Tam Dağıtım Kılavuzu](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Akıllı Kısıtlamalar Kılavuzu](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Sorun Giderme](./TROUBLESHOOTING.md)
- [API Referansı](./api/README.md)
- [Kullanım Örnekleri](./examples/README.md)

## 🌟 Temel Avantajlar

- **Sıfır Yapılandırma Başlatma** - Kurulumdan sonra kullanıma hazır, karmaşık yapılandırma gerekmez
- **Akıllı Tanıma** - Arayüz doğrulama gereksinimlerini otomatik olarak tanır
- **Gerçek Zamanlı Geri Bildirim** - Anlık arayüz tutarlılığı kontrolü
- **Çapraz Platform Desteği** - Windows, macOS, Linux için tam destek
- **Açık Kaynak ve Ücretsiz** - MIT lisansı, tamamen açık kaynak

## 🤝 Katkıda Bulunma

Issues ve Pull Request'ler memnuniyetle karşılanır!

## 📄 Lisans

MIT Lisansı - Ayrıntılar için [LICENSE](../LICENSE) dosyasına bakın
