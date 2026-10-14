// The reference data of ARCHITECTURE.md 3.4 and 9.3: the seven pathways (brief section 8), the
// seven badges and the hardware platforms. This file is their only source; the seed never
// writes them. Running it again rewrites every document with these fields and keeps its
// createdAt; a pathway's publishedCourseCount is recomputed from the courses.

import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { collections } from '@/lib/firebase/collections';
import type { Pathway } from '@/types/content';
import type { Badge } from '@/types/gamification';
import type { HardwarePlatform } from '@/types/hardware';
import { upsertDocuments, type DocumentWrite } from '../lib/firestore';

export const id = '0001_initial';
export const description =
  'Reference data: the seven pathways, the seven badges and the hardware platforms.';

export type PathwayDefinition = Omit<Pathway, 'createdAt' | 'updatedAt' | 'publishedCourseCount'>;
export type BadgeDefinition = Omit<Badge, 'createdAt' | 'updatedAt'>;
export type HardwarePlatformDefinition = Omit<HardwarePlatform, 'createdAt' | 'updatedAt'>;

// Icons are names of ICON_NAMES (src/components/domain/NamedIcon.tsx, section 7.4).

export const PATHWAYS: readonly PathwayDefinition[] = [
  {
    id: 'ai-explorer',
    order: 1,
    audience: 'student',
    kind: 'core',
    ageMin: 8,
    ageMax: 10,
    icon: 'Compass',
    accent: 'violet',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Explorer',
        tagline: 'Discover what artificial intelligence is and make your first AI creations.',
        description:
          'A first journey into artificial intelligence for young explorers: what AI is, how it is different from people, how to talk to it with prompts, and how to use it kindly and safely. Every course ends with a small project to show.',
        topics: [
          'What is AI?',
          'Humans vs machines',
          'Prompts',
          'AI stories',
          'AI images',
          'AI voice',
          'Responsible AI',
          'Simple projects',
        ],
      },
      fr: {
        title: 'Explorateur IA',
        tagline:
          "Découvre ce qu'est l'intelligence artificielle et réalise tes premières créations avec l'IA.",
        description:
          "Un premier voyage dans l'intelligence artificielle pour les jeunes explorateurs : ce qu'est l'IA, en quoi elle est différente des personnes, comment lui parler avec des consignes et comment l'utiliser avec bienveillance et prudence. Chaque cours se termine par un petit projet à montrer.",
        topics: [
          "Qu'est-ce que l'IA ?",
          'Humains et machines',
          'Les consignes (prompts)',
          'Histoires avec l’IA',
          'Images avec l’IA',
          'Voix avec l’IA',
          'IA responsable',
          'Projets simples',
        ],
      },
    },
  },
  {
    id: 'ai-creator',
    order: 2,
    audience: 'student',
    kind: 'core',
    ageMin: 10,
    ageMax: 12,
    icon: 'WandSparkles',
    accent: 'cyan',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Creator',
        tagline: 'Create images, sounds, videos and games with generative AI.',
        description:
          'Learners become creators: they write better prompts, generate images, video and audio, build small AI assistants and games, meet data for the first time and finish with a creator project of their own.',
        topics: [
          'Better prompting',
          'Image generation',
          'Video generation',
          'Audio generation',
          'AI assistants',
          'AI games',
          'Introduction to data',
          'Responsible AI',
          'Creator project',
        ],
      },
      fr: {
        title: 'Créateur IA',
        tagline: "Crée des images, des sons, des vidéos et des jeux avec l'IA générative.",
        description:
          'Les apprenants deviennent créateurs : ils écrivent de meilleures consignes, génèrent des images, des vidéos et des sons, construisent de petits assistants et jeux IA, découvrent les données et terminent par un projet de création personnel.',
        topics: [
          'Mieux formuler ses consignes',
          "Génération d'images",
          'Génération de vidéos',
          'Génération audio',
          'Assistants IA',
          'Jeux avec l’IA',
          'Introduction aux données',
          'IA responsable',
          'Projet de création',
        ],
      },
    },
  },
  {
    id: 'ai-builder',
    order: 3,
    audience: 'student',
    kind: 'core',
    ageMin: 12,
    ageMax: 14,
    icon: 'Blocks',
    accent: 'emerald',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Builder',
        tagline: 'Understand how machines learn and build your first AI models.',
        description:
          'From user to builder: how machines learn from data, image classification and computer vision, chatbot design, block coding, a first look at AI with robots, the problem of bias, and a capstone project.',
        topics: [
          'How machines learn',
          'Datasets',
          'Image classification',
          'Computer vision',
          'Chatbot design',
          'Block coding',
          'AI and robotics',
          'Bias',
          'Capstone project',
        ],
      },
      fr: {
        title: 'Bâtisseur IA',
        tagline:
          "Comprends comment les machines apprennent et construis tes premiers modèles d'IA.",
        description:
          "D'utilisateur à bâtisseur : comment les machines apprennent à partir des données, la classification d'images et la vision par ordinateur, la conception de chatbots, la programmation par blocs, un premier regard sur l'IA avec les robots, le problème des biais et un projet final.",
        topics: [
          'Comment les machines apprennent',
          'Jeux de données',
          "Classification d'images",
          'Vision par ordinateur',
          'Conception de chatbots',
          'Programmation par blocs',
          'IA et robotique',
          'Les biais',
          'Projet final',
        ],
      },
    },
  },
  {
    id: 'ai-engineer',
    order: 4,
    audience: 'student',
    kind: 'core',
    ageMin: 14,
    ageMax: 16,
    icon: 'CircuitBoard',
    accent: 'amber',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Engineer',
        tagline: 'Code real machine learning in Python, from data to deployed models.',
        description:
          'Python, data and the basics of machine learning: classification, computer vision, natural language processing, APIs and automation, robotics with computer vision, and an engineering challenge to close the pathway.',
        topics: [
          'Python',
          'Data',
          'Machine learning basics',
          'Classification',
          'Computer vision',
          'Natural language processing',
          'APIs',
          'Automation',
          'Robotics and computer vision',
          'Engineering challenge',
        ],
      },
      fr: {
        title: 'Ingénieur IA',
        tagline:
          "Programme du vrai apprentissage automatique en Python, des données jusqu'aux modèles déployés.",
        description:
          "Python, les données et les bases de l'apprentissage automatique : classification, vision par ordinateur, traitement du langage naturel, API et automatisation, robotique avec vision par ordinateur, et un défi d'ingénierie pour clore le parcours.",
        topics: [
          'Python',
          'Données',
          "Bases de l'apprentissage automatique",
          'Classification',
          'Vision par ordinateur',
          'Traitement du langage naturel',
          'API',
          'Automatisation',
          'Robotique et vision par ordinateur',
          "Défi d'ingénierie",
        ],
      },
    },
  },
  {
    id: 'ai-innovator',
    order: 5,
    audience: 'student',
    kind: 'core',
    ageMin: 16,
    ageMax: 18,
    icon: 'Rocket',
    accent: 'rose',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Innovator',
        tagline: 'Turn AI ideas into products, agents and a startup of your own.',
        description:
          'Advanced generative AI, AI products and agents, automation, responsible AI, entrepreneurship, business and society, the creation of a startup and a capstone project that brings it all together.',
        topics: [
          'Advanced generative AI',
          'AI products',
          'AI agents',
          'Automation',
          'Responsible AI',
          'Entrepreneurship',
          'Business',
          'Society',
          'Startup creation',
          'Capstone project',
        ],
      },
      fr: {
        title: 'Innovateur IA',
        tagline: "Transforme des idées d'IA en produits, en agents et en start-up.",
        description:
          "IA générative avancée, produits et agents IA, automatisation, IA responsable, entrepreneuriat, entreprise et société, création d'une start-up et un projet final qui rassemble le tout.",
        topics: [
          'IA générative avancée',
          'Produits IA',
          'Agents IA',
          'Automatisation',
          'IA responsable',
          'Entrepreneuriat',
          'Entreprise',
          'Société',
          "Création d'une start-up",
          'Projet final',
        ],
      },
    },
  },
  {
    id: 'ai-robotics',
    order: 6,
    audience: 'student',
    kind: 'robotics',
    ageMin: 8,
    ageMax: 18,
    icon: 'Bot',
    accent: 'blue',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Robotics',
        tagline: 'Give robots eyes and a brain: from smart explorer to autonomous robot.',
        description:
          'Robots that sense, see and decide, on a simulator or on any compatible kit. Five levels take learners from a first smart robot to vision, autonomy and the AI Robotics Challenge.',
        topics: [
          'Smart Robot Explorer',
          'Intelligent Robot Creator',
          'AI Vision Robot',
          'Autonomous Robot',
          'AI Robotics Challenge',
        ],
      },
      fr: {
        title: 'Robotique IA',
        tagline:
          "Donne des yeux et un cerveau aux robots : de l'explorateur malin au robot autonome.",
        description:
          "Des robots qui sentent, voient et décident, sur un simulateur ou sur n'importe quel kit compatible. Cinq niveaux mènent du premier robot intelligent à la vision, à l'autonomie et au défi de robotique IA.",
        topics: [
          'Explorateur de robots intelligents',
          'Créateur de robots intelligents',
          'Robot à vision IA',
          'Robot autonome',
          'Défi de robotique IA',
        ],
      },
    },
  },
  {
    id: 'teacher-academy',
    order: 7,
    audience: 'teacher',
    kind: 'teacher_academy',
    ageMin: null,
    ageMax: null,
    icon: 'GraduationCap',
    accent: 'slate',
    status: 'published',
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'Teacher Academy',
        tagline: 'Bring AI into your classroom with confidence.',
        description:
          'Professional development for educators: the foundations of AI, prompt engineering, lesson creation and assessment with AI, differentiation and inclusion, image and video creation, and responsible AI in schools.',
        topics: [
          'AI Foundations for Teachers',
          'Prompt Engineering for Educators',
          'Creating Lessons with AI',
          'AI Assessment',
          'AI Differentiation',
          'AI for Inclusive Education',
          'AI Image Creation',
          'AI Video Creation',
          'Responsible AI in Schools',
        ],
      },
      fr: {
        title: 'Académie des enseignants',
        tagline: "Faites entrer l'IA dans votre classe en toute confiance.",
        description:
          "Formation continue pour les enseignants : les fondements de l'IA, l'ingénierie des consignes, la création de cours et l'évaluation avec l'IA, la différenciation et l'inclusion, la création d'images et de vidéos, et l'IA responsable à l'école.",
        topics: [
          "Fondements de l'IA pour les enseignants",
          'Ingénierie des consignes pour les éducateurs',
          "Créer des cours avec l'IA",
          "Évaluation avec l'IA",
          "Différenciation avec l'IA",
          "L'IA pour une éducation inclusive",
          "Création d'images avec l'IA",
          "Création de vidéos avec l'IA",
          "L'IA responsable à l'école",
        ],
      },
    },
  },
];

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: 'ai-explorer',
    order: 1,
    icon: 'Compass',
    tier: 'gold',
    criteria: { type: 'pathway_completed', pathwayId: 'ai-explorer' },
    xpBonus: 100,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'AI Explorer',
        description: 'Completed every course of the AI Explorer pathway.',
      },
      fr: {
        name: 'Explorateur IA',
        description: 'A terminé tous les cours du parcours Explorateur IA.',
      },
    },
  },
  {
    id: 'prompt-master',
    order: 2,
    icon: 'Sparkles',
    tier: 'silver',
    criteria: { type: 'course_completed', courseId: 'build-with-generative-ai' },
    xpBonus: 50,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Prompt Master',
        description: 'Completed the course "Build with Generative AI".',
      },
      fr: {
        name: 'Maître des consignes',
        description: 'A terminé le cours « Créer avec l’IA générative ».',
      },
    },
  },
  {
    id: 'data-detective',
    order: 3,
    icon: 'Search',
    tier: 'bronze',
    criteria: { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 5 },
    xpBonus: 25,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: { name: 'Data Detective', description: 'Passed five quizzes.' },
      fr: { name: 'Détective des données', description: 'A réussi cinq quiz.' },
    },
  },
  {
    id: 'vision-builder',
    order: 4,
    icon: 'ScanEye',
    tier: 'silver',
    criteria: { type: 'stat_threshold', stat: 'projectsAccepted', threshold: 3 },
    xpBonus: 50,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: { name: 'Vision Builder', description: 'Had three projects accepted.' },
      fr: { name: 'Bâtisseur de vision', description: 'A vu trois projets acceptés.' },
    },
  },
  {
    id: 'responsible-ai-champion',
    order: 5,
    icon: 'ShieldCheck',
    tier: 'gold',
    criteria: { type: 'manual' },
    xpBonus: 50,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Responsible AI Champion',
        description: 'Awarded by a teacher for using AI thoughtfully, safely and fairly.',
      },
      fr: {
        name: 'Champion de l’IA responsable',
        description:
          'Décerné par un enseignant pour une utilisation réfléchie, sûre et équitable de l’IA.',
      },
    },
  },
  {
    id: 'robotics-engineer',
    order: 6,
    icon: 'Bot',
    tier: 'gold',
    criteria: { type: 'pathway_completed', pathwayId: 'ai-robotics' },
    xpBonus: 100,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Robotics Engineer',
        description: 'Completed every course of the AI Robotics pathway.',
      },
      fr: {
        name: 'Ingénieur en robotique',
        description: 'A terminé tous les cours du parcours Robotique IA.',
      },
    },
  },
  {
    id: 'ai-innovator',
    order: 7,
    icon: 'Rocket',
    tier: 'gold',
    criteria: { type: 'pathway_completed', pathwayId: 'ai-innovator' },
    xpBonus: 100,
    isActive: true,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'AI Innovator',
        description: 'Completed every course of the AI Innovator pathway.',
      },
      fr: {
        name: 'Innovateur IA',
        description: 'A terminé tous les cours du parcours Innovateur IA.',
      },
    },
  },
];

export const HARDWARE_PLATFORMS: readonly HardwarePlatformDefinition[] = [
  {
    id: 'simulator',
    kind: 'simulator',
    vendor: null,
    capabilities: ['drive', 'camera', 'distance', 'line', 'color', 'imu', 'display'],
    programmingModes: ['blocks', 'python', 'javascript'],
    connectivity: ['none'],
    image: null,
    isActive: true,
    order: 1,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Robot simulator',
        description:
          'A virtual robot in the browser: drives, sees and senses without any hardware. Every robotics course can be followed on it.',
      },
      fr: {
        name: 'Simulateur de robot',
        description:
          'Un robot virtuel dans le navigateur : il roule, voit et détecte sans aucun matériel. Tous les cours de robotique peuvent être suivis avec lui.',
      },
    },
  },
  {
    id: 'generic-camera-rover',
    kind: 'robot',
    vendor: null,
    capabilities: ['drive', 'camera', 'distance', 'line'],
    programmingModes: ['blocks', 'python'],
    connectivity: ['usb', 'bluetooth', 'wifi'],
    image: null,
    isActive: true,
    order: 2,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Camera rover (any brand)',
        description:
          'A wheeled robot with a camera, a distance sensor and a line sensor. Any kit with these capabilities fits the vision and autonomy projects.',
      },
      fr: {
        name: 'Rover avec caméra (toute marque)',
        description:
          "Un robot à roues avec une caméra, un capteur de distance et un capteur de ligne. Tout kit offrant ces capacités convient aux projets de vision et d'autonomie.",
      },
    },
  },
  {
    id: 'generic-sensor-kit',
    kind: 'sensor_kit',
    vendor: null,
    capabilities: ['distance', 'line', 'color', 'imu', 'microphone', 'speaker', 'display'],
    programmingModes: ['blocks', 'python', 'cpp'],
    connectivity: ['usb'],
    image: null,
    isActive: true,
    order: 3,
    defaultLocale: 'en',
    translations: {
      en: {
        name: 'Sensor kit (any brand)',
        description:
          'A microcontroller board with sensors, a microphone, a speaker and a small display, for the sensor projects. No wheels needed.',
      },
      fr: {
        name: 'Kit de capteurs (toute marque)',
        description:
          'Une carte à microcontrôleur avec des capteurs, un micro, un haut-parleur et un petit écran, pour les projets autour des capteurs. Aucune roue nécessaire.',
      },
    },
  },
];

async function pathwayWrites(): Promise<DocumentWrite[]> {
  return Promise.all(
    PATHWAYS.map(async ({ id: pathwayId, ...fields }) => ({
      ref: collections.pathways().doc(pathwayId),
      fields: {
        ...fields,
        publishedCourseCount: (await listPublishedCoursesByPathway(pathwayId)).length,
      },
    })),
  );
}

export async function up(): Promise<void> {
  const writes: DocumentWrite[] = [
    ...(await pathwayWrites()),
    ...BADGES.map(({ id: badgeId, ...fields }) => ({
      ref: collections.badges().doc(badgeId),
      fields,
    })),
    ...HARDWARE_PLATFORMS.map(({ id: platformId, ...fields }) => ({
      ref: collections.hardwarePlatforms().doc(platformId),
      fields,
    })),
  ];
  const { created, updated } = await upsertDocuments(writes);
  console.log(
    `   ${PATHWAYS.length} pathways, ${BADGES.length} badges, ${HARDWARE_PLATFORMS.length} hardware platforms (${created} created, ${updated} updated)`,
  );
}
