/* eslint-disable */
import React from 'react';
import { View } from 'react-native';

interface AdPlacementProps { children: React.ReactNode }

const AdPlacement = ({ children }: AdPlacementProps) => {
  const isProd = process.env.NODE_ENV === 'production';
  // Only enable ads in production when explicitly allowed
  const enableAds = isProd && process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
  if (!enableAds) return <>{children}</>;

  // Try to load the native ads module at runtime. If unavailable (e.g. Expo Go), skip ads gracefully.
  let BannerAd: any = null;
  let BannerAdSize: any = null;
  try {
    const RNGoogleAds = require('react-native-google-mobile-ads');
    BannerAd = RNGoogleAds.BannerAd;
    BannerAdSize = RNGoogleAds.BannerAdSize;
  } catch (e) {
    // Native module not present; render children only
    return <>{children}</>;
  }

  const unitId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/6300978111';
  return (
    <View>
      {children}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <BannerAd unitId={unitId} size={BannerAdSize.BANNER} requestOptions={{ keywords: ['education','parenting'] }} />
      </View>
    </View>
  );
};
export default AdPlacement;
