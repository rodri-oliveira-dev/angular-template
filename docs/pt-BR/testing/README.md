> 🌐 Idioma: [English](../../../docs/testing/README.md) | **Português (Brasil)**

# Testes

O template usa o builder nativo de testes unitários do Angular com **Vitest** para testes unitários/integração e **Playwright** para smoke tests end-to-end no browser.

O objetivo é testar comportamento observável com o menor setup útil, mantendo a integração com o framework próxima das APIs oficiais do Angular e do Playwright.

## Comandos

Execute a suíte unitária uma vez:

```bash
npm test
```

Comando explícito equivalente:

```bash
npm run test:unit
```

Execute testes unitários em watch mode:

```bash
npm run test:unit:watch
```

Gere e aplique cobertura de código:

```bash
npm run test:coverage
```

Execute os dois modos E2E do Playwright em headless:

```bash
npm run e2e
```

Execute apenas o fluxo local sem dependências externas:

```bash
npm run e2e:mock
```

Execute apenas o fluxo de contrato em modo BFF:

```bash
npm run e2e:bff
```

Abra o Playwright UI para diagnóstico local:

```bash
npm run e2e:ui
```

Abra o último relatório HTML:

```bash
npm run e2e:report
```

Antes do primeiro E2E local, instale Chromium:

```bash
npx playwright install chromium
```

Em ambientes Linux que também precisem das dependências de sistema do browser:

```bash
npx playwright install --with-deps chromium
```

## Política de cobertura

Os thresholds globais iniciais são exigentes o suficiente para detectar regressões sem transformar o template num exercício de números:

| Métrica    | Mínimo |
| ---------- | -----: |
| Statements |    85% |
| Branches   |    85% |
| Functions  |    85% |
| Lines      |    85% |

O entrypoint de bootstrap, arquivos de teste e o composition root da aplicação são excluídos da cobertura. Comportamentos da aplicação e das features permanecem incluídos.

Não reduza thresholds apenas para fazer uma mudança passar. Prefira adicionar testes significativos. Se um threshold realmente precisar mudar, documente a razão arquitetural no PR.

## Princípios de teste

### Teste comportamento, não detalhes de implementação

Prefira assertions sobre output renderizado, valores emitidos, requests, resultados de navegação e comportamento público.

Evite testes que dupliquem linha a linha implementações privadas ou se acoplem a refactors internos.

### Components standalone

Configure components standalone por `imports` no `TestBed`.

O teste de referência de `BoundaryCard` demonstra:

- criação de component standalone;
- definição de signal input com `fixture.componentRef.setInput`;
- assertion de comportamento renderizado.

### Services e data access

Injete services pelo `TestBed` e exercite a API pública.

Para services HTTP, use `HttpTestingController` e `provideHttpClientTesting` oficiais do Angular. A suíte de `ExampleApiClient` demonstra:

- comportamento GET;
- writes;
- mapeamento de DTOs;
- tratamento padronizado de erros.

Testes não devem chamar serviços externos reais.

### Infraestrutura HTTP

Os testes HTTP de core validam comportamento, e não internals do Angular:

- correlation IDs são gerados quando ausentes e preservados quando fornecidos;
- respostas Problem Details viram `ApiError`;
- envelopes incompatíveis não são estreitados incorretamente;
- falhas de rede recebem uma mensagem fallback estável.

Use as APIs de teste HTTP do Angular para request/response. Não suba servidor HTTP em testes unitários.

### Routing

Use a configuração real do Angular Router com `provideRouter` e `RouterTestingHarness`, em vez de mockar o router.

A suíte de rotas verifica:

- rota lazy-loaded da feature;
- redirects da raiz;
- redirects wildcard.

### Fixtures e mock factories

Dados reutilizáveis de teste ficam em `src/testing/fixtures/`. Prefira pequenas factory functions com defaults sensatos e overrides tipados a copiar grandes object literals.

Test doubles reutilizáveis ficam em `src/testing/mocks/`. Uma mock factory deve:

- retornar um objeto novo por teste;
- expor spies Vitest tipados;
- fornecer comportamento default determinístico;
- permitir override apenas do que importa para o cenário.

Não crie um framework genérico de dados de teste quando uma factory tipada pequena for suficiente.

### Dependências de component

Prefira dependência real quando for pequena e determinística. Use test double quando a dependência introduzir network, nondeterminismo ou setup irrelevante.

Mantenha mocks limitados ao comportamento em teste.

## Smoke tests end-to-end

A suíte local mock é configurada em `playwright.config.ts` e vive em `e2e/`. A suíte BFF é configurada em `playwright.bff.config.ts` e vive em `e2e-bff/`.

Ambas executam **Chromium headless**. A suíte mock inicia Angular em `http://127.0.0.1:4200`; a suíte BFF inicia a configuração explícita de BFF em `http://127.0.0.1:4201`.

Em conjunto elas cobrem:

- bootstrap da aplicação e redirect da raiz;
- disponibilidade da navegação principal;
- fluxos GET e POST com mock local;
- fluxos GET e POST em modo BFF usando o mesmo contrato de data access;
- correlation IDs de saída;
- XSRF em writes same-origin para o BFF;
- Problem Details renderizados pelo caminho normalizado de `ApiError`.

Nenhuma suíte chama backend externo real. A suíte mock usa o interceptor Angular local; a suíte BFF usa interceptação de rede do Playwright como substituto determinístico do contrato browser-facing do BFF.

### Diagnóstico E2E

Em caso de falha:

1. execute novamente o teste com `npm run e2e`;
2. use `npm run e2e:ui` para inspeção interativa;
3. verifique `playwright-report/` para mock ou `playwright-report-bff/` para BFF;
4. inspecione traces, screenshots e vídeos mantidos pelo Playwright quando aplicável.

Relatórios e artefatos gerados pelo Playwright são ignorados pelo Git.

No CI, Playwright usa um worker, um retry, timeout de 30 segundos por teste e timeout de assertion de 5 segundos. Quando o job falha, os relatórios HTML e test-results são enviados como artefatos e mantidos por 7 dias. Runs verdes não fazem upload desses diagnósticos.

## O que testar

Priorize:

- comportamento visível ao usuário;
- mapeamento entre contratos externos e models da feature;
- método, URL, body e headers relevantes;
- comportamento de erro/retry;
- resultados de routing;
- infraestrutura cross-cutting com efeitos observáveis;
- poucos journeys críticos de browser.

Normalmente evite:

- métodos privados diretamente;
- comportamento do Angular já coberto pelo próprio framework;
- detalhes apenas de CSS;
- declarações triviais de types/interfaces;
- assertions que apenas repetem uma constante sem comportamento;
- duplicar todo teste unitário também em E2E.

## Camadas de teste

O template possui três camadas deliberadas:

1. **Testes unit/component/data-access** — checks rápidos com Vitest e utilities Angular.
2. **Gate de cobertura** — proteção global contra regressão no código da aplicação.
3. **E2E smoke tests** — pequeno conjunto de journeys de alto valor com Playwright.

O gate de cobertura unitária e os dois modos E2E Chromium rodam no CI. Matrizes maiores de browsers e regressão visual permanecem opcionais.

## Testing e cobertura no VS Code

Abra o repositório com `angular-template.code-workspace`.

O workspace recomenda **Angular Vitest Runner** (`kuradev.angular-vitest-runner`) porque o projeto usa o builder `@angular/build:unit-test`. A extensão descobre arquivos `*.spec.ts` e os executa por `ng test`, preservando o pipeline do Angular.

Use a view **Testing** do VS Code para:

- executar a suíte completa;
- executar um spec;
- executar teste/suite individual quando suportado;
- debuggar testes pelo editor/Test Explorer.

O workspace passa `--watch=false` para Test Explorer, fazendo execuções one-shot terminarem corretamente.

### Cobertura dentro do VS Code

O target de teste Angular já gera LCOV:

```json
"coverageReporters": ["html", "lcov", "text-summary", "json-summary"]
```

Gere com:

```bash
npm run test:coverage
```

ou execute a task **test: coverage**.

A extensão recomendada **Code Coverage LCOV** (`rherrmannr.code-coverage-lcov`) está configurada para ler:

```text
coverage/angular-template/lcov.info
```

O workspace habilita:

- highlighting inline de cobertura;
- marcadores de gutter;
- visualização de branch coverage.

Os thresholds são 85% para statements, branches, functions e lines. Angular aplica os thresholds durante os testes e `coverage:check` valida `coverage-summary.json` contra o gate explícito de 85%. A extensão do VS Code é apenas visualização e não substitui nenhum desses gates.
