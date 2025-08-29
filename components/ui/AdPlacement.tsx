import React from 'react';
import { Platform, View } from 'react-native';

// Lazy import only when package is installed in native build and not on web
let BannerAd: any;
let BannerAdSize: any;

// Only import on native platforms
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
  } catch {
    // noop if not installed
  }
}

interface AdPlacementProps {
  children: React.ReactNode;
}

const AdPlacement = ({ children }: AdPlacementProps) => {
  const enableAds = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
  const unitId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/6300978111'; // test id

  // Don't show ads on web or if not enabled or components not available
  if (Platform.OS === 'web' || !enableAds || !BannerAd || !BannerAdSize) {
    return <>{children}</>;
  }

  return (
    <View>
      {children}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.BANNER}
          requestOptions={{ keywords: ['education', 'parenting'] }}
        />
      </View>
    </View>
  );
};

export default AdPlacement;
