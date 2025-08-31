import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/SimpleWorkingAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Colors } from '@/constants/Colors'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LessonGenerator } from '@/components/ai/LessonGenerator'
import { lessonGenerator as LessonGeneratorService } from '@/lib/ai/lessonGenerator'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { FlashList } from '@shopify/flash-list'
import { supabase } from '@/lib/supabase'
import { TeacherDataService } from '@/lib/services/teacherDataService'
import { useSubscription, useFeatureAccess } from '@/contexts/SubscriptionContext'
import UpgradeModal from '@/components/subscription/UpgradeModal'
import { router } from 'expo-router'
import { requestShowInterstitial } from '@/lib/ads/adEvents'

interface AgeGroup { id: string; name: string }
interface Category { id: string; name: string }
interface ClassRow { id: string; name: string }
interface StudentRow { id: string; first_name: string; last_name: string; class_id: string | null; is_active: boolean | null }

export default function AILessonGeneratorScreen() {
  const { colorScheme } = useTheme()
  const palette = Colors[colorScheme]
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const { aiUsage } = useSubscription()
  const feature = useFeatureAccess('ai_lesson_generator')

  const [generated, setGenerated] = useState<any | null>(null)
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null)
  const [publishNow, setPublishNow] = useState<boolean>(true)
  const [picker, setPicker] = useState<{ ageGroupId: string | null; categoryId: string | null }>({ ageGroupId: null, categoryId: null })
  const [assignUI, setAssignUI] = useState<{ mode: 'class' | 'students'; classId: string | null; selected: Set<string> }>({ mode: 'class', classId: null, selected: new Set() })
  const [assigning, setAssigning] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const preschoolId = profile?.preschool_id || ''
  const authUserId = profile?.auth_user_id || user?.id || ''
  const teacherIdForLists = profile?.id || '' // DB user id

  // Gating: if user has no access at all (not even free tier), show upgrade modal entry.
  const canUseAIFreeQuota = feature.canUseAI
  const showFreeLeft = aiUsage ? (aiUsage.monthlyLimit === -1 ? '∞' : Math.max(0, aiUsage.monthlyLimit - aiUsage.currentUsage)) : '—'

  // Queries: age groups, categories, classes, students (lazy)
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

  const classesQuery = useQuery({
    queryKey: ['teacher_classes', teacherIdForLists],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id,name')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true)
      if (error) throw error
      return (data || []) as ClassRow[]
    },
    enabled: !!preschoolId,
    staleTime: 60_000,
  })

  const studentsQuery = useQuery({
    queryKey: ['students', preschoolId, assignUI.classId],
    queryFn: async () => {
      let q = supabase.from('students').select('id,first_name,last_name,class_id,is_active').eq('preschool_id', preschoolId).eq('is_active', true)
      if (assignUI.classId) q = q.eq('class_id', assignUI.classId)
      const { data, error } = await q
      if (error) throw error
      return (data || []) as StudentRow[]
    },
    enabled: !!preschoolId && assignUI.mode === 'students',
    staleTime: 60_000,
  })

  const onGenerated = (lesson: any) => {
    setGenerated(lesson)
  }

  const mapDifficulty = (s: 'easy' | 'medium' | 'challenging'): number => (s === 'easy' ? 1 : s === 'medium' ? 2 : 3)

  const saveLesson = async () => {
    if (!generated) {
      Alert.alert('Nothing to save', 'Please generate a lesson first.')
      return
    }
    if (!picker.ageGroupId || !picker.categoryId) {
      Alert.alert('Select details', 'Please select an age group and category before saving.')
      return
    }
    try {
      const res = await LessonGeneratorService.saveGeneratedLesson({
        lesson: generated,
        teacherId: profile?.id || '',
        preschoolId: preschoolId,
        ageGroupId: picker.ageGroupId,
        categoryId: picker.categoryId,
        template: undefined,
      } as any)
      if (!res || !(res as any).success) {
        Alert.alert('Save failed', 'Could not save lesson.')
        return
      }
      const lessonId = (res as any).lessonId || (res as any).id || null
      if (!lessonId) {
        Alert.alert('Saved (id unknown)', 'Lesson saved but ID could not be determined.')
      }
      setSavedLessonId(lessonId)
      Alert.alert('Saved', 'Lesson saved successfully.')
      try { requestShowInterstitial({ reason: 'lesson-saved' }) } catch {}
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unknown error')
    }
  }

  const assignLesson = async () => {
    if (!savedLessonId) {
      Alert.alert('Save first', 'Please save the lesson before assigning.')
      return
    }
    setAssigning(true)
    try {
      const title: string = generated?.title || 'Lesson'
      const description: string = generated?.description || generated?.content || ''
      const estimated = (() => {
        const acts = Array.isArray(generated?.activities) ? generated.activities : []
        const total = acts.reduce((sum: number, a: any) => sum + (Number(a?.estimatedTime || 0)), 0)
        return total || 30
      })()

      const result = await TeacherDataService.assignLesson(authUserId, {
        lessonId: savedLessonId,
        classId: assignUI.mode === 'class' ? assignUI.classId || undefined : undefined,
        studentIds: assignUI.mode === 'students' ? Array.from(assignUI.selected) : undefined,
        title,
        description,
        dueDateOffsetDays: 3,
        estimatedTimeMinutes: estimated,
        isRequired: true,
        difficultyLevel: 'medium',
        materialsNeeded: Array.isArray(generated?.activities)
          ? Array.from(new Set((generated.activities as any[]).flatMap((a: any) => a?.materials || [])))
          : [],
      })

      if ((result as any)?.success) {
        Alert.alert('Assigned', 'Lesson assigned successfully to your selection.')
        try { requestShowInterstitial({ reason: 'lesson-assigned' }) } catch {}
      } else {
        Alert.alert('Assign failed', (result as any)?.error || 'Could not assign lesson.')
      }
    } catch (e: any) {
      Alert.alert('Assign failed', e?.message || 'Unknown error')
    } finally {
      setAssigning(false)
    }
  }

  // UI helpers
  const ageOptions = ageGroupsQuery.data || []
  const catOptions = categoriesQuery.data || []
  const classes = classesQuery.data || []
  const students = studentsQuery.data || []

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: palette.outline }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>AI Lesson Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      {!feature.hasAccess && !feature.canUseAI ? (
        <View style={styles.centerContent}>
          <Text style={{ color: palette.text, marginBottom: 8 }}>AI Lesson Generator requires an upgrade.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => setShowUpgrade(true)}>
            <Text style={styles.primaryBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Free usage counter (informational only) */}
          <View style={[styles.usagePill, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#EEF2FF', borderColor: '#8B5CF6' }]}> 
            <IconSymbol name="bolt.fill" size={14} color="#8B5CF6" />
            <Text style={{ marginLeft: 6, color: palette.textSecondary }}>AI free usage left: {String(showFreeLeft)}</Text>
          </View>

          {/* Generation UI */}
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>1) Create your lesson</Text>
            <LessonGenerator
              userId={authUserId}
              preschoolId={preschoolId}
              onLessonGenerated={onGenerated}
              onClose={() => router.back()}
            />
          </View>

          {/* Save & metadata */}
          {!!generated && (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>2) Save & publish</Text>
              <View style={{ marginVertical: 8 }}>
                <Text style={[styles.label, { color: palette.textSecondary }]}>Age Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {ageOptions.map((a) => (
                    <TouchableOpacity key={a.id} style={[styles.chip, picker.ageGroupId === a.id && styles.chipActive]} onPress={() => setPicker(prev => ({ ...prev, ageGroupId: a.id }))}>
                      <Text style={[styles.chipText, picker.ageGroupId === a.id && styles.chipTextActive]}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.label, { color: palette.textSecondary }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  {catOptions.map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.chip, picker.categoryId === c.id && styles.chipActive]} onPress={() => setPicker(prev => ({ ...prev, categoryId: c.id }))}>
                      <Text style={[styles.chipText, picker.categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setPublishNow(v => !v)} style={[styles.checkbox, publishNow && styles.checkboxChecked]} accessibilityRole="checkbox" accessibilityLabel="Publish now"/>
                  <Text style={{ marginLeft: 8, color: palette.text }}>Publish now</Text>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity 
                    style={[
                      styles.primaryBtn, 
                      { 
                        backgroundColor: (!picker.ageGroupId || !picker.categoryId) ? '#9CA3AF' : '#10B981',
                        opacity: (!picker.ageGroupId || !picker.categoryId) ? 0.7 : 1
                      }
                    ]} 
                    onPress={saveLesson}
                    disabled={!picker.ageGroupId || !picker.categoryId}
                  >
                    <Text style={styles.primaryBtnText}>Save Lesson</Text>
                  </TouchableOpacity>
                </View>
                {(!picker.ageGroupId || !picker.categoryId) && (
                  <Text style={[styles.helpText, { color: '#EF4444', marginTop: 8 }]}>
                    Please select both an age group and category above to save your lesson.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Assign */}
          {!!savedLessonId && (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>3) Assign</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TouchableOpacity style={[styles.toggle, assignUI.mode === 'class' && styles.toggleActive]} onPress={() => setAssignUI(prev => ({ ...prev, mode: 'class' }))}>
                  <Text style={[styles.toggleText, assignUI.mode === 'class' && styles.toggleTextActive]}>Entire class</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggle, assignUI.mode === 'students' && styles.toggleActive]} onPress={() => setAssignUI(prev => ({ ...prev, mode: 'students' }))}>
                  <Text style={[styles.toggleText, assignUI.mode === 'students' && styles.toggleTextActive]}>Specific students</Text>
                </TouchableOpacity>
              </View>

              {assignUI.mode === 'class' ? (
                <View>
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Select class</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    {classes.map((cls) => (
                      <TouchableOpacity key={cls.id} style={[styles.chip, assignUI.classId === cls.id && styles.chipActive]} onPress={() => setAssignUI(prev => ({ ...prev, classId: cls.id }))}>
                        <Text style={[styles.chipText, assignUI.classId === cls.id && styles.chipTextActive]}>{cls.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={{ height: 240 }}>
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Pick students</Text>
                  <FlashList
                    data={students}
                    estimatedItemSize={56}
                    renderItem={({ item }) => {
                      const selected = assignUI.selected.has(item.id)
                      return (
                        <TouchableOpacity style={[styles.studentRow, selected && styles.studentRowActive]} onPress={() => {
                          setAssignUI(prev => {
                            const s = new Set(prev.selected)
                            if (s.has(item.id)) s.delete(item.id); else s.add(item.id)
                            return { ...prev, selected: s }
                          })
                        }}>
                          <Text style={{ color: palette.text }}>{item.first_name} {item.last_name}</Text>
                          {selected && <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />}
                        </TouchableOpacity>
                      )
                    }}
                  />
                </View>
              )}

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#3B82F6', opacity: assigning ? 0.6 : 1 }]} disabled={assigning} onPress={assignLesson}>
                  <Text style={styles.primaryBtnText}>{assigning ? 'Assigning…' : 'Assign Lesson'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Resources */}
          {!!savedLessonId && (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>4) Resources</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <TouchableOpacity style={[styles.secondaryBtn]} onPress={async () => {
                  try {
                    const deep = `edudashpro://lesson/${savedLessonId}`
                    const web = `https://www.edudashpro.org.za/lesson/${savedLessonId}`
                    await supabase.from('message_drafts').insert({
                      user_id: profile?.id || '',
                      preschool_id: preschoolId,
                      subject: 'New Lesson Available',
                      content: `A new lesson is available: ${generated?.title || 'Lesson'}.\nApp: ${deep}\nWeb: ${web}`,
                      message_type: 'announcement',
                      recipient_data: null,
                    } as any)
                    Alert.alert('Draft created', 'Parent announcement draft created.')
                  } catch { Alert.alert('Could not create draft') }
                }}>
                  <IconSymbol name="paperplane.fill" size={18} color="#3B82F6" />
                  <Text style={styles.secondaryBtnText}>Share to parents</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => {
                  if (Platform.OS === 'web') {
                    try { window.print() } catch {}
                  } else {
                    Alert.alert('Print', 'Printing is coming soon to mobile. You can export from web today.')
                  }
                }}>
                  <IconSymbol name="printer.fill" size={18} color="#111827" />
                  <Text style={styles.secondaryBtnText}>Print / Export</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.secondaryBtn]} onPress={async () => {
                  try {
                    const mats = Array.isArray(generated?.activities)
                      ? Array.from(new Set((generated.activities as any[]).flatMap((a: any) => a?.materials || [])))
                      : []
                    const text = mats.length ? mats.join(', ') : 'No materials listed.'
                    const { default: Clipboard } = await import('expo-clipboard')
                    await Clipboard.setStringAsync(text)
                    Alert.alert('Copied', 'Materials list copied to clipboard')
                  } catch {}
                }}>
                  <IconSymbol name="doc.on.doc" size={18} color="#111827" />
                  <Text style={styles.secondaryBtnText}>Copy materials</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <UpgradeModal visible={showUpgrade} featureName={'AI Lesson Generator'} featureDescription={'Unlock unlimited AI and advanced tools'} onClose={() => setShowUpgrade(false)} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 6 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  usagePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 12, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#CBD5E1', marginRight: 8 },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#FFFFFF' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#9CA3AF' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  primaryBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  toggle: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, alignItems: 'center', marginRight: 8 },
  toggleActive: { backgroundColor: '#E5E7EB' },
  toggleText: { color: '#111827', fontWeight: '600' },
  toggleTextActive: { color: '#111827' },
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  studentRowActive: { backgroundColor: '#F0FDF4' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginRight: 8, marginBottom: 8 },
  secondaryBtnText: { marginLeft: 8, color: '#111827', fontWeight: '600' },
  helpText: { fontSize: 12, fontStyle: 'italic' },
})
