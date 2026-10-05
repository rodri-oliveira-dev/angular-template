> 🌐 Idioma: [English](../../../docs/architecture/README.md) | **Português (Brasil)**

# Arquitetura

O template usa uma arquitetura Angular **feature-first** leve.

## Fronteiras da aplicação

### `features/`

Local padrão para comportamento de produto. Uma feature deve ser dona de suas pages, componentes locais, models e código de data access.

### `core/`

Somente infraestrutura global da aplicação. Prefira uma dependência local à feature, salvo quando a responsabilidade for realmente global.

### `shared/`

Apresentação reutilizável e utilitários stateless. Não é um depósito para código sem owner claro.

## Direção de dependências

A direção desejada é:

```text
app shell
   |
   +--> features
   |      |
   |      +--> shared
   |      +--> core infrastructure (quando necessário)
   |
   +--> shared
   +--> core
```

Uma feature não deve importar a implementação interna de outra feature. Se duas features realmente precisarem do mesmo building block, extraia a menor abstração adequada para `shared/` ou `core/`.

## Routing

Entrypoints de features de topo devem preferir lazy loading. A feature `example` de referência é carregada por `loadComponent` em `app.routes.ts`.

## Nomenclatura e localização

- Pages são componentes de nível de rota e ficam em `pages/`.
- Componentes que existem apenas para uma feature ficam em `components/` dentro dela.
- Transporte externo e estado de servidor ficam em `data-access/` dentro da feature.
- Tipos específicos da feature ficam em `models/`.
- Promova código para `shared/` ou `core/` somente quando a responsabilidade cross-feature estiver clara.

## O que esta arquitetura evita de propósito

- camadas application/domain/infrastructure de backend copiadas literalmente para Angular;
- abstração global e genérica de repository;
- biblioteca global de estado obrigatória;
- imports cross-feature que ignorem fronteiras explícitas.
