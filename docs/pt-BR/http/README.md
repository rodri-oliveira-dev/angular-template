> 🌐 Idioma: [English](../../../docs/http/README.md) | **Português (Brasil)**

# Integração HTTP e API

O template mantém preocupações de transporte fora de components e pages.

## Composition root

`app.config.ts` configura o `HttpClient` do Angular com APIs baseadas em providers:

- configuração tipada de API;
- interceptor de correlation ID;
- interceptor de telemetria HTTP;
- interceptor padronizado de erros HTTP;
- mock local opcional da feature de exemplo.

O composition root recebe `apiRuntimeConfig`. A configuração padrão/de produção é:

```ts
{
  basePath: '/api',
  mode: 'bff',
}
```

A configuração normal de desenvolvimento Angular usa file replacement para selecionar:

```ts
{
  basePath: '/api',
  mode: 'mock',
}
```

O base path da API é intencionalmente same-origin. URLs absolutas e protocol-relative são rejeitadas por `normalizeSameOriginBasePath`.

Isso mantém topologia de deployment e URLs de serviços internos fora do frontend.

## Conectividade BFF

A fronteira esperada do browser é:

```text
Angular SPA -> same-origin /api -> .NET BFF -> APIs internas
```

Use:

```bash
npm start
```

para o mock local sem dependências externas.

Use:

```bash
npm run start:bff
```

para executar Angular com `src/proxy.bff.conf.json`, que faz proxy de `/api/**` para o BFF local.

Consulte [BFF](../bff/README.md) para modos de runtime, configuração do proxy e divisão de responsabilidades.

## Data access pertencente à feature

A feature é dona dos detalhes de transporte:

```text
features/example/data-access/
├── example-api-client.ts
├── example-api.dto.ts
└── ...
```

Pages dependem de `ExampleApiClient`, e não de `HttpClient`.

DTOs de transporte devem ser mapeados antes de chegar à UI quando o contrato do servidor não for o modelo de apresentação desejado. Evite repositories genéricos que escondam semântica relevante da API.

O data access da feature pode conhecer a rota do BFF exposta ao browser, por exemplo `/api/examples`. Ele não deve conhecer qual serviço interno/downstream o BFF chama.

## Correlation IDs

Requests de saída recebem `X-Correlation-ID` quando ainda não possuem um.

Para erros, o mapper padronizado procura correlação nesta ordem:

1. header de resposta `X-Correlation-ID`;
2. extensão `correlationId` de Problem Details;
3. extensão `traceId` de Problem Details.

Não coloque credenciais ou payloads sensíveis em headers de correlação.

A telemetria HTTP registra o correlation ID da resposta quando disponível e, caso contrário, preserva o ID enviado. IDs de correlação são metadados estruturados e nunca devem ser incorporados ao nome do evento.

## Problem Details

Falhas HTTP compatíveis com RFC 7807/Problem Details são mapeadas para `ApiError`.

A UI pode usar status, mensagem, payload Problem Details e correlation ID padronizados sem depender de `HttpErrorResponse`.

Erros não HTTP não são reescritos pelo interceptor.

O interceptor de telemetria HTTP emite um único evento `http.client.request` para sucesso, falha ou cancelamento e não gera um registro separado de erro de telemetria. Isso evita reportar a mesma falha HTTP em duplicidade.

## Schema de telemetria HTTP

O client registra apenas metadados de transporte de baixa cardinalidade:

- método;
- outcome;
- status, quando disponível;
- duração em milissegundos;
- correlation ID.

URLs completas/query strings, bodies, headers, cookies e valores de autenticação são omitidos deliberadamente.

## Loading, erros e cancelamento

A page de referência usa signals para estado de loading/erro e `takeUntilDestroyed` para controlar o ciclo de vida da subscription.

Código de feature deve:

- expor loading de forma intencional;
- converter erros técnicos em mensagens adequadas ao usuário;
- evitar subscriptions órfãs;
- preferir cancelamento lifecycle-aware de Angular/RxJS.

## Mock local de API

A configuração normal de desenvolvimento usa `mode: 'mock'` para demonstrar fluxos GET e POST sem infraestrutura externa.

O mock:

- intercepta apenas a URL da collection de referência;
- retorna o mesmo formato de DTO esperado pelo client voltado ao BFF;
- preserva correlation IDs;
- retorna Problem Details para writes inválidos.

A configuração BFF usa `mode: 'bff'`; nesse modo o mock interceptor simplesmente deixa as requests seguirem.

## Adicionando um endpoint

1. Mantenha a operação browser-facing do BFF em `data-access/` da feature responsável.
2. Adicione DTOs de request/response que representem o contrato do BFF.
3. Mapeie DTOs para models da feature quando a UI não deva depender do formato de transporte.
4. Use o base path same-origin configurado em vez de hardcodar hostnames.
5. Não codifique topologia de APIs internas/downstream no Angular.
6. Deixe os interceptors de core cuidarem de correlação e erros HTTP padronizados.
7. Adicione testes de sucesso e erro com as utilities HTTP oficiais do Angular.
8. Documente comportamentos específicos do endpoint que afetem callers.

## Baseline de segurança

Não armazene access ou refresh tokens sensíveis em browser storage como parte dessa camada HTTP. Não registre authorization headers, cookies ou payloads sensíveis brutos de request/response.

Configuração client-side é pública e não deve conter secrets.

O baseline BFF usa session cookie gerenciado pelo servidor, contrato XSRF explícito do Angular e nenhum opt-in global de `withCredentials`. Access/refresh tokens upstream permanecem no servidor e nunca são persistidos pela aplicação Angular.

Consulte [BFF](../bff/README.md) para contrato browser-facing, modelo sessão/XSRF, correlação e responsabilidades Angular/BFF/serviços de domínio. Consulte [Segurança frontend](../security/README.md) para sanitização, storage, cookies, logging e configuração client-side.
