// Minimal event bus for ad triggers to avoid adding a dependency
export type InterstitialEvent = { reason?: string };

type Listener = (e?: InterstitialEvent) => void;

const listeners = new Set<Listener>();

export function onShowInterstitial(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestShowInterstitial(event?: InterstitialEvent) {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {}
  });
}
