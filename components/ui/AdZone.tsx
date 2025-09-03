import React from 'react'
import { Platform } from 'react-native'
import AdPlacement from '@/components/ui/AdPlacement'
import { useSubscription } from '@/lib/hooks/useSubscription'

interface AdZoneProps {
  children: React.ReactNode
  showForAll?: boolean // if true, show ads regardless of subscription tier
}

/**
 * AdZone renders a child-safe banner ad only for freemium users,
 * and only when ads are enabled via EXPO_PUBLIC_ENABLE_ADS.
 * On web, AdPlacement is a no-op; on native, it renders a BannerAd beneath children.
 * Never use this on learning/lesson/assignment screens.
 */
const AdZone = ({ children, showForAll = false }: AdZoneProps) => {
  const { subscription } = useSubscription()
  const tier = subscription?.plan?.tier || 'free'
  const isFreeTier = tier === 'free'
  const adsEnabled = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true'

  const shouldShow = adsEnabled && (showForAll || isFreeTier)

  if (shouldShow) {
    return (
      <AdPlacement>
        {children}
      </AdPlacement>
    )
  }

  return <>{children}</>
}

export default AdZone

