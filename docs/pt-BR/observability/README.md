> 🌐 Idioma: [English](../../../docs/observability/README.md) | **Português (Brasil)**

# Observabilidade

O template começa com uma fronteira de telemetria vendor-neutral, em vez de acoplar código de feature diretamente a um SDK de monitoramento.

## API de telemetria

Código da aplicação depende de `TelemetryClient`:

```ts
telemetry.event('checkout.started', {
  source: 'cart',
});

telemetry.error(error, {
  source: 'global',
});
```

A API mantém atributos deliberadamente flat e primitivos. Não envie objetos arbitrários de request/response, entidades de domínio ou estado do browser.

Nomes de eventos devem ser identificadores estáveis e de baixa cardinalidade definidos pela aplicação, não valores controlados pelo usuário.

## Providers

Use `provideTelemetry` no composition root.

O baseline suporta:

- `local` — mantém um buffer limitado em memória, útil para desenvolvimento e testes;
- `noop` — descarta telemetria;
- `enabled: false` — também seleciona a implementação no-op.

Coleta de performance é controlada separadamente:

```ts
provideTelemetry({
  enabled: true,
  mode: 'local',
  localBufferSize: 100,
  performance: {
    enabled: true,
    navigation: true,
    webVitals: true,
  },
});

providePerformanceTelemetry();
```

Desabilitar `performance.enabled` impede a instalação de observers do router e de performance do browser.

## Erros globais

`provideBrowserGlobalErrorListeners()` do Angular encaminha eventos `error` e `unhandledrejection` do browser para o `ErrorHandler` raiz.

O template fornece `TelemetryErrorHandler`, que reporta erros globais inesperados pelo `TelemetryClient`.

Erros que podem ser tratados com significado no call site devem continuar sendo tratados ali. O handler global serve para falhas inesperadas e reporte, não recuperação da aplicação.

## Política de dados sensíveis

Telemetria nunca deve conter intencionalmente:

- access/refresh tokens;
- authorization headers;
- cookies ou session identifiers;
- passwords, secrets ou private keys;
- payloads de request/response;
- PII sensível como e-mail, telefone, CPF/CNPJ ou documentos oficiais.

O sanitizer do baseline:

- remove chaves conhecidas como sensíveis;
- redige bearer tokens óbvios, valores com formato JWT e e-mails;
- trunca strings longas;
- registra apenas o tipo do erro JavaScript, não mensagem nem stack trace.

Isso é defense in depth, não permissão para enviar objetos arbitrários. O caller continua responsável por escolher campos seguros.

## Telemetria HTTP

O pipeline HTTP emite exatamente um evento `http.client.request` para cada request concluída, falha ou cancelada.

| Atributo        | Significado                                           |
| --------------- | ----------------------------------------------------- |
| `method`        | método HTTP, como GET ou POST                         |
| `outcome`       | `success`, `error` ou `cancelled`                     |
| `status`        | status HTTP quando disponível                         |
| `durationMs`    | duração observada pelo client em milissegundos        |
| `correlationId` | ID da resposta quando disponível; senão, o ID enviado |

O evento omite URLs/query strings completas, bodies, headers, cookies e valores de autenticação.

### Estratégia de erro

O interceptor de telemetria HTTP observa falhas, mas não chama `telemetry.error()`.

`httpErrorInterceptor` permanece o único lugar que converte `HttpErrorResponse` em `ApiError`. A telemetria HTTP registra o resultado normalizado como evento estruturado, evitando duplicidade.

## Telemetria de navegação

Navegações concluídas, canceladas ou falhas do Angular Router emitem `navigation.completed`.

O evento contém:

- `outcome`;
- `durationMs`;
- `routePattern` quando uma rota de sucesso é conhecida.

O route pattern vem da configuração Angular, por exemplo `/orders/:id`, e não da URL concreta. Assim não são gravados parâmetros, query strings, fragments nem identificadores controlados pelo usuário.

## Web Vitals selecionados

Quando habilitado e suportado pelo browser, o template observa:

- **LCP** — Largest Contentful Paint;
- **CLS** — Cumulative Layout Shift.

O último LCP e o score CLS são enviados em `pagehide` como eventos `performance.web_vital`.

CLS segue o modelo padronizado de janela de sessão máxima: shifts pertencem à mesma janela apenas enquanto shifts consecutivos ficam a menos de um segundo e a janela total fica abaixo de cinco segundos. O valor emitido é o maior score de janela, não a soma de toda a vida da página.

Se o browser não suporta `layout-shift`, o template omite CLS, em vez de reportar zero artificial. Um observer suportado sem shifts qualificáveis pode reportar zero legitimamente.

O baseline não implementa uma aproximação customizada de INP. Se a aplicação precisar do algoritmo completo e evolutivo de Core Web Vitals, use uma integração mantida de Web Vitals/OpenTelemetry atrás da fronteira de adapter.

Browsers que não suportem um entry type de `PerformanceObserver` simplesmente pulam aquela métrica.

## Fronteira opcional de exporter

`LocalTelemetryClient` aceita um `TelemetryExporter` opcional. O exporter padrão é no-op, portanto **nenhum collector é obrigatório**.

O repositório inclui `OpenTelemetryTelemetryExporter`, que adapta registros sanitizados a um `OpenTelemetryBridge`:

```ts
const exporter = new OpenTelemetryTelemetryExporter({
  recordEvent: (name, attributes) => {
    // mapear para a API/SDK OpenTelemetry escolhida pela aplicação
  },
  recordError: (name, errorType, attributes) => {
    // mapear para logs ou span events OpenTelemetry
  },
});

provideTelemetry(config, exporter);
```

O adapter não importa pacotes `@opentelemetry/*`. Isso mantém o template base sem collector e impede components/features de dependerem de um SDK vendor.

### Conectando exporter/collector

Uma aplicação de produção pode:

1. instalar os pacotes OpenTelemetry web necessários;
2. configurar resources, batching, sampling e endpoint no composition root;
3. implementar `OpenTelemetryBridge` com o SDK;
4. passar `OpenTelemetryTelemetryExporter` para `provideTelemetry`;
5. manter endpoints de collector e configuração por ambiente fora do código de feature.

Disponibilidade do collector não deve ser obrigatória no bootstrap. Falhas síncronas do exporter são isoladas no `LocalTelemetryClient`, então telemetria nunca transforma uma operação bem-sucedida da aplicação em falha. Batching, retries, sampling e política de entrega remota pertencem à configuração OpenTelemetry da aplicação host.

## Telemetria local

`LocalTelemetryClient` mantém apenas buffer limitado em memória e nunca escreve em console, browser storage, cookies ou endpoints de rede.

Registros são sanitizados antes de entrarem no buffer local **e antes de serem passados a um exporter opcional**.

## Fronteiras de responsabilidade

O bloco de observabilidade fornece:

- telemetria estruturada vendor-neutral;
- captura global de erros inesperados;
- duração/status/outcome/correlação HTTP;
- duração/outcome de navegação usando route patterns seguros;
- métricas selecionadas LCP/CLS;
- coleta de performance configurável;
- fronteira opcional de exporter/OpenTelemetry.

Ele não exige:

- SDK OpenTelemetry;
- pacote de exporter;
- collector;
- vendor de monitoramento.

Components de feature permanecem acoplados apenas às abstrações da aplicação, não a SDKs de telemetria.
