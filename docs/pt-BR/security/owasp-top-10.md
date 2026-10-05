> 🌐 Idioma: [English](../../../docs/security/owasp-top-10.md) | **Português (Brasil)**

# Cobertura OWASP Top 10:2025

Este documento mapeia os controles de segurança atuais do template para o OWASP Top 10:2025.

O mapeamento representa um baseline de segurança, não uma certificação de compliance. Alguns riscos OWASP não podem ser controlados integralmente por um repositório Angular executado no browser e permanecem responsabilidade do BFF, serviços de domínio, infraestrutura ou plataforma de deployment.

## Matriz de cobertura

| Categoria OWASP                               | Cobertura do template Angular   | Controles principais                                                                                                           |
| --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A01 — Broken Access Control                   | Parcial / depende do servidor   | fronteira BFF same-origin, sem topologia downstream no Angular, autorização server-side documentada                            |
| A02 — Security Misconfiguration               | Baseline frontend forte         | Angular autoCSP, API same-origin, baseline de response headers e políticas restritivas do browser                              |
| A03 — Software Supply Chain Failures          | Aplicado                        | lockfile + `npm ci`, Dependabot, GitHub Actions por SHA, `npm audit --audit-level=high` como gate obrigatório               |
| A04 — Cryptographic Failures                  | Parcial / depende do deployment | orientação HTTPS, Secure cookie e HSTS; criptografia e terminação TLS fora do Angular                                           |
| A05 — Injection                               | Baseline frontend forte         | sanitização contextual Angular, bloqueio de bypass, CSP, guardrails ESLint/AST e CodeQL                                        |
| A06 — Insecure Design                         | Parcial                         | fronteiras de feature/BFF, sessão gerenciada pelo servidor, design CSRF e divisão explícita de responsabilidades               |
| A07 — Authentication Failures                 | Parcial / depende do BFF        | orientação HttpOnly/Secure/SameSite, sem access/refresh tokens no Web Storage, sessão de autenticação pertencente ao BFF       |
| A08 — Software or Data Integrity Failures     | Baseline forte de build         | Action SHAs imutáveis, lockfile, instalação determinística, CodeQL e automação de dependências                                 |
| A09 — Security Logging & Alerting Failures    | Parcial                         | telemetria sanitizada, correlation IDs, sem logging sensível em console; alertas operacionais dependem do deployment            |
| A10 — Mishandling of Exceptional Conditions   | Baseline frontend forte         | Problem Details / `ApiError` padronizados, fluxos determinísticos de erro e cobertura unit/integration/E2E                   |

## Gates automatizados de segurança

Pull requests e pushes em `main` executam controles complementares.

### SAST

GitHub CodeQL analisa JavaScript/TypeScript de forma independente do workflow principal de CI.

### SCA / supply chain

O CI principal executa:

```bash
npm ci
npm run security:all
```

`security:all` executa:

- testes do scanner de segurança do repositório;
- guardrails executáveis de segurança frontend;
- `npm audit --audit-level=high`.

Advisories High ou Critical falham o gate do pull request.

### Guardrails de source frontend

O scanner AST customizado e o ESLint proíbem ou sinalizam:

- APIs de bypass do sanitizer Angular;
- imports diretos de `DomSanitizer`;
- uso direto de `localStorage` e `sessionStorage`;
- acesso direto a session cookies legíveis por script;
- `console.*` no código da aplicação.

### DAST

Após o build de produção, o CI serve a SPA gerada por `scripts/serve-security-baseline.mjs`. O harness reutiliza `docs/security/security-headers.example.txt`, então o ZAP avalia o baseline documentado de headers de deployment em vez dos defaults inseguros de um servidor genérico de desenvolvimento.

A Action do ZAP é pinada por SHA imutável, não abre issues automaticamente e falha o CI quando encontra alertas não aceitos.

Exceções revisadas vivem em `.zap/rules.tsv`. O baseline atualmente ignora apenas:

- cacheabilidade de assets estáticos fingerprinted;
- divisão deliberada entre a política de scripts do Angular `autoCsp` e o CSP HTTP complementar;
- classificação informativa “Modern Web Application” do ZAP;
- `Cross-Origin-Embedder-Policy` opcional, específica da aplicação salvo quando cross-origin isolation é necessária.

Cada alerta ignorado é documentado em [`.zap/README.md`](../../../.zap/README.md). O TSV permanece apenas com dados aceitos pelo parser para evitar que comentários inválidos desabilitem silenciosamente a política de exceções. Não desabilite classes inteiras de alertas apenas para deixar o CI verde.

## Fronteira de responsabilidade

Este repositório pode validar comportamento de browser/frontend, mas não pode provar a segurança de um BFF ou serviço downstream futuro.

Aplicações criadas a partir do template devem validar separadamente, quando aplicável:

- autorização em nível de objeto/função;
- validação server-side de input e controles de injection;
- fluxos de autenticação, lifecycle de credenciais, lockout e MFA;
- configuração TLS e gestão de chaves criptográficas;
- controles SSRF e política de rede de saída;
- segurança de banco e message broker;
- logging operacional, detecção e alertas;
- infraestrutura/IaC;
- DAST/API scanning autenticado.

O BFF é uma fronteira de confiança, não um substituto para autorização ou validação server-side.
