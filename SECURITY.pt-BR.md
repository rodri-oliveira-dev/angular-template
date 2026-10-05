> 🌐 Idioma: [English](SECURITY.md) | **Português (Brasil)**

# Política de Segurança

## Versões suportadas

| Versão | Suporte |
| ------ | ------- |
| 1.x    | Sim     |
| < 1.0  | Não     |

Correções de segurança são aplicadas à linha atualmente suportada. Consumidores de um projeto gerado são responsáveis por manter suas próprias dependências e controles de deployment após a criação.

## Reportando uma vulnerabilidade

Não abra issue pública contendo detalhes de exploração, credenciais, logs sensíveis ou proof of concept de uma vulnerabilidade ainda não corrigida.

Prefira o fluxo privado de vulnerability reporting/security advisory do GitHub para este repositório quando disponível:

1. abra a aba **Security** do repositório;
2. use a opção de reporte/advisory privado;
3. inclua versão afetada, impacto, passos de reprodução e um proof of concept mínimo;
4. remova secrets e dados pessoais não relacionados.

Se o reporte privado não estiver disponível, contate o mantenedor por um canal privado antes de publicar detalhes técnicos de exploração.

## Escopo

Relatos de segurança são especialmente úteis para:

- injeção no Angular/client-side ou manipulação insegura do DOM;
- falhas na fronteira de autenticação/sessão/XSRF do contrato BFF documentado;
- persistência ou logging acidental de credenciais;
- fragilidades de supply chain em dependências ou CI;
- regressões de security headers ou CSP;
- comportamento do template/geração que crie defaults inseguros.

Autorização específica do backend da aplicação, configuração do provedor de identidade, infraestrutura cloud e segurança de serviços downstream continuam sendo responsabilidade da aplicação construída a partir deste template.

## Divulgação

Permita tempo para que os mantenedores validem e preparem uma correção antes da divulgação pública. Depois que a correção estiver disponível, as release notes devem descrever impacto e remediação sem expor detalhes sensíveis desnecessários.
