import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function AboutLayout() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerTintColor: palette.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
        presentation: 'card',
      }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'About',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="company" 
        options={{ 
          title: 'Company',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="careers" 
        options={{ 
          title: 'Careers',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="security" 
        options={{ 
          title: 'Security',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="blog" 
        options={{ 
          title: 'Blog',
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}
