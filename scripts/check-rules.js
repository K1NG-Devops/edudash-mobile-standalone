#!/usr/bin/env node

/**
 * Simple EduDash Pro Rules Checker
 * 
 * This script performs basic validation of project rules without complex regex patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function countFiles(pattern) {
  try {
    const output = execSync(`find . -name "${pattern}" | grep -v node_modules | wc -l`, { encoding: 'utf8' });
    return parseInt(output.trim()) || 0;
  } catch (error) {
    return 0;
  }
}

function main() {
  log('🔍 EduDash Pro - Simple Rules Check', 'bright');
  log('===================================', 'bright');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 1. Check project structure
  log('\n📁 Project Structure:', 'cyan');
  const requiredDirs = ['app', 'components', 'lib', 'types', 'constants', 'assets'];
  const requiredFiles = ['package.json', 'tsconfig.json', '.cursorrules', 'AI_AGENT_INSTRUCTIONS.md'];

  requiredDirs.forEach(dir => {
    if (checkFile(dir)) {
      log(`  ✅ ${dir}/ directory exists`, 'green');
      passed++;
    } else {
      log(`  ❌ Missing ${dir}/ directory`, 'red');
      failed++;
    }
  });

  requiredFiles.forEach(file => {
    if (checkFile(file)) {
      log(`  ✅ ${file} exists`, 'green');
      passed++;
    } else {
      log(`  ❌ Missing ${file}`, 'red');
      failed++;
    }
  });

  // 2. Check TypeScript configuration
  log('\n📝 TypeScript Configuration:', 'cyan');
  const tsConfig = readFile('tsconfig.json');
  if (tsConfig) {
    try {
      const config = JSON.parse(tsConfig);
      if (config.compilerOptions?.strict === true) {
        log('  ✅ Strict mode enabled', 'green');
        passed++;
      } else {
        log('  ❌ Strict mode not enabled', 'red');
        failed++;
      }
      
      if (config.compilerOptions?.allowJs === false) {
        log('  ✅ JavaScript disabled (TypeScript-only)', 'green');
        passed++;
      } else {
        log('  ⚠️  JavaScript files allowed', 'yellow');
        warnings++;
      }
    } catch (error) {
      log('  ❌ Invalid tsconfig.json format', 'red');
      failed++;
    }
  } else {
    log('  ❌ tsconfig.json not found', 'red');
    failed++;
  }

  // 3. Check file counts
  log('\n📊 File Statistics:', 'cyan');
  const tsFiles = countFiles('*.ts') + countFiles('*.tsx');
  const jsFiles = countFiles('*.js') + countFiles('*.jsx');
  
  log(`  TypeScript files: ${tsFiles}`, 'cyan');
  log(`  JavaScript files: ${jsFiles}`, 'cyan');
  
  if (tsFiles > jsFiles * 2) {
    log('  ✅ Primarily TypeScript project', 'green');
    passed++;
  } else {
    log('  ⚠️  Consider migrating more files to TypeScript', 'yellow');
    warnings++;
  }

  // 4. Check package.json dependencies
  log('\n📦 Package Dependencies:', 'cyan');
  const packageJson = readFile('package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      const criticalDeps = [
        '@supabase/supabase-js',
        '@anthropic-ai/sdk',
        'expo-router',
        'expo-secure-store',
        'react-native'
      ];

      criticalDeps.forEach(dep => {
        if (deps[dep]) {
          log(`  ✅ ${dep} installed`, 'green');
          passed++;
        } else {
          log(`  ⚠️  ${dep} not found`, 'yellow');
          warnings++;
        }
      });

      const performanceDeps = ['@shopify/flash-list', 'expo-image'];
      performanceDeps.forEach(dep => {
        if (deps[dep]) {
          log(`  ✅ Performance: ${dep}`, 'green');
          passed++;
        } else {
          log(`  ⚠️  Performance: ${dep} missing`, 'yellow');
          warnings++;
        }
      });

    } catch (error) {
      log('  ❌ Invalid package.json format', 'red');
      failed++;
    }
  }

  // 5. Check for key files
  log('\n🔧 Key Implementation Files:', 'cyan');
  const keyFiles = [
    'lib/supabase.ts',
    'types/database.ts',
    'contexts/AuthContext.tsx',
    'app/(auth)/_layout.tsx'
  ];

  keyFiles.forEach(file => {
    if (checkFile(file)) {
      log(`  ✅ ${file}`, 'green');
      passed++;
    } else {
      log(`  ⚠️  ${file} missing`, 'yellow');
      warnings++;
    }
  });

  // 6. Check rule files
  log('\n📋 Rule Documentation:', 'cyan');
  const cursorrules = readFile('.cursorrules');
  const aiInstructions = readFile('AI_AGENT_INSTRUCTIONS.md');
  
  if (cursorrules && cursorrules.includes('monetization')) {
    log('  ✅ .cursorrules contains monetization guidelines', 'green');
    passed++;
  } else {
    log('  ⚠️  .cursorrules may need monetization updates', 'yellow');
    warnings++;
  }

  if (aiInstructions && aiInstructions.includes('AdMob')) {
    log('  ✅ AI instructions include advertising guidelines', 'green');
    passed++;
  } else {
    log('  ⚠️  AI instructions may need advertising details', 'yellow');
    warnings++;
  }

  // Summary
  log('\n📈 Summary:', 'bright');
  const total = passed + failed + warnings;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  log(`  Total checks: ${total}`, 'cyan');
  log(`  Passed: ${passed} (${passRate}%)`, 'green');
  log(`  Failed: ${failed}`, 'red');
  log(`  Warnings: ${warnings}`, 'yellow');

  // Overall assessment
  log('\n🎯 Assessment:', 'bright');
  if (failed === 0) {
    log('✅ Project follows all critical rules!', 'green');
  } else if (failed < 3) {
    log('⚠️  Project mostly follows rules with minor issues', 'yellow');
  } else {
    log('❌ Project needs attention to follow rules', 'red');
  }

  // How to check specific features
  log('\n💡 How to verify rules are being used:', 'bright');
  log('  1. Check .cursorrules file for complete guidelines', 'cyan');
  log('  2. Review AI_AGENT_INSTRUCTIONS.md for detailed specs', 'cyan');
  log('  3. Use: npx expo lint (for code quality)', 'cyan');
  log('  4. Use: npm run type-check (for TypeScript compliance)', 'cyan');
  log('  5. Look for monetization imports in components/', 'cyan');

  return { passed, failed, warnings, total, passRate: parseFloat(passRate) };
}

if (require.main === module) {
  main();
}

module.exports = { main };
