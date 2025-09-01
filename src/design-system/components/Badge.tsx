/**
 * Badge Component
 * Small status indicators with variants
 */

import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTheme } from '../theme/ThemeProvider';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        warning: 'bg-warning',
        destructive: 'bg-destructive',
        outline: 'border border-border bg-transparent',
        ghost: 'bg-background-element',
      },
      size: {
        sm: 'px-2 py-0.5',
        md: 'px-2.5 py-1',
        lg: 'px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const badgeTextVariants = cva(
  'font-medium',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        secondary: 'text-secondary-foreground',
        success: 'text-success-foreground',
        warning: 'text-warning-foreground',
        destructive: 'text-destructive-foreground',
        outline: 'text-foreground',
        ghost: 'text-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps 
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  text?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children,
  text,
  variant,
  size,
  className,
  style,
  ...props 
}) => {
  // Check if children is a string or number (primitive that needs Text wrapper)
  const needsTextWrapper = typeof children === 'string' || typeof children === 'number';
  
  return (
    <View 
      className={badgeVariants({ variant, size, className })}
      style={style}
      {...props}
    >
      {text ? (
        <Text className={badgeTextVariants({ variant, size })}>
          {text}
        </Text>
      ) : needsTextWrapper ? (
        <Text className={badgeTextVariants({ variant, size })}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

Badge.displayName = 'Badge';

// Notification Badge for showing counts
export interface NotificationBadgeProps extends Omit<BadgeProps, 'children' | 'text'> {
  count: number;
  max?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count,
  max = 99,
  ...props 
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  if (count <= 0) return null;
  
  return (
    <Badge {...props} text={displayCount} />
  );
};

NotificationBadge.displayName = 'NotificationBadge';

// Status Badge for showing status
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status,
  ...props 
}) => {
  const statusConfig = {
    active: { variant: 'success' as const, text: 'Active' },
    inactive: { variant: 'ghost' as const, text: 'Inactive' },
    pending: { variant: 'warning' as const, text: 'Pending' },
    success: { variant: 'success' as const, text: 'Success' },
    error: { variant: 'destructive' as const, text: 'Error' },
    warning: { variant: 'warning' as const, text: 'Warning' },
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} text={config.text} {...props} />
  );
};

StatusBadge.displayName = 'StatusBadge';
