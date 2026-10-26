// Module m4 of "AI Robotics Foundations" (ages 10-14): robots that listen. It comes after m2
// (robots that see and decide) and before m5 (robots that learn to choose) and m3 (build your
// autonomous robot, which stays last). It builds on the sensor noise of m1-l2, on the pixels,
// labels, confidence scores and lighting of m2-l1 (a microphone gives a stream of numbers too,
// and a spectrogram turns it into a picture a model can learn from) and on the rule of m2-l2
// that a safety rule never depends only on a guess. m3-l2, later in the course, asks learners
// to agree on an emergency stop before every test; m4-l2 explains why it must not depend on AI.
// m4-l1: what a microphone measures (16,000 measurements a second is a common rate for speech),
// the spectrogram (time left to right, pitch bottom to top, brightness = loudness) and why
// distance, noise and the way a word is said change it. Then the Machine Learning for Kids
// activity Alien Language (Communique avec un Alien; worksheet-alienlanguage.pdf; sounds;
// Scratch 3; Try it now, no accounts): two made-up command words, labelled left and right so
// that the worksheet's Scratch template and scripts match, plus the site's background noise
// label (it keeps that English name in the French interface); made-up words in the learner's own
// voice or sounds made with hands or objects, never a classmate's voice; microphone only with the
// teacher's permission (step 3, its first use). Neighbours stay quiet during every recording and
// background noise is recorded with nobody talking, so no classmate's voice ends up in the
// training examples. Step 2 picks the storage "In your web browser" (« Dans votre navigateur
// web »): sound examples then stay in the browser (uploadSound in public/components/training/
// training.service.js); cloud storage uploads them (src/lib/restapi/sounds/uploads.ts) for the
// life of the Try it now session (SESSION_LIFESPAN, 4 hours). The browser option appears only
// where IndexedDB works (newproject.html, isLocalSupported), so step 2 falls back to "In the
// cloud" (« Dans le nuage »). The one-project limit of Try it now (restapi/projects.ts) counts
// cloud projects only, so the card does not mention it. The test page keeps the last confident
// result on screen until Stop listening clears it (models.controller.js), hence the
// start-sound-stop protocol of step 6. Step 8 logs out: for a Try it now user, logout deletes the
// session user with its cloud data and its in-browser projects (auth.service.js logout,
// deleteSessionUserProjects). To fit 40 minutes (the teacher's
// notes say 1 hour), the worksheet's first part (the ready-made Speech to Text blocks) is skipped,
// the test plan is 3 tries per case, and the Scratch part is an extension ("if you have time";
// the screenshot of the test page is enough for the hand-in). The French Scratch button is
// « Modèles de projets » (Project templates). The site asks for at least 8 examples per label in
// a sounds project, and it trains sound models in the browser (tensorflow-models-speech-commands
// with BROWSER_FFT, a spectrogram, in IBM/taxinomitis). A paper version for schools that block
// the site or the microphone (sound pictures on a 3 x 6 grid, a partner as the model, "far
// away", "noisy" and never-learned test cards); the hand-in project-m4 (assignment: a screenshot
// and a test table of sound, place, tries and recognised; no audio submissions). No tutor
// activity in m4-l1, for time.
// m4-l2: false triggers and missed commands (which one is worse depends on the command), clear
// command words, a confidence threshold (the site's own test page uses one, probabilityThreshold
// 0.7 in components/soundtraining/soundtraining.service.js; not mentioned, for length), confirmations,
// push-to-talk or a wake word, "stop always wins", and a physical emergency stop that cuts the
// motors without the program; devices that are always listening (general statements only: the
// wake word is usually detected on the device, what follows is often sent to the company, some
// companies have had staff listen to a share of recordings; a voice recording can be personal
// data, e.g. under the GDPR) and fairness for voices a model heard little of. The blocks code
// activity, to trace by hand: background noise is set aside before the threshold test (else a
// quiet room would make the robot ask "say that again" on its own); with a threshold of 80, the
// six heard labels give turn left, say again, stop, nothing, drive forward, say again; a
// threshold of 60 changes only the sixth (turn left), 95 changes the first and the fifth (say
// again). Step 3 shows the limit of "stop always wins": the loop does not listen while the robot
// drives, so only the emergency stop button can stop it then. Step 4 (the confirmation) is a
// bonus, for time. code_activity instructions and hints, project requirements, bringBack and
// ml_activity hints are plain text: no Markdown there, code in quotes. Then a check_my_work tutor
// activity, the module quiz quiz-m4 and a reflection. No video block in this module: no curated
// video in the course files is about sound or speech recognition.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m4: SeedModulePart = {
  module: {
    id: 'm4',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Robots that listen',
          description:
            'Train a sound recogniser for robot commands, then design voice commands that are safe, reliable and respectful of privacy.',
        },
        fr: {
          title: 'Des robots qui écoutent',
          description:
            'Entraîne un modèle de reconnaissance de sons pour commander un robot, puis conçois des commandes vocales sûres, fiables et respectueuses de la vie privée.',
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
              title: 'Give a robot ears',
              summary:
                'How a robot turns sounds into patterns it can learn, and why noise and distance change what it hears. Then train a model to recognise your own alien command words.',
            },
            fr: {
              title: 'Donne des oreilles à un robot',
              summary:
                'Comment un robot transforme les sons en motifs qu’il peut apprendre, et pourquoi le bruit et la distance changent ce qu’il entend. Ensuite, apprends à un modèle à reconnaître tes propres mots de commande extraterrestres.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'Can a robot hear you?',
                body: 'Picture a robot in a busy school canteen. Someone says *stop*, just as a tray clatters and twenty people are talking. Did the robot hear the command, or did it take the clatter for one?\n\nIn module 2 you saw that a camera gives a robot a grid of numbers, not a picture of a cat. A **microphone** is the same: it gives the robot a stream of numbers, and nowhere in them is the word *stop*. Smart speakers, phones and some robots turn that stream into commands with AI.\n\nIn this lesson you will train a sound recogniser of your own, with made-up words, and find out what makes it reliable, and what makes it fail.',
              },
              fr: {
                heading: 'Un robot peut-il t’entendre\u00a0?',
                body: 'Imagine un robot dans une cantine scolaire bondée. Quelqu’un dit *stop*, juste au moment où un plateau tombe et où vingt personnes parlent. Le robot a-t-il entendu l’ordre, ou a-t-il pris le fracas du plateau pour un ordre\u00a0?\n\nDans le module 2, tu as vu qu’une caméra donne au robot une grille de nombres, pas l’image d’un chat. Un **microphone**, c’est pareil\u00a0: il lui fournit un flot de nombres, et nulle part dans ces nombres on ne trouve le mot *stop*. Les enceintes connectées, les téléphones et certains robots transforment ce flot en commandes grâce à l’IA.\n\nDans cette leçon, tu vas entraîner ton propre modèle de reconnaissance de sons, avec des mots inventés, et découvrir ce qui le rend fiable… et ce qui le fait échouer.',
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
                heading: 'Sounds are patterns',
                body: "**What a microphone measures.** A sound is air vibrating. A microphone measures the air pressure thousands of times a second (16,000 is common for speech) and turns each measurement into a number.\n\n**A picture of a sound.** Those numbers are hard to read, so many sound recognisers first turn them into a **spectrogram**, a picture of the sound:\n\n- time goes from left to right;\n- pitch goes from low sounds at the bottom (a drum) to high sounds at the top (a whistle);\n- the brighter a spot, the louder that pitch is at that moment.\n\nA short, high *zip* is a small bright patch near the top. A long, low *groom* is a long band along the bottom. A clap is a thin stripe from bottom to top, because it contains almost every pitch at once. A fan is a dull haze that never stops.\n\n**Learning the patterns.** Once a sound is a picture, a model learns it like the vision models of module 2: from labelled examples, it finds the patterns that tell the labels apart and, for a new sound, it gives a **label and a confidence score**, such as *left, 85%*. Machine Learning for Kids turns your recordings into sound pictures like these and trains its model in your browser.\n\n**Why noise and distance change the result**\n\n| What changes | The sound picture | What the model may do |\n|---|---|---|\n| You stand farther away | The patch gets fainter; the room's echo and noise fill more of the picture | Miss the command |\n| People talk, music plays | Extra bright shapes appear everywhere | Hear a command nobody gave, or miss the real one |\n| You say the word faster, slower or in another voice | The patch gets shorter, longer, higher or lower | Fail, if it learned only one way of saying it |\n\nThat is why a sound model needs a **background noise** label (the sounds of the room when nobody gives a command) and **varied** examples: near and far, soft and loud, in the room where the robot will really work.",
              },
              fr: {
                heading: 'Les sons sont des motifs',
                body: '**Ce que mesure un microphone.** Un son, c’est de l’air qui vibre. Un microphone mesure la pression de l’air des milliers de fois par seconde (16\u00a0000 fois, c’est courant pour la voix) et transforme chaque mesure en nombre.\n\n**Une image du son.** Ces nombres sont difficiles à lire. C’est pourquoi beaucoup de systèmes de reconnaissance de sons les transforment d’abord en **spectrogramme**, une image du son\u00a0:\n\n- le temps va de gauche à droite\u00a0;\n- la hauteur va des sons graves en bas (un tambour) aux sons aigus en haut (un sifflet)\u00a0;\n- plus un point est clair, plus le son est fort à cette hauteur, à ce moment-là.\n\nUn *zip* court et aigu forme une petite tache claire près du haut. Un *groom* long et grave forme une longue bande tout en bas. Un claquement de mains forme un mince trait du bas jusqu’en haut, car il contient presque toutes les hauteurs à la fois. Un ventilateur forme un voile terne qui ne s’arrête jamais.\n\n**Apprendre les motifs.** Une fois qu’un son est devenu une image, un modèle l’apprend comme les modèles de vision du module 2\u00a0: à partir d’exemples étiquetés, il trouve les motifs qui distinguent les étiquettes et, face à un son nouveau, il donne une **étiquette et un score de confiance**, par exemple *left, 85\u00a0%*. Machine Learning for Kids transforme tes enregistrements en images de ce genre et entraîne son modèle dans ton navigateur.\n\n**Pourquoi le bruit et la distance changent le résultat**\n\n| Ce qui change | L’image du son | Ce que le modèle risque de faire |\n|---|---|---|\n| Tu t’éloignes | La tache pâlit\u00a0; l’écho et le bruit de la pièce prennent plus de place | Rater l’ordre |\n| Des gens parlent, de la musique passe | Des formes claires apparaissent partout | Entendre un ordre que personne n’a donné, ou rater le vrai |\n| Tu dis le mot plus vite, plus lentement ou avec une autre voix | La tache devient plus courte ou plus longue, ou bien monte ou descend dans l’image | Échouer, s’il n’a appris qu’une seule façon de le dire |\n\nVoilà pourquoi un modèle de sons a besoin d’une étiquette **bruit de fond** (les bruits de la pièce quand personne ne donne d’ordre) et d’exemples **variés**\u00a0: de près et de loin, doucement et fort, dans la pièce où le robot travaillera vraiment.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b3',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Alien Language: teach a robot your own command words',
                instructions:
                  "**Goal:** invent two alien command words, one for *left* and one for *right*, then train and test a model that recognises them, as you would for a voice-controlled robot. The big idea: a sound recogniser learns patterns from examples, including what *no command* sounds like.\n\n**Your sounds:** made-up words in your own voice, or sounds you make with your hands or with objects (claps, finger clicks, a pencil tapping a rhythm); pick two that sound very different. Never record a classmate, and never say your name or anything real about yourself. During every recording, ask the people near you to stay quiet, so that only your own sound is recorded. Your own voice saying a made-up word is fine: it is kept only for this project and is deleted when you log out (step 8).\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**. Skip the worksheet's first part (the ready-made Speech to Text blocks): start where you invent your alien words.\n2. Create a project named *Alien Language* that recognises **sounds**. For **Storage**, choose **In your web browser**, so that your recordings stay on this computer. If that choice is missing, pick **In the cloud**: the site then keeps your recordings until you log out, or for a few hours at most.\n3. In **Train**, once your teacher has said yes to the microphone, record at least 8 examples of **background noise**: the hum of the room, a fan, chairs, footsteps, but no one talking.\n4. Add the labels *left* and *right* (keep these names, so that the worksheet's Scratch scripts match) and record at least 8 examples of each alien word, a little closer or farther, softer or louder each time.\n5. In **Learn & Test**, train the model and test it with **Start listening**. If it struggles, add examples and train again.\n6. Test like an engineer: say each word 3 times close to the microphone and 3 times from two steps away (or with some noise), then, 3 times, make a sound the model never learned, such as a cough. For each try, click **Start listening**, make the sound once, read the result, then click **Stop listening**, which clears it; if no result appears, the model heard no command. Note how often the model got it right (for the new sound, right means no result), and take a screenshot of the test page while it shows a result.\n7. If you have time, in **Make**, open Scratch 3, click **Project templates** and choose *Alien Language*, then follow the official worksheet (PDF) to make the alien walk when it hears your words.\n8. Once your work is handed in (project below), click **Log Out**: Try it now then deletes your project and its recordings.",
                bringBack:
                  'For the project below: your screenshot (no faces, names or school details) and your test table (each sound, where you tested it, the number of tries and how many times the model got it right, including the sound it never learned). Add one mistake the model made and why you think it happened, and one improvement you would make to your examples or command words.',
                hint: 'Everything sounds like the same word to the model? Choose two words that differ more (one short and sharp, one long and low) and record them again. It hears commands when nobody speaks? Add background noise examples recorded where you test, with nobody talking. No microphone or no site? Use the paper version below.',
              },
              fr: {
                title:
                  'Langage extraterrestre\u00a0: apprends à un robot tes propres mots de commande',
                instructions:
                  '**Objectif\u00a0:** inventer deux mots de commande extraterrestres, l’un pour *gauche*, l’autre pour *droite*, puis entraîner et tester un modèle qui les reconnaît, comme pour un robot à commande vocale. La grande idée\u00a0: un modèle de reconnaissance de sons apprend des motifs à partir d’exemples, y compris à quoi ressemble *aucun ordre*.\n\n**Tes sons\u00a0:** des mots inventés, dits avec ta propre voix, ou des sons faits avec tes mains ou avec des objets (claquements de mains ou de doigts, un crayon qui tapote un rythme)\u00a0; choisis-en deux très différents. N’enregistre jamais un camarade, et ne dis jamais ton nom ni rien de vrai sur toi. Pendant chaque enregistrement, demande à tes voisins de se taire, pour que seul ton son soit enregistré. Ta propre voix qui dit un mot inventé, c’est permis : elle n’est gardée que pour ce projet et s’efface quand tu te déconnectes (étape 8).\n\n1. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*). Saute la première partie de la fiche (les blocs prêts à l’emploi *Speech to Text*)\u00a0: commence là où tu inventes tes mots extraterrestres.\n2. Crée un projet nommé *Alien Language* qui reconnaît des **sons**. Pour le **Stockage**, choisis **Dans votre navigateur web**\u00a0: tes enregistrements restent ainsi sur cet ordinateur. Si ce choix n’apparaît pas, prends **Dans le nuage**\u00a0: le site garde alors tes enregistrements jusqu’à ce que tu te déconnectes, ou quelques heures au plus.\n3. Dans **Entraîner** (*Train*), une fois que ton enseignant a dit oui pour le micro, enregistre au moins 8 exemples de **background noise** (le bruit de fond)\u00a0: le léger bourdonnement de la pièce, un ventilateur, des chaises, des pas, mais personne qui parle.\n4. Ajoute les étiquettes *left* (gauche) et *right* (droite), en gardant ces noms anglais pour que les scripts Scratch de la fiche fonctionnent, et enregistre au moins 8 exemples de chaque mot, un peu plus près ou plus loin, plus doucement ou plus fort à chaque fois.\n5. Dans **Apprendre & Tester** (*Learn & Test*), entraîne le modèle et teste-le avec **Commencez à écouter** (*Start listening*). S’il a du mal, ajoute des exemples et entraîne-le de nouveau.\n6. Teste comme un ingénieur\u00a0: dis chaque mot 3 fois près du micro et 3 fois après avoir reculé de deux grands pas (ou avec un peu de bruit), puis fais 3 fois un son que le modèle n’a jamais appris, comme une toux. Pour chaque essai, clique sur **Commencez à écouter** (*Start listening*), fais le son une fois, lis le résultat, puis clique sur **Arrêtez d’écouter** (*Stop listening*), ce qui l’efface ; si aucun résultat ne s’affiche, le modèle n’a entendu aucun ordre. Note combien de fois le modèle a répondu correctement (pour ce son nouveau, répondre correctement, c’est n’afficher aucun résultat), et fais une capture d’écran de la page de test pendant qu’elle affiche un résultat.\n7. Si tu as le temps, dans **Faire** (*Make*), ouvre Scratch 3, clique sur **Modèles de projets** (*Project templates*) et choisis *Alien Language*, puis suis la fiche officielle (PDF) pour que l’extraterrestre marche quand il entend tes mots.\n8. Une fois ton travail rendu (projet ci-dessous), clique sur **Déconnexion** (*Log Out*) : « Essayer maintenant » efface alors ton projet et tes enregistrements.',
                bringBack:
                  'Pour le projet ci-dessous, apporte ta capture d’écran (sans visage, ni nom, ni détail sur ton école) et ton tableau de tests\u00a0: chaque son, l’endroit où tu l’as testé, le nombre d’essais et le nombre de bonnes réponses du modèle, y compris pour le son qu’il n’a jamais appris. Ajoute une erreur du modèle et la raison pour laquelle elle s’est produite, d’après toi, ainsi qu’une amélioration que tu apporterais à tes exemples ou à tes mots de commande.',
                hint: 'Pour le modèle, tout ressemble au même mot\u00a0? Choisis deux mots plus différents (l’un court et sec, l’autre long et grave) et enregistre-les de nouveau. Il entend des ordres alors que personne ne parle\u00a0? Ajoute des exemples de bruit de fond enregistrés là où tu fais tes tests, sans personne qui parle. Pas de micro ou pas de site\u00a0? Fais la version sur papier ci-dessous.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-alienlanguage.pdf',
              projectType: 'sounds',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm4-l1-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website or no microphone? Sound pictures on paper',
                body: "Site blocked, or no microphone allowed? Build the same recogniser on squared paper, with a partner as the model.\n\n1. Draw grids of **3 rows and 6 columns**: the columns are moments, from left to right; the rows are pitches, high at the top and low at the bottom. A shaded square means *loud at this pitch, at this moment*.\n2. Invent two alien commands, such as *zip* (short and high) and *groom* (long and low). Draw **4 training cards** for each one, a little different every time, like real recordings, and **4 background noise cards** with a few scattered squares. Write the label on the back.\n3. Your partner, the model, studies the training cards for one minute and writes down a rule.\n4. Draw **7 new test cards**: 2 clean, 2 *far away* (fewer, lighter squares), 2 *noisy* (the command plus 4 random squares) and 1 sound the model never learned, such as a clap (a full column from bottom to top); the right answer for it is *background noise*.\n5. The model labels each one. Record the results in a table: card, true label, the model's answer, right or wrong.\n6. Which cards caused mistakes? Add training cards that would fix them, and test again.\n\nA real model works with thousands of tiny squares, but the idea is the same. For the project, type your table and, if you can, add a photo of your cards only (no faces or names); otherwise describe two of your test cards in words.",
              },
              fr: {
                heading: 'Pas de site ou pas de micro\u00a0? Des images de sons sur papier',
                body: 'Le site est bloqué, ou le micro n’est pas autorisé\u00a0? Construis le même modèle sur du papier quadrillé, avec un partenaire qui joue le rôle du modèle.\n\n1. Dessine des grilles de **3 lignes et 6 colonnes**\u00a0: les colonnes sont des instants, de gauche à droite\u00a0; les lignes sont des hauteurs, l’aigu en haut et le grave en bas. Une case coloriée veut dire *fort à cette hauteur, à cet instant*.\n2. Invente deux ordres extraterrestres, comme *zip* (court et aigu) et *groom* (long et grave). Dessine **4 cartes d’entraînement** pour chacun, un peu différentes à chaque fois, comme de vrais enregistrements, et **4 cartes de bruit de fond** avec quelques cases éparpillées. Écris l’étiquette au dos.\n3. Ton partenaire, le modèle, étudie les cartes d’entraînement pendant une minute et écrit une règle.\n4. Dessine **7 nouvelles cartes de test**\u00a0: 2 nettes, 2 *de loin* (moins de cases, coloriées plus légèrement), 2 *bruyantes* (l’ordre plus 4 cases au hasard) et 1 son que le modèle n’a jamais appris, comme un claquement de mains (une colonne entière, de bas en haut)\u00a0; pour celle-ci, la bonne réponse est *bruit de fond*.\n5. Le modèle étiquette chacune. Note les résultats dans un tableau\u00a0: carte, vraie étiquette, réponse du modèle, juste ou faux.\n6. Quelles cartes ont provoqué des erreurs\u00a0? Ajoute des cartes d’entraînement qui les corrigeraient, et refais le test.\n\nUn vrai modèle travaille avec des milliers de minuscules cases, mais l’idée est la même. Pour le projet, tape ton tableau au clavier et, si tu peux, ajoute une photo de tes cartes seulement (sans visage ni nom)\u00a0; sinon, décris deux de tes cartes de test avec des mots.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b5',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your Alien Language test report: a screenshot and your test table. The requirements say exactly what your teacher will look at. Hand it in during this lesson, while your project is still open.',
              },
              fr: {
                intro:
                  'Rends le rapport de test de ton activité Alien Language\u00a0: une capture d’écran et ton tableau de tests. Les exigences indiquent exactement ce que ton enseignant va regarder. Rends-le pendant cette leçon, tant que ton projet est encore ouvert.',
              },
            },
            data: { projectId: 'project-m4' },
          },
          {
            id: 'm4-l1-b6',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your robot will work in a noisy classroom. From your tests, which situation caused the most mistakes, and what would you change in the training examples or in the command words to fix it?',
              },
              fr: {
                prompt:
                  'Ton robot travaillera dans une classe bruyante. D’après tes tests, quelle situation a causé le plus d’erreurs, et que changerais-tu dans les exemples d’entraînement ou dans les mots de commande pour y remédier\u00a0?',
              },
            },
            data: { minLength: 50 },
          },
        ],
      },
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Voice commands you can trust',
              summary:
                'False triggers, confidence thresholds, confirmations and an emergency stop that never depends on AI, plus the privacy of devices that are always listening.',
            },
            fr: {
              title: 'Des commandes vocales dignes de confiance',
              summary:
                'Déclenchements intempestifs, seuils de confiance, confirmations et arrêt d’urgence qui ne dépend jamais de l’IA, sans oublier la vie privée face aux appareils toujours à l’écoute.',
            },
          },
          estimatedMinutes: 30,
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
                heading: '"Hey, robot..." Wait, nobody said that!',
                body: 'A family is watching a film. An actor says a word that sounds a bit like the wake word of the smart speaker in the corner (the name it listens for), and the speaker lights up, ready to obey. Everybody laughs. Nobody would laugh if the device were a robot lawn mower and the word sounded like *go*.\n\nIn lesson 1, your model sometimes heard a command nobody gave, or missed one you said clearly. In a game, that is annoying; for a robot that moves, it is a safety problem. This lesson is about voice commands that a robot, and the people around it, can trust.',
              },
              fr: {
                heading: '«\u00a0Hé, robot…\u00a0» Attends, personne n’a dit ça\u00a0!',
                body: 'Une famille regarde un film. Un acteur prononce un mot qui ressemble un peu au mot d’activation de l’enceinte connectée posée dans un coin (le nom qu’elle guette), et l’enceinte s’allume, prête à obéir. Tout le monde rit. Personne ne rirait si l’appareil était un robot tondeuse et si le mot ressemblait à *avance*.\n\nDans la leçon 1, ton modèle a parfois entendu un ordre que personne n’avait donné, ou raté un ordre que tu avais dit clairement. Dans un jeu, c’est agaçant\u00a0; pour un robot qui bouge, c’est un problème de sécurité. Cette leçon porte sur des commandes vocales auxquelles un robot, et les personnes qui l’entourent, peuvent se fier.',
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
                heading: 'Two kinds of mistakes, and how to handle them',
                body: "A voice-controlled robot can get a command wrong in two ways:\n\n| Mistake | What happens | Example |\n|---|---|---|\n| **False trigger** | The robot obeys a command nobody gave | A chair scrapes and the robot hears *forward* |\n| **Missed command** | The robot ignores a real command | You say *stop* in a noisy room and it keeps going |\n\nWhich one is worse depends on the command. A false *forward* can hurt someone; a false *stop* wastes a few seconds. A missed *stop* is dangerous; a missed *forward* is just annoying. So good designs treat commands differently:\n\n- **Clear words.** Commands should sound different from each other and from everyday words: *go* and *no* are easy to mix up.\n- **A confidence threshold.** The robot acts only if the model's confidence score reaches a **threshold**, say 80%. Below it, the robot asks: *Sorry, can you say that again?* A higher threshold means fewer false triggers but more repeats.\n- **A confirmation for risky commands.** Before a risky move, the robot says what it understood and waits for a button press: *Forward? Press the green button.*\n- **Listening only when asked.** Push-to-talk (a button you hold while you speak) or a wake word reduces false triggers, although a wake word can be misheard too, as in the film.\n- **Stop always wins.** If the model's best guess is *stop*, the robot stops, with no threshold and no confirmation.\n\n**The emergency stop never depends on AI.** A voice *stop* is a guess, and the rule of module 2 applies: a safety rule never depends only on a guess. Every robot that moves also needs a **physical emergency stop**, a big button or switch that cuts the power to the motors directly, so that it works even if the program crashes or the model mishears. The voice *stop* is only an extra.",
              },
              fr: {
                heading: 'Deux sortes d’erreurs, et comment les gérer',
                body: 'Un robot à commande vocale peut se tromper de deux façons\u00a0:\n\n| Erreur | Ce qui se passe | Exemple |\n|---|---|---|\n| **Déclenchement intempestif** | Le robot obéit à un ordre que personne n’a donné | Une chaise racle le sol et le robot entend *avance* |\n| **Ordre manqué** | Le robot ignore un vrai ordre | Tu dis *stop* dans une pièce bruyante et il continue |\n\nLa pire erreur dépend de l’ordre. Un *avance* intempestif peut blesser quelqu’un\u00a0; un *stop* intempestif fait perdre quelques secondes. Un *stop* manqué est dangereux\u00a0; un *avance* manqué est simplement agaçant. Une bonne conception traite donc les ordres différemment\u00a0:\n\n- **Des mots clairs.** Les ordres doivent bien se distinguer à l’oreille les uns des autres, et des mots de tous les jours\u00a0: *va* et *bas* se confondent facilement.\n- **Un seuil de confiance.** Le robot n’agit que si le score de confiance du modèle atteint un **seuil**, par exemple 80\u00a0%. En dessous, il demande\u00a0: *Pardon, tu peux répéter\u00a0?* Un seuil plus haut donne moins de déclenchements intempestifs, mais plus de répétitions.\n- **Une confirmation pour les ordres risqués.** Avant un mouvement risqué, le robot dit ce qu’il a compris et attend l’appui sur un bouton\u00a0: *Avancer\u00a0? Appuie sur le bouton vert.*\n- **N’écouter que sur demande.** Un bouton à maintenir pendant qu’on parle (en anglais *push-to-talk*) ou un mot d’activation réduit les déclenchements intempestifs, même si ce mot peut lui aussi être mal entendu, comme dans le film.\n- **Le stop gagne toujours.** Si la meilleure estimation du modèle est *stop*, le robot s’arrête, sans seuil ni confirmation.\n\n**L’arrêt d’urgence ne dépend jamais de l’IA.** Un *stop* vocal est une estimation, et la règle du module 2 s’applique\u00a0: une règle de sécurité ne dépend jamais seulement d’une estimation. Tout robot qui bouge a aussi besoin d’un **arrêt d’urgence physique**, un gros bouton ou un interrupteur qui coupe directement l’alimentation des moteurs, pour qu’il fonctionne même si le programme plante ou si le modèle entend mal. Le *stop* vocal n’est qu’un plus.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Devices that are always listening',
                body: "A smart speaker usually listens for its wake word on the device itself. What you say next is often sent to the company's computers, where recordings can be kept; some companies have had staff listen to a small share of them. A robot with a microphone raises the same questions.\n\n**A voice is personal.** It can reveal who you are, how you feel and who is with you. In many places (in the European Union, for example, under the GDPR), a recording of someone's voice can count as personal data that must be protected.\n\n**Privacy rules for a listening robot**\n\n1. **Listen only when needed:** push-to-talk or a wake word, not a microphone open all day.\n2. **Show it:** a light whenever the microphone records, and a mute switch within reach.\n3. **Keep it local:** recognise commands on the robot when possible, not over the internet.\n4. **Keep nothing you do not need:** no stored recordings, or delete them quickly.\n5. **Ask first:** never record people who have not agreed.\n\n**Fair for every voice.** A recogniser trained mostly on adult voices, or on one accent, can work less well for children, for other accents or for people who speak differently. As with the person detector of module 2, that is bias: some people's *stop* may be heard less well. Engineering teams therefore test with many kinds of voices, from volunteers who agreed to help.",
              },
              fr: {
                heading: 'Des appareils toujours à l’écoute',
                body: 'En général, une enceinte connectée guette son mot d’activation sur l’appareil lui-même. Ce que tu dis ensuite est souvent envoyé aux ordinateurs de l’entreprise, où les enregistrements peuvent être conservés\u00a0; certaines entreprises en ont fait écouter une petite partie par des employés. Un robot équipé d’un micro soulève les mêmes questions.\n\n**Une voix, c’est personnel.** Elle peut révéler qui tu es, ce que tu ressens et qui se trouve avec toi. Dans de nombreux pays (par exemple ceux de l’Union européenne, avec le RGPD), l’enregistrement de la voix d’une personne peut être une donnée personnelle, qu’il faut protéger.\n\n**Les règles de vie privée d’un robot qui écoute**\n\n1. **N’écouter que quand c’est utile\u00a0:** un bouton à maintenir ou un mot d’activation, pas un micro ouvert toute la journée.\n2. **Le montrer\u00a0:** une lumière allumée dès que le micro enregistre, et un bouton pour couper le micro, facile à atteindre.\n3. **Garder le son sur le robot\u00a0:** reconnaître les ordres sur le robot quand c’est possible, sans passer par Internet.\n4. **Ne rien garder d’inutile\u00a0:** aucun enregistrement conservé, ou des enregistrements effacés rapidement.\n5. **Demander d’abord\u00a0:** ne jamais enregistrer quelqu’un qui n’a pas donné son accord.\n\n**Équitable pour toutes les voix.** Un modèle entraîné surtout avec des voix d’adultes, ou avec un seul accent, peut moins bien fonctionner pour les enfants, pour d’autres accents ou pour les personnes qui parlent différemment. Comme pour le détecteur de personnes du module 2, c’est un biais\u00a0: le *stop* de certaines personnes risque d’être moins bien entendu. Les équipes d’ingénieurs testent donc avec des voix très variées, enregistrées par des volontaires qui ont donné leur accord.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b4',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Here is the listening program of a voice-controlled robot, written in made-up blocks (real tools name them differently). It is saved, not run, so be the robot yourself:\n\n1. At the bottom are six things the model heard (a label and a confidence score). Next to each one, write what the robot does.\n2. Change the threshold from 80 to 60, then to 95. Which answers change? In a comment, explain the risk of a threshold that is too low, and of one that is too high.\n3. The emergency stop script is a program too. In a comment, write one situation where it would fail, one moment when even the voice "stop" cannot win (look at what the loop is doing during "drive forward for (2) seconds"), and what a real emergency stop must do instead.\n4. Bonus: add a confirmation, because "forward" is risky. The robot asks for the green button and drives forward only if it is pressed within 3 seconds.',
                hint: 'In step 1, "stop" is tested before the threshold, so it wins even at 40%, and "background noise" is set aside before the threshold, so the robot does nothing, even when the model is unsure. For step 3: while the robot drives, it is not listening, so only the emergency stop button can stop it then. For step 4, replace the drive block with "say [Forward? Press the green button.]", "reset timer", "wait until <<green button pressed?> or <(timer) > [3]>>", then "if <green button pressed?> then drive forward for (2) seconds".',
              },
              fr: {
                instructions:
                  'Voici le programme d’écoute d’un robot à commande vocale, écrit avec des blocs inventés (les vrais outils les nomment autrement). Il est enregistré, pas exécuté\u00a0: joue toi-même le rôle du robot.\n\n1. En bas se trouvent six choses que le modèle a entendues (une étiquette et un score de confiance). À côté de chacune, écris ce que fait le robot.\n2. Remplace le seuil de 80 par 60, puis par 95. Quelles réponses changent\u00a0? Dans un commentaire, explique le risque d’un seuil trop bas, et celui d’un seuil trop haut.\n3. Le script de l’arrêt d’urgence est lui aussi un programme. Dans un commentaire, écris une situation où il ne fonctionnerait pas, un moment où même le «\u00a0stop\u00a0» vocal ne peut pas gagner (regarde ce que fait la boucle pendant «\u00a0drive forward for (2) seconds\u00a0»), et ce que doit faire un vrai arrêt d’urgence à la place.\n4. Bonus\u00a0: ajoute une confirmation, car «\u00a0forward\u00a0» (avancer) est un ordre risqué. Le robot demande d’appuyer sur le bouton vert et n’avance que si on appuie dans les 3\u00a0secondes.',
                hint: 'À l’étape 1, «\u00a0stop\u00a0» est testé avant le seuil\u00a0: il gagne donc même à 40\u00a0%. Et «\u00a0background noise\u00a0» est mis de côté avant le seuil\u00a0: le robot ne fait rien, même si le modèle hésite. Pour l’étape 3\u00a0: pendant qu’il avance, le robot n’écoute pas\u00a0; seul le bouton d’arrêt d’urgence peut alors l’arrêter. Pour l’étape 4, remplace le bloc qui fait avancer par «\u00a0say [Forward? Press the green button.]\u00a0» (dire), «\u00a0reset timer\u00a0» (remettre le chronomètre à zéro), «\u00a0wait until <<green button pressed?> or <(timer) > [3]>>\u00a0» (attendre que le bouton vert soit enfoncé ou que le chronomètre dépasse 3), puis «\u00a0if <green button pressed?> then drive forward for (2) seconds\u00a0» (si le bouton vert est enfoncé, avancer pendant 2\u00a0secondes).',
              },
            },
            data: {
              language: 'blocks',
              starterCode: lines(
                'when green flag clicked',
                'set [threshold] to [80]                     // percent / pour cent',
                'forever',
                '  listen for a command                      // the model guesses a label and a confidence score / le modèle devine une étiquette et un score de confiance',
                '  if <(heard label) = [stop]> then',
                '    stop motors                             // stop wins at any confidence / le stop gagne quelle que soit la confiance',
                '  else',
                '    if <not <(heard label) = [background noise]>> then   // skip background noise / ignorer le bruit de fond',
                '      if <(heard confidence) < (threshold)> then',
                '        say [Sorry, can you say that again?]',
                '      else',
                '        if <(heard label) = [left]> then',
                '          turn left for (1) seconds',
                '        end',
                '        if <(heard label) = [right]> then',
                '          turn right for (1) seconds',
                '        end',
                '        if <(heard label) = [forward]> then',
                '          drive forward for (2) seconds     // TO DO: confirm first / À FAIRE\u00a0: confirmer d’abord',
                '        end',
                '      end',
                '    end',
                '  end',
                'end',
                '',
                'when [emergency stop button] pressed        // a second script / un second script',
                'stop motors',
                'stop all',
                '',
                '// What the model heard → what the robot does',
                '// Ce que le modèle a entendu → ce que fait le robot',
                '// 1. left, 92%  →',
                '// 2. right, 55%  →',
                '// 3. stop, 40%  →',
                '// 4. background noise, 97%  →',
                '// 5. forward, 85%  →',
                '// 6. left, 79%  →',
                '// Threshold 60 / Seuil 60:',
                '// Threshold 95 / Seuil 95:',
                '// Emergency stop / Arrêt d’urgence:',
              ),
            },
          },
          {
            id: 'm4-l2-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Design the voice commands of a robot that carries books around a school library: 3 or 4 command words, the threshold for each one, which ones need a confirmation, how the robot shows that it is listening, and its emergency stop. Then ask the AI tutor to check your design and point out one risk you missed. You decide what to change. Use made-up details only.',
                starterPrompt:
                  'Here is my voice command design for a library robot: [commands, thresholds, confirmations, listening light, emergency stop]. Check it for false triggers, missed stops and privacy problems, and point out one risk I missed. Do not rewrite it for me.',
              },
              fr: {
                instructions:
                  'Conçois les commandes vocales d’un robot qui transporte des livres dans la bibliothèque d’une école\u00a0: 3 ou 4 mots de commande, le seuil de chacun, ceux qui demandent une confirmation, la façon dont le robot montre qu’il écoute, et son arrêt d’urgence. Demande ensuite au tuteur IA de vérifier ta conception et de te signaler un risque que tu as oublié. C’est toi qui décides quoi changer. N’utilise que des détails inventés.',
                starterPrompt:
                  'Voici ma conception des commandes vocales d’un robot de bibliothèque\u00a0: [ordres, seuils, confirmations, lumière d’écoute, arrêt d’urgence]. Vérifie-la\u00a0: déclenchements intempestifs, stops manqués et problèmes de vie privée. Signale-moi un risque que j’ai oublié, sans la réécrire à ma place.',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm4-l2-b6',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: { intro: 'Check what you know about robots that listen.' },
              fr: { intro: 'Vérifie ce que tu sais sur les robots qui écoutent.' },
            },
            data: { quizId: 'quiz-m4' },
          },
          {
            id: 'm4-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of a robot or a device that listens, at home or at school. Which of its commands would you protect with a confirmation or a high threshold, and how would you make sure that people know when it is listening?',
              },
              fr: {
                prompt:
                  'Pense à un robot ou à un appareil qui écoute, à la maison ou à l’école. Lesquels de ses ordres protégerais-tu par une confirmation ou un seuil élevé, et comment ferais-tu pour que les gens sachent quand il écoute\u00a0?',
              },
            },
            data: { minLength: 60 },
          },
        ],
      },
    ],
  },

  quizzes: [
    {
      id: 'quiz-m4',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: robots that listen',
            instructions:
              'Seven questions about sound recognition and voice commands. You need 70% to pass.',
          },
          fr: {
            title: 'Quiz\u00a0: des robots qui écoutent',
            instructions:
              'Sept questions sur la reconnaissance des sons et les commandes vocales. Il faut 70\u00a0% pour réussir.',
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
                  'In a spectrogram, time goes from left to right and pitch from low (at the bottom) to high (at the top). What does a short, high "zip" look like?',
              },
              fr: {
                prompt:
                  'Dans un spectrogramme, le temps va de gauche à droite et la hauteur du grave (en bas) à l’aigu (en haut). À quoi ressemble un «\u00a0zip\u00a0» court et aigu\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A small bright patch near the top' },
                  fr: { text: 'Une petite tache claire près du haut' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A long bright band along the bottom' },
                  fr: { text: 'Une longue bande claire tout en bas' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A dull haze across the whole picture' },
                  fr: { text: 'Un voile terne sur toute l’image' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Short means narrow in time, and high means near the top. A long, low sound makes a band along the bottom, and a steady noise such as a fan makes a haze everywhere.',
              },
              fr: {
                text: 'Court, c’est étroit dans le temps\u00a0; aigu, c’est près du haut. Un son long et grave forme une bande tout en bas, et un bruit continu comme celui d’un ventilateur forme un voile partout.',
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
                  'Why do you record examples of background noise when you train a sound recogniser?',
              },
              fr: {
                prompt:
                  'Pourquoi enregistres-tu des exemples de bruit de fond quand tu entraînes un modèle de reconnaissance de sons\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'So that the model learns what "no command" sounds like, and stops turning every noise into a command',
                  },
                  fr: {
                    text: 'Pour que le modèle apprenne à quoi ressemble «\u00a0aucun ordre\u00a0» et cesse de prendre chaque bruit pour un ordre',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'So that the model has more examples of your command words' },
                  fr: { text: 'Pour que le modèle ait plus d’exemples de tes mots de commande' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'So that the model remembers everything that is said in the room' },
                  fr: { text: 'Pour que le modèle retienne tout ce qui se dit dans la pièce' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Without a background noise label, the model can only answer with one of your commands, so a cough or a scraping chair can become a command. Background examples give it a "nothing to do" answer; they are not examples of your commands.',
              },
              fr: {
                text: 'Sans étiquette de bruit de fond, le modèle ne peut répondre que par l’un de tes ordres\u00a0: une toux ou une chaise qui racle le sol peut alors devenir un ordre. Les exemples de bruit de fond lui donnent une réponse «\u00a0rien à faire\u00a0»\u00a0; ce ne sont pas des exemples de tes ordres.',
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
                  'Your model recognises your word 5 times out of 5 close to the microphone, but only 1 time out of 5 from the other side of the room. What is the best fix?',
              },
              fr: {
                prompt:
                  'Ton modèle reconnaît ton mot 5 fois sur 5 près du micro, mais seulement 1 fois sur 5 depuis l’autre bout de la pièce. Quelle est la meilleure solution\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Record extra training examples from farther away, in the same room, then test again',
                  },
                  fr: {
                    text: 'Enregistrer des exemples d’entraînement supplémentaires de plus loin, dans la même pièce, puis refaire le test',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Record more examples close to the microphone, so that the model knows the word really well',
                  },
                  fr: {
                    text: 'Enregistrer plus d’exemples près du micro, pour que le modèle connaisse très bien le mot',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Delete the background noise examples' },
                  fr: { text: 'Supprimer les exemples de bruit de fond' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "From far away, the sound picture is fainter and mixed with the room's echo and noise. Examples recorded at that distance teach the model that version of the pattern, and a new test shows whether it worked. More close-up examples would not teach it the far-away version.",
              },
              fr: {
                text: 'De loin, l’image du son est plus pâle et mêlée à l’écho et au bruit de la pièce. Des exemples enregistrés à cette distance apprennent au modèle cette version du motif, et un nouveau test montre si cela a marché. Plus d’exemples enregistrés de près ne lui apprendraient pas la version lointaine.',
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
                  'A voice "stop" command, recognised by a well-trained model, is enough to be a robot\'s emergency stop.',
              },
              fr: {
                prompt:
                  'Un ordre vocal «\u00a0stop\u00a0», reconnu par un modèle bien entraîné, suffit comme arrêt d’urgence d’un robot.',
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
                text: 'False. The model only makes a guess: it can mishear in noise, and nothing works if the program or the microphone fails. A physical emergency stop that cuts the motors works even then; the voice stop is only an extra.',
              },
              fr: {
                text: 'Faux. Le modèle ne fait qu’une estimation\u00a0: il peut mal entendre dans le bruit, et plus rien ne marche si le programme ou le micro tombe en panne. Un arrêt d’urgence physique qui coupe les moteurs fonctionne même dans ce cas\u00a0; le stop vocal n’est qu’un plus.',
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
                  'A robot\'s rules: "stop" always wins, and every other command needs a confidence of at least 80%. It hears "left, 65%", then "stop, 45%". What does it do?',
              },
              fr: {
                prompt:
                  'Les règles d’un robot\u00a0: «\u00a0stop\u00a0» gagne toujours, et tout autre ordre demande une confiance d’au moins 80\u00a0%. Il entend «\u00a0left, 65\u00a0%\u00a0», puis «\u00a0stop, 45\u00a0%\u00a0». Que fait-il\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'It turns left, then stops' },
                  fr: { text: 'Il tourne à gauche, puis s’arrête' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It asks you to repeat the first command, then stops' },
                  fr: { text: 'Il demande de répéter le premier ordre, puis s’arrête' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It asks you to repeat both commands' },
                  fr: { text: 'Il demande de répéter les deux ordres' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'It ignores both commands' },
                  fr: { text: 'Il ignore les deux ordres' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: '65% is below the 80% threshold, so the robot asks again. Stop always wins, even at 45%: stopping by mistake is usually harmless, but missing a stop is not.',
              },
              fr: {
                text: '65\u00a0% est en dessous du seuil de 80\u00a0%\u00a0: le robot demande de répéter. Le stop gagne toujours, même à 45\u00a0%\u00a0: s’arrêter par erreur est en général sans danger, mais rater un stop, non.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Which of these choices make a listening robot safer, or more respectful of privacy? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquels de ces choix rendent un robot qui écoute plus sûr, ou plus respectueux de la vie privée\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A light that is on whenever the microphone is recording' },
                  fr: { text: 'Une lumière allumée dès que le micro enregistre' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A physical button that cuts the motors, whatever the program does' },
                  fr: {
                    text: 'Un bouton physique qui coupe les moteurs, quoi que fasse le programme',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Asking for a button press before a risky move' },
                  fr: { text: 'Demander l’appui sur un bouton avant un mouvement risqué' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Recording everything all day, just in case' },
                  fr: { text: 'Tout enregistrer toute la journée, au cas où' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Two command words that sound almost the same, so that they are easy to remember',
                  },
                  fr: {
                    text: 'Deux mots de commande presque identiques, pour les retenir facilement',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A recording light, a physical emergency stop and a confirmation make the robot more trustworthy. Recording all day collects personal data nobody needs, and words that sound alike cause false triggers.',
              },
              fr: {
                text: 'Une lumière d’enregistrement, un arrêt d’urgence physique et une confirmation rendent le robot plus digne de confiance. Tout enregistrer toute la journée collecte des données personnelles dont personne n’a besoin, et des mots qui se ressemblent provoquent des déclenchements intempestifs.',
              },
            },
          },
          {
            id: 'q7',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  "A robot only acts on a command when the model's confidence score reaches a set value. What is that value called? (one word)",
              },
              fr: {
                prompt:
                  'Un robot n’obéit à un ordre que si le score de confiance du modèle atteint une valeur fixée à l’avance. Comment appelle-t-on cette valeur\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'threshold',
                'a threshold',
                'the threshold',
                'thresholds',
                'confidence threshold',
                'a confidence threshold',
                'the confidence threshold',
                'cutoff',
                'threshhold',
                'treshold',
              ],
              fr: [
                'seuil',
                'un seuil',
                'le seuil',
                'seuils',
                'seuil de confiance',
                'le seuil de confiance',
                'un seuil de confiance',
                'valeur seuil',
                'valeur-seuil',
                'la valeur seuil',
              ],
            },
            explanation: {
              en: {
                text: 'A threshold. Below it the robot asks you to say the command again; a higher threshold means fewer false triggers but more repeats. You met thresholds for line pixels in module 2.',
              },
              fr: {
                text: 'Un seuil. En dessous, le robot te demande de répéter l’ordre\u00a0; un seuil plus haut donne moins de déclenchements intempestifs, mais plus de répétitions. Tu as déjà rencontré un seuil pour les pixels de la ligne, dans le module 2.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m4',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Robot ears: my test report',
            brief:
              'Train a sound recogniser on Machine Learning for Kids (the Alien Language activity) to tell two made-up command words apart from each other and from background noise. Then test it like an engineer: close to the microphone, farther away or with noise, and with a sound it never learned. Show your results and explain what made the model succeed or fail.',
            requirements:
              'Hand in:\n\n1. A screenshot of the test page showing a result, or of your Scratch alien responding to a command. No faces, names or school details in it.\n2. Your test table, with one row per sound and place: the sound (your made-up word, written the way it sounds), where you tested it (close, far or noisy), the number of tries and how many times it was recognised correctly. Include your two command words in at least two places each, and one sound the model never learned.\n3. One mistake the model made (a missed command, a wrong command or a command nobody gave) and one or two sentences about why you think it happened, using at least one of the words "pattern", "noise" or "distance".\n4. One improvement you would make to the training examples or to the command words, and why.\n\nSend the screenshot as an image and type the rest in "About your work". Do not upload any sound recordings. Paper version: instead of the screenshot, send a photo of your cards if you can (no faces or names); otherwise describe two of your test cards in words. Type your table (card, true label, model\'s answer, right or wrong), including the card for a sound the model never learned, with points 3 and 4 from your game.\n\nYour teacher looks at: a complete, honest test table (technical quality); a clear explanation of the mistake with patterns, noise or distance (understanding); your improvement idea (creativity); and no personal details and no recordings of other people (responsible use of AI).',
          },
          fr: {
            title: 'Des oreilles pour un robot\u00a0: mon rapport de test',
            brief:
              'Sur Machine Learning for Kids (activité Alien Language, «\u00a0Communique avec un Alien\u00a0» sur le site), entraîne un modèle de reconnaissance de sons à distinguer deux mots de commande inventés l’un de l’autre et du bruit de fond. Teste-le ensuite comme un ingénieur\u00a0: près du micro, plus loin ou avec du bruit, et avec un son qu’il n’a jamais appris. Présente tes résultats et explique ce qui a fait réussir ou échouer le modèle.',
            requirements:
              'Rends\u00a0:\n\n1. Une capture d’écran de la page de test avec un résultat, ou de ton extraterrestre Scratch qui réagit à un ordre. Aucun visage, aucun nom ni aucun détail sur ton école.\n2. Ton tableau de tests, avec une ligne par son et par endroit\u00a0: le son (ton mot inventé, écrit comme il se prononce), l’endroit où tu l’as testé (près, loin ou avec du bruit), le nombre d’essais et le nombre de fois où il a été bien reconnu. Teste tes deux mots de commande à au moins deux endroits chacun, et ajoute un son que le modèle n’a jamais appris.\n3. Une erreur du modèle (un ordre manqué, un mauvais ordre ou un ordre que personne n’a donné) et une ou deux phrases pour expliquer pourquoi elle s’est produite, d’après toi, en utilisant au moins l’un des mots «\u00a0motif\u00a0», «\u00a0bruit\u00a0» ou «\u00a0distance\u00a0».\n4. Une amélioration que tu apporterais aux exemples d’entraînement ou aux mots de commande, et pourquoi.\n\nEnvoie la capture d’écran sous forme d’image et tape le reste dans «\u00a0À propos de votre travail\u00a0». N’envoie aucun enregistrement sonore. Version sur papier\u00a0: à la place de la capture d’écran, envoie une photo de tes cartes si tu peux (sans visage ni nom)\u00a0; sinon, décris deux de tes cartes de test avec des mots. Tape ton tableau (carte, vraie étiquette, réponse du modèle, juste ou faux), y compris la carte du son que le modèle n’a jamais appris, avec les points 3 et 4 tirés de ta partie.\n\nTon enseignant regarde\u00a0: un tableau de tests complet et honnête (qualité technique)\u00a0; une explication claire de l’erreur avec les motifs, le bruit ou la distance (compréhension)\u00a0; ton idée d’amélioration (créativité)\u00a0; et aucune donnée personnelle ni aucun enregistrement d’autres personnes (usage responsable de l’IA).',
          },
        },
        allowedSubmissionTypes: ['text', 'image'],
        rubric: [
          { key: 'understanding', weight: 40 },
          { key: 'technicalQuality', weight: 30 },
          { key: 'responsibleAi', weight: 20 },
          { key: 'creativity', weight: 10 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
