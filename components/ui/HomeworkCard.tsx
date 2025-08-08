import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

import { HomeworkAssignment } from '@/types/homework-types';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface HomeworkCardProps {
  assignment: HomeworkAssignment;
  onPress: () => void;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ assignment, onPress }) => {
  const hasImage = assignment.lesson?.thumbnail_url;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {hasImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: assignment.lesson?.thumbnail_url || '' }} style={styles.thumbnail} />
        </View>
      ) : (
        <View style={styles.iconContainer}>
          <IconSymbol 
            name={getSubjectIcon(assignment.lesson?.title || '')} 
            size={32} 
            color="#6366F1" 
          />
        </View>
      )}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{assignment.title}</Text>
        <View style={styles.lessonRow}>
          <IconSymbol name="book.fill" size={14} color="#6B7280" />
          <Text style={styles.lessonTitle}>{assignment.lesson?.title || 'Lesson'}</Text>
        </View>
        <View style={styles.detailsRow}>
          <IconSymbol name="clock" size={14} color="#6B7280" />
          <Text style={styles.detailsText}>Due in {assignment.due_date_offset_days} days</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getSubjectIcon = (subject: string): string => {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('math') || subjectLower.includes('addition')) return 'plus.forwardslash.minus';
  if (subjectLower.includes('reading') || subjectLower.includes('story')) return 'book.fill';
  if (subjectLower.includes('art') || subjectLower.includes('creative')) return 'paintbrush.fill';
  if (subjectLower.includes('science')) return 'flask.fill';
  return 'doc.text.fill';
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: screenWidth * 0.02,
    padding: screenWidth * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    minWidth: 50,
    minHeight: 50,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0F0FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50,
    minHeight: 50,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
    flexShrink: 1,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default HomeworkCard;

