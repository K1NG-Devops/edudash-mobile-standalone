import React from 'react'
import { Platform, View, Text } from 'react-native'

let StorybookUIRoot: React.ComponentType<any>

if (Platform.OS === 'web') {
  // On-device Storybook does not run on web. Render a friendly placeholder.
  StorybookUIRoot = function StorybookWebPlaceholder() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          Storybook (on-device) is only available on iOS/Android builds.\n\nRun the app on a device/emulator and open the /storybook route.
        </Text>
      </View>
    )
  }
} else {
  // Lazy-require to avoid bundling for the web target
   
  const SB = require('@storybook/react-native')
  const getStorybookUI = (SB && (SB.getStorybookUI || SB.default?.getStorybookUI || SB.default)) as any

  // Load example stories on native only
   
  require('../src/design-system/components/__stories__/Button.stories')
   
  require('../src/design-system/components/__stories__/Card.stories')

  if (typeof getStorybookUI === 'function') {
    StorybookUIRoot = getStorybookUI({ asyncStorage: null })
  } else {
    // Fallback placeholder to avoid runtime crash if API shape changes
    StorybookUIRoot = function StorybookFallback() {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, textAlign: 'center' }}>
            Storybook failed to initialize. Please ensure @storybook/react-native is installed and compatible.
          </Text>
        </View>
      )
    }
  }
}

export default StorybookUIRoot

