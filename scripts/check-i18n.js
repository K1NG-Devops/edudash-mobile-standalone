#!/usr/bin/env node

/**
 * i18n Quality Check Script
 * 
 * This script validates translation completeness and consistency across all language files.
 * It checks for missing keys, extra keys, and ensures structural consistency.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Load and parse a JSON translation file
 */
function loadTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    colorLog('red', `❌ Error loading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Flatten nested object to dot notation
 * Example: { auth: { signIn: "Sign in" } } -> { "auth.signIn": "Sign in" }
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      flattened[prefix ? `${prefix}.${key}` : key] = obj[key];
    }
  }
  
  return flattened;
}

/**
 * Get all translation keys from an object
 */
function getAllKeys(obj) {
  const flattened = flattenObject(obj);
  return Object.keys(flattened).sort();
}

/**
 * Check for missing keys in a target language compared to the source
 */
function checkMissingKeys(sourceKeys, targetKeys, targetLang) {
  const missing = sourceKeys.filter(key => !targetKeys.includes(key));
  
  if (missing.length > 0) {
    colorLog('red', `\n❌ Missing keys in ${targetLang}:`);
    missing.forEach(key => console.log(`  - ${key}`));
    return missing;
  } else {
    colorLog('green', `✅ ${targetLang} has all required keys`);
    return [];
  }
}

/**
 * Check for extra keys in a target language
 */
function checkExtraKeys(sourceKeys, targetKeys, targetLang) {
  const extra = targetKeys.filter(key => !sourceKeys.includes(key));
  
  if (extra.length > 0) {
    colorLog('yellow', `\n⚠️  Extra keys in ${targetLang} (not in English):`);
    extra.forEach(key => console.log(`  + ${key}`));
    return extra;
  }
  
  return [];
}

/**
 * Check for empty or placeholder values
 */
function checkEmptyValues(translations, lang) {
  const flattened = flattenObject(translations);
  const empty = [];
  const placeholders = [];
  
  Object.entries(flattened).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      empty.push(key);
    } else if (typeof value === 'string' && (
      value.includes('[TODO]') ||
      value.includes('TODO:') ||
      value === key.split('.').pop() // Key equals its last segment (likely auto-generated)
    )) {
      placeholders.push(key);
    }
  });
  
  if (empty.length > 0) {
    colorLog('red', `\n❌ Empty values in ${lang}:`);
    empty.forEach(key => console.log(`  - ${key}`));
  }
  
  if (placeholders.length > 0) {
    colorLog('yellow', `\n⚠️  Placeholder values in ${lang}:`);
    placeholders.forEach(key => console.log(`  - ${key}: "${flattened[key]}"`));
  }
  
  return { empty, placeholders };
}

/**
 * Main validation function
 */
function validateTranslations() {
  colorLog('blue', `${colors.bold}🌍 i18n Translation Validation${colors.reset}`);
  console.log('='.repeat(50));
  
  // Get all JSON files in the locales directory
  let files;
  try {
    files = fs.readdirSync(LOCALES_DIR).filter(file => file.endsWith('.json'));
  } catch (error) {
    colorLog('red', `❌ Error reading locales directory: ${error.message}`);
    process.exit(1);
  }
  
  if (files.length === 0) {
    colorLog('yellow', '⚠️  No translation files found');
    return;
  }
  
  colorLog('blue', `Found translation files: ${files.join(', ')}`);
  
  // Load all translation files
  const translations = {};
  let hasErrors = false;
  
  files.forEach(file => {
    const lang = path.basename(file, '.json');
    const filePath = path.join(LOCALES_DIR, file);
    const data = loadTranslationFile(filePath);
    
    if (data) {
      translations[lang] = data;
    } else {
      hasErrors = true;
    }
  });
  
  if (Object.keys(translations).length === 0) {
    colorLog('red', '❌ No valid translation files found');
    process.exit(1);
  }
  
  // Use English as the source language (reference)
  const sourceLang = 'en';
  if (!translations[sourceLang]) {
    colorLog('red', `❌ Source language (${sourceLang}) not found`);
    process.exit(1);
  }
  
  const sourceKeys = getAllKeys(translations[sourceLang]);
  colorLog('blue', `\nSource language (${sourceLang}) has ${sourceKeys.length} keys`);
  
  // Validate each target language
  const results = {
    missingKeys: {},
    extraKeys: {},
    emptyValues: {},
    placeholderValues: {}
  };
  
  Object.keys(translations).forEach(lang => {
    if (lang === sourceLang) return; // Skip source language
    
    colorLog('blue', `\n📋 Checking ${lang}...`);
    
    const targetKeys = getAllKeys(translations[lang]);
    console.log(`  ${lang} has ${targetKeys.length} keys`);
    
    // Check for missing and extra keys
    const missing = checkMissingKeys(sourceKeys, targetKeys, lang);
    const extra = checkExtraKeys(sourceKeys, targetKeys, lang);
    
    // Check for empty and placeholder values
    const { empty, placeholders } = checkEmptyValues(translations[lang], lang);
    
    if (missing.length > 0) results.missingKeys[lang] = missing;
    if (extra.length > 0) results.extraKeys[lang] = extra;
    if (empty.length > 0) results.emptyValues[lang] = empty;
    if (placeholders.length > 0) results.placeholderValues[lang] = placeholders;
  });
  
  // Summary report
  console.log('\n' + '='.repeat(50));
  colorLog('blue', `${colors.bold}📊 Summary Report${colors.reset}`);
  
  let totalIssues = 0;
  const languages = Object.keys(translations).filter(lang => lang !== sourceLang);
  
  languages.forEach(lang => {
    const missing = results.missingKeys[lang]?.length || 0;
    const extra = results.extraKeys[lang]?.length || 0;
    const empty = results.emptyValues[lang]?.length || 0;
    const placeholders = results.placeholderValues[lang]?.length || 0;
    const total = missing + extra + empty + placeholders;
    
    console.log(`\n${lang.toUpperCase()}:`);
    console.log(`  Missing keys: ${missing}`);
    console.log(`  Extra keys: ${extra}`);
    console.log(`  Empty values: ${empty}`);
    console.log(`  Placeholder values: ${placeholders}`);
    console.log(`  Total issues: ${total}`);
    
    totalIssues += total;
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (totalIssues === 0) {
    colorLog('green', `🎉 All ${languages.length} translation files are complete and valid!`);
  } else {
    colorLog('yellow', `⚠️  Found ${totalIssues} translation issues across ${languages.length} languages`);
    
    console.log('\n📝 Recommendations:');
    console.log('1. Add missing translation keys to incomplete languages');
    console.log('2. Remove or justify extra keys that don\'t exist in English');
    console.log('3. Fill in empty values with proper translations');
    console.log('4. Replace placeholder values with actual translations');
    console.log('5. Consider using a translation management service for large projects');
  }
  
  // Exit with appropriate code
  const criticalIssues = Object.keys(results.missingKeys).length + Object.keys(results.emptyValues).length;
  if (criticalIssues > 0) {
    colorLog('red', '\n❌ Critical translation issues found');
    hasErrors = true;
  }
  
  if (hasErrors) {
    process.exit(1);
  }
}

/**
 * CLI usage info
 */
function showUsage() {
  console.log('Usage: node scripts/check-i18n.js');
  console.log('');
  console.log('This script validates translation completeness and consistency.');
  console.log('It checks all .json files in the src/locales directory.');
  console.log('');
  console.log('Options:');
  console.log('  --help    Show this help message');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showUsage();
    process.exit(0);
  }
  
  validateTranslations();
}

module.exports = { validateTranslations, flattenObject, getAllKeys };
