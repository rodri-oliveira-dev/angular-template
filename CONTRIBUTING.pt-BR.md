> 🌐 Idioma: [English](CONTRIBUTING.md) | **Português (Brasil)**

# Contribuindo

Contribuições são bem-vindas quando preservam o papel deste repositório como template Angular reutilizável, em vez de adicionar comportamento específico de uma aplicação.

## Pré-requisitos

- Node.js 24.15.0+ na linha Node 24
- npm
- Chromium instalado pelo Playwright para testes de browser

Use o runtime versionado:

```bash
nvm use
npm ci
```

Não use `--force` ou `--legacy-peer-deps` para contornar conflitos de peer dependencies.

## Desenvolvimento

O caminho de desenvolvimento sem infraestrutura é:

```bash
npm start
```

Use o modo BFF apenas ao validar essa fronteira de integração:

```bash
npm run start:bff
```

## Antes de abrir um pull request

Execute:

```bash
npm run ci:verify
```

No mínimo, um PR deve manter verdes: formatação, lint/guardrails de arquitetura e segurança, auditoria de dependências, testes, cobertura, build de produção, bootstrap limpo e testes de browser.

Os thresholds de cobertura são 85% para statements, branches, functions e lines. Aumentos de bundle budget devem ser justificados, e não usados para esconder regressões.

## Expectativas arquiteturais

- mantenha capacidades de negócio em `features/<feature>`;
- não importe internals de outra feature;
- reserve `core/` para infraestrutura global da aplicação;
- reserve `shared/` para apresentação/utilitários stateless realmente reutilizáveis;
- mantenha a configuração de API exposta ao browser same-origin por padrão;
- não coloque secrets, access tokens, refresh tokens ou identificadores de sessão em configuração client-side ou Web Storage.

Consulte `docs/architecture`, `docs/security` e `docs/bff` antes de alterar essas fronteiras.

## Pull requests

Mantenha PRs focados e explique:

- o que mudou e por quê;
- impacto arquitetural/de segurança;
- testes adicionados ou alterados;
- impacto na documentação;
- qualquer alteração intencional de budget, dependência ou compatibilidade.

Resolva as threads de review antes do merge. O comentário de status do CI no PR identifica o gate que falhou e aponta para a execução do workflow.

## Atualizações de dependências

Updates patch/minor compatíveis podem ser tratados pelo Dependabot. Upgrades major da toolchain devem ser deliberados e respeitar as faixas oficiais de compatibilidade de Angular, TypeScript, Node.js e ferramentas de lint/build.

## Documentação

Atualize a documentação no mesmo PR quando comportamento, comandos, versões suportadas, fronteiras de segurança ou expectativas operacionais mudarem.
