/**
 * TypeScript types for i18n translations
 * Auto-generated from en.json structure
 */

import 'react-i18next';
import type en from '../locales/en.json';

// Define the resources type based on the English translations
type Resources = {
  translation: typeof en;
};

// Augment the react-i18next module
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: Resources;
    returnNull: false;
  }
}

// Export translation key type for use in components
export type TranslationKey = keyof typeof en | 
  `common.${keyof typeof en.common}` |
  `nav.${keyof typeof en.nav}` |
  `auth.${keyof typeof en.auth}` |
  `settings.${keyof typeof en.settings}` |
  `settings.formats.${keyof typeof en.settings.formats}` |
  `errors.${keyof typeof en.errors}` |
  `accessibility.${keyof typeof en.accessibility}` |
  `roles.${keyof typeof en.roles}` |
  `dashboard.${keyof typeof en.dashboard}` |
  `education.${keyof typeof en.education}`;
