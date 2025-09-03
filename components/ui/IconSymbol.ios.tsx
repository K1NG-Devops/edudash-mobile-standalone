import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

// Minimal aliasing for inputs that aren't valid SF Symbol names
const IOS_ALIAS: Record<string, SymbolViewProps['name']> = {
  // Map generic 'brain' to a valid SF Symbol
  brain: 'brain.head.profile',
  // Common aliases used in components
  smiley: 'face.smiling',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const resolvedName = IOS_ALIAS[String(name)] ?? name;
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={resolvedName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
