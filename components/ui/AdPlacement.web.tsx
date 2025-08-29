import React from 'react';

interface AdPlacementProps {
  children: React.ReactNode
}

/**
 * Web version of AdPlacement component
 * Google Mobile Ads is not supported on web, so we just render children
 */
const AdPlacement = ({ children }: AdPlacementProps) => {
  // On web, we don't support mobile ads - just render children
  return <>{children}</>;
};

export default AdPlacement;