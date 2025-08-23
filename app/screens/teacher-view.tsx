import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { MobileHeader } from '@/components/navigation/MobileHeader';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  role: string;
  // Personal Information
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  id_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  // Address
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  // Professional Information
  employee_id?: string;
  department?: string;
  position_title?: string;
  employment_start_date?: string;
  employment_status?: string;
  salary_amount?: number;
  salary_currency?: string;
  // Qualifications
  highest_qualification?: string;
  institution_name?: string;
  qualification_year?: number;
  certifications?: string[];
  teaching_experience_years?: number;
  subjects_taught?: string[];
  age_groups_taught?: string[];
  // Additional
  biography?: string;
  languages_spoken?: string[];
  notes?: string;
  profile_completion_status?: string;
}

export default function TeacherView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const palette = Colors[colorScheme];
  
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<TeacherProfile | null>(null);

  const canEdit = profile?.role === 'principal' || profile?.role === 'preschool_admin' || profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    loadTeacher();
  }, [id]);

  const loadTeacher = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone, role, is_active, profile_completion_status,
          date_of_birth, gender, nationality, id_number,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          street_address, city, state_province, postal_code, country,
          employee_id, department, position_title, employment_start_date, employment_status,
          salary_amount, salary_currency,
          highest_qualification, institution_name, qualification_year,
          certifications, teaching_experience_years, subjects_taught, age_groups_taught,
          biography, languages_spoken, notes
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error loading teacher:', error);
        Alert.alert('Error', 'Failed to load teacher profile');
        return;
      }
      
      setTeacher(data);
      setFormData(data);
    } catch (err) {
      console.error('Exception loading teacher:', err);
      Alert.alert('Error', 'Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !canEdit) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating teacher:', error);
        Alert.alert('Error', 'Failed to save teacher profile');
        return;
      }
      
      setTeacher(formData);
      setEditMode(false);
      Alert.alert('Success', 'Teacher profile updated successfully');
    } catch (err) {
      console.error('Exception saving teacher:', err);
      Alert.alert('Error', 'Failed to save teacher profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(teacher);
    setEditMode(false);
  };

  const updateField = (field: keyof TeacherProfile, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayFieldUpdate = (field: keyof TeacherProfile, value: string) => {
    if (!formData) return;
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData({ ...formData, [field]: items });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
        <MobileHeader
          user={{ name: profile?.name || 'User', role: profile?.role || 'user' }}
          schoolName="Teacher Profile"
          onNotificationsPress={() => {}}
          onSignOut={() => {}}
          onNavigate={(route) => router.push(route as any)}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading teacher profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!teacher) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
        <MobileHeader
          user={{ name: profile?.name || 'User', role: profile?.role || 'user' }}
          schoolName="Teacher Profile"
          onNotificationsPress={() => {}}
          onSignOut={() => {}}
          onNavigate={(route) => router.push(route as any)}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text }]}>Teacher not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderField = (label: string, value: any, field: keyof TeacherProfile, placeholder?: string, multiline = false) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : (value || '');
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
        {editMode && canEdit ? (
          <TextInput
            style={[styles.input, { 
              backgroundColor: palette.surface, 
              borderColor: palette.outline, 
              color: palette.text,
              minHeight: multiline ? 80 : 44
            }]}
            value={displayValue.toString()}
            onChangeText={(text) => {
              if (Array.isArray(value)) {
                handleArrayFieldUpdate(field, text);
              } else {
                updateField(field, text);
              }
            }}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={palette.textSecondary}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        ) : (
          <Text style={[styles.fieldValue, { 
            color: palette.textSecondary,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
          }]}>
            {displayValue || '—'}
          </Text>
        )}
      </View>
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
      <MobileHeader
        user={{ name: profile?.name || 'User', role: profile?.role || 'user' }}
        schoolName="Teacher Profile"
        onNotificationsPress={() => {}}
        onSignOut={() => {}}
        onNavigate={(route) => router.push(route as any)}
        notificationCount={0}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header with Edit Controls */}
        <View style={[styles.header, { backgroundColor: palette.surface }]}>
          <View style={styles.headerInfo}>
            <Text style={[styles.teacherName, { color: palette.text }]}>{teacher.name}</Text>
            <Text style={[styles.teacherRole, { color: palette.textSecondary }]}>
              {teacher.position_title || teacher.role || 'Teacher'}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusIndicator, { 
                backgroundColor: teacher.is_active ? '#10B981' : '#EF4444' 
              }]} />
              <Text style={[styles.statusText, { color: palette.textSecondary }]}>
                {teacher.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          {canEdit && (
            <View style={styles.editControls}>
              {editMode ? (
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: palette.outline }]}
                    onPress={handleCancel}
                    disabled={saving}
                  >
                    <Text style={[styles.cancelButtonText, { color: palette.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#10B981' }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: palette.primary }]}
                  onPress={() => setEditMode(true)}
                >
                  <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Basic Information */}
        {renderSection('Basic Information', (
          <>
            {renderField('Name', formData?.name, 'name', 'Teacher name')}
            {renderField('Email', formData?.email, 'email', 'teacher@example.com')}
            {renderField('Phone', formData?.phone, 'phone', '+27 12 345 6789')}
            {renderField('Date of Birth', formData?.date_of_birth, 'date_of_birth', 'YYYY-MM-DD')}
            {renderField('Gender', formData?.gender, 'gender', 'male/female/other')}
            {renderField('Nationality', formData?.nationality, 'nationality', 'South African')}
            {renderField('ID Number', formData?.id_number, 'id_number', 'ID or passport number')}
          </>
        ))}

        {/* Address Information */}
        {renderSection('Address', (
          <>
            {renderField('Street Address', formData?.street_address, 'street_address', '123 Main Street')}
            {renderField('City', formData?.city, 'city', 'Cape Town')}
            {renderField('Province/State', formData?.state_province, 'state_province', 'Western Cape')}
            {renderField('Postal Code', formData?.postal_code, 'postal_code', '7925')}
            {renderField('Country', formData?.country, 'country', 'South Africa')}
          </>
        ))}

        {/* Emergency Contact */}
        {renderSection('Emergency Contact', (
          <>
            {renderField('Contact Name', formData?.emergency_contact_name, 'emergency_contact_name', 'John Doe')}
            {renderField('Contact Phone', formData?.emergency_contact_phone, 'emergency_contact_phone', '+27 12 345 6789')}
            {renderField('Relationship', formData?.emergency_contact_relationship, 'emergency_contact_relationship', 'Spouse/Parent/Sibling')}
          </>
        ))}

        {/* Professional Information */}
        {renderSection('Professional Information', (
          <>
            {renderField('Employee ID', formData?.employee_id, 'employee_id', 'EMP001')}
            {renderField('Department', formData?.department, 'department', 'Early Childhood')}
            {renderField('Position Title', formData?.position_title, 'position_title', 'Senior Teacher')}
            {renderField('Employment Start Date', formData?.employment_start_date, 'employment_start_date', 'YYYY-MM-DD')}
            {renderField('Employment Status', formData?.employment_status, 'employment_status', 'full_time/part_time/contract')}
            {renderField('Teaching Experience (Years)', formData?.teaching_experience_years?.toString(), 'teaching_experience_years', '5')}
          </>
        ))}

        {/* Qualifications & Certifications */}
        {renderSection('Qualifications & Certifications', (
          <>
            {renderField('Highest Qualification', formData?.highest_qualification, 'highest_qualification', 'Bachelor of Education')}
            {renderField('Institution', formData?.institution_name, 'institution_name', 'University of Cape Town')}
            {renderField('Qualification Year', formData?.qualification_year?.toString(), 'qualification_year', '2020')}
            {renderField('Certifications', formData?.certifications, 'certifications', 'First Aid, CPR, Child Development (comma separated)')}
          </>
        ))}

        {/* Teaching Specializations */}
        {renderSection('Teaching Specializations', (
          <>
            {renderField('Subjects Taught', formData?.subjects_taught, 'subjects_taught', 'Math, English, Art (comma separated)')}
            {renderField('Age Groups', formData?.age_groups_taught, 'age_groups_taught', '3-4 years, 4-5 years (comma separated)')}
            {renderField('Languages Spoken', formData?.languages_spoken, 'languages_spoken', 'English, Afrikaans, Zulu (comma separated)')}
          </>
        ))}

        {/* Additional Information */}
        {renderSection('Additional Information', (
          <>
            {renderField('Biography', formData?.biography, 'biography', 'Brief description of teaching philosophy and experience...', true)}
            {canEdit && renderField('Admin Notes', formData?.notes, 'notes', 'Internal notes about this teacher...', true)}
          </>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  teacherRole: {
    fontSize: 16,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editControls: {
    marginLeft: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});
