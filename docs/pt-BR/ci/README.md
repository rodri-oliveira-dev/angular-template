> 🌐 Idioma: [English](../../../docs/ci/README.md) | **Português (Brasil)**

# Integração Contínua

O repositório usa GitHub Actions como quality gate para pull requests e para a branch `main`.

## Validação do pacote Schematics

O CI de pull request tem um job separado `Packaged Schematics consumer`. Ele instala apenas a
toolchain da coleção, executa testes em árvore virtual, inspeciona e instala de forma limpa o arquivo
exato produzido por `npm pack`, depois gera uma aplicação temporária pelo pacote instalado e executa
todos os gates de qualidade, cobertura, build, bootstrap e E2E mock/BFF. A saída temporária fica fora
do checkout e é removida em `finally` tanto em sucesso quanto em falha.

`.github/workflows/publish-schematics.yml` é independente do CI comum de branches. Ele aceita apenas
uma tag de versão igual a `schematics/package.json`, executa somente no repositório canônico, repete
a validação do pacote/consumidor e publica por trusted publishing do npm com OIDC. Consulte
[Distribuição via Angular Schematics](../schematics.md#release-e-publish).

## Workflow

O workflow permanente é `.github/workflows/ci.yml`.

Ele roda em:

- pull requests direcionados para `main`;
- pushes em `main`.

O gate de CI executa:

1. instala o grafo de dependências versionado com `npm ci`;
2. valida formatação;
3. executa ESLint e guardrails de arquitetura/segurança;
4. executa testes unitários com cobertura;
5. envia o LCOV para Codecov quando a integração estiver configurada;
6. executa o gate explícito de 85% contra `coverage/coverage-summary.json`;
7. produz build de produção;
8. valida bootstrap limpo do template em cópia isolada;
9. serve o build de produção para DAST;
10. executa o OWASP ZAP Baseline;
11. instala Chromium e dependências Linux exigidas pela versão de Playwright do lockfile;
12. executa os smoke tests Playwright em headless.

Dependabot, CodeQL, Codecov e CodeRabbit complementam o gate principal.

## Runtime

O CI usa:

- runner Ubuntu hospedado pelo GitHub;
- Node.js 24.15.0;
- cache npm baseado em `package-lock.json`;
- `actions/checkout@v7` pinado por SHA;
- `actions/setup-node@v7` pinado por SHA;
- Chromium instalado pelo CLI Playwright do projeto.

Como dependências são instaladas por `npm ci`, a versão do Playwright CLI vem do lockfile versionado. A instalação do browser segue a versão resolvida para o repositório.

O checkout não persiste credenciais Git porque o job de validação precisa apenas de leitura.

## Permissões

O workflow concede apenas o necessário para validação e para o comentário de status do PR. Mudanças de permissão devem seguir least privilege.

Se um workflow futuro exigir permissões adicionais, conceda-as no menor escopo possível em vez de ampliar o token inteiro.

## Concorrência

Apenas a validação mais recente do mesmo PR ou branch permanece ativa:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

Isso evita gastar runner com commits substituídos e mantém runs independentes entre PRs distintos.

## Gate de cobertura

O CI executa:

```bash
npm run test:coverage
```

Os thresholds em `angular.json` são:

| Métrica    | Mínimo |
| ---------- | -----: |
| Statements |    85% |
| Branches   |    85% |
| Functions  |    85% |
| Lines      |    85% |

Depois, executa `npm run coverage:check`.

O gate lê `coverage/coverage-summary.json`, valida as quatro métricas e também confirma que os thresholds em `angular.json` não foram reduzidos abaixo da política do workflow. Qualquer métrica abaixo de 85% falha o CI.

## Codecov

Depois que a cobertura unitária é gerada, o CI envia `coverage/angular-template/lcov.info` usando a Action oficial do Codecov. A Action é pinada por SHA imutável, seguindo a mesma política de supply chain do restante do workflow.

`codecov.yml` mantém a cobertura global alinhada ao gate local de 85% e trata patch coverage como informativa.

A autenticação do Codecov usa GitHub OIDC, portanto não é necessário manter um secret de longa duração `CODECOV_TOKEN`. O workflow concede `id-token: write` apenas para que a Action oficial do Codecov solicite um token OIDC de curta duração.

Para habilitar Codecov num repositório criado a partir deste template:

1. instale/autorize o Codecov GitHub App para o repositório;
2. configure o repositório no Codecov;
3. mantenha a configuração OIDC já versionada.

O upload permanece não bloqueante por padrão para que um repositório recém-gerado não quebre o CI antes de o Codecov ser autorizado. Times que quiserem Codecov como gate externo obrigatório podem alterar `fail_ci_if_error` para `true` depois que o GitHub App estiver ativo.

O gate local `coverage:check` continua autoritativo e sempre roda, independentemente da disponibilidade do Codecov.

## Playwright no CI

O CI instala browser e bibliotecas Linux com:

```bash
npx playwright install --with-deps chromium
```

Depois executa:

```bash
npm run e2e
```

A configuração mantém o CI deliberadamente estrito:

- Chromium headless;
- um worker no CI;
- um retry no CI e zero localmente;
- timeout de 30 segundos por teste;
- timeout de assertion de 5 segundos;
- `forbidOnly` habilitado no CI;
- traces no primeiro retry;
- screenshots apenas em falhas;
- vídeo mantido em falhas.

Um retry fornece diagnóstico para falha transitória sem normalizar flakiness recorrente. Se falhar novamente, o pipeline continua falhando e deve ser investigado.

## Diagnóstico de falhas

Cada responsabilidade é uma etapa nomeada no workflow.

- **Install dependencies** — problema de lockfile, dependência ou runtime.
- **Format check** — arquivos não normalizados pelo Prettier.
- **Lint and guardrails** — ESLint, fronteira de feature, localização de docs ou política de segurança frontend.
- **Security guardrails and dependency audit** — scanner de segurança ou advisory de dependência.
- **Unit tests with coverage** — comportamento unitário ou compilação de testes Angular.
- **Coverage gate (>= 85%)** — métrica abaixo do gate ou threshold Angular reduzido.
- **Production build** — compilação Angular, bundle budget ou build.
- **Clean template bootstrap** — template não instala/builda em checkout isolado.
- **Serve production build for DAST** — harness de segurança não iniciou.
- **OWASP ZAP baseline** — alerta DAST não aceito.
- **Install Playwright Chromium** — falha na instalação do browser/dependências.
- **Playwright E2E** — regressão ou flakiness em browser.

Quando o job falha, o CI faz upload de `playwright-report/` e `test-results/` apenas quando existirem. Runs bem-sucedidos não mantêm esses diagnósticos.

O artefato de diagnóstico é mantido por 7 dias.

## Equivalente local

Comece com instalação limpa:

```bash
npm ci
```

Instale Chromium quando necessário:

```bash
npx playwright install chromium
```

Em Linux com dependências de sistema:

```bash
npx playwright install --with-deps chromium
```

Execute os gates:

```bash
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run bootstrap:verify
npm run e2e
```

Ou:

```bash
npm run ci:verify
```

`npm run ci:base` permanece como baseline leve de format/lint/unit/build.

Não esconda um gate falho com `continue-on-error`. Corrija a causa ou altere explicitamente a política do repositório num PR revisado.

## CodeRabbit

O repositório inclui `.coderabbit.yaml` ajustado para review Angular/TypeScript.

A configuração:

- produz feedback em português brasileiro;
- usa perfil assertive, evitando ruído de formatação já coberto pelo Prettier;
- desabilita o ESLint do CodeRabbit porque ESLint já é gate obrigatório do CI;
- habilita ferramentas focadas em workflows/segurança, como actionlint, zizmor, ShellCheck e secret scanning;
- usa instruções por caminho para source Angular, templates, fronteiras BFF/segurança, GitHub Actions, scripts, arquivos de toolchain/dependência e documentação bilíngue;
- mantém reviews automáticos habilitados para PRs direcionados a `main`.

CodeRabbit é automação do repositório, não dependência de runtime. Instale/autorize o CodeRabbit GitHub App nos repositórios que devem receber reviews automáticos.

## Automação de dependências

Dependabot é configurado em `.github/dependabot.yml` para npm e GitHub Actions.

Ambos rodam semanalmente às segundas-feiras em UTC.

Para reduzir ruído:

- updates npm minor/patch são agrupados quando compatíveis;
- updates de GitHub Actions são agrupados;
- majors npm permanecem separados para review de compatibilidade;
- cada ecossistema limita a cinco PRs de versão abertos.

Dependabot atualiza referências versionadas de dependências/Actions; CI e CodeQL continuam decidindo se a atualização é segura.

Security updates são tratados pelo GitHub independentemente do calendário semanal quando Dependabot security updates está habilitado.

## CodeQL

`.github/workflows/codeql.yml` analisa JavaScript/TypeScript com setup avançado.

Roda em:

- PRs para `main`;
- pushes em `main`;
- schedule semanal na segunda-feira.

JavaScript/TypeScript usa `build-mode: none`, então a análise é independente do build Angular coberto pelo CI.

O workflow CodeQL usa apenas as permissões necessárias para ler source e publicar eventos de segurança.

## Pinning de GitHub Actions

Actions executáveis são pinadas em SHAs completos e imutáveis, mantendo a versão legível em comentário:

```yaml
uses: actions/checkout@<full-commit-sha> # v7.0.1
```

Isso impede que uma tag mutável altere o código executado por uma revisão já existente do workflow.

Dependabot monitora `github-actions` e propõe novos pins via PR. Ao adicionar Action:

1. prefira Actions do GitHub ou bem mantidas;
2. selecione release estável;
3. resolva a tag para SHA completo;
4. pine o workflow no SHA;
5. mantenha versão legível em comentário;
6. deixe Dependabot cuidar dos updates seguintes.

Nunca substitua SHA por branch flutuante como `main`.

## Branch protection / ruleset recomendado

Para `main`, configure ruleset ou branch protection exigindo PRs e os checks do repositório.

Checks recomendados:

- **CI / Quality, coverage, E2E & build**;
- **CodeQL / JavaScript / TypeScript**.

Também recomendado:

- exigir branch atualizada quando merge volume tornar validação stale um risco;
- exigir aprovação quando adequado ao modelo de manutenção;
- invalidar aprovações após mudanças materiais;
- exigir resolução das conversas;
- bloquear force-push e remoção da branch;
- permitir bypass apenas para mantenedores/automações confiáveis.

Ruleset é estado de governança do GitHub, não source da aplicação; o template documenta a política em vez de tentar alterar administração automaticamente.

## Bootstrap limpo do template

O CI inclui `npm run bootstrap:verify`. O comando copia o repositório para um diretório temporário novo, excluindo artefatos gerados e metadados do repositório, e executa:

```bash
npm ci
npm run build
```

Isso valida que um consumidor consegue começar apenas com os arquivos versionados e o lockfile. Independência de infraestrutura em runtime é validada separadamente pelo Playwright em modo mock, que inicia a aplicação sem BFF ou serviço downstream.

O reporter do CI inclui **Clean template bootstrap** como gate explícito no comentário do PR.
