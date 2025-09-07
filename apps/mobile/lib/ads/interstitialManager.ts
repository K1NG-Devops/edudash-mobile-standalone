import { Platform } from 'react-native';

// Lightweight singleton to manage Interstitial ads.
// - Respects EXPO_PUBLIC_ENABLE_ADS
// - Uses Google test units in non-production
// - Reloads after close/error
// - Child-safe flags are configured by the bootstrapper (see AdsBootstrapper)

class InterstitialManagerImpl {
  private initialized = false;
  private interstitial: any = null;
  private isLoaded = false;
  private lastShowAt = 0;
  private minIntervalMs = 60_000; // throttle: at most once per minute

  // Resolve environment
  private get isProd() {
    // Prefer explicit app environment flag; fallback to NODE_ENV
    const appEnv = (process.env.EXPO_PUBLIC_ENVIRONMENT || '').toLowerCase();
    return appEnv === 'production' || process.env.NODE_ENV === 'production';
  }

  private get adsEnabled() {
    return process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
  }

  private get unitId() {
    // Use test interstitial in non-production
    if (!this.isProd) {
      return 'ca-app-pub-3940256099942544/1033173712';
    }
    // Android real unit from env
    if (Platform.OS === 'android') {
      return (
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_UNIT_ID ||
        'ca-app-pub-3940256099942544/1033173712'
      );
    }
    // iOS not configured yet; fall back to test ID
    return 'ca-app-pub-3940256099942544/4411468910';
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.adsEnabled) return; // gate by flag
    if (Platform.OS === 'web') return;

    let RNGoogleAds: any;
    try {
      RNGoogleAds = require('react-native-google-mobile-ads');
    } catch {
      return; // native module not available (e.g., Expo Go)
    }

    const mobileAds = RNGoogleAds?.default?.();
    if (!mobileAds || typeof mobileAds.initialize !== 'function') {
      return; // avoid calling undefined initialize when running in Expo Go
    }

    try {
      // Request configuration should be set by the bootstrapper; keep here as best-effort fallback.
      await mobileAds.initialize();
    } catch {
      // ignore init failures; we can still attempt to load later
    }

    this.initialized = true;
    // Prepare first load
    this.load();
  }

  public load(): void {
    if (!this.adsEnabled) return;
    if (Platform.OS === 'web') return;

    let RNGoogleAds: any;
    try {
      RNGoogleAds = require('react-native-google-mobile-ads');
    } catch {
      return;
    }

    const { InterstitialAd, AdEventType } = RNGoogleAds || {};

    if (!InterstitialAd || !AdEventType) return; // native pieces unavailable

    try {
      this.interstitial = InterstitialAd.createForAdRequest(this.unitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['education', 'parenting', 'toys', 'learning'],
      });
      this.isLoaded = false;

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.isLoaded = false;
        // Preload next
        setTimeout(() => this.load(), 1000);
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, () => {
        this.isLoaded = false;
        // Backoff and retry
        setTimeout(() => this.load(), 5_000);
      });

      this.interstitial.load();
    } catch {
      // ignore
    }
  }

  // Show only for free tier and only if loaded and throttled
  public showIfEligible(userTier: string | undefined): boolean {
    if (!this.adsEnabled) return false;
    if (Platform.OS === 'web') return false;
    if (userTier && userTier !== 'free') return false;

    const now = Date.now();
    if (now - this.lastShowAt < this.minIntervalMs) return false;

    if (this.isLoaded && this.interstitial) {
      try {
        this.interstitial.show();
        this.lastShowAt = now;
        this.isLoaded = false; // will reload on close
        return true;
      } catch {
        // On failure, try to reload for a next attempt
        this.load();
        return false;
      }
    }

    // Not ready yet; trigger load
    this.load();
    return false;
  }
}

export const InterstitialManager = new InterstitialManagerImpl();
