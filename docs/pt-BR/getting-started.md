> 🌐 Idioma: [English](../getting-started.md) | **Português (Brasil)**

# Primeiros passos

## 1. Criar com Schematics

O caminho recomendado cria e nomeia a aplicação pelo fluxo oficial do Angular CLI:

```bash
npm install --global @angular/cli@22.2.1 @rodri/angular-template@1.1.0
ng new my-app --collection=@rodri/angular-template
cd my-app
```

Consulte [Distribuição via Angular Schematics](schematics.md) para instalação local ao projeto e
opções. O GitHub Template Repository continua como fallback quando a distribuição npm não puder ser
usada. Um clone normal é voltado ao desenvolvimento do próprio template.

## 2. Selecionar o runtime

O repositório fixa a versão do Node.js em `.nvmrc`:

```bash
nvm use
```

O baseline v1.1 é validado com Node.js 24.15.0+, Angular 22.2.x e TypeScript 6.0.x.

## 3. Instalar

```bash
npm ci
```

Uma instalação limpa deve funcionar sem `--force`, `--legacy-peer-deps` ou overrides de peer dependencies.

## 4. Executar sem infraestrutura externa

```bash
npm start
```

A configuração padrão de desenvolvimento substitui a configuração de API em runtime pela configuração de mock local. Portanto, a feature de referência funciona sem backend, banco de dados, recurso em cloud, provedor de identidade ou BFF.

Abra `http://localhost:4200`.

## 5. Validar o template

```bash
npm run bootstrap:verify
npm run ci:verify
```

`bootstrap:verify` copia o template para um diretório temporário novo, executa uma instalação limpa de dependências e valida um build de produção a partir dessa cópia isolada.

`ci:verify` executa localmente a sequência de qualidade, segurança, testes, build, bootstrap e browser.

## 6. Modo BFF opcional

Quando houver um BFF local disponível:

```bash
npm run start:bff
```

As chamadas do browser permanecem same-origin em `/api`; o proxy de desenvolvimento encaminha para `http://localhost:5000` por padrão.

Consulte [BFF](bff/README.md) antes de alterar autenticação, cookies, XSRF, CORS ou topologia downstream.

## 7. Customizar para uma aplicação real

O repositório já é funcional antes de qualquer customização. Mudanças iniciais típicas:

1. atualizar a identidade visual/metadados de package e projeto para o produto;
2. substituir a capacidade de referência `features/example` pela primeira feature real;
3. manter ou adaptar conscientemente os guardrails de arquitetura, segurança e testes;
4. substituir o contrato do mock local pelos endpoints específicos do produto;
5. configurar BFF/reverse proxy no deployment sem expor URLs downstream ao Angular;
6. atualizar ownership do repositório e políticas de segurança/contribuição para sua organização.

A feature de referência é um exemplo funcional, não uma dependência obrigatória de negócio.
