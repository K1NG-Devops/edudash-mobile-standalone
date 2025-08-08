import { claudeAI, STEMActivity } from './claudeService';
import { supabase } from '@/lib/supabase';

// STEM Activity types and interfaces
export interface STEMConcept {
  id: string;
  name: string;
  description: string;
  ageRange: {
    min: number;
    max: number;
  };
  subject: 'Science' | 'Technology' | 'Engineering' | 'Mathematics';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
}

export interface MaterialKit {
  id: string;
  name: string;
  items: Array<{
    name: string;
    quantity: number;
    optional: boolean;
    alternatives?: string[];
  }>;
  cost: 'free' | 'low' | 'medium' | 'high';
  safetyLevel: 'safe' | 'supervision_needed' | 'adult_only';
}

// Pre-defined STEM concepts for different age groups
export const STEM_CONCEPTS: STEMConcept[] = [
  // Science Concepts
  {
    id: 'density_floating',
    name: 'Density and Floating',
    description: 'Understanding why some objects float and others sink',
    ageRange: { min: 3, max: 5 },
    subject: 'Science',
    complexity: 'beginner',
    keywords: ['water', 'floating', 'sinking', 'heavy', 'light']
  },
  {
    id: 'color_mixing',
    name: 'Color Mixing',
    description: 'Exploring primary and secondary colors through mixing',
    ageRange: { min: 3, max: 5 },
    subject: 'Science',
    complexity: 'beginner',
    keywords: ['colors', 'mixing', 'primary', 'secondary', 'paint']
  },
  {
    id: 'plant_growth',
    name: 'Plant Growth',
    description: 'Observing how plants grow and what they need',
    ageRange: { min: 3, max: 5 },
    subject: 'Science',
    complexity: 'intermediate',
    keywords: ['plants', 'seeds', 'water', 'sun', 'growth']
  },
  {
    id: 'magnetism',
    name: 'Magnetism',
    description: 'Discovering magnetic and non-magnetic materials',
    ageRange: { min: 4, max: 5 },
    subject: 'Science',
    complexity: 'intermediate',
    keywords: ['magnets', 'attract', 'repel', 'metal', 'force']
  },

  // Technology Concepts
  {
    id: 'simple_coding',
    name: 'Simple Coding Patterns',
    description: 'Introduction to sequences and patterns like coding',
    ageRange: { min: 4, max: 5 },
    subject: 'Technology',
    complexity: 'beginner',
    keywords: ['patterns', 'sequences', 'steps', 'following directions']
  },
  {
    id: 'digital_tools',
    name: 'Digital Tools',
    description: 'Using technology tools for learning and creating',
    ageRange: { min: 4, max: 5 },
    subject: 'Technology',
    complexity: 'intermediate',
    keywords: ['tablet', 'apps', 'camera', 'recording', 'digital']
  },

  // Engineering Concepts
  {
    id: 'building_structures',
    name: 'Building Structures',
    description: 'Creating stable towers and bridges',
    ageRange: { min: 3, max: 5 },
    subject: 'Engineering',
    complexity: 'beginner',
    keywords: ['building', 'blocks', 'tower', 'bridge', 'stability']
  },
  {
    id: 'simple_machines',
    name: 'Simple Machines',
    description: 'Exploring levers, ramps, and pulleys',
    ageRange: { min: 4, max: 5 },
    subject: 'Engineering',
    complexity: 'intermediate',
    keywords: ['lever', 'ramp', 'pulley', 'wheel', 'force']
  },
  {
    id: 'design_process',
    name: 'Design Process',
    description: 'Learning to plan, build, test, and improve',
    ageRange: { min: 4, max: 5 },
    subject: 'Engineering',
    complexity: 'intermediate',
    keywords: ['design', 'plan', 'build', 'test', 'improve']
  },

  // Mathematics Concepts
  {
    id: 'patterns_sorting',
    name: 'Patterns and Sorting',
    description: 'Creating and extending patterns, sorting by attributes',
    ageRange: { min: 3, max: 5 },
    subject: 'Mathematics',
    complexity: 'beginner',
    keywords: ['patterns', 'sorting', 'colors', 'shapes', 'size']
  },
  {
    id: 'measurement',
    name: 'Measurement',
    description: 'Comparing lengths, weights, and volumes',
    ageRange: { min: 3, max: 5 },
    subject: 'Mathematics',
    complexity: 'beginner',
    keywords: ['measuring', 'long', 'short', 'heavy', 'light']
  },
  {
    id: 'geometry_shapes',
    name: 'Geometry and Shapes',
    description: 'Exploring 2D and 3D shapes in the environment',
    ageRange: { min: 3, max: 5 },
    subject: 'Mathematics',
    complexity: 'beginner',
    keywords: ['shapes', 'circle', 'square', 'triangle', 'geometry']
  },
  {
    id: 'data_graphing',
    name: 'Data and Graphing',
    description: 'Collecting and organizing information',
    ageRange: { min: 4, max: 5 },
    subject: 'Mathematics',
    complexity: 'intermediate',
    keywords: ['data', 'graph', 'chart', 'counting', 'comparing']
  }
];

// Pre-defined material kits
export const MATERIAL_KITS: MaterialKit[] = [
  {
    id: 'water_play',
    name: 'Water Exploration Kit',
    items: [
      { name: 'Clear containers', quantity: 3, optional: false },
      { name: 'Water', quantity: 1, optional: false },
      { name: 'Various objects to test', quantity: 10, optional: false },
      { name: 'Towels', quantity: 2, optional: false },
      { name: 'Food coloring', quantity: 1, optional: true, alternatives: ['Natural colorings'] }
    ],
    cost: 'free',
    safetyLevel: 'supervision_needed'
  },
  {
    id: 'building_blocks',
    name: 'Building and Construction Kit',
    items: [
      { name: 'Blocks or LEGO', quantity: 50, optional: false },
      { name: 'Cardboard pieces', quantity: 10, optional: true },
      { name: 'Tape', quantity: 1, optional: true },
      { name: 'Measuring tape', quantity: 1, optional: true }
    ],
    cost: 'low',
    safetyLevel: 'safe'
  },
  {
    id: 'art_science',
    name: 'Art and Science Kit',
    items: [
      { name: 'Paint (primary colors)', quantity: 3, optional: false },
      { name: 'Brushes', quantity: 5, optional: false },
      { name: 'Paper', quantity: 20, optional: false },
      { name: 'Mixing palette', quantity: 1, optional: false },
      { name: 'Aprons', quantity: 1, optional: true }
    ],
    cost: 'low',
    safetyLevel: 'supervision_needed'
  },
  {
    id: 'measurement_tools',
    name: 'Measurement and Math Kit',
    items: [
      { name: 'Rulers or measuring tape', quantity: 3, optional: false },
      { name: 'Balance scale', quantity: 1, optional: false, alternatives: ['Homemade balance'] },
      { name: 'Various objects to measure', quantity: 15, optional: false },
      { name: 'Containers of different sizes', quantity: 5, optional: false }
    ],
    cost: 'medium',
    safetyLevel: 'safe'
  },
  {
    id: 'magnet_exploration',
    name: 'Magnetism Discovery Kit',
    items: [
      { name: 'Magnets (various sizes)', quantity: 3, optional: false },
      { name: 'Metal objects', quantity: 10, optional: false },
      { name: 'Non-metal objects', quantity: 10, optional: false },
      { name: 'Magnetic wand', quantity: 1, optional: true },
      { name: 'Iron filings', quantity: 1, optional: true, alternatives: ['Metal shavings'] }
    ],
    cost: 'medium',
    safetyLevel: 'supervision_needed'
  }
];

export class STEMActivityGeneratorService {
  /**
   * Generate a STEM activity based on concept and available materials
   */
  static async generateSTEMActivity(params: {
    conceptId: string;
    ageGroup: string;
    availableMaterials: string[];
    learningGoals: string[];
    duration: number; // minutes
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    activity?: STEMActivity & {
      concept: STEMConcept;
      estimatedDuration: number;
      difficultyLevel: string;
    };
    error?: string;
  }> {
    const concept = STEM_CONCEPTS.find(c => c.id === params.conceptId);
    if (!concept) {
      return { success: false, error: 'STEM concept not found' };
    }

    // Check if age group matches concept
    const ageNumber = parseInt(params.ageGroup.split('-')[0]);
    if (ageNumber < concept.ageRange.min || ageNumber > concept.ageRange.max) {
      console.warn(`Age group ${params.ageGroup} may not be optimal for concept ${concept.name}`);
    }

    const result = await claudeAI.generateSTEMActivity({
      topic: concept.name,
      ageGroup: params.ageGroup,
      materials: params.availableMaterials,
      learningGoals: params.learningGoals,
      userId: params.userId,
      preschoolId: params.preschoolId
    });

    if (result.success && result.activity) {
      return {
        success: true,
        activity: {
          ...result.activity,
          concept,
          estimatedDuration: params.duration,
          difficultyLevel: concept.complexity
        }
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Generate activity using material kit
   */
  static async generateActivityFromKit(params: {
    kitId: string;
    conceptId?: string;
    ageGroup: string;
    learningGoals?: string[];
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    activity?: STEMActivity & {
      concept?: STEMConcept;
      kit: MaterialKit;
    };
    error?: string;
  }> {
    const kit = MATERIAL_KITS.find(k => k.id === params.kitId);
    if (!kit) {
      return { success: false, error: 'Material kit not found' };
    }

    // Find suitable concept if not provided
    let concept: STEMConcept | undefined;
    if (params.conceptId) {
      concept = STEM_CONCEPTS.find(c => c.id === params.conceptId);
    } else {
      // Auto-select concept based on kit and age
      const ageNumber = parseInt(params.ageGroup.split('-')[0]);
      const suitableConcepts = STEM_CONCEPTS.filter(c => 
        ageNumber >= c.ageRange.min && 
        ageNumber <= c.ageRange.max
      );
      
      // Simple matching based on kit name keywords
      concept = suitableConcepts.find(c => 
        c.keywords.some(keyword => 
          kit.name.toLowerCase().includes(keyword) ||
          kit.items.some(item => item.name.toLowerCase().includes(keyword))
        )
      ) || suitableConcepts[0];
    }

    const materials = kit.items.map(item => `${item.name} (${item.quantity})`);
    const defaultGoals = concept ? 
      [`Explore ${concept.name}`, `Use ${concept.subject.toLowerCase()} thinking`, 'Have fun learning'] :
      ['Explore materials', 'Make discoveries', 'Practice observation skills'];

    const result = await claudeAI.generateSTEMActivity({
      topic: concept?.name || 'Hands-on Exploration',
      ageGroup: params.ageGroup,
      materials,
      learningGoals: params.learningGoals || defaultGoals,
      userId: params.userId,
      preschoolId: params.preschoolId
    });

    if (result.success && result.activity) {
      return {
        success: true,
        activity: {
          ...result.activity,
          concept,
          kit
        }
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Get recommended activities for a specific age group and subject
   */
  static getRecommendedActivities(params: {
    ageGroup: string;
    subject?: 'Science' | 'Technology' | 'Engineering' | 'Mathematics';
    availableKits?: string[];
    limit?: number;
  }): {
    success: boolean;
    recommendations: Array<{
      concept: STEMConcept;
      compatibleKits: MaterialKit[];
      difficulty: string;
      estimatedTime: number;
    }>;
  } {
    const ageNumber = parseInt(params.ageGroup.split('-')[0]);
    
    let suitableConcepts = STEM_CONCEPTS.filter(c => 
      ageNumber >= c.ageRange.min && 
      ageNumber <= c.ageRange.max
    );

    if (params.subject) {
      suitableConcepts = suitableConcepts.filter(c => c.subject === params.subject);
    }

    const recommendations = suitableConcepts
      .slice(0, params.limit || 10)
      .map(concept => {
        // Find compatible kits
        const compatibleKits = MATERIAL_KITS.filter(kit =>
          !params.availableKits || params.availableKits.includes(kit.id) ||
          concept.keywords.some(keyword => 
            kit.name.toLowerCase().includes(keyword) ||
            kit.items.some(item => item.name.toLowerCase().includes(keyword))
          )
        );

        // Estimate time based on complexity
        const estimatedTime = concept.complexity === 'beginner' ? 20 :
                            concept.complexity === 'intermediate' ? 35 : 45;

        return {
          concept,
          compatibleKits,
          difficulty: concept.complexity,
          estimatedTime
        };
      });

    return {
      success: true,
      recommendations
    };
  }

  /**
   * Save generated STEM activity to database
   */
  static async saveSTEMActivity(params: {
    activity: STEMActivity;
    concept?: STEMConcept;
    teacherId: string;
    preschoolId: string;
    ageGroupId: string;
  }): Promise<{
    success: boolean;
    activityId?: string;
    error?: string;
  }> {
    try {
      // Get or create STEM category
      let categoryId: string;
      const { data: stemCategory } = await supabase
        .from('lesson_categories')
        .select('id')
        .eq('name', 'STEM Activities')
        .single();

      if (stemCategory) {
        categoryId = stemCategory.id;
      } else {
        const { data: newCategory, error: categoryError } = await supabase
          .from('lesson_categories')
          .insert({
            name: 'STEM Activities',
            description: 'Science, Technology, Engineering, and Mathematics activities',
            icon: 'flask',
            color: '#10B981'
          })
          .select()
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      }

      // Insert lesson for the STEM activity
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: params.activity.title,
          description: params.activity.description,
          content: params.activity.instructions.join('\n\n'),
          category_id: categoryId,
          age_group_id: params.ageGroupId,
          duration_minutes: 30, // Default duration
          learning_objectives: params.concept?.description || 'STEM exploration',
          materials_needed: JSON.stringify(params.activity.instructions),
          preschool_id: params.preschoolId,
          created_by: params.teacherId,
          is_published: false,
          tier: 'free',
          has_video: false,
          has_interactive: true,
          has_printables: false,
          stem_concepts: params.activity.scientificConcepts
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Create main activity
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .insert({
          lesson_id: lessonData.id,
          title: params.activity.title,
          description: params.activity.description,
          activity_type: 'stem_experiment',
          instructions: params.activity.instructions.join('\n'),
          estimated_time: 30,
          materials: params.activity.scientificConcepts.join(', '),
          sequence_order: 1
        })
        .select()
        .single();

      if (activityError) throw activityError;

      return {
        success: true,
        activityId: activityData.id
      };
    } catch (error) {
      console.error('Error saving STEM activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save STEM activity'
      };
    }
  }

  /**
   * Generate safety guidelines for a STEM activity
   */
  static generateSafetyGuidelines(params: {
    materials: string[];
    ageGroup: string;
    activityType: string;
  }): {
    guidelines: string[];
    supervisionLevel: 'independent' | 'guided' | 'adult_required';
    risks: string[];
  } {
    const ageNumber = parseInt(params.ageGroup.split('-')[0]);
    const guidelines: string[] = [];
    const risks: string[] = [];
    let supervisionLevel: 'independent' | 'guided' | 'adult_required' = 'guided';

    // Age-based guidelines
    if (ageNumber < 4) {
      guidelines.push('Adult supervision required at all times');
      guidelines.push('Keep small objects away from mouth');
      supervisionLevel = 'adult_required';
    }

    // Material-based safety
    params.materials.forEach(material => {
      const lowerMaterial = material.toLowerCase();
      
      if (lowerMaterial.includes('water')) {
        guidelines.push('Use shallow water containers');
        guidelines.push('Have towels ready for spills');
        risks.push('Slipping on wet surfaces');
      }
      
      if (lowerMaterial.includes('paint') || lowerMaterial.includes('color')) {
        guidelines.push('Use washable, non-toxic paints only');
        guidelines.push('Protect clothing with aprons');
        guidelines.push('Keep away from eyes and mouth');
      }
      
      if (lowerMaterial.includes('magnet')) {
        guidelines.push('Use large magnets to prevent choking');
        guidelines.push('Keep magnets away from electronics');
        risks.push('Small magnets can be choking hazards');
        supervisionLevel = 'adult_required';
      }
      
      if (lowerMaterial.includes('scissors') || lowerMaterial.includes('sharp')) {
        guidelines.push('Adult must handle all sharp tools');
        guidelines.push('Use child-safe scissors when possible');
        risks.push('Cuts from sharp objects');
        supervisionLevel = 'adult_required';
      }
      
      if (lowerMaterial.includes('heat') || lowerMaterial.includes('hot')) {
        guidelines.push('Adult handles all hot materials');
        guidelines.push('Allow hot items to cool before child interaction');
        risks.push('Burns from hot surfaces');
        supervisionLevel = 'adult_required';
      }
    });

    // Activity-type based guidelines
    if (params.activityType.includes('build') || params.activityType.includes('construct')) {
      guidelines.push('Ensure stable work surface');
      guidelines.push('Clean up fallen pieces immediately');
    }

    if (params.activityType.includes('experiment')) {
      guidelines.push('Explain each step before doing it');
      guidelines.push('Have cleaning supplies ready');
    }

    // Default safety guidelines
    guidelines.push('Wash hands before and after activity');
    guidelines.push('Clean up workspace when finished');

    return {
      guidelines: Array.from(new Set(guidelines)), // Remove duplicates
      supervisionLevel,
      risks: Array.from(new Set(risks))
    };
  }

  /**
   * Get STEM concepts by subject and age
   */
  static getConceptsBySubject(subject: 'Science' | 'Technology' | 'Engineering' | 'Mathematics'): STEMConcept[] {
    return STEM_CONCEPTS.filter(concept => concept.subject === subject);
  }

  /**
   * Get material kits by safety level
   */
  static getKitsBySafety(safetyLevel: 'safe' | 'supervision_needed' | 'adult_only'): MaterialKit[] {
    return MATERIAL_KITS.filter(kit => kit.safetyLevel === safetyLevel);
  }

  /**
   * Search for concepts by keywords
   */
  static searchConcepts(query: string, ageGroup?: string): STEMConcept[] {
    const queryLower = query.toLowerCase();
    let concepts = STEM_CONCEPTS.filter(concept =>
      concept.name.toLowerCase().includes(queryLower) ||
      concept.description.toLowerCase().includes(queryLower) ||
      concept.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
    );

    if (ageGroup) {
      const ageNumber = parseInt(ageGroup.split('-')[0]);
      concepts = concepts.filter(concept =>
        ageNumber >= concept.ageRange.min && ageNumber <= concept.ageRange.max
      );
    }

    return concepts;
  }
}

// Export for convenience
export const stemGenerator = STEMActivityGeneratorService;
