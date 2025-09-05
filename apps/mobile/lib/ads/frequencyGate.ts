import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'ads:interstitial:count:';

export async function shouldShowForEvent(reason: string, everyN: number): Promise<boolean> {
  try {
    const key = `${PREFIX}${reason || 'general'}`;
    const raw = await AsyncStorage.getItem(key);
    const current = raw ? parseInt(raw, 10) || 0 : 0;
    const next = current + 1;
    await AsyncStorage.setItem(key, String(next));
    if (everyN <= 1) return true;
    return next % everyN === 0;
  } catch {
    // If storage fails, do not block ads; fall back to show rarely by default
    return false;
  }
}
