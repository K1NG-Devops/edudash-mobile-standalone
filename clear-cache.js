const fs = require('fs');
const path = require('path');


const cachePaths = [
  '.expo',
  'node_modules/.cache',
  '.next',
  'web-build'
];

cachePaths.forEach(cachePath => {
  const fullPath = path.resolve(process.cwd(), cachePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
    }
  } else {
  }
});

