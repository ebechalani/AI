// "Build with Generative AI": the AI Creator demo course (ages 11-14) of brief section 22. Five
// modules, eleven lessons (340 minutes), in this order: m1 "How generative AI works" (prediction,
// diffusion), m2 "Prompting like a pro" (role, task, context and format; iteration and a prompt
// log), m4 "Data: the fuel of AI" (where training data comes from, labels, consent, copyright and
// bias; a kindness model), m5 "AI assistants, games and media" (an assistant's instructions and
// tests, a quiz-show player, video, voice and music generators) and m3 "Create responsibly: your
// creator project" (the creator's code, then the creator project, an illustrated story or a
// poster with a prompt log and a reflection, which ends the course). Blocks cover every lesson
// stage; one quiz per module; English and French; no uploaded files.
//
// m1, m2 and m3 (with quiz-m1, quiz-m2, quiz-m3 and project-1) are the first release and are
// written here. m4 and m5 were added by a later content release (ARCHITECTURE.md 11.7) and live
// in ./build-with-generative-ai/, whose headers say what each one covers. A release only adds to
// a database that already holds the course, so module ids are not in course order, the module
// files' quizzes and projects come after the first release's in their arrays, and m1, m2, m3 and
// their quizzes and project must not be changed here. project-1 stays first among the projects
// and is the only one the certificate needs. Lessons refer to Module 2 by number (m1 and m2 keep
// their places); the new modules name the others ("the creator's code at the end of the course").
//
// Two Machine Learning for Kids activities, both "Try it now" (no accounts, nothing about the
// learner is stored): Make me happy (m4-l2, a text model of kind and unkind messages in Scratch)
// and Quiz Show (m5-l2, a ready-trained question-answering model that reads Wikipedia, in
// Scratch). Each has a paper version for schools that block the site and an optional hand-in
// (project-m4, project-m5). The three videos are from Code.org's How AI Works series (in
// English); m2-l1 and m5-l3 cover their 'watch' stage with a written replay instead, and m4 has
// no video block.

import type { SeedCourse } from '../types';
import { m4 } from './build-with-generative-ai/m4';
import { m5 } from './build-with-generative-ai/m5';

const RICH = 'rich_text' as const;

export const buildWithGenerativeAi: SeedCourse = {
  id: 'build-with-generative-ai',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'Build with Generative AI',
        summary:
          'Find out how generative AI works and the data behind it, write prompts that get results, train and test models on Machine Learning for Kids, design an assistant, explore video, voice and music generators, and create an illustrated story or a poster responsibly.',
        description:
          'Generative AI can write a story, draw a picture or compose a tune in seconds. But how does it do it, and how do you stay in charge? In eleven lessons you will find out how text and image generators produce new content by predicting patterns (they predict, they do not think), learn to write prompts with a role, a task, context and a format, and improve them one step at a time. Then you will look at the data behind every model: where training data comes from, who labels it, why consent and copyright matter, and how gaps and bias shape what a model gets right and wrong. You will design your own AI assistant with clear rules and try to catch it out with tricky requests, and find out how video, voice and music generators work, how to spot their glitches and how to use them fairly. Two activities on Machine Learning for Kids, done with "Try it now" so that no account is needed, let you build with AI yourself: in Make me happy you train a model to tell kind messages from unkind ones for a Scratch character and test where sarcasm and slang fool it, and in Quiz Show you pit a ready-trained model that reads Wikipedia against a human player in Scratch to find out what it really knows. Each activity has a paper version for when the website cannot be opened, and a short hand-in that shows your test results. You will also learn the creator\'s code: credit AI help, respect artists, spot bias and deepfakes, check facts and protect your privacy. Each module has a quiz, and the course ends with a creator project, an illustrated short story or a poster that you plan, generate, critique and improve, with a prompt log that shows your process, and a certificate.',
        outcomes: [
          'Explain how text and image generators produce new content from patterns in their training data',
          'Write prompts with a role, a task, context and a format, and improve them step by step',
          'Spot common AI mistakes: made-up facts, bias and visual glitches',
          'Explain where training data comes from, who labels it, and why consent, copyright and gaps in the data matter',
          'Train and test a text model on Machine Learning for Kids, and explain why sarcasm, slang and dialects can fool it',
          'Design an AI assistant with a purpose, a persona, rules, a tone and a format, and test it with normal, tricky and unsafe requests',
          'Test a ready-trained model in a Scratch quiz show, and explain why recognising the type of a question is not knowing its answer',
          'Explain how video, voice and music generators work, spot their glitches and use them fairly, with consent, AI labels and checked sources',
          'Create responsibly: credit AI help, respect creators, protect privacy and never fake real people',
          'Plan, create and improve a multimedia piece with a prompt log and a reflection',
        ],
      },
      fr: {
        title: 'Créer avec l’IA générative',
        summary:
          'Comprends l’IA générative et les données qui la nourrissent, écris des prompts efficaces, entraîne et teste des modèles sur Machine Learning for Kids, conçois un assistant, découvre les générateurs de vidéos, de voix et de musique, et crée une histoire illustrée ou une affiche de façon responsable.',
        description:
          'L’IA générative peut écrire une histoire, dessiner une image ou composer une mélodie en quelques secondes. Mais comment fait-elle, et comment rester aux commandes\u00a0? En onze leçons, tu vas découvrir comment les générateurs de texte et d’images produisent du contenu nouveau à partir de régularités apprises (ils prédisent, ils ne pensent pas), apprendre à écrire des prompts (des consignes pour l’IA) avec un rôle, une tâche, un contexte et un format, et les améliorer étape par étape. Tu t’intéresseras ensuite aux données qui se cachent derrière chaque modèle\u00a0: d’où viennent les données d’entraînement, qui les étiquette, pourquoi le consentement et le droit d’auteur comptent, et comment les lacunes et les biais influencent ce qu’un modèle réussit et rate. Tu concevras ton propre assistant IA avec des règles claires et tu essaieras de le prendre en défaut avec des demandes pièges, puis tu découvriras comment fonctionnent les générateurs de vidéos, de voix et de musique, comment repérer leurs défauts et comment t’en servir de façon responsable. Deux activités sur Machine Learning for Kids, faites avec «\u00a0Essayer maintenant\u00a0» (pas besoin de créer de compte), te permettent de créer toi-même avec l’IA. Dans «\u00a0Rends-moi heureux\u00a0» (Make me happy), tu entraînes un modèle à distinguer les messages gentils des messages pas gentils pour un personnage Scratch et tu testes les cas où le sarcasme et l’argot le piègent\u00a0; dans Quiz Show, tu opposes dans Scratch un modèle déjà entraîné, qui lit Wikipédia, à un joueur humain pour découvrir ce qu’il sait vraiment. Chaque activité a une version sur papier pour le cas où le site ne s’ouvre pas, et un petit travail à rendre qui présente tes résultats de test. Tu découvriras aussi le code du créateur\u00a0: citer l’IA, respecter les artistes, repérer les biais et les deepfakes, vérifier les faits et protéger ta vie privée. Chaque module comporte un quiz, et le cours se termine par un projet de créateur, une histoire courte illustrée ou une affiche que tu prépares, génères, critiques et améliores, accompagnée d’un journal de prompts qui montre ta démarche, puis par un certificat.',
        outcomes: [
          'Expliquer comment les générateurs de texte et d’images produisent du contenu nouveau à partir des régularités de leurs données d’entraînement',
          'Écrire des prompts avec un rôle, une tâche, un contexte et un format, et les améliorer étape par étape',
          'Repérer les erreurs courantes de l’IA\u00a0: faits inventés, biais et défauts visuels',
          'Expliquer d’où viennent les données d’entraînement, qui les étiquette, et pourquoi le consentement, le droit d’auteur et les lacunes des données comptent',
          'Entraîner et tester un modèle de texte sur Machine Learning for Kids, et expliquer pourquoi le sarcasme, l’argot et les dialectes peuvent le piéger',
          'Concevoir un assistant IA avec un objectif, un personnage, des règles, un ton et un format, et le tester avec des demandes normales, pièges et dangereuses',
          'Tester un modèle déjà entraîné dans un quiz télévisé Scratch, et expliquer pourquoi reconnaître le type d’une question n’est pas connaître sa réponse',
          'Expliquer comment fonctionnent les générateurs de vidéos, de voix et de musique, repérer leurs défauts et s’en servir de façon responsable (consentement, étiquette «\u00a0IA\u00a0», sources vérifiées)',
          'Créer de façon responsable\u00a0: citer l’aide de l’IA, respecter les créateurs, protéger la vie privée et ne jamais fabriquer de faux contenus avec de vraies personnes',
          'Préparer, réaliser et améliorer une œuvre multimédia avec un journal de prompts et une analyse',
        ],
      },
    },
    audience: 'student',
    area: 'generative_ai',
    tags: [
      'generative-ai',
      'prompts',
      'creativity',
      'responsible-ai',
      'images',
      'stories',
      'machine-learning',
      'machine-learning-for-kids',
      'training-data',
      'scratch',
    ],
    ageMin: 11,
    ageMax: 14,
    estimatedMinutes: 340,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'ai-creator',
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
            title: 'How generative AI works',
            description:
              'What generative AI is, how text generators predict the next word and how image generators turn noise into pictures.',
          },
          fr: {
            title: 'Comment fonctionne l’IA générative',
            description:
              'Ce qu’est l’IA générative, comment un générateur de texte prédit le mot suivant et comment un générateur d’images transforme du bruit en image.',
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
                title: 'What is generative AI?',
                summary:
                  'AI that creates new text, images and sounds, and the prediction trick behind every chatbot.',
              },
              fr: {
                title: 'Qu’est-ce que l’IA générative\u00a0?',
                summary:
                  'Une IA qui crée du texte, des images et des sons nouveaux, et le principe de prédiction qui se cache derrière chaque chatbot.',
              },
            },
            estimatedMinutes: 20,
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
                  heading: 'Finish the sentence',
                  body: 'Try this: *"Once upon a ..."* You probably thought **"time"** straight away. *"The cat is asleep on the ..."* Most people say **"sofa"** or **"bed"**.\n\nYou just made a **prediction**: you guessed the most likely next word, thanks to all the sentences you have read and heard.\n\nThat simple trick, repeated millions of times at high speed, is at the heart of the chatbots that write essays, poems and code. In this lesson you will find out what **generative AI** is and how it builds an answer, one piece at a time.',
                },
                fr: {
                  heading: 'Termine la phrase',
                  body: 'Essaie\u00a0: *«\u00a0Il était une…\u00a0»* Tu as sans doute pensé **«\u00a0fois\u00a0»** tout de suite. *«\u00a0Le chat dort sur le…\u00a0»* La plupart des gens répondent **«\u00a0canapé\u00a0»** ou **«\u00a0lit\u00a0»**.\n\nTu viens de faire une **prédiction**\u00a0: tu as deviné le mot suivant le plus probable, grâce à toutes les phrases que tu as déjà lues et entendues.\n\nCette astuce toute simple, répétée des millions de fois à grande vitesse, est au cœur des chatbots qui écrivent des rédactions, des poèmes ou du code. Dans cette leçon, tu vas découvrir ce qu’est l’**IA générative** et comment elle construit une réponse, morceau par morceau.',
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
                  heading: 'Generating, one token at a time',
                  body: "Most of the AI you have met before **recognises** or **sorts** things: is this email spam? Is there a cat in this photo? **Generative AI** **creates** something new: a paragraph, a picture, a melody or a voice.\n\nA text generator is built on a **large language model** (LLM). Here is how it works, simply put:\n\n1. **Training.** The model is given an enormous amount of text to analyse: books, websites, articles. It learns which words or pieces of words, called **tokens**, tend to follow which others. Developers then train it further with feedback from people, so that it follows instructions.\n2. **Predicting.** When you send a **prompt** (the instructions you give the AI), the model calculates how likely each possible next token is.\n3. **Picking.** It picks one of the likely tokens, with a little randomness, and adds it to the text.\n4. **Repeating.** It does the same again with the new, longer text, token after token, until the answer is complete.\n\nThat is why the same prompt can give a different answer each time, and why the text sounds so natural. But natural is not the same as true: the model does not check facts and does not know whether what it writes is correct. When it has no reliable pattern to follow, it can produce a made-up fact, quote or source that **sounds** right. People call this a **hallucination**, even though the model does not see or imagine anything: it is only predicting likely words.\n\nSome chatbots can also search the web and show links, but the answer is still written by prediction and can misquote its sources: open the links and check.\n\n**Creator's rule:** generative AI is a brilliant draft machine. You are the one who reads, corrects and checks.",
                },
                fr: {
                  heading: 'Générer, un jeton à la fois',
                  body: 'La plupart des IA que tu as déjà rencontrées **reconnaissent** ou **trient** des choses\u00a0: ce message est-il un spam\u00a0? Y a-t-il un chat sur cette photo\u00a0? L’**IA générative**, elle, **crée** quelque chose de nouveau\u00a0: un paragraphe, une image, une mélodie ou une voix.\n\nUn générateur de texte repose sur un **grand modèle de langage** (en anglais *large language model*, ou LLM). Voici comment il fonctionne, en simplifiant\u00a0:\n\n1. **L’entraînement.** On donne au modèle une quantité énorme de textes à analyser\u00a0: livres, sites web, articles. Il apprend quels mots ou morceaux de mots, appelés **jetons** (*tokens*), ont tendance à suivre quels autres. Les développeurs poursuivent ensuite son entraînement grâce aux retours de personnes, pour qu’il suive les instructions.\n2. **La prédiction.** Quand tu envoies un **prompt** (la consigne que tu donnes à l’IA), le modèle calcule la probabilité de chaque jeton qui pourrait venir ensuite.\n3. **Le choix.** Il choisit l’un des jetons probables, avec une part de hasard, et l’ajoute au texte.\n4. **La répétition.** Il recommence avec le nouveau texte, un peu plus long, jeton après jeton, jusqu’à ce que la réponse soit terminée.\n\nVoilà pourquoi le même prompt peut donner une réponse différente à chaque fois, et pourquoi le texte paraît si naturel. Mais naturel ne veut pas dire vrai\u00a0: le modèle ne vérifie pas les faits et ne sait pas si ce qu’il écrit est exact. Quand il n’a pas de régularité fiable à suivre, il peut produire un fait, une citation ou une source inventés qui **ont l’air** justes. On parle d’**hallucination**, même si le modèle ne voit et n’imagine rien\u00a0: il prédit seulement des mots probables.\n\nCertains chatbots peuvent aussi faire une recherche sur le web et afficher des liens, mais la réponse reste écrite par prédiction et peut déformer ses sources\u00a0: ouvre les liens et vérifie.\n\n**Règle du créateur\u00a0:** l’IA générative est une formidable machine à brouillons. C’est toi qui relis, corriges et vérifies.',
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
                    "From Code.org's How AI Works series: how a chatbot predicts text, and why it can still get things wrong.",
                  transcript:
                    'In short: chatbots such as ChatGPT are built on large language models, and the idea behind them is simple statistics used on a gigantic scale. The video starts with a small example: by analysing a text, a computer can work out how likely each letter is to follow another, and use that to predict new text. Looking at longer sequences, such as whole words and sentences, gives the model more context, and its predictions become far more convincing. Trained on an enormous amount of text with very powerful computers, a model can write fluent answers, but every answer is still built from probabilities, so it can contain mistakes. Whether this counts as real intelligence is still debated.',
                },
                fr: {
                  title:
                    'Regarde\u00a0: comment fonctionnent les chatbots et les grands modèles de langage',
                  caption:
                    'Une vidéo de la série How AI Works de Code.org\u00a0: comment un chatbot prédit du texte, et pourquoi il peut quand même se tromper (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: les chatbots comme ChatGPT reposent sur de grands modèles de langage, et l’idée de départ, ce sont des statistiques simples appliquées à une échelle gigantesque. La vidéo commence par un petit exemple\u00a0: en analysant un texte, un ordinateur peut calculer la probabilité qu’une lettre en suive une autre, et s’en servir pour prédire un nouveau texte. En regardant des suites plus longues, comme des mots entiers et des phrases, le modèle dispose de plus de contexte et ses prédictions deviennent bien plus convaincantes. Entraîné sur une quantité énorme de textes avec des ordinateurs très puissants, un modèle peut écrire des réponses fluides, mais chaque réponse reste construite à partir de probabilités\u00a0: elle peut donc contenir des erreurs. La question de savoir s’il s’agit d’une véritable intelligence fait encore débat.',
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
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: be the language model',
                  body: 'Play the model with a pencil and paper, or with a friend.\n\nImagine a tiny model that has only ever seen these three sentences:\n\n- *My robot opens the door.*\n- *My robot opens the box.*\n- *My robot paints the door.*\n\nAfter "My robot", it has seen **opens** twice and **paints** once, so "opens" has a probability of 2 in 3.\n\n1. Start with **"My robot"**. Which word is most likely to come next? Write it down.\n2. After "opens", the model has seen **the** both times. Add it.\n3. After "the", it has seen **door** twice and **box** once. Which is most likely? Which could it pick if it adds a little randomness?\n4. Write two different sentences your model could generate. Can one of them be a sentence that was **not** among its three examples? (Hint: try "paints".)\n\nYour tiny model only looks at the last word. A real model takes the whole text so far into account, your prompt and everything it has already written, which is how it stays on topic.\n\nNow think: could your model ever write *"My robot eats the moon"*? No: it has never seen those words. A real model has analysed billions of sentences, so it can write sentences nobody has ever written, but it is still recombining patterns from its training data.',
                },
                fr: {
                  heading: 'À toi\u00a0: joue le modèle de langage',
                  body: 'Joue le rôle du modèle avec un crayon et une feuille, ou avec un ami.\n\nImagine un tout petit modèle qui n’a jamais vu que ces trois phrases\u00a0:\n\n- *Mon robot ouvre la porte.*\n- *Mon robot ouvre la boîte.*\n- *Mon robot peint la porte.*\n\nAprès «\u00a0Mon robot\u00a0», il a vu **ouvre** deux fois et **peint** une fois\u00a0: «\u00a0ouvre\u00a0» a donc une probabilité de 2 sur 3.\n\n1. Pars de **«\u00a0Mon robot\u00a0»**. Quel est le mot suivant le plus probable\u00a0? Écris-le.\n2. Après «\u00a0ouvre\u00a0», le modèle a vu **la** les deux fois. Ajoute-le.\n3. Après «\u00a0la\u00a0», il a vu **porte** deux fois et **boîte** une fois. Lequel est le plus probable\u00a0? Lequel pourrait-il choisir avec un peu de hasard\u00a0?\n4. Écris deux phrases différentes que ton modèle pourrait générer. L’une d’elles peut-elle être une phrase qui ne figurait **pas** parmi ses trois exemples\u00a0? (Indice\u00a0: essaie avec «\u00a0peint\u00a0».)\n\nTon petit modèle ne regarde que le dernier mot. Un vrai modèle tient compte de tout le texte déjà écrit, ton prompt et le début de sa réponse\u00a0: c’est ce qui lui permet de rester dans le sujet.\n\nRéfléchis maintenant\u00a0: ton modèle pourrait-il écrire *«\u00a0Mon robot mange la lune\u00a0»*\u00a0? Non\u00a0: il n’a jamais vu ces mots. Un vrai modèle a analysé des milliards de phrases\u00a0: il peut donc écrire des phrases que personne n’a jamais écrites, mais il recombine toujours des régularités tirées de ses données d’entraînement.',
                },
              },
              data: {},
            },
            {
              id: 'm1-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to explain how a language model chooses the next word, with an example sentence on a topic you like (sport, space or music, for example). Then ask one follow-up question about anything you did not understand. Keep personal details out of your messages: no names, addresses or school names.',
                  starterPrompt:
                    'Can you explain how a large language model chooses the next word in a sentence, using an example about space?',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de t’expliquer comment un modèle de langage choisit le mot suivant, avec une phrase d’exemple sur un sujet que tu aimes (le sport, l’espace ou la musique, par exemple). Pose-lui ensuite une autre question sur ce que tu n’as pas compris. Ne mets aucune information personnelle dans tes messages\u00a0: ni nom, ni adresse, ni nom d’école.',
                  starterPrompt:
                    'Peux-tu m’expliquer comment un grand modèle de langage choisit le mot suivant dans une phrase, avec un exemple sur l’espace\u00a0?',
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
                    'A chatbot can write in a completely confident tone and still be wrong. Using what you learned about prediction, explain why in two or three sentences.',
                },
                fr: {
                  prompt:
                    'Un chatbot peut écrire sur un ton parfaitement assuré et pourtant se tromper. À partir de ce que tu as appris sur la prédiction, explique pourquoi en deux ou trois phrases.',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
        {
          id: 'm1-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'How AI makes pictures and sounds',
                summary:
                  'From random noise to a picture: how image generators work, what they get wrong, and how music and voice generators follow the same idea.',
              },
              fr: {
                title: 'Comment l’IA crée des images et des sons',
                summary:
                  'Du bruit aléatoire à l’image\u00a0: comment fonctionnent les générateurs d’images, ce qu’ils ratent, et comment les générateurs de musique et de voix suivent la même idée.',
              },
            },
            estimatedMinutes: 25,
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
                  heading: 'A picture that never existed',
                  body: 'Picture this: *an octopus playing chess on the Moon, painted in watercolour*. No camera has ever taken that photo and, as far as we know, no artist has ever painted it. Yet an image generator can produce one in a few seconds.\n\nIt does not search the internet for a matching picture, and it does not make a collage from bits of photos. It builds a new image from patterns it learned during training. (Very rarely, it can produce something close to a famous picture that appeared many times in its training data: that is why you will check your project for originality.) How? The answer starts with something surprising: **noise**.',
                },
                fr: {
                  heading: 'Une image qui n’a jamais existé',
                  body: 'Imagine\u00a0: *une pieuvre qui joue aux échecs sur la Lune, peinte à l’aquarelle*. Aucun appareil n’a jamais pris cette photo et, à notre connaissance, aucun artiste ne l’a jamais peinte. Pourtant, un générateur d’images peut en produire une en quelques secondes.\n\nIl ne cherche pas d’image correspondante sur Internet et ne fait pas de collage de morceaux de photos. Il construit une image nouvelle, à partir de régularités apprises pendant son entraînement. (Très rarement, il peut produire quelque chose de proche d’une image célèbre qui figurait de nombreuses fois dans ses données d’entraînement\u00a0: c’est pour cela que tu vérifieras l’originalité de ton projet.) Comment\u00a0? La réponse commence par quelque chose de surprenant\u00a0: du **bruit**.',
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
                  heading: 'From noise to picture',
                  body: "Many of today's image generators use a method called **diffusion**. (Some newer ones build a picture piece by piece instead, a bit like a text generator.)\n\n**Training.** The model is shown hundreds of millions of images, each with a caption that describes it. Random speckles, called **noise**, are added to each image a little at a time, until it is nothing but static, like an old TV with no signal. The model learns to predict the noise that was added, so that it can remove it.\n\n**Generating.** To make a new image, the model starts from **pure random noise**. Step by step, it removes some of the noise, and at each step your **prompt** steers it towards an image that matches the words. After a number of steps (often a few dozen), a picture appears. Start from different noise and you get a different picture from the same prompt.\n\n**Sounds work in a similar way.** Music and voice generators learn patterns from huge collections of audio: rhythms, melodies, instruments, the sound of a voice. Then they generate new audio that follows the same patterns. Some tools can imitate a person's voice from a short recording, which is why using someone's voice without their permission is never OK.\n\n**What generators still get wrong.** Because they work from patterns, not understanding, they can:\n\n- garble **text** inside a picture (signs, labels, book covers);\n- get **numbers** and **positions** wrong (five cats when you asked for three);\n- add **strange details**: extra fingers, objects melting into each other, shadows pointing the wrong way;\n- change a **character** from one picture to the next;\n- fill in anything you did not describe with **typical** choices that were common in their training data.\n\nThat last point matters. If your prompt only says \"a scientist\", the generator tends to pick what was common in its data. You will come back to this when you learn about bias.",
                },
                fr: {
                  heading: 'Du bruit à l’image',
                  body: 'Beaucoup de générateurs d’images actuels utilisent une méthode appelée **diffusion**. (Certains, plus récents, construisent plutôt l’image morceau par morceau, un peu comme un générateur de texte.)\n\n**L’entraînement.** On montre au modèle des centaines de millions d’images, chacune accompagnée d’une légende qui la décrit. On ajoute à chaque image des petits points aléatoires, appelés **bruit**, un peu à la fois, jusqu’à ce qu’il ne reste plus que de la neige, comme sur une vieille télé sans signal. Le modèle apprend à prédire le bruit qui a été ajouté, pour pouvoir l’enlever.\n\n**La génération.** Pour créer une nouvelle image, le modèle part d’un **bruit totalement aléatoire**. Étape par étape, il en retire une partie, et à chaque étape ton **prompt** l’oriente vers une image qui correspond aux mots. Après un certain nombre d’étapes (souvent quelques dizaines), une image apparaît. Pars d’un autre bruit et tu obtiendras une autre image avec le même prompt.\n\n**Les sons fonctionnent de façon semblable.** Les générateurs de musique et de voix apprennent des régularités dans d’immenses collections de sons\u00a0: rythmes, mélodies, instruments, timbre d’une voix. Ils génèrent ensuite de nouveaux sons qui suivent les mêmes régularités. Certains outils peuvent imiter la voix d’une personne à partir d’un court enregistrement\u00a0: c’est pourquoi utiliser la voix de quelqu’un sans son accord n’est jamais acceptable.\n\n**Ce que les générateurs ratent encore.** Comme ils s’appuient sur des régularités et non sur une compréhension, ils peuvent\u00a0:\n\n- déformer le **texte** dans une image (panneaux, étiquettes, couvertures de livres)\u00a0;\n- se tromper dans les **nombres** et les **positions** (cinq chats alors que tu en avais demandé trois)\u00a0;\n- ajouter des **détails bizarres**\u00a0: doigts en trop, objets qui fusionnent, ombres dans le mauvais sens\u00a0;\n- changer l’apparence d’un **personnage** d’une image à l’autre\u00a0;\n- compléter tout ce que tu n’as pas décrit par des choix **typiques**, fréquents dans leurs données d’entraînement.\n\nCe dernier point est important. Si ton prompt dit seulement «\u00a0un scientifique\u00a0», le générateur a tendance à choisir ce qui était fréquent dans ses données. Tu y reviendras quand tu étudieras les biais.',
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
                  title: 'Watch: does AI have creativity and imagination?',
                  caption:
                    "From Code.org's How AI Works series, with guests from the AI companies Runway and OpenAI: how AI generates images and video.",
                  transcript:
                    'In short: AI can now generate art, images and even short videos, so does it have creativity and imagination? The video explains two ways of generating images. In a generative adversarial network (GAN), one model generates images and a second model judges whether they look real, and both improve by competing. In diffusion, a model learns to remove noise from images, then creates new ones by starting from random noise and cleaning it up step by step, guided by a text prompt. The same ideas power tools that turn text into video. The pictures are new, but they come from patterns in training data made by people, so whether this counts as creativity is an open question. Make up your own mind.',
                },
                fr: {
                  title: 'Regarde\u00a0: l’IA a-t-elle de la créativité et de l’imagination\u00a0?',
                  caption:
                    'Une vidéo de la série How AI Works de Code.org, avec des invités des entreprises d’IA Runway et OpenAI\u00a0: comment l’IA génère des images et des vidéos (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: l’IA sait désormais générer des œuvres d’art, des images et même de courtes vidéos. A-t-elle pour autant de la créativité et de l’imagination\u00a0? La vidéo présente deux façons de générer des images. Dans un réseau antagoniste génératif (GAN), un modèle génère des images et un second modèle juge si elles ont l’air réelles\u00a0: les deux progressent en s’affrontant. Avec la diffusion, un modèle apprend à retirer le bruit d’images, puis en crée de nouvelles en partant d’un bruit aléatoire qu’il «\u00a0nettoie\u00a0» étape par étape, guidé par un prompt. Les mêmes idées font fonctionner les outils qui transforment un texte en vidéo. Les images sont nouvelles, mais elles proviennent de régularités tirées de données d’entraînement créées par des humains\u00a0: savoir s’il s’agit de créativité reste une question ouverte. À toi de te faire ton avis\u00a0!',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'X994dDnmRmY',
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
                  heading: 'Try it: what will the generator guess?',
                  body: 'You do not need an image generator for this one: a pencil is enough.\n\n1. Write an image prompt of **one short line**, for example *"a dog on a beach"*.\n2. List **five things** the prompt does not say, which the generator will have to choose for you: the breed and colour of the dog, the time of day, the weather, the style (photo, cartoon, painting), the camera angle...\n3. For each one, write what you think the generator will pick if you say nothing. (Hint: it tends to pick something typical, common in its training data.)\n4. Now rewrite your prompt so that **you** make those choices: *"a small grey dog chasing a red ball on a stormy beach at sunset, cartoon style, seen from low down"*.\n\nCompare your two prompts. Which one leaves more of the creative decisions to you? Keep this page: in Module 2 you will turn this habit into a method.',
                },
                fr: {
                  heading: 'À toi\u00a0: que va deviner le générateur\u00a0?',
                  body: 'Pas besoin de générateur d’images pour cette activité\u00a0: un crayon suffit.\n\n1. Écris un prompt d’image d’**une seule ligne courte**, par exemple *«\u00a0un chien sur une plage\u00a0»*.\n2. Fais la liste de **cinq choses** que le prompt ne précise pas et que le générateur devra choisir à ta place\u00a0: la race et la couleur du chien, le moment de la journée, la météo, le style (photo, dessin animé, peinture), l’angle de vue…\n3. Pour chacune, écris ce que le générateur choisira selon toi si tu ne dis rien. (Indice\u00a0: il a tendance à choisir quelque chose de typique, de fréquent dans ses données d’entraînement.)\n4. Réécris maintenant ton prompt pour que ce soit **toi** qui fasses ces choix\u00a0: *«\u00a0un petit chien gris qui court après une balle rouge sur une plage sous l’orage, au coucher du soleil, style dessin animé, vu d’en bas\u00a0»*.\n\nCompare tes deux prompts. Lequel te laisse le plus de décisions créatives\u00a0? Garde cette feuille\u00a0: dans le module\u00a02, tu transformeras cette habitude en méthode.',
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
                    'Ask the AI tutor to quiz you on this lesson, one question at a time: noise, diffusion, prompts and the mistakes image generators make. Try to answer in your own words before you read its feedback.',
                  starterPrompt:
                    'Quiz me with three questions, one at a time, about how diffusion image generators turn noise into a picture.',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de t’interroger sur cette leçon, une question à la fois\u00a0: le bruit, la diffusion, les prompts et les erreurs des générateurs d’images. Essaie de répondre avec tes propres mots avant de lire son retour.',
                  starterPrompt:
                    'Pose-moi trois questions, une à la fois, sur la façon dont les générateurs d’images par diffusion transforment du bruit en image.',
                },
              },
              data: { tutorMode: 'quiz_me', labToolId: null },
            },
            {
              id: 'm1-l2-b6',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Check what you know about how generative AI creates text, images and sounds.',
                },
                fr: {
                  intro:
                    'Vérifie ce que tu sais sur la façon dont l’IA générative crée du texte, des images et des sons.',
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
                    'Is what an image generator does creative? Give your opinion in three or four sentences, using at least two ideas from this module (training data, patterns, noise, prediction).',
                },
                fr: {
                  prompt:
                    'Ce que fait un générateur d’images, est-ce de la créativité\u00a0? Donne ton avis en trois ou quatre phrases, en utilisant au moins deux notions de ce module (données d’entraînement, régularités, bruit, prédiction).',
                },
              },
              data: { minLength: 100 },
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
            title: 'Prompting like a pro',
            description:
              'Write prompts with a role, a task, context and a format, then test, tweak and log them until the result is what you want.',
          },
          fr: {
            title: 'Écrire des prompts comme un pro',
            description:
              'Écrire des prompts avec un rôle, une tâche, un contexte et un format, puis les tester, les ajuster et les noter dans un journal jusqu’à obtenir le résultat voulu.',
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
                title: 'The four ingredients of a strong prompt',
                summary:
                  'Role, task, context and format: a simple recipe for prompts that give you what you actually want.',
              },
              fr: {
                title: 'Les quatre ingrédients d’un bon prompt',
                summary:
                  'Rôle, tâche, contexte et format\u00a0: une recette simple pour des prompts qui te donnent vraiment ce que tu veux.',
              },
            },
            estimatedMinutes: 25,
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
                  heading: 'Same tool, very different results',
                  body: 'Two students ask the same AI to help with a poster about saving water.\n\n**Student A** types: *"Write about water."*\n\nThe AI produces five long paragraphs about the water cycle, oceans and rain. None of it fits on a poster.\n\n**Student B** types: *"You are a designer of eye-catching school posters. Write the text for a poster that encourages pupils aged 11 to 14 to save water at school. It will hang above the washbasins. Give me a title of five words or fewer, three short tips and a one-line slogan."*\n\nThe AI produces a title, three tips and a slogan, ready to try out.\n\nSame tool, same topic. The difference is the **prompt**: the instructions you give the AI. A generator fills every gap you leave with a guess, so the more clearly you say what you want, the less it has to guess.',
                },
                fr: {
                  heading: 'Même outil, résultats très différents',
                  body: 'Deux élèves demandent à la même IA de les aider à faire une affiche sur les économies d’eau.\n\n**L’élève A** tape\u00a0: *«\u00a0Écris sur l’eau.\u00a0»*\n\nL’IA produit cinq longs paragraphes sur le cycle de l’eau, les océans et la pluie. Rien ne tient sur une affiche.\n\n**L’élève B** tape\u00a0: *«\u00a0Tu es graphiste et tu crées des affiches scolaires qui attirent l’œil. Écris le texte d’une affiche qui encourage les élèves de 11 à 14\u00a0ans à économiser l’eau au collège. Elle sera accrochée au-dessus des lavabos. Donne-moi un titre de cinq mots maximum, trois conseils courts et un slogan d’une ligne.\u00a0»*\n\nL’IA produit un titre, trois conseils et un slogan, prêts à être testés.\n\nMême outil, même sujet. La différence, c’est le **prompt**\u00a0: la consigne que tu donnes à l’IA. Un générateur comble chaque vide que tu laisses par une supposition\u00a0: plus tu dis clairement ce que tu veux, moins il a à deviner.',
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
                  heading: 'Role, task, context, format',
                  body: 'Strong prompts usually contain four ingredients:\n\n| Ingredient | The question it answers | Example |\n|---|---|---|\n| **Role** | What role should the AI play? | *You are a children\'s book author.* |\n| **Task** | What exactly should it do? | *Write the opening paragraph of an adventure story.* |\n| **Context** | What does it need to know? | *The hero is a girl who builds a robot from old bikes. The readers are 9 to 11.* |\n| **Format** | What should the result look like? | *About 80 words, in the present tense, ending with a question.* |\n\nYou do not always need all four, but when a result disappoints you, check which one is missing.\n\nA few more pro tips:\n\n- **Be specific.** "Short" can mean anything; "under 100 words" cannot.\n- **Show an example** of the style you want, if you have one you made yourself.\n- **Say what to avoid**: *"no rhymes"*, *"no scary scenes"*.\n- **One job per prompt.** Break a big project into steps: ideas first, then a plan, then a draft.\n- **Keep personal information out**: no real names, addresses, school names or photos of people. The role is played by the AI; your real life stays out of the prompt.',
                },
                fr: {
                  heading: 'Rôle, tâche, contexte, format',
                  body: 'Les bons prompts contiennent en général quatre ingrédients\u00a0:\n\n| Ingrédient | La question à laquelle il répond | Exemple |\n|---|---|---|\n| **Rôle** | Quel rôle l’IA doit-elle jouer\u00a0? | *Tu es un auteur de livres pour enfants.* |\n| **Tâche** | Que doit-elle faire exactement\u00a0? | *Écris le premier paragraphe d’une histoire d’aventure.* |\n| **Contexte** | Que doit-elle savoir\u00a0? | *L’héroïne est une fille qui construit un robot avec de vieux vélos. Les lecteurs ont entre 9 et 11\u00a0ans.* |\n| **Format** | À quoi doit ressembler le résultat\u00a0? | *Environ 80 mots, au présent, avec une question à la fin.* |\n\nTu n’as pas toujours besoin des quatre, mais quand un résultat te déçoit, vérifie lequel manque.\n\nQuelques astuces de pro en plus\u00a0:\n\n- **Sois précis.** «\u00a0Court\u00a0» peut vouloir dire n’importe quoi\u00a0; «\u00a0moins de 100 mots\u00a0», non.\n- **Montre un exemple** du style que tu veux, si tu en as un que tu as créé toi-même.\n- **Dis ce qu’il faut éviter**\u00a0: *«\u00a0pas de rimes\u00a0»*, *«\u00a0pas de scènes effrayantes\u00a0»*.\n- **Une tâche par prompt.** Découpe un gros projet en étapes\u00a0: d’abord des idées, puis un plan, puis un brouillon.\n- **Pas d’informations personnelles**\u00a0: ni vrais noms, ni adresses, ni noms d’école, ni photos de personnes. Le rôle, c’est l’IA qui le joue\u00a0; ta vie réelle reste en dehors du prompt.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l1-b3',
              type: RICH,
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Watch and observe: one prompt, four versions',
                  body: 'No video this time: follow this replay of a student improving a prompt, step by step. For each version, observe **what changed** and **what that did to the result**.\n\n**Version 1.** *"Write a story about a dragon."*\n\nResult: a 600-word fairy tale with a knight and a princess. Not bad, but nothing like what the student had in mind.\n\n**Version 2.** She adds **context**: *"... about a small dragon who is afraid of fire and lives in a modern city. The readers are aged 10 to 12."*\n\nResult: the right idea, but still 600 words, and the tone is very serious.\n\n**Version 3.** She adds a **format**: *"... Write it in 150 words, in a funny tone."*\n\nResult: the right length and tone. But the ending is predictable: the dragon simply becomes brave.\n\n**Version 4.** She adds a **constraint**: *"... The ending must not be about the dragon becoming brave."*\n\nResult: the dragon becomes the most popular ice-cream seller in the city. The student keeps the idea, rewrites two sentences in her own style and records the four versions in her prompt log.\n\n**What to notice:** each version changed **one ingredient** (context, then format, then a constraint), the student checked the result every time, and the final story still needed a human touch.',
                },
                fr: {
                  heading: 'Observe\u00a0: un prompt, quatre versions',
                  body: 'Pas de vidéo cette fois\u00a0: suis plutôt ce «\u00a0replay\u00a0» d’une élève qui améliore un prompt, étape par étape. Pour chaque version, observe **ce qui a changé** et **l’effet sur le résultat**.\n\n**Version\u00a01.** *«\u00a0Écris une histoire sur un dragon.\u00a0»*\n\nRésultat\u00a0: un conte de 600 mots avec un chevalier et une princesse. Pas mal, mais rien à voir avec ce que l’élève avait en tête.\n\n**Version\u00a02.** Elle ajoute du **contexte**\u00a0: *«\u00a0… sur un petit dragon qui a peur du feu et qui vit dans une ville moderne. Les lecteurs ont entre 10 et 12\u00a0ans.\u00a0»*\n\nRésultat\u00a0: la bonne idée, mais toujours 600 mots, et le ton est très sérieux.\n\n**Version\u00a03.** Elle ajoute un **format**\u00a0: *«\u00a0… Écris-la en 150 mots, sur un ton drôle.\u00a0»*\n\nRésultat\u00a0: la bonne longueur et le bon ton. Mais la fin est prévisible\u00a0: le dragon devient tout simplement courageux.\n\n**Version\u00a04.** Elle ajoute une **contrainte**\u00a0: *«\u00a0… La fin ne doit pas raconter que le dragon devient courageux.\u00a0»*\n\nRésultat\u00a0: le dragon devient le marchand de glaces le plus populaire de la ville. L’élève garde l’idée, réécrit deux phrases avec son propre style et note les quatre versions dans son journal de prompts.\n\n**Ce qu’il faut remarquer\u00a0:** chaque version change **un seul ingrédient** (le contexte, puis le format, puis une contrainte), l’élève vérifie le résultat à chaque fois, et l’histoire finale a quand même eu besoin d’une touche humaine.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l1-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'This short Python program builds a prompt from the four ingredients. Your program is saved, not run, so work out on paper what it would print. Then replace the four values with a prompt for your own idea (a poem, a poster, a comic strip...) and write down the full prompt it would produce. Check: does each ingredient answer its question from the table?',
                  hint: 'The f-string on the second-to-last line puts each value in place of its name between the curly brackets.',
                },
                fr: {
                  instructions:
                    'Ce petit programme Python construit un prompt à partir des quatre ingrédients. Ton programme est enregistré, pas exécuté\u00a0: trouve sur papier ce qu’il afficherait. Remplace ensuite les quatre valeurs (en anglais dans l’exemple) par un prompt en français pour ta propre idée (un poème, une affiche, une bande dessinée…), puis écris le prompt complet qu’il produirait. Vérifie\u00a0: chaque ingrédient répond-il bien à sa question du tableau\u00a0?',
                  hint: 'Dans l’avant-dernière ligne, la f-string remplace chaque nom entre accolades par sa valeur.',
                },
              },
              data: {
                language: 'python',
                starterCode:
                  '# A tiny prompt template. / Un petit modèle de prompt.\n# Saved, not run: what would it print? / Enregistré, pas exécuté. Trouve ce que le programme affiche.\n\nrole = "You are a children\'s book author"\ntask = "Write the opening paragraph of an adventure story"\ncontext = "The hero is a girl who builds a robot from old bikes. The readers are 9 to 11"\noutput_format = "About 80 words, in the present tense, ending with a question"\n\nprompt = f"{role}. {task}. {context}. {output_format}."\nprint(prompt)\n',
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
                    'Paste the prompt you built in the activity above and ask the AI tutor to check it: which of the four ingredients are there, and which one could be clearer? The tutor will not rewrite it for you: improving it is your job.',
                  starterPrompt:
                    'Here is a prompt I wrote. Which of the four ingredients (role, task, context, format) does it have, and which one could be clearer? My prompt:',
                },
                fr: {
                  instructions:
                    'Colle le prompt que tu as construit dans l’activité ci-dessus et demande au tuteur IA de le vérifier\u00a0: quels ingrédients sont présents, et lequel pourrait être plus clair\u00a0? Le tuteur ne le réécrira pas à ta place\u00a0: l’améliorer, c’est ton travail.',
                  starterPrompt:
                    'Voici un prompt que j’ai écrit. Lesquels des quatre ingrédients (rôle, tâche, contexte, format) contient-il, et lequel pourrait être plus clair\u00a0? Mon prompt\u00a0:',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm2-l1-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Rewrite this vague prompt using the four ingredients: "Make a poster about recycling." Then explain which ingredient you think made the biggest difference, and why.',
                },
                fr: {
                  prompt:
                    'Réécris ce prompt trop vague avec les quatre ingrédients\u00a0: «\u00a0Fais une affiche sur le recyclage.\u00a0» Explique ensuite quel ingrédient a fait selon toi la plus grande différence, et pourquoi.',
                },
              },
              data: { minLength: 100 },
            },
          ],
        },
        {
          id: 'm2-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Test, tweak, repeat',
                summary:
                  'Iterate like a creator: diagnose a disappointing result, change one thing and keep a prompt log. With a recipe for image prompts.',
              },
              fr: {
                title: 'Tester, ajuster, recommencer',
                summary:
                  'Itère comme un créateur\u00a0: diagnostique un résultat décevant, change une seule chose et tiens un journal de prompts. Avec une recette pour les prompts d’images.',
              },
            },
            estimatedMinutes: 25,
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
                  heading: 'Nobody gets it right first time',
                  body: 'Designers draw dozens of sketches before the final logo. Writers rewrite. Game studios test a level again and again. Working with generative AI is no different: the first result is a **starting point**, not the finish line.\n\nThe creators who get great results do not have a magic prompt. They **look closely** at what came back, work out **why** it is not right yet and **change their prompt on purpose**. And they keep notes, so they know what worked.',
                },
                fr: {
                  heading: 'Personne ne réussit du premier coup',
                  body: 'Les graphistes font des dizaines de croquis avant le logo final. Les écrivains réécrivent. Les studios de jeux vidéo testent un niveau encore et encore. Avec l’IA générative, c’est pareil\u00a0: le premier résultat est un **point de départ**, pas la ligne d’arrivée.\n\nLes créateurs qui obtiennent de super résultats n’ont pas de prompt magique. Ils **regardent attentivement** ce qu’ils ont obtenu, cherchent **pourquoi** ce n’est pas encore ça et **modifient leur prompt de façon réfléchie**. Et ils prennent des notes, pour savoir ce qui a marché.',
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
                  heading: 'The iteration loop and the image recipe',
                  body: '### The loop\n\n1. **Prompt**: write your best first version.\n2. **Read** the result carefully, like a critic.\n3. **Diagnose**: what exactly is wrong?\n4. **Change one thing** in the prompt, or ask a follow-up: *"Keep the story, but make the ending funnier."*\n5. **Log it**: note the prompt, the result and what you changed.\n\n### Diagnose and fix\n\n| Problem | Try changing... |\n|---|---|\n| Too long, or the wrong shape | the **format**: a word limit, a list, a number of comic panels |\n| Wrong tone or level | the **role**, and the **audience** in the context |\n| Off-topic or too general | the **task** and the **context**: be more specific |\n| Boring or predictable | add a **constraint**, or ask for three different options and pick one |\n| A fact you are not sure of | **do not fix it by prompting**: check it in reliable sources |\n\n### The image recipe\n\nFor a picture, describe the **subject** (who or what), the **setting** (where and when), the **style** (photo, watercolour, pixel art, comic), the **mood** (calm, mysterious, joyful), the **composition** (close-up, wide shot, seen from above) and the important **details** (colours, number of things). Example: *"Three small robots having a picnic in a park in autumn, children\'s book watercolour style, cheerful mood, wide shot, orange and gold leaves."*\n\nOne last trick: ask the AI to ask **you** questions first. *"Before you write anything, ask me three questions about what I want."* Answer about your project only, never with your name, age, school or where you live.',
                },
                fr: {
                  heading: 'La boucle d’itération et la recette des images',
                  body: '### La boucle\n\n1. **Écris** ta meilleure première version du prompt.\n2. **Lis** le résultat attentivement, comme un critique.\n3. **Diagnostique**\u00a0: qu’est-ce qui ne va pas, exactement\u00a0?\n4. **Change une seule chose** dans le prompt, ou relance l’IA avec une nouvelle demande\u00a0: *«\u00a0Garde l’histoire, mais rends la fin plus drôle.\u00a0»*\n5. **Note tout**\u00a0: le prompt, le résultat et ce que tu as changé.\n\n### Diagnostiquer et corriger\n\n| Problème | Essaie de modifier… |\n|---|---|\n| Trop long, ou mauvaise forme | le **format**\u00a0: une limite de mots, une liste, un nombre de cases de BD |\n| Mauvais ton ou mauvais niveau | le **rôle**, et le **public** dans le contexte |\n| Hors sujet ou trop général | la **tâche** et le **contexte**\u00a0: sois plus précis |\n| Ennuyeux ou prévisible | ajoute une **contrainte**, ou demande trois options différentes et choisis-en une |\n| Un fait dont tu doutes | **ne le corrige pas avec un prompt**\u00a0: vérifie-le dans des sources fiables |\n\n### La recette des images\n\nPour une image, décris le **sujet** (qui ou quoi), le **décor** (où et quand), le **style** (photo, aquarelle, pixel art, BD), l’**ambiance** (calme, mystérieuse, joyeuse), le **cadrage** (gros plan, plan large, vu d’en haut) et les **détails** importants (couleurs, nombre d’éléments). Exemple\u00a0: *«\u00a0Trois petits robots qui pique-niquent dans un parc en automne, style aquarelle de livre pour enfants, ambiance joyeuse, plan large, feuilles orange et dorées.\u00a0»*\n\nUne dernière astuce\u00a0: demande à l’IA de **te** poser des questions d’abord. *«\u00a0Avant d’écrire quoi que ce soit, pose-moi trois questions sur ce que je veux.\u00a0»* Réponds seulement sur ton projet, jamais avec ton nom, ton âge, ton école ou l’endroit où tu habites.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b3',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: start your prompt log',
                  body: 'A **prompt log** is your creative diary: it shows the path from a first idea to a finished piece. You will need one for the course project, so start it now.\n\nCopy this table into a notebook or a document:\n\n| # | My prompt | What I got | What was wrong | What I changed next |\n|---|---|---|---|---|\n| 1 | | | | |\n| 2 | | | | |\n| 3 | | | | |\n\n**Practise with this mission:** you need the text for a small card that invites pupils to a school science fair. Use the text tool in the AI Lab if it is available to you, or another AI tool your teacher has approved. Write at least **three versions**, changing one ingredient each time, and fill in a row for each.\n\nNo AI tool available? Do it as a thought experiment: write the three prompts and, for each one, predict what the AI would produce and what it would get wrong. Write *predicted* in the "What I got" column.\n\nRemember: no real names, no school name and no other personal details in your prompts. Write *"our school"* instead.',
                },
                fr: {
                  heading: 'À toi\u00a0: commence ton journal de prompts',
                  body: 'Un **journal de prompts**, c’est ton carnet de création\u00a0: il montre le chemin parcouru entre une première idée et une œuvre finale. Tu en auras besoin pour le projet du cours, alors commence-le dès maintenant.\n\nRecopie ce tableau dans un cahier ou un document\u00a0:\n\n| N° | Mon prompt | Ce que j’ai obtenu | Ce qui n’allait pas | Ce que j’ai changé ensuite |\n|---|---|---|---|---|\n| 1 | | | | |\n| 2 | | | | |\n| 3 | | | | |\n\n**Entraîne-toi avec cette mission\u00a0:** tu dois rédiger le texte d’une petite carte qui invite les élèves à une fête de la science au collège. Utilise l’outil de texte du Labo IA s’il t’est accessible, ou un autre outil d’IA approuvé par ton enseignant. Écris au moins **trois versions**, en changeant un ingrédient à chaque fois, et remplis une ligne pour chacune.\n\nPas d’outil d’IA disponible\u00a0? Fais-en une expérience de pensée\u00a0: écris les trois prompts et, pour chacun, prédis ce que l’IA produirait et ce qu’elle raterait. Écris *prédit* dans la colonne «\u00a0Ce que j’ai obtenu\u00a0».\n\nN’oublie pas\u00a0: ni vrais noms, ni nom d’école, ni aucune autre information personnelle dans tes prompts. Écris plutôt *«\u00a0notre collège\u00a0»*.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b4',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor for a prompt challenge. It describes a result to aim for; you write a prompt that would get there and send it back. Ask which ingredient to improve, then try again and record both versions in your prompt log.',
                  starterPrompt:
                    'Give me a prompt-writing challenge: describe a short poem or a poster that I should get from an AI. After I send my prompt, tell me which of role, task, context and format I could improve.',
                },
                fr: {
                  instructions:
                    'Demande un défi de prompt au tuteur IA. Il décrit un résultat à atteindre\u00a0; tu écris un prompt qui permettrait de l’obtenir et tu le lui envoies. Demande-lui quel ingrédient améliorer, puis réessaie et note les deux versions dans ton journal de prompts.',
                  starterPrompt:
                    'Lance-moi un défi d’écriture de prompt\u00a0: décris un court poème ou une affiche que je dois obtenir d’une IA. Quand je t’aurai envoyé mon prompt, dis-moi lequel des ingrédients (rôle, tâche, contexte, format) je pourrais améliorer.',
                },
              },
              data: { tutorMode: 'challenge_me', labToolId: null },
            },
            {
              id: 'm2-l2-b5',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro: 'Check your prompting skills: ingredients, iteration and fact-checking.',
                },
                fr: {
                  intro:
                    'Teste tes compétences en prompts\u00a0: ingrédients, itération et vérification des faits.',
                },
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
                    'Look back at your prompt log. Which change improved the result the most, and why do you think it worked? What would you try next?',
                },
                fr: {
                  prompt:
                    'Relis ton journal de prompts. Quel changement a le plus amélioré le résultat, et pourquoi, à ton avis, a-t-il fonctionné\u00a0? Que tenterais-tu ensuite\u00a0?',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
      ],
    },
    m4.module,
    m5.module,
    {
      id: 'm3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Create responsibly: your creator project',
            description:
              "The creator's code for generative AI (credit, respect for artists, bias, deepfakes, facts and privacy), then a project you plan, generate, critique and improve.",
          },
          fr: {
            title: 'Créer de façon responsable\u00a0: ton projet de créateur',
            description:
              'Le code du créateur pour l’IA générative (citer l’IA, respecter les artistes, repérer les biais et les deepfakes, vérifier les faits, protéger la vie privée), puis un projet que tu prépares, génères, critiques et améliores.',
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
                title: "The creator's code",
                summary:
                  'Credit, copyright, bias, deepfakes, facts and privacy: six rules for creating with AI without hurting anyone, including you.',
              },
              fr: {
                title: 'Le code du créateur',
                summary:
                  'Citer l’IA, droit d’auteur, biais, deepfakes, faits et vie privée\u00a0: six règles pour créer avec l’IA sans faire de tort à personne, toi compris.',
              },
            },
            estimatedMinutes: 25,
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
                  heading: 'It looked real',
                  body: 'A picture goes round the class group chat: a famous singer, all smiles, in your school canteen. Everyone shares it. The next day it turns out the singer has never set foot in the school: someone made the picture with an image generator in under a minute.\n\nNo big deal? Now imagine the picture showed a classmate doing something embarrassing they never did. Or that a "fact" invented by a chatbot ended up in a class presentation. Or that an artist\'s style was copied without anyone asking them.\n\nGenerative AI makes creating easy, and that includes creating things that are false, unfair or hurtful. Good creators follow a code.',
                },
                fr: {
                  heading: 'Ça avait l’air vrai',
                  body: 'Une image circule dans le groupe de discussion de la classe\u00a0: un chanteur célèbre, tout sourire, dans la cantine du collège. Tout le monde la partage. Le lendemain, on apprend que le chanteur n’a jamais mis les pieds au collège\u00a0: quelqu’un a créé l’image avec un générateur en moins d’une minute.\n\nPas bien grave\u00a0? Imagine maintenant que l’image montre un camarade en train de faire quelque chose de gênant qu’il n’a jamais fait. Ou qu’un «\u00a0fait\u00a0» inventé par un chatbot se retrouve dans un exposé. Ou que le style d’un artiste soit copié sans que personne lui demande son avis.\n\nL’IA générative rend la création facile, y compris la création de choses fausses, injustes ou blessantes. Les bons créateurs suivent un code.',
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
                  heading: "The six rules of the creator's code",
                  body: '1. **Credit the AI.** Say which tool you used and what it did: *"Pictures generated with an AI image tool; story written by me with ideas from a chatbot."* Passing off AI work as entirely your own is dishonest, and in schoolwork it can count as cheating. Follow your teacher\'s rules on when AI is allowed.\n2. **Respect other creators.** Generators learn from millions of works made by people, often without asking them. Many artists object to tools that copy their style when someone types their name, and the rules on AI and copyright are still being debated and differ from country to country. Describe the look you want in your own words instead of naming a living artist, and never upload someone else\'s work without permission.\n3. **Watch for bias.** Models repeat the patterns in their training data, including unfair ones. If "a scientist" or "a doctor" always comes out as the same kind of person, that is bias. Notice it, and make deliberate choices in your prompt.\n4. **Never fake real people.** A **deepfake** is an image, a video or a voice recording of a real person, made with AI, that looks or sounds real. Never make one of anyone, whether a classmate, a teacher or a celebrity. It can hurt people badly, and some deepfakes, such as ones made to bully, trick or embarrass someone, are crimes in many countries. Never share one either: if you see one about someone you know, do not pass it on, and tell a trusted adult.\n5. **Check the facts.** Text generators can invent facts, quotes, statistics and even sources. Check anything important in at least two reliable sources before you use it.\n6. **Protect your privacy.** What you type or upload may be stored and used to improve the tool. Keep out names, addresses, your school, passwords and photos of yourself or anyone else.',
                },
                fr: {
                  heading: 'Les six règles du code du créateur',
                  body: '1. **Cite l’IA.** Indique quel outil tu as utilisé et ce qu’il a fait\u00a0: *«\u00a0Images générées avec un outil d’IA\u00a0; histoire écrite par moi, avec des idées proposées par un chatbot.\u00a0»* Faire passer le travail d’une IA pour le tien est malhonnête, et dans un devoir, cela peut être considéré comme de la triche. Respecte les règles de ton enseignant sur l’utilisation de l’IA.\n2. **Respecte les autres créateurs.** Les générateurs apprennent à partir de millions d’œuvres créées par des humains, souvent sans leur avoir demandé leur avis. Beaucoup d’artistes s’opposent aux outils qui copient leur style quand on tape leur nom, et les règles sur l’IA et le droit d’auteur font encore débat et varient d’un pays à l’autre. Décris le rendu que tu veux avec tes propres mots plutôt que de donner le nom d’un artiste vivant dans ton prompt, et n’envoie jamais l’œuvre de quelqu’un d’autre à un outil sans sa permission.\n3. **Repère les biais.** Les modèles reproduisent les régularités de leurs données d’entraînement, y compris celles qui sont injustes. Si «\u00a0un scientifique\u00a0» ou «\u00a0un médecin\u00a0» donne toujours le même type de personne, c’est un biais. Remarque-le, et fais des choix réfléchis dans ton prompt.\n4. **Ne fabrique jamais de faux contenus avec de vraies personnes.** Un **deepfake** (ou hypertrucage) est une image, une vidéo ou un enregistrement de voix d’une personne réelle, fabriqué avec une IA, qui a l’air vrai. N’en crée jamais, de qui que ce soit\u00a0: ni d’un camarade, ni d’un enseignant, ni d’une célébrité. Cela peut faire beaucoup de mal, et certains deepfakes, par exemple ceux qui servent à harceler, tromper ou humilier quelqu’un, sont punis par la loi dans de nombreux pays. N’en partage jamais non plus\u00a0: si tu en vois un qui concerne quelqu’un que tu connais, ne le fais pas circuler et parles-en à un adulte de confiance.\n5. **Vérifie les faits.** Les générateurs de texte peuvent inventer des faits, des citations, des statistiques et même des sources. Vérifie toute information importante dans au moins deux sources fiables avant de l’utiliser.\n6. **Protège ta vie privée.** Ce que tu tapes ou envoies peut être conservé et servir à améliorer l’outil. N’y mets ni noms, ni adresses, ni le nom de ton école, ni mots de passe, ni photos de toi ou d’autres personnes.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: training data and bias',
                  caption:
                    "From Code.org's How AI Works series: why the data a model learns from shapes everything it produces.",
                  transcript:
                    "In short: the most important part of machine learning is the data used to train it. A lot of that data is collected from people as they use apps and websites, often without them noticing, for example what they choose to watch. If the training data is not big enough or does not represent everyone, the model's predictions will be biased, whether or not the people who trained it meant that to happen. The video's example: a medical model trained mostly on X-rays of men may work less well for women. Before trusting a model, ask two questions: is there enough data, and does it represent all the people and situations the model will be used for? The same goes for generators: they reproduce the patterns, and the gaps, in their data.",
                },
                fr: {
                  title: 'Regarde\u00a0: données d’entraînement et biais',
                  caption:
                    'Une vidéo de la série How AI Works de Code.org\u00a0: pourquoi les données à partir desquelles un modèle apprend influencent tout ce qu’il produit (vidéo en anglais).',
                  transcript:
                    'En bref\u00a0: en apprentissage automatique, ce qui compte le plus, ce sont les données utilisées pour l’entraînement. Une grande partie de ces données est collectée auprès des gens quand ils utilisent des applications et des sites, souvent sans qu’ils s’en rendent compte, par exemple ce qu’ils choisissent de regarder. Si les données d’entraînement ne sont pas assez nombreuses ou ne représentent pas tout le monde, les prédictions du modèle seront biaisées, que les personnes qui l’ont entraîné l’aient voulu ou non. L’exemple de la vidéo\u00a0: un modèle médical entraîné surtout sur des radios d’hommes risque de moins bien fonctionner pour les femmes. Avant de faire confiance à un modèle, pose deux questions\u00a0: y a-t-il assez de données, et représentent-elles toutes les personnes et toutes les situations pour lesquelles le modèle sera utilisé\u00a0? C’est pareil pour les générateurs\u00a0: ils reproduisent les régularités de leurs données, et aussi leurs lacunes.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'x2mRoFNm22g',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm3-l1-b4',
              type: RICH,
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Try it: OK, not OK, or OK if...?',
                  body: 'For each situation, decide: **OK**, **not OK**, or **OK if...** (and finish the sentence). Then compare with a partner or ask the AI tutor, and make up your own mind. Possible answers come further down the lesson.\n\n1. Nina uses a chatbot to brainstorm ten ideas for her story, picks one and writes the story herself.\n2. Karim generates a funny picture of his best friend\'s face on a superhero\'s body and posts it in the class group chat.\n3. Sam asks an image generator for a poster "in the style of" a famous living illustrator, then sells copies at the school fair.\n4. Aya puts a statistic from a chatbot on her poster about plastic in the ocean without checking it.\n5. Noah asks an image generator for "a team of engineers" and every picture shows the same kind of person. He changes his prompt to describe a varied team.\n6. Zoe pastes her full name, her address and a photo of herself into a free AI app to get "a personalised story".',
                },
                fr: {
                  heading: 'À toi\u00a0: acceptable, pas acceptable, ou acceptable si…\u00a0?',
                  body: 'Pour chaque situation, décide\u00a0: **acceptable**, **pas acceptable** ou **acceptable si…** (et termine la phrase). Compare ensuite avec un camarade ou demande l’avis du tuteur IA, puis fais-toi ta propre opinion. Des réponses possibles t’attendent plus bas dans la leçon.\n\n1. Nina utilise un chatbot pour trouver dix idées pour son histoire, en choisit une et écrit l’histoire elle-même.\n2. Karim génère une image drôle avec le visage de son meilleur ami sur le corps d’un super-héros et la publie dans le groupe de la classe.\n3. Sam demande à un générateur une affiche «\u00a0dans le style\u00a0» d’un illustrateur célèbre encore en vie, puis en vend des copies à la kermesse du collège.\n4. Pour son affiche sur le plastique dans l’océan, Aya reprend une statistique donnée par un chatbot, sans la vérifier.\n5. Noah demande à un générateur d’images «\u00a0une équipe d’ingénieurs\u00a0», et toutes les images montrent le même type de personne. Il modifie son prompt pour décrire une équipe variée.\n6. Zoé colle son nom complet, son adresse et une photo d’elle dans une application d’IA gratuite pour obtenir «\u00a0une histoire personnalisée\u00a0».',
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
                    'Ask the AI tutor how to credit AI help in a school project, and ask for an example of a credit line for a poster whose pictures were made with an image generator. Then write your own credit line for the project you are about to start.',
                  starterPrompt:
                    'How should I credit AI help in a school project? Can you give me an example of a credit line for a poster whose pictures were made with an image generator?',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA comment indiquer l’aide de l’IA dans un projet scolaire, et demande-lui un exemple de mention pour une affiche dont les images ont été créées avec un générateur. Écris ensuite ta propre mention pour le projet que tu vas commencer.',
                  starterPrompt:
                    'Comment indiquer l’aide de l’IA dans un projet scolaire\u00a0? Peux-tu me donner un exemple de mention pour une affiche dont les images ont été créées avec un générateur d’images\u00a0?',
                },
              },
              data: { tutorMode: 'give_example', labToolId: null },
            },
            {
              id: 'm3-l1-b6',
              type: RICH,
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  heading: 'Scenario answers',
                  body: "Have you decided on all six situations in the activity above? Compare with these possible answers. Yours may differ, as long as you can explain them.\n\n1. **OK if** Nina says that the AI helped her find ideas.\n2. **Not OK**, even as a joke: it is a fake picture of a real person, shared without his consent.\n3. **Not OK**: describe the style in your own words. Making money by copying a living artist's style is unfair to them.\n4. **Not OK** until Aya has checked the statistic in reliable sources.\n5. **OK**: noticing and correcting bias is good creating.\n6. **Not OK**: personal information and photos stay out of AI tools.",
                },
                fr: {
                  heading: 'Les réponses possibles',
                  body: 'As-tu pris ta décision pour les six situations de l’activité plus haut\u00a0? Compare avec ces réponses possibles. Les tiennes peuvent être différentes, à condition que tu saches les justifier.\n\n1. **Acceptable si** Nina indique que l’IA l’a aidée à trouver des idées.\n2. **Pas acceptable**, même pour rire\u00a0: c’est une fausse image d’une personne réelle, partagée sans son accord.\n3. **Pas acceptable**\u00a0: décris le style avec tes propres mots. Gagner de l’argent en copiant le style d’un artiste vivant n’est pas juste envers lui.\n4. **Pas acceptable** tant qu’Aya n’a pas vérifié la statistique dans des sources fiables.\n5. **Acceptable**\u00a0: repérer et corriger un biais, c’est bien créer.\n6. **Pas acceptable**\u00a0: les informations personnelles et les photos restent en dehors des outils d’IA.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b7',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro: "Check that you know the creator's code before you start your project.",
                },
                fr: {
                  intro:
                    'Vérifie que tu connais le code du créateur avant de commencer ton projet.',
                },
              },
              data: { quizId: 'quiz-m3' },
            },
            {
              id: 'm3-l1-b8',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    "Which rule of the creator's code do you think people your age find hardest to follow, and what would help them follow it?",
                },
                fr: {
                  prompt:
                    'Quelle règle du code du créateur est, selon toi, la plus difficile à respecter pour les jeunes de ton âge, et qu’est-ce qui pourrait les aider à la suivre\u00a0?',
                },
              },
              data: { minLength: 80 },
            },
          ],
        },
        {
          id: 'm3-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Creator project: plan, generate, critique, improve',
                summary:
                  'Make an illustrated short story or a poster with generative AI, keep a prompt log and reflect on what the AI got wrong.',
              },
              fr: {
                title: 'Projet de créateur\u00a0: préparer, générer, critiquer, améliorer',
                summary:
                  'Réalise une histoire courte illustrée ou une affiche avec l’IA générative, tiens un journal de prompts et analyse ce que l’IA a raté.',
              },
            },
            estimatedMinutes: 60,
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
                  heading: 'You are the creative director',
                  body: 'Time to put everything together. In this project you make a small multimedia piece: **an illustrated short story** or **a poster** on a topic you care about.\n\nIn a film studio, the creative director does not draw every frame. They decide what the piece is about, who it is for and how it should feel, give clear instructions, judge every draft and send back whatever is not good enough. That is your job here. The AI produces drafts; **you** make the decisions.\n\nYour **process** counts as much as the result: your plan, your prompt log, your critique and your reflection on what the AI got wrong.',
                },
                fr: {
                  heading: 'C’est toi qui diriges',
                  body: 'C’est le moment de tout rassembler. Dans ce projet, tu réalises une petite œuvre multimédia\u00a0: **une histoire courte illustrée** ou **une affiche** sur un sujet qui te tient à cœur.\n\nDans un studio de cinéma, la directrice ou le directeur artistique ne dessine pas chaque image. Cette personne décide de quoi parle l’œuvre, à qui elle s’adresse et quelle émotion elle doit transmettre, donne des consignes claires, juge chaque brouillon et renvoie tout ce qui n’est pas assez bon. C’est ton rôle ici. L’IA produit des brouillons\u00a0; c’est **toi** qui prends les décisions.\n\nTa **démarche** compte autant que le résultat\u00a0: ton plan, ton journal de prompts, ta critique et ton analyse de ce que l’IA a raté.',
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
                  heading: 'Five steps from idea to finished piece',
                  body: '1. **Plan (without AI).** Choose your format and your topic. Write down your **audience** and your **message** or story idea, and make a rough sketch or outline. Your idea comes first; the AI comes later.\n2. **Generate.** Write prompts with a role, a task, context and a format (or, for pictures, a subject, a setting, a style, a mood and a composition). Record every prompt in your log.\n3. **Critique.** Judge each result with this checklist:\n   - Does it match my plan and my audience?\n   - Are all the facts true? (Check them.)\n   - Any glitches: garbled text, wrong numbers, odd details, a character that changes?\n   - Any bias: who is shown, who is missing, any stereotypes?\n   - Is it original, or does it copy a known work or style too closely?\n4. **Improve.** Change one thing at a time in your prompts, and edit by hand too: rewrite sentences in your own voice, choose and arrange the pictures, add your own drawings. The final piece should be clearly **yours**.\n5. **Show.** Present the final piece with your credit line, your prompt log and your reflection.\n\n**Which AI tools?** Only use AI tools that your teacher or a parent has approved. For text, use the text tool in the AI Lab or another tool your teacher has approved. If no AI tool is available to you, ask your teacher: you may write your prompts and predict what an AI would produce, writing *predicted* in those rows of your log, as in the prompt-log practice of Module 2. If you have no image tool, write the image prompts you would use, then draw or describe the pictures yourself: the thinking is what counts.',
                },
                fr: {
                  heading: 'Cinq étapes, de l’idée à l’œuvre finale',
                  body: '1. **Prépare (sans IA).** Choisis ton format et ton sujet. Note ton **public** et ton **message** ou ton idée d’histoire, et fais un croquis ou un plan rapide. Ton idée passe en premier\u00a0; l’IA vient après.\n2. **Génère.** Écris des prompts avec un rôle, une tâche, un contexte et un format (ou, pour les images, un sujet, un décor, un style, une ambiance et un cadrage). Note chaque prompt dans ton journal.\n3. **Critique.** Juge chaque résultat avec cette liste de vérification\u00a0:\n   - Correspond-il à mon plan et à mon public\u00a0?\n   - Tous les faits sont-ils exacts\u00a0? (Vérifie-les.)\n   - Y a-t-il des défauts\u00a0: texte déformé, mauvais nombre d’éléments, détails bizarres, personnage qui change\u00a0?\n   - Y a-t-il des biais\u00a0: qui est montré, qui est absent, y a-t-il des stéréotypes\u00a0?\n   - Est-ce original, ou est-ce que cela copie de trop près une œuvre ou un style connus\u00a0?\n4. **Améliore.** Change une seule chose à la fois dans tes prompts, et retouche aussi à la main\u00a0: réécris des phrases avec ton propre style, choisis et organise les images, ajoute tes propres dessins. L’œuvre finale doit être clairement **la tienne**.\n5. **Présente.** Montre l’œuvre finale avec ta mention de l’aide de l’IA, ton journal de prompts et ton analyse.\n\n**Quels outils d’IA\u00a0?** N’utilise que des outils d’IA approuvés par ton enseignant ou par tes parents. Pour le texte, utilise l’outil de texte du Labo IA ou un autre outil approuvé par ton enseignant. Si aucun outil d’IA ne t’est accessible, parles-en à ton enseignant\u00a0: tu peux écrire tes prompts et prédire ce qu’une IA produirait, en écrivant *prédit* sur ces lignes de ton journal, comme dans l’exercice du journal de prompts du module\u00a02. Si tu n’as pas d’outil d’images, écris les prompts d’images que tu utiliserais, puis dessine ou décris toi-même les illustrations\u00a0: c’est la réflexion qui compte.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b3',
              type: 'project',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Your creator project. Read the brief and the assessment criteria carefully before you start, and keep your prompt log open while you work.',
                },
                fr: {
                  intro:
                    'Ton projet de créateur. Lis attentivement le sujet et les critères d’évaluation avant de commencer, et garde ton journal de prompts ouvert pendant que tu travailles.',
                },
              },
              data: { projectId: 'project-1' },
            },
            {
              id: 'm3-l2-b4',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'When you have a plan and a few rows of your prompt log for the project below, come back here before you submit it. Paste them and ask the AI tutor for feedback against the critique checklist. It will point out what to improve, not do it for you. Remove any personal information before you paste.',
                  starterPrompt:
                    'Here is my project plan and part of my prompt log. Using this checklist (matches my plan and audience, facts checked, glitches, bias, originality), what is good and what could I improve?',
                },
                fr: {
                  instructions:
                    'Quand tu as un plan et quelques lignes de ton journal de prompts pour le projet ci-dessous, reviens ici avant de l’envoyer. Colle-les et demande au tuteur IA un retour selon la liste de vérification. Il t’indiquera quoi améliorer, sans le faire à ta place. Retire toute information personnelle avant de coller ton texte.',
                  starterPrompt:
                    'Voici le plan de mon projet et une partie de mon journal de prompts. D’après cette liste de vérification (correspond à mon plan et à mon public, faits vérifiés, défauts, biais, originalité), qu’est-ce qui est réussi et que pourrais-je améliorer\u00a0?',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm3-l2-b5',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'What feedback did you get on your project (from the checklist, the tutor or a classmate), what did you change because of it, and what would you do differently in your next AI project?',
                },
                fr: {
                  prompt:
                    'Quels retours as-tu reçus sur ton projet (de la liste de vérification, du tuteur ou d’un camarade), qu’as-tu modifié en conséquence, et que ferais-tu autrement lors de ton prochain projet avec l’IA\u00a0?',
                },
              },
              data: { minLength: 120 },
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
            title: 'How generative AI works',
            instructions:
              'Six questions about text, image and sound generators. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Comment fonctionne l’IA générative',
            instructions:
              'Six questions sur les générateurs de texte, d’images et de sons. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'Each time a large language model adds a word to its answer, what is it doing?',
              },
              fr: {
                prompt:
                  'Chaque fois qu’un grand modèle de langage ajoute un mot à sa réponse, que fait-il\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Looking up the correct answer in a database of facts' },
                  fr: { text: 'Il cherche la bonne réponse dans une base de données de faits' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Predicting a likely next piece of text from patterns learned in training',
                  },
                  fr: {
                    text: 'Il prédit un morceau de texte suivant probable, à partir des régularités apprises pendant l’entraînement',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Thinking about the question the way a person does' },
                  fr: { text: 'Il réfléchit à la question comme le ferait une personne' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Copying a whole answer from a single website' },
                  fr: { text: 'Il copie une réponse entière depuis un seul site web' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'It predicts likely tokens, one after another, and does not think like a person. Even when a chatbot searches the web first, the answer is still written by prediction, so it must be checked.',
              },
              fr: {
                text: 'Il prédit des jetons probables, l’un après l’autre, et ne réfléchit pas comme une personne. Même quand un chatbot fait d’abord une recherche sur le web, la réponse reste écrite par prédiction\u00a0: il faut donc la vérifier.',
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
                  "If a chatbot's answer is well written and sounds confident, it must be true.",
              },
              fr: {
                prompt:
                  'Si la réponse d’un chatbot est bien écrite et rédigée sur un ton assuré, elle est forcément vraie.',
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
                text: 'False. Fluent text is exactly what the model is trained to produce, and it can still contain made-up facts. Check anything important.',
              },
              fr: {
                text: 'Faux. Produire un texte fluide, c’est justement ce pour quoi le modèle est entraîné, et ce texte peut quand même contenir des faits inventés. Vérifie toute information importante.',
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
                  'Which of these are examples of generative AI? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquels de ces exemples relèvent de l’IA générative\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A tool that writes a poem from a prompt' },
                  fr: { text: 'Un outil qui écrit un poème à partir d’un prompt' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A tool that makes a picture from a text description' },
                  fr: { text: 'Un outil qui crée une image à partir d’une description écrite' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A spam filter that sorts emails into spam and not spam' },
                  fr: { text: 'Un filtre antispam qui trie les e-mails en spam et non-spam' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'A tool that composes a short tune in a chosen style' },
                  fr: { text: 'Un outil qui compose une courte mélodie dans le style choisi' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'A calculator adding two numbers' },
                  fr: { text: 'Une calculatrice qui additionne deux nombres' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Generative AI creates new content: text, pictures, music. A spam filter is AI too, but it sorts things instead of creating them, and a calculator follows fixed rules.',
              },
              fr: {
                text: 'L’IA générative crée du contenu nouveau\u00a0: texte, images, musique. Un filtre antispam est aussi une IA, mais il trie au lieu de créer, et une calculatrice applique des règles fixes.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'How does a diffusion image generator create a new picture?' },
              fr: {
                prompt:
                  'Comment un générateur d’images par diffusion crée-t-il une nouvelle image\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'It finds a matching photo on the internet' },
                  fr: { text: 'Il trouve une photo correspondante sur Internet' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'It starts from random noise and removes it step by step, guided by the prompt',
                  },
                  fr: {
                    text: 'Il part d’un bruit aléatoire et le retire étape par étape, guidé par le prompt',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It cuts out pieces of real photos and sticks them together' },
                  fr: { text: 'Il découpe des morceaux de vraies photos et les assemble' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'It sends the prompt to a human artist' },
                  fr: { text: 'Il envoie le prompt à un artiste humain' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Diffusion models learn to remove noise. To generate a picture, they start from pure noise and clean it up step by step, with the prompt steering every step.',
              },
              fr: {
                text: 'Les modèles de diffusion apprennent à retirer du bruit. Pour générer une image, ils partent d’un bruit pur et le «\u00a0nettoient\u00a0» étape par étape, le prompt orientant chaque étape.',
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
                  'What do we call the huge collection of examples that a generative model learns from? (two words)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on l’immense collection d’exemples à partir de laquelle un modèle génératif apprend\u00a0? (deux ou trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'training data',
                'the training data',
                'training set',
                'the training set',
                'training dataset',
                'training examples',
                'dataset',
                'a dataset',
                'the dataset',
                'data set',
              ],
              fr: [
                'données d’entraînement',
                "données d'entraînement",
                'les données d’entraînement',
                "les données d'entraînement",
                'des données d’entraînement',
                "des données d'entraînement",
                'données d’apprentissage',
                "données d'apprentissage",
                'jeu de données',
                'un jeu de données',
              ],
            },
            explanation: {
              en: {
                text: 'Training data: the texts, pictures or sounds the model learns its patterns from. Their quality and variety shape everything the model produces.',
              },
              fr: {
                text: 'Les données d’entraînement\u00a0: les textes, images ou sons dans lesquels le modèle apprend ses régularités. Leur qualité et leur diversité influencent tout ce qu’il produit.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'You send exactly the same prompt twice and get two different answers. Why?',
              },
              fr: {
                prompt:
                  'Tu envoies deux fois exactement le même prompt et tu obtiens deux réponses différentes. Pourquoi\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'The model picks each next token with some randomness among the likely options',
                  },
                  fr: {
                    text: 'Le modèle choisit chaque jeton suivant avec une part de hasard parmi les options probables',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The model was in a different mood the second time' },
                  fr: { text: 'Le modèle était d’une autre humeur la deuxième fois' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Someone at the company rewrites every answer by hand' },
                  fr: { text: 'Quelqu’un dans l’entreprise réécrit chaque réponse à la main' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The model forgot how to answer' },
                  fr: { text: 'Le modèle a oublié comment répondre' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A little randomness in choosing among likely tokens makes each answer different. Models have no moods: they do not feel anything.',
              },
              fr: {
                text: 'Une part de hasard dans le choix parmi les jetons probables rend chaque réponse différente. Un modèle n’a pas d’humeur\u00a0: il ne ressent rien.',
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
            title: 'Prompting like a pro',
            instructions:
              'Six questions about the four ingredients, iteration and checking facts. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Écrire des prompts comme un pro',
            instructions:
              'Six questions sur les quatre ingrédients, l’itération et la vérification des faits. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'Which part of this prompt is the format? "You are a science journalist. Explain how volcanoes erupt to 12-year-old pupils who are new to the topic, in five short bullet points."',
              },
              fr: {
                prompt:
                  'Quelle partie de ce prompt est le format\u00a0? «\u00a0Tu es journaliste scientifique. Explique comment les volcans entrent en éruption à des élèves de 12\u00a0ans qui découvrent le sujet, en cinq points courts.\u00a0»',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'You are a science journalist' },
                  fr: { text: 'Tu es journaliste scientifique' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Explain how volcanoes erupt' },
                  fr: { text: 'Explique comment les volcans entrent en éruption' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'to 12-year-old pupils who are new to the topic' },
                  fr: { text: 'à des élèves de 12\u00a0ans qui découvrent le sujet' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'in five short bullet points' },
                  fr: { text: 'en cinq points courts' },
                },
              },
            ],
            correctOptionIndexes: [3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The format says what the result should look like: five short bullet points. The journalist is the role, explaining volcanoes is the task and the pupils are the context.',
              },
              fr: {
                text: 'Le format indique à quoi doit ressembler le résultat\u00a0: cinq points courts. Le journaliste est le rôle, expliquer les volcans est la tâche et les élèves sont le contexte.',
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
                  'Which changes would improve the prompt "Make a poster about recycling"? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Quelles modifications amélioreraient le prompt «\u00a0Fais une affiche sur le recyclage\u00a0»\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Say who the poster is for, for example pupils aged 11 to 14' },
                  fr: {
                    text: 'Préciser à qui s’adresse l’affiche, par exemple à des élèves de 11 à 14\u00a0ans',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Say what it should contain: a title, three tips and a slogan' },
                  fr: {
                    text: 'Préciser ce qu’elle doit contenir\u00a0: un titre, trois conseils et un slogan',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Add your home address to make it personal' },
                  fr: { text: 'Ajouter ton adresse pour la personnaliser' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Explain where it will hang: next to the bins in the canteen' },
                  fr: {
                    text: 'Expliquer où elle sera affichée\u00a0: à côté des poubelles de la cantine',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Write the prompt in capital letters so the AI tries harder' },
                  fr: { text: 'Écrire le prompt en majuscules pour que l’IA fasse plus d’efforts' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The audience, the content and the place give the AI context and a format. Personal details never belong in a prompt, and capital letters do not make a model try harder: it makes no effort and feels no urgency.',
              },
              fr: {
                text: 'Le public, le contenu et le lieu donnent à l’IA un contexte et un format. Les informations personnelles n’ont rien à faire dans un prompt, et les majuscules ne font pas «\u00a0travailler plus\u00a0» un modèle\u00a0: il ne fait pas d’efforts et ne ressent aucune urgence.',
              },
            },
          },
          {
            id: 'q3',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'When a result is not what you wanted, a good strategy is to change one thing at a time and note what happened.',
              },
              fr: {
                prompt:
                  'Quand un résultat ne te convient pas, une bonne stratégie consiste à changer une seule chose à la fois et à noter ce qui s’est passé.',
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
                text: 'True. Changing one thing at a time shows you which change made the difference, and your prompt log keeps track of it.',
              },
              fr: {
                text: 'Vrai. En changeant une seule chose à la fois, tu sais quelle modification a fait la différence, et ton journal de prompts en garde la trace.',
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
                  'The story the AI wrote is three times too long. Which ingredient should you change first?',
              },
              fr: {
                prompt:
                  'L’histoire écrite par l’IA est trois fois trop longue. Quel ingrédient dois-tu modifier en premier\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The format: give a word limit' },
                  fr: { text: 'Le format\u00a0: donner un nombre de mots maximum' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The role: ask for a different author' },
                  fr: { text: 'Le rôle\u00a0: demander un autre auteur' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'None: send exactly the same prompt again' },
                  fr: { text: 'Aucun\u00a0: renvoyer exactement le même prompt' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'None: longer is always better' },
                  fr: { text: 'Aucun\u00a0: plus c’est long, mieux c’est' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Length is part of the format. "Under 150 words" is a clear instruction that the model can usually follow, roughly (check the length anyway); sending the same prompt again leaves the length to chance.',
              },
              fr: {
                text: 'La longueur fait partie du format. «\u00a0Moins de 150 mots\u00a0» est une instruction claire que le modèle suit en général à peu près (vérifie quand même la longueur)\u00a0; renvoyer le même prompt, c’est laisser la longueur au hasard.',
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
                  'What do we call the record of each prompt you tried, what you got and what you changed? (two words)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on le document où tu notes chaque prompt essayé, ce que tu as obtenu et ce que tu as changé\u00a0? (trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'prompt log',
                'a prompt log',
                'the prompt log',
                'my prompt log',
                'prompt-log',
                'prompt logs',
                'log',
                'a log',
                'the log',
                'prompt diary',
              ],
              fr: [
                'journal de prompts',
                'un journal de prompts',
                'le journal de prompts',
                'journal de prompt',
                'un journal de prompt',
                'le journal de prompt',
                'journal des prompts',
                'journal',
                'un journal',
                'le journal',
              ],
            },
            explanation: {
              en: {
                text: 'A prompt log: it shows your process and helps you see which changes worked. You will need one for the project.',
              },
              fr: {
                text: 'Un journal de prompts\u00a0: il montre ta démarche et t’aide à voir quels changements ont fonctionné. Tu en auras besoin pour le projet.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'An AI gave you a statistic for your poster, but you are not sure it is true. What should you do?',
              },
              fr: {
                prompt:
                  'Une IA t’a donné une statistique pour ton affiche, mais tu as un doute sur son exactitude. Que dois-tu faire\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Ask the same AI "Are you sure?" and trust its reply' },
                  fr: {
                    text: 'Demander à la même IA «\u00a0Tu es sûre\u00a0?\u00a0» et croire sa réponse',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Check it in at least two reliable sources' },
                  fr: { text: 'La vérifier dans au moins deux sources fiables' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Use it anyway: a poster does not need to be accurate' },
                  fr: {
                    text: 'L’utiliser quand même\u00a0: une affiche n’a pas besoin d’être exacte',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Make the prompt longer until the number changes' },
                  fr: { text: 'Allonger le prompt jusqu’à ce que le nombre change' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Asking the AI again is not checking: it can confirm a wrong answer just as fluently. To check, use reliable sources such as an encyclopedia or an expert organisation.',
              },
              fr: {
                text: 'Redemander à l’IA, ce n’est pas vérifier\u00a0: elle peut confirmer une erreur avec la même assurance. Pour vérifier, consulte des sources fiables, comme une encyclopédie ou un organisme spécialisé.',
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
            title: "The creator's code",
            instructions:
              'Six questions about creating with AI responsibly. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Le code du créateur',
            instructions:
              'Six questions sur la création responsable avec l’IA. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
              en: { prompt: 'What is a deepfake?' },
              fr: { prompt: 'Qu’est-ce qu’un deepfake (ou hypertrucage)\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'An image, video or voice recording of a real person, made with AI, that looks or sounds real',
                  },
                  fr: {
                    text: 'Une image, une vidéo ou un enregistrement de voix d’une personne réelle, fabriqué avec une IA, qui a l’air vrai',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Any picture made with an AI image generator, such as a dragon in space',
                  },
                  fr: {
                    text: 'N’importe quelle image créée par un générateur d’images, comme un dragon dans l’espace',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A made-up news story written by a chatbot' },
                  fr: { text: 'Un faux article de presse écrit par un chatbot' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'A kind of computer virus' },
                  fr: { text: 'Une sorte de virus informatique' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "Not every AI picture is a deepfake: a deepfake imitates a real person's face, body or voice. Making or sharing one without their consent can hurt people badly, and in many countries it can be against the law.",
              },
              fr: {
                text: 'Une image créée par une IA n’est pas forcément un deepfake\u00a0: un deepfake imite le visage, le corps ou la voix d’une personne réelle. En créer ou en partager un sans son accord peut faire beaucoup de mal, et cela peut être illégal dans de nombreux pays.',
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
                  'Which are responsible ways to use generative AI in a school project? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquelles de ces façons d’utiliser l’IA générative dans un projet scolaire sont responsables\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Saying which parts the AI helped with, and how' },
                  fr: { text: 'Indiquer pour quelles parties tu as utilisé l’IA, et comment' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Checking facts from the AI in reliable sources' },
                  fr: { text: 'Vérifier dans des sources fiables les faits donnés par l’IA' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: "Uploading a classmate's photo to make a funny fake picture" },
                  fr: {
                    text: 'Envoyer la photo d’un camarade à une IA pour en faire une fausse image drôle',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Keeping your name, address and school out of your prompts' },
                  fr: {
                    text: 'Ne jamais mettre ton nom, ton adresse ou ton école dans tes prompts',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Presenting AI-written text as entirely your own' },
                  fr: {
                    text: 'Présenter un texte écrit par l’IA comme si tu l’avais entièrement écrit toi-même',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "Crediting, checking and protecting privacy are part of the creator's code. Fake pictures of real people and hidden AI help are not.",
              },
              fr: {
                text: 'Citer l’IA, vérifier et protéger la vie privée font partie du code du créateur. Les fausses images de vraies personnes et l’aide de l’IA dissimulée, non.',
              },
            },
          },
          {
            id: 'q3',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'An image generator can show bias, for example by always showing the same kind of person for the prompt "a scientist".',
              },
              fr: {
                prompt:
                  'Un générateur d’images peut montrer des biais, par exemple en représentant toujours le même type de personne pour le prompt «\u00a0un scientifique\u00a0».',
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
                text: 'True. It repeats the patterns in its training data, including unfair ones. You can notice this and describe what you want more precisely.',
              },
              fr: {
                text: 'Vrai. Il reproduit les régularités de ses données d’entraînement, y compris celles qui sont injustes. Tu peux le remarquer et décrire plus précisément ce que tu veux.',
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
                  'Why might an image generator show mostly one kind of person for the prompt "a doctor"?',
              },
              fr: {
                prompt:
                  'Pourquoi un générateur d’images pourrait-il montrer surtout un seul type de personne pour le prompt «\u00a0un médecin\u00a0»\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'In its training data, most pictures of doctors showed that kind of person',
                  },
                  fr: {
                    text: 'Dans ses données d’entraînement, la plupart des images de médecins montraient ce type de personne',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It has personal opinions about doctors' },
                  fr: { text: 'Il a des opinions personnelles sur les médecins' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It is pure coincidence' },
                  fr: { text: 'C’est une pure coïncidence' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'All doctors look the same' },
                  fr: { text: 'Tous les médecins se ressemblent' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Models have no opinions. They reproduce what was common in their data, so unbalanced data leads to unbalanced pictures.',
              },
              fr: {
                text: 'Un modèle n’a pas d’opinions. Il reproduit ce qui était fréquent dans ses données\u00a0: des données déséquilibrées donnent des images déséquilibrées.',
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
                  'When you have used an AI tool in your work, you should say so in a short line, just as you would for a source. Which verb starting with "c" means doing this? (one word)',
              },
              fr: {
                prompt:
                  'Quand tu as utilisé un outil d’IA dans ton travail, tu dois le signaler en une courte phrase, comme pour une source. Quel verbe commençant par «\u00a0c\u00a0» désigne cette action\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'credit',
                'cite',
                'crediting',
                'citing',
                'credited',
                'cited',
                'credit it',
                'cite it',
                'credit the ai',
                'cite the ai',
              ],
              fr: [
                'citer',
                'citer l’ia',
                "citer l'ia",
                'cite l’ia',
                "cite l'ia",
                'créditer',
                'crédite',
                'créditer l’ia',
                "créditer l'ia",
                'le citer',
              ],
            },
            explanation: {
              en: {
                text: 'Credit it (or cite it): say which tool you used and what it did. That is honest, and it is how professional creators work.',
              },
              fr: {
                text: 'Citer (ou créditer)\u00a0: indiquer quel outil tu as utilisé et ce qu’il a fait. C’est honnête, et c’est ainsi que travaillent les créateurs professionnels.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'You would like your poster to look like the work of a famous living illustrator. What is the most responsible choice?',
              },
              fr: {
                prompt:
                  'Tu voudrais que ton affiche ressemble au travail d’un illustrateur célèbre encore en vie. Quel est le choix le plus responsable\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Describe the look you want (colours, mood, technique) in your own words, without naming the artist',
                  },
                  fr: {
                    text: 'Décrire le rendu voulu (couleurs, ambiance, technique) avec tes propres mots, sans mettre le nom de l’artiste dans le prompt',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: "Upload one of the artist's drawings and say the AI made it" },
                  fr: {
                    text: 'Envoyer un dessin de l’artiste à l’IA et dire que c’est l’IA qui l’a fait',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: "Put the artist's name in the prompt and sell the posters" },
                  fr: { text: 'Mettre le nom de l’artiste dans le prompt et vendre les affiches' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Anything goes, because the AI made the picture' },
                  fr: { text: 'Tout est permis, puisque c’est l’IA qui a fait l’image' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Many artists object to AI copying their style by name, and the rules on AI and copyright are still being debated. Describing the look in your own words is fairer, and it helps you build your own style.',
              },
              fr: {
                text: 'Beaucoup d’artistes s’opposent à ce que l’IA copie leur style à partir de leur nom, et les règles sur l’IA et le droit d’auteur font encore débat. Décrire le rendu avec tes propres mots est plus juste, et t’aide à construire ton propre style.',
              },
            },
          },
        ],
      },
    },
    ...m4.quizzes,
    ...m5.quizzes,
  ],

  projects: [
    {
      id: 'project-1',
      input: {
        kind: 'project',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Creator project: an AI-assisted story or poster',
            brief:
              'Plan, generate, critique and improve a small multimedia piece made with the help of generative AI. Choose one: an illustrated short story of 150 to 300 words with two or three illustrations, or a poster that informs or persuades, on a topic you care about (saving water, a school club, a healthy habit...), with a title, a short text and one or two images. You are the creative director: the idea, the plan and the final choices are yours, and the AI produces drafts that you test, question and improve. Use only AI tools approved by your teacher or a parent. For text, use the text tool in the AI Lab or another tool your teacher has approved. If no AI tool is available to you, ask your teacher: you may write your prompts and predict what an AI would produce, writing "predicted" in those rows of your prompt log, as in the prompt-log practice of Module 2. If you have no image generator, write the image prompts you would use, then draw or describe the pictures yourself.',
            requirements:
              "Submit five things. 1) Your final piece: the full text of your story or poster and, for each picture, the prompt you used or a one-line description of it. 2) Your plan: audience, message or story idea, and a short outline written before you used AI. 3) Your prompt log, with at least five prompts and, for each one, what you got (or what you predicted, marked 'predicted') and what you changed next. 4) A reflection of 100 to 200 words: what the AI got wrong or did badly (a fact, a bias, a glitch, a style that did not fit), how you fixed it, and which part of the piece is most yours. 5) A credit line that says which AI tools you used and what they did. How to submit: choose Text and paste the five parts in that order, so that your teacher can read everything. If you have pictures (generated images, or photos of your own drawings or of your sketch), add them as images, after checking that no face, name or school logo shows. Use a link only to a document your teacher set up or one shared through your school account. Before you submit, get feedback with the Check my work activity in this lesson. Rules: no personal information (names, addresses, school, photos of yourself or others) in your prompts or your piece; no pictures or voices of real people; every fact checked in reliable sources. How it is assessed: Creativity (an original idea, told in your own voice); Technical quality (a finished, coherent piece and a prompt log that shows real improvement); Understanding (your reflection explains the AI's mistakes with what you learned about how generative AI works); Responsible use of AI (AI help credited, privacy protected, facts checked, bias and fairness considered).",
          },
          fr: {
            title: 'Projet de créateur\u00a0: une histoire ou une affiche avec l’IA',
            brief:
              'Prépare, génère, critique et améliore une petite œuvre multimédia réalisée avec l’aide de l’IA générative. Au choix\u00a0: une histoire courte illustrée de 150 à 300 mots avec deux ou trois illustrations, ou une affiche qui informe ou qui convainc, sur un sujet qui te tient à cœur (économiser l’eau, un club du collège, une bonne habitude de santé…), avec un titre, un court texte et une ou deux images. C’est toi qui diriges\u00a0: l’idée, le plan et les choix finaux t’appartiennent, et l’IA produit des brouillons que tu testes, remets en question et améliores. N’utilise que des outils d’IA approuvés par ton enseignant ou par tes parents. Pour le texte, utilise l’outil de texte du Labo IA ou un autre outil approuvé par ton enseignant. Si aucun outil d’IA ne t’est accessible, parles-en à ton enseignant\u00a0: tu peux écrire tes prompts et prédire ce qu’une IA produirait, en écrivant «\u00a0prédit\u00a0» sur ces lignes de ton journal de prompts, comme dans l’exercice du module\u00a02. Si tu n’as pas de générateur d’images, écris les prompts d’images que tu utiliserais, puis dessine ou décris toi-même les illustrations.',
            requirements:
              'Envoie cinq éléments. 1) Ton œuvre finale\u00a0: le texte complet de ton histoire ou de ton affiche et, pour chaque image, le prompt utilisé ou une description en une ligne. 2) Ton plan\u00a0: public, message ou idée d’histoire, et les grandes lignes de ton œuvre, rédigées avant d’utiliser l’IA. 3) Ton journal de prompts, avec au moins cinq prompts et, pour chacun, ce que tu as obtenu (ou ce que tu avais prédit, avec la mention «\u00a0prédit\u00a0») et ce que tu as changé ensuite. 4) Une analyse de 100 à 200 mots\u00a0: ce que l’IA a raté ou mal fait (un fait, un biais, un défaut, un style qui ne convenait pas), comment tu l’as corrigé, et quelle partie de l’œuvre t’appartient le plus. 5) Une mention qui indique quels outils d’IA tu as utilisés et ce qu’ils ont fait. Comment envoyer ton projet\u00a0: choisis «\u00a0Texte\u00a0» et colle les cinq éléments dans cet ordre, pour que ton enseignant puisse tout lire. Si tu as des images (images générées, ou photos de tes propres dessins ou de ton croquis), ajoute-les en tant qu’images, après avoir vérifié qu’aucun visage, aucun nom ni aucun logo d’école n’apparaît. N’utilise un lien que vers un document préparé par ton enseignant ou partagé avec ton compte scolaire. Avant d’envoyer ton projet, demande un retour avec l’activité «\u00a0Vérifie mon travail\u00a0» de cette leçon. Règles\u00a0: aucune information personnelle (noms, adresses, école, photos de toi ou d’autres personnes) dans tes prompts ni dans ton œuvre\u00a0; aucune image ni voix de personnes réelles\u00a0; chaque fait vérifié dans des sources fiables. Critères d’évaluation\u00a0: Créativité (une idée originale, racontée avec ta propre voix)\u00a0; Qualité technique (une œuvre terminée et cohérente, et un journal de prompts qui montre de vraies améliorations)\u00a0; Compréhension (ton analyse explique les erreurs de l’IA à l’aide de ce que tu as appris sur le fonctionnement de l’IA générative)\u00a0; Usage responsable de l’IA (aide de l’IA citée, vie privée protégée, faits vérifiés, biais et équité pris en compte).',
          },
        },
        allowedSubmissionTypes: ['text', 'image', 'pdf', 'link'],
        rubric: [
          { key: 'creativity', weight: 25 },
          { key: 'technicalQuality', weight: 25 },
          { key: 'understanding', weight: 25 },
          { key: 'responsibleAi', weight: 25 },
        ],
        xpReward: 400,
        requiredForCertificate: true,
      },
    },
    ...m4.projects,
    ...m5.projects,
  ],
};
