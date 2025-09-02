import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/Button'
import { View } from 'react-native'

const meta: Meta<typeof PageHeader> = {
  title: 'Design System/PageHeader',
  component: PageHeader,
}

export default meta

export const Basic: StoryObj<typeof PageHeader> = {
  render: () => (
    <View style={{ padding: 16 }}>
      <PageHeader title="Dashboard" subtitle="Overview & insights" />
    </View>
  ),
}

export const WithActions: StoryObj<typeof PageHeader> = {
  render: () => (
    <View style={{ padding: 16 }}>
      <PageHeader
        title="School Overview"
        subtitle="Manage classes, teachers, and analytics"
        actions={<Button text="Create" />}
      />
    </View>
  ),
}

