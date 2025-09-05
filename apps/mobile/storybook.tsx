import React from 'react';
import { View, Text, Platform } from 'react-native';

// Placeholder Storybook UI for the monorepo. This prevents Metro from failing to
// resolve a non-existent ../storybook module when the route is present.
// If you want full Storybook, add a real implementation under apps/mobile/storybook/
// and export a default React component from there.

export default function StorybookUIRoot() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        Storybook Not Configured
      </Text>
      <Text style={{ fontSize: 14, opacity: 0.8, textAlign: 'center' }}>
        This monorepo currently ships without Storybook. The /storybook route is a
        placeholder so bundling does not fail. If you want Storybook on {Platform.OS},
        scaffold apps/mobile/storybook and update the import in app/storybook.tsx.
      </Text>
    </View>
  );
}

