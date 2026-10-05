> 🌐 Idioma: [English](README.md) | **Português (Brasil)**

# Exceções do ZAP Baseline

O CI usa OWASP ZAP Baseline com `fail_action: true`. Este arquivo documenta cada alerta intencionalmente suprimido em `.zap/rules.tsv`.

| Alerta                                                         | Decisão | Justificativa                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10049 — Non-Storable Content                                   | Ignorar | O harness de CI aplica cache explícito: `index.html` não é armazenável enquanto assets fingerprinted têm cache longo. Nesse modelo, o warning não representa uma vulnerabilidade frontend explorável.                           |
| 10055 — CSP: Wildcard Directive                                | Ignorar | Angular `security.autoCsp` gera a política de scripts no documento. O CSP HTTP provider-neutral é complementar e evita uma política `default-src` / `script-src` conflitante.                                                |
| 10109 — Modern Web Application                                 | Ignorar | Classificação apenas informativa; o alvo é intencionalmente uma SPA Angular.                                                                                                                                                       |
| 90004 — Cross-Origin-Embedder-Policy Header Missing or Invalid | Ignorar | COEP é necessário para casos de cross-origin isolation, não como baseline Angular universal. Aplicações que dependam de `SharedArrayBuffer` ou isolamento cross-origin devem habilitar e validar COEP/COOP explicitamente. |

Regras só são suprimidas quando o alerta é compreendido e a arquitetura torna o finding não acionável. Novos alertas continuam bloqueando por padrão.

O TSV contém apenas linhas compatíveis com o parser. Mantenha explicações neste README em vez de comentários no TSV, porque a Action do ZAP interpreta cada linha como uma regra.
