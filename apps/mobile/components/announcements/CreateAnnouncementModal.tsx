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
  defaultIncludeStaff?: boolean; // allow callers (e.g., principal quick action) to include staff by default
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ visible, onClose, onPosted, defaultIncludeStaff = false }) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [includeStaff, setIncludeStaff] = useState(defaultIncludeStaff);
  const [posting, setPosting] = useState(false);

  // Keep includeStaff in sync when modal opens with a different default
  React.useEffect(() => {
    if (visible) {
      setIncludeStaff(defaultIncludeStaff);
    }
  }, [visible, defaultIncludeStaff]);

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
        <View style={[styles.sheet, isDark ? styles.sheetDark : styles.sheetLight]}>
          <View style={styles.header}>
            <Text style={[styles.title, isDark ? styles.textOnDark : styles.textOnLight]}>Create Announcement</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={isDark ? '#CBD5E1' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Subject (optional)"
            placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textFieldDark : styles.textFieldLight]}
            value={subject}
            onChangeText={setSubject}
          />

          <TextInput
            placeholder="Write your announcement..."
            placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
            style={[styles.textarea, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textFieldDark : styles.textFieldLight]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity style={styles.toggleRow} onPress={() => setIncludeStaff(s => !s)}>
            <View style={[
              styles.checkbox,
              isDark ? styles.checkboxDark : styles.checkboxLight,
              includeStaff ? styles.checkboxSelected : null,
            ]}>
              {includeStaff && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={isDark ? styles.textOnDark : styles.textOnLight}>Include staff (teachers, admins)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.postBtn, styles.postBtnPrimary]} onPress={postAnnouncement} disabled={posting}>
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
  sheetDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  sheetLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  textOnDark: {
    color: '#E5E7EB',
  },
  textOnLight: {
    color: '#111827',
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
  inputDark: {
    borderColor: '#334155',
    backgroundColor: '#0B1220',
  },
  inputLight: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  textFieldDark: {
    color: '#E5E7EB',
  },
  textFieldLight: {
    color: '#111827',
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
  checkboxDark: {
    borderColor: '#475569',
  },
  checkboxLight: {
    borderColor: '#CBD5E1',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
  },
  postBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  postBtnPrimary: {
    backgroundColor: '#10B981',
  },
  postText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default CreateAnnouncementModal;

