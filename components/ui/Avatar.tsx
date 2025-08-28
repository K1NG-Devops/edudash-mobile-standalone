import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { DesignSystem } from '@/constants/DesignSystem'

interface AvatarProps {
  size?: number
  name?: string
  imageUri?: string | null
  backgroundColor?: string
  rounded?: boolean
  badge?: React.ReactNode
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || first.toUpperCase() || '?'
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 48,
  name = 'User',
  imageUri = null,
  backgroundColor,
  rounded = true,
  badge,
}) => {
  const dimension = { width: size, height: size, borderRadius: rounded ? size / 2 : DesignSystem.borderRadius.lg }
  const bg = backgroundColor || (DesignSystem.components?.avatar?.background as string) || '#1f2937'
  const borderColor = (DesignSystem.components?.avatar?.border as string) || 'rgba(255,255,255,0.08)'

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={name} style={[styles.container, dimension]}> 
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, dimension]} resizeMode="cover" />
      ) : (
        <View style={[styles.fallback, dimension, { backgroundColor: bg, borderColor }]}> 
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
        </View>
      )}
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
  },
})

export default Avatar

