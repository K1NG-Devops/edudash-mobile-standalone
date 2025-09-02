import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from '../../components/EmptyState'
import { View } from 'react-native'

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/EmptyState',
  component: EmptyState,
}

export default meta

export const Basic: StoryObj<typeof EmptyState> = {
  render: (args) => (
    <View style={{ padding: 16 }}>
      <EmptyState {...args} />
    </View>
  ),
}

export const WithActions: StoryObj<typeof EmptyState> = {
  render: () => (
    <View style={{ padding: 16 }}>
      <EmptyState
        title="No Classes"
        description="Create your first class to get started."
        primaryAction={{ label: 'Create Class', onPress: () => {} }}
        secondaryAction={{ label: 'Learn More', onPress: () => {} }}
      />
    </View>
  ),
}

