> 🌐 Idioma: [English](../../../docs/security/README.md) | **Português (Brasil)**

# Baseline de segurança frontend

Este template trata código executado no browser, configuração empacotada e browser storage como **território client-side não confiável**. Tudo que é enviado ao browser pode ser inspecionado ou modificado por um usuário ou por JavaScript executando na mesma origem.

O baseline combina guardrails de source, auditoria de dependências, hardening CSP do Angular e orientação para headers de deployment.

## Binding HTML e sanitização

Prefira templates Angular, interpolação e property binding. Angular aplica escaping e sanitização context-aware nos bindings suportados.

Para HTML dinâmico:

- prefira interpolação de texto simples quando HTML rico não for necessário;
- quando HTML rico for necessário, faça bind da string não confiável pelo Angular e deixe o Angular sanitizá-la;
- não manipule o DOM diretamente para contornar o modelo de segurança do Angular;
- não construa templates a partir de strings controladas pelo usuário.

### Política de bypass do sanitizer

O baseline proíbe uso direto de:

- `bypassSecurityTrustHtml`;
- `bypassSecurityTrustStyle`;
- `bypassSecurityTrustScript`;
- `bypassSecurityTrustUrl`;
- `bypassSecurityTrustResourceUrl`.

A configuração ESLint bloqueia imports de `DomSanitizer` no TypeScript da aplicação e `npm run security:check` detecta chamadas de bypass de forma independente.

Se uma aplicação real tiver uma exceção legítima:

1. documente a fronteira de confiança e o threat model;
2. valide/restrinja o valor antes do bypass;
3. isole o bypass em um adapter pequeno;
4. adicione testes para entradas maliciosas e esperadas;
5. adicione exceção apenas para o arquivo necessário, sem desabilitar a regra globalmente;
6. exija review de segurança explícito no PR.

Nunca introduza bypass apenas para silenciar a sanitização do Angular.

## Configuração client-side é pública

Valores compilados nos bundles Angular ou entregues a JavaScript em runtime são visíveis ao browser.

Configuração client-side é adequada para:

- base paths de API;
- feature flags que não sejam controles de autorização;
- identificadores públicos;
- configuração de telemetria sem secrets.

Não coloque em configuração client-side:

- passwords;
- client secrets;
- private keys;
- credenciais de banco;
- bearer tokens de longa duração;
- signing secrets;
- qualquer valor cuja confidencialidade seja requisito de segurança.

Arquivos de ambiente, JSON injetado em runtime e variáveis de build não se tornam secret apenas por serem chamados de “environment” ou injetados durante deployment.

## Browser storage

O baseline bloqueia acesso direto da aplicação a `localStorage` e `sessionStorage`.

Nunca persista em Web Storage:

- access tokens;
- refresh tokens;
- session identifiers;
- JWTs usados como credencial;
- passwords ou recovery secrets;
- PII sensível.

Web Storage é legível por JavaScript da origem; uma vulnerabilidade XSS pode expô-lo.

Se uma feature futura precisar de preferências duráveis e não sensíveis, introduza uma pequena abstração de storage revisada e documente exatamente quais dados ela permite.

## Cookies e sessões

Acesso direto a `document.cookie` é bloqueado.

Para sessões autenticadas no browser, prefira cookies gerenciados pelo servidor quando aplicável:

- `HttpOnly`, impedindo JavaScript da aplicação de ler o token de sessão;
- `Secure`, enviando o cookie apenas via HTTPS;
- `SameSite=Strict` quando o fluxo permitir, caso contrário um `Lax` explicitamente justificado;
- `SameSite=None` somente com `Secure`;
- menor lifetime e scope práticos.

Para session cookie host-only, prefira prefixo `__Host-` com `Secure`, `Path=/` e sem atributo `Domain`.

`SameSite` é defense in depth e não substitui estratégia CSRF para requests de escrita autenticadas por cookie.

No baseline BFF:

- Angular nunca lê o cookie de autenticação/sessão;
- access e refresh tokens upstream permanecem server-side e nunca são persistidos em Web Storage;
- `XSRF-TOKEN` é um cookie anti-CSRF separado e não secreto, legível pelo Angular;
- Angular envia esse valor em `X-XSRF-TOKEN` em requests same-origin que mudam estado;
- o BFF deve validar o header anti-CSRF antes da mudança;
- `withCredentials` não é habilitado globalmente porque a arquitetura padrão é same-origin.

Não marque `XSRF-TOKEN` como `HttpOnly`: Angular precisa ler o token anti-CSRF. Essa exceção vale apenas para o token anti-CSRF, não para o cookie de autenticação/sessão.

Consulte [BFF e segurança de sessão](../bff/README.md) para a fronteira completa.

## Logging e dados sensíveis

TypeScript da aplicação usa ESLint `no-console`.

Não registre:

- access/refresh tokens;
- headers `Authorization`;
- cookies ou session identifiers;
- passwords/secrets;
- bodies completos de request/response por padrão;
- PII sensível;
- payloads brutos de autenticação ou pagamento.

Observabilidade usa `TelemetryClient` com seleção explícita de campos e sanitização. Registrar um objeto inteiro não é considerado redaction segura. O adapter local registra apenas entradas sanitizadas e limitadas em memória e não escreve em console, storage ou rede.

Correlation IDs são aceitáveis porque identificam uma request, não um usuário autenticado nem uma credencial. Eles não devem carregar valores sensíveis.

## URLs e navegação

Não coloque credenciais ou secrets em:

- query strings;
- route parameters;
- fragments de URL;
- redirect URLs controladas por atacante.

URLs podem aparecer no histórico do browser, logs de proxies/servidores, analytics, screenshots e dados de referrer.

## Auditoria de dependências

Execute:

```bash
npm run security:audit
```

O comando usa `npm audit --audit-level=high` e inclui dependências de runtime e desenvolvimento. Tooling de desenvolvimento faz parte da supply chain e não é excluído do gate padrão.

O processo é reproduzível a partir do `package-lock.json`, embora resultados possam mudar conforme a base de advisories do npm é atualizada.

### Política de vulnerabilidades

- **Critical / High:** falham o gate e devem ser corrigidas antes do merge.
- **Moderate:** avaliar reachability, impacto em produção, exploitabilidade e se afeta apenas tooling de build; corrigir rapidamente quando alcançável ou production-facing.
- **Low:** acompanhar e agrupar na manutenção normal, salvo contexto que aumente o risco.

Uma exceção temporária para High/Critical exige:

1. advisory/package/versão exatos;
2. análise documentada de reachability/exploitabilidade;
3. controles compensatórios;
4. owner;
5. data de expiração/revisão;
6. aprovação explícita de segurança.

Não use `npm audit fix --force` automaticamente. Mudanças major ou na árvore de dependências exigem review normal de compatibilidade e testes.

## Content Security Policy

Builds de produção habilitam `security.autoCsp` do Angular CLI.

Angular gera meta CSP para scripts usando hashes e `strict-dynamic`. Isso é útil para hosting estático cacheável porque não exige nonce previsível/reutilizado.

`autoCsp` não substitui completamente headers de deployment:

- protege scripts, mas não todos os tipos de recurso;
- `frame-ancestors` não é efetivo em CSP entregue por meta;
- styles ainda exigem decisão de hosting;
- reporting e outros controles pertencem aos response headers HTTP.

O repositório inclui [security-headers.example.txt](../../../docs/security/security-headers.example.txt) como complemento provider-neutral.

Como `autoCsp` já fornece a política de scripts, o CSP HTTP complementar omite deliberadamente `script-src` e `default-src`. Adicioná-los sem combinar com os hashes gerados pode quebrar a aplicação, pois múltiplas políticas CSP são aplicadas em conjunto.

O exemplo permite `'unsafe-inline'` apenas em `style-src`, pois Angular insere component styles em runtime. Um deployment capaz de injetar nonce único por resposta pode restringir isso ainda mais.

## Response headers recomendados

O exemplo provider-neutral contém:

- `Content-Security-Policy`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY` como defesa legada contra clickjacking além de CSP `frame-ancestors`;
- `Permissions-Policy` restritiva.

Deployments somente HTTPS também devem considerar HSTS na camada real de hosting depois de confirmar que todos os domínios/subdomínios afetados estão prontos para HTTPS.

Headers de segurança pertencem à resposta HTTP emitida por CDN, reverse proxy, BFF, ingress ou web server. Código Angular não consegue aplicá-los de modo confiável depois que o documento já carregou.

## CORS não substitui controles de segurança

CORS controla se JavaScript de uma origem pode ler respostas de outra origem. Ele relaxa a Same Origin Policy para origens selecionadas.

CORS não:

- autentica caller;
- autoriza acesso à API;
- previne XSS;
- substitui CSP;
- substitui proteção CSRF;
- impede clients não-browser de fazer requests.

Para APIs com credenciais, use allowlist explícita de origens confiáveis, nunca `*`, e valide autenticação/autorização no servidor em toda request.

Deploy SPA/BFF same-origin normalmente exige menos CORS, razão pela qual o template prefere acesso `/api` same-origin.

## Guardrails executáveis

Execute:

```bash
npm run security:check
npm run security:test
npm run security:audit
```

Ou os três:

```bash
npm run security:all
```

`security:all` é gate obrigatório no CI. Ele executa testes do scanner, source scan e `npm audit --audit-level=high`.

O build de produção também é analisado pelo OWASP ZAP Baseline no CI. O alvo DAST é servido por um harness Node exclusivo de CI que aplica os headers de `security-headers.example.txt`; ele não é web server de produção. Exceções revisadas vivem em `.zap/rules.tsv`.

Consulte [Cobertura OWASP Top 10:2025](owasp-top-10.md) para matriz de controles, gates automatizados, política de exceções e fronteiras de responsabilidade.

`security:check` analisa TypeScript da aplicação e rejeita referências executáveis, ignorando comments e string literals:

- bypasses do sanitizer Angular;
- acesso direto a `localStorage`/`sessionStorage`;
- acesso a `document.cookie`, inclusive `document['cookie']`.

ESLint também rejeita:

- imports de `DomSanitizer`;
- browser storage direto;
- cookie legível por script direto;
- `console.*` no TypeScript da aplicação.

Esses guardrails são defaults estritos de um template reutilizável. Exceções devem ser estreitas, documentadas e revisadas.

## Checklist de review de segurança

Antes do merge, valide:

- dependency audit atende a política;
- dados não confiáveis usam bindings normais do Angular;
- bypasses de sanitizer estão ausentes ou explicitamente revisados;
- nenhum secret está na configuração client-side;
- credenciais não são persistidas em Web Storage;
- JavaScript não lê session cookies;
- session cookies usam atributos `Secure`, `HttpOnly` e `SameSite` adequados;
- writes autenticados por cookie usam o mecanismo XSRF/CSRF revisado;
- credenciais cross-origin não são habilitadas indiscriminadamente;
- logs não contêm credenciais, payloads sensíveis ou PII;
- parâmetros de URL não carregam secrets;
- hosting de produção aplica CSP e browser headers revisados;
- CORS não está sendo usado como autorização;
- exceções de segurança incluem testes, justificativa, owner e expiração.
