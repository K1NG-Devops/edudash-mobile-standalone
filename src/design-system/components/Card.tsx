/**
 * Card Component
 * Container component with consistent styling and elevation
 */

import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps, Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { shadows } from '../tokens';

const cardVariants = cva(
  'bg-background rounded-lg',
  {
    variants: {
      variant: {
        elevated: 'border-0',
        flat: 'border border-border',
        ghost: 'border-0 bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      elevation: {
        none: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      padding: 'md',
      elevation: 'sm',
    },
  }
);

export interface CardProps 
  extends ViewProps,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ 
    children, 
    variant, 
    padding, 
    elevation, 
    pressable = false,
    onPress,
    className,
    style,
    ...props 
  }, ref) => {
    const shadowStyle = variant === 'elevated' && elevation ? shadows[elevation] : {};

    if (pressable && onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          className={cardVariants({ variant, padding, elevation, className })}
          style={[shadowStyle, style]}
          accessibilityRole="button"
          {...(props as TouchableOpacityProps)}
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View
        ref={ref}
        className={cardVariants({ variant, padding, elevation, className })}
        style={[shadowStyle, style]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  // Ensure any string/number children are wrapped in Text to satisfy React Native
  const safeChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      // Ignore pure whitespace text nodes
      const text = String(child);
      if (text.trim().length === 0) return null;
      return <RNText>{text}</RNText>;
    }
    return child as React.ReactNode;
  });

  return (
    <View className={`pb-4 ${className}`} {...props}>
      {safeChildren}
    </View>
  );
};

CardHeader.displayName = 'CardHeader';

// Card Content component
export interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const safeChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = String(child);
      if (text.trim().length === 0) return null;
      return <RNText>{text}</RNText>;
    }
    return child as React.ReactNode;
  });

  return (
    <View className={`${className}`} {...props}>
      {safeChildren}
    </View>
  );
};

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  const safeChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = String(child);
      if (text.trim().length === 0) return null;
      return <RNText>{text}</RNText>;
    }
    return child as React.ReactNode;
  });

  return (
    <View className={`pt-4 ${className}`} {...props}>
      {safeChildren}
    </View>
  );
};

CardFooter.displayName = 'CardFooter';
