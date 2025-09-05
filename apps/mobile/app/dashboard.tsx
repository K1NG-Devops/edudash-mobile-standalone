import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DashboardAlias() {
  useEffect(() => {
    // Normalize /dashboard -> /(tabs)/dashboard for web deep links
    try { router.replace('/(tabs)/dashboard'); } catch { try { router.push('/(tabs)/dashboard'); } catch {} }
  }, []);
  return null;
}
