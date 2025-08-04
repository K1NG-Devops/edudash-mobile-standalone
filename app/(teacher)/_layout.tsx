import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerShown: false,
          title: 'Reports' 
        }} 
      />
      <Stack.Screen 
        name="reports/[id]" 
        options={{ 
          headerShown: false,
          title: 'Report Details' 
        }} 
      />
    </Stack>
  );
}
