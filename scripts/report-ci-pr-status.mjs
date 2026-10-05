const marker = '<!-- angular-template-ci-validation -->';

const gateDefinitions = [
  ['Checkout', 'CHECKOUT_OUTCOME'],
  ['Setup Node.js', 'SETUP_NODE_OUTCOME'],
  ['Runtime versions', 'RUNTIME_VERSIONS_OUTCOME'],
  ['Install dependencies', 'INSTALL_DEPENDENCIES_OUTCOME'],
  ['CI reporter tests', 'REPORTER_TESTS_OUTCOME'],
  ['Format check', 'FORMAT_CHECK_OUTCOME'],
  ['Lint and guardrails', 'LINT_GUARDRAILS_OUTCOME'],
  ['Security guardrails and dependency audit', 'SECURITY_GATE_OUTCOME'],
  ['Unit tests with coverage', 'UNIT_TESTS_OUTCOME'],
  ['Coverage gate (>= 85%)', 'COVERAGE_GATE_OUTCOME'],
  ['Production build', 'PRODUCTION_BUILD_OUTCOME'],
  ['Serve production build for DAST', 'DAST_SERVER_OUTCOME'],
  ['OWASP ZAP baseline', 'ZAP_BASELINE_OUTCOME'],
  ['Install Playwright Chromium', 'PLAYWRIGHT_INSTALL_OUTCOME'],
  ['Playwright E2E (mock + BFF)', 'E2E_OUTCOME'],
];

export function collectGateResults(env = process.env) {
  return gateDefinitions.map(([name, key]) => ({
    name,
    outcome: env[key] || 'skipped',
  }));
}

export function buildComment({
  gates,
  runUrl,
  sha = '',
}) {
  const failed = gates.filter((gate) =>
    ['failure', 'cancelled'].includes(gate.outcome),
  );
  const skipped = gates.filter((gate) => gate.outcome === 'skipped');
  const successful = failed.length === 0 && skipped.length === 0;

  const lines = [
    marker,
    '## CI validation',
    '',
    successful
      ? '✅ **Success** — all required validation gates passed.'
      : '❌ **Failure** — one or more validation gates did not complete successfully.',
    '',
  ];

  if (failed.length > 0) {
    lines.push('### Failed gates', '');
    for (const gate of failed) {
      lines.push(`- ❌ ${gate.name}`);
    }
    lines.push('');
  }

  if (skipped.length > 0) {
    lines.push(
      '### Skipped after failure',
      '',
      ...skipped.map((gate) => `- ⏭️ ${gate.name}`),
      '',
    );
  }

  if (successful) {
    lines.push(
      '### Passed gates',
      '',
      ...gates.map((gate) => `- ✅ ${gate.name}`),
      '',
    );
  }

  if (sha) {
    lines.push(`Commit: \`${sha.slice(0, 7)}\``, '');
  }

  lines.push(`[Open workflow run](${runUrl})`);

  return lines.join('\n');
}

async function githubRequest(url, options = {}) {
  const token = process.env['GITHUB_TOKEN'];

  if (!token) {
    throw new Error('GITHUB_TOKEN is required to report CI status.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API request failed (${response.status}): ${body}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function upsertPullRequestComment({
  repository,
  pullRequestNumber,
  body,
}) {
  const [owner, repo] = repository.split('/');

  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY must use owner/repository format.');
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const comments = await githubRequest(
    `${baseUrl}/issues/${pullRequestNumber}/comments?per_page=100`,
  );

  const existing = comments.find((comment) => comment.body?.includes(marker));

  if (existing) {
    await githubRequest(`${baseUrl}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    });
    return { action: 'updated', commentId: existing.id };
  }

  const created = await githubRequest(
    `${baseUrl}/issues/${pullRequestNumber}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body }),
    },
  );

  return { action: 'created', commentId: created.id };
}

async function main() {
  const repository = process.env['GITHUB_REPOSITORY'];
  const pullRequestNumber = Number(process.env['PR_NUMBER']);
  const runUrl = process.env['RUN_URL'];

  if (!repository || !Number.isInteger(pullRequestNumber) || !runUrl) {
    throw new Error(
      'GITHUB_REPOSITORY, PR_NUMBER and RUN_URL are required to report CI status.',
    );
  }

  const body = buildComment({
    gates: collectGateResults(),
    runUrl,
    sha: process.env['GITHUB_SHA'] ?? '',
  });

  const result = await upsertPullRequestComment({
    repository,
    pullRequestNumber,
    body,
  });

  console.log(
    `CI pull-request comment ${result.action} (id: ${result.commentId}).`,
  );
}

if (process.argv[1]?.endsWith('report-ci-pr-status.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
