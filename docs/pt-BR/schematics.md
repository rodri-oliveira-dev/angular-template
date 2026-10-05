> 🌐 Idioma: [English](../schematics.md) | **Português (Brasil)**

# Distribuição via Angular Schematics

`@rodri/angular-template` é uma coleção Angular Schematics usada durante a geração. Ela compõe o
schematic oficial `ng-new` do Angular CLI e depois aplica os baselines de arquitetura, API,
segurança, testes, observabilidade, CI, workspace e BFF deste repositório. Não é uma library Angular
de runtime e não entra nas dependências da aplicação gerada.

## Toolchain suportada

- pacote/template: `1.1.0`;
- Angular e Angular CLI: `22.2.x` (a coleção compila com `22.2.1`);
- Node.js: `24.15.0+` dentro da linha Node 24;
- TypeScript dos projetos gerados: `~6.0.2`;
- npm com o lockfile gerado e versionado.

A v1.1 suporta apenas esta major do Angular. Não use `--force` ou `--legacy-peer-deps`.

## Instalar e criar

Para a experiência concisa com ferramentas globais:

```bash
npm install --global @angular/cli@22.2.1 @rodri/angular-template@1.1.0
ng new my-app --collection=@rodri/angular-template
cd my-app
npm start
```

Para ferramentas locais ao projeto, sem instalação global:

```bash
mkdir angular-starter && cd angular-starter
npm init -y
npm install --save-dev @angular/cli@22.2.1 @rodri/angular-template@1.1.0
npx ng new my-app --collection=@rodri/angular-template
cd my-app
npm start
```

O projeto gerado não exige edições manuais. Por padrão, ele inicia com mock em memória em
`http://localhost:4200`.

## Opções

| Opção CLI              | Tipo              | Default                 | Efeito                                                   |
| ---------------------- | ----------------- | ----------------------- | -------------------------------------------------------- |
| `name`                 | string            | obrigatório             | Identidade do workspace, projeto Angular, package e tela |
| `--directory`          | caminho relativo  | nome normalizado        | Diretório de saída; não pode escapar do diretório atual  |
| `--style`              | `scss` ou `css`   | `scss`                  | Formato dos estilos globais e de componentes             |
| `--routing`            | boolean           | `true`                  | Shell com Router e rota lazy de referência               |
| `--api-mode`           | `mock` ou `bff`   | `mock`                  | Modo padrão da API em desenvolvimento                    |
| `--bff-proxy-target`   | URL HTTP absoluta | `http://localhost:5000` | Destino do proxy BFF; credenciais são rejeitadas         |
| `--observability`      | boolean           | `true`                  | Providers locais de telemetria e performance             |
| `--e2e`                | boolean           | `true`                  | Configs, testes, scripts e gate de CI do Playwright      |
| `--coverage-threshold` | inteiro `0..100`  | `85`                    | Gate por statements/branches/functions/lines             |
| `--skip-git`           | boolean           | `false`                 | Não inicializa Git pelo Angular CLI                      |
| `--skip-install`       | boolean           | `false`                 | Não instala dependências pelo Angular CLI                |

Os defaults reproduzem o baseline runtime recomendado da v1.0. Exemplos:

```bash
# Projeto padrão com mock local
ng new customer-portal --collection=@rodri/angular-template

# Desenvolvimento BFF-first com proxy customizado e cobertura maior
ng new customer-portal --collection=@rodri/angular-template \
  --api-mode=bff \
  --bff-proxy-target=https://localhost:7443 \
  --coverage-threshold=90

# CSS, sem router, telemetria desabilitada em runtime e sem baseline E2E
ng new small-app --collection=@rodri/angular-template \
  --style=css \
  --routing=false \
  --observability=false \
  --e2e=false
```

O schematic rejeita URLs de proxy inseguras, enums não suportados, caminhos absolutos/pai e geração
sobre um workspace Angular existente antes de gravar a árvore.

## Validar um projeto gerado

A saída padrão expõe os mesmos gates deste repositório:

```bash
npm ci
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run bootstrap:verify
npm run e2e:mock
npm run e2e:bff
```

`npm run e2e` executa os dois modos de browser. Um projeto criado com `--e2e=false` omite
intencionalmente dependências, arquivos, scripts e etapas de CI do Playwright.

## Desenvolvimento da coleção

A aplicação raiz continua privada e executável. O código usado na geração fica isolado em
`schematics/`; o build copia o baseline da aplicação para o artefato distribuível sem caminhos de
runtime de volta ao checkout.

```bash
npm run schematics:install
npm run schematics:build
npm run schematics:test
npm run schematics:package:validate
npm run schematics:integration
```

A suíte unitária usa árvore virtual para schema, orquestração, opções, falhas, identidade e
reentrada. O harness de integração cria um consumidor temporário fora deste checkout, instala o
`.tgz`, chama o Angular CLI, executa todos os gates do projeto gerado e sempre remove seu diretório
temporário.

`schematics:package:validate` executa `npm pack`, mostra e verifica o manifesto real do tarball,
rejeita arquivos internos ou exclusivos do compilador, instala o arquivo em consumidor limpo e
carrega a coleção `ng-new`. O pacote contém apenas `package.json`, README, JavaScript compilado,
`collection.json`, `schema.json` e templates exigidos pela geração.

## Release e publish

As versões do template e do pacote avançam juntas. A tag `v1.1.0` só pode publicar o pacote
`1.1.0`. `.github/workflows/publish-schematics.yml` executa apenas para tags de versão no repositório
canônico, revalida o tarball e o consumidor gerado e publica em runner hospedado pelo GitHub via
trusted publishing do npm (OIDC). Nenhum token npm ou segredo é commitado; o npm adiciona provenance.

Antes do primeiro release real, o publisher deve:

1. possuir ou criar o scope npm `@rodri` e registrar o primeiro `@rodri/angular-template`;
2. configurar o trusted publisher no npm para usuário GitHub `rodri-oliveira-dev`, repositório
   `angular-template`, workflow `publish-schematics.yml` e permissão de publish direto;
3. configurar o environment `npm` do GitHub com aprovação obrigatória de maintainer;
4. enviar uma tag anotada exatamente igual à versão de `schematics/package.json` somente depois de
   a `main` ficar verde.

Nenhuma implementação ou smoke test publica uma versão npm real. Até o primeiro release no
registry, use `npm run schematics:package:validate` e `npm run schematics:integration` com o `.tgz`
local.

A rota por GitHub Template continua documentada como fallback em
[Configuração como Template Repository](template-repository.md).
