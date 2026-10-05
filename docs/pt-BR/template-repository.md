> 🌐 Idioma: [English](../template-repository.md) | **Português (Brasil)**

# Configuração como GitHub Template Repository

O repositório v1.0 foi desenhado para ser consumido como GitHub Template Repository.

## Habilitar a configuração

Administradores do repositório podem habilitá-la depois que o PR v1.0 for mergeado e a branch padrão estiver verde:

1. abra o repositório no GitHub;
2. abra **Settings**;
3. nas configurações do repositório, habilite **Template repository**;
4. volte para a página inicial do repositório e confirme que **Use this template** está disponível.

O GitHub copia a estrutura de diretórios e os arquivos para um novo repositório sem carregar o histórico de commits do repositório-template.

Documentação oficial do GitHub: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository

## Forma recomendada de consumo

Use **Use this template → Create a new repository** e mantenha a opção padrão que parte da branch default, salvo motivo explícito para copiar outras branches.

Depois da criação:

```bash
nvm use
npm ci
npm start
```

A aplicação inicia em modo mock, sem infraestrutura externa.

## Configurações de repositório não são arquivos-fonte

GitHub rulesets, branch protection, environments, secrets, variables, Apps instalados e outras configurações de segurança do repositório são estado administrativo e não são reproduzidos de forma confiável apenas copiando os arquivos-fonte.

Novos repositórios devem configurar a governança adequada à organização. A documentação de CI lista os status checks recomendados para proteger `main`.

## Git LFS

Não adicione arquivos obrigatórios do template via Git LFS. O GitHub documenta que template repositories não podem incluir arquivos armazenados com Git LFS.
