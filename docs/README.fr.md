# Validateur d'Interface MCP - Contraintes d'Interface Intelligentes et Validation

[![Site web](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Sans Validateur d'Interface MCP

Le code frontend et backend généré par l'IA peut avoir des problèmes d'incohérence d'interface :

- ❌ Les appels API frontend ne correspondent pas aux implémentations backend
- ❌ Définitions de structure de données incohérentes causant des erreurs d'exécution
- ❌ Manque de spécifications d'interface unifiées, rendant la collaboration d'équipe difficile
- ❌ La vérification manuelle de cohérence d'interface est inefficace

## ✅ Avec Validateur d'Interface MCP

Le Validateur d'Interface MCP valide automatiquement la cohérence d'interface entre le code frontend et backend généré par l'IA en utilisant les spécifications OpenAPI 3.0.

Ajoutez `.use interface` à vos prompts dans Cursor :

```txt
Développer un système de connexion utilisateur avec formulaire frontend et API backend. .use interface
```

```txt
Créer un module de gestion de produits avec opérations CRUD. .use interface
```

Le Validateur d'Interface MCP va :
- 🔍 **Injection Intelligente de Contraintes** - Ajouter automatiquement des contraintes de validation d'interface aux prompts IA
- 📋 **Validation des Spécifications OpenAPI** - S'assurer que le code généré suit les spécifications API
- 🔄 **Vérification d'Interface en Temps Réel** - Valider la cohérence d'interface frontend-backend
- 🛠️ **Support Multi-outils** - Support pour Cursor, Windsurf, Trae, Augment et autres outils IA

## 🚀 Fonctionnalités Principales

### Système de Contraintes Intelligentes
- **Commande `.use interface`** - Activation en un clic des contraintes de validation d'interface
- **Injection Automatique de Prompts** - Reconnaissance intelligente et injection de prompts de contraintes OpenAPI
- **Support Multi-langues** - Support pour les commandes chinoises et anglaises
- **Traitement d'Instructions Floues** - Gestion d'instructions utilisateur imprécises

### Moteur de Validation d'Interface
- **Support OpenAPI 3.0** - Validation complète des spécifications Swagger
- **Validation en Temps Réel** - Vérification d'interface en temps réel pendant la génération de code
- **Rapports d'Erreurs** - Rapports détaillés d'incohérences d'interface
- **Suggestions de Correction Automatique** - Fournir des suggestions de réparation d'interface

### Intégration Multi-outils
- **Cursor** - Support complet pour l'assistant de programmation IA Cursor
- **Windsurf** - Intégration avec l'environnement de développement Windsurf
- **Trae** - Support pour les outils IA Trae
- **Augment** - Compatible avec l'assistant de code Augment
- **Claude Desktop** - Support pour l'application Claude Desktop

## 🛠️ Démarrage Rapide

### Exigences
- Node.js >= v18.0.0
- Outils IA supportant le protocole MCP (Cursor, Windsurf, Claude Desktop, etc.)

### Installation Globale

```bash
npm install -g mcp-interface-validator
```

### Installer depuis GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Configuration

### Configurer dans Cursor

Ajoutez la configuration suivante au fichier `~/.cursor/mcp.json` :

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

### Configurer dans Windsurf

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

### Configurer dans Claude Desktop

Ajoutez ce qui suit à `claude_desktop_config.json` :

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

### Configurer dans VSCode

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

## 🎯 Utilisation

### Utilisation de Base

1. **Activer les Contraintes Intelligentes** : Ajoutez `.use interface` à vos prompts IA
2. **Décrire les Exigences** : Décrivez normalement vos besoins de développement
3. **Validation Automatique** : Le système injecte automatiquement des contraintes de validation d'interface
4. **Obtenir les Résultats** : Recevez du code conforme aux spécifications OpenAPI

### Scénarios d'Exemple

**Système de Gestion d'Utilisateurs** :
```txt
Développer la fonctionnalité d'inscription et de connexion utilisateur avec validation de formulaire frontend et API backend. .use interface
```

**Module de Gestion de Produits** :
```txt
Créer des opérations CRUD de produits, frontend utilisant React, backend utilisant Express. .use interface
```

**Système de Traitement de Commandes** :
```txt
Implémenter les fonctions de création, requête et mise à jour de commandes, assurant la cohérence de structure de données frontend-backend. .use interface
```

## 🔧 Configuration Avancée

### Règles de Contraintes Personnalisées

Créer un fichier `constraint-config.json` :

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

### Support Multi-langues

Formats de commande supportés :
- Chinois : `.use interface`, `.使用接口`
- Anglais : `.use interface`, `.apply constraints`

## 📚 Liens de Documentation

- [Guide de Déploiement Complet](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Guide de Contraintes Intelligentes](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Dépannage](./TROUBLESHOOTING.md)
- [Référence API](./api/README.md)
- [Exemples d'Utilisation](./examples/README.md)

## 🌟 Avantages Clés

- **Démarrage Sans Configuration** - Prêt à utiliser après installation, aucune configuration complexe nécessaire
- **Reconnaissance Intelligente** - Reconnaître automatiquement les exigences de validation d'interface
- **Retour en Temps Réel** - Vérification instantanée de cohérence d'interface
- **Support Multi-plateforme** - Support complet pour Windows, macOS, Linux
- **Open Source et Gratuit** - Licence MIT, complètement open source

## 🤝 Contribuer

Les Issues et Pull Requests sont les bienvenus !

## 📄 Licence

Licence MIT - Voir le fichier [LICENSE](../LICENSE) pour les détails
