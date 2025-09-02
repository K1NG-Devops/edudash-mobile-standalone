import React from 'react'
import { View, ViewProps } from 'react-native'
import { Heading, Text } from './Typography'
import { cva, type VariantProps } from 'class-variance-authority'

const headerCva = cva('w-full rounded-lg', {
  variants: {
    spacing: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: { spacing: 'md' },
})

export interface PageHeaderProps extends ViewProps, VariantProps<typeof headerCva> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, spacing, className, style, ...props }) => {
  return (
    <View className={headerCva({ spacing, className })} style={style} {...props}>
      <View className="flex-row items-start justify-between">
        <View style={{ flex: 1 }}>
          <Heading level="h2">{title}</Heading>
          {subtitle ? (
            <Text variant="subtitle" className="mt-1">{subtitle}</Text>
          ) : null}
        </View>
        {actions ? <View className="ml-3">{actions}</View> : null}
      </View>
    </View>
  )
}
