import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  Alert,
  Platform,
  Linking,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { analytics } from '@/lib/services/analyticsService';

const { width } = Dimensions.get('window');

type Category = 'bug' | 'feature' | 'confusion' | 'other';

export default function ContactSupportPage() {
  const params = useLocalSearchParams<{ screen?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [consent, setConsent] = useState(false);
  const [screenshot, setScreenshot] = useState<{ uri: string; mimeType?: string } | null>(null);

  const externalFormUrl = process.env.EXPO_PUBLIC_EXTERNAL_FEEDBACK_FORM_URL;

  const supportCategories = [
    { id: 'bug', title: 'Bug', description: 'Crashes, broken flows, errors', icon: 'exclamationmark.triangle.fill', color: ['#ff0080', '#ff8000'] },
    { id: 'feature', title: 'Feature Request', description: 'New functionality or improvements', icon: 'lightbulb.fill', color: ['#00f5ff', '#0080ff'] },
    { id: 'confusion', title: 'Confusing UX', description: 'Hard to find or understand', icon: 'questionmark.circle.fill', color: ['#8000ff', '#ff0080'] },
    { id: 'other', title: 'Other', description: 'Anything else', icon: 'ellipsis.circle.fill', color: ['#ff8000', '#80ff00'] },
  ] as const;

  const severities = [
    { id: 'low', title: 'Low' },
    { id: 'medium', title: 'Medium' },
    { id: 'high', title: 'High' },
    { id: 'critical', title: 'Critical' },
  ] as const;

  const prefilledScreen = useMemo(() => {
    return typeof params?.screen === 'string' ? params.screen : '';
  }, [params]);

  const pickScreenshot = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const asset = res.assets[0];
        setScreenshot({ uri: asset.uri, mimeType: asset.mimeType || undefined });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to pick image');
    }
  };

  const removeScreenshot = () => setScreenshot(null);

  const handleSubmitTicket = async () => {
    try {
      // Validate required
      if (!selectedCategory) return Alert.alert('Missing information', 'Please choose a category.');
      if (!description || description.trim().length < 15) return Alert.alert('Add more detail', 'Please provide at least 15 characters describing the issue.');

      // Get auth user and profile
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData?.user?.id;
      if (!authUserId) return Alert.alert('Not signed in', 'Please sign in to submit feedback.');

      const { data: profile } = await supabase
        .from('users')
        .select('id, role, email, name, preschool_id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      const persona = (() => {
        const role = (profile as any)?.role || '';
        if (role === 'principal' || role === 'preschool_admin') return 'principal';
        if (role === 'teacher') return 'teacher';
        if (role === 'parent') return 'parent';
        return 'parent';
      })();

      const app_version = Constants.expoConfig?.version || 'unknown';
      const build_channel = process.env.EXPO_PUBLIC_ENVIRONMENT || 'preview';
      const platform = Platform.OS;
      const device_info = consent
        ? {
            modelName: Device.modelName,
            osName: Device.osName,
            osVersion: Device.osVersion,
            manufacturer: Device.manufacturer,
          }
        : null;

      // 1) Insert feedback
      const insertPayload: any = {
        auth_user_id: authUserId,
        user_id: (profile as any)?.id || null,
        role: (profile as any)?.role || null,
        persona,
        category: selectedCategory,
        screen: prefilledScreen || null,
        description: description.trim(),
        steps: steps.trim() || null,
        severity: severity || null,
        consent_diagnostics: !!consent,
        device_info,
        app_version,
        build_channel,
        platform,
      };

      const { data: feedbackRow, error: insertErr } = await supabase
        .from('beta_feedback' as any)
        .insert(insertPayload as any)
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      const feedbackId = (feedbackRow as any)?.id as string | undefined;

      // 2) Upload screenshot
      if (screenshot?.uri && feedbackId) {
        const extGuess = (screenshot.mimeType || 'image/jpeg').split('/').pop()?.toLowerCase() || 'jpeg';
        const fileExt = extGuess === 'jpg' ? 'jpeg' : extGuess;
        const path = `feedback/${feedbackId}/${Date.now()}.${fileExt}`;
        const blob = await fetch(screenshot.uri).then(r => r.blob());
        const { error: upErr } = await supabase.storage
          .from('feedback_attachments')
          .upload(path, blob, { contentType: `image/${fileExt}` });
        if (!upErr) {
          await supabase.from('beta_feedback_attachments' as any).insert({ feedback_id: feedbackId, file_path: path } as any);
        }
      }

      // 3) Email support via Edge Function
      const summaryHtml = `
        <h3>New Beta Feedback</h3>
        <p><strong>ID:</strong> ${feedbackId || 'unknown'}</p>
        <p><strong>Persona:</strong> ${persona}</p>
        <p><strong>Category:</strong> ${selectedCategory}${severity ? ` (${severity})` : ''}</p>
        <p><strong>Screen:</strong> ${prefilledScreen || 'n/a'}</p>
        <p><strong>App:</strong> ${app_version} • <strong>Channel:</strong> ${build_channel} • <strong>Platform:</strong> ${platform}</p>
        <p><strong>Description:</strong><br/>${description.replace(/\n/g, '<br/>')}</p>
        ${steps ? `<p><strong>Steps:</strong><br/>${steps.replace(/\n/g, '<br/>')}</p>` : ''}
      `;
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'support@edudashpro.com',
          subject: `[Beta Feedback] ${persona} ${selectedCategory} ${severity || ''}`.trim(),
          html: summaryHtml,
        },
      });

      // 4) Analytics
      analytics.track({
        name: 'feedback_submitted',
        properties: {
          persona,
          category: selectedCategory,
          screen: prefilledScreen || 'n/a',
          severity: severity || 'n/a',
        },
      });

      Alert.alert('Thank you!', 'Your feedback was submitted.');
      router.back();
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message || 'Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#1a0a2e', '#16213e']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <LinearGradient colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']} style={styles.backButtonGradient}>
                <IconSymbol name="chevron.left" size={20} color="#00f5ff" />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Send Feedback (Beta)</Text>
              <Text style={styles.subtitle}>Help us improve EduDash Pro</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Category */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🗂️ Category</Text>
                <View style={styles.categoriesGrid}>
                  {supportCategories.map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.categoryCard, selectedCategory === (c.id as Category) && styles.categoryCardSelected]} onPress={() => setSelectedCategory(c.id as Category)}>
                      <LinearGradient colors={selectedCategory === c.id ? (c.color as [string, string]) : ['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']} style={styles.categoryGradient}>
                        <IconSymbol name={c.icon as any} size={24} color={selectedCategory === c.id ? '#000000' : '#00f5ff'} />
                        <Text style={[styles.categoryTitle, selectedCategory === c.id && styles.categoryTitleSelected]}>{c.title}</Text>
                        <Text style={[styles.categoryDescription, selectedCategory === c.id && styles.categoryDescriptionSelected]}>{c.description}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 What happened?</Text>
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.formLabel}>Description (required)</Text>
                    <TextInput
                      style={[styles.textInput, styles.messageInput]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe the issue or suggestion..."
                      placeholderTextColor="#666666"
                      multiline
                      numberOfLines={5}
                    />
                    <Text style={styles.helperText}>{Math.max(0, 15 - (description?.trim().length || 0))} more characters for minimum</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.formLabel}>Steps to reproduce (optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.messageInput]}
                      value={steps}
                      onChangeText={setSteps}
                      placeholder="1) ... 2) ... 3) ..."
                      placeholderTextColor="#666666"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  {/* Severity */}
                  <Text style={styles.formLabel}>Severity (optional)</Text>
                  <View style={styles.severityRow}>
                    {severities.map(s => (
                      <TouchableOpacity key={s.id} style={[styles.severityChip, severity === (s.id as any) && styles.severityChipActive]} onPress={() => setSeverity(s.id as any)}>
                        <Text style={[styles.severityText, severity === (s.id as any) && styles.severityTextActive]}>{s.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Screenshot */}
                  <Text style={styles.formLabel}>Screenshot (optional)</Text>
                  <View style={styles.attachmentRow}>
                    {!screenshot ? (
                      <TouchableOpacity style={styles.attachButton} onPress={pickScreenshot}>
                        <IconSymbol name="paperclip" size={18} color="#00f5ff" />
                        <Text style={styles.attachText}>Attach image</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.previewRow}>
                        <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
                        <TouchableOpacity onPress={removeScreenshot} style={styles.removeButton}>
                          <IconSymbol name="xmark.circle.fill" size={18} color="#ff4d4f" />
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Consent */}
                  <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(v => !v)}>
                    <IconSymbol name={consent ? 'checkmark.square.fill' : 'square'} size={18} color={consent ? '#22C55E' : '#9CA3AF'} />
                    <Text style={styles.consentText}>
                      I consent to include basic device info. Screenshots may contain student information.
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.policyText}>
                    By submitting feedback you agree to our testing feedback policy. We purge feedback data after 180 days.
                  </Text>

                  {/* External form */}
                  {externalFormUrl ? (
                    <TouchableOpacity style={styles.externalLink} onPress={() => {
                      const url = `${externalFormUrl}?persona=${encodeURIComponent('unknown')}&version=${encodeURIComponent(Constants.expoConfig?.version || '')}&platform=${Platform.OS}`;
                      Linking.openURL(url);
                    }}>
                      <Text style={styles.externalLinkText}>Prefer a longer form? Open external feedback form</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Submit */}
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
                    <LinearGradient colors={['#00f5ff', '#0080ff']} style={styles.submitGradient}>
                      <IconSymbol name="paperplane.fill" size={20} color="#000000" />
                      <Text style={styles.submitText}>Submit Feedback</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📧 Need direct support?</Text>
                <Text style={styles.contactText}>support@edudashpro.com</Text>
                <Text style={styles.contactText}>+27 67 477 0975</Text>
              </View>

              <View style={styles.footer} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { borderRadius: 12, overflow: 'hidden', marginRight: 15 },
  backButtonGradient: { padding: 10, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#00f5ff', fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#00f5ff', marginBottom: 15 },
  formContainer: {},
  inputContainer: { marginBottom: 12 },
  formLabel: { fontSize: 14, color: '#9CA3AF', marginBottom: 6 },
  textInput: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,245,255,0.2)', padding: 12, color: '#FFFFFF' },
  messageInput: { minHeight: 120, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  categoryCard: { width: width < 400 ? (width - 50) : (width - 70) / 2, borderRadius: 12, overflow: 'hidden' },
  categoryGradient: { padding: 14, minHeight: 110 },
  categoryTitle: { fontSize: 16, fontWeight: '800', color: '#00f5ff', marginTop: 6 },
  categoryTitleSelected: { color: '#000000' },
  categoryDescription: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  categoryDescriptionSelected: { color: 'rgba(0,0,0,0.7)' },
  categoryCardSelected: { borderWidth: 1, borderColor: 'rgba(0,245,255,0.5)' },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  severityChip: { borderRadius: 9999, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 6 },
  severityChipActive: { backgroundColor: 'rgba(0,245,255,0.15)', borderColor: '#00f5ff' },
  severityText: { color: '#9CA3AF', fontWeight: '700' },
  severityTextActive: { color: '#00f5ff' },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 8 },
  attachButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,245,255,0.25)' },
  attachText: { color: '#00f5ff', fontWeight: '700' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewImage: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  removeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { color: '#ff4d4f', fontWeight: '700' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  consentText: { color: '#E5E7EB', flex: 1 },
  policyText: { marginTop: 8, color: '#9CA3AF', fontSize: 12 },
  submitButton: { marginTop: 14 },
  submitGradient: { padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', borderRadius: 12 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#000000' },
  contactText: { color: '#E5E7EB', marginBottom: 4 },
  footer: { height: 40 },
  externalLink: { marginTop: 10 },
  externalLinkText: { color: '#60A5FA', textDecorationLine: 'underline' },
});
