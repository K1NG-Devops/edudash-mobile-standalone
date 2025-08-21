const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing EduDash Pro cache...');

const cachePaths = [
  '.expo',
  'node_modules/.cache',
  '.next',
  'web-build'
];

cachePaths.forEach(cachePath => {
  const fullPath = path.join(__dirname, cachePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleared: ${cachePath}`);
    } catch (error) {
      console.log(`⚠️  Could not clear ${cachePath}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  Path not found: ${cachePath}`);
  }
});

console.log('🎉 Cache clearing complete!');
