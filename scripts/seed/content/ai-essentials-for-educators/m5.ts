// Module m5 of "AI Essentials for Educators" (teachers of pupils aged 8 to 18): teaching machine
// learning hands-on with Machine Learning for Kids (machinelearningforkids.co.uk, free and open
// source, by Dale Lane). It comes after m4 (safe and effective AI in the classroom) and before m6
// (inclusive and creative AI). It builds on m1 (models learn patterns, they do not understand),
// m3 (assess the process, not only the product), m4-l1 (personal data, approved tools, the
// school's data-protection lead) and m4-l2 (the drawing-classifier class, age bands and the
// LEARN -> TRY -> BUILD -> GET FEEDBACK -> IMPROVE -> SHOW cycle). A teacher course has no project
// block: each 'build' stage is a reflection in which teachers plan for their own class.
// m5-l1: what the site is; its worksheets (CC BY-NC-SA 4.0: adapt for non-commercial teaching
// with credit and the same licence); its three ways in, as its own sign-up, login and help pages
// describe them (IBM/taxinomitis, commit f360de1): "Try it now" (no account, no personal
// information collected according to the site, one project at a time, deleted after a few hours,
// the site says at least four; a Cloudflare Turnstile check first, which its error message says can
// fail behind a VPN, a privacy extension or a strict school network, suggesting that
// challenges.cloudflare.com be allowed); a teacher's own "unmanaged" class account (IBM Cloud API
// keys only for text projects; at sign-up the teacher accepts responsibility for any IBM Cloud
// charges; pupils cannot sign up themselves; a pupil account holds a username only); a "managed"
// class account that the site's author sets up on request by email, offered only to schools and
// not-for-profit coding clubs (described neutrally, never promised); free 'Lite' API keys, charges
// only if the teacher pays IBM for higher limits (sign-up page and API-keys guide). Storage, as the
// site's data-protection help describes it: each project is stored where the pupil chooses when
// creating it, "In your web browser" (IndexedDB, nothing on the site's servers) or "In the cloud"
// (IBM Cloud, Dallas, United States); text projects also send a copy of their training examples to
// IBM Watson. m5-l1-b6 step 2 has teachers pick the browser option (French UI: Stockage, Dans votre
// navigateur web, from fr.json). Minimum examples to train a text model: five per label
// (models.controller.js), used in the 45-minute variant of m5-l1-b4.
// Privacy: the site calls the school the data controller, with its own hedge (for transparency,
// not a legal determination, which may vary by jurisdiction); usernames, not names; no personal data
// or photos of pupils; webcam and microphone rules; parents informed (some teacher's notes suggest
// parental permission before webcam or photo activities); rules for language. A 45 to 60-minute
// plan and a fallback (class screen, or a paper version), with the Smart Classroom teacher's
// notes linked in m5-l1-b4 (English and French PDFs). The video reuses OeU5m6vRyCk (Code.org,
// "What is machine learning?", curated in my-first-ai-adventure m1-l2) as a hook teachers can
// show. The ML4K activity, done by the teacher as a learner: Smart Classroom, quick "Try it now"
// version (worksheet-smartclassroom-tryitnow.pdf; text; Scratch 3; try_it_now). The worksheet's
// four label names (fan on, fan off, lamp on, lamp off) are kept so that the teacher's screen
// matches the worksheet's steps (the Smart Classroom (easy) template itself works with any label
// names, since the learner swaps its rules for the project's label blocks); French text therefore
// cites these English label names too (m5-l2-b4, m5-l2-b6). The example sentences are our
// own. French UI labels (Essayer maintenant, Entraîner, Apprendre & Tester, Faire, Langue) come
// from the site's fr.json. Reflections: the account, consent and data plan (build), then what
// doing the activity changed (reflect).
// m5-l2: evidence (screenshot, test table of new inputs with the confidence score, 0 to 100 on
// this site, one mistake explained, one change and its effect), a four-criterion rubric on the
// beginning / secure / advanced levels of m2-l1, three misconceptions (the computer understands;
// more data is always better; 100% accuracy), bias discussion prompts, a written replay of
// marking one hand-in, and a table of seven worksheets (links only, no worksheet text) with the
// type and level of the site's catalogue: Mailman Max, Smart Classroom, Make me happy, Fooled,
// Tourist Info, Zombie Escape! (advanced on the site, intermediate in its teacher's notes) and
// Chatbots (Python). The ages in that table are our suggestion and say so. Then the module quiz
// quiz-m5 (six questions) and two reflections.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m5: SeedModulePart = {
  module: {
    id: 'm5',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Teaching machine learning hands-on',
          description:
            'Run a hands-on Machine Learning for Kids lesson safely, from the choice of account to privacy and consent, then assess what pupils build: evidence, a simple rubric, common misconceptions and bias.',
        },
        fr: {
          title: 'Enseigner l’apprentissage automatique par la pratique',
          description:
            'Mener en toute sécurité une séance pratique avec Machine Learning for Kids, du choix du compte à la protection des données et au consentement, puis évaluer ce que construisent les élèves\u00a0: traces d’apprentissage, grille simple, idées fausses fréquentes et biais.',
        },
      },
    },
    lessons: [
      {
        id: 'm5-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Run a Machine Learning for Kids lesson',
              summary:
                'Choose how pupils reach Machine Learning for Kids and what the site may keep, plan a 45 to 60-minute session with a fallback, and try the Smart Classroom activity yourself.',
            },
            fr: {
              title: 'Mener une séance avec Machine Learning for Kids',
              summary:
                'Choisissez comment vos élèves accèdent à Machine Learning for Kids et ce que le site peut conserver, préparez une séance de 45 à 60\u00a0minutes avec une solution de repli, et testez vous-même l’activité Smart Classroom.',
            },
          },
          estimatedMinutes: 45,
          xpReward: 50,
        },
        blocks: [
          {
            id: 'm5-l1-b1',
            type: RICH,
            stage: 'discover',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'From a drawing classifier to your own lesson',
                body: 'In module 4 you met a class that trained a classifier on their own drawings, saw it fail on another class’s drawings and worked out why. Free tools such as Machine Learning for Kids put that lesson within reach of any teacher, even one with no programming background.\n\nBefore the first pupil types anything, answer three questions: **how will pupils get in**, **what will the site keep about them**, and **what if it is blocked** on the school network? Then do a short activity exactly as your pupils would: the best way to find out where they will get stuck.',
              },
              fr: {
                heading: 'Du classificateur de dessins à votre propre séance',
                body: 'Au module 4, vous avez rencontré une classe qui entraînait un classificateur sur ses propres dessins, constatait qu’il échouait sur ceux d’une autre classe et cherchait pourquoi. Des outils gratuits comme Machine Learning for Kids mettent ce type de séance à la portée de tout enseignant, même sans connaissance en programmation.\n\nAvant que le premier élève ne tape quoi que ce soit, répondez à trois questions\u00a0: **comment les élèves accéderont-ils au site**, **que conservera-t-il à leur sujet**, et **que faire s’il est bloqué** par le réseau de l’établissement\u00a0? Faites ensuite une courte activité exactement comme vos élèves\u00a0: le meilleur moyen de savoir où ils vont bloquer.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b2',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'What Machine Learning for Kids is, and three ways in',
                body: '**Machine Learning for Kids** is a free, open-source website created by Dale Lane. Pupils collect examples (sentences, drawings, numbers or sounds), sort them under labels, train a model and use it in Scratch or Python: module 1 in practice, since the model learns patterns and understands nothing. Its worksheets (more than fifty, each about one lesson long, almost all in English) are shared under a Creative Commons non-commercial licence (CC BY-NC-SA 4.0): you may adapt them for teaching if you credit the author and share any adaptation on the same terms.\n\n| Way in | What the site keeps | Watch out for |\n|---|---|---|\n| **Try it now** (no account) | No personal information, the site says; one project at a time, deleted after a few hours | Save evidence during the lesson. An automatic Cloudflare check runs first and can fail on a filtered network |\n| **Your own class account** ("unmanaged") | Your username and email; a username per pupil (pupils cannot sign up themselves); projects, until you delete them | Text projects need IBM Cloud API keys (codes that let the site use IBM’s services on your account); you accept responsibility for any IBM Cloud charges |\n| **Managed class account**, set up by the site’s author on request by email | As above; the API keys are managed for you | Offered only to schools and not-for-profit coding clubs: allow time for a reply, and plan without it |\n\nAccording to the site’s help pages, projects kept in an account are stored on IBM Cloud in the United States, and text projects are trained with an IBM Watson service.\n\n**Which one?** For a first lesson, Try it now: it is the simplest and keeps the least. Move to class accounts only when a project must outlast a lesson, and once your school agrees.',
              },
              fr: {
                heading: 'Machine Learning for Kids, et trois façons d’y accéder',
                body: '**Machine Learning for Kids** est un site web gratuit et open source créé par Dale Lane. Les élèves rassemblent des exemples (phrases, dessins, nombres ou sons), les classent sous des étiquettes, entraînent un modèle et l’utilisent dans Scratch ou en Python\u00a0: c’est le module 1 en pratique, car le modèle apprend des régularités sans rien comprendre. Ses fiches (plus de cinquante, d’une séance environ chacune, presque toutes en anglais) sont diffusées sous une licence Creative Commons non commerciale (CC BY-NC-SA 4.0)\u00a0: vous pouvez les adapter pour enseigner en citant l’auteur et en partageant toute adaptation sous la même licence.\n\n| Mode d’accès | Ce que le site conserve | Points de vigilance |\n|---|---|---|\n| **Essayer maintenant** (*Try it now*, sans compte) | Aucune information personnelle, selon le site\u00a0; un seul projet à la fois, effacé au bout de quelques heures | Enregistrer les traces pendant la séance. Une vérification automatique de Cloudflare a lieu d’abord et peut échouer sur un réseau filtré |\n| **Votre propre compte de classe** (compte «\u00a0non géré\u00a0») | Votre nom d’utilisateur et votre e-mail\u00a0; un nom d’utilisateur par élève (les élèves ne peuvent pas s’inscrire eux-mêmes)\u00a0; les projets, jusqu’à ce que vous les supprimiez | Les projets de texte demandent des clés d’API IBM Cloud (des codes qui permettent au site d’utiliser les services d’IBM sur votre compte)\u00a0; vous acceptez la responsabilité d’éventuels frais IBM Cloud |\n| **Compte de classe géré**, créé par l’auteur du site sur demande par e-mail | Comme ci-dessus\u00a0; les clés d’API sont gérées pour vous | Réservé aux établissements scolaires et aux clubs de programmation à but non lucratif\u00a0: prévoyez un délai de réponse, et un plan qui s’en passe |\n\nSelon les pages d’aide du site, les projets conservés dans un compte sont stockés sur IBM Cloud aux États-Unis, et les projets de texte sont entraînés avec un service IBM Watson.\n\n**Lequel choisir\u00a0?** Pour une première séance, «\u00a0Essayer maintenant\u00a0»\u00a0: c’est le plus simple, et celui qui conserve le moins. Ne passez aux comptes de classe que lorsqu’un projet doit durer plus d’une séance, et avec l’accord de votre établissement.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Privacy and consent: the school decides',
                body: 'The rules of module 4 apply. The site describes schools as the **data controller** for pupils’ data and itself as a processor: the decision, and the responsibility, are your school’s, not the website’s and not yours alone.\n\n- **Ask your data-protection lead** whether the site, and your way in, are allowed.\n- **Usernames, not names.** A pupil account holds only a username: use neutral ones such as *ml-07*, and keep the list linking them to pupils in your school’s own systems.\n- **Tell parents** what pupils will do and what the site keeps, following your school’s rules on consent. Some of the site’s teacher’s notes suggest asking permission before webcam or photo activities.\n- **No personal data in projects:** invented commands, drawings, objects and words; no classmates’ names, no school name, no photos of pupils.\n- **Webcam and microphone:** you decide when they are on, within your school’s rules; point the webcam at objects, never at faces, and use made-up sounds, never a classmate’s voice. Smart Classroom needs neither.\n- **Rules for language:** a project that sorts kind and unkind messages can tempt pupils to type real insults; agree first on what may be typed.\n- **Afterwards:** Try it now projects disappear on their own; with class accounts, delete projects and pupil accounts as your school’s retention rules require.',
              },
              fr: {
                heading: 'Données et consentement\u00a0: c’est l’établissement qui décide',
                body: 'Les règles du module 4 s’appliquent. Le site présente les établissements comme **responsables du traitement** des données des élèves, et lui-même comme sous-traitant\u00a0: la décision, et la responsabilité, reviennent à votre établissement, pas au site, et pas à vous seul.\n\n- **Demandez à la personne chargée de la protection des données** si le site, et votre mode d’accès, sont autorisés.\n- **Des noms d’utilisateur, pas des noms.** Un compte élève ne contient qu’un nom d’utilisateur\u00a0: choisissez des noms neutres comme *ml-07*, et gardez la liste qui les associe aux élèves dans les outils de l’établissement.\n- **Informez les parents** de ce que feront les élèves et de ce que le site conserve, selon les règles de l’établissement en matière de consentement. Certaines notes pour l’enseignant du site conseillent de demander leur autorisation avant les activités avec webcam ou photos.\n- **Aucune donnée personnelle dans les projets\u00a0:** des commandes, des dessins, des objets et des mots inventés\u00a0; ni prénoms de camarades, ni nom d’établissement, ni photos d’élèves.\n- **Webcam et micro\u00a0:** c’est vous qui décidez quand ils sont allumés, selon les règles de l’établissement\u00a0; la webcam vise des objets, jamais des visages, et les sons sont inventés, jamais la voix d’un camarade. Smart Classroom n’a besoin ni de l’une ni de l’autre.\n- **Des règles de langage\u00a0:** un projet qui trie des messages gentils et méchants peut pousser les élèves à taper de vraies insultes\u00a0; convenez d’abord de ce qui peut être écrit.\n- **Ensuite\u00a0:** les projets «\u00a0Essayer maintenant\u00a0» disparaissent d’eux-mêmes\u00a0; avec des comptes de classe, supprimez projets et comptes élèves comme l’exigent les règles de conservation de l’établissement.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Plan a 45 to 60-minute session, with a fallback',
                body: 'Smart Classroom’s official teacher’s notes allow 45 minutes to an hour: read them [in English (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom.pdf) or [in French (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom-fr.pdf).\n\n**Before the day,** do the activity below, then test Try it now on a pupil device and the school network. If the automatic check fails, the site itself suggests asking your network manager to allow *challenges.cloudflare.com*. Bookmark the long site address.\n\n| Time | Pupils | You |\n|---|---|---|\n| 0–10 min | A hook ("How does a voice assistant know what you want?"), then the rules: invented examples only, evidence saved before the end | Collect ideas; state the rules |\n| 10–30 min | Labels, examples, training, tests with new sentences, a test table | Ask "Why do you think it got that wrong?" |\n| 30–45 min | The Scratch part, with the worksheet | Help with the worksheet steps |\n| 45–60 min | One success and one mistake shared; evidence saved | Draw out the idea (patterns, not understanding); check screenshots for personal details |\n\nIn 45 minutes, keep the Scratch part for a second lesson (with class accounts, since a Try it now project will be gone).\n\n**If the site is blocked.** If only pupil devices are affected, run the activity on the class screen, with pupils suggesting examples. Otherwise, use paper: pupils write commands on cards for the four labels (fan on, fan off, lamp on, lamp off). A partner, the "model", studies these training cards and writes a few rules, then sorts new test cards, including one that fits no label, into the labels or a "not sure" pile. Pupils record the results and discuss each mistake.',
              },
              fr: {
                heading: 'Préparer une séance de 45 à 60\u00a0minutes, avec une solution de repli',
                body: 'Les notes officielles pour l’enseignant de Smart Classroom prévoient de 45\u00a0minutes à une heure\u00a0: lisez-les [en français (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom-fr.pdf) ou [en anglais (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom.pdf).\n\n**Avant le jour J,** faites l’activité ci-dessous, puis testez «\u00a0Essayer maintenant\u00a0» sur un poste élève, depuis le réseau de l’établissement. Si la vérification automatique échoue, le site lui-même conseille de demander à la personne qui gère le réseau d’autoriser *challenges.cloudflare.com*. Créez un favori vers l’adresse du site, longue à taper.\n\n| Temps | Les élèves | Vous |\n|---|---|---|\n| 0–10\u00a0min | Une accroche («\u00a0Comment un assistant vocal sait-il ce qu’on veut\u00a0?\u00a0»), puis les règles\u00a0: uniquement des exemples inventés, traces enregistrées avant la fin | Recueillir les idées\u00a0; énoncer les règles |\n| 10–30\u00a0min | Étiquettes, exemples, entraînement, tests avec des phrases nouvelles, tableau de tests | Demander «\u00a0Pourquoi s’est-il trompé, d’après toi\u00a0?\u00a0» |\n| 30–45\u00a0min | La partie Scratch, avec la fiche | Aider dans les étapes de la fiche |\n| 45–60\u00a0min | Une réussite et une erreur présentées\u00a0; traces enregistrées | Faire émerger l’idée (des régularités, pas de la compréhension)\u00a0; vérifier que les captures ne montrent rien de personnel |\n\nEn 45\u00a0minutes, gardez la partie Scratch pour une deuxième séance (avec des comptes de classe, puisqu’un projet «\u00a0Essayer maintenant\u00a0» aura disparu).\n\n**Si le site est bloqué.** Si seuls les postes élèves sont concernés, menez l’activité sur l’écran de la classe, les élèves proposant les exemples. Sinon, passez au papier\u00a0: les élèves écrivent sur des cartes des commandes pour les quatre étiquettes (allumer ou éteindre le ventilateur, allumer ou éteindre la lampe). Un partenaire, le «\u00a0modèle\u00a0», étudie ces cartes d’entraînement et note quelques règles, puis trie de nouvelles cartes de test, dont une qui ne correspond à aucune étiquette, entre les étiquettes et une pile «\u00a0pas sûr\u00a0». Les élèves notent les résultats et discutent de chaque erreur.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b5',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: what is machine learning? (a hook for your class)',
                caption:
                  'A short Code.org video from AI for Oceans, in English, that you could show pupils to open the lesson.',
                transcript:
                  'In short: machine learning, the most common kind of AI, is behind spam filters, auto-complete and video suggestions. Instead of a rule for every case, the computer is given many examples (training data), finds patterns in them and uses them to make predictions about new cases. It improves with more good examples and can still be wrong. In Smart Classroom, the training data is the commands pupils type.',
              },
              fr: {
                title:
                  'Regardez\u00a0: qu’est-ce que l’apprentissage automatique\u00a0? (pour lancer la séance)',
                caption:
                  'Une courte vidéo de Code.org, tirée d’AI for Oceans, que vous pourriez montrer à vos élèves pour ouvrir la séance (vidéo en anglais).',
                transcript:
                  'En bref\u00a0: l’apprentissage automatique (en anglais, «\u00a0machine learning\u00a0»), la forme d’IA la plus courante, fait fonctionner les filtres anti-spam, la saisie automatique et les suggestions de vidéos. Au lieu d’une règle pour chaque cas, l’ordinateur reçoit de nombreux exemples (les données d’entraînement), y repère des régularités et s’en sert pour faire des prédictions sur des cas nouveaux. Il s’améliore avec davantage de bons exemples et peut quand même se tromper. Dans Smart Classroom, les données d’entraînement, ce sont les commandes que tapent les élèves.',
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
            id: 'm5-l1-b6',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Smart Classroom: teach a model to recognise commands, as your pupils will',
                instructions:
                  '**Goal:** do the quick Try it now version of Smart Classroom yourself, in about twenty minutes. You train a model to recognise which device a typed command is about (a fan or a lamp, on or off), then use it to control a virtual classroom in Scratch. The big idea for pupils: the model learns patterns from its examples, and a low confidence score signals a command unlike any of them. Invented commands only.\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**.\n2. Create a project named *smart classroom* that recognises **text**, in the language you will type in.\n3. In **Train**, add the worksheet’s four labels (fan and lamp, on and off), keeping its label names so that its Scratch template works.\n4. Type at least six varied examples per label: orders, polite requests, indirect remarks (*"I can hardly read the board"*).\n5. In **Learn & Test**, train the model, then test five sentences you did not use, including one that fits no label (*"What time is lunch?"*). Note each label and confidence score.\n6. In **Make**, open Scratch 3 and follow the official worksheet (PDF) to connect your model to the classroom.\n7. Note where you hesitated and how long each part took.',
                bringBack:
                  'For the reflections below, in your own notes: your test table (sentence, expected label, model’s label, confidence score), one mistake explained, and your timings. There is nothing to upload.',
                hint: 'Try it now will not start? A VPN, a privacy extension or a filtered network can block its Cloudflare check: try another network or browser, and ask your IT team to allow the site and challenges.cloudflare.com. Wrong labels? Add more varied examples to the labels it confuses, then train again.',
              },
              fr: {
                title:
                  'Salle de classe intelligente\u00a0: apprenez à un modèle à reconnaître des commandes, comme vos élèves',
                instructions:
                  '**Objectif\u00a0:** faire vous-même la version rapide «\u00a0Try it now\u00a0» de Smart Classroom (Salle de classe intelligente), en une vingtaine de minutes. Vous entraînez un modèle à reconnaître de quel appareil parle une commande tapée au clavier (un ventilateur ou une lampe, à allumer ou à éteindre), puis vous l’utilisez pour piloter une classe virtuelle dans Scratch. La grande idée pour les élèves\u00a0: le modèle apprend des régularités à partir de ses exemples, et un score de confiance faible signale une commande qui ne ressemble à aucun d’eux. Uniquement des commandes inventées.\n\n1. Ouvrez Machine Learning for Kids avec le bouton ci-dessous et choisissez **Essayer maintenant** (*Try it now*).\n2. Créez un projet nommé *smart classroom* qui reconnaît du **texte**, en choisissant comme **Langue** celle dans laquelle vous taperez.\n3. Dans **Entraîner** (*Train*), ajoutez les quatre étiquettes de la fiche (ventilateur et lampe, allumés ou éteints), en gardant leurs noms anglais pour que le gabarit Scratch de la fiche fonctionne.\n4. Tapez au moins six exemples variés par étiquette\u00a0: ordres, demandes polies, remarques indirectes (*«\u00a0Je n’arrive plus à lire le tableau\u00a0»*).\n5. Dans **Apprendre & Tester** (*Learn & Test*), entraînez le modèle, puis testez cinq phrases que vous n’avez pas utilisées, dont une qui ne correspond à aucune étiquette (*«\u00a0On mange à quelle heure\u00a0?\u00a0»*). Notez chaque étiquette et chaque score de confiance.\n6. Dans **Faire** (*Make*), ouvrez Scratch 3 et suivez la fiche officielle (PDF) pour relier votre modèle à la classe.\n7. Notez les moments où vous avez hésité et le temps passé sur chaque partie.',
                bringBack:
                  'Pour les réflexions ci-dessous, dans vos notes\u00a0: votre tableau de tests (phrase, étiquette attendue, étiquette du modèle, score de confiance), une erreur expliquée et votre minutage. Il n’y a rien à déposer.',
                hint: '«\u00a0Essayer maintenant\u00a0» ne démarre pas\u00a0? Un VPN, une extension de protection de la vie privée ou un réseau filtré peuvent bloquer sa vérification Cloudflare\u00a0: essayez un autre réseau ou un autre navigateur, et demandez à votre service informatique d’autoriser le site et challenges.cloudflare.com. De mauvaises étiquettes\u00a0? Ajoutez des exemples plus variés aux étiquettes que le modèle confond, puis entraînez-le de nouveau.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf',
              projectType: 'text',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm5-l1-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to challenge you with situations that can go wrong in the lesson, and answer each one in your own words before you read its feedback.',
                starterPrompt:
                  'Challenge me with three short situations, one at a time, that could go wrong in a Machine Learning for Kids lesson with pupils aged 11, such as a blocked site or a pupil typing a classmate’s name. After each of my answers, tell me what I missed.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA de vous mettre au défi avec des situations qui peuvent mal tourner pendant la séance, et répondez à chacune avec vos propres mots avant de lire son retour.',
                starterPrompt:
                  'Lancez-moi un défi\u00a0: présentez-moi, une à la fois, trois courtes situations qui pourraient mal tourner pendant une séance avec Machine Learning for Kids avec des élèves de 11\u00a0ans, comme un site bloqué ou un élève qui tape le prénom d’un camarade. Après chacune de mes réponses, dites-moi ce que j’ai oublié.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm5-l1-b8',
            type: 'reflection',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Write the account, consent and data plan for your first Machine Learning for Kids lesson: the class (age only) and the worksheet, the way in you choose and why, who in your school must agree, what pupils may and may not type or show, your rule for webcams and microphones, how parents are informed, what happens to projects and accounts afterwards, and your fallback if the site is blocked. Use the timings from your activity.',
              },
              fr: {
                prompt:
                  'Rédigez le plan «\u00a0compte, consentement et données\u00a0» de votre première séance avec Machine Learning for Kids\u00a0: la classe (l’âge seulement) et la fiche, le mode d’accès choisi et pourquoi, qui doit donner son accord dans votre établissement, ce que les élèves peuvent ou non taper ou montrer, votre règle pour la webcam et le micro, l’information des parents, ce que deviennent ensuite les projets et les comptes, et votre solution de repli si le site est bloqué. Appuyez-vous sur le minutage de votre activité.',
              },
            },
            data: { minLength: 400 },
          },
          {
            id: 'm5-l1-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'What surprised you when you did the activity as a learner, and what will you change in your lesson because of it?',
              },
              fr: {
                prompt:
                  'Qu’est-ce qui vous a surpris en faisant l’activité dans la peau d’un élève, et que changerez-vous dans votre séance en conséquence\u00a0?',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
      {
        id: 'm5-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Assessing what pupils build with machine learning',
              summary:
                'What counts as evidence when pupils train a model, a simple rubric, the misconceptions to listen for, questions on bias, and how to choose the next worksheet by age and goal.',
            },
            fr: {
              title: 'Évaluer ce que les élèves construisent avec l’apprentissage automatique',
              summary:
                'Ce qui constitue une trace d’apprentissage quand les élèves entraînent un modèle, une grille simple, les idées fausses à repérer, des questions sur les biais, et le choix de la fiche suivante selon l’âge et l’objectif.',
            },
          },
          estimatedMinutes: 40,
          xpReward: 50,
        },
        blocks: [
          {
            id: 'm5-l2-b1',
            type: RICH,
            stage: 'discover',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Three hand-ins, one question',
                body: 'After a Smart Classroom lesson, three pupils aged 12 hand in their work.\n\n- **Pupil A:** a test page showing "100% right"; every test sentence was copied from the training examples.\n- **Pupil B:** a working Scratch classroom. Asked why the lamp came on when she typed "it’s freezing in here", she shrugs: "It just knows."\n- **Pupil C:** a model that confuses the two lamp labels, and a note: "Most of my lamp examples had the word *light* in them, so it mixes up on and off. I added examples about glare and darkness, and it got better."\n\nWho learned the most? As module 3 argued, the working product is not the best evidence: the process, the tests and the explanations are.',
              },
              fr: {
                heading: 'Trois rendus, une question',
                body: 'Après une séance Smart Classroom, trois élèves de 12\u00a0ans rendent leur travail.\n\n- **Élève A\u00a0:** une page de test qui affiche «\u00a0100\u00a0% de réussite\u00a0»\u00a0; toutes les phrases testées étaient copiées des exemples d’entraînement.\n- **Élève B\u00a0:** une classe Scratch qui fonctionne. Quand on lui demande pourquoi la lampe s’est allumée lorsqu’elle a tapé «\u00a0on gèle ici\u00a0», elle hausse les épaules\u00a0: «\u00a0Il sait, c’est tout.\u00a0»\n- **Élève C\u00a0:** un modèle qui confond les deux étiquettes de la lampe, et une note\u00a0: «\u00a0La plupart de mes exemples pour la lampe contenaient le mot *lumière*, alors il mélange allumer et éteindre. J’ai ajouté des exemples sur l’éblouissement et l’obscurité, et ça va mieux.\u00a0»\n\nLequel a le plus appris\u00a0? Comme l’a montré le module 3, le produit qui fonctionne n’est pas la meilleure preuve\u00a0: ce sont la démarche, les tests et les explications qui comptent.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b2',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Evidence of learning, and a simple rubric',
                body: '**Collect during the lesson** (a Try it now project will be gone tomorrow):\n\n- **a screenshot** of the test page or the game, with nothing personal in it;\n- **a test table** of at least five inputs the model never saw: input, expected label, model’s label, confidence score (0 to 100 on this site), right or wrong;\n- **one mistake explained** with the training data ("It got this wrong because…");\n- **one change and its effect**: the GET FEEDBACK → IMPROVE step of the project cycle from module 4.\n\n| Criterion | Beginning | Secure | Advanced |\n|---|---|---|---|\n| **Training data** | A few similar or copied examples | Varied examples of their own for every label | Balanced, deliberately varied examples; gaps spotted by the pupil |\n| **Testing** | Training examples, or no tests | Five or more new inputs, honestly recorded | Inputs chosen to find weaknesses, including one that fits no label, with its confidence score |\n| **Explaining** | "It just knows." | Explains a mistake using the examples | Links mistakes to a pattern in the data and shows the effect of a change |\n| **Responsible use** | Personal details or real people in the examples | Invented examples only | Asks who the model might fail, and why |\n\nShare the rubric before pupils start. For ages 8 to 10, three questions can replace it ("Did you test with new sentences? What did it get wrong? Why?"); for ages 15 to 18, ask for a success rate on tests written by someone else.',
              },
              fr: {
                heading: 'Des traces d’apprentissage, et une grille simple',
                body: '**À recueillir pendant la séance** (un projet «\u00a0Essayer maintenant\u00a0» aura disparu le lendemain)\u00a0:\n\n- **une capture d’écran** de la page de test ou du jeu, sans rien de personnel\u00a0;\n- **un tableau de tests** d’au moins cinq entrées que le modèle n’a jamais vues\u00a0: l’entrée, l’étiquette attendue, l’étiquette du modèle, le score de confiance (de 0 à 100 sur ce site), juste ou faux\u00a0;\n- **une erreur expliquée** à partir des données d’entraînement («\u00a0Il s’est trompé parce que…\u00a0»)\u00a0;\n- **une modification et son effet**\u00a0: l’étape RECEVOIR UN RETOUR → AMÉLIORER du cycle de projet du module 4.\n\n| Critère | En cours d’acquisition | Acquis | Dépassé |\n|---|---|---|---|\n| **Données d’entraînement** | Quelques exemples semblables ou recopiés | Des exemples variés et personnels pour chaque étiquette | Des exemples équilibrés et volontairement variés\u00a0; des lacunes repérées par l’élève |\n| **Tests** | Les exemples d’entraînement, ou aucun test | Au moins cinq entrées nouvelles, notées honnêtement | Des entrées choisies pour trouver les faiblesses, dont une qui ne correspond à aucune étiquette, avec son score de confiance |\n| **Explication** | «\u00a0Il sait, c’est tout.\u00a0» | Explique une erreur à partir des exemples | Relie les erreurs à une régularité des données et montre l’effet d’une modification |\n| **Usage responsable** | Des informations personnelles ou des personnes réelles dans les exemples | Uniquement des exemples inventés | Se demande pour qui le modèle pourrait échouer, et pourquoi |\n\nPrésentez la grille avant que les élèves commencent. Pour les 8 à 10\u00a0ans, trois questions peuvent la remplacer («\u00a0As-tu testé avec des phrases nouvelles\u00a0? Sur quoi s’est-il trompé\u00a0? Pourquoi\u00a0?\u00a0»)\u00a0; pour les 15 à 18\u00a0ans, demandez un taux de réussite sur des tests écrits par quelqu’un d’autre.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Misconceptions to listen for, and questions on bias',
                body: 'Each misconception is a chance to teach, not a mistake to mark down.\n\n| What you hear | The misconception | A question that helps |\n|---|---|---|\n| "It understands what I mean." | The computer understands | "What if you type a new sentence with the same words but the opposite meaning?" (*"I am not cold at all"*) |\n| "I’ll add a hundred more." | More data is always better | "Which labels does it confuse? Add five *different* examples to one of them, and compare." Twenty copies of a sentence teach it one sentence. |\n| "100%: it’s perfect." | A high test score proves the model is right | "Who wrote the tests? Ask a classmate for ten new ones." Real systems make mistakes too. |\n\nListen also for the confidence score read as truth: a model can give a high score and still be wrong.\n\n**Opening a discussion on bias.** Pupils have just chosen the examples, so they can see bias being made:\n\n- Whose way of speaking did our examples use? Would the model recognise a command from someone who speaks differently, or who is learning the language?\n- Which commands did nobody think of, and what happens to the people who use them?\n- If a system like this decided something important, such as who gets help, who could be treated unfairly, and who would be responsible?\n\nWith older pupils, Tourist Info (in the table below) goes further: they build a biased recommendation app on purpose, then discuss it.',
              },
              fr: {
                heading: 'Les idées fausses à repérer, et des questions sur les biais',
                body: 'Chaque idée fausse est une occasion d’enseigner, pas une faute à sanctionner.\n\n| Ce que vous entendez | L’idée fausse | Une question qui aide |\n|---|---|---|\n| «\u00a0Il comprend ce que je veux dire.\u00a0» | L’ordinateur comprend | «\u00a0Et si tu tapes une phrase nouvelle, avec les mêmes mots mais le sens contraire\u00a0?\u00a0» (*«\u00a0Je n’ai pas froid du tout\u00a0»*) |\n| «\u00a0Je vais en ajouter cent de plus.\u00a0» | Plus de données, c’est toujours mieux | «\u00a0Quelles étiquettes confond-il\u00a0? Ajoute à l’une d’elles cinq exemples *différents*, et compare.\u00a0» Vingt copies d’une même phrase ne lui apprennent qu’une phrase. |\n| «\u00a0100\u00a0%\u00a0: il est parfait.\u00a0» | Un bon score au test prouve que le modèle a raison | «\u00a0Qui a écrit les tests\u00a0? Demande dix phrases nouvelles à un camarade.\u00a0» Les vrais systèmes se trompent aussi. |\n\nSoyez aussi attentif au score de confiance pris pour une vérité\u00a0: un modèle peut donner un score élevé et se tromper quand même.\n\n**Ouvrir une discussion sur les biais.** Les élèves viennent de choisir les exemples\u00a0: ils peuvent voir un biais se fabriquer.\n\n- Quelle façon de parler nos exemples utilisaient-ils\u00a0? Le modèle reconnaîtrait-il la commande de quelqu’un qui parle autrement, ou qui apprend la langue\u00a0?\n- À quelles commandes personne n’a-t-il pensé, et que se passe-t-il pour les personnes qui les utilisent\u00a0?\n- Si un système comme celui-ci décidait de quelque chose d’important, par exemple qui reçoit une aide, qui risquerait d’être traité injustement, et qui en serait responsable\u00a0?\n\nAvec des élèves plus âgés, Tourist Info (dans le tableau ci-dessous) va plus loin\u00a0: ils construisent volontairement une application de recommandation biaisée, puis en discutent.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b4',
            type: RICH,
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Watch and observe: marking one hand-in in three minutes',
                body: 'No video this time: follow a teacher marking the hand-in of Pupil C with the rubric. She has a screenshot, a table of six new sentences (four right, two wrong, both between *lamp on* and *lamp off*) and the note about the word *light*.\n\n- **Training data: secure.** The pupil’s own examples for every label, but the lamp ones lean on one word. Comment: *"You spotted the gap yourself: that is the key skill."*\n- **Testing: secure.** Six new sentences, failures included, but none that fits no label.\n- **Explaining: advanced.** The mistakes are linked to a pattern in the data, and the effect of a change is shown.\n- **Responsible use: secure.** Invented examples, but no thought yet about who the model might fail.\n- **Feedback:** *"Next time, add a test that fits no label and look at its confidence score."*\n\n**What to notice:** structured evidence made the judgement quick, the mark rewards the explanation more than the result, and the feedback names one next step.',
              },
              fr: {
                heading: 'Observez\u00a0: évaluer un rendu en trois minutes',
                body: 'Pas de vidéo cette fois\u00a0: suivez une enseignante qui évalue avec la grille le rendu de l’élève C. Elle dispose d’une capture d’écran, d’un tableau de six phrases nouvelles (quatre justes, deux fausses, toutes deux entre *allumer la lampe* et *éteindre la lampe*) et de la note sur le mot *lumière*.\n\n- **Données d’entraînement\u00a0: acquis.** Des exemples personnels pour chaque étiquette, mais ceux de la lampe reposent sur un seul mot. Commentaire\u00a0: *«\u00a0Tu as repéré la lacune toi-même\u00a0: c’est la compétence clé.\u00a0»*\n- **Tests\u00a0: acquis.** Six phrases nouvelles, échecs compris, mais aucune qui ne corresponde à aucune étiquette.\n- **Explication\u00a0: dépassé.** Les erreurs sont reliées à une régularité des données, et l’effet d’une modification est montré.\n- **Usage responsable\u00a0: acquis.** Des exemples inventés, mais pas encore de réflexion sur les personnes pour qui le modèle pourrait échouer.\n- **Retour\u00a0:** *«\u00a0La prochaine fois, ajoute un test qui ne correspond à aucune étiquette et regarde son score de confiance.\u00a0»*\n\n**Ce qu’il faut remarquer\u00a0:** des traces structurées ont rendu le jugement rapide, l’évaluation valorise l’explication plus que le résultat, et le retour indique une seule prochaine étape.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: choose the next worksheet',
                body: 'Seven worksheets that work well after Smart Classroom, with the type and level the site gives them (the ages are our suggestion):\n\n| Worksheet (PDF) | Type | Level | Big idea | Ages |\n|---|---|---|---|---|\n| [Mailman Max](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mailmanmax.pdf) | Images | Beginner | Recognising handwriting drawn with the mouse | 8–11 |\n| [Smart Classroom](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf) | Text | Beginner | Recognising what a command means | 8–13 |\n| [Make me happy](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy.pdf) | Text | Beginner | Recognising kind and unkind messages (set rules for language first) | 9–13 |\n| [Fooled](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-fooled.pdf) | Images | Intermediate | A badly trained model learns the wrong clue; best as a second project | 11–16 |\n| [Tourist Info](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-touristinfo.pdf) | Text | Intermediate | A biased recommendation app, built on purpose, then discussed | 13–18 |\n| [Zombie Escape!](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-zombieescape.pdf) | Numbers | Advanced (intermediate in its teacher’s notes) | A decision tree that learns from game data | 12–16 |\n| [Chatbots (Python)](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-chatbots-python.pdf) | Text, with Python | Intermediate | A question classifier called from Python; the project key stays out of anything pupils hand in | 15–18 |\n\n**Try it:** for one of your classes, choose one worksheet to practise learning from examples and one to discuss its limits. For each, note the age, the way in, the evidence and one risk (personal data, webcam, language, time). Then compare with this example: for pupils aged 12, Smart Classroom with Try it now, then Fooled a week later to discuss variety in training data, with safe search instructions, since pupils look for pictures of fruit on the web.',
              },
              fr: {
                heading: 'À vous\u00a0: choisissez la fiche suivante',
                body: 'Sept fiches qui conviennent bien après Smart Classroom, avec le type et le niveau que leur donne le site (les âges sont notre suggestion). Les fiches sont en anglais\u00a0; les titres français entre parenthèses sont ceux du site.\n\n| Fiche (PDF, en anglais) | Type | Niveau | Grande idée | Âges |\n|---|---|---|---|---|\n| [Mailman Max](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mailmanmax.pdf) (Le facteur Max) | Images | Débutant | Reconnaître une écriture tracée à la souris | 8–11\u00a0ans |\n| [Smart Classroom](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf) (Salle de classe intelligente) | Texte | Débutant | Reconnaître ce que signifie une commande | 8–13\u00a0ans |\n| [Make me happy](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy.pdf) (Rends-moi heureux) | Texte | Débutant | Reconnaître des messages gentils et méchants (fixer d’abord des règles de langage) | 9–13\u00a0ans |\n| [Fooled](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-fooled.pdf) (Trompé) | Images | Intermédiaire | Un modèle mal entraîné apprend le mauvais indice\u00a0; plutôt en deuxième projet | 11–16\u00a0ans |\n| [Tourist Info](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-touristinfo.pdf) (Informations touristiques) | Texte | Intermédiaire | Une application de recommandation biaisée, construite volontairement, puis discutée | 13–18\u00a0ans |\n| [Zombie Escape!](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-zombieescape.pdf) (Fuir les zombies\u00a0!) | Nombres | Avancé (intermédiaire selon ses notes pour l’enseignant) | Un arbre de décision qui apprend à partir de données de jeu | 12–16\u00a0ans |\n| [Chatbots (Python)](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-chatbots-python.pdf) (Agent conversationnel) | Texte, avec Python | Intermédiaire | Un classificateur de questions appelé depuis Python\u00a0; la clé du projet ne figure dans rien de ce que rendent les élèves | 15–18\u00a0ans |\n\n**À vous\u00a0:** pour l’une de vos classes, choisissez une fiche pour pratiquer l’apprentissage à partir d’exemples et une autre pour discuter de ses limites. Pour chacune, notez l’âge, le mode d’accès, les traces et un risque (données personnelles, webcam, langage, temps). Comparez ensuite avec cet exemple\u00a0: pour des élèves de 12\u00a0ans, Smart Classroom avec «\u00a0Essayer maintenant\u00a0», puis Fooled une semaine plus tard pour discuter de la variété des données d’entraînement, avec des consignes de recherche sûres, puisque les élèves cherchent des photos de fruits sur le web.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor for three sample explanations of a model’s mistake, and place each one on the rubric yourself before you read its view. Where you disagree, your judgement is the one that counts.',
                starterPrompt:
                  'Give me three short examples of how a pupil aged 12 might explain why their Smart Classroom model put "it’s boiling in here" under lamp on instead of fan on: one weak, one secure and one strong explanation. Do not say which is which: I will rank them myself first.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA trois exemples d’explications d’une erreur de modèle, et placez vous-même chacune sur la grille avant de lire son avis. En cas de désaccord, c’est votre jugement qui compte.',
                starterPrompt:
                  'Donnez-moi trois courts exemples de la façon dont un élève de 12\u00a0ans pourrait expliquer pourquoi son modèle Smart Classroom a classé «\u00a0on étouffe ici\u00a0» sous «\u00a0allumer la lampe\u00a0» au lieu de «\u00a0allumer le ventilateur\u00a0»\u00a0: une explication faible, une correcte et une solide. Ne précisez pas laquelle est laquelle\u00a0: je les classerai d’abord moi-même.',
              },
            },
            data: { tutorMode: 'give_example', labToolId: null },
          },
          {
            id: 'm5-l2-b7',
            type: 'reflection',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Plan how you will assess one Machine Learning for Kids lesson: the worksheet and the age of the pupils, the evidence you will collect (and when, if you use Try it now), your rubric (three or four criteria, three levels), one question to challenge a misconception and one to open a discussion on bias. Then get feedback on it (open the AI tutor in Check my work mode, with no personal data, or ask a colleague) and note one change you made as a result.',
              },
              fr: {
                prompt:
                  'Préparez l’évaluation d’une séance avec Machine Learning for Kids\u00a0: la fiche et l’âge des élèves, les traces que vous recueillerez (et à quel moment, si vous utilisez «\u00a0Essayer maintenant\u00a0»), votre grille (trois ou quatre critères, trois niveaux), une question pour bousculer une idée fausse et une autre pour ouvrir une discussion sur les biais. Demandez ensuite un retour (au tuteur IA en mode «\u00a0Vérifie mon travail\u00a0», sans aucune donnée personnelle, ou à un collègue) et notez une modification que vous y avez apportée en conséquence.',
              },
            },
            data: { minLength: 400 },
          },
          {
            id: 'm5-l2-b8',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding of the ways into Machine Learning for Kids, pupils’ privacy and the assessment of machine learning projects.',
              },
              fr: {
                intro:
                  'Vérifiez votre compréhension des modes d’accès à Machine Learning for Kids, de la protection des données des élèves et de l’évaluation des projets d’apprentissage automatique.',
              },
            },
            data: { quizId: 'quiz-m5' },
          },
          {
            id: 'm5-l2-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of the pupils you teach. Which of the three misconceptions do you expect to hear most often, and what will you say or do when you hear it?',
              },
              fr: {
                prompt:
                  'Pensez aux élèves que vous avez en classe. Laquelle des trois idées fausses vous attendez-vous à entendre le plus souvent, et que direz-vous ou ferez-vous quand vous l’entendrez\u00a0?',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
    ],
  },

  quizzes: [
    {
      id: 'quiz-m5',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: teaching machine learning hands-on',
            instructions: 'Six questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: enseigner l’apprentissage automatique par la pratique',
            instructions:
              'Six questions. Il faut 70\u00a0% pour réussir, et vous pouvez réessayer.',
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
                  'A colleague plans a one-off Machine Learning for Kids lesson for pupils aged 10 and wants the site to keep as little as possible about them. Which option fits best?',
              },
              fr: {
                prompt:
                  'Un collègue prévoit une séance unique avec Machine Learning for Kids pour des élèves de 10\u00a0ans et veut que le site conserve le moins possible de données à leur sujet. Quelle option convient le mieux\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Try it now: no accounts, one project at a time, deleted after a few hours, with the evidence saved during the lesson',
                  },
                  fr: {
                    text: 'Essayer maintenant\u00a0: aucun compte, un projet à la fois, effacé au bout de quelques heures, avec des traces enregistrées pendant la séance',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Pupils sign up for their own accounts with their school email addresses',
                  },
                  fr: {
                    text: 'Les élèves créent eux-mêmes leur compte avec leur adresse e-mail scolaire',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'A class account with usernames made from each pupil’s first name and age',
                  },
                  fr: {
                    text: 'Un compte de classe avec des noms d’utilisateur formés du prénom et de l’âge de chaque élève',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'The teacher’s own account, shared by the whole class with one password',
                  },
                  fr: {
                    text: 'Le compte personnel de l’enseignant, partagé par toute la classe avec un seul mot de passe',
                  },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Try it now needs no account and, the site says, collects no personal information; projects are deleted after a few hours, so evidence must be saved during the lesson. Pupils cannot create accounts themselves, usernames should never contain names, and one shared login removes any control over who did what.',
              },
              fr: {
                text: 'Essayer maintenant ne demande aucun compte et, selon le site, ne recueille aucune information personnelle\u00a0; les projets sont effacés au bout de quelques heures, il faut donc enregistrer les traces pendant la séance. Les élèves ne peuvent pas créer de compte eux-mêmes, un nom d’utilisateur ne doit jamais contenir de prénom, et un identifiant partagé fait perdre toute maîtrise de qui a fait quoi.',
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
                  'Which of these are suitable training examples for pupils to use? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Lesquels de ces exemples d’entraînement les élèves peuvent-ils utiliser\u00a0? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Invented commands such as "it is far too dark in here"' },
                  fr: {
                    text: 'Des commandes inventées comme «\u00a0il fait bien trop sombre ici\u00a0»',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'A sentence that names a classmate: "Sami always switches the fan off"',
                  },
                  fr: {
                    text: 'Une phrase qui nomme un camarade\u00a0: «\u00a0Sami éteint toujours le ventilateur\u00a0»',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Digits drawn on the screen with the mouse' },
                  fr: { text: 'Des chiffres tracés à l’écran avec la souris' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Photos of pupils’ faces taken with the webcam' },
                  fr: { text: 'Des photos du visage des élèves prises avec la webcam' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Made-up sounds, such as claps or invented words, recorded with the teacher’s permission',
                  },
                  fr: {
                    text: 'Des sons inventés, comme des claquements de mains ou des mots imaginaires, enregistrés avec l’accord de l’enseignant',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Invented sentences, drawings and made-up sounds carry no personal data. A classmate’s name and photos of faces are personal data, and faces used for recognition are also biometric data, as module 4 explained.',
              },
              fr: {
                text: 'Des phrases inventées, des dessins et des sons imaginaires ne contiennent aucune donnée personnelle. Le prénom d’un camarade et des photos de visages sont des données personnelles, et des visages utilisés pour la reconnaissance sont aussi des données biométriques, comme l’a expliqué le module 4.',
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
                  'With a class account you set up yourself (an "unmanaged" account), every type of project needs IBM Cloud API keys.',
              },
              fr: {
                prompt:
                  'Avec un compte de classe que vous créez vous-même (un compte «\u00a0non géré\u00a0»), tous les types de projets demandent des clés d’API IBM Cloud.',
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
                text: 'False. Only projects that recognise text need IBM Cloud API keys, which the teacher creates, and at sign-up the teacher accepts responsibility for any IBM Cloud charges. In a managed class account, which the site’s author sets up on request for schools and not-for-profit clubs, the keys are managed for you.',
              },
              fr: {
                text: 'Faux. Seuls les projets qui reconnaissent du texte demandent des clés d’API IBM Cloud, que l’enseignant crée, et à l’inscription l’enseignant accepte la responsabilité d’éventuels frais IBM Cloud. Dans un compte de classe géré, que l’auteur du site met en place sur demande pour les établissements et les clubs à but non lucratif, les clés sont gérées pour vous.',
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
                  'A pupil shows you a test page on which every answer is right and says: "100%, my model is perfect." What is the most useful response?',
              },
              fr: {
                prompt:
                  'Un élève vous montre une page de test où toutes les réponses sont justes et déclare\u00a0: «\u00a0100\u00a0%, mon modèle est parfait.\u00a0» Quelle est la réaction la plus utile\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Give full marks for testing: the result speaks for itself' },
                  fr: {
                    text: 'Donner tous les points pour les tests\u00a0: le résultat parle de lui-même',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Ask which sentences they tested, then ask a classmate to write ten new ones and record the results',
                  },
                  fr: {
                    text: 'Lui demander quelles phrases il a testées, puis demander à un camarade d’en écrire dix nouvelles et noter les résultats',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Tell them to add a hundred more examples to each label' },
                  fr: { text: 'Lui dire d’ajouter cent exemples de plus à chaque étiquette' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Explain that the score must be wrong, because a computer cannot learn',
                  },
                  fr: {
                    text: 'Lui expliquer que le score est forcément faux, parce qu’un ordinateur ne peut pas apprendre',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A perfect score on familiar inputs says little. New tests written by someone else show what the model really does, and the pupil’s explanation of the new results is the evidence of learning. More examples help only when they are varied and fill a gap.',
              },
              fr: {
                text: 'Un score parfait sur des entrées familières ne dit pas grand-chose. Des tests nouveaux, écrits par quelqu’un d’autre, montrent ce que fait réellement le modèle, et l’explication que l’élève donne des nouveaux résultats est la trace d’apprentissage. Ajouter des exemples n’aide que s’ils sont variés et comblent une lacune.',
              },
            },
          },
          {
            id: 'q5',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Who decides whether pupils may use class accounts on Machine Learning for Kids?',
              },
              fr: {
                prompt:
                  'Qui décide si les élèves peuvent utiliser des comptes de classe sur Machine Learning for Kids\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The website, which is responsible for pupils’ data' },
                  fr: { text: 'Le site, qui est responsable des données des élèves' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Each pupil’s parents, without involving the school' },
                  fr: { text: 'Les parents de chaque élève, sans passer par l’établissement' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'The school, as the data controller for its pupils’ data, under its own policies and with parents informed',
                  },
                  fr: {
                    text: 'L’établissement, en tant que responsable du traitement des données de ses élèves, selon ses propres règles et en informant les parents',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The teacher alone, since the site is free' },
                  fr: { text: 'L’enseignant seul, puisque le site est gratuit' },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The site describes schools as the data controller for pupils’ data and itself as a processor. The school decides, under its policies, with its data-protection lead involved and parents informed as its rules require.',
              },
              fr: {
                text: 'Le site présente les établissements comme responsables du traitement des données des élèves, et lui-même comme sous-traitant. C’est l’établissement qui décide, selon ses règles, avec la personne chargée de la protection des données, et en informant les parents comme ses règles le prévoient.',
              },
            },
          },
          {
            id: 'q6',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'With each prediction, a Machine Learning for Kids model gives a number from 0 to 100, which is low when the input is unlike its training examples. What is this number called? (two words)',
              },
              fr: {
                prompt:
                  'Avec chaque prédiction, un modèle de Machine Learning for Kids donne un nombre de 0 à 100, faible quand l’entrée ne ressemble pas à ses exemples d’entraînement. Comment s’appelle ce nombre\u00a0? (trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'confidence score',
                'the confidence score',
                'a confidence score',
                'confidence scores',
                'confidence',
                'confidence level',
                'confidence value',
                'score of confidence',
              ],
              fr: [
                'score de confiance',
                'le score de confiance',
                'un score de confiance',
                'confiance',
                'la confiance',
                'indice de confiance',
                'l’indice de confiance',
                "l'indice de confiance",
                'niveau de confiance',
                'taux de confiance',
              ],
            },
            explanation: {
              en: {
                text: 'The confidence score. A low score signals an input unlike the training examples, but a high score is not proof that the label is right.',
              },
              fr: {
                text: 'Le score de confiance. Un score faible signale une entrée qui ne ressemble pas aux exemples d’entraînement, mais un score élevé ne prouve pas que l’étiquette est juste.',
              },
            },
          },
        ],
      },
    },
  ],
  projects: [],
};
