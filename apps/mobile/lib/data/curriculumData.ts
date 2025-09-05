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
  '5-6': '5-6 years',
  // Extended ranges for primary and secondary
  '5-7': '5-7 years',
  '8-10': '8-10 years',
  '11-13': '11-13 years',
  '14-18': '14-18 years'
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
  },
  // New subjects for expanded Robotics/AI/STEM focus
  'Technology': {
    name: 'Technology',
    icon: 'desktopcomputer',
    color: '#0EA5E9',
    description: 'Explore tools, systems, and digital literacy'
  },
  'Engineering': {
    name: 'Engineering',
    icon: 'wrench.and.screwdriver',
    color: '#F97316',
    description: 'Design, build, test, and improve solutions'
  },
  'Robotics': {
    name: 'Robotics',
    icon: 'dot.radiowaves.left.and.right',
    color: '#E11D48',
    description: 'Design simple robots and learn sensors, motion, and logic'
  },
  'AI Literacy': {
    name: 'AI Literacy',
    icon: 'brain.head.profile',
    color: '#7C3AED',
    description: 'Understand AI concepts, patterns, ethics, and safe usage'
  },
  'Computer Science': {
    name: 'Computer Science',
    icon: 'chevron.left.slash.chevron.right',
    color: '#10B981',
    description: 'Algorithms, coding, data, and problem solving'
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
  },

  // New: Technology
  'Technology': {
    '5-7': [
      {
        id: 'tech-57-001',
        name: 'Intro to Digital Devices',
        description: 'Identify common devices and what they do',
        objectives: ['Name device parts', 'Explain safe usage', 'Compare input and output'],
        keywords: ['devices', 'tablet', 'computer', 'input', 'output', 'safety'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['tablet or computer', 'picture cards']
      }
    ],
    '8-10': [
      {
        id: 'tech-810-001',
        name: 'Digital Citizenship Basics',
        description: 'Explore online safety, privacy, and kindness',
        objectives: ['Explain privacy', 'Recognize safe sharing', 'Practice netiquette'],
        keywords: ['privacy', 'passwords', 'kindness', 'netiquette'],
        difficulty: 2,
        estimatedDuration: 40,
        materials: ['scenario cards']
      }
    ],
    '11-13': [
      {
        id: 'tech-1113-001',
        name: 'What is Data?',
        description: 'Collect, organize, and visualize data responsibly',
        objectives: ['Collect data', 'Create simple charts', 'Discuss bias'],
        keywords: ['data', 'charts', 'bias', 'privacy'],
        difficulty: 3,
        estimatedDuration: 45,
        materials: ['spreadsheet', 'survey forms']
      }
    ],
    '14-18': [
      {
        id: 'tech-1418-001',
        name: 'Human-Centered Tech Design',
        description: 'Apply design thinking to solve real problems ethically',
        objectives: ['Empathize with users', 'Prototype solutions', 'Consider ethics'],
        keywords: ['design thinking', 'ethics', 'prototype'],
        difficulty: 4,
        estimatedDuration: 60,
        materials: ['paper', 'prototyping materials']
      }
    ]
  },

  // New: Engineering
  'Engineering': {
    '5-7': [
      {
        id: 'eng-57-001',
        name: 'Build a Bridge',
        description: 'Design and test simple bridges from everyday materials',
        objectives: ['Plan and build', 'Test and observe', 'Improve design'],
        keywords: ['bridge', 'design', 'test', 'improve'],
        difficulty: 2,
        estimatedDuration: 40,
        materials: ['paper', 'tape', 'blocks']
      }
    ],
    '8-10': [
      {
        id: 'eng-810-001',
        name: 'Simple Machines Project',
        description: 'Combine levers and wheels to solve a task',
        objectives: ['Identify simple machines', 'Build a compound machine', 'Explain how it works'],
        keywords: ['lever', 'wheel', 'pulley', 'force'],
        difficulty: 3,
        estimatedDuration: 50,
        materials: ['craft sticks', 'spools', 'string']
      }
    ],
    '11-13': [
      {
        id: 'eng-1113-001',
        name: 'Design Process Challenge',
        description: 'Use plan-build-test-iterate on a real challenge',
        objectives: ['Apply constraints', 'Iterate with data', 'Present results'],
        keywords: ['iterate', 'constraints', 'data'],
        difficulty: 3,
        estimatedDuration: 60,
        materials: ['varied prototyping materials']
      }
    ],
    '14-18': [
      {
        id: 'eng-1418-001',
        name: 'Sustainable Engineering',
        description: 'Evaluate material choices and environmental impact',
        objectives: ['Analyze trade-offs', 'Optimize design', 'Reflect on sustainability'],
        keywords: ['sustainability', 'optimize', 'trade-offs'],
        difficulty: 4,
        estimatedDuration: 60,
        materials: ['research materials', 'testing setup']
      }
    ]
  },

  // New: Robotics
  'Robotics': {
    '5-7': [
      {
        id: 'rob-57-001',
        name: 'Unplugged Robotics',
        description: 'Use arrows and cards to “program” a friend robot',
        objectives: ['Sequence steps', 'Debug simple mistakes', 'Use directional language'],
        keywords: ['sequence', 'debug', 'direction'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['arrow cards', 'tape grid']
      }
    ],
    '8-10': [
      {
        id: 'rob-810-001',
        name: 'Line-Following Basics',
        description: 'Build and tune a simple line-following robot with a kit',
        objectives: ['Explain sensors', 'Tune thresholds', 'Test and iterate'],
        keywords: ['sensor', 'line-follow', 'iteration'],
        difficulty: 3,
        estimatedDuration: 60,
        materials: ['beginner robotics kit', 'tape track']
      }
    ],
    '11-13': [
      {
        id: 'rob-1113-001',
        name: 'Sensors and Actuators',
        description: 'Program a microcontroller to read sensors and control motors',
        objectives: ['Read analog sensor', 'Control motor speed', 'Use feedback'],
        keywords: ['microcontroller', 'sensor', 'actuator'],
        difficulty: 4,
        estimatedDuration: 75,
        materials: ['Arduino/micro:bit', 'breadboard', 'motor']
      }
    ],
    '14-18': [
      {
        id: 'rob-1418-001',
        name: 'Autonomous Challenge',
        description: 'Implement navigation and obstacle avoidance',
        objectives: ['Use control loops', 'Calibrate sensors', 'Evaluate performance'],
        keywords: ['PID', 'navigation', 'autonomy'],
        difficulty: 5,
        estimatedDuration: 90,
        materials: ['robot kit', 'sensors', 'course']
      }
    ]
  },

  // New: AI Literacy
  'AI Literacy': {
    '5-7': [
      {
        id: 'ai-57-001',
        name: 'Spot the Pattern',
        description: 'Find patterns and give simple instructions like a mini-AI',
        objectives: ['Recognize patterns', 'Give clear steps', 'Discuss fairness'],
        keywords: ['patterns', 'instructions', 'fairness'],
        difficulty: 1,
        estimatedDuration: 25,
        materials: ['pattern blocks', 'cards']
      }
    ],
    '8-10': [
      {
        id: 'ai-810-001',
        name: 'How AIs Learn',
        description: 'Train a paper “model” with examples and test it',
        objectives: ['Define training data', 'Test with new data', 'Avoid bias'],
        keywords: ['training', 'bias', 'generalize'],
        difficulty: 2,
        estimatedDuration: 40,
        materials: ['paper dataset', 'stickers']
      }
    ],
    '11-13': [
      {
        id: 'ai-1113-001',
        name: 'Classification & Ethics',
        description: 'Build a simple classifier and discuss ethical trade-offs',
        objectives: ['Choose features', 'Measure accuracy', 'Debate impacts'],
        keywords: ['classifier', 'features', 'ethics'],
        difficulty: 3,
        estimatedDuration: 60,
        materials: ['spreadsheet', 'sample data']
      }
    ],
    '14-18': [
      {
        id: 'ai-1418-001',
        name: 'Intro to ML Projects',
        description: 'Prototype a small ML project with careful data handling',
        objectives: ['Define problem', 'Prepare data', 'Evaluate metrics', 'Consider privacy'],
        keywords: ['ML', 'metrics', 'privacy', 'bias'],
        difficulty: 4,
        estimatedDuration: 90,
        materials: ['Python/JS runtime or no-code tool']
      }
    ]
  },

  // New: Computer Science
  'Computer Science': {
    '5-7': [
      {
        id: 'cs-57-001',
        name: 'Sequencing Stories',
        description: 'Put story steps in order and “program” a character',
        objectives: ['Sequence steps', 'Use loops as repeats', 'Debug simple errors'],
        keywords: ['sequence', 'loop', 'debug'],
        difficulty: 2,
        estimatedDuration: 30,
        materials: ['story cards']
      }
    ],
    '8-10': [
      {
        id: 'cs-810-001',
        name: 'Block Coding Basics',
        description: 'Create an interactive project in a block language',
        objectives: ['Understand events', 'Use variables', 'Share project'],
        keywords: ['blocks', 'variables', 'events'],
        difficulty: 2,
        estimatedDuration: 60,
        materials: ['Scratch or similar']
      }
    ],
    '11-13': [
      {
        id: 'cs-1113-001',
        name: 'Intro to Algorithms',
        description: 'Design and analyze simple algorithms',
        objectives: ['Design steps', 'Analyze efficiency', 'Test cases'],
        keywords: ['algorithm', 'efficiency', 'test'],
        difficulty: 3,
        estimatedDuration: 60,
        materials: ['pseudocode sheets']
      }
    ],
    '14-18': [
      {
        id: 'cs-1418-001',
        name: 'Python Fundamentals',
        description: 'Write small programs using core language features',
        objectives: ['Use control flow', 'Manipulate data', 'Structure code'],
        keywords: ['python', 'loops', 'functions'],
        difficulty: 4,
        estimatedDuration: 90,
        materials: ['laptop', 'IDE or online REPL']
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
