#!/usr/bin/env node
/*
 Simple i18n key validation for dashboard modules
 Scans components/dashboard for t('...') and i18n.t('...') usages and checks presence in en/af/zu locales.
 Rules:
 - A key is considered present if it's an exact match in the locale OR if any key exists with the same base and a plural suffix (e.g., key_one, key_other)
*/

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dashboardsDir = path.join(projectRoot, 'components', 'dashboard');
const localesDir = path.join(projectRoot, 'src', 'locales');
const localeFiles = ['en.json', 'af.json', 'zu.json'];

function readAllFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...readAllFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

function extractI18nKeysFromFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const regex = /(i18n\.t|\bt)\(\s*['"`]([^'"`]+)['"`]/g;
  const keys = new Set();
  let m;
  while ((m = regex.exec(src)) !== null) {
    const key = m[2].trim();
    if (key) keys.add(key);
  }
  return keys;
}

function flattenLocale(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenLocale(v, keyPath));
    } else {
      out[keyPath] = String(v);
    }
  }
  return out;
}

function loadLocale(localePath) {
  const raw = fs.readFileSync(localePath, 'utf8');
  return JSON.parse(raw);
}

function baseKeySatisfied(key, flatKeySet) {
  if (flatKeySet.has(key)) return true;
  // pluralization suffix variant: key_one/key_other
  for (const suffix of ['_zero', '_one', '_two', '_few', '_many', '_other']) {
    if (flatKeySet.has(`${key}${suffix}`)) return true;
  }
  return false;
}

function main() {
  const files = readAllFiles(dashboardsDir);
  const usedKeys = new Set();
  files.forEach((f) => {
    extractI18nKeysFromFile(f).forEach((k) => usedKeys.add(k));
  });

  const localeMaps = {};
  const flatSets = {};
  for (const lf of localeFiles) {
    const p = path.join(localesDir, lf);
    if (!fs.existsSync(p)) {
      console.error(`Missing locale file: ${p}`);
      process.exitCode = 2;
      return;
    }
    localeMaps[lf] = flattenLocale(loadLocale(p));
    flatSets[lf] = new Set(Object.keys(localeMaps[lf]));
  }

  const missing = {};
  for (const lf of localeFiles) missing[lf] = [];

  for (const key of usedKeys) {
    for (const lf of localeFiles) {
      if (!baseKeySatisfied(key, flatSets[lf])) {
        missing[lf].push(key);
      }
    }
  }

  let hasMissing = false;
  for (const lf of localeFiles) {
    if (missing[lf].length > 0) {
      hasMissing = true;
      console.log(`\n[${lf}] Missing keys (${missing[lf].length}):`);
      const sorted = Array.from(new Set(missing[lf])).sort();
      sorted.forEach((k) => console.log(` - ${k}`));
    }
  }

  if (!hasMissing) {
    console.log('All used dashboard i18n keys are present across en/af/zu.');
  }

  process.exit(hasMissing ? 1 : 0);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('Validation failed with error:', e);
    process.exit(2);
  }
}

