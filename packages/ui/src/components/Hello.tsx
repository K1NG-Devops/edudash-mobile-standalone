import { View, Text } from 'react-native';

export function Hello({ name = 'EduDash' }: { name?: string }) {
  return (
    <View style={{ padding: 12 }}>
      <Text accessibilityRole="header">Hello, {name} UI</Text>
    </View>
  );
}

