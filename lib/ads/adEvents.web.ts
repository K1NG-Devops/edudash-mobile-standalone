// Web version of ad events - same interface as native but no ads functionality
export type InterstitialEvent = { reason?: string };

type Listener = (e?: InterstitialEvent) => void;

// On web, we just maintain empty functionality
export function onShowInterstitial(listener: Listener) {
  // Return a no-op cleanup function
  return () => {};
}

export function requestShowInterstitial(event?: InterstitialEvent) {
  // No-op on web since ads aren't supported
}
