#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.expo', '.next', 'build', 'dist', 'ios', 'android', '.vercel', '.turbo'
]);
const INCLUDED_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        yield* walk(res);
      }
    } else if (INCLUDED_EXTS.has(path.extname(entry.name))) {
      yield res;
    }
  }
}

function extractI18nKeys(content) {
  const keys = new Set();
  const patterns = [
    /\bt\(\s*['"]([^'"`]+)['"]\s*[,)]/g,                // t('key') or t("key")
    /i18n\.t\(\s*['"]([^'"`]+)['"]\s*[,)]/g             // i18n.t('key') or i18n.t("key")
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(content)) !== null) {
      const key = match[1];
      if (!key.includes('${')) keys.add(key);
    }
  }
  return keys;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

async function loadLocale(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const codeDirs = [
    path.join(projectRoot, 'components'),
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'lib')
  ];

  const usedKeys = new Set();
  for (const dir of codeDirs) {
    try {
      for await (const file of walk(dir)) {
        const content = await fs.readFile(file, 'utf8');
        for (const key of extractI18nKeys(content)) usedKeys.add(key);
      }
    } catch (e) {
      // ignore missing dirs
    }
  }

  const localeDir = path.join(projectRoot, 'src', 'locales');
  const locales = ['en.json', 'af.json', 'zu.json'];
  const localeData = {};

  for (const fname of locales) {
    const fpath = path.join(localeDir, fname);
    const data = await loadLocale(fpath);
    localeData[fname] = flatten(data);
  }

  const used = Array.from(usedKeys).sort();
  const report = {};

  const hasKeyOrPlural = (keys, key) => {
    if (keys.has(key)) return true;
    // Allow i18next plural forms like key_one, key_other, key_zero, key_two, key_few, key_many
    const prefixes = ['_one', '_other', '_zero', '_two', '_few', '_many'];
    return prefixes.some(suffix => keys.has(`${key}${suffix}`));
  };

  for (const [lname, flat] of Object.entries(localeData)) {
    const keys = new Set(Object.keys(flat));
    const missing = used.filter(k => !hasKeyOrPlural(keys, k));
    report[lname] = { missingCount: missing.length, missing };
  }

  // Print report
  for (const [lname, { missingCount, missing }] of Object.entries(report)) {
    console.log(`\nLocale ${lname}: missing ${missingCount} key(s)`);
    if (missingCount > 0) {
      for (const k of missing) console.log(`  - ${k}`);
    }
  }

  // Exit code 0 even if missing, for CI adjust as needed
  console.log('\nValidation complete.');
}

main().catch(err => {
  console.error('validate-i18n failed:', err);
  process.exit(1);
});

