import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function InviteCodeRedirect() {
  const params = useLocalSearchParams();
  const code = (params?.code as string) || '';

  useEffect(() => {
    // Redirect to the Join with Code screen with query param preserved
    const target: Href = {
      pathname: '/(auth)/join-with-code',
      params: code ? { code } : {},
    } as Href;
    router.replace(target);
  }, [code]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
