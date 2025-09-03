import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/contexts/ThemeContext'
import { Colors } from '@/constants/Colors'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LessonDetailsScreen() {
  const { colorScheme } = useTheme()
  const palette = Colors[colorScheme]
  const params = useLocalSearchParams<{ id: string }>()
  const lessonId = String(params.id || '')

  const [lesson, setLesson] = useState<any | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data: l, error: le } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
        if (le) throw le
        const { data: acts, error: ae } = await supabase
          .from('activities')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('sequence_order', { ascending: true })
        if (ae) throw ae
        if (mounted) {
          setLesson(l)
          setActivities((acts || []) as any[])
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }
    if (lessonId) load()
    return () => { mounted = false }
  }, [lessonId])

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.mt8, { color: palette.textSecondary }]}>Loading lesson…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: palette.error }}>{error || 'Lesson not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, { backgroundColor: palette.primary }]}>
            <Text style={styles.btnTextLight}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: palette.outline }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <IconSymbol name="chevron.left" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>Lesson Details</Text>
        <TouchableOpacity
          onPress={() => router.push(`/screens/assign-homework?lessonId=${lessonId}`)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Assign homework"
        >
          <IconSymbol name="paperplane.fill" size={20} color={palette.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentPadding}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}> 
          <Text style={[styles.lessonTitle, { color: palette.text }]}>{lesson.title}</Text>
          {lesson.description && <Text style={[styles.lessonDesc, { color: palette.textSecondary }]}>{lesson.description}</Text>}
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>Duration: {lesson.duration_minutes ?? '—'} min</Text>
            {lesson.difficulty_level && (
              <Text style={[styles.meta, { color: palette.textSecondary }]}>Level: {String(lesson.difficulty_level)}</Text>
            )}
          </View>
          {lesson.content && (
            <View style={styles.mt12}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Lesson Content</Text>
              <Text style={[styles.lh20, { color: palette.textSecondary }]}>{lesson.content}</Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}> 
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Activities ({activities.length})</Text>
          {activities.length === 0 ? (
            <Text style={{ color: palette.textSecondary }}>No activities captured.</Text>
          ) : (
            activities.map((a, idx) => (
              <View key={a.id || idx} style={styles.activity}>
                <Text style={[styles.activityTitle, { color: palette.text }]}>{a.title}</Text>
                {a.description && <Text style={[styles.mt2, { color: palette.textSecondary }]}>{a.description}</Text>}
                {a.instructions && <Text style={[styles.mt6, { color: palette.textSecondary }]}>Instructions: {a.instructions}</Text>}
                <View style={styles.rowMt6}>
                  <Text style={[
                    styles.pill,
                    colorScheme === 'dark' ? styles.pillBlueBgDark : styles.pillBlueBgLight,
                    styles.pillBlueText
                  ]}>⏱ {a.estimated_time ?? '—'} min</Text>
                  {!!a.materials && (
                    <Text style={[
                      styles.pill,
                      colorScheme === 'dark' ? styles.pillGreenBgDark : styles.pillGreenBgLight,
                      styles.pillGreenText
                    ]}>Materials: {a.materials}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 16 },
  lessonTitle: { fontSize: 18, fontWeight: '700' },
  lessonDesc: { marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  meta: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  activity: { paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  activityTitle: { fontSize: 14, fontWeight: '700' },
  pill: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 8 },
  retryBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  // Utilities
  iconBtn: { padding: 6 },
  contentPadding: { padding: 16 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt2: { marginTop: 2 },
  mt6: { marginTop: 6 },
  rowMt6: { flexDirection: 'row', marginTop: 6 },
  lh20: { lineHeight: 20 },
  btnTextLight: { color: '#fff', fontWeight: '700' },
  pillBlueBgDark: { backgroundColor: '#0F172A' },
  pillBlueBgLight: { backgroundColor: '#EEF2FF' },
  pillBlueText: { color: '#3B82F6' },
  pillGreenBgDark: { backgroundColor: '#052E2B' },
  pillGreenBgLight: { backgroundColor: '#ECFDF5' },
  pillGreenText: { color: '#059669' },
})

