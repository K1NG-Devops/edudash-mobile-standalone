import React from 'react';
import QRCodeSVG from 'react-native-qrcode-svg';
import { ViewStyle } from 'react-native';

export interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: ViewStyle;
}

export default function QRCode(props: QRCodeProps) {
  const { value, size = 200, backgroundColor = '#FFFFFF', color = '#000000', style } = props;
  return (
    <QRCodeSVG value={value} size={size} backgroundColor={backgroundColor} color={color} />
  );
}

