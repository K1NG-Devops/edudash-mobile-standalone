import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hide the built-in tab bar; we render a global one in the root layout
        tabBarStyle: { display: 'none' },
        tabBarActiveTintColor: isDark ? '#818CF8' : '#6366F1',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="rectangle.3.group" size={size as number} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="figure.run" size={size as number} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="bubble.left.and.bubble.right" size={size as number} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings_new"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="gearshape" size={size as number} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
