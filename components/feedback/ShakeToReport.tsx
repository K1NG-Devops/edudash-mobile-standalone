import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
 
import { Accelerometer } from 'expo-sensors'
import { usePathname, useRouter } from 'expo-router'

const THRESHOLD = 1.3
const DEBOUNCE_MS = 8000

export default function ShakeToReport() {
  const router = useRouter()
  const pathname = usePathname()
  const lastFiredRef = useRef(0)

  useEffect(() => {
    Accelerometer.setUpdateInterval(120)
    const sub = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
      const g = Math.sqrt(x * x + y * y + z * z)
      const now = Date.now()
      if (g > THRESHOLD && now - lastFiredRef.current > DEBOUNCE_MS) {
        lastFiredRef.current = now
        Alert.alert(
          'Send Feedback?',
          'Open the feedback form for this screen.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => router.push({ pathname: '/support/contact', params: { screen: pathname || '' } }) },
          ]
        )
      }
    })
    return () => { try { sub && sub.remove() } catch {} }
  }, [pathname])

  return null
}

