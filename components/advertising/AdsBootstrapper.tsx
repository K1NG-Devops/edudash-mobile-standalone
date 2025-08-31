import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { InterstitialManager } from '@/lib/ads/interstitialManager';
import { onShowInterstitial } from '@/lib/ads/adEvents';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { shouldShowForEvent } from '@/lib/ads/frequencyGate';

// Mount once near the root of the app to initialize ads and wire interstitial events.
const AdsBootstrapper: React.FC = () => {
  const { subscription } = useSubscription();
  const tier = subscription?.tier || subscription?.plan?.tier || 'free';

  useEffect(() => {
    const enabled = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
    if (!enabled) return;
    if (Platform.OS === 'web') return;

    let RNGoogleAds: any;
    try {
      RNGoogleAds = require('react-native-google-mobile-ads');
    } catch {
      return; // Native module not available (Expo Go / web)
    }

    // Child-safe ad configuration
    RNGoogleAds
      .default()
      .setRequestConfiguration({
        maxAdContentRating: RNGoogleAds.MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        testDeviceIdentifiers: process.env.NODE_ENV !== 'production' ? ['EMULATOR'] : [],
      })
      .then(() => RNGoogleAds.default().initialize())
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
