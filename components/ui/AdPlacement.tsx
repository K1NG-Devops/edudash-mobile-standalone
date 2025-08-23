/* Web-safe default wrapper; platform-specific files (.native.tsx/.web.tsx) will override if present */
import React from 'react';

interface AdPlacementProps { children: React.ReactNode }
const AdPlacement = ({ children }: AdPlacementProps) => <>{children}</>;
export default AdPlacement;
