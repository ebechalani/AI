// Module m5 of "AI Essentials for Educators" (teachers of pupils aged 8 to 18): teaching machine
// learning hands-on with Machine Learning for Kids (machinelearningforkids.co.uk, free and open
// source, by Dale Lane). It comes after m4 (safe and effective AI in the classroom) and before m6
// (inclusive and creative AI). It builds on m1 (models learn patterns, they do not understand),
// m3 (assess the process, not only the product), m4-l1 (personal data, approved tools, the
// school's data-protection and safeguarding roles) and m4-l2 (the drawing-classifier class, the
// age bands and the LEARN -> TRY -> BUILD -> GET FEEDBACK -> IMPROVE -> SHOW cycle). A teacher
// course has no project block: each 'build' stage is a reflection in which teachers plan for
// their own class.
// m5-l1: what the site is, its worksheets (CC BY-NC-SA 4.0: use and adapt for non-commercial
// teaching, with credit and the same licence) and its three ways in, as its sign-up, login and
// help pages describe them (IBM/taxinomitis, commit f360de1): "Try it now" (no account, no
// personal information collected according to the site, one project at a time, deleted after a
// few hours, the site says at least four; a Cloudflare Turnstile check first, which the site's
// help says can fail behind a VPN, a privacy extension or a strict school network, suggesting
// that challenges.cloudflare.com be allowed); a teacher's own "unmanaged" class account (IBM
// Cloud API keys only for text projects; at sign-up the teacher accepts responsibility for any
// IBM Cloud charges; pupils cannot sign themselves up; pupil accounts hold a username only); a
// "managed" class account that the site's author sets up on request by email, offered only to
// schools and not-for-profit coding clubs (described neutrally, never promised). Where data is
// stored (IBM Cloud in the United States; text projects trained with IBM Watson) is given as
// "according to the site's help pages". Privacy: the site calls the school the data controller;
// usernames, not names; no personal data or photos of pupils; webcam and microphone rules;
// parents informed (some teacher's notes suggest parental permission before webcam or photo
// activities). A 45 to 60-minute plan, a paper fallback and the teacher's notes of Smart
// Classroom (English and French PDFs, linked in m5-l1-b4). The video reuses OeU5m6vRyCk (Code.org,
// "What is machine learning?", curated in my-first-ai-adventure m1-l2) as a hook teachers can
// show. The ML4K activity, done by the teacher as a learner: Smart Classroom, quick "Try it now"
// version (worksheet-smartclassroom-tryitnow.pdf; text; Scratch 3; try_it_now). The teacher keeps
// the worksheet's four label names so that its Scratch template works; the examples given in our
// text are our own, not the worksheet's. French UI labels (Essayer maintenant, Entraîner,
// Apprendre & Tester, Faire, Langue) come from the site's fr.json. Reflections: the account,
// consent and data plan (build) and what doing the activity changed (reflect).
// m5-l2: evidence (screenshot, test table of new inputs with label and confidence score from 0 to
// 100, one mistake explained, one change and its effect), a four-criterion, three-level rubric
// (the beginning / secure / advanced levels of m2-l1), three misconceptions (the computer
// understands; more data is always better; 100% accuracy), bias discussion prompts, a written
// replay of marking one hand-in, and a table of seven worksheets (links only, no worksheet text)
// with the type and level of the site's catalogue: Mailman Max, Smart Classroom, Make me happy,
// Fooled, Tourist Info, Zombie Escape! (advanced on the site, intermediate in its teacher's
// notes) and Chatbots (Python). The suggested ages in that table are our own suggestion and say
// so. The module quiz quiz-m5 (six questions) and two reflections.

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
            'Mener en toute sécurité une séance pratique avec Machine Learning for Kids, du choix du compte à la protection des données et au consentement, puis évaluer ce que construisent les élèves : traces d’apprentissage, grille simple, idées fausses fréquentes et biais.',
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
                'Choose how your pupils will reach Machine Learning for Kids, decide what the site may keep, plan a 45 to 60-minute session with a fallback, and try the Smart Classroom activity yourself.',
            },
            fr: {
              title: 'Mener une séance avec Machine Learning for Kids',
              summary:
                'Choisissez comment vos élèves accéderont à Machine Learning for Kids, décidez de ce que le site peut conserver, préparez une séance de 45 à 60 minutes avec une solution de repli, et testez vous-même l’activité Smart Classroom.',
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
                body: 'In module 4 you met a class that trained a simple classifier on their own drawings, saw it fail on another class’s drawings and worked out why. A lesson like that is within reach of any teacher, with no programming background, thanks to free tools such as Machine Learning for Kids.\n\nBut before the first pupil types anything, three questions need an answer:\n\n- **How will pupils get in?** With no account at all, or with class accounts, and if so, who sets them up?\n- **What will the site keep about them**, for how long, and who has agreed to it?\n- **What happens if the site is blocked** on the school network at 9 a.m.?\n\nThis lesson answers them, then asks you to do a short activity yourself, exactly as your pupils would. Twenty minutes as a learner is the best way to find out where they will get stuck.',
              },
              fr: {
                heading: 'Du classificateur de dessins à votre propre séance',
                body: 'Au module 4, vous avez rencontré une classe qui entraînait un classificateur simple sur ses propres dessins, constatait qu’il échouait sur les dessins d’une autre classe et cherchait pourquoi. Une séance de ce type est à la portée de tout enseignant, même sans aucune connaissance en programmation, grâce à des outils gratuits comme Machine Learning for Kids.\n\nMais avant que le premier élève ne tape quoi que ce soit, trois questions doivent trouver une réponse :\n\n- **Comment les élèves accéderont-ils au site ?** Sans aucun compte, ou avec des comptes de classe, et dans ce cas, qui les crée ?\n- **Que conservera le site à leur sujet**, combien de temps, et qui l’a accepté ?\n- **Que se passe-t-il si le site est bloqué** par le réseau de l’établissement à 8 h ?\n\nCette leçon y répond, puis vous propose de réaliser vous-même une courte activité, exactement comme le feraient vos élèves. Vingt minutes dans la peau d’un élève : c’est le meilleur moyen de savoir où ils vont bloquer.',
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
                body: '**Machine Learning for Kids** is a free, open-source website created by Dale Lane. Pupils collect examples (sentences, drawings, numbers or sounds), sort them under labels they choose, train a machine learning model and then use it in a game or an app, usually in Scratch, sometimes in Python. It is module 1 put into practice: the model learns patterns from examples; it understands nothing.\n\nThe site offers more than fifty project worksheets, each written to last about one lesson, most with teacher’s notes. Student worksheets are almost all in English (only one exists in French), and about thirty sets of teacher’s notes have a French translation. The worksheets are shared under a Creative Commons non-commercial licence (CC BY-NC-SA 4.0): you may use and adapt them for non-commercial teaching, as long as you credit the author and share any adapted version under the same licence.\n\n**Three ways in**\n\n| Option | Who sets it up | What the site keeps | Good for | Watch out for |\n|---|---|---|---|---|\n| **Try it now** | Nobody: one click on the site | No account and, the site says, no personal information. One project at a time, deleted after a few hours | A single lesson, a first try, a demonstration | Work must be finished and evidence saved during the lesson. An automatic Cloudflare check ("are you a person?") runs first and can fail on a strictly filtered network |\n| **Your own class account** ("unmanaged") | You, on the site’s sign-up page | Your username and email address; a username for each pupil (pupils cannot sign up themselves). Projects stay until you delete them | Projects that last several lessons | Text projects need IBM Cloud API keys (codes that let the site use IBM’s cloud services on your account), which you create; you accept responsibility for any IBM Cloud charges |\n| **Managed class account** | The site’s author, on request by email | The same as a class account; the API keys are managed for you | Schools and not-for-profit coding clubs, the only groups it is offered to | It is an offer, not a right: allow time for a reply and plan a lesson that works without it |\n\nAccording to the site’s help pages, projects kept in an account are stored on IBM Cloud servers in the United States, and text projects are trained with an IBM Watson service. Read those pages (in English) before you choose.\n\n**Which one?** For a first lesson, **Try it now** is the simplest option and the one that keeps the least. Move to class accounts only when a project must last longer than a lesson, and only once your school has agreed.',
              },
              fr: {
                heading: 'Machine Learning for Kids, et trois façons d’y accéder',
                body: '**Machine Learning for Kids** est un site web gratuit et open source créé par Dale Lane. Les élèves rassemblent des exemples (des phrases, des dessins, des nombres ou des sons), les classent sous des étiquettes qu’ils choisissent, entraînent un modèle d’apprentissage automatique, puis l’utilisent dans un jeu ou une application, le plus souvent dans Scratch, parfois en Python. C’est le module 1 mis en pratique : le modèle apprend des régularités à partir d’exemples ; il ne comprend rien.\n\nLe site propose plus de cinquante fiches de projet, chacune prévue pour durer à peu près une séance, la plupart avec des notes pour l’enseignant. Les fiches élèves sont presque toutes en anglais (une seule existe en français), et une trentaine de notes pour l’enseignant ont été traduites en français. Les fiches sont diffusées sous une licence Creative Commons non commerciale (CC BY-NC-SA 4.0) : vous pouvez les utiliser et les adapter pour un enseignement non commercial, à condition de citer l’auteur et de partager toute version adaptée sous la même licence.\n\n**Trois façons d’y accéder**\n\n| Option | Qui la met en place | Ce que le site conserve | Idéale pour | Points de vigilance |\n|---|---|---|---|---|\n| **Essayer maintenant** (*Try it now*) | Personne : un clic sur le site | Aucun compte et, selon le site, aucune information personnelle. Un seul projet à la fois, effacé au bout de quelques heures | Une séance unique, une première découverte, une démonstration | Le travail doit être terminé et les traces enregistrées pendant la séance. Une vérification automatique de Cloudflare (« êtes-vous une personne ? ») a lieu d’abord et peut échouer sur un réseau très filtré |\n| **Votre propre compte de classe** (compte « non géré ») | Vous, sur la page d’inscription du site | Votre nom d’utilisateur et votre adresse e-mail ; un nom d’utilisateur pour chaque élève (les élèves ne peuvent pas s’inscrire eux-mêmes). Les projets restent jusqu’à ce que vous les supprimiez | Des projets qui durent plusieurs séances | Les projets de texte demandent des clés d’API IBM Cloud (des codes qui permettent au site d’utiliser les services en ligne d’IBM sur votre compte), que vous créez ; vous acceptez la responsabilité d’éventuels frais IBM Cloud |\n| **Compte de classe géré** | L’auteur du site, sur demande par e-mail | Comme un compte de classe ; les clés d’API sont gérées pour vous | Les établissements scolaires et les clubs de programmation à but non lucratif, seuls publics à qui il est proposé | C’est une offre, pas un droit : prévoyez un délai de réponse et une séance qui fonctionne sans |\n\nSelon les pages d’aide du site, les projets conservés dans un compte sont stockés sur des serveurs IBM Cloud aux États-Unis, et les projets de texte sont entraînés avec un service IBM Watson. Lisez ces pages (en anglais) avant de choisir.\n\n**Laquelle choisir ?** Pour une première séance, **Essayer maintenant** est l’option la plus simple et celle qui conserve le moins de données. Ne passez aux comptes de classe que lorsqu’un projet doit durer plus d’une séance, et seulement une fois que votre établissement a donné son accord.',
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
                body: 'The rules of module 4 apply here as they do to any AI tool. Machine Learning for Kids describes schools and clubs as the **data controller** for pupils’ data and itself as a processor: in other words, the decision, and the responsibility, belong to your school, not to the website and not to you alone.\n\n**Before the lesson**\n\n- **Check with your data-protection lead** that the site, and the option you chose, are allowed, as for any tool your school has not yet approved.\n- **Usernames, not names.** A pupil account holds only a username (and the password you give it). Choose neutral usernames such as *ml-07*, never a name or a date of birth, and keep the list that links usernames to pupils in your school’s own systems.\n- **Tell parents** what the site is, what pupils will do on it, what it keeps and for how long, following your school’s rules on information and consent. Some of the site’s teacher’s notes suggest asking parents’ permission before webcam or photo activities.\n\n**During the lesson**\n\n- **No personal data in projects.** Training examples are invented: commands, drawings, objects, made-up words. No classmates’ names, no school name, no photos of pupils, no true stories about anyone.\n- **Webcam and microphone.** Some projects use them. You decide whether and when they are switched on, following your school’s rules: the webcam points at objects or drawings, never at faces, and sounds are made up, never a classmate’s voice. Smart Classroom, the activity below, needs neither.\n- **Set rules for language.** A project that sorts kind and unkind messages can tempt pupils to type real insults: agree beforehand on what may be typed.\n\n**After the lesson**\n\nTry it now projects disappear on their own. With class accounts, delete the projects, then the pupil accounts once you no longer need them, as your school’s retention rules require.',
              },
              fr: {
                heading: 'Données et consentement : c’est l’établissement qui décide',
                body: 'Les règles du module 4 s’appliquent ici comme à tout outil d’IA. Machine Learning for Kids présente les établissements et les clubs comme **responsables du traitement** des données des élèves, et se présente lui-même comme sous-traitant : autrement dit, la décision, et la responsabilité, reviennent à votre établissement, pas au site, et pas à vous seul.\n\n**Avant la séance**\n\n- **Vérifiez auprès de la personne chargée de la protection des données** que le site, et l’option choisie, sont autorisés, comme pour tout outil que votre établissement n’a pas encore validé.\n- **Des noms d’utilisateur, pas des noms.** Un compte élève ne contient qu’un nom d’utilisateur (et le mot de passe que vous lui attribuez). Choisissez des noms neutres, comme *ml-07*, jamais un prénom ni une date de naissance, et gardez la liste qui associe noms d’utilisateur et élèves dans les outils de votre établissement.\n- **Informez les parents** de ce qu’est le site, de ce que les élèves y feront, de ce qu’il conserve et pendant combien de temps, en suivant les règles de votre établissement en matière d’information et de consentement. Certaines notes pour l’enseignant du site conseillent de demander l’autorisation des parents avant les activités avec webcam ou photos.\n\n**Pendant la séance**\n\n- **Aucune donnée personnelle dans les projets.** Les exemples d’entraînement sont inventés : commandes, dessins, objets, mots imaginaires. Ni prénoms de camarades, ni nom d’établissement, ni photos d’élèves, ni histoires vraies sur qui que ce soit.\n- **Webcam et micro.** Certains projets les utilisent. C’est vous qui décidez s’ils sont allumés, et quand, selon les règles de votre établissement : la webcam vise des objets ou des dessins, jamais des visages, et les sons sont inventés, jamais la voix d’un camarade. Smart Classroom, l’activité ci-dessous, n’a besoin ni de l’une ni de l’autre.\n- **Fixez des règles de langage.** Un projet qui trie des messages gentils et méchants peut pousser les élèves à taper de vraies insultes : convenez à l’avance de ce qui peut être écrit.\n\n**Après la séance**\n\nLes projets « Essayer maintenant » disparaissent d’eux-mêmes. Avec des comptes de classe, supprimez les projets, puis les comptes élèves dès que vous n’en avez plus besoin, comme l’exigent les règles de conservation de votre établissement.',
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
                body: 'Most worksheets take 45 minutes to an hour, and the official teacher’s notes for Smart Classroom give the same estimate. Read them before you plan: [teacher’s notes for Smart Classroom (PDF, in English)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom.pdf), also available in a [French translation (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom-fr.pdf).\n\n**Before the day:** do the activity yourself (below), then test the site on a pupil device, on the school network, with Try it now. The site’s help explains that its automatic check can fail behind a VPN, with a privacy extension or on a strictly filtered school network, and suggests asking whoever manages the network to allow *challenges.cloudflare.com*. Bookmark the site address, which is long to type, and print or display the worksheet.\n\n| Time | What pupils do | Your role |\n|---|---|---|\n| 0–5 min | A hook: "How does a voice assistant know what you are asking for?" | Collect ideas, without giving the answer |\n| 5–10 min | The rules: invented examples only, nothing about real people; work and evidence saved before the end | State the rules; announce the time limit |\n| 10–30 min | Add labels and examples, train, test with new sentences, fill in a test table | Circulate; ask "Why do you think it got that wrong?" |\n| 30–45 min | Connect the model to the Scratch project with the worksheet | Help pupils who are stuck on the worksheet steps |\n| 45–55 min | Share one success and one mistake with the class | Draw out the idea: patterns learned from examples, not understanding |\n| 55–60 min | Exit ticket; evidence saved (screenshot and table) | Check that no screenshot shows anything personal |\n\nFor a 45-minute lesson, shorten the Scratch part or keep it for a second lesson (with class accounts, since a Try it now project will be gone).\n\n**If the site is blocked: a paper version.** Pupils write several commands on cards for each of four labels (fan on, fan off, lamp on, lamp off), in their own words. A partner, the "model", studies these training cards and writes down a few rules. The class then writes new test cards, including one that matches no label, and the model sorts them, adding a "not sure" pile. Pupils fill in a test table and discuss each mistake: the same ideas of examples, labels, testing and confidence, with no screen at all. If only pupil devices are blocked, you can also run the activity on the class screen, with pupils suggesting the examples.',
              },
              fr: {
                heading: 'Préparer une séance de 45 à 60 minutes, avec une solution de repli',
                body: 'La plupart des fiches demandent de 45 minutes à une heure, et les notes officielles pour l’enseignant de Smart Classroom donnent la même estimation. Lisez-les avant de préparer votre séance : [notes pour l’enseignant de Smart Classroom, traduites en français (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom-fr.pdf), ou leur [version originale en anglais (PDF)](https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom.pdf).\n\n**Avant le jour J :** faites vous-même l’activité (ci-dessous), puis testez le site sur un poste élève, depuis le réseau de l’établissement, avec « Essayer maintenant ». L’aide du site explique que sa vérification automatique peut échouer derrière un VPN, avec une extension de protection de la vie privée ou sur un réseau scolaire très filtré, et conseille de demander à la personne qui gère le réseau d’autoriser *challenges.cloudflare.com*. Créez un favori vers l’adresse du site, longue à taper, et imprimez ou projetez la fiche.\n\n| Temps | Ce que font les élèves | Votre rôle |\n|---|---|---|\n| 0–5 min | Une accroche : « Comment un assistant vocal sait-il ce qu’on lui demande ? » | Recueillir les idées, sans donner la réponse |\n| 5–10 min | Les règles : uniquement des exemples inventés, rien sur des personnes réelles ; travail et traces enregistrés avant la fin | Énoncer les règles ; annoncer la limite de temps |\n| 10–30 min | Ajouter des étiquettes et des exemples, entraîner, tester avec des phrases nouvelles, remplir un tableau de tests | Circuler ; demander « Pourquoi s’est-il trompé, d’après toi ? » |\n| 30–45 min | Relier le modèle au projet Scratch grâce à la fiche | Aider les élèves bloqués dans les étapes de la fiche |\n| 45–55 min | Présenter à la classe une réussite et une erreur | Faire émerger l’idée : des régularités apprises à partir d’exemples, pas de la compréhension |\n| 55–60 min | Billet de sortie ; traces enregistrées (capture d’écran et tableau) | Vérifier qu’aucune capture ne montre d’information personnelle |\n\nPour une séance de 45 minutes, raccourcissez la partie Scratch ou gardez-la pour une deuxième séance (avec des comptes de classe, puisqu’un projet « Essayer maintenant » aura disparu).\n\n**Si le site est bloqué : une version sur papier.** Les élèves écrivent sur des cartes plusieurs commandes pour chacune des quatre étiquettes (allumer le ventilateur, l’éteindre, allumer la lampe, l’éteindre), avec leurs propres mots. Un partenaire, le « modèle », étudie ces cartes d’entraînement et note quelques règles. La classe écrit ensuite de nouvelles cartes de test, dont une qui ne correspond à aucune étiquette, et le modèle les trie, avec une pile « pas sûr ». Les élèves remplissent un tableau de tests et discutent de chaque erreur : les mêmes idées d’exemples, d’étiquettes, de tests et de confiance, sans aucun écran. Si seuls les postes élèves sont bloqués, vous pouvez aussi mener l’activité sur l’écran de la classe, les élèves proposant les exemples.',
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
                  'A short video from Code.org’s AI for Oceans activity, in English, that you could show pupils at the start of a Machine Learning for Kids lesson.',
                transcript:
                  'In short: machine learning is the most common kind of AI, and most people use it every day, in spam filters, auto-complete, video suggestions, voice assistants, translation apps and photo apps. Instead of being given a rule for every case, the computer is given many examples, called training data. It finds patterns in them and uses those patterns to make predictions about new cases. It gets better with more good examples, and it can still be wrong. As you watch, think about which everyday example your pupils will recognise first, and how you will link it to the activity: in Smart Classroom, the training data is the commands they type.',
              },
              fr: {
                title:
                  'Regardez : qu’est-ce que l’apprentissage automatique ? (pour lancer la séance)',
                caption:
                  'Une courte vidéo de Code.org, tirée de l’activité AI for Oceans, que vous pourriez montrer à vos élèves au début d’une séance avec Machine Learning for Kids (vidéo en anglais).',
                transcript:
                  'En bref : l’apprentissage automatique (en anglais, « machine learning ») est la forme d’IA la plus courante, et la plupart des gens s’en servent tous les jours : filtres anti-spam, saisie automatique, suggestions de vidéos, assistants vocaux, applications de traduction ou de photos. Au lieu de recevoir une règle pour chaque cas, l’ordinateur reçoit de nombreux exemples, appelés données d’entraînement. Il y repère des régularités et s’en sert pour faire des prédictions sur des cas nouveaux. Il s’améliore avec davantage de bons exemples, et il peut quand même se tromper. En regardant, demandez-vous quel exemple de la vie courante vos élèves reconnaîtront en premier, et comment vous le relierez à l’activité : dans Smart Classroom, les données d’entraînement, ce sont les commandes qu’ils tapent.',
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
                  '**Goal:** do the quick Try it now version of Smart Classroom yourself, in about 20 to 25 minutes, so that you know what your pupils will meet. You will train a model to recognise which device a typed command is about (a fan or a lamp, on or off) and use it to control a virtual classroom in Scratch. The big idea for pupils: the model learns patterns from the examples they give it, and a low confidence score signals a command unlike any of its examples.\n\n**Your examples:** invented commands only, as you will ask of your pupils. Nothing about real people or your school.\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**. If the automatic check fails, note it down: it is a finding for your plan (see the hint).\n2. Create a project named *smart classroom* that recognises **text**, in the language you will type your examples in.\n3. In **Train**, add the four labels the worksheet uses for the fan and the lamp, on and off. Keep its label names, so that its Scratch template works.\n4. Type at least six examples per label, as varied as you can: direct orders, polite requests and indirect remarks (*"I can hardly read the board"*).\n5. In **Learn & Test**, train the model, then test it with five sentences you did not use, including one that matches no label (*"What time is lunch?"*). Note the label and the confidence score for each.\n6. In **Make**, open Scratch 3 and follow the official worksheet (PDF) to connect your model to the classroom template, then test it with new commands.\n7. Note where you hesitated and how long each part took: this is the timing of your own lesson plan.',
                bringBack:
                  'For the reflections below: your test table (five new sentences, the label you expected, the label and confidence score the model gave), one mistake with your explanation of it, and how long each part took you. Keep it in your own notes: there is nothing to upload.',
                hint: 'Try it now will not start? The site first checks automatically that you are a person (a Cloudflare check), and a VPN, a privacy extension or a strictly filtered school network can block it: try another network or browser, and ask your IT team to allow the site and challenges.cloudflare.com. A command lands under the wrong label? Add more varied examples to the labels it confuses, then train again. Try it now keeps one project at a time: delete an old one before you start.',
              },
              fr: {
                title:
                  'Salle de classe intelligente : apprenez à un modèle à reconnaître des commandes, comme vos élèves',
                instructions:
                  '**Objectif :** réaliser vous-même la version rapide « Try it now » de Smart Classroom (Salle de classe intelligente), en 20 à 25 minutes environ, pour savoir ce que vos élèves vont rencontrer. Vous allez entraîner un modèle à reconnaître de quel appareil parle une commande tapée au clavier (un ventilateur ou une lampe, à allumer ou à éteindre) et vous en servir pour piloter une classe virtuelle dans Scratch. La grande idée pour les élèves : le modèle apprend des régularités à partir des exemples qu’ils lui donnent, et un score de confiance faible signale une commande qui ne ressemble à aucun de ses exemples.\n\n**Vos exemples :** uniquement des commandes inventées, comme vous le demanderez à vos élèves. Rien sur des personnes réelles ni sur votre établissement.\n\n1. Ouvrez Machine Learning for Kids avec le bouton ci-dessous et choisissez **Essayer maintenant** (*Try it now*). Si la vérification automatique échoue, notez-le : c’est une information pour votre préparation (voir l’indice).\n2. Créez un projet nommé *smart classroom* qui reconnaît du **texte**, et choisissez comme **Langue** celle dans laquelle vous taperez vos exemples.\n3. Dans **Entraîner** (*Train*), ajoutez les quatre étiquettes de la fiche pour le ventilateur et la lampe, allumés ou éteints, en gardant leurs noms anglais pour que le gabarit Scratch de la fiche fonctionne.\n4. Tapez au moins six exemples par étiquette, aussi variés que possible : ordres directs, demandes polies et remarques indirectes (*« Je n’arrive plus à lire le tableau »*).\n5. Dans **Apprendre & Tester** (*Learn & Test*), entraînez le modèle, puis testez-le avec cinq phrases que vous n’avez pas utilisées, dont une qui ne correspond à aucune étiquette (*« On mange à quelle heure ? »*). Notez pour chacune l’étiquette et le score de confiance.\n6. Dans **Faire** (*Make*), ouvrez Scratch 3 et suivez la fiche officielle (PDF) pour relier votre modèle au gabarit de la classe, puis testez-le avec de nouvelles commandes.\n7. Notez les moments où vous avez hésité et le temps passé sur chaque partie : c’est le minutage de votre propre séance.',
                bringBack:
                  'Pour les réflexions ci-dessous : votre tableau de tests (cinq phrases nouvelles, l’étiquette attendue, l’étiquette et le score de confiance donnés par le modèle), une erreur avec votre explication, et le temps passé sur chaque partie. Gardez-les dans vos notes : il n’y a rien à déposer.',
                hint: '« Essayer maintenant » ne démarre pas ? Le site vérifie d’abord automatiquement que vous êtes une personne (une vérification Cloudflare), et un VPN, une extension de protection de la vie privée ou un réseau scolaire très filtré peuvent la bloquer : essayez un autre réseau ou un autre navigateur, et demandez à votre service informatique d’autoriser le site et challenges.cloudflare.com. Une commande arrive sous la mauvaise étiquette ? Ajoutez des exemples plus variés aux étiquettes que le modèle confond, puis entraînez-le de nouveau. « Essayer maintenant » ne garde qu’un projet à la fois : supprimez l’ancien avant de commencer.',
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
                  'Ask the AI tutor to put to you, one at a time, three things that can go wrong in a Machine Learning for Kids lesson. Answer each one in your own words, using this lesson, before you read its feedback.',
                starterPrompt:
                  'Challenge me with three short situations, one at a time, that could go wrong during a Machine Learning for Kids lesson with pupils aged 11 (for example the site is blocked, a pupil types a classmate’s name, or a pupil wants to use the webcam). After each of my answers, tell me what I missed.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA de vous soumettre, une à une, trois situations qui peuvent mal tourner pendant une séance avec Machine Learning for Kids. Répondez à chacune avec vos propres mots, en vous appuyant sur cette leçon, avant de lire son retour.',
                starterPrompt:
                  'Lancez-moi un défi : présentez-moi, une à la fois, trois courtes situations qui pourraient mal tourner pendant une séance avec Machine Learning for Kids, avec des élèves de 11 ans (par exemple, le site est bloqué, un élève tape le prénom d’un camarade, ou un élève veut utiliser la webcam). Après chacune de mes réponses, dites-moi ce que j’ai oublié.',
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
                  'Write the account, consent and data plan for your first Machine Learning for Kids lesson. Give the class (the age only) and the worksheet, the way in you choose (Try it now, your own class account or a managed class account) and why, who in your school must agree, what pupils may and may not type or show, your rule for webcams and microphones, how parents are informed, what happens to projects and accounts afterwards, and your fallback if the site is blocked. Use the timings you noted in the activity above.',
              },
              fr: {
                prompt:
                  'Rédigez le plan « compte, consentement et données » de votre première séance avec Machine Learning for Kids. Indiquez la classe (l’âge seulement) et la fiche choisie, le mode d’accès retenu (Essayer maintenant, votre propre compte de classe ou un compte de classe géré) et pourquoi, qui doit donner son accord dans votre établissement, ce que les élèves peuvent ou non taper ou montrer, votre règle pour la webcam et le micro, la façon dont les parents sont informés, ce que deviennent ensuite les projets et les comptes, et votre solution de repli si le site est bloqué. Appuyez-vous sur le minutage noté pendant l’activité ci-dessus.',
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
                  'Qu’est-ce qui vous a surpris en faisant l’activité dans la peau d’un élève, et que changerez-vous dans votre séance en conséquence ?',
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
                'What counts as evidence when pupils train a model, a simple rubric, the misconceptions to listen for, questions that open a discussion on bias, and how to choose the next worksheet by age and goal.',
            },
            fr: {
              title: 'Évaluer ce que les élèves construisent avec l’apprentissage automatique',
              summary:
                'Ce qui constitue une trace d’apprentissage quand les élèves entraînent un modèle, une grille simple, les idées fausses à repérer, des questions pour ouvrir une discussion sur les biais, et le choix de la fiche suivante selon l’âge et l’objectif.',
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
                body: 'After a Smart Classroom lesson, three pupils aged 12 hand in their work.\n\n- **Pupil A:** a screenshot of the test page: "100% right, my model is perfect." Every sentence tested was copied from the training examples.\n- **Pupil B:** a Scratch classroom that works well. Asked why the lamp came on when she typed "it’s freezing in here", she shrugs: "It just knows."\n- **Pupil C:** a model that often confuses the two lamp labels, with a short note: "Almost all my lamp examples had the word *light* in them, so it mixes up on and off. I added examples about glare and darkness, and it got better."\n\nWhich pupil learned the most about machine learning? The working product is not the best evidence, as module 3 argued for every task: the **process**, the tests and the explanations are. This lesson shows what to collect, how to judge it quickly and what to listen for.',
              },
              fr: {
                heading: 'Trois rendus, une question',
                body: 'Après une séance Smart Classroom, trois élèves de 12 ans rendent leur travail.\n\n- **Élève A :** une capture d’écran de la page de test : « 100 % de réussite, mon modèle est parfait. » Toutes les phrases testées étaient copiées de ses exemples d’entraînement.\n- **Élève B :** une classe Scratch qui fonctionne bien. Quand on lui demande pourquoi la lampe s’est allumée quand elle a tapé « on gèle ici », elle hausse les épaules : « Il sait, c’est tout. »\n- **Élève C :** un modèle qui confond souvent les deux étiquettes de la lampe, avec une courte note : « Presque tous mes exemples pour la lampe contenaient le mot *lumière*, alors il mélange allumer et éteindre. J’ai ajouté des exemples sur l’éblouissement et l’obscurité, et ça va mieux. »\n\nLequel de ces élèves a le plus appris sur l’apprentissage automatique ? Le produit qui fonctionne n’est pas la meilleure preuve, comme le module 3 l’a montré pour toute tâche : ce sont la **démarche**, les tests et les explications qui comptent. Cette leçon montre quoi recueillir, comment en juger rapidement et ce qu’il faut savoir entendre.',
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
                body: '**What to collect** (during the lesson: a Try it now project will not be there tomorrow)\n\n- **A screenshot** of the test page or of the finished game, with no names or personal details in it.\n- **A test table** of at least five inputs the model was never trained on: the input, the expected label, the model’s label, its confidence score (from 0 to 100 on this site), right or wrong. Pupils aged 8 to 10 can tick a printed table; older pupils can work out a percentage.\n- **An explanation of one mistake**, linked to the training data: "It got this wrong because…"\n- **One change and its effect:** the examples they added or changed, and the result of the new test. This is the GET FEEDBACK → IMPROVE step of the project cycle from module 4.\n\n**A simple rubric**\n\n| Criterion | Beginning | Secure | Advanced |\n|---|---|---|---|\n| **Training data** | A few similar examples, sometimes copied | Varied examples of their own for every label | Balanced, deliberately varied examples, with gaps the pupil has spotted |\n| **Testing** | Tests with training examples, or none | Five or more new inputs, honestly recorded | New inputs chosen to find weaknesses, including one that fits no label, with its confidence score |\n| **Explaining** | "It just knows." | Explains a mistake using the examples | Links mistakes to a pattern in the data and shows the effect of a change |\n| **Responsible use** | Personal details or real people in the examples | Invented examples only | Asks who the model might fail, and why |\n\nShare the rubric with pupils before they start, and adapt its wording to their age: for ages 8 to 10, three questions can replace it ("Did you test with new sentences? What did it get wrong? Why?"). For ages 15 to 18, ask for a success rate on a set of tests written by someone else.',
              },
              fr: {
                heading: 'Des traces d’apprentissage, et une grille simple',
                body: '**Ce qu’il faut recueillir** (pendant la séance : un projet « Essayer maintenant » n’existera plus le lendemain)\n\n- **Une capture d’écran** de la page de test ou du jeu terminé, sans nom ni information personnelle.\n- **Un tableau de tests** d’au moins cinq entrées sur lesquelles le modèle n’a jamais été entraîné : l’entrée, l’étiquette attendue, l’étiquette donnée par le modèle, son score de confiance (de 0 à 100 sur ce site), juste ou faux. Les élèves de 8 à 10 ans peuvent cocher les cases d’un tableau imprimé ; les plus grands peuvent calculer un pourcentage.\n- **L’explication d’une erreur**, reliée aux données d’entraînement : « Il s’est trompé parce que… »\n- **Une modification et son effet :** les exemples ajoutés ou modifiés, et le résultat du nouveau test. C’est l’étape RECEVOIR UN RETOUR → AMÉLIORER du cycle de projet du module 4.\n\n**Une grille simple**\n\n| Critère | En cours d’acquisition | Acquis | Dépassé |\n|---|---|---|---|\n| **Données d’entraînement** | Quelques exemples semblables, parfois recopiés | Des exemples variés et personnels pour chaque étiquette | Des exemples équilibrés et volontairement variés, avec des lacunes repérées par l’élève |\n| **Tests** | Tests avec les exemples d’entraînement, ou aucun test | Au moins cinq entrées nouvelles, notées honnêtement | Des entrées nouvelles choisies pour trouver les faiblesses, dont une qui ne correspond à aucune étiquette, avec son score de confiance |\n| **Explication** | « Il sait, c’est tout. » | Explique une erreur à partir des exemples | Relie les erreurs à une régularité des données et montre l’effet d’une modification |\n| **Usage responsable** | Des informations personnelles ou des personnes réelles dans les exemples | Uniquement des exemples inventés | Se demande pour qui le modèle pourrait échouer, et pourquoi |\n\nPrésentez la grille aux élèves avant qu’ils commencent, et adaptez sa formulation à leur âge : pour les 8 à 10 ans, trois questions peuvent la remplacer (« As-tu testé avec des phrases nouvelles ? Sur quoi s’est-il trompé ? Pourquoi ? »). Pour les 15 à 18 ans, demandez un taux de réussite sur une série de tests écrite par quelqu’un d’autre.',
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
                body: 'Three ideas come up in almost every class. Each one is a chance to teach, not a mistake to mark down.\n\n| What you hear | The misconception | A question that helps |\n|---|---|---|\n| "It understands what I mean." | The computer understands | "What happens if you type a sentence it has never seen, with the same words but the opposite meaning?" (*"I am not cold at all"*) |\n| "I’ll just add a hundred more." | More data is always better | "Which labels does it confuse? Add five *different* examples to one of them, and compare." Twenty copies of one sentence teach it one sentence. |\n| "100%: it’s perfect." | A good test score proves the model is right | "Who wrote the test sentences? Ask a classmate for ten new ones." Real systems make mistakes too, and a score on a handful of familiar inputs says little. |\n\nAlso listen for the **confidence score** read as a measure of truth: a model can give a high confidence score and still be wrong.\n\n**Opening a discussion on bias**\n\nPupils have just chosen the examples, so they can watch bias being made. Questions that work at most ages:\n\n- Whose way of speaking did our examples use? Would the model recognise a command from someone who speaks differently, or who is learning the language?\n- Which commands did nobody think of? What happens to the people who use them?\n- If a system like this decided something important (who gets help, who is let in), who could be treated unfairly, and who would be responsible?\n- Who chose the labels, and what does a label leave out?\n\nWith older pupils, Tourist Info (in the table below) goes further: they build a biased recommendation app on purpose, then discuss what it does.',
              },
              fr: {
                heading: 'Les idées fausses à repérer, et des questions sur les biais',
                body: 'Trois idées reviennent dans presque toutes les classes. Chacune est une occasion d’enseigner, pas une faute à sanctionner.\n\n| Ce que vous entendez | L’idée fausse | Une question qui aide |\n|---|---|---|\n| « Il comprend ce que je veux dire. » | L’ordinateur comprend | « Que se passe-t-il si tu tapes une phrase qu’il n’a jamais vue, avec les mêmes mots mais le sens contraire ? » (*« Je n’ai pas froid du tout »*) |\n| « Je vais en ajouter cent de plus. » | Plus de données, c’est toujours mieux | « Quelles étiquettes confond-il ? Ajoute à l’une d’elles cinq exemples *différents*, et compare. » Vingt copies d’une même phrase ne lui apprennent qu’une phrase. |\n| « 100 % : il est parfait. » | Un bon score au test prouve que le modèle a raison | « Qui a écrit les phrases de test ? Demande dix phrases nouvelles à un camarade. » Les vrais systèmes se trompent aussi, et un score obtenu sur quelques entrées familières ne dit pas grand-chose. |\n\nSoyez aussi attentif au **score de confiance** pris pour une mesure de la vérité : un modèle peut donner un score de confiance élevé et se tromper quand même.\n\n**Ouvrir une discussion sur les biais**\n\nLes élèves viennent de choisir les exemples : ils peuvent voir un biais se fabriquer sous leurs yeux. Des questions qui fonctionnent à presque tout âge :\n\n- Quelle façon de parler nos exemples utilisaient-ils ? Le modèle reconnaîtrait-il la commande de quelqu’un qui parle autrement, ou qui apprend la langue ?\n- À quelles commandes personne n’a-t-il pensé ? Que se passe-t-il pour les personnes qui les utilisent ?\n- Si un système comme celui-ci décidait de quelque chose d’important (qui reçoit une aide, qui peut entrer), qui risquerait d’être traité injustement, et qui en serait responsable ?\n- Qui a choisi les étiquettes, et qu’est-ce qu’une étiquette laisse de côté ?\n\nAvec des élèves plus âgés, Tourist Info (dans le tableau ci-dessous) va plus loin : ils construisent volontairement une application de recommandation biaisée, puis discutent de ce qu’elle fait.',
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
                body: 'No video this time: follow a teacher who marks the hand-in of Pupil C, from the start of this lesson, with the rubric.\n\n**What she has:** a screenshot of the test page, a test table of six new sentences (four right, two wrong, both between *lamp on* and *lamp off*) and the note about examples with the word *light*.\n\n**Training data: secure.** The examples are the pupil’s own and every label has some, but the lamp examples lean on one word. She writes: *"You spotted the gap yourself: that is the key skill."*\n\n**Testing: secure.** Six new sentences, honestly recorded, failures included. None that fits no label, so not advanced yet.\n\n**Explaining: advanced.** The pupil links the mistakes to a pattern in the training data and shows the effect of a change.\n\n**Responsible use: secure.** Invented examples only, but no thought yet about who the model might fail.\n\n**Feedback, in one line:** *"Next time, add one test that matches no label and look at its confidence score."*\n\n**What to notice:** the judgement took three minutes because the evidence was structured; the mark rewards the explanation more than the result; and the feedback names one next step that the pupil can act on.',
              },
              fr: {
                heading: 'Observez : évaluer un rendu en trois minutes',
                body: 'Pas de vidéo cette fois : suivez une enseignante qui évalue avec la grille le rendu de l’élève C, présenté au début de cette leçon.\n\n**Ce dont elle dispose :** une capture d’écran de la page de test, un tableau de six phrases nouvelles (quatre justes, deux fausses, toutes deux entre *allumer la lampe* et *éteindre la lampe*) et la note sur les exemples qui contenaient le mot *lumière*.\n\n**Données d’entraînement : acquis.** Les exemples sont personnels et chaque étiquette en a, mais ceux de la lampe reposent sur un seul mot. Elle écrit : *« Tu as repéré la lacune toi-même : c’est la compétence clé. »*\n\n**Tests : acquis.** Six phrases nouvelles, notées honnêtement, échecs compris. Aucune phrase hors étiquettes, donc pas encore « dépassé ».\n\n**Explication : dépassé.** L’élève relie les erreurs à une régularité des données d’entraînement et montre l’effet d’une modification.\n\n**Usage responsable : acquis.** Uniquement des exemples inventés, mais pas encore de réflexion sur les personnes pour qui le modèle pourrait échouer.\n\n**Retour, en une ligne :** *« La prochaine fois, ajoute un test qui ne correspond à aucune étiquette et regarde son score de confiance. »*\n\n**Ce qu’il faut remarquer :** le jugement a pris trois minutes parce que les traces étaient structurées ; l’évaluation valorise l’explication plus que le résultat ; et le retour indique une seule prochaine étape, que l’élève peut mettre en œuvre.',
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
                body: 'The site lists more than fifty worksheets. Here are seven that work well after Smart Classroom, with the type and level the site gives them (the ages are our own suggestion).\n\n| Worksheet (PDF) | Type | Level | Big idea | Suggested ages |\n|---|---|---|---|---|\n| [Mailman Max](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mailmanmax.pdf) | Images | Beginner | Recognising handwriting, drawn with the mouse | 8 to 11 |\n| [Smart Classroom](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf) | Text | Beginner | Recognising what a command means | 8 to 13 |\n| [Make me happy](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy.pdf) | Text | Beginner | Recognising kind and unkind messages (agree on rules for language first) | 9 to 13 |\n| [Fooled](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-fooled.pdf) | Images | Intermediate | A badly trained model learns the wrong clue; best after a first project | 11 to 16 |\n| [Tourist Info](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-touristinfo.pdf) | Text | Intermediate | Building a biased recommendation app on purpose, then discussing it | 13 to 18 |\n| [Zombie Escape!](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-zombieescape.pdf) | Numbers | Advanced (intermediate in its teacher’s notes) | A decision tree that learns from game data which way to go | 12 to 16 |\n| [Chatbots (Python)](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-chatbots-python.pdf) | Text, with Python | Intermediate | A question classifier used from Python code; pupils get a project key, which must stay out of anything they hand in | 15 to 18 |\n\n**Try it:** choose two worksheets for one of your classes, one to practise the idea of learning from examples and one to discuss its limits. For each, note the age of the pupils, the way in you would use, the evidence you would collect and one risk to plan for (personal data, webcam, language, time).\n\nThen compare with this example: for pupils aged 12, Smart Classroom first, with Try it now and a test table, then Fooled a week later, to discuss why variety in training data matters. The risk with Fooled is time and the choice of images: pupils look for pictures of fruit on the web, so prepare safe search instructions.',
              },
              fr: {
                heading: 'À vous : choisissez la fiche suivante',
                body: 'Le site propose plus de cinquante fiches. En voici sept qui conviennent bien après Smart Classroom, avec le type et le niveau que leur donne le site (les âges sont une suggestion de notre part). Les fiches sont en anglais ; les titres français entre parenthèses sont ceux du site.\n\n| Fiche (PDF, en anglais) | Type | Niveau | Grande idée | Âges suggérés |\n|---|---|---|---|---|\n| [Mailman Max](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mailmanmax.pdf) (Le facteur Max) | Images | Débutant | Reconnaître une écriture manuscrite, tracée à la souris | 8 à 11 ans |\n| [Smart Classroom](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-smartclassroom-tryitnow.pdf) (Salle de classe intelligente) | Texte | Débutant | Reconnaître ce que signifie une commande | 8 à 13 ans |\n| [Make me happy](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy.pdf) (Rends-moi heureux) | Texte | Débutant | Reconnaître des messages gentils et méchants (fixer d’abord des règles de langage) | 9 à 13 ans |\n| [Fooled](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-fooled.pdf) (Trompé) | Images | Intermédiaire | Un modèle mal entraîné apprend le mauvais indice ; mieux après un premier projet | 11 à 16 ans |\n| [Tourist Info](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-touristinfo.pdf) (Informations touristiques) | Texte | Intermédiaire | Construire volontairement une application de recommandation biaisée, puis en discuter | 13 à 18 ans |\n| [Zombie Escape!](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-zombieescape.pdf) (Fuir les zombies !) | Nombres | Avancé (intermédiaire selon ses notes pour l’enseignant) | Un arbre de décision qui apprend, à partir de données de jeu, quelle direction prendre | 12 à 16 ans |\n| [Chatbots (Python)](https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-chatbots-python.pdf) (Agent conversationnel) | Texte, avec Python | Intermédiaire | Un classificateur de questions utilisé depuis du code Python ; les élèves reçoivent une clé de projet, qui ne doit figurer dans rien de ce qu’ils rendent | 15 à 18 ans |\n\n**À vous :** choisissez deux fiches pour l’une de vos classes, l’une pour pratiquer l’idée d’apprentissage à partir d’exemples, l’autre pour discuter de ses limites. Pour chacune, notez l’âge des élèves, le mode d’accès que vous utiliseriez, les traces que vous recueilleriez et un risque à anticiper (données personnelles, webcam, langage, temps).\n\nComparez ensuite avec cet exemple : pour des élèves de 12 ans, Smart Classroom d’abord, avec « Essayer maintenant » et un tableau de tests, puis Fooled une semaine plus tard, pour discuter de l’importance de la variété des données d’entraînement. Le risque, avec Fooled, c’est le temps et le choix des images : les élèves cherchent des photos de fruits sur le web, alors préparez des consignes de recherche sûres.',
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
                  'Ask the AI tutor for three example explanations a pupil might write about a mistake their model made, then place each one on the rubric yourself before you read the tutor’s view. Notice where you disagree with it: your judgement is the one that counts.',
                starterPrompt:
                  'Give me three short examples of how a pupil aged 12 might explain why their Smart Classroom model put "it’s boiling in here" under lamp on instead of fan on: one weak, one secure and one strong explanation. Do not label them: I will rank them myself first.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA trois exemples d’explications qu’un élève pourrait écrire à propos d’une erreur de son modèle, puis placez vous-même chacune sur la grille avant de lire l’avis du tuteur. Repérez les points sur lesquels vous n’êtes pas d’accord avec lui : c’est votre jugement qui compte.',
                starterPrompt:
                  'Donnez-moi trois courts exemples de la façon dont un élève de 12 ans pourrait expliquer pourquoi son modèle Smart Classroom a classé « on étouffe ici » sous « allumer la lampe » au lieu de « allumer le ventilateur » : une explication faible, une correcte et une solide. Ne précisez pas laquelle est laquelle : je les classerai d’abord moi-même.',
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
                  'Plan how you will assess one Machine Learning for Kids lesson. Name the worksheet and the age of the pupils, list the evidence you will collect (and when, if you use Try it now), write your rubric (three or four criteria, three levels), one question you will ask to challenge a misconception and one question to open a discussion on bias. Then get feedback on it (open the AI tutor in Check my work mode, with no personal data, or ask a colleague) and note one change you made as a result.',
              },
              fr: {
                prompt:
                  'Préparez l’évaluation d’une séance avec Machine Learning for Kids. Indiquez la fiche et l’âge des élèves, listez les traces que vous recueillerez (et à quel moment, si vous utilisez « Essayer maintenant »), rédigez votre grille (trois ou quatre critères, trois niveaux), une question que vous poserez pour bousculer une idée fausse et une question pour ouvrir une discussion sur les biais. Demandez ensuite un retour (au tuteur IA en mode « Vérifie mon travail », sans aucune donnée personnelle, ou à un collègue) et notez une modification que vous y avez apportée en conséquence.',
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
                  'Pensez aux élèves que vous avez en classe. Laquelle des trois idées fausses vous attendez-vous à entendre le plus souvent, et que direz-vous ou ferez-vous quand vous l’entendrez ?',
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
            title: 'Quiz : enseigner l’apprentissage automatique par la pratique',
            instructions: 'Six questions. Il faut 70 % pour réussir, et vous pouvez réessayer.',
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
                  'Un collègue prévoit une séance unique avec Machine Learning for Kids pour des élèves de 10 ans et veut que le site conserve le moins possible de données à leur sujet. Quelle option convient le mieux ?',
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
                    text: 'Essayer maintenant : aucun compte, un projet à la fois, effacé au bout de quelques heures, avec des traces enregistrées pendant la séance',
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
                text: 'Essayer maintenant ne demande aucun compte et, selon le site, ne recueille aucune information personnelle ; les projets sont effacés au bout de quelques heures, il faut donc enregistrer les traces pendant la séance. Les élèves ne peuvent pas créer de compte eux-mêmes, un nom d’utilisateur ne doit jamais contenir de prénom, et un identifiant partagé fait perdre toute maîtrise de qui a fait quoi.',
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
                  'Lesquels de ces exemples d’entraînement les élèves peuvent-ils utiliser ? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Invented commands such as "it is far too dark in here"' },
                  fr: { text: 'Des commandes inventées comme « il fait bien trop sombre ici »' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'A sentence that names a classmate: "Sami always switches the fan off"',
                  },
                  fr: {
                    text: 'Une phrase qui nomme un camarade : « Sami éteint toujours le ventilateur »',
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
                  'Avec un compte de classe que vous créez vous-même (un compte « non géré »), tous les types de projets demandent des clés d’API IBM Cloud.',
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
                  'Un élève vous montre une page de test où toutes les réponses sont justes et déclare : « 100 %, mon modèle est parfait. » Quelle est la réaction la plus utile ?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Give full marks for testing: the result speaks for itself' },
                  fr: {
                    text: 'Donner tous les points pour les tests : le résultat parle de lui-même',
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
                  'Qui décide si les élèves peuvent utiliser des comptes de classe sur Machine Learning for Kids ?',
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
                  'Avec chaque prédiction, un modèle de Machine Learning for Kids donne un nombre de 0 à 100, faible quand l’entrée ne ressemble pas à ses exemples d’entraînement. Comment s’appelle ce nombre ? (trois mots)',
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
