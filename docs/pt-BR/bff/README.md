> 🌐 Idioma: [English](../../../docs/bff/README.md) | **Português (Brasil)**

# Conectividade BFF

A fronteira esperada do browser é:

```text
Angular SPA
    |
    | same-origin /api
    v
.NET BFF
    |
    +--> APIs internas
```

Angular conhece apenas o contrato browser-facing do BFF. Ele não deve conter hostnames, service discovery ou URLs de APIs internas/downstream.

## Modos de runtime

O template possui dois modos de API frontend:

| Modo   | Objetivo                            | Base path da API   |
| ------ | ----------------------------------- | ------------------ |
| `mock` | desenvolvimento local sem backend | `/api`           |
| `bff`  | conectividade com BFF real         | `/api` por padrão |

Builds de produção usam a configuração BFF por padrão.

A configuração normal de desenvolvimento substitui `api.runtime-config.ts` por `api.runtime-config.mock.ts`, então:

```bash
npm start
```

continua funcionando sem backend.

Para executar contra um BFF local:

```bash
npm run start:bff
```

O browser continua chamando caminhos como:

```text
/api/examples
```

Ele nunca chama diretamente a URL de um serviço interno.

## Política same-origin

`ApiConfig.basePath` aceita apenas caminhos relativos à aplicação e same-origin, como:

```text
/api
/bff/api
```

URLs absolutas, protocol-relative, query strings e fragments são rejeitados pela normalização de configuração.

Isso é intencional. A topologia de deployment pertence ao BFF/reverse proxy, não ao código Angular.

Configuração client-side é pública e nunca deve conter secrets.

## Proxy de desenvolvimento local

A configuração BFF usa:

```text
src/proxy.bff.conf.json
```

com target local padrão:

```text
http://localhost:5000
```

O dev server do Angular recebe requests do browser em `http://localhost:4200/api/**` e encaminha para o BFF. Da perspectiva do browser, as requests permanecem same-origin.

Se o BFF local estiver em outra porta, altere apenas o target do proxy. Não substitua o caminho `/api` do Angular por uma URL interna.

Como Angular 22 usa o `@angular/build:dev-server` baseado em Vite, o contexto do proxy é `/api/**` para corresponder a paths aninhados.

Reinicie `ng serve` depois de alterar o proxy.

## Fronteira de data access

Services de data access das features continuam construindo URLs a partir de `API_CONFIG.basePath`.

Exemplo:

```text
/api + /examples -> /api/examples
```

Components e pages não sabem se a request é atendida por:

- mock local;
- proxy local do Angular;
- reverse proxy/BFF de produção.

Essa decisão permanece na camada de composição/configuração.

## Fronteira de sessão e autenticação

O BFF é dono da sessão autenticada do browser. A aplicação Angular não deve receber, persistir nem renovar access/refresh tokens upstream.

Fluxo recomendado:

```text
Browser
  |
  | __Host-bff-session (HttpOnly, Secure, SameSite)
  v
.NET BFF
  |
  +--> armazena ou troca credenciais upstream server-side
```

O session cookie deve ser opaco para Angular e inacessível ao JavaScript da aplicação. Em produção, prefira cookie host-only como `__Host-bff-session` com:

- `HttpOnly`;
- `Secure`;
- `Path=/`;
- sem atributo `Domain`;
- `SameSite=Strict` quando o fluxo permitir, caso contrário `Lax` explicitamente justificado.

Desenvolvimento local em HTTP puro pode exigir política de cookie apenas para desenvolvimento ou HTTPS local, porque cookies `Secure` de produção não devem ser enfraquecidos em ambientes deployed.

Access tokens, refresh tokens, session identifiers e bearer credentials não devem ser armazenados em `localStorage` ou `sessionStorage`.

## Proteção XSRF / CSRF

Requests de escrita autenticadas por cookie exigem proteção CSRF além de `SameSite`.

O client Angular usa explicitamente o contrato convencional de XSRF:

| Objetivo         | Nome            |
| ---------------- | --------------- |
| cookie anti-CSRF | `XSRF-TOKEN`  |
| request header   | `X-XSRF-TOKEN` |

O BFF deve emitir um cookie aleatório anti-CSRF chamado `XSRF-TOKEN`. Diferente do cookie de autenticação/sessão, esse cookie deve ser legível pelo Angular, portanto **não** é `HttpOnly`.

Em requests same-origin que alteram estado, Angular lê `XSRF-TOKEN` e envia o valor em `X-XSRF-TOKEN`. O BFF deve validar esse header antes de aceitar a mudança.

Angular não anexa XSRF a requests seguras como `GET`/`HEAD`, nem a URLs absolutas cross-origin.

O token anti-CSRF não é credencial de autenticação e não deve ser reutilizado como identificador de sessão.

## Política de credenciais e origem

O template **não** habilita `withCredentials` globalmente.

Na arquitetura same-origin `/api`, o browser envia cookies aplicáveis conforme suas regras normais sem que Angular precise optar todas as requests para credenciais cross-origin.

Isso evita ampliar indiscriminadamente o comportamento de credenciais.

Se uma aplicação real precisar de BFF cross-origin com credenciais, trate como exceção arquitetural explícita. No mínimo:

- allowlist exata de origens confiáveis;
- `Access-Control-Allow-Credentials: true`;
- nunca `Access-Control-Allow-Origin: *`;
- política explícita de credentials por request/client;
- design CSRF adequado ao deployment cross-origin.

O template padrão não implementa essa exceção.

## CORS versus same-origin

O deployment preferido mantém Angular e BFF na mesma origem do browser. Nessa topologia, chamadas para `/api` não exigem CORS.

CORS é apenas uma flexibilização controlada da Same Origin Policy. Não é autenticação, autorização ou proteção CSRF.

O proxy local do Angular preserva esse modelo: o browser chama a origem de desenvolvimento Angular e o dev server encaminha `/api/**` ao BFF local.

## Contrato da integração de referência

A feature de referência prova que o mesmo client de data access Angular funciona com mock local ou modo BFF.

O contrato browser-facing é pequeno de propósito:

| Operação | Rota do browser       | Request                | Resposta de sucesso        |
| -------- | --------------------- | ---------------------- | -------------------------- |
| Listar   | `GET /api/examples`  | sem body               | `200` + `ExampleItemDto[]` |
| Criar    | `POST /api/examples` | `{ "name": string }` | `201` + `ExampleItemDto`   |

`ExampleItemDto` contém `id` e `name`. A camada de data access mapeia o DTO para o model `ExampleItem` da UI, evitando que components/pages dependam diretamente da representação de transporte.

Erros usam Problem Details. Um erro do BFF pode expor com segurança:

- `type`;
- `title`;
- `status`;
- `detail`;
- extensões `correlationId` ou `traceId`.

Angular mapeia respostas compatíveis para `ApiError`. A page consome o erro normalizado, não `HttpErrorResponse`.

Writes também participam do contrato XSRF descrito acima.

## Fronteira de correlação e tracing

Angular gera ou preserva `X-Correlation-ID` nas requests para o BFF.

O BFF deve:

1. aceitar o valor recebido quando válido ou estabelecer sua própria correlação;
2. associar essa correlação ao trace/span server-side;
3. propagar contexto apropriado para serviços downstream;
4. retornar `X-Correlation-ID` na resposta browser-facing;
5. incluir uma extensão segura `correlationId` ou `traceId` em Problem Details quando útil ao suporte.

A telemetria HTTP frontend registra apenas metadados de baixa cardinalidade: método, status, outcome, duração e correlation ID. URLs/query strings, bodies, cookies e valores de autenticação são omitidos.

## Divisão de responsabilidades

| Camada           | Responsabilidades                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular          | estado de UI, data access da feature, mapeamento de DTO browser-facing, header XSRF, consumo de correlação/telemetria                                 |
| BFF              | sessão do browser, validação CSRF, fronteira de autorização, contrato `/api`, orquestração downstream, Problem Details, propagação correlation/trace |
| Serviços domínio | capacidades de negócio, autorização/invariantes de serviço, persistência/integração; sem responsabilidades de sessão do browser                      |

Components/pages permanecem sem saber se os dados vêm do mock ou do BFF. Apenas composição/configuração e data access conhecem a fronteira browser-facing.

## Verificação automatizada

O template verifica os dois modos:

- `npm run e2e:mock` inicia o modo normal e usa o interceptor local;
- `npm run e2e:bff` inicia Angular em modo BFF e usa network interception do Playwright como stand-in determinístico do contrato BFF;
- `npm run e2e` executa ambas.

A suíte BFF verifica reads/writes same-origin, headers de correlação, XSRF em writes, mapeamento de DTO e renderização de Problem Details sem backend externo real.

## Deliberadamente não incluído

O template Angular não implementa:

- o próprio .NET BFF;
- orquestração de login com identity provider/OIDC;
- contratos de refresh/logout específicos da aplicação;
- implementações de serviços downstream/domínio.

Essas responsabilidades server-side podem ser adicionadas atrás do contrato browser documentado sem expor credenciais upstream ou topologia ao Angular.
