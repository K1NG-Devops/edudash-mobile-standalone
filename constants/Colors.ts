/**
 * Modern color palette for EduDash Pro mobile app
 * Designed for accessibility, readability, and visual appeal
 */

// Primary brand colors
const primaryBlue = '#6366F1'; // Indigo-500
const primaryPurple = '#8B5CF6'; // Violet-500
const primaryTeal = '#10B981'; // Emerald-500

// Role-based accent colors
const superAdminColor = '#DC2626'; // Red-600
const principalColor = '#059669'; // Emerald-600  
const teacherColor = '#7C3AED'; // Violet-600
const parentColor = '#2563EB'; // Blue-600

// Neutral colors
const textPrimary = '#111827'; // Gray-900
const textSecondary = '#6B7280'; // Gray-500
const textTertiary = '#9CA3AF'; // Gray-400

export const Colors = {
  light: {
    // Primary text and background
    text: textPrimary,
    background: '#FFFFFF',

    // Tab bar colors
    tint: primaryBlue,
    icon: textSecondary,
    tabIconDefault: textSecondary,
    tabIconSelected: primaryBlue,

    // Additional theme colors
    primary: primaryBlue,
    secondary: primaryPurple,
    success: primaryTeal,
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500

    // Surface colors
    surface: '#F8FAFC', // Gray-50
    surfaceVariant: '#F1F5F9', // Gray-100
    outline: '#E5E7EB', // Gray-200

    // Role colors
    superadmin: superAdminColor,
    preschool_admin: principalColor,
    principal: principalColor,
    teacher: teacherColor,
    parent: parentColor,
  },
  dark: {
    // Primary text and background  
    text: '#F9FAFB', // Gray-50
    background: '#111827', // Gray-900

    // Tab bar colors
    tint: '#818CF8', // Indigo-400
    icon: '#9CA3AF', // Gray-400
    tabIconDefault: '#6B7280', // Gray-500
    tabIconSelected: '#818CF8', // Indigo-400

    // Additional theme colors
    primary: '#818CF8', // Indigo-400
    secondary: '#A78BFA', // Violet-400
    success: '#34D399', // Emerald-400
    warning: '#FBBF24', // Amber-400
    error: '#F87171', // Red-400

    // Surface colors
    surface: '#1F2937', // Gray-800
    surfaceVariant: '#374151', // Gray-700
    outline: '#4B5563', // Gray-600

    // Role colors
    superadmin: '#F87171', // Red-400
    preschool_admin: '#34D399', // Emerald-400
    principal: '#34D399', // Emerald-400
    teacher: '#A78BFA', // Violet-400
    parent: '#60A5FA', // Blue-400
  },
};

// Helper function to get role-specific colors
export const getRoleColors = (role: string, theme: 'light' | 'dark' = 'light') => {
  const colors = Colors[theme];

  switch (role) {
    case 'superadmin':
      return {
        primary: colors.superadmin,
        gradient: theme === 'light'
          ? ['#DC2626', '#B91C1C']
          : ['#F87171', '#EF4444'],
        background: theme === 'light'
          ? 'rgba(220, 38, 38, 0.1)'
          : 'rgba(248, 113, 113, 0.1)',
      };
    case 'preschool_admin':
    case 'principal':
      // Softer, trustworthy principal theme (emerald/teal blend)
      return {
        primary: '#10B981',
        gradient: theme === 'light'
          ? ['#10B981', '#059669']
          : ['#34D399', '#10B981'],
        background: theme === 'light'
          ? 'rgba(16, 185, 129, 0.10)'
          : 'rgba(52, 211, 153, 0.10)',
      };
    case 'teacher':
      return {
        primary: colors.teacher,
        gradient: theme === 'light'
          ? ['#7C3AED', '#6D28D9']
          : ['#A78BFA', '#8B5CF6'],
        background: theme === 'light'
          ? 'rgba(124, 58, 237, 0.1)'
          : 'rgba(167, 139, 250, 0.1)',
      };
    case 'parent':
      return {
        primary: colors.parent,
        gradient: theme === 'light'
          ? ['#2563EB', '#1D4ED8']
          : ['#60A5FA', '#3B82F6'],
        background: theme === 'light'
          ? 'rgba(37, 99, 235, 0.1)'
          : 'rgba(96, 165, 250, 0.1)',
      };
    default:
      return {
        primary: colors.primary,
        gradient: theme === 'light'
          ? ['#6366F1', '#4F46E5']
          : ['#818CF8', '#6366F1'],
        background: theme === 'light'
          ? 'rgba(99, 102, 241, 0.1)'
          : 'rgba(129, 140, 248, 0.1)',
      };
  }
};
