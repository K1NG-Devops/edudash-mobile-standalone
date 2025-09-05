/**
 * Input Component
 * Consistent text input with variants and states
 */

import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const inputContainerVariants = cva(
  'flex-row items-center rounded-lg border',
  {
    variants: {
      variant: {
        default: 'border-border bg-background',
        filled: 'border-transparent bg-background-element',
        ghost: 'border-transparent bg-transparent',
      },
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
        lg: 'px-5 py-3',
      },
      state: {
        default: '',
        error: 'border-destructive',
        success: 'border-success',
        focused: 'border-primary',
      },
      disabled: {
        true: 'bg-background-subtle opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      disabled: false,
    },
  }
);

const inputTextVariants = cva(
  'flex-1',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface InputProps 
  extends Omit<TextInputProps, 'editable'>,
    VariantProps<typeof inputContainerVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'text' | 'password' | 'email' | 'number';
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ 
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    type = 'text',
    variant,
    size,
    state: stateProp,
    disabled,
    containerClassName,
    className,
    style,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Determine the current state
    const state = error ? 'error' : stateProp || (isFocused ? 'focused' : 'default');

    // Handle password visibility toggle
    const isPassword = type === 'password';
    const shouldObscure = isPassword && !showPassword;

    // Get keyboard type based on input type
    const getKeyboardType = () => {
      switch (type) {
        case 'email':
          return 'email-address';
        case 'number':
          return 'numeric';
        default:
          return 'default';
      }
    };

    return (
      <View className={containerClassName}>
        {label && (
          <Text className="mb-1 text-sm font-medium text-foreground">
            {label}
          </Text>
        )}
        
        <View className={inputContainerVariants({ variant, size, state, disabled })}>
          {leftIcon && (
            <View className="mr-2">
              {leftIcon}
            </View>
          )}
          
          <TextInput
            ref={ref}
            className={inputTextVariants({ size, className })}
            style={[{ color: theme.colors.text }, style]}
            placeholderTextColor={theme.colors.textSecondary}
            editable={!disabled}
            secureTextEntry={shouldObscure}
            keyboardType={getKeyboardType()}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="ml-2 p-1"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.textSecondary} />
              ) : (
                <Eye size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          
          {rightIcon && !isPassword && (
            <View className="ml-2">
              {rightIcon}
            </View>
          )}
        </View>
        
        {error && (
          <Text className="mt-1 text-sm text-destructive">
            {error}
          </Text>
        )}
        
        {helperText && !error && (
          <Text className="mt-1 text-sm text-foreground-muted">
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onSearch?: (value: string) => void;
  SearchIcon?: React.ComponentType<{ size: number; color: string }>;
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  ({ onSearch, SearchIcon, ...props }, ref) => {
    const { theme } = useTheme();
    const LucideSearch = require('lucide-react-native').Search;
    const Icon = SearchIcon || LucideSearch;

    return (
      <Input
        ref={ref}
        {...props}
        leftIcon={<Icon size={20} color={theme.colors.textSecondary} />}
        returnKeyType="search"
        onSubmitEditing={(e) => {
          onSearch?.(e.nativeEvent.text);
          props.onSubmitEditing?.(e);
        }}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
