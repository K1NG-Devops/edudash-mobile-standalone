import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="super-admin-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-dashboard-simple" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="teachers" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
      <Stack.Screen name="parents" options={{ headerShown: false }} />
      <Stack.Screen name="principal-reports" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-view" options={{ headerShown: false }} />
      <Stack.Screen name="student-view" options={{ headerShown: false }} />
      <Stack.Screen name="parent-view" options={{ headerShown: false }} />
      <Stack.Screen name="announcement-management" options={{ headerShown: false }} />
      <Stack.Screen name="event-detail" options={{ headerShown: false }} />
      {/* Ensure new screens like subscription-management also hide the default header */}
      <Stack.Screen name="subscription-management" options={{ headerShown: false }} />
      <Stack.Screen name="schools-management" options={{ headerShown: false }} />
    </Stack>
  );
}
