/**
 * Web mock for react-native-google-mobile-ads
 * This module provides stubs for all the native ad functionality
 * to prevent import errors when running on web
 */

// Mock BannerAd component
const BannerAd = () => null;

// Mock ad sizes
const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  SMART_BANNER: 'SMART_BANNER',
};

// Mock interstitial ad
const InterstitialAd = {
  createForAdRequest: () => ({
    addAdEventListener: () => {},
    load: () => {},
    show: () => {},
  }),
};

// Mock ad event types
const AdEventType = {
  LOADED: 'LOADED',
  FAILED_TO_LOAD: 'FAILED_TO_LOAD',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',
  IMPRESSION: 'IMPRESSION',
  CLOSED: 'CLOSED',
  LEFT_APPLICATION: 'LEFT_APPLICATION',
  ERROR: 'ERROR',
};

// Mock ad content rating
const MaxAdContentRating = {
  G: 'G',
  PG: 'PG',
  T: 'T',
  MA: 'MA',
};

// Mock main ads module
const mockAds = () => ({
  initialize: () => Promise.resolve(),
  setRequestConfiguration: () => Promise.resolve(),
});

// Export all the mocked components and functions
module.exports = {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  MaxAdContentRating,
  default: mockAds,
};

// Also support named exports
module.exports.BannerAd = BannerAd;
module.exports.BannerAdSize = BannerAdSize;
module.exports.InterstitialAd = InterstitialAd;
module.exports.AdEventType = AdEventType;
module.exports.MaxAdContentRating = MaxAdContentRating;
