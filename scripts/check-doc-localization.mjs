import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const rootDocs = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md'];

async function walkMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'pt-BR') continue;
      files.push(...(await walkMarkdown(absolute)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }

  return files;
}

function mirrorFor(relative) {
  if (relative.startsWith('docs/')) {
    return path.join('docs', 'pt-BR', relative.slice('docs/'.length));
  }

  return relative.replace(/\.md$/, '.pt-BR.md');
}

async function exists(file) {
  try {
    return (await stat(path.join(root, file))).isFile();
  } catch {
    return false;
  }
}

async function validatePair(english) {
  const portuguese = mirrorFor(english);
  const errors = [];

  if (!(await exists(portuguese))) {
    return [`${english}: missing Portuguese mirror ${portuguese}`];
  }

  const [en, pt] = await Promise.all([
    readFile(path.join(root, english), 'utf8'),
    readFile(path.join(root, portuguese), 'utf8'),
  ]);

  const enHeader = en.split('\n').slice(0, 5).join('\n');
  const ptHeader = pt.split('\n').slice(0, 5).join('\n');

  if (!enHeader.includes('Português (Brasil)')) {
    errors.push(`${english}: language selector must link to Portuguese (Brasil)`);
  }

  if (!ptHeader.includes('English')) {
    errors.push(`${portuguese}: language selector must link back to English`);
  }

  return errors;
}

const docs = await walkMarkdown(path.join(root, 'docs'));
const canonical = [
  ...rootDocs,
  ...docs.map((file) => path.relative(root, file).split(path.sep).join('/')),
];

const errors = (await Promise.all(canonical.map(validatePair))).flat();

if (errors.length > 0) {
  console.error('Documentation localization check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation localization check passed for ${canonical.length} canonical files.`);
}
