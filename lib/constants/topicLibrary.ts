// Topic Library for AI Lesson Generator
// Organized by categories and subjects for easy filtering

export interface Topic {
  id: string;
  name: string;
  description: string;
  ageGroups: string[];
  difficulty: 'easy' | 'medium' | 'challenging';
  duration: number; // minutes
  learningObjectives: string[];
}

export interface TopicCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subjects: string[];
  topics: Topic[];
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'stem',
    name: 'STEM',
    icon: 'gear',
    description: 'Science, Technology, Engineering & Math',
    subjects: ['Science', 'Math', 'Engineering', 'Technology'],
    topics: [
      {
        id: 'colors-rainbow',
        name: 'Colors and Rainbows',
        description: 'Explore primary colors, mixing, and rainbow formation',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Recognize primary colors', 'Understand color mixing', 'Observe rainbow patterns']
      },
      {
        id: 'simple-machines',
        name: 'Simple Machines',
        description: 'Introduction to levers, wheels, pulleys, and ramps',
        ageGroups: ['4-5 years'],
        difficulty: 'medium',
        duration: 45,
        learningObjectives: ['Identify simple machines', 'Understand how they help us', 'Build basic machines']
      },
      {
        id: 'counting-numbers',
        name: 'Numbers and Counting',
        description: 'Building number sense through hands-on activities',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 25,
        learningObjectives: ['Count objects to 10', 'Recognize numerals', 'Practice one-to-one correspondence']
      },
      {
        id: 'shapes-patterns',
        name: 'Shapes and Patterns',
        description: 'Exploring geometric shapes and pattern creation',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Identify basic shapes', 'Create simple patterns', 'Sort by attributes']
      },
      {
        id: 'weather-science',
        name: 'Weather and Seasons',
        description: 'Understanding weather patterns and seasonal changes',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 35,
        learningObjectives: ['Observe daily weather', 'Identify seasonal changes', 'Predict weather patterns']
      },
      {
        id: 'plants-growth',
        name: 'How Plants Grow',
        description: 'Life cycles, plant needs, and garden exploration',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 40,
        learningObjectives: ['Understand plant needs', 'Observe growth stages', 'Care for living things']
      }
    ]
  },
  {
    id: 'robotics',
    name: 'ROBOTICS',
    icon: 'dot.radiowaves.left.and.right',
    description: 'Unplugged robotics, sensors, and autonomous challenges',
    subjects: ['Robotics', 'Engineering', 'Technology'],
    topics: [
      {
        id: 'unplugged-robot',
        name: 'Unplugged Robot Sequencing',
        description: 'Use arrows to “program” movement and debug',
        ageGroups: ['5-7 years', '8-10 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Sequence steps', 'Debug mistakes', 'Use directional language']
      },
      {
        id: 'line-following',
        name: 'Line-Following Robot Basics',
        description: 'Build and tune a simple line follower',
        ageGroups: ['8-10 years', '11-13 years'],
        difficulty: 'medium',
        duration: 60,
        learningObjectives: ['Explain sensors', 'Tune thresholds', 'Test and iterate']
      },
      {
        id: 'sensors-actuators',
        name: 'Sensors and Actuators 101',
        description: 'Read sensors and drive motors with a microcontroller',
        ageGroups: ['11-13 years', '14-18 years'],
        difficulty: 'challenging',
        duration: 75,
        learningObjectives: ['Read analog sensor', 'Control motor speed', 'Use feedback']
      }
    ]
  },
  {
    id: 'ai-literacy',
    name: 'AI & DIGITAL LITERACY',
    icon: 'brain.head.profile',
    description: 'Patterns, training, fairness, and safe tech use',
    subjects: ['AI Literacy', 'Technology', 'Computer Science'],
    topics: [
      {
        id: 'pattern-spotting',
        name: 'Pattern Spotting',
        description: 'Find patterns and give clear instructions',
        ageGroups: ['5-7 years', '8-10 years'],
        difficulty: 'easy',
        duration: 25,
        learningObjectives: ['Recognize patterns', 'Give instructions', 'Discuss fairness']
      },
      {
        id: 'train-a-model',
        name: 'Train a Paper Model',
        description: 'Use examples to “train” and test a classifier',
        ageGroups: ['8-10 years', '11-13 years'],
        difficulty: 'medium',
        duration: 40,
        learningObjectives: ['Define training data', 'Test new data', 'Avoid bias']
      },
      {
        id: 'ml-mini-project',
        name: 'ML Mini Project',
        description: 'Prototype a tiny ML app and evaluate metrics',
        ageGroups: ['14-18 years'],
        difficulty: 'challenging',
        duration: 90,
        learningObjectives: ['Define problem & metric', 'Prepare data responsibly', 'Evaluate results']
      }
    ]
  },
  {
    id: 'arts',
    name: 'ARTS',
    icon: 'paintbrush',
    description: 'Creative expression through art, music & drama',
    subjects: ['Art', 'Music', 'Creative Expression', 'Drama'],
    topics: [
      {
        id: 'color-mixing',
        name: 'Color Mixing Magic',
        description: 'Explore primary and secondary colors through painting',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Mix primary colors', 'Create artwork', 'Express creativity']
      },
      {
        id: 'rhythm-music',
        name: 'Rhythm and Movement',
        description: 'Musical instruments, beats, and creative movement',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 25,
        learningObjectives: ['Follow rhythm patterns', 'Move to music', 'Use instruments']
      },
      {
        id: 'storytelling-drama',
        name: 'Storytelling Adventures',
        description: 'Creative storytelling with props and dramatic play',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 35,
        learningObjectives: ['Tell stories', 'Use imagination', 'Act out scenarios']
      },
      {
        id: 'sculpture-clay',
        name: 'Clay and Sculpture',
        description: '3D art creation with clay and modeling materials',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 40,
        learningObjectives: ['Shape and mold clay', 'Create 3D forms', 'Develop fine motor skills']
      }
    ]
  },
  {
    id: 'culture',
    name: 'CULTURE',
    icon: 'globe',
    description: 'Exploring cultures, traditions & communities',
    subjects: ['Social Studies', 'Culture', 'Community', 'History'],
    topics: [
      {
        id: 'families-traditions',
        name: 'Families and Traditions',
        description: 'Celebrating family diversity and cultural traditions',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Describe family members', 'Share traditions', 'Respect differences']
      },
      {
        id: 'community-helpers',
        name: 'Community Helpers',
        description: 'Learning about jobs and how people help each other',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 35,
        learningObjectives: ['Identify community jobs', 'Understand helping others', 'Role-play careers']
      },
      {
        id: 'world-celebrations',
        name: 'Celebrations Around the World',
        description: 'Exploring holidays and festivals from different cultures',
        ageGroups: ['4-5 years'],
        difficulty: 'medium',
        duration: 40,
        learningObjectives: ['Learn about celebrations', 'Compare traditions', 'Appreciate diversity']
      },
      {
        id: 'food-cultures',
        name: 'Foods from Around the World',
        description: 'Discovering international cuisines and cooking traditions',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 35,
        learningObjectives: ['Taste new foods', 'Learn cooking traditions', 'Explore cultures through food']
      }
    ]
  },
  {
    id: 'nature',
    name: 'NATURE',
    icon: 'leaf',
    description: 'Outdoor exploration & environmental awareness',
    subjects: ['Science', 'Nature Studies', 'Environmental Science', 'Physical Activity'],
    topics: [
      {
        id: 'animal-habitats',
        name: 'Animal Homes',
        description: 'Where animals live and how they survive',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 35,
        learningObjectives: ['Match animals to habitats', 'Understand animal needs', 'Observe local wildlife']
      },
      {
        id: 'insects-bugs',
        name: 'Insects and Bugs',
        description: 'Exploring the fascinating world of small creatures',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 30,
        learningObjectives: ['Identify common insects', 'Observe insect behavior', 'Understand ecosystem roles']
      },
      {
        id: 'rocks-minerals',
        name: 'Rocks and Minerals',
        description: 'Geological exploration and rock collecting',
        ageGroups: ['4-5 years'],
        difficulty: 'challenging',
        duration: 40,
        learningObjectives: ['Sort and classify rocks', 'Observe properties', 'Create rock collections']
      },
      {
        id: 'water-cycle',
        name: 'The Water Cycle',
        description: 'How water moves through our environment',
        ageGroups: ['4-5 years'],
        difficulty: 'challenging',
        duration: 45,
        learningObjectives: ['Understand evaporation', 'Observe condensation', 'Track water movement']
      },
      {
        id: 'garden-seeds',
        name: 'Seeds and Growing',
        description: 'Planting, caring for, and observing plant growth',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Plant seeds', 'Care for plants', 'Observe daily changes']
      }
    ]
  },
  {
    id: 'language',
    name: 'LANGUAGE',
    icon: 'book',
    description: 'Reading, writing & communication skills',
    subjects: ['Language Arts', 'Reading', 'Writing', 'Communication'],
    topics: [
      {
        id: 'alphabet-letters',
        name: 'Letters and Sounds',
        description: 'Introduction to alphabet and phonetic awareness',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 25,
        learningObjectives: ['Recognize letters', 'Match sounds to letters', 'Practice letter formation']
      },
      {
        id: 'storytelling-books',
        name: 'Story Time Adventures',
        description: 'Reading comprehension and story creation',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Listen to stories', 'Retell events', 'Create own stories']
      },
      {
        id: 'rhyming-poetry',
        name: 'Rhymes and Poetry',
        description: 'Exploring rhythm, rhyme, and word play',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'medium',
        duration: 25,
        learningObjectives: ['Identify rhyming words', 'Create simple poems', 'Play with language']
      },
      {
        id: 'writing-practice',
        name: 'Beginning Writing',
        description: 'Pre-writing skills and early letter formation',
        ageGroups: ['4-5 years'],
        difficulty: 'medium',
        duration: 30,
        learningObjectives: ['Hold writing tools correctly', 'Practice letter shapes', 'Write own name']
      }
    ]
  },
  {
    id: 'social',
    name: 'SOCIAL-EMOTIONAL',
    icon: 'heart',
    description: 'Emotional intelligence & social skills',
    subjects: ['Social Skills', 'Emotional Development', 'Character Building'],
    topics: [
      {
        id: 'feelings-emotions',
        name: 'Understanding Feelings',
        description: 'Identifying and expressing emotions appropriately',
        ageGroups: ['2-3 years', '3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 25,
        learningObjectives: ['Name basic emotions', 'Express feelings safely', 'Recognize others\' emotions']
      },
      {
        id: 'friendship-sharing',
        name: 'Making Friends',
        description: 'Building social skills and learning to share',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Practice sharing', 'Use kind words', 'Include others in play']
      },
      {
        id: 'problem-solving',
        name: 'Problem Solving Together',
        description: 'Conflict resolution and collaborative thinking',
        ageGroups: ['4-5 years'],
        difficulty: 'medium',
        duration: 35,
        learningObjectives: ['Solve problems peacefully', 'Work together', 'Find fair solutions']
      },
      {
        id: 'kindness-empathy',
        name: 'Acts of Kindness',
        description: 'Developing empathy and caring for others',
        ageGroups: ['3-4 years', '4-5 years'],
        difficulty: 'easy',
        duration: 30,
        learningObjectives: ['Show kindness to others', 'Help classmates', 'Understand others\' feelings']
      }
    ]
  }
];

// Helper functions for topic filtering and selection
export const getTopicsByCategory = (categoryId: string): Topic[] => {
  const category = TOPIC_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.topics || [];
};

export const getTopicsBySubject = (subject: string): Topic[] => {
  const allTopics: Topic[] = [];
  TOPIC_CATEGORIES.forEach(category => {
    if (category.subjects.includes(subject)) {
      allTopics.push(...category.topics);
    }
  });
  return allTopics;
};

export const getTopicsByAgeGroup = (ageGroup: string): Topic[] => {
  const allTopics: Topic[] = [];
  TOPIC_CATEGORIES.forEach(category => {
    category.topics.forEach(topic => {
      if (topic.ageGroups.includes(ageGroup)) {
        allTopics.push(topic);
      }
    });
  });
  return allTopics;
};

export const getTopicsByDifficulty = (difficulty: 'easy' | 'medium' | 'challenging'): Topic[] => {
  const allTopics: Topic[] = [];
  TOPIC_CATEGORIES.forEach(category => {
    category.topics.forEach(topic => {
      if (topic.difficulty === difficulty) {
        allTopics.push(topic);
      }
    });
  });
  return allTopics;
};

export const searchTopics = (query: string): Topic[] => {
  const allTopics: Topic[] = [];
  TOPIC_CATEGORIES.forEach(category => {
    allTopics.push(...category.topics);
  });
  
  return allTopics.filter(topic =>
    topic.name.toLowerCase().includes(query.toLowerCase()) ||
    topic.description.toLowerCase().includes(query.toLowerCase()) ||
    topic.learningObjectives.some(obj => obj.toLowerCase().includes(query.toLowerCase()))
  );
};

export const getFilteredTopics = (filters: {
  category?: string;
  subject?: string;
  ageGroup?: string;
  difficulty?: 'easy' | 'medium' | 'challenging';
}): Topic[] => {
  let topics: Topic[] = [];
  
  // Get all topics from all categories initially
  TOPIC_CATEGORIES.forEach(category => {
    topics.push(...category.topics);
  });
  
  // Apply category filter
  if (filters.category) {
    topics = getTopicsByCategory(filters.category);
  }
  
  // Apply subject filter
  if (filters.subject) {
    const subjectTopics = getTopicsBySubject(filters.subject);
    topics = topics.filter(topic => subjectTopics.some(st => st.id === topic.id));
  }
  
  // Apply age group filter
  if (filters.ageGroup) {
    topics = topics.filter(topic => topic.ageGroups.includes(filters.ageGroup!));
  }
  
  // Apply difficulty filter
  if (filters.difficulty) {
    topics = topics.filter(topic => topic.difficulty === filters.difficulty);
  }
  
  return topics;
};
