import { Platform } from 'react-native';

// Lightweight RevenueCat wrapper. No secrets are embedded; SDK keys are read from Expo extra.
export type BillingInterval = 'monthly' | 'annual';

let configured = false;

function getPurchases(): any {
  // Avoid importing on web to prevent bundler errors
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('react-native-purchases');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

export function configureRevenueCat({ iosKey, androidKey, appUserId }: { iosKey?: string | null; androidKey?: string | null; appUserId?: string | null }) {
  if (configured) return;
  if (Platform.OS === 'web') return;
  const Purchases = getPurchases();
  if (!Purchases) return;
  const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;
  if (!apiKey) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // Warn developers on native if SDK keys are not present
      // This is safe: it does not crash the app, and web is already gated
      console.warn('[RevenueCat] Missing SDK key for', Platform.OS === 'ios' ? 'iOS' : 'Android', '- Purchases will be disabled.');
    }
    return; // Graceful no-op if keys are not set
  }
  Purchases.configure({ apiKey, appUserID: appUserId || undefined });
  configured = true;
}

export async function getOfferingsSafe(): Promise<{ current?: any } | null> {
  if (Platform.OS === 'web') return null;
  const Purchases = getPurchases();
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return { current: offerings.current || undefined };
  } catch {
    return null;
  }
}

function pickDefaultPackage(offering: any, interval: BillingInterval): any | null {
  // RevenueCat default offering package identifiers are $rc_monthly and $rc_annual
  const targetId = interval === 'monthly' ? '$rc_monthly' : '$rc_annual';
  const match = offering.availablePackages.find((p: any) => p.identifier === targetId);
  return match || null;
}

export async function purchaseDefault(offering: any, interval: BillingInterval): Promise<{ success: boolean; info?: any }>
{
  if (Platform.OS === 'web') return { success: false };
  const Purchases = getPurchases();
  if (!Purchases) return { success: false };
  try {
    const pkg = pickDefaultPackage(offering, interval);
    if (!pkg) return { success: false };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, info: customerInfo };
  } catch (e: any) {
    // User cancellations or store errors are expected sometimes
    return { success: false };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; info?: any }>
{
  if (Platform.OS === 'web') return { success: false };
  const Purchases = getPurchases();
  if (!Purchases) return { success: false };
  try {
    const info = await Purchases.restorePurchases();
    return { success: true, info };
  } catch {
    return { success: false };
  }
}

