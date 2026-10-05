> 🌐 Idioma: [English](README.md) | **Português (Brasil)**

# Features

`features/` é a principal fronteira da aplicação. Cada capacidade de negócio é dona da sua UI, models e preocupações de data access.

Uma feature pode conter:

```text
features/<feature>/
├── components/
├── data-access/
├── models/
└── pages/
```

Features devem ser lazy-loaded quando fizer sentido e não devem acessar internals de outra feature. Comportamentos compartilhados só devem ser promovidos para `shared/` ou `core/` quando a responsabilidade for realmente cross-cutting.
