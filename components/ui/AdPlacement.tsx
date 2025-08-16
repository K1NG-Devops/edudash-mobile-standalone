import React from 'react';
import { View } from 'react-native';

// Lazy import only when package is installed in native build
let BannerAd: any;
let BannerAdSize: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
} catch {
    // noop for web or if not installed
}

interface AdPlacementProps {
    children: React.ReactNode;
}

const AdPlacement = ({ children }: AdPlacementProps) => {
    const enableAds = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
    const unitId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/6300978111'; // test id

    if (!enableAds || !BannerAd || !BannerAdSize) {
        return <>{children}</>;
    }

    return (
        <View>
            {children}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
                <BannerAd unitId={unitId} size={BannerAdSize.BANNER} requestOptions={{ keywords: ['education', 'parenting'] }} />
            </View>
        </View>
    );
};

export default AdPlacement;
