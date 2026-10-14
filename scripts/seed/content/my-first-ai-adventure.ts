// "My First Artificial Intelligence Adventure": the AI Explorer demo course (ages 8-10) of
// brief section 22. Two modules of two lessons; blocks cover every lesson stage; one quiz per
// module; one project; English and French; no uploaded files. The video ids are placeholders
// of the YouTube id format: WS-K replaces them with curated videos.

import type { SeedCourse } from '../types';

const RICH = 'rich_text' as const;

export const myFirstAiAdventure: SeedCourse = {
  id: 'my-first-ai-adventure',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'My First Artificial Intelligence Adventure',
        summary:
          'Discover what AI is, how it learns from examples, and how to talk to it with good prompts.',
        description:
          'An adventure in four lessons for young explorers. You will find out what artificial intelligence is and where it hides in everyday life, compare what people and machines are good at, learn to write a clear prompt, and create your own AI story while using AI kindly and safely. The course ends with a story project and a certificate.',
        outcomes: [
          'Explain in your own words what artificial intelligence is',
          'Tell apart what people and machines are good at',
          'Write a clear prompt with a who, a what and a how',
          'Use AI responsibly: check, be kind and ask an adult',
        ],
      },
      fr: {
        title: 'Ma première aventure en intelligence artificielle',
        summary:
          "Découvre ce qu'est l'IA, comment elle apprend avec des exemples et comment lui parler avec de bonnes consignes.",
        description:
          "Une aventure en quatre leçons pour les jeunes explorateurs. Tu vas découvrir ce qu'est l'intelligence artificielle et où elle se cache dans la vie de tous les jours, comparer ce que les personnes et les machines savent bien faire, apprendre à écrire une consigne claire et créer ta propre histoire avec l'IA tout en l'utilisant avec bienveillance et prudence. Le cours se termine par un projet d'histoire et un certificat.",
        outcomes: [
          "Expliquer avec tes mots ce qu'est l'intelligence artificielle",
          'Distinguer ce que les personnes et les machines savent bien faire',
          'Écrire une consigne claire avec un qui, un quoi et un comment',
          "Utiliser l'IA de façon responsable : vérifier, rester gentil et demander à un adulte",
        ],
      },
    },
    audience: 'student',
    area: 'ai',
    tags: ['ai', 'prompts', 'responsible-ai', 'stories'],
    ageMin: 8,
    ageMax: 10,
    estimatedMinutes: 80,
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
            title: "Rencontre avec l'intelligence artificielle",
            description:
              "Ce qu'est l'IA, où elle se cache et en quoi elle est différente des personnes.",
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
                title: "Qu'est-ce que l'intelligence artificielle ?",
                summary:
                  'Un programme qui apprend avec des exemples, et où tu le rencontres chaque jour.',
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
                  body: 'Have you ever asked a phone to play a song, or seen a tablet guess which word you were typing? That was **artificial intelligence**, or **AI** for short.\n\nAI is a computer program that can **learn from examples** instead of following one fixed list of orders. Show it thousands of pictures of cats and it starts to recognise cats it has never seen.\n\nIn this adventure you will find out what AI can do, what it cannot do, and how to talk to it.',
                },
                fr: {
                  heading: 'Un assistant qui apprend',
                  body: "As-tu déjà demandé à un téléphone de jouer une chanson, ou vu une tablette deviner le mot que tu tapais ? C'était de l'**intelligence artificielle**, ou **IA** en abrégé.\n\nL'IA est un programme informatique qui peut **apprendre avec des exemples** au lieu de suivre une seule liste d'ordres. Montre-lui des milliers de photos de chats et elle commence à reconnaître des chats qu'elle n'a jamais vus.\n\nDans cette aventure, tu vas découvrir ce que l'IA sait faire, ce qu'elle ne sait pas faire, et comment lui parler.",
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
                  body: 'AI is around you more often than you think:\n\n- **Voice assistants** understand what you say and answer.\n- **Photo apps** find the faces of your friends in pictures.\n- **Music and video apps** suggest what you might like next.\n- **Games** have characters that react to what you do.\n- **Translation apps** turn one language into another.\n\nAll of these learned from lots and lots of examples. That is the big idea: **AI learns from data**, and data means examples.',
                },
                fr: {
                  heading: "Où se cache l'IA ?",
                  body: "L'IA est autour de toi plus souvent que tu ne le penses :\n\n- Les **assistants vocaux** comprennent ce que tu dis et répondent.\n- Les **applications photo** retrouvent les visages de tes amis sur les images.\n- Les **applications de musique et de vidéo** proposent ce qui pourrait te plaire ensuite.\n- Les **jeux** ont des personnages qui réagissent à ce que tu fais.\n- Les **applications de traduction** transforment une langue en une autre.\n\nTous ont appris avec énormément d'exemples. C'est la grande idée : **l'IA apprend avec des données**, et les données, ce sont des exemples.",
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
                  title: 'Watch: what is AI?',
                  caption: 'A two-minute tour of artificial intelligence for young explorers.',
                  transcript:
                    'Artificial intelligence is a computer program that learns from examples. When you show it many pictures, sounds or sentences, it finds patterns and uses them to guess what comes next. It can recognise a cat, understand a question or suggest a song. It does not think or feel like a person: it only works with what it has learned.',
                },
                fr: {
                  title: "Regarde : qu'est-ce que l'IA ?",
                  caption:
                    "Un tour de deux minutes dans l'intelligence artificielle pour les jeunes explorateurs.",
                  transcript:
                    "L'intelligence artificielle est un programme informatique qui apprend avec des exemples. Quand on lui montre beaucoup d'images, de sons ou de phrases, elle trouve des régularités et s'en sert pour deviner la suite. Elle peut reconnaître un chat, comprendre une question ou proposer une chanson. Elle ne pense pas et ne ressent rien comme une personne : elle travaille seulement avec ce qu'elle a appris.",
                },
              },
              data: {
                source: 'youtube',
                videoId: 'RoboHolic01',
                fileId: null,
                durationSeconds: 120,
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
                    'Make the robot introduce itself. Change the words it says so it tells you one place where you have seen AI.',
                  hint: 'Only change the text between the square brackets.',
                },
                fr: {
                  instructions:
                    "Fais parler le robot. Change les mots qu'il dit pour qu'il te raconte un endroit où tu as vu de l'IA.",
                  hint: 'Change seulement le texte entre les crochets.',
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
                    'Ask the AI tutor to explain artificial intelligence with an example from your home.',
                  starterPrompt:
                    'Can you explain what artificial intelligence is, with an example from my home?',
                },
                fr: {
                  instructions:
                    "Demande au tuteur IA d'expliquer l'intelligence artificielle avec un exemple de ta maison.",
                  starterPrompt:
                    "Peux-tu m'expliquer ce qu'est l'intelligence artificielle, avec un exemple de ma maison ?",
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
                  prompt: "Où as-tu rencontré de l'IA aujourd'hui ? Écris deux phrases à ce sujet.",
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
                  'Ce que les personnes savent bien faire, ce que les machines savent bien faire, et comment une machine apprend.',
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
                  heading: 'Qui est meilleur pour quoi ?',
                  body: "Une machine peut additionner un million de nombres en une seconde. Pas toi. Mais toi, tu vois tout de suite quand ton ami est triste, rien qu'en le regardant, et pour une machine c'est très difficile.\n\nLes **personnes** sont fortes pour les émotions, les idées, les blagues et les situations nouvelles.\n\nLes **machines** sont fortes pour la vitesse, la mémoire et pour refaire la même chose très souvent sans se fatiguer.\n\nL'IA se trouve au milieu : c'est une machine, mais elle peut apprendre certaines choses qui demandaient une personne avant.",
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
                  heading: 'Comment une machine apprend avec des exemples',
                  body: "Imagine que tu apprends à un robot à trier des pommes et des oranges.\n\n1. Tu lui montres **beaucoup d'exemples** : ceci est une pomme, ceci est une orange.\n2. Il cherche des **régularités** : les pommes sont souvent rouges ou vertes, les oranges sont orange et bosselées.\n3. Tu lui montres un **nouveau fruit** et il fait sa meilleure **supposition**.\n4. S'il se trompe, tu le lui dis, et il **apprend un peu plus**.\n\nLes exemples s'appellent des **données**. Plus de bonnes données, c'est de meilleures suppositions. Mais une supposition reste une supposition : l'IA peut se tromper, alors les personnes doivent vérifier.",
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
                  title: 'Watch: teaching a robot to sort fruit',
                  caption: 'See a machine learn from examples, step by step.',
                  transcript:
                    'To teach a machine, we show it examples with the right answer. The machine looks for patterns and tries to guess the answer for new examples. When it guesses wrong, we correct it and it improves. This is called machine learning, and it is how most AI works today.',
                },
                fr: {
                  title: 'Regarde : apprendre à un robot à trier des fruits',
                  caption: 'Observe une machine apprendre avec des exemples, étape par étape.',
                  transcript:
                    "Pour apprendre à une machine, on lui montre des exemples avec la bonne réponse. La machine cherche des régularités et essaie de deviner la réponse pour de nouveaux exemples. Quand elle se trompe, on la corrige et elle s'améliore. On appelle cela l'apprentissage automatique, et c'est ainsi que fonctionne la plupart de l'IA aujourd'hui.",
                },
              },
              data: {
                source: 'youtube',
                videoId: 'RoboHolic02',
                fileId: null,
                durationSeconds: 150,
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
                    'Demande au tuteur IA de te poser trois questions rapides sur ce que les personnes et les machines savent bien faire.',
                  starterPrompt:
                    'Pose-moi trois questions faciles sur ce que les personnes savent bien faire et ce que les machines savent bien faire.',
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
                  intro: "Montre ce que tu as appris sur l'IA, les personnes et les machines.",
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
                    "Nomme une chose que tu fais mieux qu'une machine, et une chose qu'une machine fait mieux que toi.",
                },
              },
              data: { minLength: 20 },
            },
          ],
        },
      ],
    },
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
            title: "Parler à l'IA",
            description:
              "Les consignes, ta première histoire avec l'IA et les règles d'un explorateur responsable.",
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
                  "Une consigne, c'est ce que tu demandes à une IA. Apprends les trois parties qui la rendent claire.",
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
                  body: 'When you talk to an AI, the words you give it are called a **prompt**. It can be a question ("What do pandas eat?") or an instruction ("Write a poem about rain").\n\nAn AI does exactly what the prompt says, so a fuzzy prompt gives a fuzzy answer. "Story." could become any story in the world. "A short, funny story about a cat who learns to swim" tells the AI what you really want.',
                },
                fr: {
                  heading: "Qu'est-ce qu'une consigne ?",
                  body: "Quand tu parles à une IA, les mots que tu lui donnes s'appellent une **consigne** (en anglais, un *prompt*). Ce peut être une question (« Que mangent les pandas ? ») ou une instruction (« Écris un poème sur la pluie »).\n\nUne IA fait exactement ce que dit la consigne : une consigne floue donne une réponse floue. « Histoire. » peut devenir n'importe quelle histoire du monde. « Une histoire courte et drôle sur un chat qui apprend à nager » dit à l'IA ce que tu veux vraiment.",
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
                  body: 'A clear prompt has three parts:\n\n- **Who**: who should the AI be? *"You are a friendly storyteller."*\n- **What**: what do you want? *"Tell a story about a robot who loses its hat."*\n- **How**: how should it look? *"Short, funny, for an 8-year-old, with a happy ending."*\n\nPut them together and you get a prompt the AI can follow. If the answer is not what you hoped, do not give up: change one part and try again. That is what prompt explorers do.',
                },
                fr: {
                  heading: "Les trois parties d'une bonne consigne",
                  body: "Une consigne claire a trois parties :\n\n- **Qui** : qui doit être l'IA ? *« Tu es un conteur gentil. »*\n- **Quoi** : que veux-tu ? *« Raconte une histoire sur un robot qui perd son chapeau. »*\n- **Comment** : à quoi cela doit-il ressembler ? *« Courte, drôle, pour un enfant de 8 ans, avec une fin heureuse. »*\n\nAssemble les trois et tu obtiens une consigne que l'IA peut suivre. Si la réponse n'est pas celle que tu espérais, n'abandonne pas : change une partie et réessaie. C'est ce que font les explorateurs de consignes.",
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
                  title: "Regarde : d'une consigne floue à une consigne claire",
                  caption: 'La même demande, trois fois, à chaque fois un peu plus claire.',
                  transcript:
                    "Notre première consigne est un seul mot : histoire. L'IA écrit une histoire sur un roi. Nous ajoutons ce que nous voulons : une histoire sur un chien. Mieux, mais trop long. Nous ajoutons le comment : courte, drôle, pour de jeunes enfants. Maintenant l'histoire convient. Une consigne claire a un qui, un quoi et un comment.",
                },
              },
              data: {
                source: 'youtube',
                videoId: 'RoboHolic03',
                fileId: null,
                durationSeconds: 135,
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
                    'Build a prompt with blocks. Fill in the who, the what and the how, then read the full prompt the robot says.',
                  hint: 'The three variables are joined into one sentence at the end.',
                },
                fr: {
                  instructions:
                    'Construis une consigne avec des blocs. Remplis le qui, le quoi et le comment, puis lis la consigne complète que dit le robot.',
                  hint: 'Les trois variables sont assemblées en une seule phrase à la fin.',
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
                    "Demande au tuteur IA un exemple de consigne claire à propos d'un animal, puis écris la tienne.",
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
                    'Write your own prompt for a story. Underline (or mark) its who, its what and its how.',
                },
                fr: {
                  prompt:
                    'Écris ta propre consigne pour une histoire. Souligne (ou marque) son qui, son quoi et son comment.',
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
                title: "Mon projet d'histoire avec l'IA",
                summary:
                  "Utilise l'IA de façon responsable pour préparer et écrire une histoire courte, puis partage-la avec ton enseignant.",
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
                  heading: "Être un explorateur responsable de l'IA",
                  body: "L'IA est une super aide, mais ce n'est pas une personne et elle n'a pas toujours raison. Les explorateurs responsables suivent quatre règles :\n\n1. **Vérifie.** L'IA peut inventer des choses. Demande-toi : est-ce vrai ? Est-ce ce que je voulais ?\n2. **Reste gentil.** Ne demande jamais à une IA d'être méchante avec quelqu'un, et ne partage jamais des choses méchantes qu'elle dit.\n3. **Garde tes secrets.** Ne dis pas à une IA ton nom complet, ton adresse, ton école ni tes mots de passe.\n4. **Demande à un adulte.** Si une réponse t'inquiète ou te semble bizarre, montre-la à un enseignant ou à un parent.\n\nEt une règle bonus : quand l'IA t'a aidé, **dis-le**. C'est honnête, et c'est ainsi que travaillent les vrais créateurs.",
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
                  body: "Avant de demander de l'aide à l'IA, prépare ton histoire comme un auteur :\n\n- **Un héros** : de qui parle l'histoire ? Un enfant, un animal, un robot ?\n- **Un problème** : qu'est-ce qui va de travers ? Le héros perd quelque chose, se perd, rencontre un dragon...\n- **Une solution** : comment le héros s'en sort-il ? Des idées, des amis, du courage.\n- **Une fin** : heureuse, drôle ou surprenante.\n\nEnsuite, écris une consigne avec ton plan dedans. Lis ce que l'IA te rend, garde les parties que tu aimes, change celles que tu n'aimes pas et ajoute tes propres idées. L'histoire est à toi ; l'IA est ton assistant.",
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
                    "C'est le moment de créer ! Écris ton histoire courte avec l'aide du tuteur IA, puis envoie-la à ton enseignant.",
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
                    "Avant d'envoyer, demande au tuteur IA de vérifier ton plan : a-t-il un héros, un problème, une solution et une fin ?",
                  starterPrompt:
                    "Voici le plan de mon histoire. Peux-tu vérifier qu'il a un héros, un problème, une solution et une fin, et me dire ce qui manque ?",
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
                fr: { intro: "Dernière vérification : les consignes et l'IA responsable." },
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
                    "Quelle règle de l'explorateur responsable de l'IA est la plus importante pour toi, et pourquoi ?",
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
            title: "Vérification : rencontre avec l'IA",
            instructions: 'Quatre questions. Il faut 70 % pour réussir, et tu peux réessayer.',
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
              fr: { prompt: "Lequel de ces objets utilise l'intelligence artificielle ?" },
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
                text: 'A voice assistant learned from many voices to understand what you say.',
              },
              fr: {
                text: 'Un assistant vocal a appris avec beaucoup de voix pour comprendre ce que tu dis.',
              },
            },
          },
          {
            id: 'q2',
            type: 'true_false',
            points: 1,
            translations: {
              en: { prompt: 'A machine learns by looking at many examples.' },
              fr: { prompt: "Une machine apprend en regardant beaucoup d'exemples." },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: { text: 'Yes: the examples are the data it learns from.' },
              fr: { text: 'Oui : les exemples sont les données avec lesquelles elle apprend.' },
            },
          },
          {
            id: 'q3',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: { prompt: 'Which things can an AI do today? Choose all the right answers.' },
              fr: {
                prompt: "Que sait faire une IA aujourd'hui ? Choisis toutes les bonnes réponses.",
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
              fr: { text: "L'IA reconnaît, traduit et propose, mais elle ne ressent rien." },
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
                  'Comment appelle-t-on les exemples avec lesquels une machine apprend ? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['data', 'the data', 'examples'],
              fr: ['données', 'des données', 'les données', 'exemples', 'des exemples'],
            },
            explanation: {
              en: { text: 'Data! Lots of good examples make a better learner.' },
              fr: { text: 'Les données ! Beaucoup de bons exemples font un meilleur apprenant.' },
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
            title: "Vérification : parler à l'IA",
            instructions:
              "Quatre questions sur les consignes et l'IA responsable. Il faut 70 % pour réussir.",
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
              fr: { prompt: "Qu'est-ce qu'une consigne (prompt) ?" },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The question or instruction you give to an AI' },
                  fr: { text: "La question ou l'instruction que tu donnes à une IA" },
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
                text: "Une consigne, c'est ce que tu demandes : une question ou une instruction.",
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
              fr: { text: "Vrai. Vérifier est la première règle d'un explorateur responsable." },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which prompt is the clearest?' },
              fr: { prompt: 'Quelle consigne est la plus claire ?' },
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
                    text: 'Écris une histoire courte et drôle sur un chat qui apprend à nager, pour un enfant de 8 ans.',
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
                text: 'Elle a un quoi (une histoire de chat) et un comment (courte, drôle, pour un enfant de 8 ans).',
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
                  "À qui dois-tu montrer une réponse de l'IA qui t'inquiète ? (un ou deux mots)",
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['an adult', 'adult', 'a teacher', 'teacher', 'a parent', 'parent', 'a grown-up'],
              fr: [
                'un adulte',
                'adulte',
                'un enseignant',
                'enseignant',
                'un parent',
                'parent',
                'un professeur',
              ],
            },
            explanation: {
              en: { text: 'An adult: a teacher or a parent. That is rule four.' },
              fr: { text: "Un adulte : un enseignant ou un parent. C'est la règle numéro quatre." },
            },
          },
        ],
      },
    },
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
            title: "Mon histoire avec l'IA",
            brief:
              "Écris une histoire courte (environ dix phrases) avec un héros, un problème, une solution et une fin. Prépare-la toi-même, demande de l'aide au tuteur IA avec une consigne claire, puis fais de l'histoire la tienne.",
            requirements:
              "Envoie l'histoire sous forme de texte, de photo de ta page écrite à la main, ou de lien vers un document partagé. À la fin, écris une phrase qui dit comment l'IA t'a aidé. Ne mets ni ton nom complet, ni ton adresse, ni ton école dans l'histoire.",
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
  ],
};
