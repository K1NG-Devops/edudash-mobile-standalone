/**
 * Simple date formatting utilities to replace date-fns
 */

export const format = (date: Date, formatString: string): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Simple format string replacements
  let formatted = formatString;
  
  // Date formats
  formatted = formatted.replace('dd', day.toString().padStart(2, '0'));
  formatted = formatted.replace('d', day.toString());
  formatted = formatted.replace('MMM', months[month]);
  formatted = formatted.replace('MMMM', monthsFull[month]);
  formatted = formatted.replace('MM', (month + 1).toString().padStart(2, '0'));
  formatted = formatted.replace('M', (month + 1).toString());
  formatted = formatted.replace('yyyy', year.toString());
  formatted = formatted.replace('yy', year.toString().slice(-2));
  
  // Time formats
  formatted = formatted.replace('HH', hours.toString().padStart(2, '0'));
  formatted = formatted.replace('H', hours.toString());
  formatted = formatted.replace('mm', minutes.toString().padStart(2, '0'));
  formatted = formatted.replace('m', minutes.toString());
  
  return formatted;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return 'Today';
  }
  
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  
  return formatDate(d);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
