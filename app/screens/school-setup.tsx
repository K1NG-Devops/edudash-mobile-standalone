import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PrincipalService } from '@/lib/services/principalService';
import { router } from 'expo-router';
import { SchoolManagementService } from '@/lib/services/schoolManagementService';
import { TeacherService } from '@/lib/services/teacherService';
import { supabase } from '@/lib/supabase';

interface ClassDraft {
  id?: string;
  name: string;
  max_capacity: number;
  room_number?: string;
  teacher_id?: string | null;
}

export default function SchoolSetupScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1 as 1 | 2 | 3 | 4);
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [classesDraft, setClassesDraft] = useState<ClassDraft[]>([]);
  const [existingClasses, setExistingClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const preschoolId = profile?.preschool_id || '';
  const schoolId = preschoolId || resolvedSchoolId || '';

  const canProceed = useMemo(() => {
    if (step === 1) return !!school;
    if (step === 2) return classesDraft.length > 0 && classesDraft.every(c => c.name.trim().length > 0 && c.max_capacity > 0);
    if (step === 3) return true; // optional assignments
    if (step === 4) return true;
    return false;
  }, [step, school, classesDraft]);

  useEffect(() => {
    const inferSchoolId = async () => {
      if (preschoolId || !profile?.id) return;
      try {
        // 1) teacher_invitations by invited_by
        const { data: tInvite } = await supabase
          .from('teacher_invitations')
          .select('preschool_id, created_at')
          .eq('invited_by', profile.id)
          .not('preschool_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (tInvite?.preschool_id) { setResolvedSchoolId(tInvite.preschool_id as string); return; }
        // 2) invitation_codes by invited_by
        const { data: inviteCode } = await supabase
          .from('invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (inviteCode?.preschool_id) { setResolvedSchoolId(inviteCode.preschool_id as string); return; }
        // 3) school_invitation_codes by invited_by
        const { data: schoolCode } = await supabase
          .from('school_invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (schoolCode?.preschool_id) { setResolvedSchoolId(schoolCode.preschool_id as string); return; }
      } catch {
        // ignore
      }
    };
    inferSchoolId();
  }, [preschoolId, profile?.id]);

  useEffect(() => {
    const load = async () => {
      if (!schoolId) return;
      setLoading(true);
      try {
        const info = await PrincipalService.getSchoolInfo(schoolId);
        if (!info.error) setSchool(info.data);

        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name, max_capacity, current_enrollment, room_number, teacher_id')
          .eq('preschool_id', schoolId)
          .eq('is_active', true)
          .order('name');
        setExistingClasses(classesData || []);

        const teachersRes = await TeacherService.getTeachersByPreschool(schoolId);
        setTeachers(teachersRes.data || []);

        // Auto-step to the next incomplete step on first load
        if (!initialized) {
          const hasSchool = !!info?.data;
          const classCount = (classesData || []).length;
          const allAssigned = (classesData || []).length > 0 && (classesData || []).every((c: any) => !!c.teacher_id);
          if (!hasSchool) {
            setStep(1);
          } else if (classCount === 0) {
            setStep(2);
          } else if (!allAssigned) {
            setStep(3);
          } else {
            setStep(4);
          }
          setInitialized(true);
        }
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId, initialized]);

  const addClassDraft = () => {
    setClassesDraft(prev => [...prev, { name: `Class ${prev.length + 1}`, max_capacity: 20 }]);
  };

  const updateClassDraft = (index: number, patch: Partial<ClassDraft>) => {
    setClassesDraft(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c));
  };

  const removeClassDraft = (index: number) => {
    setClassesDraft(prev => prev.filter((_, i) => i !== index));
  };

  const saveClasses = async () => {
    if (!schoolId || classesDraft.length === 0) return;
    setLoading(true);
    try {
      for (const c of classesDraft) {
        const res = await SchoolManagementService.createClass({
          name: c.name.trim(),
          teacher_id: c.teacher_id || null as any,
          age_group_id: null as any,
          max_capacity: c.max_capacity,
          room_number: c.room_number,
          preschool_id: schoolId,
        } as any);
        if (!res.success) {
          throw new Error(res.error || 'Failed to create class');
        }
      }
      setClassesDraft([]);
      // reload
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, max_capacity, current_enrollment, room_number, teacher_id')
        .eq('preschool_id', schoolId)
        .eq('is_active', true)
        .order('name');
      setExistingClasses(classesData || []);
      setStep(3);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create classes');
    } finally {
      setLoading(false);
    }
  };

  const assignTeacher = async (classId: string, teacherId: string | null) => {
    setLoading(true);
    try {
      if (teacherId) {
        await TeacherService.assignTeacherToClass(teacherId, classId);
      } else {
        await TeacherService.removeTeacherFromClass(classId);
      }
      // update local
      setExistingClasses(prev => prev.map(c => c.id === classId ? { ...c, teacher_id: teacherId } : c));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to assign teacher');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!schoolId) {
      Alert.alert('No school selected', 'Link your profile to a school in Step 1 before completing setup.');
      return;
    }
    setLoading(true);
    try {
      const res = await SchoolManagementService.completeOnboarding(schoolId);
      if (res?.success) {
        Alert.alert(
          'Setup Complete',
          'Your school setup is complete. You can adjust settings any time in School Settings.',
          [
            { text: 'School Settings', onPress: () => router.push('/screens/school-settings' as any) },
            { text: 'Go to Dashboard', onPress: () => router.push('/(tabs)/dashboard' as any) }
          ]
        );
      } else {
        Alert.alert('Error', res?.error || 'Failed to complete setup');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const renderStepHeader = () => (
    <View style={[styles.stepHeader, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
      {[1,2,3,4].map((i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepCircle, step === i && styles.stepCircleActive]}>
            <Text style={[styles.stepCircleText, step === i && styles.stepCircleTextActive]}>{i}</Text>
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#CBD5E1' : '#6B7280' }]}>
            {i === 1 && 'School Info'}
            {i === 2 && 'Create Classes'}
            {i === 3 && 'Assign Teachers'}
            {i === 4 && 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={[styles.card, { backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>School Information</Text>
      {school ? (
        <>
          <Row label="School Name" value={school.name} />
          <Row label="Email" value={school.email || '—'} />
          <Row label="Phone" value={school.phone || '—'} />
          <Row label="Address" value={school.address || '—'} />
          <Row label="Subscription" value={school.subscription_status || '—'} />
          {!preschoolId && schoolId && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.hint, { color: isDark ? '#F59E0B' : '#92400E' }]}>Your profile isn’t linked yet. You can link it now.</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8 }]}
                onPress={async () => {
                  try {
                    await supabase.from('users').update({ preschool_id: schoolId }).eq('id', profile!.id);
                    Alert.alert('Linked', 'Your profile has been linked to this school.');
                  } catch (e: any) {
                    Alert.alert('Failed', e?.message || 'Could not link automatically. Please contact support or use an admin tool.');
                  }
                }}
              >
                <IconSymbol name="link" size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Link my profile to this school</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}
              onPress={() => router.push('/screens/school-settings' as any)}
            >
              <IconSymbol name="gearshape" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
              <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Edit in School Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn]} onPress={() => setStep(2)}>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>No school linked or inferred. Create/Invite from Dashboard or contact support.</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={[styles.card, { backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Create Classes</Text>

      {existingClasses.length > 0 && (
        <>
          <View style={[styles.notice, { backgroundColor: isDark ? '#0F172A' : '#FEF3C7', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
            <IconSymbol name="info.circle" size={16} color={isDark ? '#FCD34D' : '#CA8A04'} />
            <Text style={[styles.noticeText, { color: isDark ? '#E5E7EB' : '#7C2D12' }]}>We detected existing classes. You can skip creating new ones and continue to assign teachers.</Text>
          </View>
          <View style={[styles.existingBox, { borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
            <Text style={[styles.subTitle, { color: isDark ? '#CBD5E1' : '#1F2937' }]}>Existing Classes</Text>
            {existingClasses.map(c => (
              <Text key={c.id} style={[styles.smallRow, { color: isDark ? '#94A3B8' : '#4B5563' }]}>• {c.name} — {c.current_enrollment}/{c.max_capacity}</Text>
            ))}
          </View>
        </>
      )}

      {classesDraft.map((c, i) => (
        <View key={i} style={[styles.classRow, { borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <TextInput
            placeholder="Class name"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            value={c.name}
            onChangeText={t => updateClassDraft(i, { name: t })}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB' }]}
          />
          <TextInput
            placeholder="Capacity"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            keyboardType="number-pad"
            value={String(c.max_capacity || '')}
            onChangeText={t => updateClassDraft(i, { max_capacity: Number(t || 0) })}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB' }]}
          />
          <TextInput
            placeholder="Room"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            value={c.room_number || ''}
            onChangeText={t => updateClassDraft(i, { room_number: t })}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB' }]}
          />
          <TouchableOpacity onPress={() => removeClassDraft(i)} style={styles.removeBtn}>
            <IconSymbol name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addClassDraft} style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}>
        <IconSymbol name="plus" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
        <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Add Class</Text>
      </TouchableOpacity>

      <View style={[styles.actionsRow, { gap: 8 }]}>
        <TouchableOpacity style={[styles.ghostBtn]} onPress={() => setStep(1)}>
          <IconSymbol name="chevron.left" size={16} color={isDark ? '#CBD5E1' : '#4B5563'} />
          <Text style={[styles.ghostBtnText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Back</Text>
        </TouchableOpacity>
        {existingClasses.length > 0 && classesDraft.length === 0 && (
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]} onPress={() => setStep(3)}>
            <IconSymbol name="chevron.right" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
            <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Skip to Assign Teachers</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.primaryBtn, !canProceed && styles.primaryBtnDisabled]} onPress={saveClasses} disabled={!canProceed || loading}>
          <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Save Classes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={[styles.card, { backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Assign Teachers</Text>
      {existingClasses.length === 0 ? (
        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>No classes yet. Add classes first.</Text>
      ) : (
        <>
          {/* Helpers when teacher list is empty or profile not linked */}
          {teachers.length === 0 && (
            <View style={[styles.notice, { backgroundColor: isDark ? '#0F172A' : '#FEF3C7', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
              <IconSymbol name="person.crop.circle.badge.exclam" size={16} color={isDark ? '#FCD34D' : '#CA8A04'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeText, { color: isDark ? '#E5E7EB' : '#7C2D12' }]}>No teachers detected for this school.</Text>
                {!preschoolId && schoolId && (
                  <Text style={[styles.noticeText, { color: isDark ? '#CBD5E1' : '#7C2D12' }]}>Link your profile to this school to view staff.</Text>
                )}
              </View>
              {!preschoolId && schoolId && (
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}
                  onPress={async () => {
                    try {
                      await supabase.from('users').update({ preschool_id: schoolId }).eq('id', profile!.id);
                      Alert.alert('Linked', 'Your profile has been linked. Reloading teachers...');
                      // Reload teachers
                      const teachersRes = await TeacherService.getTeachersByPreschool(schoolId);
                      setTeachers(teachersRes.data || []);
                    } catch (e: any) {
                      Alert.alert('Failed', e?.message || 'Could not link automatically. Please contact support.');
                    }
                  }}
                >
                  <IconSymbol name="link" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                  <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Link profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}
                onPress={() => router.push('/screens/teachers' as any)}
              >
                <IconSymbol name="person.badge.plus" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Manage teachers</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.hint, { color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6 }]}>Tap a teacher to assign to a class. Tap Unassigned to clear.</Text>
          {existingClasses.map((c) => (
          <View key={c.id} style={[styles.assignmentRow, { borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
            <Text style={[styles.assignmentTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>{c.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.choiceChip, !c.teacher_id && styles.choiceChipActive]}
                onPress={() => assignTeacher(c.id, null)}
              >
                <Text style={styles.choiceChipText}>Unassigned</Text>
              </TouchableOpacity>
              {teachers.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.choiceChip, c.teacher_id === t.id && styles.choiceChipActive]}
                  onPress={() => assignTeacher(c.id, t.id)}
                >
                  <Text style={styles.choiceChipText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          ))}
        </>
      )}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.ghostBtn]} onPress={() => setStep(2)}>
          <IconSymbol name="chevron.left" size={16} color={isDark ? '#CBD5E1' : '#4B5563'} />
          <Text style={[styles.ghostBtnText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn]} onPress={() => setStep(4)}>
          <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={[styles.card, { backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Review & Complete</Text>
      <View style={[styles.summaryRow, { borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
        <Text style={[styles.summaryText, { color: isDark ? '#CBD5E1' : '#1F2937' }]}>Classes: {existingClasses.length}</Text>
        <Text style={[styles.summaryText, { color: isDark ? '#CBD5E1' : '#1F2937' }]}>Teachers: {teachers.length}</Text>
      </View>
      <Text style={[styles.hint, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>You can modify classes and assignments later in their respective screens.</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.ghostBtn]} onPress={() => setStep(3)}>
          <IconSymbol name="chevron.left" size={16} color={isDark ? '#CBD5E1' : '#4B5563'} />
          <Text style={[styles.ghostBtnText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn]} onPress={completeSetup}>
          <IconSymbol name="checkmark.seal.fill" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const viewerSchoolId = preschoolId || null;
  const mismatch = Boolean(viewerSchoolId && schoolId && viewerSchoolId !== schoolId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>School Setup</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Configure your school for real-world use: classes, capacity, and teacher assignments.</Text>

        {(schoolId || viewerSchoolId) && (
          <View style={[styles.notice, { backgroundColor: mismatch ? (isDark ? '#451a0a' : '#FEF2F2') : (isDark ? '#0F172A' : '#EFF6FF'), borderColor: mismatch ? (isDark ? '#9a3412' : '#FECACA') : (isDark ? '#334155' : '#BFDBFE') }]}>
            <IconSymbol name="info.circle" size={16} color={mismatch ? (isDark ? '#FDBA74' : '#DC2626') : (isDark ? '#93C5FD' : '#3B82F6')} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeText, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Current school: {schoolId || '—'}</Text>
              <Text style={[styles.noticeText, { color: isDark ? '#CBD5E1' : '#374151' }]}>Your profile: {viewerSchoolId || '—'}</Text>
              {mismatch && (
                <Text style={[styles.noticeText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>Mismatch detected – link your profile to this school for full access.</Text>
              )}
            </View>
            {mismatch && schoolId && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}
                onPress={async () => {
                  try {
                    await supabase.from('users').update({ preschool_id: schoolId }).eq('id', profile!.id);
                    Alert.alert('Linked', 'Your profile has been linked to this school.');
                  } catch {}
                }}
              >
                <IconSymbol name="link" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Link</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderStepHeader()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  stepCircleText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  stepCircleTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 12, marginTop: 6, textAlign: 'center' },

  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  existingBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  subTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  smallRow: { fontSize: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 12 },

  classRow: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  removeBtn: { alignSelf: 'flex-end' },

  ghostBtn: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ghostBtnText: { fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start' },
  secondaryBtnText: { fontWeight: '700' },
  primaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  hint: { fontSize: 12 },

  assignmentRow: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, marginBottom: 10 },
  assignmentTitle: { fontSize: 14, fontWeight: '700' },
  choiceChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  choiceChipActive: { backgroundColor: '#3B82F6' },
  choiceChipText: { fontSize: 12, color: '#111827', fontWeight: '700' },

  summaryRow: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, marginBottom: 10 },
  summaryText: { fontSize: 14, fontWeight: '700' },
});

