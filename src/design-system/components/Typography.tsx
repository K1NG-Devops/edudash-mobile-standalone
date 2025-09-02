/**
 * Typography Components
 * Consistent text and heading components with presets
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTheme } from '../theme/ThemeProvider';

// Text variants
const textVariants = cva(
  'text-foreground',
  {
    variants: {
      variant: {
        body: 'text-base',
        caption: 'text-xs',
        subtitle: 'text-sm',
        label: 'text-sm font-medium',
        error: 'text-sm text-destructive',
        success: 'text-sm text-success',
        muted: 'text-foreground-muted',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      },
    },
    defaultVariants: {
      variant: 'body',
      weight: 'normal',
      align: 'left',
    },
  }
);

export interface TextProps 
  extends RNTextProps,
    VariantProps<typeof textVariants> {
  children: React.ReactNode;
  color?: string;
}

export const Text = React.forwardRef<RNText, TextProps>(
  ({ 
    children, 
    variant, 
    size, 
    weight, 
    align,
    color,
    className,
    style,
    ...props 
  }, ref) => {
    const { colors } = useTheme();
    
    return (
      <RNText
        ref={ref}
        className={textVariants({ variant, size, weight, align, className })}
        style={[
          color ? { color } : { color: colors.foreground },
          style
        ]}
        {...props}
      >
        {children}
      </RNText>
    );
  }
);

Text.displayName = 'Text';

// Heading variants
const headingVariants = cva(
  'font-bold text-foreground',
  {
    variants: {
      level: {
        h1: 'text-4xl',
        h2: 'text-3xl',
        h3: 'text-2xl',
        h4: 'text-xl',
        h5: 'text-lg',
        h6: 'text-base',
      },
      weight: {
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      level: 'h3',
      weight: 'bold',
      align: 'left',
    },
  }
);

export interface HeadingProps 
  extends RNTextProps,
    VariantProps<typeof headingVariants> {
  children: React.ReactNode;
  color?: string;
}

export const Heading = React.forwardRef<RNText, HeadingProps>(
  ({ 
    children, 
    level, 
    weight, 
    align,
    color,
    className,
    style,
    ...props 
  }, ref) => {
    const { colors } = useTheme();
    
    // Map heading levels to accessibility roles
    const accessibilityRole = 'header';
    
    return (
      <RNText
        ref={ref}
        className={headingVariants({ level, weight, align, className })}
        style={[
          color ? { color } : { color: colors.foreground },
          style
        ]}
        accessibilityRole={accessibilityRole as any}
        {...props}
      >
        {children}
      </RNText>
    );
  }
);

Heading.displayName = 'Heading';

// Label component for form fields
export interface LabelProps extends Omit<TextProps, 'variant'> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  required = false, 
  ...props 
}) => {
  return (
    <Text variant="label" {...props}>
      {children}
      {required && <Text color="#ef4444"> *</Text>}
    </Text>
  );
};

Label.displayName = 'Label';

// Helper text component for form fields
export interface HelperTextProps extends Omit<TextProps, 'variant'> {
  type?: 'default' | 'error' | 'success';
}

export const HelperText: React.FC<HelperTextProps> = ({ 
  type = 'default', 
  ...props 
}) => {
  const variant = type === 'error' ? 'error' : type === 'success' ? 'success' : 'caption';
  return <Text variant={variant} {...props} />;
};

HelperText.displayName = 'HelperText';
