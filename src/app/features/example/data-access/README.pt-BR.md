> 🌐 Idioma: [English](README.md) | **Português (Brasil)**

# Data access da feature Example

Este diretório é a fronteira da feature para API clients, DTOs de transporte, mapeamento request/response e estado de servidor.

A implementação de referência demonstra:

- acesso tipado ao base path global same-origin;
- `GET /api/examples` e `POST /api/examples` via `HttpClient`;
- mapeamento explícito de DTO para model da feature;
- interceptor de mock local para o mesmo contrato browser-facing;
- modo BFF que encaminha requests para a fronteira server-side;
- XSRF em requests de escrita para o BFF;
- Problem Details mapeados para `ApiError`;
- correlação e telemetria HTTP tratadas pela infraestrutura de core.

Components e pages não injetam `HttpClient` diretamente.

A camada de data access pode conhecer `/api/examples` porque faz parte do contrato BFF exposto ao browser. Ela não deve conhecer qual API interna, hostname, service ou endpoint cloud o BFF usa downstream.

O modo de runtime é selecionado na camada de composição/configuração, e não dentro da feature.

## Contrato de referência

O contrato browser-facing é:

- listagem: `GET /api/examples` -> `ExampleItemDto[]`;
- criação: `POST /api/examples` com `{ "name": string }` -> `ExampleItemDto`;
- erros: Problem Details;
- correlação: `X-Correlation-ID`;
- requests que alteram estado: `X-XSRF-TOKEN` quando o BFF tiver emitido `XSRF-TOKEN`.

Mock local e modo BFF compartilham intencionalmente o mesmo contrato. Trocar de modo não deve exigir mudanças em components ou pages.
