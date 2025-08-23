import React from 'react';
import { Image, ViewStyle } from 'react-native';

export interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: ViewStyle;
}

export default function QRCode(props: QRCodeProps) {
  const { value, size = 200, backgroundColor = '#FFFFFF', color = '#000000', style } = props;
  // Use a simple public QR API on web to avoid bundling native modules
  const uri = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 12, backgroundColor }} resizeMode="contain" />
  );
}

