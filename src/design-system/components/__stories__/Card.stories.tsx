import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/Card'
import { Text } from '../../components/Typography'
import { View } from 'react-native'

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
}

export default meta

export const Basic: StoryObj<typeof Card> = {
  render: () => (
    <View style={{ padding: 16 }}>
      <Card>
        <CardHeader>
          <Text weight="semibold">Card Title</Text>
        </CardHeader>
        <CardContent>
          <Text>Card content goes here.</Text>
        </CardContent>
        <CardFooter>
          <Text variant="caption" className="text-foreground-muted">Footer</Text>
        </CardFooter>
      </Card>
    </View>
  )
}

