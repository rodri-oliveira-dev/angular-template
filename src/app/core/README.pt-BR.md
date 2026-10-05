> 🌐 Idioma: [English](README.md) | **Português (Brasil)**

# Core

`core/` contém infraestrutura global da aplicação que normalmente deve ter uma única instância compartilhada ou ponto central de configuração.

Exemplos atuais:

- configuração tipada de API;
- tratamento de correlation ID;
- mapeamento padronizado de erros HTTP;
- suporte a Problem Details.

Outras responsabilidades adequadas incluem:

- tratamento global de erros;
- guards;
- interceptors cross-cutting;
- providers globais da aplicação.

Lógica de negócio e services específicos de feature não pertencem aqui. API clients continuam pertencendo à feature que os consome.
