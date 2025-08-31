/**
 * Web version of InterstitialManager
 * On web, we don't support native ads, so this is just a stub
 */

class InterstitialManagerImpl {
  public async initialize(): Promise<void> {
    // No-op on web
    return Promise.resolve();
  }

  public load(): void {
    // No-op on web
  }

  public showIfEligible(userTier: string | undefined): boolean {
    // Always return false on web since ads aren't supported
    return false;
  }
}

export const InterstitialManager = new InterstitialManagerImpl();
