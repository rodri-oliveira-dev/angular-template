> 🌐 Idioma: [English](README.md) | **Português (Brasil)**

# Angular Template

[![CI](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/rodri-oliveira-dev/angular-template/branch/main/graph/badge.svg)](https://codecov.io/gh/rodri-oliveira-dev/angular-template)
[![Angular](https://img.shields.io/badge/Angular-22.2-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/rodri-oliveira-dev/angular-template)](LICENSE)

Template Angular pronto para produção, focado em arquitetura sustentável, fronteiras seguras entre browser e BFF, quality gates automatizados, testes e observabilidade.

O modo padrão de desenvolvimento usa um mock em memória. Assim, um checkout novo funciona sem backend, conta em cloud, banco de dados, provedor de identidade ou qualquer outra infraestrutura externa.

## Baseline

- Angular 22.2.x
- TypeScript 6.0.x em modo strict
- Node.js 24.15.0+ na linha Node 24
- APIs standalone do Angular e rotas lazy-loaded
- arquitetura feature-first
- SCSS
- npm com `package-lock.json` versionado
- Vitest pelo builder nativo de testes unitários do Angular
- testes de browser com Playwright
- ESLint + Prettier
- gate de cobertura de 85% para statements, branches, functions e lines
- CodeQL, Codecov, CodeRabbit, Dependabot, npm audit e OWASP ZAP
- integração BFF opcional same-origin com suporte a XSRF
- fundação de telemetria vendor-neutral

As versões versionadas são validadas em conjunto pelo CI. Não force combinações de dependências não suportadas com `--force` ou `--legacy-peer-deps`.

## Início rápido

Use a versão de Node.js definida pelo repositório:

```bash
nvm use
```

Instale exatamente o grafo de dependências do lockfile:

```bash
npm ci
```

Inicie a aplicação:

```bash
npm start
```

Abra `http://localhost:4200`.

O modo padrão usa o mock local e não exige serviços externos.

Para o passo a passo completo, consulte [Primeiros passos](docs/pt-BR/getting-started.md).

## Usar como GitHub Template

Depois que este repositório estiver marcado como **Template repository** no GitHub, crie um novo repositório com **Use this template → Create a new repository**. O novo repositório recebe os arquivos do template sem herdar o histórico Git deste projeto.

O projeto copiado pode ser executado imediatamente com `npm ci && npm start`. A renomeação específica da aplicação e a substituição da feature de referência podem ser feitas de forma incremental, sem bloquear o primeiro bootstrap.

Administradores podem seguir [Configuração como Template Repository](docs/pt-BR/template-repository.md).

## Modos de execução

### Mock local

```bash
npm start
```

A feature de referência usa um mock HTTP em memória. Esse é o caminho de desenvolvimento sem infraestrutura e a experiência padrão de um projeto novo.

### BFF local

```bash
npm run start:bff
```

O browser chama o caminho same-origin `/api` e o dev server do Angular faz proxy para `http://localhost:5000` por padrão.

O Angular não contém URLs de serviços internos/downstream. O BFF é responsável pela sessão/autenticação do browser; o Angular cuida do estado de UI, mapeamento de DTOs expostos ao browser, comportamento de XSRF, correlação e telemetria frontend.

Consulte [BFF](docs/pt-BR/bff/README.md).

## Validação

Execute os principais checks de forma independente:

```bash
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run e2e
```

Execute a simulação de bootstrap limpo:

```bash
npm run bootstrap:verify
```

Execute a verificação local completa:

```bash
npm run ci:verify
```

O CI também serve o build de produção pelo harness de headers de segurança e executa o baseline do OWASP ZAP.

## Testes

Testes unitários:

```bash
npm test
```

Cobertura:

```bash
npm run test:coverage
npm run coverage:check
```

Testes de browser:

```bash
npm run e2e
```

Use `npm run e2e:mock` ou `npm run e2e:bff` para executar apenas um dos modos.

Consulte [Testes](docs/pt-BR/testing/README.md).

## Arquitetura

```text
src/app/
├── core/       # infraestrutura global da aplicação
├── shared/     # apresentação reutilizável e utilitários stateless
├── features/   # capacidades de negócio
├── app.config.ts
└── app.routes.ts
```

Os detalhes internos de uma feature permanecem dentro da própria capacidade. Imports entre internals de features diferentes são rejeitados por um check arquitetural automatizado. Responsabilidades cross-cutting reutilizáveis devem ir deliberadamente para `shared/` ou `core/`.

Consulte [Arquitetura](docs/pt-BR/architecture/README.md) e o [índice de ADRs](docs/pt-BR/adr/README.md).

## HTTP e API

O template inclui configuração tipada de API same-origin, correlação, mapeamento de Problem Details, data access pertencente à feature, mapeamento explícito de DTOs e mock local determinístico.

Consulte [HTTP & API](docs/pt-BR/http/README.md).

## Segurança

O baseline frontend bloqueia APIs de bypass de sanitização, acesso direto a Web Storage, acesso direto a cookies legíveis por script e `console` no TypeScript da aplicação. Builds de produção habilitam `security.autoCsp` do Angular. O CI executa auditoria de dependências e OWASP ZAP contra o build de produção.

Consulte [Segurança](docs/pt-BR/security/README.md) e [SECURITY.pt-BR.md](SECURITY.pt-BR.md).

## Observabilidade

O template fornece uma fronteira vendor-neutral de telemetria, com implementações local/no-op, eventos sanitizados e de baixa cardinalidade, tratamento global de erros, telemetria HTTP, navegação e sinais selecionados de performance web. Há uma fronteira de adapter para OpenTelemetry sem exigir collector no desenvolvimento local.

Consulte [Observabilidade](docs/pt-BR/observability/README.md).

## CI/CD e qualidade

Pull requests para `main` e pushes em `main` validam:

- instalação limpa de dependências;
- formatação;
- lint e guardrails de arquitetura/segurança;
- auditoria de dependências;
- cobertura unitária >= 85%;
- build de produção;
- bootstrap limpo do template;
- baseline OWASP ZAP;
- fluxos Playwright mock e BFF;
- análise JavaScript/TypeScript do CodeQL;
- upload LCOV para Codecov quando configurado;
- política de review do CodeRabbit via `.coderabbit.yaml`.

Dependabot monitora npm e GitHub Actions. Actions executáveis são pinadas por SHA imutável.

Consulte [CI/CD](docs/pt-BR/ci/README.md) e [Qualidade de código](docs/pt-BR/quality/README.md).

## Feature de referência

`src/app/features/example` é pequena e substituível de propósito. Ela demonstra:

- ownership feature-first;
- lazy loading de rota;
- data access GET/POST;
- mapeamento de DTO;
- modo mock local;
- requests same-origin compatíveis com BFF;
- Problem Details;
- correlação e comportamento XSRF;
- testes de componente, HTTP, unitários e de browser.

Uma aplicação real pode substituir essa feature após o bootstrap e manter a arquitetura e os guardrails ao redor.

## VS Code

Abra:

```bash
code angular-template.code-workspace
```

O workspace recomenda Angular, ESLint, Prettier, Playwright, GitHub Actions, YAML, Vitest e LCOV e fornece tasks para os comandos do repositório.

## Documentação

Comece pelo [índice de documentação](docs/pt-BR/README.md), que reúne:

- primeiros passos;
- arquitetura e ADRs;
- HTTP/API;
- testes;
- qualidade;
- segurança;
- observabilidade;
- CI/CD;
- integração BFF opcional;
- administração do Template Repository;
- release notes.

## Contribuição e segurança

Consulte [CONTRIBUTING.pt-BR.md](CONTRIBUTING.pt-BR.md) antes de abrir um pull request.

Para vulnerabilidades, siga a orientação de reporte privado em [SECURITY.pt-BR.md](SECURITY.pt-BR.md), em vez de abrir uma issue pública com detalhes de exploração.

## Release

O baseline production-ready é **v1.0.0**. Consulte [CHANGELOG.pt-BR.md](CHANGELOG.pt-BR.md) e as [release notes v1.0.0](docs/pt-BR/releases/v1.0.0.md).
