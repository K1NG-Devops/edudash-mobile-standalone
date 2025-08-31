import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface CreateAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onPosted?: () => void; // callback to refresh Announcements list
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ visible, onClose, onPosted }) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [includeStaff, setIncludeStaff] = useState(false);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setSubject('');
    setContent('');
    setIncludeStaff(false);
  };

  const postAnnouncement = async () => {
    if (!content.trim()) {
      Alert.alert('Missing content', 'Please enter a message.');
      return;
    }
    try {
      setPosting(true);
      const { data, error } = await (supabase as any).rpc('send_school_announcement', {
        p_subject: subject.trim(),
        p_content: content.trim(),
        p_include_parents: true,
        p_include_staff: includeStaff,
        p_include_sender: true,
      });
      if (error) throw error;
      reset();
      onClose();
      onPosted?.();
      if (Platform.OS !== 'web') {
        Alert.alert('Announcement posted', 'Your announcement has been sent.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }] }>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#111827' }]}>Create Announcement</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={isDark ? '#CBD5E1' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Subject (optional)"
            placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
            style={[styles.input, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
            value={subject}
            onChangeText={setSubject}
          />

          <TextInput
            placeholder="Write your announcement..."
            placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
            style={[styles.textarea, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity style={styles.toggleRow} onPress={() => setIncludeStaff(s => !s)}>
            <View style={[styles.checkbox, { borderColor: isDark ? '#475569' : '#CBD5E1', backgroundColor: includeStaff ? '#10B981' : 'transparent' }]}>
              {includeStaff && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={{ color: isDark ? '#E5E7EB' : '#111827' }}>Include staff (teachers, admins)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.postBtn, { backgroundColor: '#10B981' }]} onPress={postAnnouncement} disabled={posting}>
            {posting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postText}>Post Announcement</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  postText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default CreateAnnouncementModal;

