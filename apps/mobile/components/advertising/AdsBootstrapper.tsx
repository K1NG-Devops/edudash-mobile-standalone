import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { InterstitialManager } from '@/lib/ads/interstitialManager';
import { onShowInterstitial } from '@/lib/ads/adEvents';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { shouldShowForEvent } from '@/lib/ads/frequencyGate';

// Mount once near the root of the app to initialize ads and wire interstitial events.
const AdsBootstrapper: React.FC = () => {
  const { subscription } = useSubscription();
  const tier = subscription?.tier ?? 'free';

  useEffect(() => {
    const enabled = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
    if (!enabled) return;
    if (Platform.OS === 'web') return;

    // Expo Go does not ship the native Google Mobile Ads module; skip entirely
    const isExpoGo = (Constants as any)?.appOwnership === 'expo';
    if (isExpoGo) return;

    let RNGoogleAds: any;
    try {
      RNGoogleAds = require('react-native-google-mobile-ads');
    } catch {
      return; // JS package not present
    }

    // Safeguard: skip if native module or required functions are not available (e.g., Expo Go)
    const mobileAds = RNGoogleAds?.default?.();
    const canConfigure = mobileAds && typeof mobileAds.setRequestConfiguration === 'function';
    const canInitialize = mobileAds && typeof mobileAds.initialize === 'function';
    if (!canConfigure || !canInitialize) {
      return; // avoid calling undefined initialize in non-native environments
    }

    // Child-safe ad configuration
    mobileAds
      .setRequestConfiguration({
        maxAdContentRating: RNGoogleAds.MaxAdContentRating?.G ?? 'G',
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        testDeviceIdentifiers: process.env.NODE_ENV !== 'production' ? ['EMULATOR'] : [],
      })
      .then(() => mobileAds.initialize())
      .then(() => {
        // Preload first interstitial
        InterstitialManager.initialize();
      })
      .catch(() => {
        // ignore; ads are best-effort only
      });

    // Wire event listener to show interstitials on demand
    const off = onShowInterstitial(async (evt) => {
      const rawN = process.env.EXPO_PUBLIC_ADS_INTERSTITIAL_EVERY_N;
      const everyN = rawN ? parseInt(rawN, 10) || 3 : 3;
      const reason = evt?.reason || 'general';
      const allowed = await shouldShowForEvent(reason, everyN);
      if (!allowed) return;
      InterstitialManager.showIfEligible(tier);
    });

    return () => {
      off();
    };
  }, [tier]);

  return null;
};

export default AdsBootstrapper;
