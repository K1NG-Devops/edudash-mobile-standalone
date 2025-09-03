import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/SimpleWorkingAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Colors } from '@/constants/Colors'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

interface AgeGroup { id: string; name: string }
interface Category { id: string; name: string }

enum Difficulty { Easy = 1, Medium = 2, Hard = 3 }

export default function ManualLessonCreateScreen() {
  const { colorScheme } = useTheme()
  const palette = Colors[colorScheme]
  const { profile, user } = useAuth()

  const preschoolId = profile?.preschool_id || ''
  const teacherId = profile?.id || ''

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium)
  const [ageGroupId, setAgeGroupId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const ageGroupsQuery = useQuery({
    queryKey: ['age_groups', preschoolId],
    queryFn: async () => {
      const { data, error } = await supabase.from('age_groups').select('id,name').eq('preschool_id', preschoolId)
      if (error) throw error
      return (data || []) as AgeGroup[]
    },
    enabled: !!preschoolId,
    staleTime: 60_000,
  })

  const categoriesQuery = useQuery({
    queryKey: ['lesson_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lesson_categories').select('id,name')
      if (error) throw error
      return (data || []) as Category[]
    },
    staleTime: 60_000,
  })

  const onSave = async () => {
    if (!title.trim()) { Alert.alert('Title required', 'Please enter a lesson title.'); return }
    if (!ageGroupId || !categoryId) { Alert.alert('Select details', 'Please select an age group and category.'); return }
    if (!preschoolId || !teacherId) { Alert.alert('Missing profile', 'Your account is missing required details.'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('lessons').insert({
        title: title.trim(),
        description: description.trim() || null,
        content: null,
        category_id: categoryId,
        age_group_id: ageGroupId,
        duration_minutes: Number(duration) || 30,
        difficulty_level: difficulty,
        is_public: false,
        preschool_id: preschoolId,
        created_by: teacherId,
        is_ai_generated: false,
      } as any).select('id').single()
      if (error) throw error
      Alert.alert('Saved', 'Lesson created successfully.', [
        { text: 'View lesson', onPress: () => router.replace(`/screens/lesson/${data?.id}`) },
        { text: 'Done', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not save lesson')
    } finally {
      setSaving(false)
    }
  }

  const ageOptions = ageGroupsQuery.data || []
  const catOptions = categoriesQuery.data || []

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: palette.outline }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ padding: 6 }}>
          <IconSymbol name="chevron.left" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>Create Lesson (Manual)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Title */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Title *</Text>
          <TextInput style={[styles.input, { color: palette.text }]} value={title} onChangeText={setTitle} placeholder="e.g., Shapes and Colors" placeholderTextColor={palette.textSecondary} />

          <Text style={[styles.label, { color: palette.textSecondary, marginTop: 12 }]}>Description</Text>
          <TextInput style={[styles.input, styles.multiline, { color: palette.text }]} value={description} onChangeText={setDescription} multiline placeholder="Brief description of the lesson" placeholderTextColor={palette.textSecondary} />
        </View>

        {/* Metadata */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Lesson details</Text>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Age Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {ageOptions.map((a) => (
              <TouchableOpacity key={a.id} style={[styles.chip, ageGroupId === a.id && styles.chipActive]} onPress={() => setAgeGroupId(a.id)}>
                <Text style={[styles.chipText, ageGroupId === a.id && styles.chipTextActive]}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {catOptions.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.chip, categoryId === c.id && styles.chipActive]} onPress={() => setCategoryId(c.id)}>
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Duration (minutes)</Text>
          <TextInput style={[styles.input, { color: palette.text }]} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="30" placeholderTextColor={palette.textSecondary} />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Difficulty</Text>
          <View style={styles.segmentRow}>
            {[{ id: Difficulty.Easy, label: 'easy' }, { id: Difficulty.Medium, label: 'medium' }, { id: Difficulty.Hard, label: 'challenging' }].map(opt => (
              <TouchableOpacity key={opt.id} style={[styles.segmentBtn, difficulty === opt.id && styles.segmentBtnActive]} onPress={() => setDifficulty(opt.id)}>
                <Text style={[styles.segmentText, difficulty === opt.id && styles.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: (!title.trim() || !ageGroupId || !categoryId || saving) ? '#9CA3AF' : '#10B981', opacity: saving ? 0.7 : 1 }]}
            disabled={!title.trim() || !ageGroupId || !categoryId || saving}
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save lesson"
          >
            <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Lesson'}</Text>
          </TouchableOpacity>
        </View>

        {(!ageGroupId || !categoryId) && (
          <Text style={{ color: '#EF4444', marginTop: 8 }}>Select an age group and category to continue.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#111827', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  segmentBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  segmentText: { color: '#111827', fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: '#FFFFFF' },
  primaryBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
})

