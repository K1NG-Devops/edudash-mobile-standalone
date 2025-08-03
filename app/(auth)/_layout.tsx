import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ 
        title: 'Sign In',
        presentation: 'card'
      }} />
      <Stack.Screen name="sign-up" options={{ 
        title: 'Sign Up',
        presentation: 'card'
      }} />
      <Stack.Screen name="forgot-password" options={{ 
        title: 'Reset Password',
        presentation: 'card'
      }} />
      <Stack.Screen name="parent-signup" options={{ 
        title: 'Parent Sign Up',
        presentation: 'card'
      }} />
    </Stack>
  );
}
