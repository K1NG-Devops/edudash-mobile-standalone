import { Platform } from 'react-native';

/**
 * Cross-platform shadow helper
 * - On native (iOS/Android): returns shadowColor/Offset/Opacity/Radius + elevation
 * - On web: returns CSS boxShadow via style.boxShadow
 */
export function shadow(depth: 0 | 1 | 2 | 3 | 4 | 6 | 8 = 2, color = '#000000') {
  // Material-ish z-depth presets
  const presets: Record<number, { y: number; blur: number; spread: number; opacity: number; elevation: number }> = {
    0: { y: 0, blur: 0, spread: 0, opacity: 0, elevation: 0 },
    1: { y: 1, blur: 3, spread: 0, opacity: 0.12, elevation: 1 },
    2: { y: 2, blur: 6, spread: 0, opacity: 0.16, elevation: 2 },
    3: { y: 3, blur: 12, spread: 1, opacity: 0.18, elevation: 3 },
    4: { y: 4, blur: 16, spread: 2, opacity: 0.2, elevation: 4 },
    6: { y: 6, blur: 24, spread: 2, opacity: 0.22, elevation: 6 },
    8: { y: 8, blur: 32, spread: 4, opacity: 0.24, elevation: 8 },
  };
  const p = presets[depth] || presets[2];

  if (Platform.OS === 'web') {
    const rgba = hexToRgba(color, p.opacity);
    return {
      boxShadow: `0 ${p.y}px ${p.blur}px ${p.spread}px ${rgba}`,
    } as const;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: p.y },
    shadowOpacity: p.opacity,
    shadowRadius: p.blur / 2,
    elevation: p.elevation,
  } as const;
}

function hexToRgba(hex: string, alpha: number) {
  // support #rgb and #rrggbb
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

