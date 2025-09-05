/**
 * Root i18n re-export for better alias resolution
 */

// Re-export all named exports (explicit index to avoid folder resolution issues in some environments)
export {
  initI18n,
  changeAppLanguage,
  reloadApp,
  useT,
  getCurrentLanguage,
  getCurrentLocaleTag,
  isI18nReady
} from './src/i18n/index';

// Re-export the default export
export { default as i18n } from './src/i18n/index';
export { default } from './src/i18n/index';
