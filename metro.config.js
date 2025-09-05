// Monorepo root: delegate Metro config to the mobile app to avoid confusing project roots
// This ensures `expo start` inside apps/mobile uses its own metro.config.js.
const path = require('path');

try {
  const cwd = process.cwd();
  const mobileDir = path.resolve(__dirname, 'apps/mobile');
  // If the current working directory is the mobile app or a subpath, use its metro config
  if (cwd.startsWith(mobileDir)) {
    // Delegate to the mobile app's Metro config
    module.exports = require('./apps/mobile/metro.config.js');
  } else {
    // Fallback: also delegate to mobile config so Metro always gets a valid config
    module.exports = require('./apps/mobile/metro.config.js');
  }
} catch (e) {
  // Last-resort fallback: export an empty object, Metro will use defaults
  module.exports = {};
}
