import { Platform } from 'react-native';
import Purchases, { CustomerInfo, OFFERING_IDENTIFIER, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';

// Lightweight RevenueCat wrapper. No secrets are embedded; SDK keys are read from Expo extra.
export type BillingInterval = 'monthly' | 'annual';

let configured = false;

export function configureRevenueCat({ iosKey, androidKey, appUserId }: { iosKey?: string | null; androidKey?: string | null; appUserId?: string | null }) {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;
  if (!apiKey) return; // Graceful no-op if keys are not set
  Purchases.configure({ apiKey, appUserID: appUserId || undefined });
  configured = true;
}

export async function getOfferingsSafe(): Promise<{ current?: PurchasesOffering } | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return { current: offerings.current || undefined };
  } catch {
    return null;
  }
}

function pickDefaultPackage(offering: PurchasesOffering, interval: BillingInterval): PurchasesPackage | null {
  // RevenueCat default offering package identifiers are $rc_monthly and $rc_annual
  const targetId = interval === 'monthly' ? '$rc_monthly' : '$rc_annual';
  const match = offering.availablePackages.find((p: any) => p.identifier === targetId);
  return match || null;
}

export async function purchaseDefault(offering: PurchasesOffering, interval: BillingInterval): Promise<{ success: boolean; info?: CustomerInfo }>
{
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

export async function restorePurchases(): Promise<{ success: boolean; info?: CustomerInfo }>
{
  try {
    const info = await Purchases.restorePurchases();
    return { success: true, info };
  } catch {
    return { success: false };
  }
}

