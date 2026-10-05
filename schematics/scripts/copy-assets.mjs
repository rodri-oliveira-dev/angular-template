import { cp, mkdir } from 'node:fs/promises';

const sourceRoot = new URL('../src/', import.meta.url);
const outputRoot = new URL('../dist/', import.meta.url);

await mkdir(new URL('ng-new/', outputRoot), { recursive: true });
await cp(new URL('collection.json', sourceRoot), new URL('collection.json', outputRoot));
await cp(new URL('ng-new/schema.json', sourceRoot), new URL('ng-new/schema.json', outputRoot));
