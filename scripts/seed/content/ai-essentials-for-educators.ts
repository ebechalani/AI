// "AI Essentials for Educators": the Teacher Academy demo course of brief section 22, for
// teachers of pupils aged 8 to 18. Six modules of two lessons, twelve lessons and 535 minutes, in
// this order: m1 generative AI literacy (how language models produce text; hallucinations, bias
// and a four-point check), m2 planning and differentiation (a five-part prompt pattern; adapted
// texts that keep the objective and describe needs, never pupils), m3 assessment and academic
// integrity (AI-resilient tasks, AI-use levels, why detectors cannot settle a case, class AI-use
// policies), m4 safe classroom AI (personal data, age rules, safeguarding; age-appropriate
// activities on the LEARN -> TRY -> BUILD -> GET FEEDBACK -> IMPROVE -> SHOW cycle), m5 teaching
// machine learning hands-on with Machine Learning for Kids (the ways in and what the site keeps,
// privacy and consent, a lesson plan with a fallback; assessing what pupils build: evidence, a
// rubric, misconceptions, bias and the next worksheet) and m6 inclusive and creative AI
// (read-aloud, captions, levelled texts and translation planned with Universal Design for
// Learning; image, audio and video generation, its rules and media literacy against deepfakes),
// which ends the course with quiz-m6 and a last reflection. A teacher course has no project: its
// 'build' stage is a reflection in which teachers plan something concrete for their own class,
// so `projects` stays empty. Blocks cover every lesson stage, and every lesson has a 'watch'
// stage; one quiz per module; English and French ("vous"); no uploaded files.
//
// m1 to m4 (with quiz-m1 to quiz-m4) are the first release and are written here. m5 and m6 were
// added by a later content release (ARCHITECTURE.md 11.7) and live in
// ./ai-essentials-for-educators/, whose headers say what each one covers. A release only adds to
// a database that already holds the course, so m1 to m4 and their quizzes must not be changed
// here, and the module files' quizzes come after the first release's in their array. m4-l2 was
// written as the last lesson of the first release: its quiz intro calls quiz-m4 "a final check"
// and its last reflection asks for a first step "to bring what you learned in this course into
// your classroom". Both stay as they are; the course now ends with m6-l2. Module ids follow the
// course order, so the references by number ("module 4") in every module hold. When the course
// was assembled, m6-l1 gained a written replay (m6-l1-b5) so that it has a 'watch' stage like
// every other lesson, and m5-l1-b4 a line that keeps ages 8 to 10 to m4-l2's age table (the
// teacher operates the site on the class screen).
//
// One Machine Learning for Kids activity, done by the teacher as a learner with "Try it now" (no
// account; nothing about the learner is stored, the site says): Smart Classroom (m5-l1, a text
// model in Scratch that recognises classroom commands), with a class-screen or paper version for
// schools that block the site. There is nothing to hand in: teachers keep their test table and
// timings in their own notes for the reflections. m5-l2 links seven worksheets to choose from
// (links only, no worksheet text; CC BY-NC-SA 4.0). The seven videos are in English: six from
// Code.org (How AI Works on chatbots and large language models, m1-l1, and on image and video
// generation, m6-l2, also curated in build-with-generative-ai m1-l2; three sessions of AI 101 for
// Teachers, with ETS, ISTE and Khan Academy, m2-l1, m4-l1 and m4-l2; "What is machine learning?"
// from AI for Oceans, m5-l1, also curated in my-first-ai-adventure m1-l2) and one from IBM
// Technology (m1-l2). The other five lessons (m2-l2, m3-l1, m3-l2, m5-l2, m6-l1) cover their
// 'watch' stage with a written replay instead.

import type { SeedCourse } from '../types';
import { m5 } from './ai-essentials-for-educators/m5';
import { m6 } from './ai-essentials-for-educators/m6';

const RICH = 'rich_text' as const;

export const aiEssentialsForEducators: SeedCourse = {
  id: 'ai-essentials-for-educators',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Essentials for Educators',
        summary:
          'Understand what generative AI can and cannot do, use it to plan and differentiate, rethink assessment, protect your pupils and run safe, project-based AI activities, then teach machine learning hands-on with Machine Learning for Kids and use AI for inclusive, creative work.',
        description:
          'A practical course for teachers of pupils aged 8 to 18. In twelve lessons you will find out how generative AI produces text and why it makes mistakes, write prompts that turn it into a useful planning assistant while you remain the author, adapt resources for different learners without sharing personal data, redesign assessment for a world in which pupils have AI tools (and see why AI detectors cannot settle a case), apply privacy, age and safeguarding rules, and plan a project-based AI activity for your own class. You will then learn to teach machine learning hands-on with Machine Learning for Kids, a free website on which pupils train their own models: choose how pupils reach it and what it keeps about them, plan a lesson with a fallback for when the site is blocked, and do its Smart Classroom activity yourself, as your pupils will, with "Try it now", so no account is needed. You will also learn to assess what pupils build, with the evidence to collect, a simple rubric, the misconceptions to listen for and questions on bias, and to choose the next worksheet for your class. The last module turns to inclusive and creative AI: read-aloud, captions, levelled texts and translation, planned for the whole class with Universal Design for Learning and with no data about pupils’ needs in any prompt, then image, audio and video generation in class, with the rules to set first and the verification habits that help pupils see through deepfakes. Most lessons end with a short plan for your own class, and six quizzes check your understanding. The course closes with a lesson on generated media and media literacy and its quiz, and completing it earns a certificate.',
        outcomes: [
          'Explain how generative AI produces text, and why fluent output can still be false or biased',
          'Write structured prompts for lesson plans, rubrics and differentiated resources, and check every output',
          'Redesign assessment tasks so that they value the process and make AI use transparent',
          'Explain why AI detectors cannot prove misconduct, and respond fairly to suspected undisclosed AI use',
          'Apply privacy, age and safeguarding rules when you or your pupils use AI tools',
          'Plan an age-appropriate, project-based AI activity for your own class',
          'Run a hands-on Machine Learning for Kids lesson safely: choose the way in, protect pupils’ data, follow your school’s consent rules and plan a fallback',
          'Assess what pupils build with machine learning, using evidence, a simple rubric and questions on misconceptions and bias',
          'Plan read-aloud, captions, levelled texts and translation for the whole class with Universal Design for Learning, keeping data about needs out of every prompt',
          'Set clear rules for AI-generated images, audio and video, and teach pupils to check what they see and hear',
        ],
      },
      fr: {
        title: 'L’essentiel de l’IA pour les enseignants',
        summary:
          'Comprenez ce que l’IA générative sait faire ou non, utilisez-la pour préparer et différencier, repensez l’évaluation, protégez vos élèves, menez des activités d’IA sûres, enseignez l’apprentissage automatique avec Machine Learning for Kids et mettez l’IA au service de l’inclusion et de la création.',
        description:
          'Une formation pratique pour les enseignants d’élèves de 8 à 18\u00a0ans. En douze leçons, vous découvrirez comment l’IA générative produit du texte et pourquoi elle se trompe, vous rédigerez des prompts qui en font une aide utile à la préparation de vos cours tout en restant l’auteur de vos choix, vous adapterez des ressources à des élèves différents sans partager de données personnelles, vous repenserez l’évaluation dans un monde où les élèves ont accès à l’IA (et verrez pourquoi les détecteurs d’IA ne permettent pas de trancher), vous appliquerez les règles de protection des données, d’âge et de protection de l’enfance, et vous concevrez une activité d’IA fondée sur un projet pour votre propre classe. Vous apprendrez ensuite à enseigner l’apprentissage automatique par la pratique avec Machine Learning for Kids, un site gratuit sur lequel les élèves entraînent leurs propres modèles\u00a0: choisir comment vos élèves y accèdent et ce que le site conserve à leur sujet, préparer une séance avec une solution de repli si le site est bloqué, et faire vous-même, comme vos élèves, son activité Smart Classroom (Salle de classe intelligente) avec «\u00a0Essayer maintenant\u00a0» (Try it now), sans créer de compte. Vous verrez aussi comment évaluer ce que construisent les élèves, avec les traces d’apprentissage à recueillir, une grille simple, les idées fausses à repérer et des questions sur les biais, et comment choisir la fiche suivante pour votre classe. Le dernier module est consacré à une IA inclusive et créative\u00a0: la lecture à voix haute, les sous-titres, les textes de différents niveaux et la traduction, prévus pour toute la classe grâce à la conception universelle de l’apprentissage et sans aucune donnée sur les besoins des élèves dans un prompt, puis la génération d’images, de sons et de vidéos en classe, avec les règles à fixer d’abord et les habitudes de vérification qui aident les élèves à déjouer les deepfakes. La plupart des leçons se terminent par un court plan pour votre propre classe, et six quiz vérifient votre compréhension. La formation se conclut par une leçon sur les médias générés et l’éducation aux médias, suivie de son quiz, et, une fois terminée, elle donne droit à un certificat.',
        outcomes: [
          'Expliquer comment l’IA générative produit du texte, et pourquoi un texte fluide peut quand même être faux ou biaisé',
          'Rédiger des prompts structurés pour des plans de séance, des grilles d’évaluation et des ressources différenciées, et vérifier chaque résultat',
          'Repenser les tâches d’évaluation pour valoriser la démarche et rendre l’usage de l’IA transparent',
          'Expliquer pourquoi les détecteurs d’IA ne prouvent rien, et réagir équitablement face à un usage non déclaré de l’IA',
          'Appliquer les règles de protection des données, d’âge et de protection de l’enfance quand vous ou vos élèves utilisez l’IA',
          'Concevoir une activité d’IA adaptée à l’âge et fondée sur un projet pour votre propre classe',
          'Mener en toute sécurité une séance avec Machine Learning for Kids\u00a0: choisir le mode d’accès, protéger les données des élèves, respecter les règles de consentement et prévoir une solution de repli',
          'Évaluer ce que les élèves construisent avec l’apprentissage automatique, à l’aide de traces, d’une grille simple et de questions sur les idées fausses et les biais',
          'Proposer à toute la classe lecture à voix haute, sous-titres, textes de niveaux variés et traduction selon la conception universelle de l’apprentissage, sans données sur les besoins dans un prompt',
          'Fixer des règles claires pour les images, les sons et les vidéos générés par l’IA, et apprendre aux élèves à vérifier ce qu’ils voient et entendent',
        ],
      },
    },
    audience: 'teacher',
    area: 'ai',
    tags: [
      'teachers',
      'generative-ai',
      'prompts',
      'differentiation',
      'assessment',
      'academic-integrity',
      'safeguarding',
      'privacy',
      'machine-learning',
      'responsible-ai',
    ],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: 535,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'teacher-academy',
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
            title: 'Generative AI: what it is and what it is not',
            description:
              'How large language models produce text, what that means for their reliability, and the limits every teacher should know: hallucinations, bias and outdated knowledge.',
          },
          fr: {
            title: 'L’IA générative\u00a0: ce qu’elle est, ce qu’elle n’est pas',
            description:
              'Comment les grands modèles de langage produisent du texte, ce que cela implique pour leur fiabilité, et les limites que tout enseignant doit connaître\u00a0: hallucinations, biais et connaissances datées.',
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
                title: 'How generative AI produces text',
                summary:
                  'Large language models predict likely text from patterns. Find out what that explains about their answers, and what it rules out.',
              },
              fr: {
                title: 'Comment l’IA générative produit du texte',
                summary:
                  'Les grands modèles de langage prédisent un texte probable à partir de régularités. Voyez ce que cela explique de leurs réponses, et ce que cela exclut.',
              },
            },
            estimatedMinutes: 25,
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
                  heading: 'Three things heard in the staff room',
                  body: '"It searches the internet for the answer." "It knows the curriculum." "It understood exactly what my class needs."\n\nYou have probably heard sentences like these about AI chatbots, and perhaps said one yourself. Each contains a misunderstanding, and each leads to a different mistake in the classroom: trusting an answer without checking it, assuming it matches your programme, or giving it information about pupils that it should never see.\n\nThis lesson explains what a generative AI tool actually does when it answers you. Once you know the mechanism, most of its strengths, and most of its failures, become predictable.',
                },
                fr: {
                  heading: 'Trois phrases entendues en salle des professeurs',
                  body: '«\u00a0Elle cherche la réponse sur Internet.\u00a0» «\u00a0Elle connaît le programme.\u00a0» «\u00a0Elle a tout de suite compris ce dont ma classe avait besoin.\u00a0»\n\nVous avez sans doute entendu ce genre de phrases à propos des chatbots d’IA, et peut-être en avez-vous prononcé une vous-même. Chacune repose sur un malentendu, et chacune conduit à une erreur différente en classe\u00a0: faire confiance à une réponse sans la vérifier, supposer qu’elle correspond à votre programme, ou lui confier sur vos élèves des informations qu’elle ne devrait jamais recevoir.\n\nCette leçon explique ce que fait réellement un outil d’IA générative lorsqu’il vous répond. Une fois le mécanisme compris, la plupart de ses points forts, et la plupart de ses défaillances, deviennent prévisibles.',
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
                  heading: 'Prediction, not understanding',
                  body: 'Chatbots such as ChatGPT, Gemini, Copilot or Claude are built on **large language models** (LLMs).\n\n1. **Training.** A model is trained on an enormous amount of text: books, websites, articles, code. From it, the model extracts statistical patterns: which words tend to follow which, and in which contexts.\n2. **Generation.** When you send a prompt (your request to the AI), the model produces its answer one small piece of text at a time, each time choosing a **likely continuation** of everything written so far. There is an element of chance, so the same prompt can give different answers.\n3. **Fine-tuning.** Developers then train the model further, often with human feedback, so that it follows instructions, adopts a helpful tone and declines some requests.\n\n**What follows from this**\n\n- The output is **plausible**, not checked. The model has no built-in way to tell a true sentence from a false one that sounds similar.\n- Its knowledge stops at a **training cut-off date**. Some tools can search the web or read a document you give them, but they still generate the answer, and can still misread or misquote the source.\n- It is **not a person**. It does not think, feel or intend anything, and it knows nothing about your pupils except what you type. Fluent language makes this easy to forget, which is exactly why it is worth saying out loud to your pupils.\n- It is **not neutral**. It reproduces the patterns of its training data, including its gaps and stereotypes (more on this in the next lesson).\n- What you type may be **stored** by the provider and, depending on the settings and the terms of use, used to improve its models. Treat every prompt as something that may leave your school.',
                },
                fr: {
                  heading: 'Prédire n’est pas comprendre',
                  body: 'Les chatbots comme ChatGPT, Gemini, Copilot ou Claude reposent sur des **grands modèles de langage** (en anglais, *large language models* ou LLM).\n\n1. **L’entraînement.** Le modèle est entraîné sur une quantité énorme de textes\u00a0: livres, sites web, articles, code informatique. Il en extrait des régularités statistiques\u00a0: quels mots ont tendance à en suivre d’autres, et dans quels contextes.\n2. **La génération.** Quand vous envoyez un prompt (la requête que vous adressez à l’IA), le modèle produit sa réponse petit morceau par petit morceau, en choisissant chaque fois une **suite probable** de tout ce qui précède. Le hasard y joue un rôle\u00a0: un même prompt peut donner des réponses différentes.\n3. **L’ajustement.** Les développeurs poursuivent ensuite l’entraînement, souvent avec des retours humains, pour que le modèle suive les instructions, adopte un ton serviable et refuse certaines demandes.\n\n**Ce qui en découle**\n\n- Le résultat est **plausible**, pas vérifié. Le modèle n’a aucun moyen intégré de distinguer une phrase vraie d’une phrase fausse qui lui ressemble.\n- Ses connaissances s’arrêtent à une **date limite d’entraînement**. Certains outils peuvent chercher sur le web ou lire un document que vous leur fournissez, mais ils génèrent toujours la réponse, et peuvent toujours mal lire ou mal citer la source.\n- Ce n’est **pas une personne**. Le modèle ne pense pas, ne ressent rien, n’a aucune intention et ne sait rien de vos élèves en dehors de ce que vous tapez. L’aisance de son langage le fait facilement oublier\u00a0: c’est justement pour cela qu’il vaut la peine de le dire clairement à vos élèves.\n- Il n’est **pas neutre**. Il reproduit les régularités de ses données d’entraînement, y compris leurs lacunes et leurs stéréotypes (nous y reviendrons dans la leçon suivante).\n- Ce que vous tapez peut être **conservé** par le fournisseur et, selon les paramètres et les conditions d’utilisation, servir à améliorer ses modèles. Considérez chaque prompt comme une information susceptible de sortir de votre établissement.',
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
                  title: 'Watch: how chatbots and large language models work',
                  caption:
                    'A short video (about seven minutes) from Code.org’s How AI Works series, presented with ETS, ISTE and Khan Academy.',
                  transcript:
                    'In short: the video explains that chatbots are built on large language models, and that most of what they do rests on simple ideas from statistics, applied billions of times by fast computers. It starts with a small model trained on the works of Shakespeare, which learns how likely each letter is to follow another and uses those probabilities to produce new text. Looking at longer sequences gives the model more context, and its output becomes far more convincing. Trained on a vast amount of text, a large language model can write fluent answers on almost any topic, but each answer is still built from probabilities, so it can contain errors. For the classroom, the key message is the same as in this lesson: fluent is not the same as true, and whether this counts as intelligence is still debated.',
                },
                fr: {
                  title:
                    'Regardez\u00a0: comment fonctionnent les chatbots et les grands modèles de langage',
                  caption:
                    'Une courte vidéo (environ sept minutes) de la série How AI Works de Code.org, présentée avec ETS, ISTE et Khan Academy (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: la vidéo explique que les chatbots reposent sur de grands modèles de langage, et que l’essentiel de ce qu’ils font repose sur des idées simples de statistique, appliquées des milliards de fois par des ordinateurs très rapides. Elle part d’un petit modèle entraîné sur les œuvres de Shakespeare, qui calcule la probabilité qu’une lettre en suive une autre et s’en sert pour produire un nouveau texte. En tenant compte de suites plus longues, le modèle dispose de plus de contexte, et ce qu’il produit devient beaucoup plus convaincant. Entraîné sur une immense quantité de textes, un grand modèle de langage peut rédiger des réponses fluides sur presque n’importe quel sujet, mais chaque réponse reste construite à partir de probabilités\u00a0: elle peut donc contenir des erreurs. Pour la classe, le message clé est le même que dans cette leçon\u00a0: fluide ne veut pas dire vrai, et la question de savoir s’il s’agit d’intelligence fait encore débat.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'X-AWdfSFCHQ',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm1-l1-b4',
              type: 'reflection',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Try it: explain to a pupil aged 12, in three or four sentences, how a chatbot produces its answers and why they can be wrong. Avoid words that suggest the AI thinks, knows or understands, and use one comparison from everyday life.',
                },
                fr: {
                  prompt:
                    'À vous\u00a0: expliquez à un élève de 12\u00a0ans, en trois ou quatre phrases, comment un chatbot produit ses réponses et pourquoi elles peuvent être fausses. Évitez les mots qui laissent entendre que l’IA pense, sait ou comprend, et utilisez une comparaison tirée de la vie quotidienne.',
                },
              },
              data: { minLength: 150 },
            },
            {
              id: 'm1-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to explain the difference between a search engine and a large language model. Compare its explanation with this lesson: is anything missing, oversimplified or wrong? Checking an AI explanation against what you know is a habit worth modelling for your pupils.',
                  starterPrompt:
                    'Explain the difference between a search engine and a large language model, with one analogy that a teacher could use with pupils aged 11 to 14.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA d’expliquer la différence entre un moteur de recherche et un grand modèle de langage. Comparez son explication avec cette leçon\u00a0: manque-t-il quelque chose, est-ce trop simplifié, ou faux\u00a0? Confronter une explication de l’IA à ce que l’on sait\u00a0: voilà une habitude à montrer à vos élèves.',
                  starterPrompt:
                    'Expliquez-moi la différence entre un moteur de recherche et un grand modèle de langage, avec une analogie qu’un enseignant pourrait utiliser avec des élèves de 11 à 14\u00a0ans.',
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
                  prompt:
                    'Which belief about AI do you hear most often in your school, from colleagues, pupils or parents? Write it down, then write how you would correct it in one or two sentences.',
                },
                fr: {
                  prompt:
                    'Quelle idée reçue sur l’IA entendez-vous le plus souvent dans votre établissement, chez des collègues, des élèves ou des parents\u00a0? Notez-la, puis écrivez en une ou deux phrases comment vous la corrigeriez.',
                },
              },
              data: { minLength: 100 },
            },
          ],
        },
        {
          id: 'm1-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Limits: hallucinations, bias and blind spots',
                summary:
                  'Why AI tools invent facts and references, where bias comes from, and a quick routine for checking any output before it reaches your pupils.',
              },
              fr: {
                title: 'Les limites\u00a0: hallucinations, biais et angles morts',
                summary:
                  'Pourquoi les outils d’IA inventent des faits et des références, d’où viennent les biais, et une routine rapide pour vérifier tout résultat avant qu’il n’arrive à vos élèves.',
              },
            },
            estimatedMinutes: 35,
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
                  heading: 'The perfect reference that does not exist',
                  body: 'In 2023, two lawyers and their law firm in New York were fined after filing a legal brief that cited court decisions which did not exist. A chatbot had produced them, complete with case names, dates and quotations, and nobody had checked.\n\nThe same thing happens in schools: a reading list with a book that was never written, a quotation attributed to the wrong scientist, a statistic with no source. These errors are called **hallucinations**, and they are not rare accidents: they follow directly from how the tools work.\n\nThe good news: once you know where AI output tends to go wrong, checking it becomes a quick professional routine.',
                },
                fr: {
                  heading: 'La référence parfaite… qui n’existe pas',
                  body: 'En 2023, à New York, deux avocats et leur cabinet ont été condamnés à une amende pour avoir déposé des conclusions qui citaient des décisions de justice inexistantes. Un chatbot les avait produites, avec noms d’affaires, dates et citations, et personne n’avait vérifié.\n\nLa même chose arrive à l’école\u00a0: une liste de lectures avec un livre qui n’a jamais été écrit, une citation attribuée au mauvais scientifique, une statistique sans source. On appelle ces erreurs des **hallucinations**, et ce ne sont pas des accidents rares\u00a0: elles découlent directement du fonctionnement de ces outils.\n\nLa bonne nouvelle\u00a0: une fois que l’on sait où les résultats de l’IA ont tendance à dérailler, les vérifier devient une routine professionnelle rapide.',
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
                  heading: 'Where AI output goes wrong',
                  body: '**Hallucinations.** A model generates the most plausible continuation, and a plausible reference, date or number is not necessarily a real one. The risk is highest for references and quotations, precise figures, specialised or local topics, recent events and anything outside the training data.\n\n**Bias.** Models reproduce the patterns of their training data, in which some languages, countries and points of view are over-represented. Expect stereotypes in examples (who is the scientist, who is the nurse?), in generated images and in the names and situations chosen for word problems. Expect weaker results in languages other than English and on non-Western curricula.\n\n**Outdated or missing knowledge.** A model knows nothing after its training cut-off, and nothing about your school, your programme or your pupils unless you provide it.\n\n**Agreeing with you.** Models tend to follow the framing of the question. Ask "Why is this method the best?" and you will get reasons, even when it is not. Ask for strengths **and** weaknesses instead.\n\n**Confidence is not evidence.** The tone is just as assured when the answer is wrong.\n\n### A four-point check before anything reaches pupils\n\n1. **Facts:** verify claims, figures and references against a source you trust. If a reference cannot be found, treat it as invented.\n2. **Fit:** does it match your objective, your programme and the level of your class?\n3. **Fairness:** who is represented, who is missing, which stereotypes appear?\n4. **Final say:** you are the author. Edit, cut or start again, and never pass on output you have not read.',
                },
                fr: {
                  heading: 'Là où les résultats de l’IA déraillent',
                  body: '**Les hallucinations.** Le modèle génère la suite la plus plausible, et une référence, une date ou un chiffre plausibles ne sont pas forcément réels. Le risque est le plus élevé pour les références et les citations, les chiffres précis, les sujets pointus ou locaux, l’actualité récente et tout ce qui sort des données d’entraînement.\n\n**Les biais.** Les modèles reproduisent les régularités de leurs données d’entraînement, où certaines langues, certains pays et certains points de vue sont surreprésentés. Attendez-vous à des stéréotypes dans les exemples (qui est le scientifique, qui est l’infirmière\u00a0?), dans les images générées et dans les prénoms et les situations choisis pour les problèmes de mathématiques. Attendez-vous aussi à des résultats moins bons dans d’autres langues que l’anglais et sur des programmes scolaires non occidentaux.\n\n**Des connaissances datées ou absentes.** Un modèle ne sait rien de ce qui s’est passé après sa date limite d’entraînement, ni de votre établissement, de votre programme ou de vos élèves, sauf si vous le lui fournissez.\n\n**La tendance à vous donner raison.** Les modèles suivent souvent le cadrage de la question. Demandez «\u00a0Pourquoi cette méthode est-elle la meilleure\u00a0?\u00a0» et vous obtiendrez des arguments, même si elle ne l’est pas. Demandez plutôt ses points forts **et** ses points faibles.\n\n**L’assurance n’est pas une preuve.** Le ton est tout aussi assuré quand la réponse est fausse.\n\n### Quatre vérifications avant que quoi que ce soit n’arrive aux élèves\n\n1. **Les faits\u00a0:** vérifiez les affirmations, les chiffres et les références dans une source fiable. Une référence introuvable doit être considérée comme inventée.\n2. **L’adéquation\u00a0:** le contenu correspond-il à votre objectif, à votre programme et au niveau de votre classe\u00a0?\n3. **L’équité\u00a0:** qui est représenté, qui est absent, quels stéréotypes apparaissent\u00a0?\n4. **Le dernier mot\u00a0:** c’est vous l’auteur. Modifiez, coupez ou recommencez, et ne transmettez jamais un résultat que vous n’avez pas lu.',
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
                  title: 'Watch: why large language models hallucinate',
                  caption:
                    'A short explainer from the IBM Technology channel on the causes of hallucinations and how to reduce them.',
                  transcript:
                    'In short: the video describes hallucinations as outputs that sound right but are false, nonsensical or inconsistent with the question, and illustrates them with examples from space science and aviation. It groups the causes into three families: the quality of the training data (gaps, errors and contradictions in the text the model learned from), the way text is generated (the model produces likely words, not verified facts) and the input context (vague or contradictory prompts). It ends with ways to reduce the risk: write clear and specific prompts, adjust the settings that make answers more or less creative where a tool offers them, and give the model examples of what you expect ("multi-shot" prompting). None of these removes hallucinations completely, which is why checking remains the teacher’s job.',
                },
                fr: {
                  title: 'Regardez\u00a0: pourquoi les grands modèles de langage hallucinent',
                  caption:
                    'Une courte vidéo explicative de la chaîne IBM Technology sur les causes des hallucinations et les moyens de les limiter (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: la vidéo décrit les hallucinations comme des résultats qui semblent justes mais qui sont faux, absurdes ou sans rapport avec la question, et les illustre par des exemples tirés de l’astronomie et de l’aviation. Elle regroupe les causes en trois familles\u00a0: la qualité des données d’entraînement (lacunes, erreurs et contradictions dans les textes dont le modèle a appris), la manière dont le texte est généré (le modèle produit des mots probables, pas des faits vérifiés) et le contexte fourni (des prompts vagues ou contradictoires). Elle se termine par des moyens de réduire le risque\u00a0: rédiger des prompts clairs et précis, ajuster, quand l’outil le permet, les réglages qui rendent les réponses plus ou moins créatives, et donner au modèle des exemples de ce que l’on attend (le prompt «\u00a0à plusieurs exemples\u00a0», en anglais «\u00a0multi-shot\u00a0»). Aucune de ces méthodes ne supprime complètement les hallucinations\u00a0: vérifier reste le travail de l’enseignant.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'cfqtFvWOfg0',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm1-l2-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: spot the problems',
                  body: 'A teacher asked an AI tool for a short text on the water cycle for pupils aged 9 to 10. Read the output below and decide, for each numbered sentence, whether you would keep it, correct it or check it. Write down your answers: question 3 of this lesson’s quiz asks for them.\n\n> **The water cycle**\n>\n> (1) The sun heats the water in oceans, lakes and rivers, but water only evaporates when it reaches 100\u00a0°C. (2) The water vapour rises, cools and forms clouds, which are made of water vapour. (3) When the tiny droplets in a cloud join together and become too heavy, they fall as rain. (4) Rain is fresh water, because the salt stays in the sea when the water evaporates. (5) Scientists have shown that the same raindrop falls on the same town every twelve years (Martin and Clarke, *Journal of Young Scientists*, 2018). (6) Ask your mum to help you make a cloud in a jar at home!\n\nUse the four-point check: **facts**, **fit**, **fairness**, **final say**. Then think about what this means for a text you would give to your own class.',
                },
                fr: {
                  heading: 'À vous\u00a0: repérez les problèmes',
                  body: 'Un enseignant a demandé à un outil d’IA un court texte sur le cycle de l’eau pour des élèves de 9 à 10\u00a0ans. Lisez le résultat ci-dessous et décidez, pour chaque phrase numérotée, si vous la garderiez, la corrigeriez ou la vérifieriez. Notez vos réponses\u00a0: la question 3 du quiz de cette leçon vous les demandera.\n\n> **Le cycle de l’eau**\n>\n> (1) Le soleil chauffe l’eau des océans, des lacs et des rivières, mais l’eau ne s’évapore que lorsqu’elle atteint 100\u00a0°C. (2) La vapeur d’eau monte, se refroidit et forme des nuages, qui sont faits de vapeur d’eau. (3) Quand les minuscules gouttelettes d’un nuage se rassemblent et deviennent trop lourdes, elles tombent sous forme de pluie. (4) L’eau de pluie est de l’eau douce, car le sel reste dans la mer quand l’eau s’évapore. (5) Des scientifiques ont montré que la même goutte de pluie retombe sur la même ville tous les douze ans (Martin et Clarke, *Journal of Young Scientists*, 2018). (6) Demande à ta maman de t’aider à fabriquer un nuage dans un bocal à la maison\u00a0!\n\nAppliquez les quatre vérifications\u00a0: **les faits**, **l’adéquation**, **l’équité**, **le dernier mot**. Demandez-vous ensuite ce que cela implique pour un texte que vous donneriez à votre propre classe.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to set you a checking challenge. Then apply the same four-point check to the tutor’s own answer: the tutor is an AI tool too.',
                  starterPrompt:
                    'Challenge me: describe a short situation in which a teacher plans to use an AI-generated text in a science lesson, and ask me what I should check before using it.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA de vous lancer un défi de vérification. Appliquez ensuite les quatre vérifications à la réponse du tuteur lui-même\u00a0: c’est lui aussi un outil d’IA.',
                  starterPrompt:
                    'Lancez-moi un défi\u00a0: décrivez une courte situation dans laquelle un enseignant prévoit d’utiliser un texte généré par l’IA dans une leçon de sciences, et demandez-moi ce que je dois vérifier avant de m’en servir.',
                },
              },
              data: { tutorMode: 'challenge_me', labToolId: null },
            },
            {
              id: 'm1-l2-b6',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Check what you have retained about how generative AI works and where it goes wrong.',
                },
                fr: {
                  intro:
                    'Vérifiez ce que vous avez retenu du fonctionnement de l’IA générative et de ses erreurs.',
                },
              },
              data: { quizId: 'quiz-m1' },
            },
            {
              id: 'm1-l2-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Think of a resource you could ask an AI tool to produce for your next unit (a text, a set of questions, a worked example). Which of the four checks will matter most for it, and how will you carry it out?',
                },
                fr: {
                  prompt:
                    'Pensez à une ressource que vous pourriez demander à un outil d’IA pour votre prochaine séquence (un texte, une série de questions, un exemple corrigé). Laquelle des quatre vérifications comptera le plus pour cette ressource, et comment allez-vous la mener\u00a0?',
                },
              },
              data: { minLength: 120 },
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
            title: 'Planning and differentiation with AI',
            description:
              'Prompt patterns that turn a general AI tool into a useful planning assistant, and how to adapt resources for different learners while you keep the objective, the quality checks and your pupils’ data in your hands.',
          },
          fr: {
            title: 'Préparer et différencier avec l’IA',
            description:
              'Des structures de prompts qui font d’un outil d’IA généraliste un assistant de préparation utile, et la manière d’adapter des ressources à des élèves différents en gardant la main sur l’objectif, sur les vérifications et sur les données de vos élèves.',
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
                title: 'Prompt patterns for planning',
                summary:
                  'Role, task, context, format and constraints: a pattern for lesson plans, rubrics and question banks that you then check and adapt.',
              },
              fr: {
                title: 'Des structures de prompts pour préparer vos cours',
                summary:
                  'Rôle, tâche, contexte, format et contraintes\u00a0: une structure pour les plans de séance, les grilles d’évaluation et les banques de questions, que vous vérifiez et adaptez ensuite.',
              },
            },
            estimatedMinutes: 60,
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
                  heading: 'One sentence, one generic answer',
                  body: 'Type "Create a lesson on fractions" into a chatbot and you will get a lesson: for an unknown age, an unknown programme and an imaginary class, in a format you did not choose. It is not wrong, just generic, and turning it into something usable can take longer than writing your own.\n\nThe tool has only your words to work with. Everything you know but do not write (your pupils’ age, what they already know, how long the lesson lasts, what they should be able to do at the end) is missing from the answer.\n\nThe fix is not a magic phrase but a structure. In this lesson you will learn a five-part pattern, see it at work on lesson plans and rubrics, and build a reusable prompt for your own planning.',
                },
                fr: {
                  heading: 'Une phrase, une réponse générique',
                  body: 'Tapez «\u00a0Créez une leçon sur les fractions\u00a0» dans un chatbot et vous obtiendrez une leçon\u00a0: pour un âge inconnu, un programme inconnu et une classe imaginaire, dans un format que vous n’avez pas choisi. Ce n’est pas faux, c’est simplement générique, et la rendre utilisable peut prendre plus de temps que d’écrire la vôtre.\n\nL’outil ne dispose que de vos mots. Tout ce que vous savez sans l’écrire (l’âge de vos élèves, ce qu’ils savent déjà, la durée de la séance, ce qu’ils doivent savoir faire à la fin) manque dans la réponse.\n\nLa solution n’est pas une formule magique, mais une structure. Dans cette leçon, vous allez découvrir une structure en cinq parties, la voir à l’œuvre sur des plans de séance et des grilles d’évaluation, et construire un prompt réutilisable pour votre propre préparation.',
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
                  heading: 'A five-part prompt pattern',
                  body: 'A good planning prompt answers five questions.\n\n| Part | Question it answers | Example |\n|---|---|---|\n| **Role** | Who should the AI write as? | You are an experienced primary teacher. |\n| **Task** | What do you want? | Plan a 50-minute lesson introducing equivalent fractions. |\n| **Context** | Who is it for, and what do they already know? | A class of 26 pupils aged 9 to 10 who can find halves and quarters of shapes. Objective: recognise and name equivalent fractions. |\n| **Format** | What should the output look like? | A table with timings, teacher actions, pupil activities and one hinge question. |\n| **Constraints** | What must it respect or avoid? | Hands-on materials only, no worksheets; address one common misconception. |\n\nFour habits make the pattern work:\n\n- **Give it your materials.** Paste your objective, the wording of your programme or your own notes. Never paste pupils’ names, marks or personal information.\n- **Ask for options, not answers.** "Suggest three different starters" gives you choices to judge.\n- **Change one thing at a time.** If the result is too difficult, say so and ask again: "Simplify the main activity for pupils who are not yet confident with halves."\n- **Ask for a critique.** "List three weaknesses of this plan for a mixed-ability class" counters the tool’s tendency to agree with you.\n\nThe same pattern works for **rubrics**: give the task, the criteria you care about and the levels you use. For example:\n\n> *You are a science teacher. Write a three-level rubric (beginning, secure, advanced) for a lab report by pupils aged 13 to 14, with criteria for method, results and evaluation. Present it as a table with one observable descriptor per cell.*\n\nThen check that every descriptor names something you could actually see in a pupil’s report, and that the levels match your own expectations, not the tool’s. The pattern also works for **question banks** (give the objective and ask for questions at several levels, with answers and common errors) and **model answers** (give the question and the level, then compare with your own).\n\nWhatever it produces is a **draft**. You check it with the four-point check from module 1, and you decide what reaches your pupils.',
                },
                fr: {
                  heading: 'Une structure de prompt en cinq parties',
                  body: 'Un bon prompt de préparation répond à cinq questions.\n\n| Partie | Question à laquelle elle répond | Exemple |\n|---|---|---|\n| **Rôle** | Dans quel rôle l’IA doit-elle écrire\u00a0? | Vous êtes un enseignant expérimenté de l’école élémentaire. |\n| **Tâche** | Que voulez-vous\u00a0? | Préparez une séance de 50\u00a0minutes pour introduire les fractions équivalentes. |\n| **Contexte** | Pour qui, et que savent-ils déjà\u00a0? | Une classe de 26\u00a0élèves de 9 à 10\u00a0ans qui savent trouver la moitié et le quart d’une figure. Objectif\u00a0: reconnaître et nommer des fractions équivalentes. |\n| **Format** | À quoi doit ressembler le résultat\u00a0? | Un tableau avec le minutage, les actions de l’enseignant, les activités des élèves et une question charnière. |\n| **Contraintes** | Que faut-il respecter ou éviter\u00a0? | Uniquement du matériel de manipulation, pas de fiche d’exercices\u00a0; traiter une erreur fréquente. |\n\nQuatre habitudes font fonctionner cette structure\u00a0:\n\n- **Fournissez vos documents.** Collez votre objectif, la formulation de votre programme ou vos propres notes. Ne collez jamais les noms, les notes ou des informations personnelles de vos élèves.\n- **Demandez des options, pas une réponse.** «\u00a0Proposez trois entrées en matière différentes\u00a0» vous donne des choix à évaluer.\n- **Modifiez une seule chose à la fois.** Si le résultat est trop difficile, dites-le et redemandez\u00a0: «\u00a0Simplifiez l’activité principale pour des élèves qui ne maîtrisent pas encore la notion de moitié.\u00a0»\n- **Demandez une critique.** «\u00a0Citez trois faiblesses de ce plan pour une classe hétérogène\u00a0» contrebalance la tendance de l’outil à vous donner raison.\n\nLa même structure fonctionne pour les **grilles d’évaluation**\u00a0: donnez la tâche, les critères qui comptent pour vous et les niveaux que vous utilisez. Par exemple\u00a0:\n\n> *Vous êtes un enseignant de sciences. Rédigez une grille d’évaluation à trois niveaux (en cours d’acquisition, acquis, dépassé) pour le compte rendu d’expérience d’élèves de 13 à 14\u00a0ans, avec des critères portant sur le protocole, les résultats et l’analyse critique. Présentez-la sous forme de tableau, avec un descripteur observable par case.*\n\nVérifiez ensuite que chaque descripteur nomme quelque chose que vous pourriez réellement constater dans le compte rendu d’un élève, et que les niveaux correspondent à vos propres attentes, pas à celles de l’outil. La structure fonctionne aussi pour les **banques de questions** (donnez l’objectif et demandez des questions de plusieurs niveaux, avec les réponses et les erreurs fréquentes) et les **corrigés types** (donnez la question et le niveau, puis comparez avec votre propre corrigé).\n\nQuoi qu’il produise, c’est un **brouillon**. Vous le vérifiez avec les quatre vérifications du module 1, et c’est vous qui décidez de ce qui arrive à vos élèves.',
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
                  title: 'Watch: AI 101 for Teachers, Demystifying AI for Educators',
                  caption:
                    'The second of the five sessions (about 30 minutes) of the free AI 101 for Teachers series by Code.org, ETS, ISTE and Khan Academy. Watch it in one or two sittings: the summary gives the key points.',
                  transcript:
                    'In short: this recorded session introduces the fundamentals of AI for teachers: what AI is, how large language models generate text, how AI is changing society and why it matters for education. Practical segments show AI tools helping with everyday teacher tasks, such as drafting an email, creating a lesson plan and writing a formative assessment. The session was recorded in 2023 and some tools have been renamed since (Google Bard is now Gemini, and Bing Chat is now Microsoft Copilot), but the techniques are unchanged: give the tool context, read its draft critically and adapt it to your class. As you watch, notice how much the usefulness of the output depends on the context in the prompt: that is the point of the five-part pattern in this lesson.',
                },
                fr: {
                  title:
                    'Regardez\u00a0: AI 101 for Teachers, démystifier l’IA pour les enseignants',
                  caption:
                    'La deuxième des cinq séances (environ 30\u00a0minutes) de la série gratuite AI 101 for Teachers de Code.org, ETS, ISTE et Khan Academy, à regarder en une ou deux fois\u00a0: le résumé en donne l’essentiel (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: cette séance enregistrée présente aux enseignants les fondamentaux de l’IA\u00a0: ce qu’est l’IA, comment les grands modèles de langage génèrent du texte, comment l’IA transforme la société et pourquoi cela concerne l’éducation. Des séquences pratiques montrent des outils d’IA qui aident à des tâches courantes d’enseignant, comme rédiger un e-mail, créer un plan de séance ou écrire une évaluation formative. La séance a été enregistrée en 2023 et certains outils ont changé de nom depuis (Google Bard s’appelle désormais Gemini, et Bing Chat, Microsoft Copilot), mais les techniques restent les mêmes\u00a0: donner du contexte à l’outil, lire son brouillon d’un œil critique et l’adapter à sa classe. En regardant, remarquez à quel point l’utilité du résultat dépend du contexte donné dans le prompt\u00a0: c’est tout l’objet de la structure en cinq parties de cette leçon.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'DosAhBSjNds',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm2-l1-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: upgrade a weak prompt',
                  body: 'Here is a prompt a colleague used:\n\n> *Make a quiz about volcanoes.*\n\nBefore reading on, write down what is missing for each of the five parts: role, task, context, format and constraints.\n\nThen compare with one possible upgrade:\n\n> *You are a geography teacher who writes clear assessment questions. Write a 10-question quiz that checks understanding of why volcanoes form at plate boundaries. The class has 28 pupils aged 12 to 13 who have just studied the structure of the Earth and the main types of plate boundary. Give 6 multiple-choice questions with 4 options each and 4 short-answer questions, then an answer key that explains each answer and names the misconception behind each wrong option. Use the vocabulary of a standard secondary programme, avoid trick questions, and include one question that asks pupils to apply the idea to a volcano they have not studied.*\n\nNotice what you would still have to do: check every answer, adjust the vocabulary to your programme and remove anything you have not taught.',
                },
                fr: {
                  heading: 'À vous\u00a0: améliorez un prompt trop vague',
                  body: 'Voici le prompt qu’un collègue a utilisé\u00a0:\n\n> *Créez un quiz sur les volcans.*\n\nAvant de lire la suite, notez ce qui manque pour chacune des cinq parties\u00a0: rôle, tâche, contexte, format et contraintes.\n\nComparez ensuite avec une amélioration possible\u00a0:\n\n> *Vous êtes un enseignant de sciences de la vie et de la Terre qui rédige des questions d’évaluation claires. Rédigez un quiz de 10\u00a0questions qui vérifie la compréhension de la formation des volcans aux limites des plaques. La classe compte 28\u00a0élèves de 12 à 13\u00a0ans qui viennent d’étudier la structure de la Terre et les principaux types de limites de plaques. Proposez 6\u00a0questions à choix multiples avec 4\u00a0options chacune et 4\u00a0questions à réponse courte, puis un corrigé qui explique chaque réponse et nomme l’idée fausse qui se cache derrière chaque mauvaise option. Utilisez le vocabulaire d’un programme standard du secondaire, évitez les questions pièges et incluez une question qui demande aux élèves d’appliquer l’idée à un volcan qu’ils n’ont pas étudié.*\n\nRemarquez ce qu’il vous resterait à faire\u00a0: vérifier chaque réponse, ajuster le vocabulaire à votre programme et retirer tout ce que vous n’avez pas enseigné.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Paste the upgraded prompt above, or a planning prompt of your own, and ask the AI tutor for feedback on its five parts. Remove any pupil names or personal details first.',
                  starterPrompt:
                    'Here is a prompt I wrote to plan a lesson. Check whether it has a clear role, task, context, format and constraints, and ask me one question that would make it more precise: [paste your prompt here]',
                },
                fr: {
                  instructions:
                    'Collez la version améliorée ci-dessus, ou l’un de vos propres prompts de préparation, et demandez au tuteur IA un retour sur ses cinq parties. Retirez d’abord tout nom d’élève ou détail personnel.',
                  starterPrompt:
                    'Voici un prompt que j’ai rédigé pour préparer une séance. Vérifiez qu’il comporte un rôle, une tâche, un contexte, un format et des contraintes clairs, et posez-moi une question qui le rendrait plus précis\u00a0: [collez votre prompt ici]',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm2-l1-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Build your own planning prompt for a lesson you will teach in the next few weeks. Use the five parts (role, task, context, format, constraints), then add one follow-up request you would send to improve the first draft. Do not include any pupil names or personal information. Then get feedback on it (open the AI tutor in Check my work mode, with no personal data, or ask a colleague) and note one change you made as a result.',
                },
                fr: {
                  prompt:
                    'Construisez votre propre prompt de préparation pour une séance que vous donnerez dans les prochaines semaines. Utilisez les cinq parties (rôle, tâche, contexte, format, contraintes), puis ajoutez une relance que vous enverriez pour améliorer le premier brouillon. N’y mettez aucun nom d’élève ni aucune information personnelle. Demandez ensuite un retour (au tuteur IA en mode «\u00a0Vérifie mon travail\u00a0», sans aucune donnée personnelle, ou à un collègue) et notez une modification que vous y avez apportée en conséquence.',
                },
              },
              data: { minLength: 250 },
            },
            {
              id: 'm2-l1-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Which part of your planning would you never hand over to an AI tool, and why?',
                },
                fr: {
                  prompt:
                    'Quelle partie de votre préparation ne confieriez-vous jamais à un outil d’IA, et pourquoi\u00a0?',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
        {
          id: 'm2-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Differentiation and adapted texts',
                summary:
                  'Use AI to draft levelled texts, scaffolds and extensions that keep the same objective, describe needs without personal data, and check that no meaning is lost.',
              },
              fr: {
                title: 'Différenciation et textes adaptés',
                summary:
                  'Utilisez l’IA pour préparer des textes de différents niveaux, des étayages et des prolongements qui gardent le même objectif, décrivez des besoins sans données personnelles et vérifiez que le sens n’est pas perdu.',
              },
            },
            estimatedMinutes: 35,
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
                  heading: 'Three classes in one room',
                  body: 'In most classes, the same text is too hard for some pupils, too easy for others, and in a second language for a few. Preparing three versions of every resource by hand is rarely possible.\n\nThis is where AI tools can save real time: drafting a simpler version of a text, a glossary, sentence starters or an extension task in seconds. It is also where they can do quiet damage: a simplified text that drops the key idea, introduces a misconception or talks down to the reader.\n\nThe principle of this lesson: **adapt the access, keep the objective**. Every version should lead to the same learning, by different routes.',
                },
                fr: {
                  heading: 'Trois classes dans une même salle',
                  body: 'Dans la plupart des classes, un même texte est trop difficile pour certains élèves, trop facile pour d’autres, et dans une langue seconde pour quelques-uns. Préparer à la main trois versions de chaque ressource est rarement possible.\n\nC’est là que les outils d’IA peuvent faire gagner un temps précieux\u00a0: préparer en quelques secondes une version simplifiée d’un texte, un glossaire, des débuts de phrases ou une tâche de prolongement. C’est aussi là qu’ils peuvent faire des dégâts discrets\u00a0: un texte simplifié qui perd l’idée clé, introduit une idée fausse ou infantilise le lecteur.\n\nLe principe de cette leçon\u00a0: **adapter l’accès, garder l’objectif**. Chaque version doit mener aux mêmes apprentissages, par des chemins différents.',
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
                  heading: 'Adapt the access, keep the objective',
                  body: '**What AI can draft well**\n\n- **Levelled versions** of a text: shorter sentences, everyday words, with the key terms kept and explained in a glossary.\n- **Scaffolds:** sentence starters, a worked example, a checklist of steps, a partly completed table.\n- **Extensions:** an open question, a counter-example to explain, a harder application of the same idea.\n- **Language support:** a bilingual glossary of key words for pupils learning in a second language (have it checked by someone who speaks that language).\n- **Accessible formats:** shorter paragraphs, numbered steps, headings, a summary at the top.\n\n**Describe needs, never pupils**\n\nWrite "a reader aged 11 who reads at the level of a typical 8-year-old" or "a pupil who has been learning French for six months", not a name, a diagnosis or the content of an individual support plan. The tool does not need to know who the pupil is to adapt a text, and that information must not leave your school.\n\n**Check every version for**\n\n1. **Meaning:** are the key concepts still there, and still correct? Simplifying is where misconceptions creep in.\n2. **Expectations:** does the more accessible version still lead to the same objective, or has the challenge disappeared?\n3. **Tone:** does it respect the reader’s age, without childish wording for teenagers?\n4. **Representation:** do the names, examples and situations reflect your pupils?\n\nAI drafts support differentiation; they do not replace your knowledge of your pupils, nor the advice of colleagues who specialise in special educational needs.',
                },
                fr: {
                  heading: 'Adapter l’accès, garder l’objectif',
                  body: '**Ce que l’IA prépare bien**\n\n- Des **versions de différents niveaux** d’un texte\u00a0: phrases plus courtes, mots courants, termes clés conservés et expliqués dans un glossaire.\n- Des **étayages**\u00a0: débuts de phrases, exemple corrigé, liste d’étapes à cocher, tableau partiellement rempli.\n- Des **prolongements**\u00a0: une question ouverte, un contre-exemple à expliquer, une application plus difficile de la même idée.\n- Une **aide linguistique**\u00a0: un glossaire bilingue des mots clés pour les élèves qui apprennent dans une langue seconde (à faire vérifier par une personne qui parle cette langue).\n- Des **formats accessibles**\u00a0: paragraphes plus courts, étapes numérotées, intertitres, résumé en tête.\n\n**Décrivez des besoins, jamais des élèves**\n\nÉcrivez «\u00a0un lecteur de 11\u00a0ans qui lit au niveau d’un enfant de 8\u00a0ans\u00a0» ou «\u00a0un élève qui apprend le français depuis six mois\u00a0», et non un nom, un diagnostic ou le contenu d’un plan d’accompagnement individuel. L’outil n’a pas besoin de savoir qui est l’élève pour adapter un texte, et ces informations ne doivent pas sortir de votre établissement.\n\n**Vérifiez chaque version**\n\n1. **Le sens\u00a0:** les notions clés sont-elles toujours là, et toujours justes\u00a0? C’est en simplifiant que les idées fausses s’installent.\n2. **Les attentes\u00a0:** la version plus accessible mène-t-elle toujours au même objectif, ou le défi a-t-il disparu\u00a0?\n3. **Le ton\u00a0:** respecte-t-il l’âge du lecteur, sans formulations enfantines pour des adolescents\u00a0?\n4. **La représentation\u00a0:** les prénoms, les exemples et les situations reflètent-ils vos élèves\u00a0?\n\nLes brouillons de l’IA soutiennent la différenciation\u00a0; ils ne remplacent ni votre connaissance de vos élèves, ni l’avis des collègues spécialisés dans les besoins éducatifs particuliers.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b3',
              type: RICH,
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Watch and observe: one text, three versions',
                  body: 'No video this time: follow this replay of a science teacher preparing a text on photosynthesis for a class of 12-year-olds. At each step, observe **what she asks**, **what the tool produces** and **what she corrects**.\n\n**Step 1.** She pastes her own 200-word text (with no information about her pupils) and asks: *"Rewrite this text for a reader aged 12 who reads at the level of a typical 9-year-old. Keep the terms photosynthesis, chlorophyll, carbon dioxide and glucose, and explain each one in a short glossary."*\n\nResult: clear and short. But one sentence now says *"Plants eat sunlight to grow."* That is a classic misconception: light provides the energy, while the plant makes its own food (glucose) from carbon dioxide and water. She rewrites the sentence herself.\n\n**Step 2.** She asks for sentence starters for pupils who find writing difficult: *"Suggest five sentence starters that help a pupil explain what a plant needs for photosynthesis, without giving the answers."*\n\nResult: four useful starters; the fifth gives the answer away (*"Plants need light, water and carbon dioxide because..."*). She deletes it.\n\n**Step 3.** She asks for an extension task: *"Write one challenging question that asks pupils to predict what happens to a plant kept in the dark for a week, and to explain why."*\n\nResult: a good question. She adds it to the original text, as an option for everyone.\n\n**What to notice:** each request described a need, not a pupil; every version kept the same objective; and the teacher read every line, catching one scientific error and one scaffold that removed the thinking.',
                },
                fr: {
                  heading: 'Observez\u00a0: un texte, trois versions',
                  body: 'Pas de vidéo cette fois\u00a0: suivez pas à pas une enseignante de sciences qui prépare un texte sur la photosynthèse pour une classe d’élèves de 12\u00a0ans. À chaque étape, observez **ce qu’elle demande**, **ce que l’outil produit** et **ce qu’elle corrige**.\n\n**Étape 1.** Elle colle son propre texte de 200\u00a0mots (sans aucune information sur ses élèves) et demande\u00a0: *«\u00a0Réécrivez ce texte pour un lecteur de 12\u00a0ans qui lit au niveau d’un enfant de 9\u00a0ans. Conservez les termes photosynthèse, chlorophylle, dioxyde de carbone et glucose, et expliquez chacun dans un court glossaire.\u00a0»*\n\nRésultat\u00a0: clair et court. Mais une phrase dit maintenant\u00a0: *«\u00a0Les plantes mangent la lumière du soleil pour grandir.\u00a0»* C’est une idée fausse classique\u00a0: la lumière fournit l’énergie, tandis que la plante fabrique elle-même sa nourriture (le glucose) à partir de dioxyde de carbone et d’eau. Elle réécrit la phrase elle-même.\n\n**Étape 2.** Elle demande des débuts de phrases pour les élèves qui ont du mal à écrire\u00a0: *«\u00a0Proposez cinq débuts de phrases qui aident un élève à expliquer ce dont une plante a besoin pour la photosynthèse, sans donner les réponses.\u00a0»*\n\nRésultat\u00a0: quatre débuts de phrases utiles\u00a0; le cinquième donne la réponse (*«\u00a0Les plantes ont besoin de lumière, d’eau et de dioxyde de carbone parce que…\u00a0»*). Elle le supprime.\n\n**Étape 3.** Elle demande une tâche de prolongement\u00a0: *«\u00a0Rédigez une question exigeante qui demande aux élèves de prédire ce qui arrive à une plante gardée une semaine dans l’obscurité, et d’expliquer pourquoi.\u00a0»*\n\nRésultat\u00a0: une bonne question. Elle l’ajoute au texte d’origine, comme option pour tous.\n\n**Ce qu’il faut remarquer\u00a0:** chaque demande décrivait un besoin, pas un élève\u00a0; chaque version gardait le même objectif\u00a0; et l’enseignante a lu chaque ligne, repérant une erreur scientifique et un étayage qui supprimait la réflexion.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: safe to paste?',
                  body: 'Decide which of these requests you could paste into a general AI tool. Write down your answer for each, then compare with the comments below.\n\n1. *"Rewrite this text for Adam, who is 10, has dyslexia and has an individual support plan."*\n2. *"Rewrite this text for a reader aged 10 who reads at the level of a typical 7-year-old. Use short sentences and a clear layout."*\n3. *"Here is my class list with each pupil’s reading level. Create a version of the text for each pupil."*\n4. *"Add a glossary of the eight key words, with a simple definition of each and its translation into Arabic."*\n\n**Comments.** Requests 2 and 4 describe needs, not people: they are safe to paste (and the Arabic translation should be checked by someone who speaks the language). Requests 1 and 3 share personal data, including sensitive information about children’s needs: rewrite them as general descriptions, like request 2.',
                },
                fr: {
                  heading: 'À vous\u00a0: peut-on coller ces demandes\u00a0?',
                  body: 'Décidez lesquelles de ces demandes vous pourriez coller dans un outil d’IA généraliste. Notez votre réponse pour chacune, puis comparez avec les commentaires ci-dessous.\n\n1. *«\u00a0Réécrivez ce texte pour Adam, 10\u00a0ans, qui est dyslexique et bénéficie d’un plan d’accompagnement individuel.\u00a0»*\n2. *«\u00a0Réécrivez ce texte pour un lecteur de 10\u00a0ans qui lit au niveau d’un enfant de 7\u00a0ans. Utilisez des phrases courtes et une mise en page claire.\u00a0»*\n3. *«\u00a0Voici la liste de ma classe avec le niveau de lecture de chaque élève. Créez une version du texte pour chacun.\u00a0»*\n4. *«\u00a0Ajoutez un glossaire des huit mots clés, avec une définition simple de chacun et sa traduction en arabe.\u00a0»*\n\n**Commentaires.** Les demandes 2 et 4 décrivent des besoins, pas des personnes\u00a0: on peut les coller sans risque (et la traduction en arabe doit être vérifiée par une personne qui parle cette langue). Les demandes 1 et 3 partagent des données personnelles, dont des informations sensibles sur les besoins d’enfants\u00a0: reformulez-les en descriptions générales, comme la demande 2.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor for an example of a writing scaffold, then judge it: does it support the pupil’s thinking, or does it do the thinking for them? Use the same judgement on the scaffolds you prepare for your own class.',
                  starterPrompt:
                    'Give me one example of sentence starters that would help a pupil aged 10 who finds writing difficult explain how a computer learns from examples, without giving the answer away.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA un exemple d’étayage pour l’écrit, puis jugez-le\u00a0: soutient-il la réflexion de l’élève, ou réfléchit-il à sa place\u00a0? Appliquez le même jugement aux étayages que vous préparez pour votre propre classe.',
                  starterPrompt:
                    'Donnez-moi un exemple de débuts de phrases qui aideraient un élève de 10\u00a0ans qui a du mal à écrire à expliquer comment un ordinateur apprend à partir d’exemples, sans lui donner la réponse.',
                },
              },
              data: { tutorMode: 'give_example', labToolId: null },
            },
            {
              id: 'm2-l2-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Plan a differentiated version of one activity for your class. Write the objective, then describe three levels of support (for example, a supported version, the core version and an extension), the prompt you would use to draft them (needs, not names), and the checks you will make before using them.',
                },
                fr: {
                  prompt:
                    'Préparez une version différenciée d’une activité pour votre classe. Notez l’objectif, puis décrivez trois niveaux d’aide (par exemple une version étayée, la version de base et un prolongement), le prompt que vous utiliseriez pour les préparer (des besoins, pas des noms) et les vérifications que vous ferez avant de les utiliser.',
                },
              },
              data: { minLength: 300 },
            },
            {
              id: 'm2-l2-b7',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro: 'Take stock of what you know about planning prompts and differentiation.',
                },
                fr: {
                  intro:
                    'Faites le point sur les prompts de préparation et sur la différenciation.',
                },
              },
              data: { quizId: 'quiz-m2' },
            },
            {
              id: 'm2-l2-b8',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'How will you make sure that the supported versions you prepare do not lower expectations for the pupils who receive them?',
                },
                fr: {
                  prompt:
                    'Comment ferez-vous pour que les versions étayées que vous préparez n’abaissent pas les attentes envers les élèves qui les reçoivent\u00a0?',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
      ],
    },
    {
      id: 'm3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Assessment and academic integrity',
            description:
              'Design tasks that still show what pupils know when AI tools are available, make the rules of AI use clear for every task, and respond fairly when you suspect undisclosed use.',
          },
          fr: {
            title: 'Évaluation et intégrité académique',
            description:
              'Concevoir des tâches qui montrent encore ce que savent les élèves quand ils ont accès à l’IA, rendre claires les règles d’usage de l’IA pour chaque tâche, et réagir équitablement face à un usage non déclaré.',
          },
        },
      },
      lessons: [
        {
          id: 'm3-l1',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Designing AI-resilient assessment',
                summary:
                  'No task is AI-proof, but many can be AI-resilient: assess the process, add moments in class and connect tasks to your pupils’ own context.',
              },
              fr: {
                title: 'Concevoir des évaluations qui résistent à l’IA',
                summary:
                  'Aucune tâche n’est à l’abri de l’IA, mais beaucoup peuvent y résister\u00a0: évaluez la démarche, prévoyez des moments en classe et reliez les tâches au contexte de vos élèves.',
              },
            },
            estimatedMinutes: 35,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm3-l1-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'The thirty-second test',
                  body: 'Take a homework task you set recently and paste it into a chatbot. If it produces, in thirty seconds, an answer that would earn a good mark, ask yourself what that task really assesses now.\n\nBanning AI does not answer the question: pupils can reach these tools at home, and some uses are legitimate and valuable. Detecting AI does not answer it either, as the next lesson shows. What works is **design**: tasks in which the evidence of learning cannot be produced by a tool on its own, and clear rules about which uses of AI are allowed.\n\nThe aim is not to catch pupils out. It is to make sure that your assessment still tells you, and them, what they have learned.',
                },
                fr: {
                  heading: 'Le test des trente secondes',
                  body: 'Prenez un devoir que vous avez donné récemment et collez-le dans un chatbot. S’il produit en trente secondes une réponse qui obtiendrait une bonne note, demandez-vous ce que ce devoir évalue réellement aujourd’hui.\n\nInterdire l’IA ne règle pas la question\u00a0: les élèves ont accès à ces outils chez eux, et certains usages sont légitimes et utiles. Détecter l’IA ne règle pas davantage la question, comme le montrera la leçon suivante. Ce qui fonctionne, c’est la **conception**\u00a0: des tâches dans lesquelles les preuves d’apprentissage ne peuvent pas être produites par un outil à lui seul, et des règles claires sur les usages de l’IA autorisés.\n\nLe but n’est pas de piéger les élèves. C’est de faire en sorte que votre évaluation vous dise encore, à vous comme à eux, ce qu’ils ont appris.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Process over product',
                  body: '**Design strategies that make tasks more resilient**\n\n- **Assess the process, not only the product.** Ask for plans, drafts, notes and a short log of decisions. Give feedback, and some of the marks, at checkpoints along the way.\n- **Bring part of the task into the classroom.** A first draft written in class, a practical, a short oral explanation of key choices ("Why did you choose this source?").\n- **Build on what only your pupils have:** a local context, data they collected, an experiment done in class, a text studied together, their own experience.\n- **Ask for judgement:** compare, critique, justify, choose between options, explain an error.\n- **Vary the format:** models, recordings, presentations, annotated diagrams, debates.\n- **Sometimes, include AI openly:** pupils critique an AI answer, improve it and explain what they changed and why.\n\n**Make the rules visible.** For each task, state which uses of AI are allowed. A simple four-level scale works well:\n\n| Level | What pupils may do with AI |\n|---|---|\n| **0. No AI** | Nothing: the task is done without AI tools, often in class. |\n| **1. Ideas** | Brainstorm or plan with AI; all the writing is their own. |\n| **2. Feedback** | Ask AI for feedback on their own draft, then revise it themselves. |\n| **3. Partner** | Use AI throughout, then critique and improve the output and document the process. |\n\nPublished frameworks such as the AI Assessment Scale (Perkins, Furze, Roe and MacVaugh, 2024) take the same approach in more detail. Whatever the level, ask pupils to **acknowledge** AI help: which tool, for what, and what they changed. And remember the age rules of module 4: an AI level only applies to tools your pupils are allowed to use.',
                },
                fr: {
                  heading: 'La démarche avant le produit',
                  body: '**Des stratégies de conception qui rendent les tâches plus résistantes**\n\n- **Évaluez la démarche, pas seulement le produit.** Demandez des plans, des brouillons, des notes et un court journal des décisions prises. Faites des retours, et attribuez une partie des points, à des étapes intermédiaires.\n- **Ramenez une partie de la tâche en classe.** Un premier jet rédigé en classe, une manipulation, une courte explication orale des choix importants («\u00a0Pourquoi avez-vous choisi cette source\u00a0?\u00a0»).\n- **Appuyez-vous sur ce que seuls vos élèves possèdent\u00a0:** un contexte local, des données qu’ils ont recueillies, une expérience menée en classe, un texte étudié ensemble, leur propre expérience.\n- **Faites appel au jugement\u00a0:** comparer, critiquer, justifier, choisir entre plusieurs options, expliquer une erreur.\n- **Variez les formats\u00a0:** maquettes, enregistrements, présentations, schémas annotés, débats.\n- **Parfois, intégrez l’IA ouvertement\u00a0:** les élèves critiquent une réponse de l’IA, l’améliorent et expliquent ce qu’ils ont changé et pourquoi.\n\n**Rendez les règles visibles.** Pour chaque tâche, indiquez quels usages de l’IA sont autorisés. Une échelle simple à quatre niveaux fonctionne bien\u00a0:\n\n| Niveau | Ce que les élèves peuvent faire avec l’IA |\n|---|---|\n| **0. Sans IA** | Rien\u00a0: la tâche se fait sans outil d’IA, souvent en classe. |\n| **1. Idées** | Chercher des idées ou faire un plan avec l’IA\u00a0; toute la rédaction est personnelle. |\n| **2. Retours** | Demander à l’IA un retour sur leur propre brouillon, puis le réviser eux-mêmes. |\n| **3. Partenaire** | Utiliser l’IA tout au long de la tâche, puis critiquer et améliorer le résultat et documenter la démarche. |\n\nDes cadres publiés, comme l’AI Assessment Scale (Perkins, Furze, Roe et MacVaugh, 2024), suivent la même approche de façon plus détaillée. Quel que soit le niveau, demandez aux élèves de **déclarer** l’aide de l’IA\u00a0: quel outil, pour quoi faire, et ce qu’ils ont modifié. Et n’oubliez pas les règles d’âge du module 4\u00a0: un niveau d’usage de l’IA ne concerne que les outils que vos élèves ont le droit d’utiliser.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b3',
              type: RICH,
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Watch and observe: one task, redesigned',
                  body: 'No video this time: follow a history teacher who redesigns a classic homework task for pupils aged 14 to 15, step by step.\n\n**Original task.** *"Write 600 words on the causes of the First World War."* A chatbot produces a good answer in seconds. The task assesses the final text, and nothing else.\n\n**Version 2: add the process.** Pupils hand in a plan based on three sources studied in class, then a draft. The teacher gives feedback on the plan in class. Part of the mark goes to the plan and to how the feedback was used.\n\n**Version 3: add judgement and context.** The question becomes: *"On which cause of the First World War do the two historians we read in class disagree most, and which argument do you find more convincing? Use at least one document from our source pack."* A generic answer no longer fits.\n\n**Version 4: add a conversation.** After handing in, each pupil has a three-minute conversation with the teacher during a lesson: *"Talk me through your strongest argument and the evidence for it."*\n\n**AI level and acknowledgement.** The teacher sets the task at level 1 (ideas): pupils may use an approved AI tool to brainstorm or test their plan, and they add a short note saying how they used it.\n\n**What to notice:** each version changed one thing, the workload stayed manageable (the conversations replace part of the marking), and pupils still learn to build a historical argument.',
                },
                fr: {
                  heading: 'Observez\u00a0: une tâche repensée',
                  body: 'Pas de vidéo cette fois\u00a0: suivez pas à pas un enseignant d’histoire qui repense un devoir classique pour des élèves de 14 à 15\u00a0ans.\n\n**Tâche d’origine.** *«\u00a0Rédigez 600\u00a0mots sur les causes de la Première Guerre mondiale.\u00a0»* Un chatbot produit une bonne réponse en quelques secondes. La tâche évalue le texte final, et rien d’autre.\n\n**Version 2\u00a0: ajouter la démarche.** Les élèves rendent un plan qui s’appuie sur trois sources étudiées en classe, puis un brouillon. L’enseignant fait un retour sur le plan en classe. Une partie de la note porte sur le plan et sur la façon dont le retour a été utilisé.\n\n**Version 3\u00a0: ajouter du jugement et du contexte.** La question devient\u00a0: *«\u00a0Sur quelle cause de la Première Guerre mondiale les deux historiens lus en classe sont-ils le plus en désaccord, et quel argument vous paraît le plus convaincant\u00a0? Utilisez au moins un document de notre dossier.\u00a0»* Une réponse générique ne convient plus.\n\n**Version 4\u00a0: ajouter un échange.** Après la remise, chaque élève a un échange de trois minutes avec l’enseignant pendant un cours\u00a0: *«\u00a0Présentez-moi votre meilleur argument et la preuve qui l’appuie.\u00a0»*\n\n**Niveau d’IA et déclaration.** L’enseignant place la tâche au niveau 1 (idées)\u00a0: les élèves peuvent utiliser un outil d’IA autorisé pour chercher des idées ou tester leur plan, et ils ajoutent une courte note expliquant comment ils l’ont utilisé.\n\n**Ce qu’il faut remarquer\u00a0:** chaque version change une seule chose, la charge de travail reste raisonnable (les échanges remplacent une partie de la correction), et les élèves apprennent toujours à construire une argumentation historique.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: how exposed is this task?',
                  body: 'For each task, decide whether a pupil could complete it convincingly with a general AI tool alone (high exposure), partly (medium) or hardly at all (low). Then compare with the comments.\n\n1. *Answer ten factual questions about the solar system at home.*\n2. *Write up the experiment we carried out in class on Tuesday, using your own measurements, and explain one source of error you noticed.*\n3. *Write a persuasive letter to the mayor about a problem in our neighbourhood, then present it to the class and answer two questions.*\n4. *Summarise chapter 3 of the class novel.*\n\n**Comments.** Tasks 1 and 4 are highly exposed: the answers are generic and widely available (and for a little-known novel, an AI summary may simply be invented, which is one more reason to check). Task 2 has low exposure: it depends on data and observations that only the pupil has, although AI could still help with the wording, which is where your AI level matters. Task 3 is medium: the letter could be generated, but the local problem, the presentation and the questions require the pupil’s own understanding.',
                },
                fr: {
                  heading: 'À vous\u00a0: cette tâche est-elle exposée\u00a0?',
                  body: 'Pour chaque tâche, décidez si un élève pourrait la réaliser de façon convaincante avec un outil d’IA généraliste seul (exposition forte), en partie (moyenne) ou presque pas (faible). Comparez ensuite avec les commentaires.\n\n1. *Répondre à la maison à dix questions factuelles sur le système solaire.*\n2. *Rédiger le compte rendu de l’expérience menée en classe mardi, avec vos propres mesures, et expliquer une source d’erreur que vous avez remarquée.*\n3. *Écrire une lettre argumentée au maire sur un problème de notre quartier, puis la présenter à la classe et répondre à deux questions.*\n4. *Résumer le chapitre 3 du roman étudié en classe.*\n\n**Commentaires.** Les tâches 1 et 4 sont très exposées\u00a0: les réponses sont génériques et largement disponibles (et pour un roman peu connu, le résumé de l’IA risque tout simplement d’être inventé\u00a0: une raison de plus de vérifier). La tâche 2 est peu exposée\u00a0: elle dépend de données et d’observations que seul l’élève possède, même si l’IA pourrait aider à la rédaction, et c’est là que votre niveau d’usage de l’IA compte. La tâche 3 est moyennement exposée\u00a0: la lettre pourrait être générée, mais le problème local, la présentation et les questions demandent une compréhension personnelle.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Describe an assessment task you set (with no information about your pupils) and ask the AI tutor for feedback on how resilient it is. Decide for yourself which suggestions fit your class.',
                  starterPrompt:
                    'Here is an assessment task I set: [describe the task, the age of the pupils and how it is marked]. Give me feedback on how easy it would be to complete with a general AI tool alone, and ask me one question that would help me redesign it.',
                },
                fr: {
                  instructions:
                    'Décrivez une tâche d’évaluation que vous donnez (sans information sur vos élèves) et demandez au tuteur IA un retour sur sa résistance à l’IA. Décidez vous-même quelles suggestions conviennent à votre classe.',
                  starterPrompt:
                    'Voici une tâche d’évaluation que je donne\u00a0: [décrivez la tâche, l’âge des élèves et la façon dont elle est notée]. Faites-moi un retour sur la facilité avec laquelle on pourrait la réaliser avec un outil d’IA généraliste seul, et posez-moi une question qui m’aiderait à la repenser.',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm3-l1-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Redesign one assessment you will set this term. Write the original task, its new version, the AI level you choose (0 to 3) and why, the evidence of process you will collect, and how you will explain the rules to your pupils.',
                },
                fr: {
                  prompt:
                    'Repensez une évaluation que vous donnerez ce trimestre. Notez la tâche d’origine, sa nouvelle version, le niveau d’usage de l’IA choisi (de 0 à 3) et pourquoi, les traces de la démarche que vous recueillerez, et la façon dont vous expliquerez les règles à vos élèves.',
                },
              },
              data: { minLength: 300 },
            },
            {
              id: 'm3-l1-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Which part of your current assessment practice already values the process over the product? What will you keep, and what will you change first?',
                },
                fr: {
                  prompt:
                    'Quelle partie de vos pratiques d’évaluation actuelles valorise déjà la démarche plutôt que le produit\u00a0? Que garderez-vous, et que changerez-vous en premier\u00a0?',
                },
              },
              data: { minLength: 100 },
            },
          ],
        },
        {
          id: 'm3-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'AI detectors, policies and fair conversations',
                summary:
                  'Why AI-writing detectors cannot prove anything, how to write a clear AI-use policy for your class, and how to respond when you suspect undisclosed AI use.',
              },
              fr: {
                title: 'Détecteurs d’IA, chartes et échanges équitables',
                summary:
                  'Pourquoi les détecteurs de texte généré par l’IA ne prouvent rien, comment rédiger une charte claire d’usage de l’IA pour votre classe, et comment réagir face à un usage non déclaré.',
              },
            },
            estimatedMinutes: 40,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm3-l2-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'What does "87% AI" mean?',
                  body: 'A colleague runs a pupil’s essay through an online detector. The result: "87% likely AI-generated". The pupil insists she wrote it alone.\n\nWhat does the number tell you? It is the output of another statistical model, estimating how much the text resembles AI-generated text. It is not a measurement of who wrote it, it comes with no evidence you can show anyone, and it is very hard for the pupil to disprove, unless drafts or a version history can show how the work was written.\n\nThis lesson explains why such tools cannot settle a case, what to rely on instead, and how a clear AI-use policy prevents most of these situations in the first place.',
                },
                fr: {
                  heading: 'Que signifie «\u00a0IA à 87\u00a0%\u00a0»\u00a0?',
                  body: 'Un collègue soumet la rédaction d’une élève à un détecteur en ligne. Résultat\u00a0: «\u00a0probablement générée par l’IA à 87\u00a0%\u00a0». L’élève affirme l’avoir écrite seule.\n\nQue vous apprend ce chiffre\u00a0? C’est le résultat d’un autre modèle statistique, qui estime à quel point le texte ressemble à un texte généré par l’IA. Il ne dit pas qui l’a écrit, ne s’accompagne d’aucune preuve que l’on puisse montrer, et l’élève peut très difficilement le contester, sauf si des brouillons ou un historique des versions montrent comment le travail a été écrit.\n\nCette leçon explique pourquoi ces outils ne permettent pas de trancher, sur quoi s’appuyer à la place, et comment une charte claire d’usage de l’IA évite d’emblée la plupart de ces situations.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Why detectors fail, and what to do instead',
                  body: '**Detectors are unreliable**\n\n- **False positives:** they flag human writing as AI-generated. Formulaic, simple or very polished writing is especially at risk.\n- **Bias:** a 2023 Stanford study (Liang and colleagues) found that seven widely used detectors classified, on average, more than half of a set of essays written in English by non-native speakers as AI-generated.\n- **False negatives:** lightly editing or paraphrasing AI text is often enough to escape detection.\n- **Even their makers struggle:** OpenAI withdrew its own AI-text classifier in 2023, citing its low accuracy.\n\nA detector score must therefore **never be the only evidence** of misconduct, and several universities have stopped using such tools altogether.\n\n**What to rely on instead**\n\n- **Your knowledge of your pupils’ work:** pieces written in class, previous work, their usual voice.\n- **The process:** plans, drafts, notes, version history.\n- **A conversation:** ask the pupil to explain their choices, define terms they used and talk you through a passage. Treat it as a learning conversation, not an interrogation.\n- **Your school’s academic honesty policy:** follow its procedure, in the same way for every pupil.\n\n**A clear class AI-use policy states**\n\n1. Which uses of AI are allowed for each task (the levels from the previous lesson).\n2. Which tools are approved, in line with the age rules.\n3. How to acknowledge AI help: the tool, the purpose, what was changed.\n4. That honest acknowledgement is never penalised.\n5. What happens if the rules are not followed, with a link to the school’s policy.\n\nWrite it with your colleagues where you can, so that pupils meet the same rules from one class to the next.',
                },
                fr: {
                  heading: 'Pourquoi les détecteurs échouent, et que faire à la place',
                  body: '**Les détecteurs ne sont pas fiables**\n\n- **Faux positifs\u00a0:** ils signalent comme générés par l’IA des textes écrits par des humains. Les écrits stéréotypés, simples ou très soignés sont particulièrement exposés.\n- **Biais\u00a0:** une étude de l’université Stanford publiée en 2023 (Liang et ses collègues) a montré que sept détecteurs très utilisés classaient en moyenne plus de la moitié d’un ensemble de rédactions écrites en anglais par des non-anglophones comme générées par l’IA.\n- **Faux négatifs\u00a0:** retoucher ou reformuler légèrement un texte produit par l’IA suffit souvent à échapper à la détection.\n- **Même leurs concepteurs peinent à les rendre fiables\u00a0:** OpenAI a retiré en 2023 son propre outil de détection de texte généré par l’IA, en invoquant son faible taux de précision.\n\nUn score de détecteur ne doit donc **jamais être la seule preuve** d’une fraude, et plusieurs universités ont cessé d’utiliser ces outils.\n\n**Sur quoi s’appuyer à la place**\n\n- **Votre connaissance du travail de vos élèves\u00a0:** des écrits réalisés en classe, les travaux précédents, leur façon habituelle d’écrire.\n- **La démarche\u00a0:** plans, brouillons, notes, historique des versions.\n- **Un échange\u00a0:** demandez à l’élève d’expliquer ses choix, de définir des termes qu’il a employés et de vous commenter un passage. Abordez-le comme un échange d’apprentissage, pas comme un interrogatoire.\n- **La politique d’intégrité académique de votre établissement\u00a0:** suivez sa procédure, de la même façon pour chaque élève.\n\n**Une charte claire d’usage de l’IA pour la classe précise**\n\n1. Les usages de l’IA autorisés pour chaque tâche (les niveaux de la leçon précédente).\n2. Les outils autorisés, dans le respect des règles d’âge.\n3. La façon de déclarer l’aide de l’IA\u00a0: l’outil, l’objectif, ce qui a été modifié.\n4. Qu’une déclaration honnête n’est jamais sanctionnée.\n5. Ce qui se passe si les règles ne sont pas respectées, avec un renvoi au règlement de l’établissement.\n\nRédigez-la si possible avec vos collègues, pour que les élèves retrouvent les mêmes règles d’une classe à l’autre.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b3',
              type: RICH,
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Watch and observe: a conversation, not an accusation',
                  body: 'No video this time: follow, step by step, how a teacher handles a suspicion.\n\n**The situation.** An essay by a pupil aged 15 is much more polished than her work in class, and it uses terms the class has not studied.\n\n**Step 1: look at the evidence available.** The teacher does not run a detector. She looks at the pupil’s plan (handed in a week earlier) and at the document’s version history: the essay appeared almost complete in one go.\n\n**Step 2: talk.** In a calm, private conversation, she asks the pupil to walk her through the essay: *"What did you mean by this term? Which part was the hardest to write?"* The pupil explains the main argument well but cannot explain two paragraphs.\n\n**Step 3: listen.** The pupil admits that she asked a chatbot to "improve" her draft and kept two of its paragraphs, without realising that this counted as AI use.\n\n**Step 4: respond under the policy.** The task was set at level 1 (ideas only). Following the school’s procedure, the teacher asks her to rewrite the two paragraphs in class, with an acknowledgement note, and records the incident as the policy requires.\n\n**Step 5: improve the system.** The teacher realises that "improve my draft" was a grey zone for the class, and adds it as an example to the class AI-use policy.\n\n**What to notice:** the evidence came from the process and the conversation, the pupil could explain herself, the response followed the policy, and the teacher treated the case as information about her own rules as well as about the pupil.',
                },
                fr: {
                  heading: 'Observez\u00a0: un échange, pas une accusation',
                  body: 'Pas de vidéo cette fois\u00a0: suivez pas à pas la façon dont une enseignante gère un soupçon.\n\n**La situation.** La rédaction d’une élève de 15\u00a0ans est beaucoup plus aboutie que ses travaux en classe, et elle emploie des termes que la classe n’a pas étudiés.\n\n**Étape 1\u00a0: examiner les éléments disponibles.** L’enseignante n’utilise pas de détecteur. Elle regarde le plan de l’élève (rendu une semaine plus tôt) et l’historique des versions du document\u00a0: la rédaction est apparue presque complète d’un seul coup.\n\n**Étape 2\u00a0: en parler.** Lors d’un échange calme et en tête-à-tête, elle demande à l’élève de lui présenter sa rédaction\u00a0: *«\u00a0Que vouliez-vous dire par ce terme\u00a0? Quelle partie a été la plus difficile à écrire\u00a0?\u00a0»* L’élève explique bien l’argument principal, mais ne parvient pas à expliquer deux paragraphes.\n\n**Étape 3\u00a0: écouter.** L’élève reconnaît avoir demandé à un chatbot d’«\u00a0améliorer\u00a0» son brouillon et en avoir gardé deux paragraphes, sans se rendre compte qu’il s’agissait d’un usage de l’IA.\n\n**Étape 4\u00a0: réagir selon la charte.** La tâche était au niveau 1 (idées seulement). Conformément à la procédure de l’établissement, l’enseignante lui demande de réécrire les deux paragraphes en classe, avec une note de déclaration, et consigne l’incident comme le prévoit le règlement.\n\n**Étape 5\u00a0: améliorer le système.** L’enseignante comprend que «\u00a0améliorer mon brouillon\u00a0» était une zone grise pour la classe, et ajoute cet exemple à la charte d’usage de l’IA de la classe.\n\n**Ce qu’il faut remarquer\u00a0:** les éléments venaient de la démarche et de l’échange, l’élève a pu s’expliquer, la réaction a suivi la charte, et l’enseignante a considéré ce cas comme une information sur ses propres règles autant que sur l’élève.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: clear rule or problem?',
                  body: 'Here are five sentences of the kind found in class AI policies. Decide which are clear and fair, and which cause problems. Then compare with the comments.\n\n1. *"Any use of AI is cheating."*\n2. *"We use an AI detector, so we will know if you cheat."*\n3. *"For this task you may use AI to find ideas, but every sentence must be your own. Add a note saying which tool you used and what for."*\n4. *"If you used AI, say so: honest acknowledgement is never penalised."*\n5. *"You may use any AI tool as long as your parents agree."*\n\n**Comments.** Sentences 3 and 4 are clear and fair: they say what is allowed and how to be honest about it. Sentence 1 is too broad (is a spell-checker AI? a translation tool?) and cannot be applied consistently. Sentence 2 relies on unreliable tools and invites false accusations. Sentence 5 ignores the age rules set in the tools’ own terms and the school’s list of approved tools.',
                },
                fr: {
                  heading: 'À vous\u00a0: règle claire ou problème\u00a0?',
                  body: 'Voici cinq phrases comme on en trouve dans les chartes d’usage de l’IA. Décidez lesquelles sont claires et équitables, et lesquelles posent problème. Comparez ensuite avec les commentaires.\n\n1. *«\u00a0Toute utilisation de l’IA est de la triche.\u00a0»*\n2. *«\u00a0Nous utilisons un détecteur d’IA, donc nous saurons si vous trichez.\u00a0»*\n3. *«\u00a0Pour cette tâche, vous pouvez utiliser l’IA pour chercher des idées, mais chaque phrase doit être de vous. Ajoutez une note indiquant l’outil utilisé et dans quel but.\u00a0»*\n4. *«\u00a0Si vous avez utilisé l’IA, dites-le\u00a0: une déclaration honnête n’est jamais sanctionnée.\u00a0»*\n5. *«\u00a0Vous pouvez utiliser n’importe quel outil d’IA, du moment que vos parents sont d’accord.\u00a0»*\n\n**Commentaires.** Les phrases 3 et 4 sont claires et équitables\u00a0: elles disent ce qui est autorisé et comment être honnête à ce sujet. La phrase 1 est trop large (un correcteur orthographique est-il de l’IA\u00a0? un outil de traduction\u00a0?) et ne peut pas être appliquée de façon cohérente. La phrase 2 repose sur des outils peu fiables et expose à de fausses accusations. La phrase 5 ignore les règles d’âge fixées par les outils eux-mêmes et la liste des outils autorisés par l’établissement.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to quiz you on detectors and fair responses, one question at a time. Answer in your own words before you read its feedback.',
                  starterPrompt:
                    'Quiz me, one question at a time, on why AI-writing detectors are unreliable and on what a fair response to suspected undisclosed AI use looks like.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA de vous interroger sur les détecteurs et sur les réactions équitables, une question à la fois. Répondez avec vos propres mots avant de lire son retour.',
                  starterPrompt:
                    'Interrogez-moi, une question à la fois, sur les raisons pour lesquelles les détecteurs de texte généré par l’IA ne sont pas fiables et sur ce qu’est une réaction équitable face à un usage non déclaré de l’IA.',
                },
              },
              data: { tutorMode: 'quiz_me', labToolId: null },
            },
            {
              id: 'm3-l2-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Draft the AI-use policy you will share with one of your classes. Say what is allowed and what is not, which tools pupils may use, how they acknowledge AI help, and what happens if the rules are not followed. Write it in words your pupils will understand. Then get feedback on it (open the AI tutor in Check my work mode, with no personal data, or ask a colleague) and note one change you made as a result.',
                },
                fr: {
                  prompt:
                    'Rédigez la charte d’usage de l’IA que vous partagerez avec l’une de vos classes. Indiquez ce qui est autorisé et ce qui ne l’est pas, quels outils les élèves peuvent utiliser, comment ils déclarent l’aide de l’IA et ce qui se passe si les règles ne sont pas respectées. Écrivez-la avec des mots que vos élèves comprendront. Demandez ensuite un retour (au tuteur IA en mode «\u00a0Vérifie mon travail\u00a0», sans aucune donnée personnelle, ou à un collègue) et notez une modification que vous y avez apportée en conséquence.',
                },
              },
              data: { minLength: 300 },
            },
            {
              id: 'm3-l2-b7',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Check your understanding of AI-resilient assessment, AI detectors and AI-use policies.',
                },
                fr: {
                  intro:
                    'Vérifiez votre compréhension des évaluations qui résistent à l’IA, des détecteurs et des chartes d’usage.',
                },
              },
              data: { quizId: 'quiz-m3' },
            },
            {
              id: 'm3-l2-b8',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Think of a time you doubted that a piece of work was really a pupil’s own. What did you base your judgement on, and what would you do differently after this lesson? Describe the situation without naming or identifying the pupil.',
                },
                fr: {
                  prompt:
                    'Repensez à une fois où vous avez douté qu’un travail soit vraiment celui d’un élève. Sur quoi avez-vous fondé votre jugement, et que feriez-vous différemment après cette leçon\u00a0? Décrivez la situation sans nommer ni permettre d’identifier l’élève.',
                },
              },
              data: { minLength: 100 },
            },
          ],
        },
      ],
    },
    {
      id: 'm4',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Safe and effective AI in the classroom',
            description:
              'Privacy, age rules and safeguarding when you and your pupils use AI tools, then how to plan age-appropriate, project-based AI activities for pupils aged 8 to 18.',
          },
          fr: {
            title: 'Une IA sûre et utile en classe',
            description:
              'La protection des données, les règles d’âge et la protection de l’enfance quand vous et vos élèves utilisez des outils d’IA, puis la conception d’activités d’IA adaptées à l’âge et fondées sur des projets pour des élèves de 8 à 18\u00a0ans.',
          },
        },
      },
      lessons: [
        {
          id: 'm4-l1',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Privacy, age rules and safeguarding',
                summary:
                  'What must never go into a prompt, which age rules apply to AI tools, and how to respond when AI is part of a safeguarding concern.',
              },
              fr: {
                title: 'Données personnelles, règles d’âge et protection de l’enfance',
                summary:
                  'Ce qui ne doit jamais figurer dans un prompt, les règles d’âge qui s’appliquent aux outils d’IA, et comment réagir quand l’IA joue un rôle dans un problème de protection de l’enfance.',
              },
            },
            estimatedMinutes: 75,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm4-l1-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'What is in this prompt?',
                  body: 'It is report season, and a tired colleague types this into a free chatbot (the pupil is fictional):\n\n> *Write a report comment for Lina Haddad, 9, in class 4B. She struggles with reading and has been anxious since her parents separated. Her mother asked us to be gentle.*\n\nCount the personal data: a full name, an age, a class, a learning difficulty, a family situation, an observation about her mental health and a request from a parent. All of it about a child, and all of it now sent to, and possibly stored by, a company with which the school has no agreement.\n\nNone of it was needed. This lesson covers what must stay out of prompts, the age rules that apply to AI tools, and what to do when AI is part of a safeguarding concern.',
                },
                fr: {
                  heading: 'Que contient ce prompt\u00a0?',
                  body: 'C’est la période des bulletins, et un collègue fatigué tape ceci dans un chatbot gratuit (l’élève est fictive)\u00a0:\n\n> *Rédigez une appréciation pour Lina Haddad, 9\u00a0ans, en CM1 B. Elle a des difficultés en lecture et elle est anxieuse depuis la séparation de ses parents. Sa mère nous a demandé d’être bienveillants.*\n\nComptez les données personnelles\u00a0: un nom complet, un âge, une classe, une difficulté d’apprentissage, une situation familiale, une observation sur sa santé psychologique et une demande d’un parent. Toutes concernent une enfant, et toutes ont désormais été envoyées à une entreprise avec laquelle l’établissement n’a aucun accord, et qui peut les conserver.\n\nAucune n’était nécessaire. Cette leçon présente ce qui doit rester en dehors des prompts, les règles d’âge qui s’appliquent aux outils d’IA, et ce qu’il faut faire quand l’IA joue un rôle dans un problème de protection de l’enfance.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l1-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Three sets of rules',
                  body: '### 1. Keep personal data out of prompts\n\nPersonal data is any information that identifies a pupil, or could identify them when combined with other information: names, photos, voice recordings, dates of birth, addresses, marks and reports, special educational needs, health, behaviour and family information. Some of it, such as health and special needs, is especially sensitive.\n\n- Use **placeholders** ("[Pupil]") and general descriptions of needs.\n- Use only tools your school has **approved**. Approval usually means the school has checked where data is stored, how long it is kept and whether it is used to train models, and has a contract with the provider.\n- Do not upload pupils’ work to an unapproved tool, even without their names, including for marking: it can contain personal information, it is the pupil’s own work, and the tool may use it to train its models. With an approved tool, remove names and identifying details first.\n- Even with an approved tool, share only what the task needs.\n\n### 2. Respect the age rules\n\n- Every AI service sets a **minimum age** in its terms of use. Many set it at 13, some at 18, and several require parental permission for minors. Check the current terms of every tool before using it with a class.\n- Data-protection laws add their own rules for children, such as the GDPR in Europe and COPPA in the United States; your school’s policy translates them for your context.\n- With younger pupils, use only tools designed and approved for their age, or demonstrate a tool yourself on the class screen. On RoboHolic AI, for example, accounts for pupils under 13 can exist only inside a school.\n- Tell parents how AI is used in your class, and follow your school’s rules on consent.\n\n### 3. Know the safeguarding risks\n\n- **Harmful or inappropriate content** produced by AI tools, especially tools without filters for children.\n- **Fake images, audio and video** of real people, including pupils and staff. AI-generated sexual images of children are illegal in many countries and are always a safeguarding matter.\n- **Over-reliance and attachment:** some pupils confide in chatbots or "AI companions" as if they were friends. A chatbot is not a person and not a counsellor; make sure pupils know which trusted adults they can turn to.\n- **Scams and impersonation**, such as cloned voices or convincing fake messages.\n\nWhen a concern involves AI, **follow your school’s safeguarding procedure** and report it to your school’s designated safeguarding (child-protection) lead, as for any other concern. Never copy, forward or save a harmful image, and do not ask pupils to send it to you.',
                },
                fr: {
                  heading: 'Trois ensembles de règles',
                  body: '### 1. Garder les données personnelles hors des prompts\n\nUne donnée personnelle est une information qui identifie un élève, ou qui pourrait l’identifier une fois combinée à d’autres\u00a0: noms, photos, enregistrements de voix, dates de naissance, adresses, notes et bulletins, besoins éducatifs particuliers, informations de santé, de comportement ou de famille. Certaines, comme la santé et les besoins particuliers, sont particulièrement sensibles.\n\n- Utilisez des **marqueurs** à remplacer («\u00a0[Élève]\u00a0») et des descriptions générales des besoins.\n- N’utilisez que des outils **autorisés** par votre établissement. En général, cela signifie que l’établissement a vérifié où les données sont stockées, combien de temps elles sont conservées et si elles servent à entraîner des modèles, et qu’il a passé un contrat avec le fournisseur.\n- Ne déposez pas de travaux d’élèves dans un outil non autorisé, même sans leur nom, y compris pour les corriger\u00a0: ils peuvent contenir des informations personnelles, ils appartiennent à leurs auteurs et l’outil peut s’en servir pour entraîner ses modèles. Avec un outil autorisé, retirez d’abord les noms et tout élément qui permettrait d’identifier un élève.\n- Même avec un outil autorisé, ne partagez que ce dont la tâche a besoin.\n\n### 2. Respecter les règles d’âge\n\n- Chaque service d’IA fixe un **âge minimum** dans ses conditions d’utilisation. Beaucoup le fixent à 13\u00a0ans, certains à 18\u00a0ans, et plusieurs exigent l’autorisation des parents pour les mineurs. Vérifiez les conditions en vigueur de chaque outil avant de l’utiliser avec une classe.\n- Les lois sur la protection des données ajoutent leurs propres règles pour les enfants, comme le RGPD en Europe ou la loi COPPA aux États-Unis\u00a0; la politique de votre établissement les traduit pour votre contexte.\n- Avec les plus jeunes, n’utilisez que des outils conçus et autorisés pour leur âge, ou faites vous-même la démonstration d’un outil sur l’écran de la classe. Sur RoboHolic AI, par exemple, les comptes des élèves de moins de 13\u00a0ans ne peuvent exister qu’au sein d’un établissement.\n- Informez les parents de l’usage de l’IA dans votre classe, et respectez les règles de votre établissement en matière de consentement.\n\n### 3. Connaître les risques pour la protection de l’enfance\n\n- Des **contenus nuisibles ou inadaptés** produits par des outils d’IA, en particulier par des outils sans filtres pour les enfants.\n- Des **images, sons et vidéos truqués** de personnes réelles, élèves et personnels compris. Les images sexuelles d’enfants générées par l’IA sont illégales dans de nombreux pays et relèvent toujours de la protection de l’enfance.\n- La **dépendance et l’attachement**\u00a0: certains élèves se confient à des chatbots ou à des «\u00a0compagnons IA\u00a0» comme à des amis. Un chatbot n’est ni une personne ni un conseiller\u00a0; assurez-vous que les élèves savent vers quels adultes de confiance se tourner.\n- Les **arnaques et usurpations d’identité**, comme les voix clonées ou les faux messages convaincants.\n\nQuand un problème implique l’IA, **suivez la procédure de protection de l’enfance de votre établissement** et signalez-le à la personne qui en a la charge, comme pour tout autre problème. Ne copiez, ne transférez et n’enregistrez jamais une image préjudiciable, et ne demandez pas aux élèves de vous l’envoyer.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l1-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: AI 101 for Teachers, Ensuring a Responsible Approach to AI',
                  caption:
                    'The fourth session (about 40 minutes) of the free AI 101 for Teachers series by Code.org, ETS, ISTE and Khan Academy. Watch it in parts if you prefer: the summary gives the key points.',
                  transcript:
                    'In short: this session is about using AI responsibly in schools and protecting pupils. It looks at three risks that teachers meet in AI output (misinformation, bias and threats to data privacy), how to recognise them and how to respond. It shares concrete strategies, resources and real-world examples for creating a safe learning environment in which pupils can explore AI, including its potential biases and the ethical questions it raises, and for modelling responsible use in front of the class. Recorded in 2023, it predates some current tools, but its principles match this lesson: protect pupils’ data, check what AI produces, and show pupils what responsible use looks like.',
                },
                fr: {
                  title:
                    'Regardez\u00a0: AI 101 for Teachers, adopter une approche responsable de l’IA',
                  caption:
                    'La quatrième séance (environ 40\u00a0minutes) de la série gratuite AI 101 for Teachers de Code.org, ETS, ISTE et Khan Academy. Regardez-la en plusieurs fois si vous le souhaitez\u00a0: le résumé en donne l’essentiel (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: cette séance porte sur l’usage responsable de l’IA à l’école et sur la protection des élèves. Elle examine trois risques que les enseignants rencontrent dans les résultats de l’IA (la désinformation, les biais et les atteintes à la confidentialité des données), comment les reconnaître et comment y réagir. Elle propose des stratégies concrètes, des ressources et des exemples réels pour créer un environnement d’apprentissage sûr dans lequel les élèves peuvent explorer l’IA, y compris ses biais potentiels et les questions éthiques qu’elle soulève, et pour montrer en classe ce qu’est un usage responsable. Enregistrée en 2023, elle précède certains outils actuels, mais ses principes rejoignent ceux de cette leçon\u00a0: protéger les données des élèves, vérifier ce que produit l’IA, et montrer aux élèves ce qu’est un usage responsable.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'P14XpLzaEac',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm4-l1-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: make the prompt safe',
                  body: 'Rewrite the report-comment prompt from the start of this lesson so that it contains no personal data and still produces a useful draft. Then compare with one possible version:\n\n> *Write three short report-comment templates (about 50 words each) for a pupil aged 9 who is making steady progress in reading but needs more practice with fluency. Use [Pupil] as a placeholder for the name. Warm, specific and encouraging tone, with one concrete next step.*\n\nNotice what disappeared: the name, the class, the family situation, the pupil’s anxiety and the parent’s request. The family situation and the pupil’s wellbeing are not for an AI tool at all: they belong in your conversations with the family and, where needed, with your school’s pastoral or safeguarding staff. You add the name yourself, in your school’s own system.',
                },
                fr: {
                  heading: 'À vous\u00a0: rendez le prompt sûr',
                  body: 'Réécrivez le prompt d’appréciation du début de cette leçon pour qu’il ne contienne aucune donnée personnelle tout en produisant un brouillon utile. Comparez ensuite avec une version possible\u00a0:\n\n> *Rédigez trois modèles d’appréciation courts (une cinquantaine de mots chacun) pour un élève de 9\u00a0ans qui progresse régulièrement en lecture mais a besoin de s’entraîner davantage à la fluidité. Utilisez [Élève] à la place du prénom. Ton chaleureux, précis et encourageant, avec une piste de progrès concrète.*\n\nRemarquez ce qui a disparu\u00a0: le nom, la classe, la situation familiale, l’anxiété de l’élève et la demande du parent. La situation familiale et le bien-être de l’élève ne regardent en rien un outil d’IA\u00a0: ils relèvent de vos échanges avec la famille et, si nécessaire, avec l’équipe de vie scolaire ou de protection de l’enfance de votre établissement. Vous ajoutez le prénom vous-même, dans l’outil de votre établissement.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to explain what counts as personal data in a school, with examples that are less obvious than a name. Then compare its examples with your school’s data-protection policy.',
                  starterPrompt:
                    'Explain what counts as personal data in a school, with three examples that are less obvious than a pupil’s name.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA d’expliquer ce qui constitue une donnée personnelle dans un établissement scolaire, avec des exemples moins évidents qu’un nom. Comparez ensuite ses exemples avec la politique de protection des données de votre établissement.',
                  starterPrompt:
                    'Expliquez-moi ce qui constitue une donnée personnelle dans un établissement scolaire, avec trois exemples moins évidents que le nom d’un élève.',
                },
              },
              data: { tutorMode: 'explain', labToolId: null },
            },
            {
              id: 'm4-l1-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Write a short checklist (five to eight points) for using AI tools with your class. Cover the approved tools and their age rules, what pupils must never type, how you will supervise, how parents are informed and how a pupil or a colleague reports a concern. Base it on your school’s policies, and note which role in your school you would ask to check it.',
                },
                fr: {
                  prompt:
                    'Rédigez une courte liste de vérification (cinq à huit points) pour utiliser des outils d’IA avec votre classe. Abordez les outils autorisés et leurs règles d’âge, ce que les élèves ne doivent jamais taper, la façon dont vous assurerez la supervision, l’information des parents et la manière dont un élève ou un collègue signale un problème. Appuyez-vous sur les règles de votre établissement, et notez la fonction de la personne de votre établissement à qui vous demanderiez de la relire.',
                },
              },
              data: { minLength: 300 },
            },
            {
              id: 'm4-l1-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Which roles in your school are responsible for safeguarding and for data protection? Write down one question about AI that you will ask them this month.',
                },
                fr: {
                  prompt:
                    'Quelles fonctions sont responsables de la protection de l’enfance et de la protection des données dans votre établissement\u00a0? Notez une question sur l’IA que vous leur poserez ce mois-ci.',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
        {
          id: 'm4-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Running classroom AI activities',
                summary:
                  'Age-appropriate AI activities for pupils aged 8 to 18, built on the project cycle: learn, try, build, get feedback, improve, show.',
              },
              fr: {
                title: 'Mener des activités d’IA en classe',
                summary:
                  'Des activités d’IA adaptées à l’âge des élèves de 8 à 18\u00a0ans, construites sur le cycle de projet\u00a0: apprendre, essayer, construire, recevoir un retour, améliorer, montrer.',
              },
            },
            estimatedMinutes: 65,
            xpReward: 50,
          },
          blocks: [
            {
              id: 'm4-l2-b1',
              type: RICH,
              stage: 'discover',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'From worksheet to project',
                  body: 'Two classes learn about AI. In the first, pupils read a worksheet on "the dangers of AI" and answer questions. In the second, they train a simple image classifier on drawings they made, discover that it fails on drawings by another class, work out why, improve their data and present what they learned about bias.\n\nBoth classes covered bias. Only one will remember it.\n\nRoboHolic AI is built on a project cycle: **LEARN → TRY → BUILD → GET FEEDBACK → IMPROVE → SHOW YOUR PROJECT**. This lesson shows how to use the same cycle for your own AI activities, at the right level for pupils aged 8 to 18.',
                },
                fr: {
                  heading: 'De la fiche d’exercices au projet',
                  body: 'Deux classes découvrent l’IA. Dans la première, les élèves lisent une fiche sur «\u00a0les dangers de l’IA\u00a0» et répondent à des questions. Dans la seconde, ils entraînent un classificateur d’images simple sur des dessins qu’ils ont réalisés, découvrent qu’il échoue sur les dessins d’une autre classe, cherchent pourquoi, améliorent leurs données et présentent ce qu’ils ont appris sur les biais.\n\nLes deux classes ont abordé les biais. Une seule s’en souviendra.\n\nRoboHolic AI repose sur un cycle de projet\u00a0: **APPRENDRE → ESSAYER → CONSTRUIRE → RECEVOIR UN RETOUR → AMÉLIORER → MONTRER SON PROJET**. Cette leçon montre comment utiliser ce même cycle pour vos propres activités d’IA, au bon niveau pour des élèves de 8 à 18\u00a0ans.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l2-b2',
              type: RICH,
              stage: 'learn',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Match the activity to the age, and the cycle to the activity',
                  body: '**Teaching about AI and teaching with AI.** Pupils learn *about* AI when they study how it works, where it fails and how it affects society. They learn *with* AI when a tool supports a task. The best activities do both: pupils use a tool, then reflect on what it did.\n\n| Ages | What works | Keep in mind |\n|---|---|---|\n| **8 to 10** | Unplugged activities (sorting cards to "train" a classmate), teacher-led demonstrations on the class screen, simple classifiers trained on drawings, stories about what AI can and cannot do | Pupils do not need their own accounts on AI services: the teacher operates any tool. Focus on "AI learns from examples" and "AI can be wrong". |\n| **11 to 14** | Guided prompting tasks with an approved tool, comparing and checking AI answers, creative projects with a prompt log, simple investigations of bias | Check the age rules of every tool. Set an AI level for each task and teach pupils to acknowledge AI help. |\n| **15 to 18** | Evaluating AI tools, building small models or chatbots, debates on AI in society, projects in which pupils critique and improve AI output | More independence, with clear rules on data and acknowledgement. Ask for evidence and critical judgement. |\n\n**The project cycle in an AI activity** (an example for ages 11 to 14: a poster on reducing waste at school)\n\n1. **Learn:** a short input on how image generators work and why they reproduce stereotypes.\n2. **Try:** pupils write three prompts for the same image, using a school-approved image generator that allows their age (for pupils under 13, the teacher types their prompts on the class screen), and compare the results, noting what changed.\n3. **Build:** they plan the poster themselves, generate the images under the same conditions or draw them, and keep a prompt log.\n4. **Get feedback:** from the teacher and from a classmate, against the success criteria.\n5. **Improve:** they revise the poster and explain one change they made because of the feedback.\n6. **Show:** they present it to the class or the school, with a line crediting AI help, and with no personal information or photos of pupils.\n\nThroughout, pupils remain the authors: AI is a tool they direct, check and credit.',
                },
                fr: {
                  heading: 'Adapter l’activité à l’âge, et le cycle à l’activité',
                  body: '**Enseigner l’IA et enseigner avec l’IA.** L’IA est un *objet* d’apprentissage quand les élèves étudient son fonctionnement, ses défaillances et ses effets sur la société\u00a0; elle est un *outil* d’apprentissage quand elle les aide dans une tâche. Les meilleures activités font les deux\u00a0: les élèves utilisent un outil, puis réfléchissent à ce qu’il a fait.\n\n| Âges | Ce qui fonctionne | À garder en tête |\n|---|---|---|\n| **8 à 10\u00a0ans** | Activités débranchées (trier des cartes pour «\u00a0entraîner\u00a0» un camarade), démonstrations menées par l’enseignant sur l’écran de la classe, classificateurs simples entraînés sur des dessins, histoires sur ce que l’IA sait faire ou non | Les élèves n’ont pas besoin de leurs propres comptes sur des services d’IA\u00a0: c’est l’enseignant qui manipule les outils. Insistez sur «\u00a0l’IA apprend à partir d’exemples\u00a0» et «\u00a0l’IA peut se tromper\u00a0». |\n| **11 à 14\u00a0ans** | Tâches guidées de rédaction de prompts avec un outil autorisé, comparaison et vérification de réponses de l’IA, projets créatifs avec un journal de prompts, enquêtes simples sur les biais | Vérifiez les règles d’âge de chaque outil. Fixez un niveau d’usage de l’IA pour chaque tâche et apprenez aux élèves à déclarer l’aide de l’IA. |\n| **15 à 18\u00a0ans** | Évaluation d’outils d’IA, construction de petits modèles ou de chatbots, débats sur l’IA dans la société, projets où les élèves critiquent et améliorent les résultats de l’IA | Plus d’autonomie, avec des règles claires sur les données et la déclaration. Exigez des preuves et un jugement critique. |\n\n**Le cycle de projet dans une activité d’IA** (un exemple pour les 11 à 14\u00a0ans\u00a0: une affiche sur la réduction des déchets à l’école)\n\n1. **Apprendre\u00a0:** un court apport sur le fonctionnement des générateurs d’images et sur la raison pour laquelle ils reproduisent des stéréotypes.\n2. **Essayer\u00a0:** les élèves écrivent trois prompts pour la même image, avec un générateur d’images autorisé par l’établissement et permis à leur âge (pour les moins de 13\u00a0ans, l’enseignant saisit leurs prompts sur l’écran de la classe), et comparent les résultats, en notant ce qui a changé.\n3. **Construire\u00a0:** ils conçoivent eux-mêmes l’affiche, génèrent les images dans les mêmes conditions ou les dessinent, et tiennent un journal de prompts.\n4. **Recevoir un retour\u00a0:** de l’enseignant et d’un camarade, au regard des critères de réussite.\n5. **Améliorer\u00a0:** ils révisent l’affiche et expliquent une modification faite grâce aux retours.\n6. **Montrer son projet\u00a0:** ils la présentent à la classe ou à l’établissement, avec une ligne qui mentionne l’aide de l’IA, et sans information personnelle ni photo d’élève.\n\nDu début à la fin, les élèves restent les auteurs\u00a0: l’IA est un outil qu’ils dirigent, vérifient et citent.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l2-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: AI 101 for Teachers, Bringing AI to the Classroom',
                  caption:
                    'The final session (about 30 minutes) of the free AI 101 for Teachers series by Code.org, ETS, ISTE and Khan Academy.',
                  transcript:
                    'In short: this session distinguishes teaching with AI, as a tool, from teaching about AI, as a subject. It looks at how to evaluate and use AI tools designed for education, and at ways in which AI can support assessment. It also presents free, hands-on classroom activities, such as Code.org’s exercise in which pupils train a model to recognise fish, which introduces the basics of machine learning: a model learns from labelled examples, and the examples it is given shape what it does. As you watch, think about which activities would suit the age of your pupils, and where they would fit in the cycle of learn, try, build, get feedback, improve and show.',
                },
                fr: {
                  title: 'Regardez\u00a0: AI 101 for Teachers, faire entrer l’IA dans la classe',
                  caption:
                    'La dernière séance (environ 30\u00a0minutes) de la série gratuite AI 101 for Teachers de Code.org, ETS, ISTE et Khan Academy (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: cette séance distingue l’enseignement avec l’IA, utilisée comme un outil, de l’enseignement de l’IA, prise comme objet d’étude. Elle s’intéresse à la manière d’évaluer et d’utiliser les outils d’IA conçus pour l’éducation, et aux façons dont l’IA peut soutenir l’évaluation. Elle présente aussi des activités pratiques et gratuites pour la classe, comme l’exercice de Code.org dans lequel les élèves entraînent un modèle à reconnaître des poissons, qui introduit les bases de l’apprentissage automatique\u00a0: un modèle apprend à partir d’exemples étiquetés, et les exemples qu’on lui donne déterminent ce qu’il fait. En regardant, demandez-vous quelles activités conviendraient à l’âge de vos élèves, et où elles prendraient place dans le cycle apprendre, essayer, construire, recevoir un retour, améliorer, montrer.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'BBO8-Y65eYc',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm4-l2-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: which age band?',
                  body: 'Match each activity to the age band it suits best (8 to 10, 11 to 14 or 15 to 18), and note one safety condition for each. Then compare with the comments.\n\n1. Pupils compare how two chatbots answer the same history question and write a short evaluation of their accuracy and bias.\n2. The teacher uses an image generator on the class screen; pupils suggest words for the prompt and discuss why the pictures look the way they do.\n3. Pupils write and refine prompts for a short story with an approved tool, keep a prompt log and add an AI acknowledgement at the end.\n4. Pupils sort picture cards into "cat" and "not a cat" to work out how a computer could learn the difference.\n\n**Comments.** Activities 2 and 4 suit ages 8 to 10: in activity 2 the teacher operates the tool, and activity 4 is unplugged. Activity 3 suits ages 11 to 14, with an approved tool suitable for their age and a clear AI level. Activity 1 suits ages 15 to 18, provided the tools’ age rules are met and pupils type no personal data. Many activities can be adapted up or down: the safety conditions change more than the ideas do.',
                },
                fr: {
                  heading: 'À vous\u00a0: quelle tranche d’âge\u00a0?',
                  body: 'Associez chaque activité à la tranche d’âge qui lui convient le mieux (8 à 10\u00a0ans, 11 à 14\u00a0ans ou 15 à 18\u00a0ans), et notez une condition de sécurité pour chacune. Comparez ensuite avec les commentaires.\n\n1. Les élèves comparent les réponses de deux chatbots à la même question d’histoire et rédigent une courte évaluation de leur exactitude et de leurs biais.\n2. L’enseignant utilise un générateur d’images sur l’écran de la classe\u00a0; les élèves proposent des mots pour le prompt et se demandent pourquoi les images ont cet aspect.\n3. Les élèves rédigent et affinent des prompts pour une histoire courte avec un outil autorisé, tiennent un journal de prompts et ajoutent à la fin une déclaration d’usage de l’IA.\n4. Les élèves trient des cartes illustrées en «\u00a0chat\u00a0» et «\u00a0pas un chat\u00a0» pour comprendre comment un ordinateur pourrait apprendre à faire la différence.\n\n**Commentaires.** Les activités 2 et 4 conviennent aux 8 à 10\u00a0ans\u00a0: dans l’activité 2, c’est l’enseignant qui manipule l’outil, et l’activité 4 est débranchée. L’activité 3 convient aux 11 à 14\u00a0ans, avec un outil autorisé adapté à leur âge et un niveau d’usage de l’IA clair. L’activité 1 convient aux 15 à 18\u00a0ans, à condition que les règles d’âge des outils soient respectées et que les élèves ne saisissent aucune donnée personnelle. Beaucoup d’activités peuvent être adaptées vers le haut ou vers le bas\u00a0: ce sont les conditions de sécurité qui changent, plus que les idées.',
                },
              },
              data: {},
            },
            {
              id: 'm4-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor for an example of an unplugged activity that shows how a computer learns from examples, then adapt it to your own class.',
                  starterPrompt:
                    'Give me one example of an unplugged classroom activity, with no computers, that shows pupils aged 8 to 10 how a computer learns from examples.',
                },
                fr: {
                  instructions:
                    'Demandez au tuteur IA un exemple d’activité débranchée qui montre comment un ordinateur apprend à partir d’exemples, puis adaptez-la à votre propre classe.',
                  starterPrompt:
                    'Donnez-moi un exemple d’activité débranchée, sans ordinateur, qui montre à des élèves de 8 à 10\u00a0ans comment un ordinateur apprend à partir d’exemples.',
                },
              },
              data: { tutorMode: 'give_example', labToolId: null },
            },
            {
              id: 'm4-l2-b6',
              type: 'reflection',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Plan one AI activity for a class you teach, using the six steps of the cycle: learn, try, build, get feedback, improve, show. For each step, write what pupils do and which tool they use, if any. Then add the age of the pupils, the AI level and how pupils will acknowledge AI help, the safety rules you will apply (approved tools, age rules, no personal data) and how pupils will show their work. Then get feedback on your plan (open the AI tutor in Check my work mode, with no personal data, or ask a colleague), note one change you made as a result, and say with whom you will share the finished plan.',
                },
                fr: {
                  prompt:
                    'Concevez une activité d’IA pour l’une de vos classes en suivant les six étapes du cycle\u00a0: apprendre, essayer, construire, recevoir un retour, améliorer, montrer. Pour chaque étape, notez ce que font les élèves et quel outil ils utilisent, le cas échéant. Ajoutez ensuite l’âge des élèves, le niveau d’usage de l’IA et la façon dont les élèves déclareront l’aide de l’IA, les règles de sécurité que vous appliquerez (outils autorisés, règles d’âge, aucune donnée personnelle) et la façon dont les élèves montreront leur travail. Demandez ensuite un retour sur votre plan (au tuteur IA en mode «\u00a0Vérifie mon travail\u00a0», sans aucune donnée personnelle, ou à un collègue), notez une modification que vous y avez apportée en conséquence, et indiquez avec qui vous partagerez la version finale.',
                },
              },
              data: { minLength: 500 },
            },
            {
              id: 'm4-l2-b7',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'A final check on privacy, age rules, safeguarding and classroom activities.',
                },
                fr: {
                  intro:
                    'Un dernier point sur la protection des données, les règles d’âge, la protection de l’enfance et les activités en classe.',
                },
              },
              data: { quizId: 'quiz-m4' },
            },
            {
              id: 'm4-l2-b8',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'What is the first step you will take in the coming month to bring what you learned in this course into your classroom, and who in your school will you share it with?',
                },
                fr: {
                  prompt:
                    'Quelle première étape franchirez-vous dans le mois qui vient pour faire entrer ce que vous avez appris dans votre classe, et avec qui la partagerez-vous dans votre établissement\u00a0?',
                },
              },
              data: { minLength: 100 },
            },
          ],
        },
      ],
    },
    m5.module,
    m6.module,
  ],

  quizzes: [
    {
      id: 'quiz-m1',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: generative AI essentials',
            instructions: 'Five questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: l’essentiel de l’IA générative',
            instructions:
              'Cinq questions. Il faut 70\u00a0% pour réussir, et vous pouvez réessayer.',
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
              en: {
                prompt:
                  'A large language model answers a question about the French Revolution. What is it doing?',
              },
              fr: {
                prompt:
                  'Un grand modèle de langage répond à une question sur la Révolution française. Que fait-il\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Looking up the answer in a database of verified facts' },
                  fr: { text: 'Il cherche la réponse dans une base de faits vérifiés' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Generating a likely continuation of the text, based on patterns learned from its training data',
                  },
                  fr: {
                    text: 'Il génère une suite de texte probable, à partir des régularités apprises dans ses données d’entraînement',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Reasoning about the question as a historian would, from understanding and experience',
                  },
                  fr: {
                    text: 'Il raisonne sur la question comme le ferait un historien, à partir de sa compréhension et de son expérience',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Copying the most visited web page on the topic' },
                  fr: { text: 'Il recopie la page web la plus consultée sur le sujet' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A language model generates text by predicting likely continuations. It does not consult verified facts or understand the question, which is why a fluent answer can still be wrong.',
              },
              fr: {
                text: 'Un modèle de langage génère du texte en prédisant des suites probables. Il ne consulte pas de faits vérifiés et ne comprend pas la question\u00a0: c’est pourquoi une réponse fluide peut quand même être fausse.',
              },
            },
          },
          {
            id: 'q2',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'If an AI answer is written confidently and includes a reference, you can assume that it is accurate.',
              },
              fr: {
                prompt:
                  'Si une réponse de l’IA est rédigée avec assurance et cite une référence, on peut supposer qu’elle est exacte.',
              },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'False. The tone is just as confident when the answer is wrong, and references can be invented. Check that a reference exists and that it says what is claimed.',
              },
              fr: {
                text: 'Faux. Le ton est tout aussi assuré quand la réponse est fausse, et les références peuvent être inventées. Vérifiez qu’une référence existe et qu’elle dit bien ce qu’on lui fait dire.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'In the water-cycle text of the activity "Try it: spot the problems", which sentences needed correcting or checking? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Dans le texte sur le cycle de l’eau de l’activité «\u00a0À vous\u00a0: repérez les problèmes\u00a0», quelles phrases fallait-il corriger ou vérifier\u00a0? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: '(1) Water only evaporates when it reaches 100\u00a0°C.' },
                  fr: { text: '(1) L’eau ne s’évapore que lorsqu’elle atteint 100\u00a0°C.' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: '(2) Clouds are made of water vapour.' },
                  fr: { text: '(2) Les nuages sont faits de vapeur d’eau.' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: '(3) Droplets that join together and become too heavy fall as rain.',
                  },
                  fr: {
                    text: '(3) Les gouttelettes qui se rassemblent et deviennent trop lourdes tombent sous forme de pluie.',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '(4) Rain is fresh water because the salt stays in the sea.' },
                  fr: { text: '(4) L’eau de pluie est douce, car le sel reste dans la mer.' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: '(5) The same raindrop falls on the same town every twelve years, with a reference.',
                  },
                  fr: {
                    text: '(5) La même goutte de pluie retombe sur la même ville tous les douze ans, avec une référence.',
                  },
                },
              },
              {
                id: 'f',
                translations: {
                  en: { text: '(6) "Ask your mum to help you."' },
                  fr: { text: '(6) «\u00a0Demande à ta maman de t’aider.\u00a0»' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 4, 5],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Sentence 1 is false: water evaporates at any temperature, and 100\u00a0°C is its boiling point at sea level. Sentence 2 is false: clouds are made of tiny droplets of liquid water or ice crystals, while water vapour is invisible. Sentence 5 is an invented claim with a reference that cannot be found, a typical hallucination. Sentence 6 assumes that every child has a mother at home to help: a small bias, better worded as "Ask an adult at home". Sentences 3 and 4 are correct.',
              },
              fr: {
                text: 'La phrase 1 est fausse\u00a0: l’eau s’évapore à toute température, et 100\u00a0°C est sa température d’ébullition au niveau de la mer. La phrase 2 est fausse\u00a0: les nuages sont formés de minuscules gouttelettes d’eau liquide ou de cristaux de glace, alors que la vapeur d’eau est invisible. La phrase 5 est une affirmation inventée, avec une référence introuvable\u00a0: une hallucination typique. La phrase 6 suppose que chaque enfant a une mère à la maison pour l’aider\u00a0: un petit biais, qu’il vaut mieux reformuler en «\u00a0Demande à un adulte à la maison\u00a0». Les phrases 3 et 4 sont justes.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'In the examples an AI tool writes for your class, scientists are almost always men and nurses almost always women. What is the best explanation?',
              },
              fr: {
                prompt:
                  'Dans les exemples qu’un outil d’IA rédige pour votre classe, les scientifiques sont presque toujours des hommes et le personnel infirmier presque toujours des femmes. Quelle est la meilleure explication\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The tool was deliberately programmed with these opinions' },
                  fr: { text: 'L’outil a été délibérément programmé avec ces opinions' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'It reproduces patterns found in its training data, stereotypes included',
                  },
                  fr: {
                    text: 'Il reproduit des régularités présentes dans ses données d’entraînement, stéréotypes compris',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It has learned your personal opinions from your previous prompts' },
                  fr: {
                    text: 'Il a appris vos opinions personnelles à partir de vos prompts précédents',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'It is a hallucination caused by a typing error in your prompt' },
                  fr: {
                    text: 'C’est une hallucination causée par une faute de frappe dans votre prompt',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Models reproduce the patterns of their training data, stereotypes included. Ask explicitly for varied examples, and review what you give your pupils.',
              },
              fr: {
                text: 'Les modèles reproduisent les régularités de leurs données d’entraînement, stéréotypes compris. Demandez explicitement des exemples variés, et relisez ce que vous donnez à vos élèves.',
              },
            },
          },
          {
            id: 'q5',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'What is the usual name for a fluent, confident AI output that is false or invented, such as a reference that does not exist? (one word)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on habituellement un résultat de l’IA fluide et assuré, mais faux ou inventé, comme une référence qui n’existe pas\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'hallucination',
                'hallucinations',
                'a hallucination',
                'an hallucination',
                'confabulation',
                'confabulations',
                'ai hallucination',
                'ai hallucinations',
              ],
              fr: [
                'hallucination',
                'hallucinations',
                'une hallucination',
                'des hallucinations',
                'les hallucinations',
                'confabulation',
                'une confabulation',
                'hallucination de l’ia',
                "hallucination de l'ia",
              ],
            },
            explanation: {
              en: {
                text: 'A hallucination (sometimes called a confabulation). It follows from the way models generate plausible text, so checking is always needed.',
              },
              fr: {
                text: 'Une hallucination (on parle parfois de confabulation). Elle découle de la façon dont les modèles génèrent un texte plausible\u00a0: il faut donc toujours vérifier.',
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
            title: 'Check: planning and differentiation',
            instructions: 'Five questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: préparer et différencier',
            instructions:
              'Cinq questions. Il faut 70\u00a0% pour réussir, et vous pouvez réessayer.',
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
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Which of these belong in a well-structured planning prompt? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Lesquels de ces éléments ont leur place dans un prompt de préparation bien structuré\u00a0? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'A role for the AI, such as "You are an experienced science teacher"',
                  },
                  fr: {
                    text: 'Un rôle pour l’IA, comme «\u00a0Vous êtes un enseignant de sciences expérimenté\u00a0»',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The task: what you want it to produce' },
                  fr: { text: 'La tâche\u00a0: ce que vous voulez obtenir' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'The context: the age of the pupils, what they already know, the objective',
                  },
                  fr: {
                    text: 'Le contexte\u00a0: l’âge des élèves, ce qu’ils savent déjà, l’objectif',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The format of the output, such as a table with timings' },
                  fr: { text: 'Le format du résultat, par exemple un tableau minuté' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'The names and reading levels of the pupils in your class' },
                  fr: { text: 'Les noms et les niveaux de lecture des élèves de votre classe' },
                },
              },
              {
                id: 'f',
                translations: {
                  en: { text: 'Constraints, such as length, materials or what to avoid' },
                  fr: {
                    text: 'Des contraintes, comme la longueur, le matériel ou ce qu’il faut éviter',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2, 3, 5],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Role, task, context, format and constraints make a precise prompt. Pupils’ names and personal information never go into a prompt: describe needs instead.',
              },
              fr: {
                text: 'Rôle, tâche, contexte, format et contraintes font un prompt précis. Les noms et les informations personnelles des élèves ne vont jamais dans un prompt\u00a0: décrivez plutôt des besoins.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'An AI tool gives you a lesson plan that looks good. What should you do before using it?',
              },
              fr: {
                prompt:
                  'Un outil d’IA vous propose un plan de séance qui semble bon. Que devez-vous faire avant de l’utiliser\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Use it as it is: it was generated from the programme' },
                  fr: { text: 'L’utiliser tel quel\u00a0: il a été généré à partir du programme' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Check it against your objective, your pupils and the facts, then adapt it',
                  },
                  fr: {
                    text: 'Le vérifier au regard de votre objectif, de vos élèves et des faits, puis l’adapter',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Ask the same tool whether its plan is correct, and trust its answer',
                  },
                  fr: {
                    text: 'Demander au même outil si son plan est juste, et faire confiance à sa réponse',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Run it through a second AI tool, which is enough as a check' },
                  fr: {
                    text: 'Le soumettre à un second outil d’IA, ce qui suffit comme vérification',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'An AI plan is a draft. You check its facts, fit and fairness, and you decide what reaches your pupils. A second AI opinion can help you spot issues, but it does not replace your own check.',
              },
              fr: {
                text: 'Un plan proposé par l’IA est un brouillon. Vous vérifiez les faits, l’adéquation et l’équité, et c’est vous qui décidez de ce qui arrive à vos élèves. L’avis d’une autre IA peut aider à repérer des problèmes, mais il ne remplace pas votre propre vérification.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which request is safe to paste into a general AI tool?' },
              fr: {
                prompt:
                  'Quelle demande peut-on coller sans risque dans un outil d’IA généraliste\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: '"Rewrite this text for Sam, 11, who has an individual support plan for dyslexia."',
                  },
                  fr: {
                    text: '«\u00a0Réécrivez ce texte pour Sam, 11\u00a0ans, qui a un plan d’accompagnement individuel pour sa dyslexie.\u00a0»',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: '"Rewrite this text for a reader aged 11 who reads at the level of a typical 8-year-old, keeping the key terms."',
                  },
                  fr: {
                    text: '«\u00a0Réécrivez ce texte pour un lecteur de 11\u00a0ans qui lit au niveau d’un enfant de 8\u00a0ans, en gardant les termes clés.\u00a0»',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: '"Here are my pupils’ names and reading levels: make a version for each of them."',
                  },
                  fr: {
                    text: '«\u00a0Voici les noms et les niveaux de lecture de mes élèves\u00a0: faites une version pour chacun.\u00a0»',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '"Adapt this text using the attached report on my class."' },
                  fr: {
                    text: '«\u00a0Adaptez ce texte à partir du bilan de ma classe ci-joint.\u00a0»',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The second request describes a need without identifying anyone. The others share personal, and sometimes sensitive, data about children.',
              },
              fr: {
                text: 'La deuxième demande décrit un besoin sans identifier personne. Les autres partagent des données personnelles, parfois sensibles, sur des enfants.',
              },
            },
          },
          {
            id: 'q4',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'A simplified version of a text produced by AI can introduce misconceptions, so it must be checked for accuracy.',
              },
              fr: {
                prompt:
                  'Une version simplifiée d’un texte produite par l’IA peut introduire des idées fausses\u00a0: il faut donc en vérifier l’exactitude.',
              },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'True. Simplifying is where errors creep in, as with "plants eat sunlight". Check the meaning, the expectations, the tone and the representation.',
              },
              fr: {
                text: 'Vrai. C’est en simplifiant que les erreurs s’installent, comme dans «\u00a0les plantes mangent la lumière du soleil\u00a0». Vérifiez le sens, les attentes, le ton et la représentation.',
              },
            },
          },
          {
            id: 'q5',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'In the five-part prompt pattern, which part tells the AI what the output should look like, for example a table or 150 words? (one word)',
              },
              fr: {
                prompt:
                  'Dans la structure de prompt en cinq parties, quelle partie indique à l’IA à quoi doit ressembler le résultat, par exemple un tableau ou 150\u00a0mots\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['format', 'the format', 'formats', 'output format', 'the output format'],
              fr: [
                'format',
                'le format',
                'formats',
                'format du résultat',
                'le format du résultat',
                'forme',
                'la forme',
                'mise en forme',
                'la mise en forme',
              ],
            },
            explanation: {
              en: {
                text: 'The format: a table, a list, a length, headings. Without it, you get whatever shape the tool chooses.',
              },
              fr: {
                text: 'Le format\u00a0: un tableau, une liste, une longueur, des intertitres. Sans lui, vous obtenez la forme que l’outil choisit.',
              },
            },
          },
        ],
      },
    },
    {
      id: 'quiz-m3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: assessment and academic integrity',
            instructions: 'Five questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: évaluation et intégrité académique',
            instructions:
              'Cinq questions. Il faut 70\u00a0% pour réussir, et vous pouvez réessayer.',
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
              en: {
                prompt:
                  'A detector reports that an essay is "90% likely AI-generated". What is the most appropriate response?',
              },
              fr: {
                prompt:
                  'Un détecteur indique qu’une rédaction est «\u00a0probablement générée par l’IA à 90\u00a0%\u00a0». Quelle est la réaction la plus appropriée\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Give the essay zero: the score is evidence' },
                  fr: { text: 'Mettre zéro\u00a0: le score est une preuve' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Treat the score as weak information at most, look at the process and talk with the pupil, following the school’s policy',
                  },
                  fr: {
                    text: 'Considérer le score comme une information fragile, tout au plus, examiner la démarche et en parler avec l’élève, en suivant la politique de l’établissement',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Run the essay through two more detectors and average the scores' },
                  fr: {
                    text: 'Soumettre la rédaction à deux autres détecteurs et faire la moyenne des scores',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Ask the pupil to prove that they wrote it alone' },
                  fr: { text: 'Demander à l’élève de prouver qu’il l’a écrite seul' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Detector scores are unreliable and cannot prove who wrote a text. Averaging unreliable tools does not make them reliable, and a pupil cannot prove a negative. Evidence comes from the process, a conversation and your knowledge of the pupil’s work.',
              },
              fr: {
                text: 'Les scores des détecteurs ne sont pas fiables et ne prouvent pas qui a écrit un texte. Faire la moyenne d’outils peu fiables ne les rend pas fiables, et un élève ne peut pas prouver qu’il n’a pas fait quelque chose. Les éléments viennent de la démarche, de l’échange et de votre connaissance du travail de l’élève.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Why can AI-writing detectors not settle a case of suspected AI use? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Pourquoi les détecteurs de texte généré par l’IA ne permettent-ils pas de trancher quand on soupçonne un usage de l’IA\u00a0? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'They flag some human writing as AI-generated' },
                  fr: {
                    text: 'Ils signalent certains textes écrits par des humains comme générés par l’IA',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Lightly edited or paraphrased AI text often escapes them' },
                  fr: {
                    text: 'Un texte d’IA légèrement retouché ou reformulé leur échappe souvent',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'They have been shown to flag writing in English by non-native speakers more often',
                  },
                  fr: {
                    text: 'Il a été montré qu’ils signalent plus souvent les textes écrits en anglais par des non-anglophones',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'They can only analyse texts written in the past year' },
                  fr: {
                    text: 'Ils ne peuvent analyser que des textes écrits au cours de l’année écoulée',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'False positives, false negatives and bias against some writers make detector scores unsuitable as evidence. OpenAI even withdrew its own classifier because of its low accuracy.',
              },
              fr: {
                text: 'Faux positifs, faux négatifs et biais envers certains auteurs rendent les scores des détecteurs inutilisables comme preuve. OpenAI a même retiré son propre outil de détection en raison de son faible taux de précision.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Which change makes a take-home essay more resilient to undisclosed AI use?',
              },
              fr: {
                prompt:
                  'Quelle modification rend une rédaction faite à la maison plus résistante à un usage non déclaré de l’IA\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Adding a strict word limit' },
                  fr: { text: 'Ajouter une limite de mots stricte' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Asking for a plan and a draft, a short in-class explanation of key choices, and the use of a source studied in class',
                  },
                  fr: {
                    text: 'Demander un plan et un brouillon, une courte explication orale en classe des choix importants, et l’appui sur une source étudiée en classe',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Writing "AI is forbidden" on the task and announcing that a detector will be used',
                  },
                  fr: {
                    text: 'Écrire «\u00a0IA interdite\u00a0» sur la consigne et annoncer qu’un détecteur sera utilisé',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Giving pupils less time to do it' },
                  fr: { text: 'Laisser moins de temps aux élèves' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Evidence of the process, a conversation and a link to material specific to the class show what the pupil understands. A ban backed by a detector is neither enforceable nor fair.',
              },
              fr: {
                text: 'Des traces de la démarche, un échange et l’appui sur des documents propres à la classe montrent ce que l’élève a compris. Une interdiction appuyée sur un détecteur n’est ni applicable ni équitable.',
              },
            },
          },
          {
            id: 'q4',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'A clear AI-use policy tells pupils, for each task, which uses of AI are allowed and how to acknowledge them.',
              },
              fr: {
                prompt:
                  'Une charte claire d’usage de l’IA indique aux élèves, pour chaque tâche, quels usages de l’IA sont autorisés et comment les déclarer.',
              },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'True. Pupils cannot follow rules they do not know. Levels for each task and a simple acknowledgement routine prevent most problems.',
              },
              fr: {
                text: 'Vrai. Les élèves ne peuvent pas suivre des règles qu’ils ne connaissent pas. Des niveaux pour chaque tâche et une routine de déclaration simple évitent la plupart des problèmes.',
              },
            },
          },
          {
            id: 'q5',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'Complete the principle of this module: assess the ___, not only the product. (one word)',
              },
              fr: {
                prompt:
                  'Complétez le principe de ce module\u00a0: évaluer la ___, pas seulement le produit. (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['process', 'the process', 'processes', 'learning process'],
              fr: [
                'démarche',
                'la démarche',
                'démarches',
                'les démarches',
                'démarche d’apprentissage',
                "démarche d'apprentissage",
                'processus',
                'le processus',
                'processus d’apprentissage',
                "processus d'apprentissage",
              ],
            },
            explanation: {
              en: {
                text: 'The process: plans, drafts, decisions and explanations show learning that a finished product alone cannot show.',
              },
              fr: {
                text: 'La démarche\u00a0: les plans, les brouillons, les décisions et les explications montrent des apprentissages que le produit fini, à lui seul, ne montre pas.',
              },
            },
          },
        ],
      },
    },
    {
      id: 'quiz-m4',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: safe classroom AI',
            instructions: 'Five questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: une IA sûre en classe',
            instructions:
              'Cinq questions. Il faut 70\u00a0% pour réussir, et vous pouvez réessayer.',
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
            type: 'multiple_answer',
            points: 3,
            translations: {
              en: {
                prompt:
                  'Which of these should never go into a prompt in an AI tool that your school has not approved? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Lesquels de ces éléments ne doivent jamais figurer dans un prompt adressé à un outil d’IA que votre établissement n’a pas autorisé\u00a0? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A pupil’s full name' },
                  fr: { text: 'Le nom complet d’un élève' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A photo of your class' },
                  fr: { text: 'Une photo de votre classe' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Information about a pupil’s health or special educational needs',
                  },
                  fr: {
                    text: 'Des informations sur la santé ou les besoins éducatifs particuliers d’un élève',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The learning objective of your lesson' },
                  fr: { text: 'L’objectif d’apprentissage de votre séance' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'A description of a pupil’s family situation' },
                  fr: { text: 'Une description de la situation familiale d’un élève' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Names, photos, health and needs information and family details are personal data, and some of it is sensitive. Your learning objective is not personal data. Even with approved tools, share only what the task needs.',
              },
              fr: {
                text: 'Noms, photos, informations de santé ou sur les besoins particuliers et détails familiaux sont des données personnelles, parfois sensibles. Votre objectif d’apprentissage n’en est pas une. Même avec des outils autorisés, ne partagez que ce dont la tâche a besoin.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'A pupil aged 10 asks whether they can use a popular general-purpose chatbot at home for homework. What is the most accurate advice?',
              },
              fr: {
                prompt:
                  'Un élève de 10\u00a0ans demande s’il peut utiliser chez lui un chatbot grand public très connu pour ses devoirs. Quel est le conseil le plus juste\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Any AI tool is fine for homework if a teacher recommends it' },
                  fr: {
                    text: 'N’importe quel outil d’IA convient pour les devoirs si un enseignant le recommande',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Many such services set a minimum age of 13 or more in their terms; younger pupils should use only tools approved for their age, with an adult',
                  },
                  fr: {
                    text: 'Beaucoup de ces services fixent un âge minimum de 13\u00a0ans ou plus dans leurs conditions\u00a0; les plus jeunes ne doivent utiliser que des outils autorisés pour leur âge, avec un adulte',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Age rules apply to social networks, not to AI tools' },
                  fr: {
                    text: 'Les règles d’âge concernent les réseaux sociaux, pas les outils d’IA',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'It is fine as long as they do not type their name' },
                  fr: { text: 'C’est possible du moment qu’il ne tape pas son nom' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'AI services set minimum ages in their terms (often 13, sometimes 18), and data-protection laws add rules for children. Point younger pupils to approved, age-appropriate tools used with an adult.',
              },
              fr: {
                text: 'Les services d’IA fixent un âge minimum dans leurs conditions d’utilisation (souvent 13\u00a0ans, parfois 18), et les lois sur la protection des données ajoutent des règles pour les enfants. Orientez les plus jeunes vers des outils autorisés et adaptés à leur âge, utilisés avec un adulte.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'A pupil tells you that classmates are sharing an AI-generated fake image of another pupil. What should you do first?',
              },
              fr: {
                prompt:
                  'Un élève vous signale que des camarades font circuler une image truquée d’un autre élève, générée par l’IA. Que devez-vous faire en premier\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Ask the pupils involved to delete it, and move on' },
                  fr: {
                    text: 'Demander aux élèves concernés de la supprimer, et passer à autre chose',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Follow your school’s safeguarding procedure and report it to the designated safeguarding (child-protection) lead',
                  },
                  fr: {
                    text: 'Suivre la procédure de protection de l’enfance de l’établissement et alerter la personne qui en a la charge',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Ask the pupil to send you the image so that you can see it' },
                  fr: { text: 'Demander à l’élève de vous envoyer l’image pour la voir' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Find out which AI tool was used before doing anything else' },
                  fr: { text: 'Chercher quel outil d’IA a été utilisé avant toute autre chose' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'It is a safeguarding matter: follow the procedure and report it. Do not ask for, copy or forward the image yourself, and support both the pupil who reported it and the pupil who was targeted.',
              },
              fr: {
                text: 'C’est une question de protection de l’enfance\u00a0: suivez la procédure et signalez la situation. Ne demandez pas l’image, ne la copiez pas et ne la transférez pas vous-même, et soutenez à la fois l’élève qui l’a signalée et l’élève visé.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which activity suits pupils aged 8 to 10 best?' },
              fr: {
                prompt: 'Quelle activité convient le mieux à des élèves de 8 à 10\u00a0ans\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Each pupil creates an account on a general-purpose chatbot to write stories at home',
                  },
                  fr: {
                    text: 'Chaque élève crée un compte sur un chatbot grand public pour écrire des histoires à la maison',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'A teacher-led demonstration on the class screen, in which pupils suggest prompts and check whether the answers are right',
                  },
                  fr: {
                    text: 'Une démonstration menée par l’enseignant sur l’écran de la classe, où les élèves proposent des prompts et vérifient si les réponses sont justes',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Pupils train a face-recognition model on photos of their classmates',
                  },
                  fr: {
                    text: 'Les élèves entraînent un modèle de reconnaissance faciale sur des photos de leurs camarades',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Pupils use an image generator on their own, without supervision' },
                  fr: {
                    text: 'Les élèves utilisent seuls un générateur d’images, sans supervision',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'For ages 8 to 10, the teacher operates the tool and the pupils think about what it does. The other options break age rules, process personal data (faces used for recognition are biometric data) or remove supervision.',
              },
              fr: {
                text: 'Pour les 8 à 10\u00a0ans, c’est l’enseignant qui manipule l’outil, et les élèves réfléchissent à ce qu’il fait. Les autres options enfreignent les règles d’âge, traitent des données personnelles (des visages utilisés pour la reconnaissance sont des données biométriques) ou suppriment la supervision.',
              },
            },
          },
          {
            id: 'q5',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'The project cycle of this course is LEARN → TRY → BUILD → GET FEEDBACK → ___ → SHOW YOUR PROJECT. Which step is missing? (one word)',
              },
              fr: {
                prompt:
                  'Le cycle de projet de cette formation est APPRENDRE → ESSAYER → CONSTRUIRE → RECEVOIR UN RETOUR → ___ → MONTRER SON PROJET. Quelle est l’étape manquante\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['improve', 'improving', 'improvement', 'improve it'],
              fr: [
                'améliorer',
                'améliorez',
                'améliore',
                'amélioration',
                'amélioration du projet',
                'améliorer son projet',
                'améliorer le projet',
              ],
            },
            explanation: {
              en: {
                text: 'Improve: pupils use the feedback to make a better version, then show it.',
              },
              fr: {
                text: 'Améliorer\u00a0: les élèves s’appuient sur les retours pour produire une meilleure version, puis la montrent.',
              },
            },
          },
        ],
      },
    },
    ...m5.quizzes,
    ...m6.quizzes,
  ],

  projects: [...m5.projects, ...m6.projects],
};
