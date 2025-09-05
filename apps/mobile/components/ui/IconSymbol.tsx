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
  'chevron.down': 'expand-more',
  'chevron.up': 'expand-less',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left.slash.chevron.right': 'code', // alias used in some components
  'arrow.up.right': 'trending-up',
  'arrow.up': 'arrow-upward',
  'magnifyingglass': 'search',
  'xmark': 'close',
  'xmark.circle': 'cancel',
  'hourglass': 'hourglass-bottom',
  'hourglass.circle': 'hourglass-bottom',
  'hourglass.circle.fill': 'hourglass-full',
  // Additional list/navigation helpers
  'list.bullet': 'format-list-bulleted',

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
  'doc.fill': 'description',
  'document': 'description',
  'building.2.fill': 'business',
  'building.2': 'business',
  'building.columns.fill': 'account-balance',

  // Analytics & Charts
  'chart.bar.fill': 'bar-chart',
  'chart.bar': 'bar-chart',
  'chart.pie': 'pie-chart',
  'chart.pie.fill': 'pie-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'dollarsign.circle.fill': 'attach-money',
  'dollarsign': 'attach-money',

  // Communication
  'message.fill': 'message',
  'bubble.left.and.bubble.right': 'forum',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'clock': 'schedule',
  'megaphone.fill': 'campaign',
  'megaphone': 'campaign',
  'envelope.fill': 'email',
  'envelope': 'email',
  'newspaper.fill': 'article',
  'phone': 'phone',
  'video': 'videocam',
  'ellipsis.horizontal': 'more-horiz',
  'ellipsis': 'more-horiz',

  // Media & Devices
'video.fill': 'videocam',
  'gamecontroller.fill': 'sports-esports',
  'camera.fill': 'photo-camera',
  'photo': 'photo',
  'play.fill': 'play-arrow',
  'dot.radiowaves.left.and.right': 'wifi-tethering',
  'paintbrush.fill': 'brush',

  // Actions
  'flag.fill': 'flag',
'plus.circle.fill': 'add-circle',
  'plus.app': 'add',
  'plus': 'add',
  'minus.circle.fill': 'remove-circle',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle',
  'checkmark.seal.fill': 'verified',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.circle': 'error-outline',
  'clock.fill': 'schedule',
  'qrcode.viewfinder': 'qr-code-scanner',
  'sparkles': 'auto-awesome',
'wand.and.stars': 'auto-awesome',
  'trash': 'delete',
  'trash.fill': 'delete-forever',
  'trash.circle': 'delete-forever',
  'xmark.circle.fill': 'highlight-off',
  'phone.fill': 'phone',
  'lock.fill': 'lock',
  'lock': 'lock',
  'mic': 'mic',
  'mic.fill': 'mic',
  'stop': 'stop',
  'smiley': 'insert-emoticon',
  'face.smiling': 'insert-emoticon',
  'face.smiling.fill': 'insert-emoticon',
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
  'arrow.counterclockwise': 'refresh',
  'snack.circle': 'local-dining',
  'tray': 'inbox',

  // Family
  'figure.2.and.child.holdinghands': 'family-restroom',

  // Settings & Info
  'questionmark.circle': 'help',
  'questionmark.circle.fill': 'help',
  'info.circle': 'info',
  'info.circle.fill': 'info',
  'lock.shield': 'security',
  'exclamationmark.shield': 'security',
  'hand.raised': 'pan-tool',
  'calendar': 'event',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  'gear': 'settings',
  'gear.fill': 'settings',
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
  'ellipsis.vertical': 'more-vert',

  // AI & Brain
  'brain': 'psychology',
  'brain.head.profile': 'psychology',
  'cpu': 'memory',
  // Medical/diagnostics
  'stethoscope': 'medical-services',
  'doc.text.below.ecg': 'insert-chart',
  // Stars
  'star.circle': 'star',
  'lightbulb': 'lightbulb',
'bolt': 'flash-on',
  'bolt.fill': 'flash-on',
  'bolt.slash': 'flash-off',

  // Parent Dashboard Specific Icons
'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'trophy.fill': 'emoji-events',
  'crown.fill': 'workspace-premium',
  'person.2.square.stack.fill': 'people',

  // Additional missing icons
'wrench': 'build',
  'wrench.and.screwdriver.fill': 'build',
  'mail': 'mail',
  'checkmark': 'check',
  'x': 'close',
  'arrow.right': 'arrow-forward',
  'rectangle.3.group.fill': 'dashboard',
  'rectangle.3.group': 'dashboard',
  'rectangle.and.pencil.and.ellipsis': 'edit',
  'shield.checkered': 'security',
  'shield.fill': 'security',
'square.grid.2x2': 'grid-view',
  'square.grid.2x2.fill': 'grid-view',
  'square.grid2x2': 'grid-view',
  'square.grid2x2.fill': 'grid-view',
  'ticket': 'confirmation-number',
  'paperclip': 'attach-file',
  'eye': 'visibility',
  'book.closed': 'menu-book',
  'book.pages': 'menu-book',
  'chart.bar.xaxis': 'bar-chart',
  'person.2.badge.gearshape': 'manage-accounts',
  'doc.badge.plus': 'post-add',
};

// Track dev-only warnings for unmapped icons
const warnedUnmapped = new Set<string>();

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
  if (!mapped && process.env.NODE_ENV !== 'production') {
    if (!warnedUnmapped.has(name)) {
      console.warn(`[IconSymbol] Unmapped icon "${name}". Falling back to "${safeName}".`);
      warnedUnmapped.add(name);
    }
  }
  return <MaterialIcons color={color} size={size} name={safeName} style={style} />;
}
