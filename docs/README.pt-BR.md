# MCP Interface Validator - Restrições Inteligentes de Interface e Validação

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Sem MCP Interface Validator

Código frontend e backend gerado por IA pode ter problemas de inconsistência de interface:

- ❌ Chamadas de API do frontend não correspondem às implementações do backend
- ❌ Definições de estrutura de dados inconsistentes causam erros de runtime
- ❌ Falta de especificações de interface unificadas, dificultando a colaboração em equipe
- ❌ Verificação manual de consistência de interface é ineficiente

## ✅ Com MCP Interface Validator

O MCP Interface Validator valida automaticamente a consistência de interface entre código frontend e backend gerado por IA usando especificações OpenAPI 3.0.

Adicione `.use interface` aos seus prompts no Cursor:

```txt
Desenvolver um sistema de login de usuário com formulário frontend e API backend. .use interface
```

```txt
Criar um módulo de gerenciamento de produtos com operações CRUD. .use interface
```

O MCP Interface Validator irá:
- 🔍 **Injeção Inteligente de Restrições** - Adicionar automaticamente restrições de validação de interface aos prompts de IA
- 📋 **Validação de Especificações OpenAPI** - Garantir que o código gerado siga as especificações da API
- 🔄 **Verificação de Interface em Tempo Real** - Validar consistência de interface frontend-backend
- 🛠️ **Suporte Multi-ferramentas** - Suporte para Cursor, Windsurf, Trae, Augment e outras ferramentas de IA

## 🚀 Recursos Principais

### Sistema de Restrições Inteligentes
- **Comando `.use interface`** - Ativação com um clique de restrições de validação de interface
- **Injeção Automática de Prompts** - Reconhecimento inteligente e injeção de prompts de restrições OpenAPI
- **Suporte Multi-idioma** - Suporte para comandos em chinês e inglês
- **Processamento de Instruções Vagas** - Lidar com instruções imprecisas do usuário

### Motor de Validação de Interface
- **Suporte OpenAPI 3.0** - Validação completa de especificações Swagger
- **Validação em Tempo Real** - Verificação de interface em tempo real durante a geração de código
- **Relatórios de Erro** - Relatórios detalhados de inconsistências de interface
- **Sugestões de Auto-correção** - Fornecer sugestões de reparo de interface

### Integração Multi-ferramentas
- **Cursor** - Suporte completo para assistente de programação IA Cursor
- **Windsurf** - Integração com ambiente de desenvolvimento Windsurf
- **Trae** - Suporte para ferramentas IA Trae
- **Augment** - Compatível com assistente de código Augment
- **Claude Desktop** - Suporte para aplicação Claude Desktop

## 🛠️ Início Rápido

### Requisitos
- Node.js >= v18.0.0
- Ferramentas de IA que suportam protocolo MCP (Cursor, Windsurf, Claude Desktop, etc.)

### Instalação Global

```bash
npm install -g mcp-interface-validator
```

### Instalar do GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Configuração

### Configurar no Cursor

Adicione a seguinte configuração ao arquivo `~/.cursor/mcp.json`:

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

### Configurar no Windsurf

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

### Configurar no Claude Desktop

Adicione o seguinte ao `claude_desktop_config.json`:

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

### Configurar no VSCode

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

## 🎯 Uso

### Uso Básico

1. **Ativar Restrições Inteligentes**: Adicione `.use interface` aos seus prompts de IA
2. **Descrever Requisitos**: Descreva normalmente suas necessidades de desenvolvimento
3. **Validação Automática**: O sistema injeta automaticamente restrições de validação de interface
4. **Obter Resultados**: Receba código que está em conformidade com especificações OpenAPI

### Cenários de Exemplo

**Sistema de Gerenciamento de Usuários**:
```txt
Desenvolver funcionalidade de registro e login de usuário com validação de formulário frontend e API backend. .use interface
```

**Módulo de Gerenciamento de Produtos**:
```txt
Criar operações CRUD de produtos, frontend usando React, backend usando Express. .use interface
```

**Sistema de Processamento de Pedidos**:
```txt
Implementar funções de criação, consulta e atualização de pedidos, garantindo consistência de estrutura de dados frontend-backend. .use interface
```

## 🔧 Configuração Avançada

### Regras de Restrições Personalizadas

Criar arquivo `constraint-config.json`:

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

### Suporte Multi-idioma

Formatos de comando suportados:
- Chinês: `.use interface`, `.使用接口`
- Inglês: `.use interface`, `.apply constraints`

## 📚 Links de Documentação

- [Guia Completo de Implantação](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Guia de Restrições Inteligentes](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Solução de Problemas](./TROUBLESHOOTING.md)
- [Referência da API](./api/README.md)
- [Exemplos de Uso](./examples/README.md)

## 🌟 Principais Vantagens

- **Inicialização Sem Configuração** - Pronto para usar após instalação, nenhuma configuração complexa necessária
- **Reconhecimento Inteligente** - Reconhecer automaticamente requisitos de validação de interface
- **Feedback em Tempo Real** - Verificação instantânea de consistência de interface
- **Suporte Multi-plataforma** - Suporte completo para Windows, macOS, Linux
- **Código Aberto e Gratuito** - Licença MIT, completamente código aberto

## 🤝 Contribuindo

Issues e Pull Requests são bem-vindos!

## 📄 Licença

Licença MIT - Veja o arquivo [LICENSE](../LICENSE) para detalhes
