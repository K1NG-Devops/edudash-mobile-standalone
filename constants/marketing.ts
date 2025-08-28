import { getRoleColors } from '@/constants/DesignSystem'

export type RoleId = 'parent' | 'teacher' | 'principal'

export interface RoleContent {
  id: RoleId
  title: string
  subtitle: string
  description: string
  cta: string
}

export interface FeatureContent {
  id: string
  title: string
  subtitle: string
  description: string
  tech?: string
}

export interface TestimonialContent {
  id: string
  name: string
  role: string
  org: string
  message: string
  rating: number
  imageUri?: string | null
  isVideo?: boolean
}

export const rolesContent: RoleContent[] = [
  {
    id: 'parent',
    title: 'Parents & Guardians',
    subtitle: "Monitor & Support Your Child's Journey",
    description: "Stay connected with your child's educational progress",
    cta: 'Join as Parent',
  },
  {
    id: 'teacher',
    title: 'Teachers & Educators',
    subtitle: 'AI-Powered Teaching Revolution',
    description: 'Transform your classroom with intelligent tools',
    cta: 'Join as Teacher',
  },
  {
    id: 'principal',
    title: 'Principals & Admins',
    subtitle: 'Complete School Management',
    description: 'Oversee your institution with comprehensive tools',
    cta: 'Register School',
  },
]

export const featuresContent: FeatureContent[] = [
  {
    id: 'quantum-ai',
    title: 'Quantum AI Brain',
    subtitle: 'Neural Processing Unit',
    description: 'Advanced AI that adapts to every student and every class',
    tech: 'Claude 4.0 + Advanced Compute',
  },
  {
    id: 'robotic-tutors',
    title: 'Robotic Tutors',
    subtitle: 'Digital Companions',
    description: 'Virtual teachers for always-on support',
    tech: 'AR/VR + Machine Learning',
  },
  {
    id: 'predictive-analytics',
    title: 'Predictive Analytics',
    subtitle: 'Future Vision',
    description: 'Anticipate needs and remove learning blockers early',
    tech: 'Deep Learning + Big Data',
  },
  {
    id: 'holographic-lessons',
    title: 'Immersive Lessons',
    subtitle: '3D Reality',
    description: 'Bring learning to life with interactive content',
    tech: 'Spatial Computing',
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    subtitle: 'Brain Sync',
    description: 'Fast knowledge transfer with adaptive pathways',
    tech: 'BCI + Neuromorphic',
  },
  {
    id: 'metaverse-campus',
    title: 'Metaverse Campus',
    subtitle: 'Virtual World',
    description: 'Unified virtual spaces for learning and collaboration',
    tech: 'Web3 + VR',
  },
]

export const testimonialsContent: TestimonialContent[] = [
  {
    id: 'sarah-chen',
    name: 'Dr. Sarah Chen',
    role: 'Quantum Education Specialist',
    org: 'Neo Tokyo Academy',
    message:
      "EduDash Pro has revolutionized our teaching methods. The AI is so advanced, it's like having a team of PhD educators in every classroom.",
    rating: 5,
    imageUri: null,
    isVideo: true,
  },
  {
    id: 'marcus-webb',
    name: 'Prof. Marcus Webb',
    role: 'Neural Interface Designer',
    org: 'Cyberpunk University',
    message:
      'The neural network integration is phenomenal. Students are learning 10x faster than traditional methods.',
    rating: 5,
    imageUri: null,
  },
  {
    id: 'mabol-mabasa',
    name: 'Principal Mabol Mabasa',
    role: 'Future Learning Director',
    org: 'Quantum Kids Academy',
    message:
      "Society 5.0 education is finally here. Our students are preparing for jobs that don't even exist yet.",
    rating: 5,
    imageUri: null,
    isVideo: true,
  },
]

