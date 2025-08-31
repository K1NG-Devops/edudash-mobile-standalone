/**
 * Comprehensive curriculum database for EduDash Pro
 * Structured topics and learning objectives by subject and age group
 */

export interface CurriculumTopic {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  keywords: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDuration: number; // in minutes
  materials: string[];
}

export interface SubjectCurriculum {
  [ageGroup: string]: CurriculumTopic[];
}

export interface CurriculumDatabase {
  [subject: string]: SubjectCurriculum;
}

// Age group definitions
export const AGE_GROUPS = {
  '2-3': '2-3 years',
  '3-4': '3-4 years',
  '4-5': '4-5 years',
  '5-6': '5-6 years'
};

// Subject definitions with colors and icons
export const SUBJECTS = {
  'Science': {
    name: 'Science',
    icon: 'flask',
    color: '#10B981',
    description: 'Explore the natural world through experiments and observation'
  },
  'Math': {
    name: 'Math',
    icon: 'function',
    color: '#3B82F6',
    description: 'Build number sense and mathematical thinking skills'
  },
  'Language Arts': {
    name: 'Language Arts',
    icon: 'book',
    color: '#8B5CF6',
    description: 'Develop reading, writing, and communication skills'
  },
  'Art': {
    name: 'Art',
    icon: 'paintbrush',
    color: '#EF4444',
    description: 'Express creativity through visual arts and crafts'
  },
  'Music': {
    name: 'Music',
    icon: 'music.note',
    color: '#F59E0B',
    description: 'Explore rhythm, melody, and musical expression'
  },
  'Physical Activity': {
    name: 'Physical Activity',
    icon: 'figure.run',
    color: '#06B6D4',
    description: 'Develop motor skills and healthy habits'
  },
  'Social Skills': {
    name: 'Social Skills',
    icon: 'person.2',
    color: '#84CC16',
    description: 'Learn cooperation, empathy, and communication'
  },
  'Nature Studies': {
    name: 'Nature Studies',
    icon: 'leaf',
    color: '#22C55E',
    description: 'Discover plants, animals, and environmental awareness'
  }
};

// Comprehensive curriculum database
export const CURRICULUM_DATABASE: CurriculumDatabase = {
  'Science': {
    '2-3': [
      {
        id: 'sci-23-001',
        name: 'Colors All Around Us',
        description: 'Discover primary colors in nature and everyday objects',
        objectives: [
          'Identify red, blue, and yellow',
          'Find colors in their environment',
          'Show curiosity about colorful objects'
        ],
        keywords: ['colors', 'primary', 'red', 'blue', 'yellow', 'observation'],
        difficulty: 1,
        estimatedDuration: 20,
        materials: ['colored objects', 'crayons', 'nature items']
      },
      {
        id: 'sci-23-002',
        name: 'Water Play Discovery',
        description: 'Explore water properties through sensory play',
        objectives: [
          'Feel different water temperatures',
          'Observe water pouring and splashing',
          'Use simple water tools safely'
        ],
        keywords: ['water', 'wet', 'dry', 'pour', 'splash', 'sensory'],
        difficulty: 1,
        estimatedDuration: 25,
        materials: ['water table', 'cups', 'sponges', 'towels']
      },
      {
        id: 'sci-23-003',
        name: 'My Five Senses',
        description: 'Introduction to sight, sound, touch, taste, and smell',
        objectives: [
          'Name the five senses',
          'Use senses to explore objects',
          'Describe what they observe'
        ],
        keywords: ['senses', 'see', 'hear', 'touch', 'taste', 'smell'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['textured objects', 'scent jars', 'sound makers']
      }
    ],
    '3-4': [
      {
        id: 'sci-34-001',
        name: 'Plants Need Water',
        description: 'Learn what plants need to grow healthy and strong',
        objectives: [
          'Identify plant parts (roots, stem, leaves)',
          'Understand plants need water and sunlight',
          'Care for a classroom plant'
        ],
        keywords: ['plants', 'grow', 'water', 'sunlight', 'roots', 'leaves'],
        difficulty: 2,
        estimatedDuration: 35,
        materials: ['small plants', 'watering can', 'magnifying glass']
      },
      {
        id: 'sci-34-002',
        name: 'Floating and Sinking',
        description: 'Experiment with objects that float or sink in water',
        objectives: [
          'Predict which objects will float or sink',
          'Test predictions with experiments',
          'Sort objects by their properties'
        ],
        keywords: ['float', 'sink', 'heavy', 'light', 'experiment', 'predict'],
        difficulty: 3,
        estimatedDuration: 40,
        materials: ['water tub', 'various objects', 'recording sheet']
      },
      {
        id: 'sci-34-003',
        name: 'Animal Homes',
        description: 'Discover where different animals live and why',
        objectives: [
          'Match animals to their homes',
          'Explain why animals need shelter',
          'Compare different types of homes'
        ],
        keywords: ['animals', 'homes', 'shelter', 'nest', 'den', 'habitat'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['animal pictures', 'habitat cards', 'matching game']
      }
    ],
    '4-5': [
      {
        id: 'sci-45-001',
        name: 'Simple Machines Helper',
        description: 'Explore how simple machines make work easier',
        objectives: [
          'Identify levers, wheels, and ramps',
          'Demonstrate how machines help us',
          'Build a simple machine'
        ],
        keywords: ['machines', 'lever', 'wheel', 'ramp', 'easier', 'build'],
        difficulty: 4,
        estimatedDuration: 45,
        materials: ['blocks', 'toy cars', 'ramps', 'fulcrum materials']
      },
      {
        id: 'sci-45-002',
        name: 'Weather Scientists',
        description: 'Observe and record daily weather patterns',
        objectives: [
          'Identify different types of weather',
          'Use weather tools to measure',
          'Keep a weather journal'
        ],
        keywords: ['weather', 'sunny', 'rainy', 'cloudy', 'measure', 'record'],
        difficulty: 3,
        estimatedDuration: 35,
        materials: ['thermometer', 'rain gauge', 'weather chart']
      }
    ]
  },

  'Math': {
    '2-3': [
      {
        id: 'math-23-001',
        name: 'Counting Bears Fun',
        description: 'Practice counting from 1 to 5 with colorful bears',
        objectives: [
          'Count objects up to 5',
          'Recognize numbers 1-5',
          'Match number to quantity'
        ],
        keywords: ['counting', 'numbers', 'one', 'two', 'three', 'bears'],
        difficulty: 1,
        estimatedDuration: 20,
        materials: ['counting bears', 'number cards', 'containers']
      },
      {
        id: 'math-23-002',
        name: 'Big and Small Sorting',
        description: 'Compare sizes and sort objects by big and small',
        objectives: [
          'Identify big and small objects',
          'Sort items by size',
          'Use size vocabulary'
        ],
        keywords: ['big', 'small', 'size', 'compare', 'sort'],
        difficulty: 1,
        estimatedDuration: 15,
        materials: ['various sized objects', 'sorting trays']
      }
    ],
    '3-4': [
      {
        id: 'math-34-001',
        name: 'Shape Detective',
        description: 'Hunt for circles, squares, and triangles everywhere',
        objectives: [
          'Identify basic shapes',
          'Find shapes in environment',
          'Create pictures with shapes'
        ],
        keywords: ['shapes', 'circle', 'square', 'triangle', 'find', 'detective'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['shape blocks', 'shape hunt worksheet', 'crayons']
      },
      {
        id: 'math-34-002',
        name: 'Pattern Parade',
        description: 'Create and continue simple AB patterns',
        objectives: [
          'Recognize AB patterns',
          'Continue existing patterns',
          'Create their own patterns'
        ],
        keywords: ['pattern', 'repeat', 'AB', 'continue', 'create'],
        difficulty: 2,
        estimatedDuration: 25,
        materials: ['pattern blocks', 'stickers', 'pattern strips']
      }
    ],
    '4-5': [
      {
        id: 'math-45-001',
        name: 'Addition Stories',
        description: 'Solve simple addition problems through storytelling',
        objectives: [
          'Understand addition as "putting together"',
          'Solve problems up to 10',
          'Tell addition stories'
        ],
        keywords: ['addition', 'plus', 'together', 'stories', 'solve'],
        difficulty: 3,
        estimatedDuration: 35,
        materials: ['manipulatives', 'story cards', 'number line']
      }
    ]
  },

  'Language Arts': {
    '2-3': [
      {
        id: 'lang-23-001',
        name: 'Letter A Adventures',
        description: 'Explore the letter A through fun activities',
        objectives: [
          'Recognize letter A',
          'Find words starting with A',
          'Practice A sound'
        ],
        keywords: ['letter', 'A', 'apple', 'sound', 'alphabet'],
        difficulty: 1,
        estimatedDuration: 20,
        materials: ['letter cards', 'alphabet book', 'art supplies']
      }
    ],
    '3-4': [
      {
        id: 'lang-34-001',
        name: 'Rhyme Time Fun',
        description: 'Discover words that sound alike and create rhymes',
        objectives: [
          'Identify rhyming words',
          'Generate simple rhymes',
          'Enjoy rhythm in language'
        ],
        keywords: ['rhyme', 'sound', 'alike', 'poetry', 'rhythm'],
        difficulty: 2,
        estimatedDuration: 25,
        materials: ['rhyming books', 'picture cards', 'musical instruments']
      }
    ]
  },

  'Art': {
    '2-3': [
      {
        id: 'art-23-001',
        name: 'Finger Paint Rainbow',
        description: 'Create colorful artwork using finger paints',
        objectives: [
          'Explore finger painting techniques',
          'Mix colors to create new ones',
          'Express creativity freely'
        ],
        keywords: ['finger paint', 'colors', 'mix', 'creative', 'messy'],
        difficulty: 1,
        estimatedDuration: 30,
        materials: ['finger paints', 'paper', 'aprons', 'wet wipes']
      }
    ],
    '3-4': [
      {
        id: 'art-34-001',
        name: 'Clay Creations',
        description: 'Sculpt and shape with modeling clay',
        objectives: [
          'Manipulate clay using hands',
          'Create simple objects',
          'Develop fine motor skills'
        ],
        keywords: ['clay', 'sculpt', 'shape', 'create', 'hands'],
        difficulty: 2,
        estimatedDuration: 35,
        materials: ['modeling clay', 'clay tools', 'mats']
      }
    ]
  },

  'Music': {
    '2-3': [
      {
        id: 'music-23-001',
        name: 'Shake and Dance',
        description: 'Move to music with simple instruments',
        objectives: [
          'Follow simple rhythms',
          'Move body to music',
          'Use rhythm instruments'
        ],
        keywords: ['rhythm', 'dance', 'shake', 'music', 'move'],
        difficulty: 1,
        estimatedDuration: 20,
        materials: ['shakers', 'drums', 'scarves', 'music player']
      }
    ]
  },

  'Physical Activity': {
    '2-3': [
      {
        id: 'phys-23-001',
        name: 'Animal Movements',
        description: 'Move like different animals for fun exercise',
        objectives: [
          'Imitate animal movements',
          'Develop gross motor skills',
          'Have fun with movement'
        ],
        keywords: ['animals', 'move', 'hop', 'crawl', 'jump', 'exercise'],
        difficulty: 1,
        estimatedDuration: 15,
        materials: ['animal cards', 'open space', 'music']
      }
    ]
  },

  'Social Skills': {
    '3-4': [
      {
        id: 'social-34-001',
        name: 'Sharing Circle',
        description: 'Learn about taking turns and sharing with friends',
        objectives: [
          'Practice taking turns',
          'Share toys and materials',
          'Use polite words'
        ],
        keywords: ['sharing', 'turns', 'friends', 'polite', 'cooperation'],
        difficulty: 2,
        estimatedDuration: 25,
        materials: ['sharing toys', 'timer', 'discussion cards']
      }
    ]
  },

  'Nature Studies': {
    '3-4': [
      {
        id: 'nature-34-001',
        name: 'Butterfly Life Cycle',
        description: 'Follow a butterfly from egg to adult',
        objectives: [
          'Name stages of butterfly life',
          'Sequence life cycle stages',
          'Appreciate nature\'s changes'
        ],
        keywords: ['butterfly', 'life cycle', 'egg', 'caterpillar', 'chrysalis'],
        difficulty: 3,
        estimatedDuration: 40,
        materials: ['life cycle cards', 'magnifying glass', 'nature journal']
      }
    ]
  }
};

// Helper functions
export const getSubjectTopics = (subject: string, ageGroup: string): CurriculumTopic[] => {
  return CURRICULUM_DATABASE[subject]?.[ageGroup] || [];
};

export const getAllTopicsForSubject = (subject: string): CurriculumTopic[] => {
  const subjectData = CURRICULUM_DATABASE[subject];
  if (!subjectData) return [];
  
  return Object.values(subjectData).flat();
};

export const getTopicById = (topicId: string): CurriculumTopic | undefined => {
  for (const subject of Object.values(CURRICULUM_DATABASE)) {
    for (const ageGroup of Object.values(subject)) {
      const topic = ageGroup.find(t => t.id === topicId);
      if (topic) return topic;
    }
  }
  return undefined;
};

export const searchTopics = (query: string, subject?: string, ageGroup?: string): CurriculumTopic[] => {
  const searchTerm = query.toLowerCase();
  const results: CurriculumTopic[] = [];
  
  const subjectsToSearch = subject ? [subject] : Object.keys(CURRICULUM_DATABASE);
  
  subjectsToSearch.forEach(subj => {
    const subjectData = CURRICULUM_DATABASE[subj];
    if (!subjectData) return;
    
    const ageGroupsToSearch = ageGroup ? [ageGroup] : Object.keys(subjectData);
    
    ageGroupsToSearch.forEach(age => {
      const topics = subjectData[age] || [];
      topics.forEach(topic => {
        if (
          topic.name.toLowerCase().includes(searchTerm) ||
          topic.description.toLowerCase().includes(searchTerm) ||
          topic.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
          topic.objectives.some(obj => obj.toLowerCase().includes(searchTerm))
        ) {
          results.push(topic);
        }
      });
    });
  });
  
  return results;
};

// Common learning objectives by category
export const COMMON_OBJECTIVES = {
  'Cognitive Development': [
    'Demonstrate problem-solving skills',
    'Show curiosity and ask questions',
    'Make observations and comparisons',
    'Follow multi-step instructions',
    'Remember and recall information'
  ],
  'Language Development': [
    'Express ideas clearly',
    'Listen actively to others',
    'Use descriptive vocabulary',
    'Participate in conversations',
    'Show interest in books and stories'
  ],
  'Social-Emotional': [
    'Work cooperatively with peers',
    'Show empathy and kindness',
    'Manage emotions appropriately',
    'Take turns and share materials',
    'Build confidence and self-esteem'
  ],
  'Physical Development': [
    'Develop fine motor skills',
    'Strengthen gross motor abilities',
    'Coordinate movements',
    'Practice healthy habits',
    'Use tools safely and effectively'
  ],
  'Creative Expression': [
    'Express creativity through art',
    'Explore different materials',
    'Make choices in creative work',
    'Appreciate beauty in nature and art',
    'Use imagination in play and work'
  ]
};
