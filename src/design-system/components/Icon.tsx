/**
 * Icon Component
 * Wrapper for lucide-react-native icons with consistent sizing and colors
 */

import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
// Use DOM-based lucide icons on web to avoid react-native-svg issues
 
const LucideWeb: Record<string, any> | null = Platform.OS === 'web' ? require('lucide-react') : null;
import { useTheme } from '../theme/ThemeProvider';

export interface IconProps extends ViewProps {
  name: keyof typeof LucideIcons;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  strokeWidth?: number;
}

// Size mapping
const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  color,
  strokeWidth = 2,
  className,
  style,
  ...props 
}) => {
  const { colors } = useTheme();
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  const iconColor = color || colors.foreground;

  if (Platform.OS === 'web' && LucideWeb) {
    const WebIcon = (LucideWeb as any)[name];
    if (!WebIcon) {
      console.warn(`Icon "${name}" not found in lucide-react (web)`);
      return null;
    }
    return (
      <View className={className} style={style} {...props}>
        <WebIcon size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
      </View>
    );
  }

  // eslint-disable-next-line import/namespace
  const IconComponent = LucideIcons[name] as React.ComponentType<any>;
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react-native`);
    return null;
  }
  return (
    <View className={className} style={style} {...props}>
      <IconComponent size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
    </View>
  );
};

Icon.displayName = 'Icon';

// Common icon presets for consistency
export const Icons = {
  // Navigation
  back: 'ChevronLeft' as const,
  forward: 'ChevronRight' as const,
  up: 'ChevronUp' as const,
  down: 'ChevronDown' as const,
  menu: 'Menu' as const,
  close: 'X' as const,
  
  // Actions
  add: 'Plus' as const,
  edit: 'Edit' as const,
  delete: 'Trash2' as const,
  save: 'Save' as const,
  search: 'Search' as const,
  filter: 'Filter' as const,
  sort: 'ArrowUpDown' as const,
  refresh: 'RefreshCw' as const,
  
  // Status
  success: 'CheckCircle' as const,
  error: 'XCircle' as const,
  warning: 'AlertTriangle' as const,
  info: 'Info' as const,
  
  // User
  user: 'User' as const,
  users: 'Users' as const,
  profile: 'UserCircle' as const,
  settings: 'Settings' as const,
  logout: 'LogOut' as const,
  
  // Dashboard specific
  dashboard: 'LayoutDashboard' as const,
  student: 'GraduationCap' as const,
  teacher: 'BookOpen' as const,
  parent: 'Home' as const,
  admin: 'Shield' as const,
  
  // Communication
  message: 'MessageSquare' as const,
  notification: 'Bell' as const,
  email: 'Mail' as const,
  phone: 'Phone' as const,
  
  // Files
  file: 'File' as const,
  folder: 'Folder' as const,
  download: 'Download' as const,
  upload: 'Upload' as const,
  
  // Calendar
  calendar: 'Calendar' as const,
  clock: 'Clock' as const,
  
  // Education
  book: 'Book' as const,
  homework: 'FileText' as const,
  attendance: 'UserCheck' as const,
  grade: 'Award' as const,
  
  // Theme
  sun: 'Sun' as const,
  moon: 'Moon' as const,
  system: 'Monitor' as const,
} as const;

// Individual icon imports should be done directly from 'lucide-react-native' if needed
