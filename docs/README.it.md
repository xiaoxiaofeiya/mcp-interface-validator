# MCP Interface Validator - Vincoli di Interfaccia Intelligenti e Validazione

[![Sito web](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Senza MCP Interface Validator

Il codice frontend e backend generato dall'IA può avere problemi di inconsistenza dell'interfaccia:

- ❌ Le chiamate API frontend non corrispondono alle implementazioni backend
- ❌ Definizioni di struttura dati inconsistenti che causano errori di runtime
- ❌ Mancanza di specifiche di interfaccia unificate, rendendo difficile la collaborazione del team
- ❌ Il controllo manuale della consistenza dell'interfaccia è inefficiente

## ✅ Con MCP Interface Validator

MCP Interface Validator valida automaticamente la consistenza dell'interfaccia tra il codice frontend e backend generato dall'IA utilizzando le specifiche OpenAPI 3.0.

Aggiungi `.use interface` ai tuoi prompt in Cursor:

```txt
Sviluppare un sistema di login utente con form frontend e API backend. .use interface
```

```txt
Creare un modulo di gestione prodotti con operazioni CRUD. .use interface
```

MCP Interface Validator:
- 🔍 **Iniezione Intelligente di Vincoli** - Aggiungere automaticamente vincoli di validazione dell'interfaccia ai prompt IA
- 📋 **Validazione Specifiche OpenAPI** - Assicurare che il codice generato segua le specifiche API
- 🔄 **Controllo Interfaccia in Tempo Reale** - Validare la consistenza dell'interfaccia frontend-backend
- 🛠️ **Supporto Multi-strumento** - Supporto per Cursor, Windsurf, Trae, Augment e altri strumenti IA

## 🚀 Caratteristiche Principali

### Sistema di Vincoli Intelligenti
- **Comando `.use interface`** - Attivazione con un clic dei vincoli di validazione dell'interfaccia
- **Iniezione Automatica di Prompt** - Riconoscimento intelligente e iniezione di prompt di vincoli OpenAPI
- **Supporto Multi-lingua** - Supporto per comandi cinesi e inglesi
- **Elaborazione Istruzioni Vaghe** - Gestione di istruzioni utente imprecise

### Motore di Validazione Interfaccia
- **Supporto OpenAPI 3.0** - Validazione completa delle specifiche Swagger
- **Validazione in Tempo Reale** - Controllo dell'interfaccia in tempo reale durante la generazione del codice
- **Report degli Errori** - Report dettagliati delle inconsistenze dell'interfaccia
- **Suggerimenti di Auto-correzione** - Fornire suggerimenti di riparazione dell'interfaccia

### Integrazione Multi-strumento
- **Cursor** - Supporto completo per l'assistente di programmazione IA Cursor
- **Windsurf** - Integrazione con l'ambiente di sviluppo Windsurf
- **Trae** - Supporto per strumenti IA Trae
- **Augment** - Compatibile con l'assistente di codice Augment
- **Claude Desktop** - Supporto per l'applicazione Claude Desktop

## 🛠️ Avvio Rapido

### Requisiti
- Node.js >= v18.0.0
- Strumenti IA che supportano il protocollo MCP (Cursor, Windsurf, Claude Desktop, ecc.)

### Installazione Globale

```bash
npm install -g mcp-interface-validator
```

### Installare da GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Configurazione

### Configurare in Cursor

Aggiungi la seguente configurazione al file `~/.cursor/mcp.json`:

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

### Configurare in Windsurf

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

### Configurare in Claude Desktop

Aggiungi quanto segue a `claude_desktop_config.json`:

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

### Configurare in VSCode

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

## 🎯 Utilizzo

### Utilizzo Base

1. **Attivare Vincoli Intelligenti**: Aggiungi `.use interface` ai tuoi prompt IA
2. **Descrivere Requisiti**: Descrivi normalmente le tue esigenze di sviluppo
3. **Validazione Automatica**: Il sistema inietta automaticamente vincoli di validazione dell'interfaccia
4. **Ottenere Risultati**: Ricevi codice conforme alle specifiche OpenAPI

### Scenari di Esempio

**Sistema di Gestione Utenti**:
```txt
Sviluppare funzionalità di registrazione e login utente con validazione form frontend e API backend. .use interface
```

**Modulo di Gestione Prodotti**:
```txt
Creare operazioni CRUD prodotti, frontend usando React, backend usando Express. .use interface
```

**Sistema di Elaborazione Ordini**:
```txt
Implementare funzioni di creazione, query e aggiornamento ordini, assicurando consistenza struttura dati frontend-backend. .use interface
```

## 🔧 Configurazione Avanzata

### Regole di Vincoli Personalizzate

Creare file `constraint-config.json`:

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

### Supporto Multi-lingua

Formati di comando supportati:
- Cinese: `.use interface`, `.使用接口`
- Inglese: `.use interface`, `.apply constraints`

## 📚 Link Documentazione

- [Guida Completa al Deployment](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Guida Vincoli Intelligenti](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Risoluzione Problemi](./TROUBLESHOOTING.md)
- [Riferimento API](./api/README.md)
- [Esempi di Utilizzo](./examples/README.md)

## 🌟 Vantaggi Chiave

- **Avvio Senza Configurazione** - Pronto all'uso dopo l'installazione, nessuna configurazione complessa necessaria
- **Riconoscimento Intelligente** - Riconoscere automaticamente i requisiti di validazione dell'interfaccia
- **Feedback in Tempo Reale** - Controllo istantaneo della consistenza dell'interfaccia
- **Supporto Cross-platform** - Supporto completo per Windows, macOS, Linux
- **Open Source e Gratuito** - Licenza MIT, completamente open source

## 🤝 Contribuire

Issues e Pull Requests sono benvenuti!

## 📄 Licenza

Licenza MIT - Vedere file [LICENSE](../LICENSE) per dettagli
