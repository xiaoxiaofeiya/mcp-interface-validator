# MCP Interface Validator - Intelligente Interface-Beschränkungen & Validierung

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Ohne MCP Interface Validator

KI-generierter Frontend- und Backend-Code kann Interface-Inkonsistenz-Probleme haben:

- ❌ Frontend-API-Aufrufe stimmen nicht mit Backend-Implementierungen überein
- ❌ Inkonsistente Datenstrukturdefinitionen verursachen Laufzeitfehler
- ❌ Mangel an einheitlichen Interface-Spezifikationen erschwert Teamzusammenarbeit
- ❌ Manuelle Interface-Konsistenzprüfung ist ineffizient

## ✅ Mit MCP Interface Validator

MCP Interface Validator validiert automatisch die Interface-Konsistenz zwischen KI-generiertem Frontend- und Backend-Code unter Verwendung von OpenAPI 3.0-Spezifikationen.

Fügen Sie `.use interface` zu Ihren Prompts in Cursor hinzu:

```txt
Entwickeln Sie ein Benutzer-Login-System mit Frontend-Formular und Backend-API. .use interface
```

```txt
Erstellen Sie ein Produktverwaltungsmodul mit CRUD-Operationen. .use interface
```

MCP Interface Validator wird:
- 🔍 **Intelligente Beschränkungs-Injektion** - Automatisches Hinzufügen von Interface-Validierungsbeschränkungen zu KI-Prompts
- 📋 **OpenAPI-Spezifikationsvalidierung** - Sicherstellen, dass generierter Code API-Spezifikationen folgt
- 🔄 **Echtzeit-Interface-Prüfung** - Validierung der Frontend-Backend-Interface-Konsistenz
- 🛠️ **Multi-Tool-Unterstützung** - Unterstützung für Cursor, Windsurf, Trae, Augment und andere KI-Tools

## 🚀 Kernfunktionen

### Intelligentes Beschränkungssystem
- **`.use interface` Befehl** - Ein-Klick-Aktivierung von Interface-Validierungsbeschränkungen
- **Automatische Prompt-Injektion** - Intelligente Erkennung und Injektion von OpenAPI-Beschränkungs-Prompts
- **Mehrsprachige Unterstützung** - Unterstützung für chinesische und englische Befehle
- **Unscharfe Anweisungsverarbeitung** - Behandlung ungenauer Benutzeranweisungen

### Interface-Validierungs-Engine
- **OpenAPI 3.0-Unterstützung** - Vollständige Swagger-Spezifikationsvalidierung
- **Echtzeit-Validierung** - Echtzeit-Interface-Prüfung während der Code-Generierung
- **Fehlerberichterstattung** - Detaillierte Interface-Inkonsistenz-Berichte
- **Auto-Fix-Vorschläge** - Bereitstellung von Interface-Reparaturvorschlägen

### Multi-Tool-Integration
- **Cursor** - Vollständige Unterstützung für Cursor KI-Programmierassistent
- **Windsurf** - Integration mit Windsurf-Entwicklungsumgebung
- **Trae** - Unterstützung für Trae KI-Tools
- **Augment** - Kompatibel mit Augment Code-Assistent
- **Claude Desktop** - Unterstützung für Claude Desktop-Anwendung

## 🛠️ Schnellstart

### Anforderungen
- Node.js >= v18.0.0
- KI-Tools, die das MCP-Protokoll unterstützen (Cursor, Windsurf, Claude Desktop, etc.)

### Globale Installation

```bash
npm install -g mcp-interface-validator
```

### Installation von GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Konfiguration

### Konfiguration in Cursor

Fügen Sie die folgende Konfiguration zur `~/.cursor/mcp.json` Datei hinzu:

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

### Konfiguration in Windsurf

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

### Konfiguration in Claude Desktop

Fügen Sie folgendes zu `claude_desktop_config.json` hinzu:

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

### Konfiguration in VSCode

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

## 🎯 Verwendung

### Grundlegende Verwendung

1. **Intelligente Beschränkungen aktivieren**: Fügen Sie `.use interface` zu Ihren KI-Prompts hinzu
2. **Anforderungen beschreiben**: Beschreiben Sie Ihre Entwicklungsanforderungen normal
3. **Automatische Validierung**: System injiziert automatisch Interface-Validierungsbeschränkungen
4. **Ergebnisse erhalten**: Erhalten Sie Code, der OpenAPI-Spezifikationen entspricht

### Beispielszenarien

**Benutzerverwaltungssystem**:
```txt
Entwickeln Sie Benutzerregistrierungs- und Login-Funktionalität mit Frontend-Formularvalidierung und Backend-API. .use interface
```

**Produktverwaltungsmodul**:
```txt
Erstellen Sie Produkt-CRUD-Operationen, Frontend mit React, Backend mit Express. .use interface
```

**Bestellverarbeitungssystem**:
```txt
Implementieren Sie Bestellerstellung, -abfrage und -aktualisierungsfunktionen, um Frontend-Backend-Datenstrukturkonsistenz sicherzustellen. .use interface
```

## 🔧 Erweiterte Konfiguration

### Benutzerdefinierte Beschränkungsregeln

Erstellen Sie eine `constraint-config.json` Datei:

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

### Mehrsprachige Unterstützung

Unterstützte Befehlsformate:
- Chinesisch: `.use interface`, `.使用接口`
- Englisch: `.use interface`, `.apply constraints`

## 📚 Dokumentationslinks

- [Vollständiger Bereitstellungsleitfaden](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Intelligenter Beschränkungsleitfaden](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Fehlerbehebung](./TROUBLESHOOTING.md)
- [API-Referenz](./api/README.md)
- [Verwendungsbeispiele](./examples/README.md)

## 🌟 Hauptvorteile

- **Null-Konfiguration-Start** - Sofort einsatzbereit nach Installation, keine komplexe Konfiguration erforderlich
- **Intelligente Erkennung** - Automatische Erkennung von Interface-Validierungsanforderungen
- **Echtzeit-Feedback** - Sofortige Interface-Konsistenzprüfung
- **Plattformübergreifende Unterstützung** - Vollständige Unterstützung für Windows, macOS, Linux
- **Open Source & Kostenlos** - MIT-Lizenz, vollständig Open Source

## 🤝 Beitragen

Issues und Pull Requests sind willkommen!

## 📄 Lizenz

MIT-Lizenz - Siehe [LICENSE](../LICENSE) Datei für Details
