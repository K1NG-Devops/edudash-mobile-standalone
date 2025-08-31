import React from 'react';

/**
 * Web version of AdsBootstrapper
 * On web, we don't initialize any ads since react-native-google-mobile-ads is not supported
 * This prevents any issues with native module imports
 */
const AdsBootstrapper: React.FC = () => {
  // No ads initialization needed on web
  return null;
};

export default AdsBootstrapper;
