/* eslint-disable */
// @ts-nocheck
import { claudeAI, LessonContent } from './claudeService';
import { supabase } from '@/lib/supabase';

// Lesson generation templates and utilities
export interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  ageGroups: string[];
  subjects: string[];
  duration: number;
  complexity: 'simple' | 'moderate' | 'complex';
  activities: number;
}

// Pre-defined lesson templates
export const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: 'stem_exploration',
    name: 'STEM Exploration',
    description: 'Hands-on science, technology, engineering, and math activities',
    ageGroups: ['3-4 years', '4-5 years'],
    subjects: ['Science', 'Math', 'Engineering'],
    duration: 45,
    complexity: 'moderate',
    activities: 4
  },
  {
    id: 'creative_arts',
    name: 'Creative Arts & Expression',
    description: 'Art, music, and creative expression activities',
    ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
    subjects: ['Art', 'Music', 'Creative Expression'],
    duration: 30,
    complexity: 'simple',
    activities: 3
  },
  {
    id: 'language_literacy',
    name: 'Language & Literacy',
    description: 'Reading, writing, vocabulary, and communication skills',
    ageGroups: ['3-4 years', '4-5 years'],
    subjects: ['Language Arts', 'Reading', 'Writing'],
    duration: 35,
    complexity: 'moderate',
    activities: 4
  },
  {
    id: 'social_emotional',
    name: 'Social-Emotional Learning',
    description: 'Building emotional intelligence and social skills',
    ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
    subjects: ['Social Skills', 'Emotional Development'],
    duration: 25,
    complexity: 'simple',
    activities: 3
  },
  {
    id: 'nature_outdoor',
    name: 'Nature & Outdoor Learning',
    description: 'Exploring the natural world and outdoor activities',
    ageGroups: ['3-4 years', '4-5 years'],
    subjects: ['Science', 'Nature Studies', 'Physical Activity'],
    duration: 40,
    complexity: 'moderate',
    activities: 4
  }
];

export class LessonGeneratorService {
  /**
   * Generate a complete lesson using AI with a specific template
   */
  static async generateLessonFromTemplate(params: {
    templateId: string;
    topic: string;
    ageGroup: string;
    customObjectives?: string[];
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    lesson?: LessonContent & { template: LessonTemplate };
    error?: string;
  }> {
    const template = LESSON_TEMPLATES.find(t => t.id === params.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Create learning objectives based on template and age group
    const defaultObjectives = LessonGeneratorService.getDefaultObjectives(
      template.subjects,
      params.ageGroup
    );

    const learningObjectives = params.customObjectives || defaultObjectives;

    const result = await claudeAI.generateLessonContent({
      topic: params.topic,
      ageGroup: params.ageGroup,
      duration: template.duration,
      learningObjectives,
      userId: params.userId,
      preschoolId: params.preschoolId
    });

    if (result.success && result.content) {
      return {
        success: true,
        lesson: {
          ...result.content,
          template
        }
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Generate a custom lesson without template
   */
  static async generateCustomLesson(params: {
    topic: string;
    ageGroup: string;
    duration: number;
    subjects: string[];
    learningObjectives: string[];
    difficulty: 'easy' | 'medium' | 'challenging';
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    lesson?: LessonContent;
    error?: string;
  }> {
    // Enhance objectives based on difficulty level
    const enhancedObjectives = LessonGeneratorService.enhanceObjectivesByDifficulty(
      params.learningObjectives,
      params.difficulty
    );

    const result = await claudeAI.generateLessonContent({
      topic: params.topic,
      ageGroup: params.ageGroup,
      duration: params.duration,
      learningObjectives: enhancedObjectives,
      userId: params.userId,
      preschoolId: params.preschoolId
    });

    return result;
  }

  /**
   * Save generated lesson to database
   */
  static async saveGeneratedLesson(params: {
    lesson: LessonContent;
    teacherId: string;
    preschoolId: string;
    ageGroupId: string;
    categoryId: string;
    template?: LessonTemplate;
  }): Promise<{
    success: boolean;
    lessonId?: string;
    error?: string;
  }> {
    try {
      // Insert lesson into database
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: params.lesson.title,
          description: params.lesson.description,
          content: params.lesson.content,
          category_id: params.categoryId,
          age_group_id: params.ageGroupId,
          duration_minutes: params.template?.duration || 30,
          learning_objectives: params.lesson.assessmentQuestions.join('\n'),
          materials_needed: params.lesson.activities.map(a => a.materials).flat().join(', '),
          preschool_id: params.preschoolId,
          created_by: params.teacherId,
          is_published: false,
          tier: 'free',
          has_video: false,
          has_interactive: true,
          has_printables: false,
          stem_concepts: params.lesson.activities.map(a => a.title),
          home_extension: params.lesson.homeExtension
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Insert activities
      if (params.lesson.activities.length > 0) {
        const activities = params.lesson.activities.map((activity, index) => ({
          lesson_id: lessonData.id,
          title: activity.title,
          description: activity.description,
          activity_type: 'interactive',
          instructions: activity.instructions,
          estimated_time: activity.estimatedTime,
          materials: activity.materials.join(', '),
          sequence_order: index + 1
        }));

        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(activities);

        if (activitiesError) throw activitiesError;
      }

      return {
        success: true,
        lessonId: lessonData.id
      };
    } catch (error) {
      console.error('Error saving generated lesson:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save lesson'
      };
    }
  }

  /**
   * Get lesson suggestions based on curriculum standards
   */
  static async getLessonSuggestions(params: {
    ageGroup: string;
    subject: string;
    preschoolId: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    suggestions?: Array<{
      topic: string;
      description: string;
      objectives: string[];
      templateId: string;
    }>;
    error?: string;
  }> {
    try {
      // Get curriculum standards for the age group and subject
      const curriculumTopics = LessonGeneratorService.getCurriculumTopics(
        params.ageGroup,
        params.subject
      );

      const suggestions = curriculumTopics.slice(0, params.limit || 10).map(topic => {
        const template = LESSON_TEMPLATES.find(t => 
          t.subjects.includes(params.subject) && 
          t.ageGroups.includes(params.ageGroup)
        ) || LESSON_TEMPLATES[0];

        return {
          topic: topic.name,
          description: topic.description,
          objectives: topic.objectives,
          templateId: template.id
        };
      });

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      console.error('Error getting lesson suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get suggestions'
      };
    }
  }

  /**
   * Get default learning objectives based on subjects and age group
   */
  private static getDefaultObjectives(subjects: string[], ageGroup: string): string[] {
    const objectiveMap: Record<string, Record<string, string[]>> = {
      'Science': {
        '2-3 years': ['Explore with senses', 'Observe differences', 'Show curiosity'],
        '3-4 years': ['Ask simple questions', 'Make predictions', 'Compare objects'],
        '4-5 years': ['Conduct simple experiments', 'Record observations', 'Draw conclusions']
      },
      'Math': {
        '2-3 years': ['Recognize shapes', 'Count to 3', 'Sort objects'],
        '3-4 years': ['Count to 10', 'Recognize patterns', 'Compare sizes'],
        '4-5 years': ['Count to 20', 'Simple addition', 'Measure objects']
      },
      'Language Arts': {
        '2-3 years': ['Listen to stories', 'Name objects', 'Follow simple directions'],
        '3-4 years': ['Retell stories', 'Recognize letters', 'Express ideas'],
        '4-5 years': ['Write letters', 'Phonetic awareness', 'Create stories']
      },
      'Art': {
        '2-3 years': ['Explore materials', 'Make marks', 'Choose colors'],
        '3-4 years': ['Use tools properly', 'Create representations', 'Mix colors'],
        '4-5 years': ['Plan artwork', 'Use techniques', 'Describe creations']
      }
    };

    const objectives: string[] = [];
    subjects.forEach(subject => {
      const subjectObjectives = objectiveMap[subject]?.[ageGroup] || [];
      objectives.push(...subjectObjectives);
    });

    return objectives.length > 0 ? objectives : ['Engage in learning', 'Have fun', 'Practice skills'];
  }

  /**
   * Enhance objectives based on difficulty level
   */
  private static enhanceObjectivesByDifficulty(
    objectives: string[],
    difficulty: 'easy' | 'medium' | 'challenging'
  ): string[] {
    const difficultyModifiers = {
      easy: ['Begin to', 'With help', 'Simple'],
      medium: ['Demonstrate', 'Practice', 'Show understanding'],
      challenging: ['Master', 'Apply', 'Create independently']
    };

    const modifiers = difficultyModifiers[difficulty];
    return objectives.map(objective => {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      return `${modifier} ${objective.toLowerCase()}`;
    });
  }

  /**
   * Get curriculum topics for age group and subject
   */
  private static getCurriculumTopics(ageGroup: string, subject: string) {
    const curriculumTopics: Record<string, Record<string, Array<{
      name: string;
      description: string;
      objectives: string[];
    }>>> = {
      'Science': {
        '3-4 years': [
          {
            name: 'Plants and Animals',
            description: 'Exploring living things in our environment',
            objectives: ['Identify basic needs of plants', 'Name animal characteristics', 'Care for living things']
          },
          {
            name: 'Weather and Seasons',
            description: 'Understanding weather patterns and seasonal changes',
            objectives: ['Observe weather daily', 'Identify seasonal clothing', 'Describe weather changes']
          },
          {
            name: 'Senses and Body',
            description: 'Learning about our five senses and body parts',
            objectives: ['Use all five senses', 'Name body parts', 'Practice healthy habits']
          }
        ],
        '4-5 years': [
          {
            name: 'Simple Machines',
            description: 'Introduction to levers, wheels, and pulleys',
            objectives: ['Identify simple machines', 'Explain how they help', 'Build simple devices']
          },
          {
            name: 'Matter and Materials',
            description: 'Exploring solids, liquids, and their properties',
            objectives: ['Sort materials', 'Describe properties', 'Observe changes']
          },
          {
            name: 'Life Cycles',
            description: 'Understanding how living things grow and change',
            objectives: ['Sequence growth stages', 'Compare life cycles', 'Predict changes']
          }
        ]
      },
      'Math': {
        '3-4 years': [
          {
            name: 'Numbers and Counting',
            description: 'Building number sense and counting skills',
            objectives: ['Count objects to 10', 'Recognize numerals', 'One-to-one correspondence']
          },
          {
            name: 'Shapes and Patterns',
            description: 'Identifying shapes and creating patterns',
            objectives: ['Name basic shapes', 'Continue patterns', 'Create own patterns']
          }
        ],
        '4-5 years': [
          {
            name: 'Addition and Subtraction',
            description: 'Introduction to basic math operations',
            objectives: ['Add objects to 10', 'Subtract objects', 'Use math vocabulary']
          },
          {
            name: 'Measurement and Data',
            description: 'Comparing sizes and organizing information',
            objectives: ['Compare lengths', 'Sort and graph', 'Use measuring tools']
          }
        ]
      }
    };

    return curriculumTopics[subject]?.[ageGroup] || [];
  }
}

// Export for convenience
export const lessonGenerator = LessonGeneratorService;
