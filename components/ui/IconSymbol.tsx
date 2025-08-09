// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Allow any SF Symbol-like string and map to a MaterialIcons name string
type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the Icons Directory (https://icons.expo.fyi)
 * - see SF Symbols in the SF Symbols app (Apple)
 */
const MAPPING: IconMapping = {
  // Navigation
  'house.fill': 'home',
  'house': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'arrow.up.right': 'trending-up',
  'magnifyingglass': 'search',
  'xmark': 'close',
  'xmark.circle': 'cancel',
  // 'arrow.clockwise' already defined above; avoid duplicate key

  // User & Authentication
  'person.circle.fill': 'account-circle',
  'person.circle': 'account-circle',
  'person.3.fill': 'group',
  'person.2.fill': 'people',
  'person.2.badge.plus': 'person-add',
  'person.crop.circle.badge.plus': 'person-add',
  'rectangle.portrait.and.arrow.right': 'logout',

  // Education
  'book.fill': 'book',
  'book': 'menu-book',
  'graduationcap.fill': 'school',
  'doc.text.fill': 'description',
  'building.2.fill': 'business',
  'building.2': 'business',

  // Analytics & Charts
  'chart.bar.fill': 'bar-chart',
  'chart.pie': 'pie-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'dollarsign.circle.fill': 'attach-money',

  // Communication
  'message.fill': 'message',
  'bell': 'notifications',
  'bell.fill': 'notifications',

  // Media & Devices
  'video.fill': 'videocam',
  'gamecontroller.fill': 'sports-esports',

  // Actions
  'plus.circle.fill': 'add-circle',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  'clock.fill': 'schedule',
  'qrcode.viewfinder': 'qr-code-scanner',
  'sparkles': 'auto-awesome',
  'trash': 'delete',
  'envelope': 'email',
  'envelope.fill': 'email',
  'person.2': 'people',
  'person.badge.plus': 'person-add',
  'person.3.sequence.fill': 'groups',
  'video.bubble.left.fill': 'video-call',
  'arrow.right.circle.fill': 'arrow-forward',
  'eye.fill': 'visibility',
  'person.fill.checkmark': 'verified-user',
  'person.fill.xmark': 'person-remove',
  'line.3.horizontal.decrease': 'filter-list',
  'arrow.clockwise': 'refresh',
  'snack.circle': 'local-dining',
  'trash.circle': 'delete-forever',

  // Family
  'figure.2.and.child.holdinghands': 'family-restroom',

  // Settings & Info
  'questionmark.circle': 'help',
  'info.circle': 'info',
  'info.circle.fill': 'info',
  'lock.shield': 'security',
  'hand.raised': 'pan-tool',
  'calendar': 'event',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  'creditcard.fill': 'payment',
  'creditcard': 'payment',
  'location.fill': 'place',
  'location': 'place',
  'figure.run': 'directions-run',
  'folder.fill': 'folder',
  'moon.fill': 'nights-stay',
  'sun.max.fill': 'wb-sunny',
  'star.fill': 'star',
  'star': 'star-border',
  'line.3.horizontal': 'menu',

  // AI & Brain
  'brain.head.profile': 'psychology',

  // Parent Dashboard Specific Icons
  'heart.fill': 'favorite',
  'trophy.fill': 'emoji-events',
  'person.2.square.stack.fill': 'people',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * Provides a safe fallback if an icon name is unmapped.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapped = MAPPING[name];
  const safeName = mapped || 'help';
  if (!mapped) {
    // Log once per missing key to avoid noisy logs
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[IconSymbol] Unmapped icon name "${name}". Falling back to "${safeName}".`);
    }
  }
  return <MaterialIcons color={color} size={size} name={safeName} style={style} />;
}
