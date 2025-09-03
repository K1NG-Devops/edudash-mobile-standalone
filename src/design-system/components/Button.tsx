/**
 * Button Component
 * Consistent button styles with variants using CVA and NativeWind
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTheme } from '@/contexts/ThemeContext';

// Button variants configuration
const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg transition-all',
  {
    variants: {
      variant: {
        solid: 'bg-primary active:bg-primary-hover',
        outline: 'border-2 border-primary bg-transparent',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive active:bg-destructive-hover',
        secondary: 'bg-secondary active:bg-secondary-hover',
      },
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
        lg: 'px-6 py-3',
        xl: 'px-8 py-4',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      disabled: {
        true: 'opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
      fullWidth: false,
      disabled: false,
    },
  }
);

const buttonTextVariants = cva(
  'text-center font-semibold',
  {
    variants: {
      variant: {
        solid: 'text-primary-foreground',
        outline: 'text-primary',
        ghost: 'text-foreground',
        destructive: 'text-destructive-foreground',
        secondary: 'text-secondary-foreground',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  }
);

export interface ButtonProps 
  extends Omit<TouchableOpacityProps, 'disabled'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  text?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ 
    children,
    text,
    variant,
    size,
    fullWidth,
    disabled,
    loading,
    leftIcon,
    rightIcon,
    className,
    style,
    onPress,
    ...props 
  }, ref) => {
    const { theme } = useTheme();
    const isDisabled = disabled || loading;

    // Get the appropriate colors based on variant
    const getLoadingColor = () => {
      switch (variant) {
        case 'outline':
        case 'ghost':
          return theme.colors.primary;
        case 'destructive':
          return theme.colors.error;
        case 'secondary':
          return theme.colors.secondary;
        default:
          return theme.colors.primary;
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        className={buttonVariants({ variant, size, fullWidth, disabled: isDisabled, className })}
        style={style}
        disabled={isDisabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator 
            size={size === 'sm' ? 'small' : 'small'} 
            color={getLoadingColor()} 
          />
        ) : (
          <>
            {leftIcon && (
              <View className="mr-2">
                {leftIcon}
              </View>
            )}
            {text ? (
              <Text className={buttonTextVariants({ variant, size })}>
                {text}
              </Text>
            ) : children}
            {rightIcon && (
              <View className="ml-2">
                {rightIcon}
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

// Icon Button variant for icon-only buttons
export interface IconButtonProps extends Omit<ButtonProps, 'text' | 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  label?: string; // For accessibility
}

export const IconButton = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, IconButtonProps>(
  ({ icon, label, size = 'md', ...props }, ref) => {
    const padding = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
      xl: 'p-4',
    };

    return (
      <Button
        ref={ref}
        {...props}
        size={size}
        className={padding[size || 'md']}
        accessibilityLabel={label}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
