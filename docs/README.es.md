# Validador de Interfaz MCP - Restricciones Inteligentes de Interfaz y Validación

[![Sitio web](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Sin Validador de Interfaz MCP

El código frontend y backend generado por IA puede tener problemas de inconsistencia de interfaz:

- ❌ Las llamadas API del frontend no coinciden con las implementaciones del backend
- ❌ Definiciones de estructura de datos inconsistentes que causan errores en tiempo de ejecución
- ❌ Falta de especificaciones de interfaz unificadas, dificultando la colaboración en equipo
- ❌ La verificación manual de consistencia de interfaz es ineficiente

## ✅ Con Validador de Interfaz MCP

El Validador de Interfaz MCP valida automáticamente la consistencia de interfaz entre el código frontend y backend generado por IA usando especificaciones OpenAPI 3.0.

Agregue `.use interface` a sus prompts en Cursor:

```txt
Desarrollar un sistema de login de usuario con formulario frontend y API backend. .use interface
```

```txt
Crear un módulo de gestión de productos con operaciones CRUD. .use interface
```

El Validador de Interfaz MCP:
- 🔍 **Inyección Inteligente de Restricciones** - Agregar automáticamente restricciones de validación de interfaz a prompts de IA
- 📋 **Validación de Especificaciones OpenAPI** - Asegurar que el código generado siga las especificaciones API
- 🔄 **Verificación de Interfaz en Tiempo Real** - Validar consistencia de interfaz frontend-backend
- 🛠️ **Soporte Multi-herramienta** - Soporte para Cursor, Windsurf, Trae, Augment y otras herramientas de IA

## 🚀 Características Principales

### Sistema de Restricciones Inteligentes
- **Comando `.use interface`** - Activación con un clic de restricciones de validación de interfaz
- **Inyección Automática de Prompts** - Reconocimiento inteligente e inyección de prompts de restricciones OpenAPI
- **Soporte Multi-idioma** - Soporte para comandos en chino e inglés
- **Procesamiento de Instrucciones Difusas** - Manejo de instrucciones de usuario imprecisas

### Motor de Validación de Interfaz
- **Soporte OpenAPI 3.0** - Validación completa de especificaciones Swagger
- **Validación en Tiempo Real** - Verificación de interfaz en tiempo real durante la generación de código
- **Reportes de Errores** - Reportes detallados de inconsistencias de interfaz
- **Sugerencias de Auto-corrección** - Proporcionar sugerencias de reparación de interfaz

### Integración Multi-herramienta
- **Cursor** - Soporte completo para asistente de programación IA Cursor
- **Windsurf** - Integración con entorno de desarrollo Windsurf
- **Trae** - Soporte para herramientas IA Trae
- **Augment** - Compatible con asistente de código Augment
- **Claude Desktop** - Soporte para aplicación Claude Desktop

## 🛠️ Inicio Rápido

### Requisitos
- Node.js >= v18.0.0
- Herramientas de IA que soporten protocolo MCP (Cursor, Windsurf, Claude Desktop, etc.)

### Instalación Global

```bash
npm install -g mcp-interface-validator
```

### Instalar desde GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Configuración

### Configurar en Cursor

Agregue la siguiente configuración al archivo `~/.cursor/mcp.json`:

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

### Configurar en Windsurf

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

### Configurar en Claude Desktop

Agregue lo siguiente a `claude_desktop_config.json`:

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

### Configurar en VSCode

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

1. **Activar Restricciones Inteligentes**: Agregue `.use interface` a sus prompts de IA
2. **Describir Requisitos**: Describa normalmente sus necesidades de desarrollo
3. **Validación Automática**: El sistema inyecta automáticamente restricciones de validación de interfaz
4. **Obtener Resultados**: Reciba código que cumple con especificaciones OpenAPI

### Escenarios de Ejemplo

**Sistema de Gestión de Usuarios**:
```txt
Desarrollar funcionalidad de registro e inicio de sesión de usuario con validación de formulario frontend y API backend. .use interface
```

**Módulo de Gestión de Productos**:
```txt
Crear operaciones CRUD de productos, frontend usando React, backend usando Express. .use interface
```

**Sistema de Procesamiento de Pedidos**:
```txt
Implementar funciones de creación, consulta y actualización de pedidos, asegurando consistencia de estructura de datos frontend-backend. .use interface
```

## 🔧 Configuración Avanzada

### Reglas de Restricciones Personalizadas

Crear archivo `constraint-config.json`:

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

### Soporte Multi-idioma

Formatos de comando soportados:
- Chino: `.use interface`, `.使用接口`
- Inglés: `.use interface`, `.apply constraints`

## 📚 Enlaces de Documentación

- [Guía Completa de Despliegue](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Guía de Restricciones Inteligentes](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Solución de Problemas](./TROUBLESHOOTING.md)
- [Referencia API](./api/README.md)
- [Ejemplos de Uso](./examples/README.md)

## 🌟 Ventajas Clave

- **Inicio Sin Configuración** - Listo para usar después de la instalación, no se necesita configuración compleja
- **Reconocimiento Inteligente** - Reconocer automáticamente requisitos de validación de interfaz
- **Retroalimentación en Tiempo Real** - Verificación instantánea de consistencia de interfaz
- **Soporte Multiplataforma** - Soporte completo para Windows, macOS, Linux
- **Código Abierto y Gratuito** - Licencia MIT, completamente código abierto

## 🤝 Contribuir

¡Issues y Pull Requests son bienvenidos!

## 📄 Licencia

Licencia MIT - Ver archivo [LICENSE](../LICENSE) para detalles
