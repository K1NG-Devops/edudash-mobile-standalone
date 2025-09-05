/**
 * Language metadata for South African official languages
 * Following BCP-47 language tags with region code ZA
 */

export type LanguageCode = 'en' | 'af' | 'nr' | 'xh' | 'zu' | 'nso' | 'st' | 'tn' | 'ss' | 've' | 'ts';

export interface Language {
  code: LanguageCode;
  bcp47Tag: string;
  displayName: string;
  nativeName: string;
  isRTL: boolean;
  localizedNames?: Partial<Record<LanguageCode, string>>;
}

export const SA_LANGUAGES: Language[] = [
  {
    code: 'en',
    bcp47Tag: 'en-ZA',
    displayName: 'English',
    nativeName: 'English',
    isRTL: false,
    localizedNames: {
      en: 'English',
      af: 'Engels',
      zu: 'IsiNgisi'
    }
  },
  {
    code: 'af',
    bcp47Tag: 'af-ZA',
    displayName: 'Afrikaans',
    nativeName: 'Afrikaans',
    isRTL: false,
    localizedNames: {
      en: 'Afrikaans',
      af: 'Afrikaans',
      zu: 'IsiBhunu'
    }
  },
  {
    code: 'zu',
    bcp47Tag: 'zu-ZA',
    displayName: 'isiZulu',
    nativeName: 'isiZulu',
    isRTL: false,
    localizedNames: {
      en: 'Zulu',
      af: 'Zoeloe',
      zu: 'isiZulu'
    }
  },
  {
    code: 'xh',
    bcp47Tag: 'xh-ZA',
    displayName: 'isiXhosa',
    nativeName: 'isiXhosa',
    isRTL: false,
    localizedNames: {
      en: 'Xhosa',
      af: 'Xhosa',
      zu: 'isiXhosa'
    }
  },
  {
    code: 'st',
    bcp47Tag: 'st-ZA',
    displayName: 'Sesotho',
    nativeName: 'Sesotho',
    isRTL: false,
    localizedNames: {
      en: 'Southern Sotho',
      af: 'Suid-Sotho',
      zu: 'isiSuthu'
    }
  },
  {
    code: 'tn',
    bcp47Tag: 'tn-ZA',
    displayName: 'Setswana',
    nativeName: 'Setswana',
    isRTL: false,
    localizedNames: {
      en: 'Tswana',
      af: 'Tswana',
      zu: 'isiTswana'
    }
  },
  {
    code: 'nso',
    bcp47Tag: 'nso-ZA',
    displayName: 'Sepedi',
    nativeName: 'Sepedi',
    isRTL: false,
    localizedNames: {
      en: 'Northern Sotho',
      af: 'Noord-Sotho',
      zu: 'isiPedi'
    }
  },
  {
    code: 'nr',
    bcp47Tag: 'nr-ZA',
    displayName: 'isiNdebele',
    nativeName: 'isiNdebele',
    isRTL: false,
    localizedNames: {
      en: 'Southern Ndebele',
      af: 'Suid-Ndebele',
      zu: 'isiNdebele'
    }
  },
  {
    code: 'ss',
    bcp47Tag: 'ss-ZA',
    displayName: 'siSwati',
    nativeName: 'siSwati',
    isRTL: false,
    localizedNames: {
      en: 'Swati',
      af: 'Swazi',
      zu: 'isiSwati'
    }
  },
  {
    code: 've',
    bcp47Tag: 've-ZA',
    displayName: 'Tshivenda',
    nativeName: 'Tshivenḓa',
    isRTL: false,
    localizedNames: {
      en: 'Venda',
      af: 'Venda',
      zu: 'isiVenda'
    }
  },
  {
    code: 'ts',
    bcp47Tag: 'ts-ZA',
    displayName: 'Xitsonga',
    nativeName: 'Xitsonga',
    isRTL: false,
    localizedNames: {
      en: 'Tsonga',
      af: 'Tsonga',
      zu: 'isiTsonga'
    }
  }
];

/**
 * Get language metadata by code
 */
export function getLanguage(code: LanguageCode): Language | undefined {
  return SA_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Convert a language code to BCP-47 locale tag
 * @param code Language code (e.g., 'en')
 * @returns BCP-47 tag (e.g., 'en-ZA')
 */
export function toLocaleTag(code: LanguageCode): string {
  const lang = getLanguage(code);
  return lang?.bcp47Tag || 'en-ZA';
}

/**
 * Normalize a locale string to a supported language code
 * @param locale Locale string (e.g., 'en-US', 'en_ZA', 'zu')
 * @returns Supported language code or 'en' as fallback
 */
export function toSupportedLang(locale: string): LanguageCode {
  if (!locale) return 'en';
  
  // Extract the language part (before - or _)
  const langPart = locale.toLowerCase().split(/[-_]/)[0];
  
  // Direct match
  if (SA_LANGUAGES.some(lang => lang.code === langPart)) {
    return langPart as LanguageCode;
  }
  
  // Check for special cases
  const specialMappings: Record<string, LanguageCode> = {
    'eng': 'en',
    'afr': 'af',
    'zul': 'zu',
    'xho': 'xh',
    'sot': 'st',
    'tsn': 'tn',
    'nbl': 'nr',
    'ssw': 'ss',
    'ven': 've',
    'tso': 'ts'
  };
  
  if (specialMappings[langPart]) {
    return specialMappings[langPart];
  }
  
  // Default fallback
  return 'en';
}

/**
 * Check if a language is RTL
 */
export function isRTL(code: LanguageCode): boolean {
  const lang = getLanguage(code);
  return lang?.isRTL || false;
}

/**
 * Get display name for a language in the current UI language
 */
export function getLocalizedName(code: LanguageCode, uiLang: LanguageCode): string {
  const lang = getLanguage(code);
  if (!lang) return code.toUpperCase();
  
  // Return localized name if available for current UI language
  if (lang.localizedNames && lang.localizedNames[uiLang]) {
    return lang.localizedNames[uiLang] as string;
  }
  
  // Fall back to native name
  return lang.nativeName;
}
