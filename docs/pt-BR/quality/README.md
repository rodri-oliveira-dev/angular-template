> 🌐 Idioma: [English](../../../docs/quality/README.md) | **Português (Brasil)**

# Qualidade de código

O template separa análise estática de formatação:

- **ESLint** é responsável por regras de qualidade, Angular, TypeScript e templates.
- **Prettier** é responsável pela formatação.
- **Feature boundary check** impede imports diretos de uma feature para outra.
- **Frontend security check** rejeita padrões client-side de alto risco, como bypass de sanitização e acesso direto a browser storage propenso a credenciais.

Isso evita regras de estilo duplicadas ou conflitantes entre linter e formatter.

## Comandos

Execute lint e guardrails de arquitetura:

```bash
npm run lint
npm run security:test
npm run security:audit
```

Aplique correções seguras do ESLint e execute novamente o check arquitetural:

```bash
npm run lint:fix
```

Formate os arquivos suportados do repositório:

```bash
npm run format
```

Valide formatação sem alterar arquivos:

```bash
npm run format:check
```

## Baseline ESLint

A configuração flat combina:

- regras recomendadas do ESLint;
- regras recomendadas do typescript-eslint;
- regras TypeScript recomendadas do angular-eslint;
- regras recomendadas e de acessibilidade para templates do angular-eslint.

Seletores de components e directives usam o prefixo `app`.

Regras puramente estilísticas não são duplicadas no ESLint. `eslint-config-prettier` é aplicado por último para que o Prettier permaneça a única autoridade de formatação.

## Fronteira de imports de feature

Arquivos em `src/app/features/<feature>/` podem importar:

- código da mesma feature;
- `core/`;
- `shared/`;
- pacotes third-party.

Eles não devem importar diretamente a implementação de outra feature.

`npm run architecture:check` analisa imports TypeScript e falha quando um import relativo cruza de uma feature para outra.

Se duas features precisarem da mesma abstração, mova a menor responsabilidade reutilizável para `shared/` ou `core/`, em vez de criar acoplamento feature-to-feature.

## Bundle budgets

Budgets do build de produção permanecem aplicados em `angular.json`:

| Budget              | Warning | Error |
| ------------------- | ------: | ----: |
| Bundle inicial      |  500 kB |  1 MB |
| Estilo de component |    4 kB |  8 kB |

Alterações de budget devem ser explícitas e justificadas no pull request, em vez de simplesmente aumentadas para fazer um build passar.

## Quality gate local

Antes de abrir ou aprovar um pull request, execute:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

Cobertura e E2E permanecem disponíveis por `npm run test:coverage` e `npm run e2e`. O gate de segurança pode ser executado com `npm run security:all`.
