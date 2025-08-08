#!/usr/bin/env node

/**
 * EduDash Pro - Project Rules Validation Script
 * 
 * This script validates that the project follows all the rules specified in:
 * - AI_AGENT_INSTRUCTIONS.md
 * - .cursorrules
 * 
 * It checks for:
 * - TypeScript strict mode usage
 * - Monetization features implementation
 * - Mobile-first architecture
 * - SaaS business model integration
 * - Security and multi-tenancy
 * - Performance optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const projectRoot = process.cwd();

// Validation results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(type, category, message, details = null) {
  const result = { category, message, details };
  results[type].push(result);
  
  const colorMap = { passed: 'green', failed: 'red', warnings: 'yellow' };
  log(`${type.toUpperCase()}: ${message}`, colorMap[type]);
  if (details) log(`  Details: ${details}`, 'cyan');
}

// Helper function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath));
}

// Helper function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

// Helper function to search for pattern in files
function searchInFiles(directory, extensions, pattern, description) {
  try {
    const cmd = `find ${directory} -type f \\( ${extensions.map(ext => `-name "*.${ext}"`).join(' -o ')} \\) -exec grep -l '${pattern}' {} \\; 2>/dev/null`;
    const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    return [];
  }
}

// Helper function to count lines in TypeScript files
function countTypeScriptLines() {
  try {
    const cmd = `find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | tail -1`;
    const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    return parseInt(output.trim().split(' ')[0]) || 0;
  } catch (error) {
    return 0;
  }
}

// Validation functions
function validateProjectStructure() {
  log('\n=== Validating Project Structure ===', 'bright');
  
  const requiredDirectories = [
    'app', 'components', 'lib', 'types', 'constants', 'assets'
  ];
  
  const requiredFiles = [
    'package.json', 'tsconfig.json', '.cursorrules', 'AI_AGENT_INSTRUCTIONS.md'
  ];
  
  requiredDirectories.forEach(dir => {
    if (fileExists(dir)) {
      addResult('passed', 'structure', `Required directory exists: ${dir}`);
    } else {
      addResult('failed', 'structure', `Missing required directory: ${dir}`);
    }
  });
  
  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      addResult('passed', 'structure', `Required file exists: ${file}`);
    } else {
      addResult('failed', 'structure', `Missing required file: ${file}`);
    }
  });
}

function validateTypeScriptConfiguration() {
  log('\n=== Validating TypeScript Configuration ===', 'bright');
  
  const tsConfig = readFile('tsconfig.json');
  if (!tsConfig) {
    addResult('failed', 'typescript', 'tsconfig.json not found');
    return;
  }
  
  try {
    const config = JSON.parse(tsConfig);
    
    if (config.compilerOptions?.strict === true) {
      addResult('passed', 'typescript', 'Strict mode enabled');
    } else {
      addResult('failed', 'typescript', 'Strict mode not enabled');
    }
    
    if (config.compilerOptions?.allowJs === false) {
      addResult('passed', 'typescript', 'JavaScript files disabled (TypeScript-only)');
    } else {
      addResult('warnings', 'typescript', 'JavaScript files allowed (consider TypeScript-only)');
    }
    
    if (config.compilerOptions?.paths) {
      addResult('passed', 'typescript', 'Path mapping configured');
    } else {
      addResult('warnings', 'typescript', 'Path mapping not configured');
    }
    
  } catch (error) {
    addResult('failed', 'typescript', 'Invalid tsconfig.json format');
  }
}

function validateMobileFirstArchitecture() {
  log('\n=== Validating Mobile-First Architecture ===', 'bright');
  
  // Check for Expo Router usage
  const expoRouterFiles = searchInFiles('.', ['ts', 'tsx'], 'expo-router', 'Expo Router usage');
  if (expoRouterFiles.length > 0) {
    addResult('passed', 'mobile', `Expo Router found in ${expoRouterFiles.length} files`);
  } else {
    addResult('warnings', 'mobile', 'Expo Router usage not detected');
  }
  
  // Check for FlashList usage
  const flashListFiles = searchInFiles('.', ['ts', 'tsx'], '@shopify/flash-list', 'FlashList usage');
  if (flashListFiles.length > 0) {
    addResult('passed', 'mobile', `FlashList found in ${flashListFiles.length} files`);
  } else {
    addResult('warnings', 'mobile', 'FlashList usage not detected (performance optimization)');
  }
  
  // Check for SecureStore usage
  const secureStoreFiles = searchInFiles('.', ['ts', 'tsx'], 'expo-secure-store', 'SecureStore usage');
  if (secureStoreFiles.length > 0) {
    addResult('passed', 'mobile', `Expo SecureStore found in ${secureStoreFiles.length} files`);
  } else {
    addResult('warnings', 'mobile', 'Expo SecureStore usage not detected');
  }
  
  // Check for responsive design patterns
  const responsiveFiles = searchInFiles('.', ['ts', 'tsx'], 'useWindowDimensions\\|Dimensions', 'Responsive design');
  if (responsiveFiles.length > 0) {
    addResult('passed', 'mobile', `Responsive design patterns found in ${responsiveFiles.length} files`);
  } else {
    addResult('warnings', 'mobile', 'Responsive design patterns not detected');
  }
}

function validateMonetizationFeatures() {
  log('\n=== Validating Monetization Features ===', 'bright');
  
  // Check for subscription tier handling
  const subscriptionFiles = searchInFiles('.', ['ts', 'tsx'], 'subscription_tier\\|freemium\\|premium', 'Subscription tiers');
  if (subscriptionFiles.length > 0) {
    addResult('passed', 'monetization', `Subscription tier logic found in ${subscriptionFiles.length} files`);
  } else {
    addResult('failed', 'monetization', 'Subscription tier logic not implemented');
  }
  
  // Check for AdMob/advertising integration
  const adFiles = searchInFiles('.', ['ts', 'tsx'], 'react-native-google-mobile-ads\\|BannerAd\\|AdMob', 'Ad integration');
  if (adFiles.length > 0) {
    addResult('passed', 'monetization', `Ad integration found in ${adFiles.length} files`);
  } else {
    addResult('warnings', 'monetization', 'Ad integration not implemented yet');
  }
  
  // Check for AI usage tracking
  const aiTrackingFiles = searchInFiles('.', ['ts', 'tsx'], 'ai_usage\\|trackAIUsage\\|usage_count', 'AI usage tracking');
  if (aiTrackingFiles.length > 0) {
    addResult('passed', 'monetization', `AI usage tracking found in ${aiTrackingFiles.length} files`);
  } else {
    addResult('warnings', 'monetization', 'AI usage tracking not implemented yet');
  }
  
  // Check for push notification setup
  const pushNotificationFiles = searchInFiles('.', ['ts', 'tsx'], 'expo-notifications\\|OneSignal\\|push.*notification', 'Push notifications');
  if (pushNotificationFiles.length > 0) {
    addResult('passed', 'monetization', `Push notifications found in ${pushNotificationFiles.length} files`);
  } else {
    addResult('warnings', 'monetization', 'Push notifications not implemented yet');
  }
}

function validateSupabaseIntegration() {
  log('\n=== Validating Supabase Integration ===', 'bright');
  
  // Check for Supabase client setup
  if (fileExists('lib/supabase.ts')) {
    addResult('passed', 'supabase', 'Supabase client configuration exists');
    
    const supabaseContent = readFile('lib/supabase.ts');
    if (supabaseContent?.includes('SecureStore')) {
      addResult('passed', 'supabase', 'SecureStore integration in Supabase client');
    } else {
      addResult('warnings', 'supabase', 'SecureStore not integrated with Supabase client');
    }
  } else {
    addResult('failed', 'supabase', 'Supabase client configuration missing');
  }
  
  // Check for RLS policy awareness
  const rlsFiles = searchInFiles('.', ['ts', 'tsx'], '\\.rls\\|Row Level Security\\|tenant_id\\|preschool_id', 'RLS awareness');
  if (rlsFiles.length > 0) {
    addResult('passed', 'supabase', `RLS-aware code found in ${rlsFiles.length} files`);
  } else {
    addResult('warnings', 'supabase', 'RLS-aware code patterns not detected');
  }
  
  // Check for database types usage
  const dbTypesFiles = searchInFiles('.', ['ts', 'tsx'], 'Database\\[.*\\]\\[.*\\]\\[.*\\]', 'Database types');
  if (dbTypesFiles.length > 0) {
    addResult('passed', 'supabase', `Generated database types used in ${dbTypesFiles.length} files`);
  } else {
    addResult('warnings', 'supabase', 'Generated database types usage not detected');
  }
}

function validateSecurityMeasures() {
  log('\n=== Validating Security Measures ===', 'bright');
  
  // Check for environment variable usage
  const envFiles = searchInFiles('.', ['ts', 'tsx'], 'process\\.env\\|EXPO_PUBLIC_', 'Environment variables');
  if (envFiles.length > 0) {
    addResult('passed', 'security', `Environment variables used in ${envFiles.length} files`);
  } else {
    addResult('warnings', 'security', 'Environment variable usage not detected');
  }
  
  // Check for authentication handling
  const authFiles = searchInFiles('.', ['ts', 'tsx'], 'supabase\\.auth\\|useAuth\\|AuthContext', 'Authentication');
  if (authFiles.length > 0) {
    addResult('passed', 'security', `Authentication handling found in ${authFiles.length} files`);
  } else {
    addResult('failed', 'security', 'Authentication handling not detected');
  }
  
  // Check for error boundaries
  const errorBoundaryFiles = searchInFiles('.', ['ts', 'tsx'], 'ErrorBoundary\\|componentDidCatch', 'Error boundaries');
  if (errorBoundaryFiles.length > 0) {
    addResult('passed', 'security', `Error boundaries found in ${errorBoundaryFiles.length} files`);
  } else {
    addResult('warnings', 'security', 'Error boundaries not implemented');
  }
}

function validatePerformanceOptimizations() {
  log('\n=== Validating Performance Optimizations ===', 'bright');
  
  // Check for React.memo usage
  const memoFiles = searchInFiles('.', ['ts', 'tsx'], 'React\\.memo\\|memo\\(', 'React.memo');
  if (memoFiles.length > 0) {
    addResult('passed', 'performance', `React.memo found in ${memoFiles.length} files`);
  } else {
    addResult('warnings', 'performance', 'React.memo usage not detected');
  }
  
  // Check for lazy loading
  const lazyFiles = searchInFiles('.', ['ts', 'tsx'], 'React\\.lazy\\|lazy\\(', 'Lazy loading');
  if (lazyFiles.length > 0) {
    addResult('passed', 'performance', `Lazy loading found in ${lazyFiles.length} files`);
  } else {
    addResult('warnings', 'performance', 'Lazy loading not detected');
  }
  
  // Check for expo-image usage
  const expoImageFiles = searchInFiles('.', ['ts', 'tsx'], 'expo-image', 'Expo Image');
  if (expoImageFiles.length > 0) {
    addResult('passed', 'performance', `Expo Image found in ${expoImageFiles.length} files`);
  } else {
    addResult('warnings', 'performance', 'Expo Image not used (performance optimization)');
  }
  
  // Check for caching strategies
  const cachingFiles = searchInFiles('.', ['ts', 'tsx'], 'cache\\|AsyncStorage\\|SecureStore', 'Caching');
  if (cachingFiles.length > 0) {
    addResult('passed', 'performance', `Caching strategies found in ${cachingFiles.length} files`);
  } else {
    addResult('warnings', 'performance', 'Caching strategies not detected');
  }
}

function validateAIIntegration() {
  log('\n=== Validating AI Integration ===', 'bright');
  
  // Check for Anthropic Claude integration
  const anthropicFiles = searchInFiles('.', ['ts', 'tsx'], '@anthropic-ai\\|claude\\|Anthropic', 'Anthropic integration');
  if (anthropicFiles.length > 0) {
    addResult('passed', 'ai', `Anthropic Claude integration found in ${anthropicFiles.length} files`);
  } else {
    addResult('warnings', 'ai', 'Anthropic Claude integration not detected');
  }
  
  // Check for educational content generation
  const lessonFiles = searchInFiles('.', ['ts', 'tsx'], 'lesson.*plan\\|generate.*lesson\\|STEM.*activity', 'Educational content generation');
  if (lessonFiles.length > 0) {
    addResult('passed', 'ai', `Educational content generation found in ${lessonFiles.length} files`);
  } else {
    addResult('warnings', 'ai', 'Educational content generation not implemented yet');
  }
  
  // Check for homework grading
  const gradingFiles = searchInFiles('.', ['ts', 'tsx'], 'grade.*homework\\|homework.*grading', 'Homework grading');
  if (gradingFiles.length > 0) {
    addResult('passed', 'ai', `Homework grading found in ${gradingFiles.length} files`);
  } else {
    addResult('warnings', 'ai', 'Homework grading not implemented yet');
  }
}

function validatePackageConfiguration() {
  log('\n=== Validating Package Configuration ===', 'bright');
  
  const packageJson = readFile('package.json');
  if (!packageJson) {
    addResult('failed', 'packages', 'package.json not found');
    return;
  }
  
  try {
    const pkg = JSON.parse(packageJson);
    
    // Check for required dependencies
    const requiredDeps = [
      '@supabase/supabase-js',
      '@anthropic-ai/sdk',
      'expo-router',
      'expo-secure-store',
      'react-native'
    ];
    
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        addResult('passed', 'packages', `Required dependency installed: ${dep}`);
      } else {
        addResult('warnings', 'packages', `Missing recommended dependency: ${dep}`);
      }
    });
    
    // Check for performance-related packages
    const performanceDeps = [
      '@shopify/flash-list',
      'expo-image',
      'react-native-reanimated'
    ];
    
    performanceDeps.forEach(dep => {
      if (dependencies[dep]) {
        addResult('passed', 'packages', `Performance dependency installed: ${dep}`);
      } else {
        addResult('warnings', 'packages', `Missing performance dependency: ${dep}`);
      }
    });
    
    // Check for monetization packages
    const monetizationDeps = [
      'react-native-google-mobile-ads',
      'expo-notifications'
    ];
    
    monetizationDeps.forEach(dep => {
      if (dependencies[dep]) {
        addResult('passed', 'packages', `Monetization dependency installed: ${dep}`);
      } else {
        addResult('warnings', 'packages', `Missing monetization dependency: ${dep} (for future implementation)`);
      }
    });
    
  } catch (error) {
    addResult('failed', 'packages', 'Invalid package.json format');
  }
}

function generateReport() {
  log('\n=== VALIDATION REPORT ===', 'bright');
  
  const totalChecks = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = ((results.passed.length / totalChecks) * 100).toFixed(1);
  
  log(`\nTotal Checks: ${totalChecks}`, 'cyan');
  log(`Passed: ${results.passed.length} (${passRate}%)`, 'green');
  log(`Failed: ${results.failed.length}`, 'red');
  log(`Warnings: ${results.warnings.length}`, 'yellow');
  
  if (results.failed.length > 0) {
    log('\n=== CRITICAL ISSUES TO FIX ===', 'red');
    results.failed.forEach((result, index) => {
      log(`${index + 1}. [${result.category.toUpperCase()}] ${result.message}`, 'red');
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n=== RECOMMENDATIONS ===', 'yellow');
    results.warnings.forEach((result, index) => {
      log(`${index + 1}. [${result.category.toUpperCase()}] ${result.message}`, 'yellow');
    });
  }
  
  // TypeScript code statistics
  const tsLines = countTypeScriptLines();
  log(`\n=== PROJECT STATISTICS ===`, 'cyan');
  log(`TypeScript/TSX lines: ${tsLines}`, 'cyan');
  
  // Overall assessment
  log('\n=== OVERALL ASSESSMENT ===', 'bright');
  if (results.failed.length === 0) {
    log('✅ Project follows all critical rules!', 'green');
  } else if (results.failed.length < 5) {
    log('⚠️  Project mostly follows rules with some issues to fix.', 'yellow');
  } else {
    log('❌ Project needs significant improvements to follow rules.', 'red');
  }
  
  return {
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    passRate: parseFloat(passRate),
    totalLines: tsLines
  };
}

// Main execution
function main() {
  log('🔍 EduDash Pro - Project Rules Validation', 'bright');
  log('==========================================', 'bright');
  
  validateProjectStructure();
  validateTypeScriptConfiguration();
  validateMobileFirstArchitecture();
  validateMonetizationFeatures();
  validateSupabaseIntegration();
  validateSecurityMeasures();
  validatePerformanceOptimizations();
  validateAIIntegration();
  validatePackageConfiguration();
  
  const report = generateReport();
  
  // Save report to file
  const reportFile = path.join(projectRoot, 'PROJECT_VALIDATION_REPORT.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: report,
    details: results
  }, null, 2));
  
  log(`\n📝 Detailed report saved to: PROJECT_VALIDATION_REPORT.json`, 'cyan');
  
  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { main, validateProjectStructure, validateTypeScriptConfiguration };
