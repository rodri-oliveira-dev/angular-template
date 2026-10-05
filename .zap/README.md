# ZAP Baseline exceptions

The CI uses OWASP ZAP Baseline with `fail_action: true`. This file documents every alert intentionally suppressed by `.zap/rules.tsv`.

| Alert | Decision | Rationale |
| --- | --- | --- |
| 10049 — Non-Storable Content | Ignore | The CI harness intentionally applies explicit cache behavior: `index.html` is non-storable while fingerprinted static assets are long-lived. This ZAP warning does not indicate an exploitable frontend vulnerability in that model. |
| 10055 — CSP: Wildcard Directive | Ignore | Angular `security.autoCsp` generates the script policy in the document. The provider-neutral HTTP CSP is intentionally complementary and avoids a conflicting `default-src` / `script-src` policy. |
| 10109 — Modern Web Application | Ignore | Informational classification only; the target is intentionally an Angular SPA. |
| 90004 — Cross-Origin-Embedder-Policy Header Missing or Invalid | Ignore | COEP is required for cross-origin isolation use cases, not as a universal Angular baseline. Applications that require `SharedArrayBuffer` or cross-origin isolation must enable and validate COEP/COOP explicitly. |

Rules are suppressed only when the alert is understood and the architecture makes the finding non-actionable. New alerts remain blocking by default.

The TSV file intentionally contains only parser-compatible rule rows. Keep explanations here rather than adding comments to the TSV because the GitHub ZAP action parses every line as a rule.
