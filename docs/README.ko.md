# MCP 인터페이스 검증기 - 지능형 인터페이스 제약 및 검증

[![웹사이트](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ MCP 인터페이스 검증기 없이

AI 생성 프론트엔드 및 백엔드 코드에는 인터페이스 불일치 문제가 있을 수 있습니다:

- ❌ 프론트엔드 API 호출이 백엔드 구현과 일치하지 않음
- ❌ 일관성 없는 데이터 구조 정의로 런타임 오류 발생
- ❌ 통합된 인터페이스 사양 부족으로 팀 협업 어려움
- ❌ 수동 인터페이스 일관성 검사는 비효율적

## ✅ MCP 인터페이스 검증기 사용

MCP 인터페이스 검증기는 OpenAPI 3.0 사양을 사용하여 AI 생성 프론트엔드 및 백엔드 코드 간의 인터페이스 일관성을 자동으로 검증합니다.

Cursor의 프롬프트에 `.use interface`를 추가하세요:

```txt
프론트엔드 폼과 백엔드 API가 포함된 사용자 로그인 시스템을 개발하세요. .use interface
```

```txt
CRUD 작업이 포함된 제품 관리 모듈을 생성하세요. .use interface
```

MCP 인터페이스 검증기는:
- 🔍 **지능형 제약 주입** - AI 프롬프트에 인터페이스 검증 제약을 자동 추가
- 📋 **OpenAPI 사양 검증** - 생성된 코드가 API 사양을 따르도록 보장
- 🔄 **실시간 인터페이스 검사** - 프론트엔드-백엔드 인터페이스 일관성 검증
- 🛠️ **멀티 도구 지원** - Cursor, Windsurf, Trae, Augment 및 기타 AI 도구 지원

## 🚀 핵심 기능

### 지능형 제약 시스템
- **`.use interface` 명령** - 인터페이스 검증 제약의 원클릭 활성화
- **자동 프롬프트 주입** - OpenAPI 제약 프롬프트의 지능형 인식 및 주입
- **다국어 지원** - 중국어 및 영어 명령 지원
- **모호한 지시 처리** - 부정확한 사용자 지시 처리

### 인터페이스 검증 엔진
- **OpenAPI 3.0 지원** - 완전한 Swagger 사양 검증
- **실시간 검증** - 코드 생성 중 실시간 인터페이스 검사
- **오류 보고** - 상세한 인터페이스 불일치 보고서
- **자동 수정 제안** - 인터페이스 수리 제안 제공

### 멀티 도구 통합
- **Cursor** - Cursor AI 프로그래밍 어시스턴트 완전 지원
- **Windsurf** - Windsurf 개발 환경과의 통합
- **Trae** - Trae AI 도구 지원
- **Augment** - Augment 코드 어시스턴트와 호환
- **Claude Desktop** - Claude Desktop 애플리케이션 지원

## 🛠️ 빠른 시작

### 요구사항
- Node.js >= v18.0.0
- MCP 프로토콜을 지원하는 AI 도구 (Cursor, Windsurf, Claude Desktop 등)

### 전역 설치

```bash
npm install -g mcp-interface-validator
```

### GitHub에서 설치

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 구성 설정

### Cursor에서 구성

`~/.cursor/mcp.json` 파일에 다음 구성을 추가하세요:

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

### Windsurf에서 구성

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

### Claude Desktop에서 구성

`claude_desktop_config.json`에 다음을 추가하세요:

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

### VSCode에서 구성

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

## 🎯 사용법

### 기본 사용법

1. **지능형 제약 활성화**: AI 프롬프트에 `.use interface`를 추가
2. **요구사항 설명**: 개발 요구사항을 정상적으로 설명
3. **자동 검증**: 시스템이 자동으로 인터페이스 검증 제약을 주입
4. **결과 받기**: OpenAPI 사양을 준수하는 코드 수신

### 예시 시나리오

**사용자 관리 시스템**:
```txt
프론트엔드 폼 검증과 백엔드 API가 포함된 사용자 등록 및 로그인 기능을 개발하세요. .use interface
```

**제품 관리 모듈**:
```txt
제품 CRUD 작업을 생성하고, 프론트엔드는 React, 백엔드는 Express를 사용하세요. .use interface
```

**주문 처리 시스템**:
```txt
주문 생성, 조회, 업데이트 기능을 구현하여 프론트엔드-백엔드 데이터 구조 일관성을 보장하세요. .use interface
```

## 🔧 고급 구성

### 사용자 정의 제약 규칙

`constraint-config.json` 파일 생성:

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

### 다국어 지원

지원되는 명령 형식:
- 중국어: `.use interface`, `.使用接口`
- 영어: `.use interface`, `.apply constraints`

## 📚 문서 링크

- [완전한 배포 가이드](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [지능형 제약 가이드](./INTELLIGENT-VALIDATION-GUIDE.md)
- [문제 해결](./TROUBLESHOOTING.md)
- [API 참조](./api/README.md)
- [사용 예제](./examples/README.md)

## 🌟 주요 장점

- **제로 구성 시작** - 설치 후 바로 사용 가능, 복잡한 구성 불필요
- **지능형 인식** - 인터페이스 검증 요구사항 자동 인식
- **실시간 피드백** - 즉시 인터페이스 일관성 검사
- **크로스 플랫폼 지원** - Windows, macOS, Linux 완전 지원
- **오픈 소스 및 무료** - MIT 라이선스, 완전히 오픈 소스

## 🤝 기여

Issues와 Pull Requests를 환영합니다!

## 📄 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](../LICENSE) 파일 참조
