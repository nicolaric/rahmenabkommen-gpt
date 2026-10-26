#!/usr/bin/env node
/**
 * Copies the yeos (project-eos) UI libraries this app uses into vendor/eos.
 *
 * Starting from every `@eos/...` import in app/, it follows imports through
 * project-eos and copies exactly the files that are reached, keeping their
 * libs/... layout so the @eos path aliases and the relative @source globs in
 * the shared Tailwind stylesheet keep working. Rerun after updating
 * project-eos:
 *
 *   EOS_DIR=../../project-eos node bin/sync-eos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const uiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eosDir = path.resolve(uiDir, process.env.EOS_DIR ?? '../../project-eos');
const vendorDir = path.join(uiDir, 'vendor/eos');

// Copied as whole directories: CSS @imports are not followed below
const EXTRA_DIRS = ['libs/shared/styles'];

const tsconfig = JSON.parse(
  fs
    .readFileSync(path.join(eosDir, 'tsconfig.base.json'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, ''),
);
const aliases = tsconfig.compilerOptions.paths;

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx'];
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

function findFile(base) {
  for (const ext of EXTENSIONS) {
    const file = base + ext;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

const usedAliases = new Set();

function resolveAlias(specifier) {
  for (const [alias, [target]] of Object.entries(aliases)) {
    let file = null;
    if (alias === specifier) {
      file = findFile(path.join(eosDir, target));
    } else if (
      alias.endsWith('/*') &&
      specifier.startsWith(alias.slice(0, -1))
    ) {
      const rest = specifier.slice(alias.length - 1);
      file = findFile(path.join(eosDir, target.replace('*', rest)));
    }
    if (file) {
      usedAliases.add(alias);
      return file;
    }
  }
  return null;
}

function importsOf(file) {
  const specifiers = [];
  for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
    specifiers.push(match[1] ?? match[2] ?? match[3]);
  }
  return specifiers;
}

function appFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return appFiles(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

const queue = [];
for (const file of appFiles(path.join(uiDir, 'app'))) {
  for (const specifier of importsOf(file)) {
    if (!specifier.startsWith('@eos/')) continue;
    const resolved = resolveAlias(specifier);
    if (!resolved) throw new Error(`Cannot resolve ${specifier} in ${file}`);
    queue.push(resolved);
  }
}

const reached = new Set();
const externals = new Set();
while (queue.length > 0) {
  const file = queue.pop();
  if (reached.has(file)) continue;
  reached.add(file);
  if (!/\.(tsx?|jsx?)$/.test(file)) continue;

  for (const specifier of importsOf(file)) {
    if (specifier.startsWith('.') || specifier.startsWith('@eos/')) {
      const resolved = specifier.startsWith('.')
        ? findFile(path.resolve(path.dirname(file), specifier))
        : resolveAlias(specifier);
      if (!resolved) throw new Error(`Cannot resolve ${specifier} in ${file}`);
      queue.push(resolved);
    } else {
      const parts = specifier.split('/');
      externals.add(
        specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0],
      );
    }
  }
}

fs.rmSync(vendorDir, { recursive: true, force: true });

const isTest = (file) => /\.(spec|test)\.tsx?$/.test(file);
for (const file of reached) {
  const relative = path.relative(eosDir, file);
  if (!relative.startsWith('libs/') || isTest(file)) continue;
  const target = path.join(vendorDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
for (const dir of EXTRA_DIRS) {
  fs.cpSync(path.join(eosDir, dir), path.join(vendorDir, dir), {
    recursive: true,
    filter: (source) => !source.endsWith('project.json'),
  });
}

// Only the aliases in use, pointing into vendor/eos; tsconfig.json extends it
const paths = Object.fromEntries(
  [...usedAliases].sort().map((alias) => [alias, aliases[alias]]),
);
fs.writeFileSync(
  path.join(vendorDir, 'tsconfig.paths.json'),
  `${JSON.stringify({ compilerOptions: { paths } }, null, 2)}\n`,
);

let commit = 'unknown';
try {
  const head = fs.readFileSync(path.join(eosDir, '.git/HEAD'), 'utf8').trim();
  commit = head.startsWith('ref: ')
    ? fs.readFileSync(path.join(eosDir, '.git', head.slice(5)), 'utf8').trim()
    : head;
} catch {
  // Not a git checkout; leave the commit unknown
}
fs.writeFileSync(
  path.join(vendorDir, 'README.md'),
  `# Vendored yeos UI libraries

Copied from project-eos (${commit}) by \`bin/sync-eos.mjs\`.
Do not edit these files here; change them in project-eos and sync again.

External packages they import:
${[...externals]
  .sort()
  .map((pkg) => `- ${pkg}`)
  .join('\n')}
`,
);

console.log(
  `Copied ${reached.size} files for ${usedAliases.size} aliases; ${externals.size} external packages listed in vendor/eos/README.md`,
);
