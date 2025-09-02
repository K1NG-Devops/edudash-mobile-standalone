import React from 'react'
import { View, ViewProps } from 'react-native'
import { Heading, Text } from './Typography'
import { Button } from './Button'

export interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode
  title: string
  description?: string
  primaryAction?: { label: string; onPress: () => void }
  secondaryAction?: { label: string; onPress: () => void }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  style,
  className,
  ...props
}) => {
  return (
    <View className={`items-center justify-center rounded-xl p-6 border border-border ${className || ''}`} style={style} {...props}>
      {icon ? <View className="mb-3">{icon}</View> : null}
      <Heading level="h4" className="mb-1 text-center">{title}</Heading>
      {description ? (
        <Text variant="muted" className="text-center mb-4">{description}</Text>
      ) : null}
      <View className="flex-row items-center justify-center gap-3">
        {secondaryAction ? (
          <Button variant="outline" text={secondaryAction.label} onPress={secondaryAction.onPress} />
        ) : null}
        {primaryAction ? (
          <Button text={primaryAction.label} onPress={primaryAction.onPress} />
        ) : null}
      </View>
    </View>
  )
}
