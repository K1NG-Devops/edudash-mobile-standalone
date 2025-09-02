/**
 * Locale-aware formatting utilities for dates, numbers, and currency
 * Uses Intl APIs with South African locale conventions
 */

import { LanguageCode, toLocaleTag } from './languages';

type DatePreset = 'short' | 'medium' | 'long' | 'full';
type TimePreset = 'short' | 'medium' | 'long' | 'full';

/**
 * Format a date according to the current locale
 */
export function formatDate(
  date: Date | string | number,
  preset: DatePreset = 'medium',
  locale?: LanguageCode
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: preset
    }).format(d);
  } catch {
    // Fallback for invalid dates
    return d.toLocaleDateString();
  }
}

/**
 * Format a date and time according to the current locale
 */
export function formatDateTime(
  date: Date | string | number,
  datePreset: DatePreset = 'short',
  timePreset: TimePreset = 'short',
  locale?: LanguageCode
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: datePreset,
      timeStyle: timePreset
    }).format(d);
  } catch {
    // Fallback for invalid dates
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
}

/**
 * Format a time according to the current locale
 */
export function formatTime(
  date: Date | string | number,
  preset: TimePreset = 'short',
  locale?: LanguageCode
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.DateTimeFormat(localeTag, {
      timeStyle: preset
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Format a number according to the current locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: LanguageCode
): string {
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.NumberFormat(localeTag, {
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format a percentage according to the current locale
 */
export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: LanguageCode
): string {
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'percent',
      maximumFractionDigits: 0,
      ...options
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(0)}%`;
  }
}

/**
 * Format currency in South African Rand (ZAR)
 */
export function formatCurrencyZAR(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: LanguageCode
): string {
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: 'ZAR',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  } catch {
    // Fallback formatting
    return `R ${value.toFixed(2)}`;
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(
  from: Date | string | number,
  to: Date | string | number = new Date(),
  locale?: LanguageCode
): string {
  const fromDate = typeof from === 'string' || typeof from === 'number' ? new Date(from) : from;
  const toDate = typeof to === 'string' || typeof to === 'number' ? new Date(to) : to;
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  
  const diffMs = fromDate.getTime() - toDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  // Check if Intl.RelativeTimeFormat is available
  if (typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl) {
    try {
      const rtf = new Intl.RelativeTimeFormat(localeTag, { numeric: 'auto' });
      
      if (Math.abs(diffSecs) < 60) {
        return rtf.format(diffSecs, 'second');
      } else if (Math.abs(diffMins) < 60) {
        return rtf.format(diffMins, 'minute');
      } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
      } else if (Math.abs(diffDays) < 7) {
        return rtf.format(diffDays, 'day');
      } else if (Math.abs(diffWeeks) < 4) {
        return rtf.format(diffWeeks, 'week');
      } else if (Math.abs(diffMonths) < 12) {
        return rtf.format(diffMonths, 'month');
      } else {
        return rtf.format(diffYears, 'year');
      }
    } catch {
      // Fall through to manual formatting
    }
  }
  
  // Manual fallback for environments without Intl.RelativeTimeFormat
  const absValue = Math.abs(diffMins);
  const isPast = diffMins < 0;
  
  if (absValue < 1) {
    return isPast ? 'just now' : 'soon';
  } else if (absValue < 60) {
    const mins = Math.abs(diffMins);
    return isPast ? `${mins} minute${mins === 1 ? '' : 's'} ago` : `in ${mins} minute${mins === 1 ? '' : 's'}`;
  } else if (Math.abs(diffHours) < 24) {
    const hours = Math.abs(diffHours);
    return isPast ? `${hours} hour${hours === 1 ? '' : 's'} ago` : `in ${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (Math.abs(diffDays) < 7) {
    const days = Math.abs(diffDays);
    return isPast ? `${days} day${days === 1 ? '' : 's'} ago` : `in ${days} day${days === 1 ? '' : 's'}`;
  } else if (Math.abs(diffWeeks) < 4) {
    const weeks = Math.abs(diffWeeks);
    return isPast ? `${weeks} week${weeks === 1 ? '' : 's'} ago` : `in ${weeks} week${weeks === 1 ? '' : 's'}`;
  } else if (Math.abs(diffMonths) < 12) {
    const months = Math.abs(diffMonths);
    return isPast ? `${months} month${months === 1 ? '' : 's'} ago` : `in ${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.abs(diffYears);
    return isPast ? `${years} year${years === 1 ? '' : 's'} ago` : `in ${years} year${years === 1 ? '' : 's'}`;
  }
}

/**
 * Format a file size in bytes to human-readable format
 */
export function formatFileSize(
  bytes: number,
  locale?: LanguageCode
): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${formatNumber(size, { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }, locale)} ${units[unitIndex]}`;
}

/**
 * Format a duration in seconds to human-readable format
 */
export function formatDuration(
  seconds: number,
  locale?: LanguageCode
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Get month names for the current locale
 */
export function getMonthNames(
  format: 'long' | 'short' = 'long',
  locale?: LanguageCode
): string[] {
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  const formatter = new Intl.DateTimeFormat(localeTag, { month: format });
  
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i, 1);
    return formatter.format(date);
  });
}

/**
 * Get day names for the current locale
 */
export function getDayNames(
  format: 'long' | 'short' | 'narrow' = 'long',
  locale?: LanguageCode
): string[] {
  const localeTag = locale ? toLocaleTag(locale) : 'en-ZA';
  const formatter = new Intl.DateTimeFormat(localeTag, { weekday: format });
  
  // Start with Sunday (0) to Saturday (6)
  return Array.from({ length: 7 }, (_, i) => {
    // Use a date that is definitely a Sunday + i days
    const date = new Date(2024, 0, 7 + i); // Jan 7, 2024 is a Sunday
    return formatter.format(date);
  });
}
