> 🌐 Language: **English** | [Português (Brasil)](README.pt-BR.md)

# Features

`features/` is the primary application boundary. Each business capability owns its UI, models, and data-access concerns.

A feature can contain:

```text
features/<feature>/
├── components/
├── data-access/
├── models/
└── pages/
```

Features should be lazy loaded when practical and should not reach into another feature's internals. Shared behavior should be promoted deliberately to `shared/` or `core/` only when its responsibility is truly cross-cutting.
