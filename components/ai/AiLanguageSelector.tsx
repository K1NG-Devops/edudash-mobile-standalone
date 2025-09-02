import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage, SA_LANGUAGES } from '@/contexts/LanguageContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface AiLanguageSelectorProps {
  compact?: boolean;
}

const AiLanguageSelector: React.FC<AiLanguageSelectorProps> = ({ compact = true }) => {
  const { language, setLanguage, supported } = useLanguage();
  const [open, setOpen] = useState(false);

  const list = Array.isArray(supported) && supported.length > 0 ? supported : SA_LANGUAGES;
  const current = list.find((l) => l.code === language);

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="AI Language"
        onPress={() => setOpen(true)}
        style={[styles.button, compact && styles.buttonCompact]}
        activeOpacity={0.8}
      >
        <IconSymbol name="globe" size={compact ? 16 : 18} color="#FFFFFF" />
        {!compact && (
          <Text style={styles.buttonText}>{current?.label || language.toUpperCase()}</Text>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>AI Response Language</Text>
            <View style={styles.list}>
              {list.map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.item, opt.code === language && styles.itemActive]}
                  onPress={() => {
                    setLanguage(opt.code);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.itemText, opt.code === language && styles.itemTextActive]}> {opt.label} </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonCompact: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  list: {
    maxHeight: 380,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: '#EEF2FF',
  },
  itemText: {
    fontSize: 14,
    color: '#111827',
  },
  itemTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  close: {
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    color: '#4338CA',
    fontWeight: '600',
  },
});

export default AiLanguageSelector;

