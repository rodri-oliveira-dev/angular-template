> 🌐 Language: **English** | [Português (Brasil)](pt-BR/template-repository.md)

# GitHub Template Repository Setup

The v1.0 repository is designed to be consumed as a GitHub Template Repository.

## Enable the setting

Repository administrators can enable it after the v1.0 PR is merged and the default branch is green:

1. open the repository on GitHub;
2. open **Settings**;
3. in the repository settings, enable **Template repository**;
4. return to the repository home page and confirm **Use this template** is available.

GitHub copies the directory structure and files into a new repository without carrying over the template repository's commit history.

Official GitHub documentation: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository

## Recommended consumption

Use **Use this template → Create a new repository** and keep the default option that starts from the default branch unless there is an explicit reason to copy other branches.

After creation:

```bash
nvm use
npm ci
npm start
```

The application starts in mock mode without external infrastructure.

## Repository settings are not source files

GitHub rulesets, branch protection, environments, secrets, variables, installed Apps, and repository-level security settings are administration state and are not reliably reproduced merely by copying source files.

New repositories should configure governance appropriate to their organization. The CI documentation lists the status checks recommended for protecting `main`.

## Git LFS

Do not add required template files through Git LFS. GitHub documents that template repositories cannot include files stored using Git LFS.
