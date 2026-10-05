> 🌐 Idioma: [English](../../../docs/adr/0001-feature-first-architecture.md) | **Português (Brasil)**

# ADR 0001: Arquitetura Angular feature-first

- Status: Aceito
- Data: 2026-10-04

## Contexto

O template precisa de uma arquitetura que escale além de uma aplicação demonstrativa sem importar camadas de backend para o browser. Aplicações Angular se beneficiam de manter capacidades de nível de rota coesas e reservar diretórios globais apenas para responsabilidades realmente cross-cutting.

## Decisão

Usar uma estrutura feature-first:

- `features/` é dona das capacidades de negócio;
- `core/` é dono da infraestrutura global da aplicação;
- `shared/` é dono de apresentação reutilizável e utilitários stateless;
- features de topo devem preferir lazy loading;
- uma feature não deve depender diretamente dos internals de outra feature.

Uma feature pode se organizar em `pages/`, `components/`, `models/` e `data-access/` quando essas responsabilidades existirem.

## Consequências

### Positivas

- ownership de feature permanece visível;
- lazy loading possui uma fronteira natural;
- a maioria das mudanças permanece local a uma capacidade;
- diretórios globais têm menos chance de virar depósitos genéricos.

### Trade-offs

- algumas features pequenas não precisarão de todos os subdiretórios sugeridos;
- extrair código compartilhado exige uma decisão explícita;
- fronteiras arquiteturais são reforçadas pelo check automatizado de imports entre features no quality gate.

## Alternativas consideradas

### Camadas de Clean Architecture no estilo backend

Rejeitada como padrão porque duplicar camadas application/domain/infrastructure no Angular adiciona cerimônia sem necessariamente melhorar a coesão no browser.

### Uma estrutura global components/services/models

Rejeitada porque o ownership fica pouco claro conforme a aplicação cresce e features não relacionadas passam a se acoplar por pastas genéricas.
