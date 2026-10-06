import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve(process.cwd(), 'dist/angular-template/browser');
const indexPath = path.join(outputDirectory, 'index.html');
const fallbackPath = path.join(outputDirectory, '404.html');
const noJekyllPath = path.join(outputDirectory, '.nojekyll');
const expectedBaseHref = process.env.PAGES_BASE_HREF ?? '/angular-template/';

try {
  await access(indexPath);
} catch {
  throw new Error(
    `GitHub Pages build output not found at ${indexPath}. Run the Angular pages build before preparing the artifact.`,
  );
}

const indexHtml = await readFile(indexPath, 'utf8');
const expectedBaseTag = `<base href="${expectedBaseHref}">`;

if (!indexHtml.includes(expectedBaseTag)) {
  throw new Error(
    `Expected ${expectedBaseTag} in the Pages index. Check angular.json pages.baseHref.`,
  );
}

await copyFile(indexPath, fallbackPath);
await writeFile(noJekyllPath, '');

console.log(`Prepared GitHub Pages artifact in ${outputDirectory}`);
console.log(`- SPA fallback: ${fallbackPath}`);
console.log(`- Jekyll bypass: ${noJekyllPath}`);
