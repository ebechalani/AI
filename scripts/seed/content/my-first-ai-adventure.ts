// "My First Artificial Intelligence Adventure": the AI Explorer demo course (ages 8-10) of
// brief section 22. Four modules of two lessons (eight lessons, 180 minutes), in this order:
// m1 "Meet artificial intelligence", m3 "Teach a computer with examples", m4 "AI that sees and
// hears", m2 "Talking to AI" (prompts and the story project, which ends the course). Blocks
// cover every lesson stage; one quiz per module; English and French; no uploaded files.
//
// m1 and m2 (with quiz-m1, quiz-m2 and project-1) are the first release and are written here.
// m3 and m4 were added by a later content release (ARCHITECTURE.md 11.7) and live in
// ./my-first-ai-adventure/, whose headers say what each one covers. A release only adds to a
// database that already holds the course, so module ids are not in course order, the module
// files' quizzes and projects come after the first release's in their arrays, and m1, m2 and
// their quizzes and project must not be changed here. project-1 stays first among the
// projects: scripts/seed/demo-progress.ts reviews course.projects[0] to issue Lea's certificate.
//
// Two Machine Learning for Kids activities, both "Try it now" (no accounts, nothing about the
// child is stored): Smart Classroom (m3-l2, a text model in Scratch) and Mailman Max (m4-l1,
// drawn letters, an images model in Scratch). Each has a paper version for schools that block
// the site and an optional hand-in (project-m3, project-m4); the certificate needs only the
// story project project-1 (m2-l2). Two videos are curated YouTube videos for this age range
// (Smile and Learn, Code.org's AI for Oceans), both in English; the prompt video of m2-l1 keeps
// the placeholder id RoboHolic03 until a suitable video is verified, and the player shows it as
// unavailable with its summary open. m3 and m4 have no video block.

import type { SeedCourse } from '../types';
import { m3 } from './my-first-ai-adventure/m3';
import { m4 } from './my-first-ai-adventure/m4';

const RICH = 'rich_text' as const;

export const myFirstAiAdventure: SeedCourse = {
  id: 'my-first-ai-adventure',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'My First Artificial Intelligence Adventure',
        summary:
          'Discover what AI is, teach a computer with your own examples on Machine Learning for Kids, find out how AI sees and hears, and learn to talk to it with good prompts.',
        description:
          'An adventure in eight lessons for young explorers. You will find out what artificial intelligence is and where it hides in everyday life, and compare what people and machines are good at. Then you will teach a computer yourself: play a sorting game with made-up words, learn what labels, examples, training and testing are, and train a model that understands your commands for a smart classroom in Scratch. Next, you will find out how AI sees and hears: train a model that reads the postcode letters you draw for a sorting office in Scratch, discover why voice assistants sometimes mishear, and learn how to keep your face and your voice private. Both models are made on Machine Learning for Kids (the activities Smart Classroom and Mailman Max) with "Try it now", so no account is needed. Each activity has a paper version for when the website cannot be opened, and a short hand-in that shows what your model got right and wrong. Finally, you will learn to write a clear prompt and create your own AI story while using AI kindly and safely. Each module has a quiz, and the course ends with a story project and a certificate.',
        outcomes: [
          'Explain in your own words what artificial intelligence is',
          'Tell apart what people and machines are good at',
          'Use the words label, example, training and testing to explain how a computer learns',
          'Train and test your own models on Machine Learning for Kids, and improve them with better examples',
          'Explain how AI recognises drawings and sounds, and why it sometimes gets them wrong',
          'Keep your face and your voice private, and ask an adult before using a camera or a microphone',
          'Write a clear prompt with a who, a what and a how',
          'Use AI responsibly: check, be kind and ask an adult',
        ],
      },
      fr: {
        title: 'Ma première aventure en intelligence artificielle',
        summary:
          'Découvre ce qu’est l’IA, entraîne un ordinateur avec tes propres exemples sur Machine Learning for Kids, comprends comment l’IA voit et entend, et apprends à lui parler avec de bonnes consignes.',
        description:
          'Une aventure en huit leçons pour les jeunes explorateurs et exploratrices. Tu vas découvrir ce qu’est l’intelligence artificielle et où elle se cache dans la vie de tous les jours, et comparer ce que les humains et les machines savent bien faire. Ensuite, c’est toi qui apprendras à un ordinateur\u00a0: tu joueras à un jeu de tri avec des mots inventés, tu découvriras ce que sont les étiquettes, les exemples, l’entraînement et le test, puis tu entraîneras un modèle qui comprend tes commandes pour une classe intelligente dans Scratch. Puis tu verras comment l’IA voit et entend\u00a0: tu entraîneras un modèle qui lit les lettres de codes postaux que tu dessines pour un centre de tri dans Scratch, tu découvriras pourquoi les assistants vocaux comprennent parfois de travers et tu apprendras à protéger ton visage et ta voix. Les deux modèles se fabriquent sur Machine Learning for Kids (activités Smart Classroom et Mailman Max) avec «\u00a0Essayer maintenant\u00a0»\u00a0: pas besoin de créer de compte. Chaque activité a une version sur papier pour le cas où le site ne s’ouvre pas, et un petit travail à rendre qui montre ce que ton modèle a réussi et où il s’est trompé. Enfin, tu apprendras à écrire une consigne claire et tu créeras ta propre histoire avec l’aide de l’IA, en l’utilisant avec prudence et bienveillance. Chaque module comporte un quiz, et le cours se termine par un projet d’histoire et un certificat.',
        outcomes: [
          'Expliquer avec tes propres mots ce qu’est l’intelligence artificielle',
          'Distinguer ce que les humains et les machines savent bien faire',
          'Utiliser les mots étiquette, exemple, entraînement et test pour expliquer comment un ordinateur apprend',
          'Entraîner et tester tes propres modèles sur Machine Learning for Kids, et les améliorer avec de meilleurs exemples',
          'Expliquer comment l’IA reconnaît les dessins et les sons, et pourquoi elle se trompe parfois',
          'Protéger ton visage et ta voix, et demander à un adulte avant d’utiliser une caméra ou un microphone',
          'Écrire une consigne claire avec un qui, un quoi et un comment',
          'Utiliser l’IA de façon responsable\u00a0: vérifier, rester gentil et demander à un adulte',
        ],
      },
    },
    audience: 'student',
    area: 'ai',
    tags: [
      'ai',
      'machine-learning',
      'machine-learning-for-kids',
      'scratch',
      'vision',
      'voice-assistants',
      'prompts',
      'responsible-ai',
      'privacy',
      'stories',
    ],
    ageMin: 8,
    ageMax: 10,
    estimatedMinutes: 180,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'ai-explorer',
    order: 1,
    accessTier: 'free',
  },

  modules: [
    {
      id: 'm1',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Meet artificial intelligence',
            description: 'What AI is, where it hides, and how it is different from people.',
          },
          fr: {
            title: 'Rencontre avec l’intelligence artificielle',
            description:
              'Ce qu’est l’IA, où elle se cache et en quoi elle est différente des humains.',
          },
        },
      },
      lessons: [
        {
          id: 'm1-l1',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'What is artificial intelligence?',
                summary:
                  'A computer program that learns from examples, and where you meet it every day.',
              },
              fr: {
                title: 'Qu’est-ce que l’intelligence artificielle\u00a0?',
                summary:
                  'Un programme informatique qui apprend à partir d’exemples, et les endroits où tu le croises tous les jours.',
              },
            },
            estimatedMinutes: 15,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm1-l1-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'A helper that learns',
                  body: 'Have you ever asked a phone to play a song, or seen a tablet guess which word you were typing? That was **artificial intelligence**, or **AI** for short.\n\nAI is a computer program that can **learn from examples** instead of only following a list of instructions written in advance. Show it thousands of pictures of cats and it starts to recognise cats it has never seen.\n\nIn this adventure you will find out what AI can do, what it cannot do, and how to talk to it.',
                },
                fr: {
                  heading: 'Un assistant qui apprend',
                  body: 'As-tu déjà demandé à un téléphone de lancer une chanson, ou vu une tablette deviner le mot que tu étais en train d’écrire\u00a0? C’était de l’**intelligence artificielle**, ou **IA** pour faire court.\n\nL’IA est un programme informatique qui peut **apprendre à partir d’exemples**, au lieu de suivre seulement une liste d’instructions écrite à l’avance. Montre-lui des milliers de photos de chats, et elle finit par reconnaître des chats qu’elle n’a jamais vus.\n\nDans cette aventure, tu vas découvrir ce que l’IA sait faire, ce qu’elle ne sait pas faire, et comment lui parler.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l1-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Where is AI hiding?',
                  body: 'AI is around you more often than you think:\n\n- **Voice assistants** recognise what you say and answer.\n- **Photo apps** find the faces of your friends in pictures.\n- **Music and video apps** suggest what you might like next.\n- **Games** have characters that react to what you do.\n- **Translation apps** turn one language into another.\n\nMost of these learned from lots and lots of examples. That is the big idea: **AI learns from data**, and data means examples.',
                },
                fr: {
                  heading: 'Où se cache l’IA\u00a0?',
                  body: 'L’IA est autour de toi bien plus souvent que tu ne le crois\u00a0:\n\n- Les **assistants vocaux** reconnaissent ce que tu dis et te répondent.\n- Les **applications photo** retrouvent les visages de tes amis sur les images.\n- Les **applications de musique et de vidéo** te proposent ce qui pourrait te plaire ensuite.\n- Dans les **jeux vidéo**, des personnages réagissent à ce que tu fais.\n- Les **applications de traduction** font passer un texte d’une langue à une autre.\n\nLa plupart ont appris à partir d’énormément d’exemples. Voilà la grande idée\u00a0: **l’IA apprend à partir de données**, et les données, ce sont des exemples.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l1-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: what is artificial intelligence?',
                  caption:
                    'A three-minute introduction to AI and some of the things it can do, from the Smile and Learn channel.',
                  transcript:
                    'In short: artificial intelligence lets computers do some tasks that used to need a person, such as recognising a picture, answering a spoken question or suggesting a song. It works by learning from lots of examples and finding patterns in them. AI can be very useful, but it does not think or feel like a person, and it can make mistakes, so we always check what it says.',
                },
                fr: {
                  title: 'Regarde\u00a0: qu’est-ce que l’intelligence artificielle\u00a0?',
                  caption:
                    'Une introduction de trois minutes à l’IA et à ce qu’elle sait faire, par la chaîne Smile and Learn (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: l’intelligence artificielle permet à des ordinateurs de faire certaines tâches qui demandaient avant une personne, comme reconnaître une image, répondre à une question posée à voix haute ou proposer une chanson. Elle fonctionne en apprenant à partir de beaucoup d’exemples, dans lesquels elle repère des régularités. L’IA peut être très utile, mais elle ne pense pas et ne ressent rien comme une personne, et elle peut se tromper\u00a0: c’est pourquoi on vérifie toujours ce qu’elle dit.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'G6de8L7cVvM',
                fileId: null,
                durationSeconds: 180,
              },
            },
            {
              id: 'm1-l1-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Make the robot introduce itself. Change the words it says so it tells you one place where you have seen AI. Your program is saved, not run: read it aloud the way the robot would.',
                  hint: 'Only change the text between the square brackets.',
                },
                fr: {
                  instructions:
                    'Fais parler le robot\u00a0! Change les mots qu’il dit pour qu’il te raconte un endroit où tu as vu de l’IA. Ton programme est enregistré, pas exécuté\u00a0: lis-le à voix haute comme le robot le ferait.',
                  hint: 'Ne modifie que le texte entre crochets.',
                },
              },
              data: {
                language: 'blocks',
                starterCode:
                  'when green flag clicked\nsay [Hello! I am Robo.] for 2 seconds\nsay [Today I saw AI in ...] for 2 seconds\n',
              },
            },
            {
              id: 'm1-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to explain artificial intelligence with an example from everyday life at home. Remember: never tell an AI tool your name, your address or your school.',
                  starterPrompt:
                    'Can you explain what artificial intelligence is, with an example of something people use at home?',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de t’expliquer l’intelligence artificielle avec un exemple de la vie de tous les jours à la maison. N’oublie pas\u00a0: ne donne jamais ton nom, ton adresse ou le nom de ton école à un outil d’IA.',
                  starterPrompt:
                    'Peux-tu m’expliquer ce qu’est l’intelligence artificielle, avec l’exemple d’un objet qu’on utilise à la maison\u00a0?',
                },
              },
              data: { tutorMode: 'explain', labToolId: null },
            },
            {
              id: 'm1-l1-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt: 'Where did you meet AI today? Write two sentences about it.',
                },
                fr: {
                  prompt:
                    'Où as-tu rencontré de l’IA aujourd’hui\u00a0? Écris deux phrases à ce sujet.',
                },
              },
              data: { minLength: 20 },
            },
          ],
        },
        {
          id: 'm1-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Humans and machines',
                summary:
                  'What people are good at, what machines are good at, and how a machine learns.',
              },
              fr: {
                title: 'Humains et machines',
                summary:
                  'Ce que les humains savent bien faire, ce que les machines savent bien faire, et comment une machine apprend.',
              },
            },
            estimatedMinutes: 15,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm1-l2-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Who is better at what?',
                  body: 'A machine can add up a million numbers in a second. You cannot. But you can tell when your friend is sad just by looking at them, and a machine finds that very hard.\n\n**People** are good at feelings, ideas, jokes and new situations.\n\n**Machines** are good at speed, memory and doing the same thing many times without getting tired.\n\nAI sits in the middle: it is a machine, but it can learn some things that used to need a person.',
                },
                fr: {
                  heading: 'Qui est le plus doué pour quoi\u00a0?',
                  body: 'Une machine peut additionner un million de nombres en une seconde. Toi, non\u00a0! Mais toi, tu vois tout de suite qu’un ami est triste, rien qu’en le regardant, alors que pour une machine, c’est très difficile.\n\nLes **humains** sont doués pour les émotions, les idées, les blagues et les situations nouvelles.\n\nLes **machines** sont douées pour la vitesse, la mémoire et pour refaire la même chose des milliers de fois sans se fatiguer.\n\nL’IA se situe entre les deux\u00a0: c’est une machine, mais elle peut apprendre à faire certaines choses qui, avant, demandaient une personne.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l2-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'How a machine learns from examples',
                  body: 'Imagine teaching a robot to sort apples and oranges.\n\n1. You show it **many examples**: this is an apple, this is an orange.\n2. It looks for **patterns**: apples are often red or green, oranges are orange and bumpy.\n3. You show it a **new fruit** and it makes its best **guess**.\n4. If it is wrong, you tell it, and it **learns a little more**.\n\nThe examples are called **data**. More good data means better guesses. But a guess is still a guess: AI can be wrong, so people must check.',
                },
                fr: {
                  heading: 'Comment une machine apprend à partir d’exemples',
                  body: 'Imagine que tu apprends à un robot à trier des pommes et des oranges.\n\n1. Tu lui montres **beaucoup d’exemples**\u00a0: ceci est une pomme, ceci est une orange.\n2. Il cherche des **régularités**\u00a0: les pommes sont souvent rouges ou vertes, les oranges sont orange et ont une peau granuleuse.\n3. Tu lui montres un **nouveau fruit**, et il essaie de **deviner** ce que c’est.\n4. S’il se trompe, tu le lui dis, et il **apprend un peu plus**.\n\nCes exemples s’appellent des **données**. Plus il y a de bonnes données, plus il devine juste. Mais deviner, ce n’est pas savoir\u00a0: l’IA peut se tromper, alors les humains doivent vérifier.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l2-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: what is machine learning?',
                  caption:
                    "A video from Code.org's AI for Oceans: how computers learn from examples, and where you already use machine learning.",
                  transcript:
                    'In short: machine learning is the most common kind of AI, and you probably use it every day, for example in spam filters, auto-complete, video suggestions, voice assistants, translation apps and photo apps. Instead of being given a rule for every case, the computer is given lots of examples, called training data. It finds patterns in them and uses those patterns to make predictions about new things. Just like the fruit-sorting robot, it gets better with more good examples, and it can still be wrong.',
                },
                fr: {
                  title: 'Regarde\u00a0: qu’est-ce que l’apprentissage automatique\u00a0?',
                  caption:
                    'Une vidéo de Code.org, tirée de l’activité AI for Oceans\u00a0: comment un ordinateur apprend à partir d’exemples, et où tu t’en sers déjà (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: l’apprentissage automatique (en anglais, «\u00a0machine learning\u00a0») est la forme d’IA la plus courante, et tu t’en sers sans doute tous les jours\u00a0: filtres anti-spam, saisie automatique, suggestions de vidéos, assistants vocaux, applications de traduction ou de photos. Au lieu de recevoir une règle pour chaque cas, l’ordinateur reçoit beaucoup d’exemples, appelés données d’entraînement. Il y repère des régularités et s’en sert pour faire des prédictions sur des choses nouvelles. Comme le robot qui trie les fruits, il s’améliore avec davantage de bons exemples… et il peut quand même se tromper.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'OeU5m6vRyCk',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm1-l2-b4',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to quiz you: three quick questions about what people and machines are good at.',
                  starterPrompt:
                    'Quiz me with three easy questions about what people are good at and what machines are good at.',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de te poser trois petites questions sur ce que les humains et les machines savent bien faire.',
                  starterPrompt:
                    'Pose-moi trois questions faciles sur ce que les humains savent bien faire et sur ce que les machines savent bien faire.',
                },
              },
              data: { tutorMode: 'quiz_me', labToolId: null },
            },
            {
              id: 'm1-l2-b5',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: { intro: 'Show what you have learned about AI, people and machines.' },
                fr: {
                  intro: 'Montre ce que tu as appris sur l’IA, les humains et les machines.',
                },
              },
              data: { quizId: 'quiz-m1' },
            },
            {
              id: 'm1-l2-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Name one thing you are better at than a machine, and one thing a machine is better at than you.',
                },
                fr: {
                  prompt:
                    'Cite une chose que tu fais mieux qu’une machine, et une chose qu’une machine fait mieux que toi.',
                },
              },
              data: { minLength: 20 },
            },
          ],
        },
      ],
    },
    m3.module,
    m4.module,
    {
      id: 'm2',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Talking to AI',
            description: 'Prompts, your first AI story, and the rules of a responsible explorer.',
          },
          fr: {
            title: 'Parler à l’IA',
            description:
              'Les consignes, ta première histoire avec l’IA et les règles de l’explorateur responsable.',
          },
        },
      },
      lessons: [
        {
          id: 'm2-l1',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Writing a good prompt',
                summary:
                  'A prompt is what you ask an AI. Learn the three parts that make it clear.',
              },
              fr: {
                title: 'Écrire une bonne consigne',
                summary:
                  'Une consigne, c’est ce que tu demandes à une IA. Découvre les trois parties qui la rendent claire.',
              },
            },
            estimatedMinutes: 20,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm2-l1-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'What is a prompt?',
                  body: 'When you talk to an AI, the words you give it are called a **prompt**. It can be a question ("What do pandas eat?") or an instruction ("Write a poem about rain").\n\nAn AI only has your words to work with, so a fuzzy prompt gives a fuzzy answer. "Story." could become any story in the world. "A short, funny story about a cat who learns to swim" tells the AI what you really want.',
                },
                fr: {
                  heading: 'Qu’est-ce qu’une consigne\u00a0?',
                  body: 'Quand tu parles à une IA, les mots que tu lui donnes s’appellent une **consigne** (en anglais, un *prompt*). Ce peut être une question («\u00a0Que mangent les pandas\u00a0?\u00a0») ou une instruction («\u00a0Écris un poème sur la pluie\u00a0»).\n\nL’IA ne dispose que de tes mots\u00a0: une consigne floue donne une réponse floue. «\u00a0Histoire.\u00a0» peut devenir n’importe quelle histoire du monde. «\u00a0Une histoire courte et drôle sur un chat qui apprend à nager\u00a0» dit à l’IA ce que tu veux vraiment.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l1-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'The three parts of a good prompt',
                  body: 'A clear prompt has three parts:\n\n- **Who**: what role should the AI play? *"You are a friendly storyteller."*\n- **What**: what do you want? *"Tell a story about a robot who loses its hat."*\n- **How**: what should the answer look like? *"Short, funny, for an 8-year-old, with a happy ending."*\n\nPut them together and you get a prompt the AI can follow. If the answer is not what you hoped, do not give up: change one part and try again. That is what prompt explorers do.',
                },
                fr: {
                  heading: 'Les trois parties d’une bonne consigne',
                  body: 'Une consigne claire a trois parties\u00a0:\n\n- **Qui**\u00a0: quel rôle l’IA doit-elle jouer\u00a0? *«\u00a0Tu es un conteur sympathique.\u00a0»*\n- **Quoi**\u00a0: que veux-tu\u00a0? *«\u00a0Raconte une histoire sur un robot qui perd son chapeau.\u00a0»*\n- **Comment**\u00a0: à quoi doit ressembler la réponse\u00a0? *«\u00a0Courte, drôle, pour un enfant de 8\u00a0ans, avec une fin heureuse.\u00a0»*\n\nAssemble les trois, et tu obtiens une consigne que l’IA peut suivre. Si la réponse n’est pas celle que tu espérais, ne te décourage pas\u00a0: change une partie et réessaie. C’est comme ça que font les explorateurs de consignes.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l1-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: from a fuzzy prompt to a clear one',
                  caption: 'The same request, three times, each time a little clearer.',
                  transcript:
                    'Our first prompt is just one word: story. The AI writes a story about a king. We add what we want: a story about a dog. Better, but too long. We add how: short, funny, for young children. Now the story fits. A clear prompt has a who, a what and a how.',
                },
                fr: {
                  title: 'Regarde\u00a0: d’une consigne floue à une consigne claire',
                  caption: 'La même demande, trois fois de suite, chaque fois un peu plus claire.',
                  transcript:
                    'Notre première consigne tient en un seul mot\u00a0: «\u00a0histoire\u00a0». L’IA écrit une histoire sur un roi. Nous ajoutons ce que nous voulons\u00a0: une histoire sur un chien. C’est mieux, mais trop long. Nous ajoutons le comment\u00a0: courte, drôle, pour de jeunes enfants. Cette fois, l’histoire convient. Une consigne claire a un qui, un quoi et un comment.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'RoboHolic03',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm2-l1-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Build a prompt with blocks. Fill in the who, the what and the how, then work out the full prompt the robot will say. Your program is saved, not run, so follow the blocks yourself.',
                  hint: 'The three variables are joined into one sentence at the end.',
                },
                fr: {
                  instructions:
                    'Construis une consigne avec des blocs. Remplis le qui, le quoi et le comment, puis trouve la consigne complète que dira le robot. Ton programme est enregistré, pas exécuté\u00a0: suis les blocs toi-même.',
                  hint: 'À la fin, les trois variables sont réunies en une seule phrase.',
                },
              },
              data: {
                language: 'blocks',
                starterCode:
                  'when green flag clicked\nset [who] to [a friendly storyteller]\nset [what] to [a story about ...]\nset [how] to [short and funny]\nsay (join [You are ] (join (who) (join [. Tell ] (join (what) (join [. Make it ] (how))))))\n',
              },
            },
            {
              id: 'm2-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor for an example of a clear prompt about an animal, then write your own.',
                  starterPrompt:
                    'Give me an example of a clear prompt, with a who, a what and a how, for a story about an animal.',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA un exemple de consigne claire sur un animal, puis écris la tienne.',
                  starterPrompt:
                    'Donne-moi un exemple de consigne claire, avec un qui, un quoi et un comment, pour une histoire sur un animal.',
                },
              },
              data: { tutorMode: 'give_example', labToolId: null },
            },
            {
              id: 'm2-l1-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Write your own prompt for a story. Then say which part is its who, which part is its what and which part is its how.',
                },
                fr: {
                  prompt:
                    'Écris ta propre consigne pour une histoire. Puis indique quelle partie est le qui, laquelle est le quoi et laquelle est le comment.',
                },
              },
              data: { minLength: 30 },
            },
          ],
        },
        {
          id: 'm2-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'My AI story project',
                summary:
                  'Use AI responsibly to plan and write a short story, then share it with your teacher.',
              },
              fr: {
                title: 'Mon projet d’histoire avec l’IA',
                summary:
                  'Utilise l’IA de façon responsable pour préparer et écrire une histoire courte, puis partage-la avec ton enseignant.',
              },
            },
            estimatedMinutes: 30,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm2-l2-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Being a responsible AI explorer',
                  body: 'AI is a great helper, but it is not a person and it is not always right. Responsible explorers follow four rules:\n\n1. **Check it.** AI can make things up. Ask yourself: is this true? Is this what I wanted?\n2. **Keep it kind.** Never ask AI to be mean to anyone, and never share mean things it says.\n3. **Keep secrets secret.** Do not tell an AI your full name, your address, your school or your passwords.\n4. **Ask an adult.** If an answer worries you or feels strange, show it to a teacher or a parent.\n\nAnd one bonus rule: when AI helped you, **say so**. That is honest, and it is how real creators work.',
                },
                fr: {
                  heading: 'Être un explorateur responsable de l’IA',
                  body: 'L’IA est une aide précieuse, mais ce n’est pas une personne et elle n’a pas toujours raison. Les explorateurs responsables suivent quatre règles\u00a0:\n\n1. **Vérifie.** L’IA peut inventer des choses. Demande-toi\u00a0: est-ce vrai\u00a0? Est-ce bien ce que je voulais\u00a0?\n2. **Reste gentil.** Ne demande jamais à une IA d’être méchante avec quelqu’un, et ne partage jamais les choses méchantes qu’elle pourrait écrire.\n3. **Garde tes secrets.** Ne donne jamais à une IA ton nom complet, ton adresse, le nom de ton école ou tes mots de passe.\n4. **Demande à un adulte.** Si une réponse t’inquiète ou te paraît bizarre, montre-la à un enseignant ou à un parent.\n\nEt une règle bonus\u00a0: quand l’IA t’a aidé, **dis-le**. C’est honnête, et c’est comme ça que travaillent les vrais créateurs.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Plan your story',
                  body: 'Before you ask the AI for help, plan your story like an author:\n\n- **A hero**: who is the story about? A child, an animal, a robot?\n- **A problem**: what goes wrong? The hero loses something, gets lost, meets a dragon...\n- **A solution**: how does the hero fix it? Ideas, friends, courage.\n- **An ending**: happy, funny or surprising.\n\nThen write a prompt with your plan inside it. Read what the AI gives back, keep the parts you like, change the parts you do not, and add your own ideas. The story is yours; the AI is your helper.',
                },
                fr: {
                  heading: 'Prépare ton histoire',
                  body: 'Avant de demander de l’aide à l’IA, prépare ton histoire comme un véritable auteur\u00a0:\n\n- **Un héros**\u00a0: de qui parle l’histoire\u00a0? Un enfant, un animal, un robot\u00a0?\n- **Un problème**\u00a0: qu’est-ce qui tourne mal\u00a0? Le héros perd quelque chose, se perd, rencontre un dragon…\n- **Une solution**\u00a0: comment le héros s’en sort-il\u00a0? Grâce à une idée, à des amis, à son courage.\n- **Une fin**\u00a0: heureuse, drôle ou surprenante.\n\nEnsuite, écris une consigne qui contient ton plan. Lis ce que l’IA te propose, garde les passages que tu aimes, change ceux que tu n’aimes pas et ajoute tes propres idées. L’histoire est à toi\u00a0; l’IA n’est que ton assistant.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b3',
              type: 'project',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Time to create! Write your short story with the help of the AI tutor, then submit it to your teacher.',
                },
                fr: {
                  intro:
                    'C’est le moment de créer\u00a0! Écris ton histoire courte avec l’aide du tuteur IA, puis envoie-la à ton enseignant.',
                },
              },
              data: { projectId: 'project-1' },
            },
            {
              id: 'm2-l2-b4',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Before you submit, ask the AI tutor to check your story plan: does it have a hero, a problem, a solution and an ending?',
                  starterPrompt:
                    'Here is my story plan. Can you check that it has a hero, a problem, a solution and an ending, and tell me what is missing?',
                },
                fr: {
                  instructions:
                    'Avant d’envoyer ton histoire, demande au tuteur IA de vérifier ton plan\u00a0: y a-t-il un héros, un problème, une solution et une fin\u00a0?',
                  starterPrompt:
                    'Voici le plan de mon histoire. Peux-tu vérifier qu’il y a un héros, un problème, une solution et une fin, et me dire ce qui manque\u00a0?',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm2-l2-b5',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: { intro: 'Last check: prompts and responsible AI.' },
                fr: { intro: 'Dernière vérification\u00a0: les consignes et l’IA responsable.' },
              },
              data: { quizId: 'quiz-m2' },
            },
            {
              id: 'm2-l2-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Which rule of a responsible AI explorer is the most important for you, and why?',
                },
                fr: {
                  prompt:
                    'Quelle règle de l’explorateur responsable est la plus importante pour toi, et pourquoi\u00a0?',
                },
              },
              data: { minLength: 20 },
            },
          ],
        },
      ],
    },
  ],

  quizzes: [
    {
      id: 'quiz-m1',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: meet AI',
            instructions: 'Four questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: rencontre avec l’IA',
            instructions: 'Quatre questions. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
          },
        },
        passingScorePercent: 70,
        maxAttempts: null,
        xpReward: 100,
        shuffleQuestions: false,
        revealAnswers: 'after_pass',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which of these uses artificial intelligence?' },
              fr: { prompt: 'Lequel de ces objets utilise l’intelligence artificielle\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A voice assistant that answers your questions' },
                  fr: { text: 'Un assistant vocal qui répond à tes questions' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A wooden spoon' },
                  fr: { text: 'Une cuillère en bois' },
                },
              },
              {
                id: 'c',
                translations: { en: { text: 'A paper book' }, fr: { text: 'Un livre en papier' } },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A voice assistant learned from recordings of many voices to recognise what you say.',
              },
              fr: {
                text: 'Un assistant vocal a appris à partir d’enregistrements de très nombreuses voix pour reconnaître ce que tu dis.',
              },
            },
          },
          {
            id: 'q2',
            type: 'true_false',
            points: 1,
            translations: {
              en: { prompt: 'A machine learns by looking at many examples.' },
              fr: { prompt: 'Une machine apprend en analysant beaucoup d’exemples.' },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: { text: 'Yes: the examples are the data it learns from.' },
              fr: {
                text: 'Oui\u00a0: les exemples sont les données à partir desquelles elle apprend.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: { prompt: 'Which things can an AI do today? Choose all the right answers.' },
              fr: {
                prompt:
                  'Que sait faire une IA aujourd’hui\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Recognise a cat in a photo' },
                  fr: { text: 'Reconnaître un chat sur une photo' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Translate a sentence into another language' },
                  fr: { text: 'Traduire une phrase dans une autre langue' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Feel happy like a person' },
                  fr: { text: 'Se sentir heureuse comme une personne' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Suggest a song you may like' },
                  fr: { text: 'Proposer une chanson qui pourrait te plaire' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'AI recognises, translates and suggests, but it does not feel anything.',
              },
              fr: { text: 'L’IA reconnaît, traduit et propose, mais elle ne ressent rien.' },
            },
          },
          {
            id: 'q4',
            type: 'short_answer',
            points: 1,
            translations: {
              en: { prompt: 'What do we call the examples a machine learns from? (one word)' },
              fr: {
                prompt:
                  'Comment appelle-t-on les exemples à partir desquels une machine apprend\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['data', 'the data', 'training data', 'examples', 'the examples'],
              fr: [
                'données',
                'des données',
                'les données',
                'donnée',
                'exemples',
                'des exemples',
                'les exemples',
              ],
            },
            explanation: {
              en: { text: 'Data! Lots of good examples make a better learner.' },
              fr: {
                text: 'Les données\u00a0! Plus il y a de bons exemples, mieux la machine apprend.',
              },
            },
          },
        ],
      },
    },
    {
      id: 'quiz-m2',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: talking to AI',
            instructions: 'Four questions about prompts and responsible AI. You need 70% to pass.',
          },
          fr: {
            title: 'Quiz\u00a0: parler à l’IA',
            instructions:
              'Quatre questions sur les consignes et l’IA responsable. Il faut 70\u00a0% pour réussir.',
          },
        },
        passingScorePercent: 70,
        maxAttempts: null,
        xpReward: 100,
        shuffleQuestions: false,
        revealAnswers: 'after_pass',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'What is a prompt?' },
              fr: { prompt: 'Qu’est-ce qu’une consigne (un prompt)\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The question or instruction you give to an AI' },
                  fr: { text: 'La question ou l’instruction que tu donnes à une IA' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A kind of robot' },
                  fr: { text: 'Une sorte de robot' },
                },
              },
              {
                id: 'c',
                translations: { en: { text: 'A computer game' }, fr: { text: 'Un jeu vidéo' } },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: { text: 'A prompt is what you ask: a question or an instruction.' },
              fr: {
                text: 'Une consigne, c’est ce que tu demandes\u00a0: une question ou une instruction.',
              },
            },
          },
          {
            id: 'q2',
            type: 'true_false',
            points: 1,
            translations: {
              en: { prompt: 'An AI can sometimes be wrong, so it is good to check its answers.' },
              fr: {
                prompt:
                  'Une IA peut parfois se tromper, alors il vaut mieux vérifier ses réponses.',
              },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: { text: 'True. Checking is the first rule of a responsible explorer.' },
              fr: { text: 'Vrai. Vérifier, c’est la première règle de l’explorateur responsable.' },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which prompt is the clearest?' },
              fr: { prompt: 'Quelle consigne est la plus claire\u00a0?' },
            },
            options: [
              { id: 'a', translations: { en: { text: 'Story.' }, fr: { text: 'Histoire.' } } },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Write a short, funny story about a cat who learns to swim, for an 8-year-old.',
                  },
                  fr: {
                    text: 'Écris une histoire courte et drôle sur un chat qui apprend à nager, pour un enfant de 8\u00a0ans.',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Do something nice.' },
                  fr: { text: 'Fais quelque chose de bien.' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'It has a what (a story about a cat) and a how (short, funny, for an 8-year-old).',
              },
              fr: {
                text: 'Elle a un quoi (une histoire de chat) et un comment (courte, drôle, pour un enfant de 8\u00a0ans).',
              },
            },
          },
          {
            id: 'q4',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt: 'Who should you show an AI answer that worries you? (one or two words)',
              },
              fr: {
                prompt:
                  'À qui dois-tu montrer une réponse de l’IA qui t’inquiète\u00a0? (un ou deux mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'an adult',
                'adult',
                'a teacher',
                'teacher',
                'a parent',
                'parent',
                'my parents',
                'a grown-up',
                'grown-up',
                'a grown up',
              ],
              fr: [
                'un adulte',
                'adulte',
                'un enseignant',
                'enseignant',
                'une enseignante',
                'un parent',
                'parent',
                'mes parents',
                'un professeur',
                'la maîtresse',
              ],
            },
            explanation: {
              en: { text: 'An adult: a teacher or a parent. That is rule four.' },
              fr: {
                text: 'Un adulte\u00a0: un enseignant ou un parent. C’est la quatrième règle.',
              },
            },
          },
        ],
      },
    },
    ...m3.quizzes,
    ...m4.quizzes,
  ],

  projects: [
    {
      id: 'project-1',
      input: {
        kind: 'project',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'My AI story',
            brief:
              'Write a short story (about ten sentences) with a hero, a problem, a solution and an ending. Plan it yourself, ask the AI tutor for help with a clear prompt, then make the story your own.',
            requirements:
              'Submit the story as text, as a photo of your handwritten page, or as a link to a shared document. At the end, write one sentence that says how the AI helped you. Do not put your full name, your address or your school in the story.',
          },
          fr: {
            title: 'Mon histoire avec l’IA',
            brief:
              'Écris une histoire courte (une dizaine de phrases) avec un héros, un problème, une solution et une fin. Prépare-la toi-même, demande de l’aide au tuteur IA avec une consigne claire, puis retravaille l’histoire pour qu’elle devienne vraiment la tienne.',
            requirements:
              'Envoie ton histoire sous forme de texte, de photo de ta page écrite à la main ou de lien vers un document partagé. À la fin, écris une phrase qui explique comment l’IA t’a aidé. Ne mets ni ton nom complet, ni ton adresse, ni le nom de ton école dans l’histoire.',
          },
        },
        allowedSubmissionTypes: ['text', 'image', 'link'],
        rubric: [
          { key: 'creativity', weight: 25 },
          { key: 'technicalQuality', weight: 25 },
          { key: 'understanding', weight: 25 },
          { key: 'responsibleAi', weight: 25 },
        ],
        xpReward: 300,
        requiredForCertificate: true,
      },
    },
    ...m3.projects,
    ...m4.projects,
  ],
};
