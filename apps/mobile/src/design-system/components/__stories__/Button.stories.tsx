import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../components/Button'
import { View } from 'react-native'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
}

export default meta

export const Primary: StoryObj<typeof Button> = {
  render: (args) => (
    <View style={{ padding: 16 }}>
      <Button text="Primary" {...args} />
    </View>
  ),
  args: { variant: 'solid', size: 'md' },
}

export const Outline: StoryObj<typeof Button> = {
  render: (args) => (
    <View style={{ padding: 16 }}>
      <Button text="Outline" variant="outline" {...args} />
    </View>
  ),
}

export const Destructive: StoryObj<typeof Button> = {
  render: (args) => (
    <View style={{ padding: 16 }}>
      <Button text="Delete" variant="destructive" {...args} />
    </View>
  ),
}

