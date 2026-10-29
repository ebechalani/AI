// Module m4 of "My First Artificial Intelligence Adventure" (ages 8-10): AI that sees and hears.
// It comes after m3 (teaching a computer with examples) and before m2 (prompts and the story
// project), and builds on m1-l2 (learning from examples) and m3 (labels, training, testing).
// The words label, example and model are defined in m3-l1 and only reused here; m4-l1-b3 and
// m4-l2-b3 refer back to m3's one-sided examples and its off-topic command "What's for lunch?".
// m4-l1: pixels and pattern learning, why look-alike drawings fool a model, then the Machine
// Learning for Kids activity Mailman Max (worksheet-mailmanmax.pdf; images; Scratch 3; Try it
// now, no accounts), in which learners draw postcode letters with the mouse: no photos, no
// webcam. A paper version of the same idea covers schools that block the site, and the
// hand-in is project-m4 (assignment: a screenshot, one drawing the model got wrong, an idea to
// help it). m4-l2: how voice assistants and sound recognition learn, the wake word, why they
// mishear (noise, voices unlike the examples, new words, homophones), and face and voice
// privacy, with a wake-word game that needs no microphone and the module quiz quiz-m4.
// The worksheet is CC BY-NC-SA 4.0: it is linked, never copied or translated, and the steps
// below are our own framing that defers to it for the clicks. The postcode areas OX, GU and SO
// (Oxford, Guildford, Southampton) are named as facts of the activity. A Try it now project
// lasts a few hours and only one can exist at a time, so the hand-in happens in the same
// lesson and step 2 says to delete the smart classroom project of m3-l2 first if it is still
// there (the site refuses a second Try it now project). No video block: the
// one curated computer-vision video (Code.org, 2hXG8v8p0KM) serves ages 10-14 in
// ai-robotics-foundations, and 30 minutes are already tight for the worksheet (its teacher's
// notes estimate an hour): step 3 asks for ML4K's minimum of five drawings per label, step 6
// for three envelopes, with Learn & Test as the shortcut when time runs out. The player does
// not shuffle quiz options, so the correct ones sit in varied positions: keep it that way.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m4: SeedModulePart = {
  module: {
    id: 'm4',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'AI that sees and hears',
          description:
            'How AI recognises handwriting, pictures and sounds, why it makes mistakes, and how to keep your face and voice private.',
        },
        fr: {
          title: 'L’IA qui voit et qui entend',
          description:
            'Comment l’IA reconnaît l’écriture, les images et les sons, pourquoi elle se trompe, et comment protéger ton visage et ta voix.',
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
              title: 'Teach a computer to read handwriting',
              summary:
                'A picture is made of tiny squares. Train a computer to read the letters you draw, and find out why it mixes some of them up.',
            },
            fr: {
              title: 'Apprends à un ordinateur à lire l’écriture',
              summary:
                'Une image est faite de minuscules carrés. Entraîne un ordinateur à lire les lettres que tu dessines, et découvre pourquoi il en confond certaines.',
            },
          },
          estimatedMinutes: 30,
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
                heading: 'Can a computer read your writing?',
                body: 'A big post office sorts mountains of envelopes, many with handwritten addresses: big, small, neat or wobbly. In many countries, machines read the **postcode** on each envelope and send it to the right van.\n\nBut how can a computer read writing when no two people write alike? In the last module you taught a computer with examples. Today you will use drawings, and see what a computer really "sees".',
              },
              fr: {
                heading: 'Un ordinateur peut-il lire ton écriture\u00a0?',
                body: 'Un grand centre de tri postal reçoit des montagnes de courrier, souvent avec une adresse écrite à la main\u00a0: en grand, en petit, proprement ou en tremblant. Dans de nombreux pays, des machines lisent le **code postal** sur chaque enveloppe et l’envoient vers le bon camion.\n\nMais comment un ordinateur peut-il lire une écriture, alors que personne n’écrit pareil\u00a0? Dans le module précédent, tu as entraîné un ordinateur avec des exemples. Aujourd’hui, tu vas le faire avec des dessins, et découvrir ce qu’un ordinateur «\u00a0voit\u00a0» vraiment.',
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
                heading: 'A picture is made of tiny squares',
                body: 'Zoom in a long way on a picture and you will see that it is made of tiny squares called **pixels**. Each one has a single colour, stored as a **number**. Here is an O made of 25 pixels (■ coloured in, □ empty):\n\n```\n□ ■ ■ ■ □\n■ □ □ □ ■\n■ □ □ □ ■\n■ □ □ □ ■\n□ ■ ■ ■ □\n```\n\nA real drawing has thousands of pixels, and the computer never sees "a letter O": only a grid of numbers. So, as in the last module, you give the model lots of examples: drawings of each letter, each with its label. It finds **patterns**: an O is a ring of dark pixels, an X is two lines that cross. For a new drawing, it picks the label whose pattern looks closest.',
              },
              fr: {
                heading: 'Une image est faite de minuscules carrés',
                body: 'Zoome très fort sur une image\u00a0: tu verras qu’elle est faite de minuscules carrés appelés **pixels**. Chaque pixel a une seule couleur, que l’ordinateur garde sous forme de **nombre**. Voici un O fait de 25\u00a0pixels (■ colorié, □ vide)\u00a0:\n\n```\n□ ■ ■ ■ □\n■ □ □ □ ■\n■ □ □ □ ■\n■ □ □ □ ■\n□ ■ ■ ■ □\n```\n\nUn vrai dessin compte des milliers de pixels, et l’ordinateur ne voit jamais «\u00a0une lettre O\u00a0»\u00a0: seulement une grille de nombres. Alors, comme dans le module précédent, tu donnes au modèle beaucoup d’exemples\u00a0: des dessins de chaque lettre, chacun avec son étiquette. Il cherche des **régularités**\u00a0: un O est un anneau de pixels foncés, un X est fait de deux traits qui se croisent. Devant un nouveau dessin, il choisit l’étiquette dont les régularités lui ressemblent le plus.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Why the computer mixes things up',
                body: 'Some drawings fool the model:\n\n| What fools it | What helps |\n|---|---|\n| Look-alikes: OX and SO both have an O | More examples of both, drawn in different ways |\n| A tiny letter in a corner, when the examples filled the box | Tests drawn like the examples |\n| Too few examples, all neat: one-sided, like the red apples | More examples, neat and messy |\n\nAnd remember "What\'s for lunch?" in the smart classroom: a model only knows its labels. Draw a cat, and a model that knows three labels still **picks one of them**. It does not know that it does not know, so people check its work.',
              },
              fr: {
                heading: 'Pourquoi l’ordinateur se trompe',
                body: 'Certains dessins trompent le modèle\u00a0:\n\n| Ce qui le trompe | Ce qui aide |\n|---|---|\n| Des lettres qui se ressemblent\u00a0: OX et SO contiennent tous les deux un O | Plus d’exemples des deux, dessinés de différentes façons |\n| Une toute petite lettre dans un coin, alors que les exemples remplissaient la case | Des tests dessinés comme les exemples |\n| Trop peu d’exemples, tous soignés\u00a0: des exemples tous pareils, comme les pommes rouges | Plus d’exemples, soignés et brouillons |\n\nEt souviens-toi de «\u00a0Qu’est-ce qu’on mange à midi\u00a0?\u00a0» dans la classe intelligente\u00a0: un modèle ne connaît que ses étiquettes. Si tu dessines un chat, un modèle qui connaît trois étiquettes **en choisit quand même une**. Il ne sait pas qu’il ne sait pas\u00a0: c’est pour cela que les humains vérifient son travail.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b4',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Mailman Max: a sorting office that reads postcodes',
                instructions:
                  '**Goal:** train a computer to read postcode letters that you draw, then use it in a Scratch sorting office. (In the UK, postcodes start with letters, such as OX for Oxford.)\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**: no account, no name.\n2. Make a project called *Mailman Max* that recognises **images**. "Try it now" keeps only one project at a time: if your smart classroom from the last module is still there, delete it first (once it is handed in).\n3. Add the three labels of the worksheet: Oxford (draw OX), Guildford (GU) and Southampton (SO). In each, use **draw** to write its two letters with the mouse at least five times (the site needs five; ten works better), big enough to fill the box. Drawings only: no photos, no webcam.\n4. Train the model and test it with new drawings on **Learn & Test**.\n5. Follow the official worksheet (PDF) to open the sorting office in Scratch and connect your model.\n6. Test at least three envelopes: neat, messy, tiny or look-alike letters. Note where each went, then take a screenshot. Short of time? Test with new drawings on **Learn & Test** and screenshot that.',
                bringBack:
                  'For the project below: a screenshot, one drawing the model got wrong (what you wrote, where it went, why you think it got confused) and one idea to help it.',
                hint: 'Mixing up two letters? Add more examples of both, drawn differently, and train again. Then test it with new drawings, not the ones it trained on.',
              },
              fr: {
                title: 'Le facteur Max\u00a0: un centre de tri qui lit les codes postaux',
                instructions:
                  '**Objectif\u00a0:** entraîner un ordinateur à lire les lettres de codes postaux que tu dessines, puis l’utiliser dans un centre de tri Scratch. (Au Royaume-Uni, les codes postaux commencent par des lettres, comme OX pour Oxford.)\n\n1. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*)\u00a0: pas de compte, pas de nom.\n2. Crée un projet appelé *Facteur Max* qui reconnaît des **images**. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: si ta classe intelligente du module précédent est encore là, supprime ce projet d’abord (une fois ton travail rendu).\n3. Ajoute les trois étiquettes de la fiche\u00a0: Oxford (dessine OX), Guildford (GU) et Southampton (SO). Dans chacune, utilise **dessin** (*draw*) pour écrire ses deux lettres à la souris au moins cinq fois (le site en demande cinq\u00a0; dix, c’est mieux), assez grand pour remplir la case. Uniquement des dessins\u00a0: pas de photo, pas de webcam.\n4. Entraîne le modèle et teste-le avec de nouveaux dessins dans **Apprendre & Tester** (*Learn & Test*).\n5. Suis la fiche officielle (PDF) pour ouvrir le centre de tri dans Scratch et y brancher ton modèle.\n6. Teste au moins trois enveloppes\u00a0: lettres soignées, brouillonnes, toutes petites ou qui se ressemblent. Note où chacune est partie, puis fais une capture d’écran. Pas assez de temps\u00a0? Teste de nouveaux dessins dans **Apprendre & Tester** et fais une capture de cet écran.',
                bringBack:
                  'Pour le projet ci-dessous\u00a0: une capture d’écran, un dessin que le modèle a mal trié (ce que tu as écrit, où il est parti, pourquoi il s’est trompé selon toi) et une idée pour l’aider.',
                hint: 'Ton modèle confond deux lettres\u00a0? Ajoute d’autres exemples des deux, dessinés de différentes façons, et entraîne-le à nouveau. Puis teste-le avec de nouveaux dessins, pas avec ceux qui lui ont servi à s’entraîner.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mailmanmax.pdf',
              projectType: 'images',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm4-l1-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Run a paper sorting office',
                body: 'Try the same idea on paper with a partner.\n\n1. On six grids of 5 by 5 squares, colour an **O** three times and an **X** three times, each a little different: your labelled **examples**.\n2. Your partner, the "computer", studies them for one minute, then turns them over.\n3. Draw five secret **tests**: a neat O, a messy X, a tiny O in a corner, a C and a T.\n4. The computer may only answer "O" or "X". Note which answers are right. The C and the T have no right answer: as with the cat above, the computer must still pick O or X.\n5. Swap roles. Which drawing fooled the computer? Which example would have helped?\n\nFor the project, photograph your grids and results (no faces or names), or type them.',
              },
              fr: {
                heading: 'Pas de site\u00a0? Fais un centre de tri sur papier',
                body: 'Fais la même expérience sur papier avec un ou une camarade.\n\n1. Sur six grilles de 5\u00a0carrés sur 5, colorie trois fois un **O** et trois fois un **X**, chaque fois un peu différent\u00a0: ce sont tes **exemples**, avec leurs étiquettes.\n2. Ton ou ta camarade, «\u00a0l’ordinateur\u00a0», les observe une minute, puis les retourne.\n3. Dessine cinq **tests** secrets\u00a0: un O soigné, un X brouillon, un tout petit O dans un coin, un C et un T.\n4. L’ordinateur ne peut répondre que «\u00a0O\u00a0» ou «\u00a0X\u00a0». Note les réponses justes. Le C et le T n’ont pas de bonne réponse\u00a0: comme pour le chat plus haut, l’ordinateur doit quand même choisir O ou X.\n5. Échangez les rôles. Quel dessin a trompé l’ordinateur\u00a0? Quel exemple l’aurait aidé\u00a0?\n\nPour le projet, prends en photo tes grilles et tes résultats (sans visage ni nom), ou écris-les au clavier.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Did an envelope go to the wrong van? Ask the AI tutor for a hint about why. It gives clues, not answers: you find the reason yourself.',
                starterPrompt:
                  'My handwriting model sent an OX envelope to the Southampton van. Can you give me a hint about why it might have got confused, without telling me the answer?',
              },
              fr: {
                instructions:
                  'Une enveloppe est partie dans le mauvais camion\u00a0? Demande un indice au tuteur IA pour comprendre pourquoi. Il donne des pistes, pas la réponse\u00a0: c’est toi qui trouves la raison.',
                starterPrompt:
                  'Mon modèle qui lit l’écriture a envoyé une enveloppe OX vers le camion de Southampton. Peux-tu me donner un indice pour comprendre pourquoi il a pu se tromper, sans me donner la réponse\u00a0?',
              },
            },
            data: { tutorMode: 'hint', labToolId: null },
          },
          {
            id: 'm4-l1-b7',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your sorting office during this lesson, while your project is still open.',
              },
              fr: {
                intro:
                  'Rends ton centre de tri pendant cette leçon, tant que ton projet est encore ouvert.',
              },
            },
            data: { projectId: 'project-m4' },
          },
          {
            id: 'm4-l1-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your model saw your drawings as tiny squares. In your own words, explain how it learned to tell the letters apart, and why it sometimes mixed them up.',
              },
              fr: {
                prompt:
                  'Ton modèle a vu tes dessins comme de minuscules carrés. Avec tes propres mots, explique comment il a appris à distinguer les lettres, et pourquoi il les a parfois confondues.',
              },
            },
            data: { minLength: 40 },
          },
        ],
      },
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Voices, sounds and keeping safe',
              summary:
                'How voice assistants learn to hear, why they mishear, and how to keep your face and your voice private.',
            },
            fr: {
              title: 'Voix, sons et sécurité',
              summary:
                'Comment les assistants vocaux apprennent à entendre, pourquoi ils comprennent de travers, et comment protéger ton visage et ta voix.',
            },
          },
          estimatedMinutes: 20,
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
                heading: 'Is it listening?',
                body: 'A smart speaker sits quietly on a shelf... until someone says its special name. Then it lights up: "Here is the weather for today!"\n\nYou met voice assistants at the start of this adventure. But how does a speaker know you said its name, and not "banana"? And why does it sometimes answer when nobody called it? Sounds, like drawings, are learned from examples.',
              },
              fr: {
                heading: 'Est-ce qu’elle écoute\u00a0?',
                body: 'Une enceinte connectée attend en silence sur une étagère… jusqu’à ce que quelqu’un prononce son nom spécial. Alors, elle s’allume\u00a0: «\u00a0Voici la météo du jour\u00a0!\u00a0»\n\nTu as rencontré les assistants vocaux au début de cette aventure. Mais comment l’enceinte sait-elle que tu as dit son nom, et pas «\u00a0banane\u00a0»\u00a0? Et pourquoi répond-elle parfois alors que personne ne l’a appelée\u00a0? Les sons, comme les dessins, s’apprennent à partir d’exemples.',
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
                heading: 'How a computer learns to hear',
                body: 'A sound is air shaking very fast. A **microphone** turns the shaking into numbers, a bit like pixels do for a picture.\n\nTo recognise a word or a sound, a model learns from **many examples**: lots of people saying "yes", lots of claps, lots of doorbells. Some phones can be set to spot a doorbell or a smoke alarm, which helps people who are deaf or hard of hearing.\n\nA voice assistant waits for a special word or short phrase, its **wake word**. It listens all the time, but only for that, inside the speaker itself. When it hears it, it starts recording and often sends your words to big computers far away. Then it must understand what you want, like the computer you taught to understand you in the last module.',
              },
              fr: {
                heading: 'Comment un ordinateur apprend à entendre',
                body: 'Un son, c’est de l’air qui vibre très vite. Un **microphone** transforme ces vibrations en nombres, un peu comme les pixels pour une image.\n\nPour reconnaître un mot ou un son, un modèle apprend à partir de **beaucoup d’exemples**\u00a0: beaucoup de personnes qui disent «\u00a0oui\u00a0», beaucoup d’applaudissements, beaucoup de sonnettes. Certains téléphones peuvent être réglés pour repérer une sonnette ou une alarme incendie, ce qui aide les personnes sourdes ou malentendantes.\n\nUn assistant vocal attend un mot spécial ou une courte phrase, son **mot d’activation** (en anglais, *wake word*). Il écoute tout le temps, mais seulement pour repérer ce mot, à l’intérieur même de l’enceinte. Quand il l’entend, il commence à enregistrer et envoie souvent tes paroles à de gros ordinateurs situés très loin. Ensuite, il doit comprendre ce que tu veux, comme l’ordinateur à qui tu as appris à te comprendre dans le module précédent.',
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
                heading: 'Why it mishears',
                body: 'Like your handwriting model, a voice model guesses from patterns. It can mishear when:\n\n- **there is noise**, like music, a TV or friends talking;\n- **your voice is not like its examples**: if it learned mostly from some voices or accents, it works less well for others. That is the problem of one-sided examples again, and it is unfair, so good teams collect examples from many different people;\n- **it meets a new word**, like a made-up name: it picks the closest word it knows;\n- **words sound the same**, like "right" and "write".\n\nA word on TV can even sound like the wake word and wake the speaker by mistake: then it may record and send what people say next. Many smart speakers have a button that switches the microphone off.',
              },
              fr: {
                heading: 'Pourquoi il comprend de travers',
                body: 'Un modèle vocal devine à partir de régularités, comme ton modèle qui lit l’écriture. Il peut comprendre de travers quand\u00a0:\n\n- **il y a du bruit**, comme de la musique, la télé ou des amis qui parlent\u00a0;\n- **ta voix ne ressemble pas à ses exemples**\u00a0: s’il a surtout appris avec certaines voix ou certains accents, il marche moins bien pour les autres. C’est encore le problème des exemples tous pareils, et ce n’est pas juste\u00a0: alors les bonnes équipes rassemblent des exemples venant de personnes très différentes\u00a0;\n- **il rencontre un mot nouveau**, comme un nom inventé\u00a0: il choisit le mot le plus proche qu’il connaît\u00a0;\n- **des mots se prononcent pareil**, comme «\u00a0vert\u00a0», «\u00a0verre\u00a0» et «\u00a0ver\u00a0».\n\nUn mot entendu à la télé peut même ressembler au mot d’activation et réveiller l’enceinte par erreur\u00a0: elle peut alors enregistrer et envoyer ce qu’on dit ensuite. Beaucoup d’enceintes ont un bouton pour couper le micro.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Your face and your voice belong to you',
                body: "Your face and your voice are **personal**, like your name: they can show who you are. Protect yours and other people's:\n\n1. **Ask an adult first** before you use a camera or a microphone in an app, a game or a website.\n2. **Never film or record friends without asking.** If they say no, that means no.\n3. **Never share recordings** of yourself or anyone else. Online, they can be copied, and you cannot take them back.\n4. **Watch for the light** that shows a camera or microphone is on. Not expecting it? Tell an adult.\n\nThat is why this course uses drawings and made-up examples, never photos or recordings of real people.",
              },
              fr: {
                heading: 'Ton visage et ta voix t’appartiennent',
                body: 'Ton visage et ta voix sont **personnels**, comme ton nom\u00a0: ils peuvent montrer qui tu es. Protège les tiens et ceux des autres\u00a0:\n\n1. **Demande d’abord à un adulte** avant d’utiliser une caméra ou un microphone dans une application, un jeu ou un site.\n2. **Ne filme et n’enregistre jamais tes amis sans leur demander.** S’ils disent non, c’est non.\n3. **Ne partage jamais d’enregistrement**, ni de toi ni des autres. En ligne, il peut être copié, et tu ne peux plus le reprendre.\n4. **Repère le voyant** qui montre qu’une caméra ou un micro est allumé. Tu ne t’y attendais pas\u00a0? Préviens un adulte.\n\nC’est pour cela que ce cours utilise des dessins et des exemples inventés, jamais de photos ni d’enregistrements de vraies personnes.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Play the wake-word game',
                body: 'No microphone needed! Play with your class or your family.\n\n1. One player is the smart speaker. Together, choose a wake word such as "Rocket".\n2. The smart speaker closes their eyes. The others take turns to say words: "Rabbit", "Rock", "Rocket"...\n3. The smart speaker raises a hand only for the wake word.\n4. Make it harder: everyone hums while one person speaks. Then try words that sound almost the same, such as "Pocket" or "Rock it".\n\nDid the smart speaker wake up by mistake, or miss the wake word? What made it harder?',
              },
              fr: {
                heading: 'Joue au jeu du mot d’activation',
                body: 'Joue avec ta classe ou ta famille. Pas besoin de micro\u00a0!\n\n1. Un joueur ou une joueuse fait l’enceinte connectée. Choisissez ensemble un mot d’activation, par exemple «\u00a0Papillon\u00a0».\n2. L’enceinte ferme les yeux. Les autres disent des mots à tour de rôle\u00a0: «\u00a0Pomme\u00a0», «\u00a0Papa\u00a0», «\u00a0Papillon\u00a0»…\n3. L’enceinte lève la main seulement pour le mot d’activation.\n4. Corsez le jeu\u00a0: tout le monde fredonne pendant qu’une personne parle. Puis essayez des mots qui sonnent presque pareil, comme «\u00a0Pavillon\u00a0» ou «\u00a0Papi long\u00a0».\n\nL’enceinte s’est-elle réveillée par erreur, ou a-t-elle raté le mot d’activation\u00a0? Qu’est-ce qui rendait le jeu plus difficile\u00a0?',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to explain how a voice assistant learns its wake word, and why it sometimes wakes up by mistake. Type your question: do not record your voice.',
                starterPrompt:
                  'Can you explain, for a 9-year-old, how a voice assistant learns to recognise its wake word, and why it sometimes wakes up when nobody called it?',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de t’expliquer comment un assistant vocal apprend son mot d’activation, et pourquoi il se réveille parfois par erreur. Écris ta question au clavier\u00a0: n’enregistre pas ta voix.',
                starterPrompt:
                  'Peux-tu m’expliquer, comme à un enfant de 9\u00a0ans, comment un assistant vocal apprend à reconnaître son mot d’activation, et pourquoi il se réveille parfois alors que personne ne l’a appelé\u00a0?',
              },
            },
            data: { tutorMode: 'explain', labToolId: null },
          },
          {
            id: 'm4-l2-b7',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: { intro: 'Show what you have learned about AI that sees and hears.' },
              fr: { intro: 'Montre ce que tu as appris sur l’IA qui voit et qui entend.' },
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
                  'A friend wants to film you singing and post the video online. What would you say, and which rule from this lesson helps you decide?',
              },
              fr: {
                prompt:
                  'Un ami ou une amie veut te filmer en train de chanter et mettre la vidéo en ligne. Que lui réponds-tu, et quelle règle de cette leçon t’aide à décider\u00a0?',
              },
            },
            data: { minLength: 40 },
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
            title: 'Check: AI that sees and hears',
            instructions:
              'Seven questions about pictures, sounds and privacy. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: l’IA qui voit et qui entend',
            instructions:
              'Sept questions sur les images, les sons et la vie privée. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
              en: { prompt: 'To a computer, what is your drawing of the letter O?' },
              fr: { prompt: 'Pour un ordinateur, qu’est-ce que ton dessin de la lettre O\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A word that it reads the way you do' },
                  fr: { text: 'Un mot qu’il lit comme toi' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A grid of tiny squares, each one stored as a number' },
                  fr: {
                    text: 'Une grille de minuscules carrés, chacun gardé sous forme de nombre',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A sound that it listens to' },
                  fr: { text: 'Un son qu’il écoute' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A computer only sees pixels: tiny squares, each with a number for its colour. It learns which patterns of pixels go with each label.',
              },
              fr: {
                text: 'Un ordinateur ne voit que des pixels\u00a0: de minuscules carrés, chacun avec un nombre pour sa couleur. Il apprend quelles régularités de pixels vont avec chaque étiquette.',
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
                  'Your model keeps sending SO envelopes to the Oxford van. What is the best way to help it?',
              },
              fr: {
                prompt:
                  'Ton modèle envoie sans arrêt les enveloppes SO vers le camion d’Oxford. Quelle est la meilleure façon de l’aider\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Write the next SO very small, in a corner' },
                  fr: { text: 'Écrire le prochain SO tout petit, dans un coin' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Delete all the SO examples' },
                  fr: { text: 'Supprimer tous les exemples de SO' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Add more examples of SO and OX, drawn in different ways, then train it again',
                  },
                  fr: {
                    text: 'Ajouter d’autres exemples de SO et d’OX, dessinés de différentes façons, puis l’entraîner à nouveau',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'OX and SO both have an O. More examples of both, drawn in different ways, help the model learn the difference. Then test it again to check.',
              },
              fr: {
                text: 'OX et SO contiennent tous les deux un O. Plus d’exemples des deux, dessinés de différentes façons, aident le modèle à apprendre la différence. Ensuite, on le teste à nouveau pour vérifier.',
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
                  'A model that has learned only three labels (Oxford, Guildford and Southampton) will say "I do not know" if you draw a cat.',
              },
              fr: {
                prompt:
                  'Un modèle qui n’a appris que trois étiquettes (Oxford, Guildford et Southampton) dira «\u00a0je ne sais pas\u00a0» si tu dessines un chat.',
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
                text: 'False. It only knows its three labels, so it picks the one that looks closest, even when the answer is silly. That is why people check its work.',
              },
              fr: {
                text: 'Faux. Il ne connaît que ses trois étiquettes, alors il choisit celle qui ressemble le plus au dessin, même quand la réponse est absurde. C’est pour cela que les humains vérifient son travail.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt: 'Why might a voice assistant mishear you? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Pourquoi un assistant vocal peut-il mal te comprendre\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Loud music is playing in the room' },
                  fr: { text: 'Une musique forte passe dans la pièce' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It is in a bad mood today' },
                  fr: { text: 'Il est de mauvaise humeur aujourd’hui' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'You say a made-up word that it never learned' },
                  fr: { text: 'Tu dis un mot inventé qu’il n’a jamais appris' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Your voice is not like most of the examples it learned from' },
                  fr: {
                    text: 'Ta voix ne ressemble pas à la plupart des exemples avec lesquels il a appris',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Noise, new words and voices unlike its examples can all fool it. But an AI has no moods: it does not feel anything.',
              },
              fr: {
                text: 'Le bruit, les mots nouveaux et les voix qui ne ressemblent pas à ses exemples peuvent tous le tromper. Mais une IA n’a pas d’humeur\u00a0: elle ne ressent rien.',
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
                  'A smart speaker lights up when someone on TV says a word that sounds a little like its name. What happened?',
              },
              fr: {
                prompt:
                  'Une enceinte connectée s’allume quand quelqu’un, à la télé, dit un mot qui ressemble un peu à son nom. Que s’est-il passé\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'It wanted to watch the programme' },
                  fr: { text: 'Elle voulait regarder l’émission' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The word on TV sounded close enough to its wake word' },
                  fr: { text: 'Le mot de la télé ressemblait assez à son mot d’activation' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It understood the whole programme' },
                  fr: { text: 'Elle a compris toute l’émission' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The word on TV matched the pattern of its wake word closely enough, so it woke up by mistake. It does not want anything: it is a machine.',
              },
              fr: {
                text: 'Le mot entendu à la télé ressemblait assez à son mot d’activation, alors elle s’est réveillée par erreur. Elle ne veut rien\u00a0: c’est une machine.',
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
                  'A new game asks to use your camera and your microphone. What should you do?',
              },
              fr: {
                prompt:
                  'Un nouveau jeu demande à utiliser ta caméra et ton microphone. Que dois-tu faire\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Say yes quickly so you can start playing' },
                  fr: { text: 'Dire oui très vite pour commencer à jouer' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Say yes, then record your friends to test it' },
                  fr: { text: 'Dire oui, puis enregistrer tes amis pour essayer' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Ask an adult before you say yes' },
                  fr: { text: 'Demander à un adulte avant de dire oui' },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Your face and your voice are personal. Ask an adult first, and never record friends without asking them.',
              },
              fr: {
                text: 'Ton visage et ta voix sont personnels. Demande d’abord à un adulte, et n’enregistre jamais tes amis sans leur demander.',
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
                  'What do we call the tiny squares that make up a picture on a screen? (one word)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on les minuscules carrés qui forment une image sur un écran\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['pixels', 'pixel', 'a pixel', 'the pixels', 'pixles', 'pixils'],
              fr: [
                'pixels',
                'pixel',
                'un pixel',
                'des pixels',
                'les pixels',
                'le pixel',
                'pixelles',
              ],
            },
            explanation: {
              en: { text: 'Pixels! Each one has a single colour, stored as a number.' },
              fr: {
                text: 'Les pixels\u00a0! Chacun a une seule couleur, gardée sous forme de nombre.',
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
            title: 'My handwriting sorting office',
            brief:
              'Train a computer to read postcode letters that you draw with the mouse, and use it in the Mailman Max sorting office in Scratch. Then test it like a scientist: find a drawing it gets wrong, think about why, and suggest how to help it. If the website does not work at your school, do the paper sorting office from the lesson instead.',
            requirements:
              'Hand in three things:\n1. A screenshot of your sorting office in Scratch or of your tests (for the paper version, a photo of your grids and results, or your results typed out: each test, what the computer answered, right or wrong).\n2. One drawing the model got wrong: what you wrote, where it went (paper version: what the computer answered), and why you think it got confused. If it got everything right, give your trickiest test instead and say why it was hard.\n3. One idea to help the model do better, for example more examples, different examples or bigger letters.\nYou can type parts 2 and 3, and part 1 too for the paper version. Check that your screenshot or photo shows no faces, no names and no other personal details.',
          },
          fr: {
            title: 'Mon centre de tri qui lit l’écriture',
            brief:
              'Entraîne un ordinateur à lire les lettres de codes postaux que tu dessines à la souris, et utilise-le dans le centre de tri du facteur Max, dans Scratch. Ensuite, teste-le comme un scientifique\u00a0: trouve un dessin qu’il trie mal, réfléchis à la raison, et propose une façon de l’aider. Si le site ne fonctionne pas dans ton école, fais plutôt le centre de tri sur papier de la leçon.',
            requirements:
              'Rends trois choses\u00a0:\n1. Une capture d’écran de ton centre de tri dans Scratch ou de tes essais (pour la version sur papier, une photo de tes grilles et de tes résultats, ou tes résultats écrits au clavier\u00a0: chaque test, la réponse de l’ordinateur, juste ou faux).\n2. Un dessin que le modèle a mal trié\u00a0: ce que tu as écrit, où il est parti (version sur papier\u00a0: ce que l’ordinateur a répondu), et pourquoi le modèle s’est trompé selon toi. S’il a tout bien trié, donne plutôt ton test le plus difficile et explique pourquoi il l’était.\n3. Une idée pour aider le modèle à faire mieux, par exemple plus d’exemples, des exemples différents ou des lettres plus grandes.\nTu peux écrire les parties 2 et 3 au clavier, et aussi la partie 1 pour la version sur papier. Vérifie qu’on ne voit sur ta capture ou ta photo ni visage, ni nom, ni aucune autre information personnelle.',
          },
        },
        allowedSubmissionTypes: ['text', 'image'],
        rubric: [
          { key: 'understanding', weight: 40 },
          { key: 'technicalQuality', weight: 30 },
          { key: 'creativity', weight: 15 },
          { key: 'responsibleAi', weight: 15 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
