> 🌐 Idioma: [English](CHANGELOG.md) | **Português (Brasil)**

# Changelog

Todas as mudanças relevantes do template production-ready são documentadas aqui.

## [1.0.0] - 2026-10-05

### Adicionado

- baseline Angular 22 standalone e strict com arquitetura feature-first;
- integração HTTP/API tipada com Problem Details e correlação;
- modo mock local sem infraestrutura e modo BFF same-origin opcional;
- contrato de sessão/XSRF do BFF e testes de integração de referência;
- testes unitários Vitest, E2E Playwright, fixtures tipadas e gates de 85% de cobertura;
- ESLint, Prettier, fronteiras arquiteturais, guardrails de segurança frontend, npm audit, CodeQL, Codecov com OIDC, CodeRabbit, Dependabot e OWASP ZAP;
- telemetria vendor-neutral, telemetria HTTP/navegação/performance e fronteira de adapter OpenTelemetry;
- GitHub Actions CI com status no PR e diagnóstico de falhas;
- workspace VS Code com tasks, debug, testes e cobertura;
- validação de bootstrap limpo do template;
- documentação bilíngue English/pt-BR com seletor de idioma e guardrail automatizado de paridade;
- badges de CI, CodeQL, Codecov, toolchain e licença no README;
- políticas de contribuição/segurança, templates de issue/PR, índice de ADRs, índice de documentação e documentação de release.

### Alterado

- metadados do projeto promovidos para v1.0.0;
- documentação consolidada em torno do uso production/template em vez de labels de fases do roadmap;
- removidas referências obsoletas de fases anteriores ao BFF.

### Adiado

- migração para TypeScript 7 permanece bloqueada até suporte oficial da toolchain Angular/build/lint;
- distribuição via npm/Angular Schematics está planejada como evolução pós-v1.0.
