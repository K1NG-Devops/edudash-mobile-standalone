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
  'person.fill': 'person',
  'person': 'person',
  'person.3.fill': 'group',
  'person.2.fill': 'people',
  'person.2.badge.plus': 'person-add',
  'person.crop.circle.badge.plus': 'person-add',
  'rectangle.portrait.and.arrow.right': 'logout',

  // Education
  'book.fill': 'book',
  'book': 'menu-book',
  'graduationcap.fill': 'school',
  'graduationcap': 'school',
  'doc.text.fill': 'description',
  'doc.text': 'description',
  'building.2.fill': 'business',
  'building.2': 'business',

  // Analytics & Charts
  'chart.bar.fill': 'bar-chart',
  'chart.bar': 'bar-chart',
  // removed duplicate mapping; keep single entry below
  'chart.pie': 'pie-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'dollarsign.circle.fill': 'attach-money',
  'dollarsign': 'attach-money',

  // Communication
  'message.fill': 'message',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'clock': 'schedule',
  'megaphone.fill': 'campaign',
  'megaphone': 'campaign',
  'envelope.fill': 'email',
  'envelope': 'email',

  // Media & Devices
  'video.fill': 'videocam',
  'gamecontroller.fill': 'sports-esports',

  // Actions
  'flag.fill': 'flag',
  'plus.circle.fill': 'add-circle',
  'plus.app': 'add',
  'plus': 'add',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  'clock.fill': 'schedule',
  'qrcode.viewfinder': 'qr-code-scanner',
  'sparkles': 'auto-awesome',
  'trash': 'delete',
'phone.fill': 'phone',
  'lock.fill': 'lock',
  'lock': 'lock',
  'person.2': 'people',
  'person.badge.plus': 'person-add',
  'person.3.sequence.fill': 'groups',
  'person.3': 'groups',
  'gear.badge': 'settings',
  'chart.bar.doc.horizontal': 'bar-chart',
  'video.bubble.left.fill': 'video-call',
  'arrow.right.circle.fill': 'arrow-forward',
  'eye.fill': 'visibility',
  'person.fill.checkmark': 'verified-user',
  'person.badge.shield.checkmark': 'verified-user',
  'person.fill.xmark': 'person-remove',
  'person.badge.minus': 'person-remove',
  'person.slash': 'block',
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
  'exclamationmark.shield': 'security',
  'hand.raised': 'pan-tool',
  'calendar': 'event',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  'gear': 'settings',
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
  'globe': 'public',
  'globe.americas': 'public',

  // AI & Brain
  'brain.head.profile': 'psychology',
  'cpu': 'memory',

  // Parent Dashboard Specific Icons
  'heart.fill': 'favorite',
  'trophy.fill': 'emoji-events',
  'person.2.square.stack.fill': 'people',

  // Additional missing icons
  'wrench': 'build',
  'mail': 'mail',
  'checkmark': 'check',
  'x': 'close',
  'arrow.right': 'arrow-forward',
  'trash.fill': 'delete-forever',
  'document': 'description',
  'rectangle.3.group.fill': 'dashboard',
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
      // Removed debug statement: console.warn(`[IconSymbol] Unmapped icon name "${name}". Falling back to "${safeName}".`);
    }
  }
  return <MaterialIcons color={color} size={size} name={safeName} style={style} />;
}
