import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen name="super-admin-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-dashboard-simple" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}
