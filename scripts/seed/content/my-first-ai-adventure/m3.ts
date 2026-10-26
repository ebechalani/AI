// Module m3 of "My First Artificial Intelligence Adventure" (ages 8-10): "Teach a computer with
// examples". It comes after m1 (Meet artificial intelligence) and before m4 (AI that sees and
// hears) and m2 (Talking to AI), and builds on m1-l2, where a robot learned to sort apples and
// oranges: here the learner meets the words label, example, training, model and testing, which
// m4 then uses without defining them again (m4 also refers back to m3's one-sided examples, to
// the off-topic command "What's for lunch?" and to the smart classroom project).
//
// - m3-l1 "Sorting with examples" (20 min) is unplugged: a paper sorting game with invented words
//   (soft or spiky), then a rule sorter in blocks to trace by hand (saved, not run) next to a
//   sorter that learns. The module quiz quiz-m3 is here and covers m3-l1 only.
// - m3-l2 "Teach a computer to understand you" (30 min) is the Machine Learning for Kids activity
//   Smart Classroom, quick "Try it now" version (text project, Scratch 3, beginner):
//   worksheet-smartclassroom-tryitnow.pdf; French teacher's notes:
//   teachersnotes-smartclassroom-fr.pdf. Access is try_it_now: no account, nothing about the
//   child is stored, and the project lasts a few hours, so the hand-in project-m3 (an
//   assignment, not needed for the certificate) is done in the same lesson. A paper version
//   (classmates play the computer) stands in when the site is blocked; project-m3 accepts text.
//
// Licence: the worksheet is CC BY-NC-SA 4.0 and is only linked. The ml_activity text is our own
// framing; the click-by-click steps stay in the PDF. The four labels (fan on, fan off, lamp on,
// lamp off) are named because the worksheet's Scratch classroom works with them; French learners
// keep them in English and write their commands in French (a text project can be set to French).
// Machine Learning for Kids needs at least five examples per label to train a text model, hence
// "at least five". No video block: the one curated video on this topic (Code.org, training data
// and bias) is aimed at older learners, and the 20 minutes of m3-l1 go to the paper game.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m3: SeedModulePart = {
  module: {
    id: 'm3',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Teach a computer with examples',
          description:
            'How a computer learns from labels and examples, and your first machine learning model on Machine Learning for Kids.',
        },
        fr: {
          title: 'Apprendre à un ordinateur avec des exemples',
          description:
            'Comment un ordinateur apprend à partir d’étiquettes et d’exemples, et ton premier modèle d’apprentissage automatique sur Machine Learning for Kids.',
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
              title: 'Sorting with examples',
              summary:
                'Labels, examples and brand-new cards: be the machine and find out why good examples matter.',
            },
            fr: {
              title: 'Trier avec des exemples',
              summary:
                'Des étiquettes, des exemples et des cartes toutes nouvelles\u00a0: joue le rôle de la machine et découvre pourquoi les bons exemples comptent.',
            },
          },
          estimatedMinutes: 20,
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
                heading: 'Soft or spiky?',
                body: 'Say these two made-up words out loud: **lulimo** and **krak**. Which one sounds soft, like a cloud? Which one sounds spiky, like a cactus?\n\nMost people choose the same answer, even though nobody ever gave them a rule. A computer has no such feeling: it can only learn soft and spiky from examples.\n\nToday you will **be the machine** and learn to sort made-up words only from examples, just like a computer.',
              },
              fr: {
                heading: 'Doux ou piquant\u00a0?',
                body: 'Dis ces deux mots inventés à voix haute\u00a0: **lulimo** et **krak**. Lequel sonne doux, comme un nuage\u00a0? Lequel sonne piquant, comme un cactus\u00a0?\n\nPresque tout le monde donne la même réponse, et pourtant personne ne nous a donné de règle. Un ordinateur, lui, n’a pas ce genre d’intuition\u00a0: il ne peut apprendre «\u00a0doux\u00a0» et «\u00a0piquant\u00a0» qu’à partir d’exemples.\n\nAujourd’hui, c’est toi qui vas **faire la machine**\u00a0: tu vas apprendre à trier des mots inventés rien qu’avec des exemples, comme un ordinateur.',
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
                heading: 'Labels and examples',
                body: 'In the first module, a robot learned to sort apples and oranges. Here are the words people use to explain how it works:\n\n| Word | What it means | For the fruit robot |\n|---|---|---|\n| **Label** | The name of a group | *apple*, *orange* |\n| **Example** | One thing with its label | a green apple, labelled *apple* |\n| **Training** | Studying the examples to find patterns | "apples are smooth and round" |\n| **Model** | The part of the program that learns the patterns and then makes the guesses | the part of the robot that guesses *apple* or *orange* |\n| **Testing** | Trying the computer on something new | a fruit it has never seen |\n\nTesting with **new** things is the important part. A computer that can only sort the examples it has already seen has not really learned anything: it has just remembered them.',
              },
              fr: {
                heading: 'Étiquettes et exemples',
                body: 'Dans le premier module, un robot apprenait à trier des pommes et des oranges. Voici les mots qu’on utilise pour expliquer comment il fonctionne\u00a0:\n\n| Mot | Ce qu’il veut dire | Pour le robot à fruits |\n|---|---|---|\n| **Étiquette** | Le nom d’un groupe | *pomme*, *orange* |\n| **Exemple** | Une chose avec son étiquette | une pomme verte, étiquetée *pomme* |\n| **Entraînement** | Étudier les exemples pour trouver des régularités | «\u00a0les pommes sont lisses et rondes\u00a0» |\n| **Modèle** | La partie du programme qui apprend les régularités, puis qui devine | la partie du robot qui devine *pomme* ou *orange* |\n| **Test** | Essayer l’ordinateur sur quelque chose de nouveau | un fruit qu’il n’a jamais vu |\n\nLe plus important, c’est de tester avec des choses **nouvelles**. Un ordinateur qui ne sait trier que les exemples qu’il a déjà vus n’a rien appris pour de vrai\u00a0: il s’en souvient, c’est tout.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'More examples, different examples',
                body: 'You already know that **more** good examples mean better guesses. **Different** examples matter just as much. With one apple, a computer might think every apple is red, but with fifty apples of all sizes and colours, it sees the real pattern.\n\nTwo things can go wrong:\n\n- **Too few examples.** The computer may find a pattern that is not really there.\n- **One-sided examples.** If every apple it saw was red, it may decide that a green apple is not an apple.\n\nIn real life, one-sided examples can make an AI unfair to the people or things that were missing, so people choose examples with care and check the guesses.',
              },
              fr: {
                heading: 'Plus d’exemples, des exemples variés',
                body: 'Tu sais déjà que **plus** il y a de bons exemples, plus l’ordinateur devine juste. Des exemples **variés** comptent tout autant. Avec une seule pomme, un ordinateur pourrait croire que toutes les pommes sont rouges, mais avec cinquante pommes de toutes les tailles et de toutes les couleurs, il voit la vraie régularité.\n\nDeux choses peuvent mal tourner\u00a0:\n\n- **Trop peu d’exemples.** L’ordinateur risque de trouver une régularité qui n’existe pas vraiment.\n- **Des exemples tous pareils.** Si toutes les pommes qu’il a vues étaient rouges, il peut décider qu’une pomme verte n’est pas une pomme.\n\nDans la vraie vie, des exemples tous pareils peuvent rendre une IA injuste envers les personnes ou les choses qui manquaient\u00a0: on choisit donc les exemples avec soin, et on vérifie ce que l’ordinateur devine.',
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
                heading: 'Be the machine: the sorting game',
                body: 'Copy the words onto small paper cards, or just use the table and the words below. Play alone or with a partner.\n\n**Round 1: train.** These cards already have their labels. What do the soft words have in common? And the spiky ones?\n\n| Soft | Spiky |\n|---|---|\n| lulimo | krak |\n| molana | tizzik |\n| bolumi | zatek |\n| malulu | kipitt |\n\n**Round 2: test.** Sort four new cards you have never seen: **lomuna**, **trekkit**, **mibolu**, **zipzak**. Which pattern helped you?\n\n**Round 3: too few examples.** Cover every card except **lulimo** and **krak**. You are a new machine that only knows these two, so you might think "spiky words have a K". Now sort **zitzat**. Were you fooled?\n\n*Sorted the four cards of round 2? Check: soft, spiky, soft, spiky.*',
              },
              fr: {
                heading: 'Fais la machine\u00a0: le jeu du tri',
                body: 'Recopie les mots sur de petites cartes en papier, ou sers-toi simplement du tableau et des mots ci-dessous. Joue seul ou avec un camarade.\n\n**Manche 1\u00a0: l’entraînement.** Ces cartes ont déjà leur étiquette. Qu’ont en commun les mots doux\u00a0? Et les mots piquants\u00a0?\n\n| Doux | Piquant |\n|---|---|\n| lulimo | krak |\n| molana | tizzik |\n| bolumi | zatek |\n| malulu | kipitt |\n\n**Manche 2\u00a0: le test.** Range quatre cartes nouvelles, que tu n’as jamais vues\u00a0: **lomuna**, **trekkit**, **mibolu**, **zipzak**. Quelle régularité t’a aidé\u00a0?\n\n**Manche 3\u00a0: trop peu d’exemples.** Cache toutes les cartes sauf **lulimo** et **krak**. Tu es une machine toute neuve qui ne connaît que ces deux-là\u00a0: tu pourrais croire que «\u00a0les mots piquants ont un K\u00a0». Maintenant, range **zitzat**. T’es-tu fait piéger\u00a0?\n\n*Tu as rangé les quatre cartes de la manche 2\u00a0? Vérifie\u00a0: doux, piquant, doux, piquant.*',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'A person wrote this sorter after seeing only the card "krak". Your program is saved, not run, so be the computer yourself:\n\n1. Follow the blocks for each word in the comments, and write what the sorter says.\n2. Which word does it get wrong? Change the rule to fix it.\n3. Invent a spiky word that your new rule still gets wrong.\n4. Read the learning sorter at the bottom. Who writes its rule?',
                hint: 'To check two letters at once, use "or": if <<(answer) contains [k]?> or <(answer) contains [z]?>> then',
              },
              fr: {
                instructions:
                  'Une personne a écrit ce trieur après avoir vu seulement la carte «\u00a0krak\u00a0». Ton programme est enregistré, pas exécuté\u00a0: joue toi-même le rôle de l’ordinateur. (Dans les blocs, Soft veut dire «\u00a0doux\u00a0», Spiky «\u00a0piquant\u00a0», trained with «\u00a0entraîné avec\u00a0» et recognise text (answer) (label) «\u00a0l’étiquette que le modèle reconnaît pour la réponse\u00a0».)\n\n1. Suis les blocs pour chaque mot des commentaires, et note ce que dit le trieur.\n2. Quel mot range-t-il mal\u00a0? Change la règle pour corriger l’erreur.\n3. Invente un mot piquant que ta nouvelle règle range encore mal.\n4. Lis le trieur qui apprend, tout en bas. Qui écrit sa règle\u00a0?',
                hint: 'Pour vérifier deux lettres à la fois, utilise «\u00a0or\u00a0» (ou)\u00a0: if <<(answer) contains [k]?> or <(answer) contains [z]?>> then',
              },
            },
            data: {
              language: 'blocks',
              starterCode: lines(
                '// RULE SORTER: a person wrote this rule',
                'when green flag clicked',
                'ask [Type a made-up word] and wait',
                'if <(answer) contains [k]?> then',
                '  say [Spiky!]',
                'else',
                '  say [Soft!]',
                'end',
                '',
                '// 1. Be the computer. What does it say?',
                '// krak   ->',
                '// lulimo ->',
                '// zitzat ->',
                '// tizzik ->',
                '',
                '// 2. Change the rule above to fix its mistake.',
                '',
                '// 3. A spiky word your rule still gets wrong:',
                '//',
                '',
                '// LEARNING SORTER (just read it)',
                '// trained with: lulimo, molana, bolumi, malulu = Soft',
                '//               krak, tizzik, zatek, kipitt = Spiky',
                '// when green flag clicked',
                '// ask [Type a made-up word] and wait',
                '// say (recognise text (answer) (label))',
                '',
                '// 4. Who wrote the rule of the learning sorter?',
                '//    Hint: look at what it was trained with.',
                '//',
              ),
            },
          },
          {
            id: 'm3-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor for a real machine that learned to sort things from labelled examples. Find its labels yourself, then think: what would one-sided examples do to it?',
                starterPrompt:
                  'Give me an example of an everyday machine that learned to sort things from labelled examples. Tell me what it sorts, but let me guess its labels.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA l’exemple d’une vraie machine qui a appris à trier des choses grâce à des exemples étiquetés. Trouve toi-même ses étiquettes, puis réfléchis\u00a0: que lui feraient des exemples tous pareils\u00a0?',
                starterPrompt:
                  'Donne-moi l’exemple d’une machine de tous les jours qui a appris à trier des choses grâce à des exemples étiquetés. Dis-moi ce qu’elle trie, mais laisse-moi deviner ses étiquettes.',
              },
            },
            data: { tutorMode: 'give_example', labToolId: null },
          },
          {
            id: 'm3-l1-b7',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: { intro: 'Check what you know about labels, examples and testing.' },
              fr: {
                intro: 'Vérifie ce que tu sais sur les étiquettes, les exemples et les tests.',
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
                  'Why does a computer need many different examples to sort well? Use something from the sorting game in your answer.',
              },
              fr: {
                prompt:
                  'Pourquoi un ordinateur a-t-il besoin de beaucoup d’exemples variés pour bien trier\u00a0? Sers-toi d’un moment du jeu du tri dans ta réponse.',
              },
            },
            data: { minLength: 40 },
          },
        ],
      },
      {
        id: 'm3-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Teach a computer to understand you',
              summary:
                'Train a model on Machine Learning for Kids to understand classroom commands, then use it to control a virtual classroom in Scratch.',
            },
            fr: {
              title: 'Apprends à un ordinateur à te comprendre',
              summary:
                'Entraîne un modèle sur Machine Learning for Kids à comprendre des commandes, puis utilise-le pour piloter une classe virtuelle dans Scratch.',
            },
          },
          estimatedMinutes: 30,
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
                heading: 'Lamp on, please!',
                body: 'Imagine a classroom where the fan and the lamp do what you type. "Switch on the lamp" works. But what about "Make it brighter"? A person understands at once. A program that only knows a few exact sentences does nothing.\n\nRemember the rule sorter: every new word needed a new rule. Today you will train a computer with examples instead.',
              },
              fr: {
                heading: 'Allume la lampe, s’il te plaît\u00a0!',
                body: 'Imagine une classe où le ventilateur et la lampe font ce que tu écris. «\u00a0Allume la lampe\u00a0» marche. Mais «\u00a0Plus clair, s’il te plaît\u00a0»\u00a0? Une personne comprend tout de suite. Un programme qui ne connaît que quelques phrases exactes ne fait rien.\n\nSouviens-toi du trieur à règles\u00a0: chaque nouveau mot demandait une nouvelle règle. Aujourd’hui, tu vas plutôt entraîner un ordinateur avec des exemples.',
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
                heading: 'Commands, labels and meaning',
                body: 'Here, each **label** is a command the classroom can carry out, and each **example** is one way to ask for it:\n\n| Label | Examples |\n|---|---|\n| lamp on | "Light, please!" · "Make it brighter" |\n| fan on | "Start the fan" · "Phew, I\'m melting!" |\n\n"Make it brighter" never says *lamp* or *on*. With enough varied examples, the model learns the **meaning** of a command, not just its words, so it can understand sentences it has never seen.\n\nBut it only knows your labels. Type "What\'s for lunch?" and it still picks one of them. A person needs to check.',
              },
              fr: {
                heading: 'Commandes, étiquettes et sens',
                body: 'Ici, chaque **étiquette** est une commande que la classe sait exécuter, et chaque **exemple** est une façon de la demander. Les étiquettes restent en anglais, comme sur la fiche\u00a0: *lamp on*, c’est «\u00a0lampe allumée\u00a0», et *fan on*, «\u00a0ventilateur allumé\u00a0».\n\n| Étiquette | Exemples |\n|---|---|\n| lamp on | «\u00a0De la lumière, s’il te plaît\u00a0!\u00a0» · «\u00a0Plus clair, s’il te plaît\u00a0» |\n| fan on | «\u00a0Démarre le ventilateur\u00a0» · «\u00a0Pfiou, je fonds\u00a0!\u00a0» |\n\n«\u00a0Plus clair, s’il te plaît\u00a0» ne parle ni de *lampe* ni d’*allumer*. Avec assez d’exemples variés, le modèle apprend le **sens** d’une commande, pas seulement ses mots\u00a0: il peut donc comprendre des phrases qu’il n’a jamais vues.\n\nMais il ne connaît que tes étiquettes. Écris «\u00a0Qu’est-ce qu’on mange à midi\u00a0?\u00a0» et il en choisira quand même une. Une personne doit vérifier.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b3',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Smart Classroom: teach a computer your commands',
                instructions:
                  '**Your goal:** a Scratch classroom where the fan and the lamp obey you, whatever words you use.\n\n1. Open Machine Learning for Kids and choose **Try it now**. For the click-by-click steps, follow the official worksheet (PDF).\n2. Create a **text** project named **smart classroom**, in the language of your commands.\n3. Add the worksheet\'s four labels, spelled exactly like this: fan on, fan off, lamp on, lamp off. The Scratch classroom only knows these four.\n4. Under each label, write **at least five** different commands of your own. Mix them up: a polite one, a hint like "Phew, I\'m melting!", a very short one and a question. No names of real people.\n5. Train the model, then test it with **new** sentences and note the label it picks. Try tricky ones too, like "What\'s for lunch?"\n6. Mistakes? Add more varied examples where the model mixes up labels, then train and test again.\n7. With the worksheet, open Scratch and load the classroom. It only obeys a few exact sentences: swap those rules for your model, try your commands and take your screenshot.',
                bringBack:
                  'A screenshot of your Scratch classroom or of a test result (no names or faces), two new commands the model understood with the label it chose, and one it got wrong, with your idea of why.',
                hint: 'If the model mixes up two labels, compare their examples. Do "lamp on" and "lamp off" use almost the same words? Add examples that show the difference.',
              },
              fr: {
                title: 'Classe intelligente\u00a0: apprends tes commandes à un ordinateur',
                instructions:
                  '**Ton but\u00a0:** une classe Scratch où le ventilateur et la lampe t’obéissent, quels que soient tes mots.\n\n1. Ouvre Machine Learning for Kids et choisis **Essayer maintenant** (*Try it now*). Pour le détail des clics, suis la fiche officielle (PDF).\n2. Crée un projet de type **reconnaissance texte** nommé **smart classroom**, dans la langue de tes commandes (*French* pour le français).\n3. Ajoute les quatre étiquettes de la fiche, écrites exactement ainsi\u00a0: fan on, fan off, lamp on, lamp off. La classe Scratch ne connaît que celles-là.\n4. Pour chaque étiquette, écris **au moins cinq** commandes différentes, inventées par toi. Varie-les\u00a0: une commande polie, une phrase qui donne un indice (comme «\u00a0Pfiou, je fonds\u00a0!\u00a0»), une très courte et une question. Aucun nom de vraie personne.\n5. Entraîne le modèle, puis teste-le avec des phrases **nouvelles** et note l’étiquette qu’il choisit. Essaie aussi des phrases pièges, comme «\u00a0Qu’est-ce qu’on mange à midi\u00a0?\u00a0»\n6. Des erreurs\u00a0? Ajoute des exemples plus variés là où le modèle confond les étiquettes, puis entraîne et teste de nouveau.\n7. Avec la fiche, ouvre Scratch et charge la classe. Elle n’obéit qu’à quelques phrases exactes\u00a0: remplace ces règles par ton modèle, essaie tes commandes et fais ta capture d’écran.',
                bringBack:
                  'Une capture d’écran de ta classe Scratch ou d’un résultat de test (sans nom ni visage), deux commandes nouvelles que le modèle a comprises avec l’étiquette choisie, et une qu’il a mal comprise, en expliquant pourquoi d’après toi.',
                hint: 'Si le modèle confond deux étiquettes, compare leurs exemples. Est-ce que «\u00a0lamp on\u00a0» et «\u00a0lamp off\u00a0» utilisent presque les mêmes mots\u00a0? Ajoute des exemples qui montrent bien la différence.',
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
            id: 'm3-l2-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Be the smart classroom on paper',
                body: 'If the website does not open, play the same project with classmates or family.\n\n1. Make four label cards: **fan on**, **fan off**, **lamp on**, **lamp off**.\n2. Everyone writes commands on small papers, at least five per label, and puts them under the right card. That is the training.\n3. One player is **the computer** and reads all the examples.\n4. The others say **new** commands, including something off-topic like "What\'s for lunch?" The computer may only compare: it points at the label whose papers share the most words with the command, and it must always pick one of the four labels.\n5. Keep score: command, label chosen, right or wrong.\n\nWhich commands fooled the computer, and why? Bring back your score table and a photo of your cards (no faces).',
              },
              fr: {
                heading: 'Pas de site\u00a0? Joue à la classe intelligente sur papier',
                body: 'Si le site ne s’ouvre pas, joue le même projet avec des camarades ou avec ta famille.\n\n1. Prépare quatre cartes étiquettes\u00a0: **fan on** (ventilateur allumé), **fan off** (ventilateur éteint), **lamp on** (lampe allumée), **lamp off** (lampe éteinte).\n2. Chacun écrit des commandes sur de petits papiers, au moins cinq par étiquette, et les range sous la bonne carte. C’est l’entraînement.\n3. Un joueur fait **l’ordinateur**\u00a0: il lit tous les exemples.\n4. Les autres disent des commandes **nouvelles**, dont au moins une hors sujet, comme «\u00a0Qu’est-ce qu’on mange à midi\u00a0?\u00a0» L’ordinateur n’a le droit que de comparer\u00a0: il montre l’étiquette dont les papiers ont le plus de mots en commun avec la commande, et il doit toujours choisir une des quatre étiquettes.\n5. Note les résultats\u00a0: commande, étiquette choisie, juste ou faux.\n\nQuelles commandes ont trompé l’ordinateur, et pourquoi\u00a0? Rapporte ton tableau des résultats et une photo de tes cartes (sans visage).',
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
                  'Copy the examples you wrote for one label and ask the AI tutor if they are varied enough. It gives tips, but the new commands must be yours. No names or personal details.',
                starterPrompt:
                  'Here are my examples for one label of my smart classroom. Are they different enough? Give me one tip to make them more varied, but do not write examples for me.',
              },
              fr: {
                instructions:
                  'Recopie les exemples que tu as écrits pour une étiquette et demande au tuteur IA s’ils sont assez variés. Il te donne des conseils, mais les nouvelles commandes, c’est toi qui les écris. Ni nom ni détail personnel.',
                starterPrompt:
                  'Voici mes exemples pour une étiquette de ma classe intelligente. Sont-ils assez différents\u00a0? Donne-moi un conseil pour les varier davantage, mais n’écris pas d’exemples à ma place.',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm3-l2-b6',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in what your model did: one screenshot, two commands it understood and one it got wrong.',
              },
              fr: {
                intro:
                  'Rends ce qu’a fait ton modèle\u00a0: une capture d’écran, deux commandes qu’il a comprises et une qu’il a mal comprise.',
              },
            },
            data: { projectId: 'project-m3' },
          },
          {
            id: 'm3-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your model (or your paper computer) understood sentences it had never seen. How do you think it did that? What would you add to fix the command it got wrong?',
              },
              fr: {
                prompt:
                  'Ton modèle (ou ton ordinateur en papier) a compris des phrases qu’il n’avait jamais vues. Comment a-t-il fait, d’après toi\u00a0? Qu’ajouterais-tu pour corriger la commande qu’il a mal comprise\u00a0?',
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
      id: 'quiz-m3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: teach a computer with examples',
            instructions:
              'Six questions about labels, examples and testing. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: apprendre à un ordinateur avec des exemples',
            instructions:
              'Six questions sur les étiquettes, les exemples et les tests. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'You want to teach a computer to sort animals into "can fly" and "cannot fly". What are "can fly" and "cannot fly"?',
              },
              fr: {
                prompt:
                  'Tu veux apprendre à un ordinateur à trier des animaux en «\u00a0vole\u00a0» et «\u00a0ne vole pas\u00a0». Que sont «\u00a0vole\u00a0» et «\u00a0ne vole pas\u00a0»\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: { en: { text: 'The labels' }, fr: { text: 'Les étiquettes' } },
              },
              {
                id: 'b',
                translations: { en: { text: 'The examples' }, fr: { text: 'Les exemples' } },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The test cards' },
                  fr: { text: 'Les cartes de test' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'They are the names of the two groups, so they are the labels. Each animal you put in a group is an example.',
              },
              fr: {
                text: 'Ce sont les noms des deux groupes\u00a0: ce sont donc les étiquettes. Chaque animal que tu ranges dans un groupe est un exemple.',
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
                  'To check what a computer has learned, it is best to test it with the same cards it learned from.',
              },
              fr: {
                prompt:
                  'Pour vérifier ce qu’un ordinateur a appris, le mieux est de le tester avec les cartes qui lui ont servi à apprendre.',
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
                text: 'False. Test it with new cards it has never seen. Otherwise it may just remember its examples without having learned the pattern.',
              },
              fr: {
                text: 'Faux. Teste-le avec des cartes nouvelles, qu’il n’a jamais vues. Sinon, il se souvient peut-être de ses exemples sans avoir trouvé la régularité.',
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
                  'A robot learns to sort words from three soft words and three spiky words. All three spiky words start with K. What will probably go wrong?',
              },
              fr: {
                prompt:
                  'Un robot apprend à trier des mots à partir de trois mots doux et de trois mots piquants. Les trois mots piquants commencent tous par K. Qu’est-ce qui risque de mal se passer\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'It may think that only words starting with K are spiky, and get "zatek" wrong',
                  },
                  fr: {
                    text: 'Il risque de croire que seuls les mots qui commencent par K sont piquants, et de mal ranger «\u00a0zatek\u00a0»',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It will sort every new word perfectly' },
                  fr: { text: 'Il rangera parfaitement chaque nouveau mot' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It will stop working because the words are made up' },
                  fr: { text: 'Il arrêtera de fonctionner parce que les mots sont inventés' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Its examples are one-sided, so it may learn a one-sided pattern. Spiky words that start with other letters would help.',
              },
              fr: {
                text: 'Ses exemples sont tous pareils, alors il risque d’apprendre une régularité trop étroite. Des mots piquants qui commencent par d’autres lettres l’aideraient.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Which of these would help a computer sort better? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Qu’est-ce qui aiderait un ordinateur à mieux trier\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Give it more examples for each label' },
                  fr: { text: 'Lui donner plus d’exemples pour chaque étiquette' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Give it examples that are different from each other' },
                  fr: { text: 'Lui donner des exemples différents les uns des autres' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Give it only examples that look almost the same' },
                  fr: { text: 'Lui donner seulement des exemples presque identiques' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Test it on new cards and add examples where it makes mistakes' },
                  fr: {
                    text: 'Le tester sur des cartes nouvelles et ajouter des exemples là où il se trompe',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'More examples, varied examples and testing with new cards all help. Examples that all look the same teach a one-sided pattern.',
              },
              fr: {
                text: 'Plus d’exemples, des exemples variés et des tests sur des cartes nouvelles\u00a0: tout cela aide. Des exemples tous pareils font apprendre une régularité trop étroite.',
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
                  'What is the difference between a rule sorter and a sorter that learns from examples?',
              },
              fr: {
                prompt:
                  'Quelle est la différence entre un trieur à règles et un trieur qui apprend à partir d’exemples\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'In a rule sorter, a person writes the rules. A learning sorter finds the patterns in labelled examples.',
                  },
                  fr: {
                    text: 'Dans un trieur à règles, c’est une personne qui écrit les règles. Un trieur qui apprend trouve les régularités dans des exemples étiquetés.',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A rule sorter never makes mistakes.' },
                  fr: { text: 'Un trieur à règles ne se trompe jamais.' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A learning sorter does not need any examples.' },
                  fr: { text: 'Un trieur qui apprend n’a besoin d’aucun exemple.' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The rule sorter only knows the rules a person wrote, like "contains k". The learning sorter works out the pattern from labelled examples. Both can still make mistakes.',
              },
              fr: {
                text: 'Le trieur à règles ne connaît que les règles écrites par une personne, comme «\u00a0contient un k\u00a0». Le trieur qui apprend trouve la régularité dans les exemples étiquetés. Et tous les deux peuvent se tromper.',
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
                  'A computer has studied its labelled examples. What do we call the next step, when you try it on something new? (one word)',
              },
              fr: {
                prompt:
                  'Un ordinateur a étudié ses exemples étiquetés. Comment appelle-t-on l’étape suivante, quand on l’essaie sur quelque chose de nouveau\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['testing', 'test', 'a test', 'the test', 'tests', 'test it', 'testing it'],
              fr: ['test', 'le test', 'un test', 'tests', 'les tests', 'tester', 'le tester'],
            },
            explanation: {
              en: {
                text: 'Testing! Training uses the labelled examples; testing uses new things the computer has never seen.',
              },
              fr: {
                text: 'Le test\u00a0! L’entraînement se fait avec les exemples étiquetés\u00a0; le test, avec des choses nouvelles que l’ordinateur n’a jamais vues.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m3',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'My smart classroom',
            brief:
              'Train a model on Machine Learning for Kids to understand commands for the fan and the lamp of a virtual classroom. Test it with new sentences, use it in the Scratch classroom, and show what it understood and where it went wrong.',
            requirements:
              'Hand in three things: (1) a screenshot of your Scratch classroom reacting to a command, or of a test result on Machine Learning for Kids; (2) two new commands that were not in your examples and that the model understood, each with the label it chose; (3) one command it got wrong, the label it chose, and one or two sentences about why you think it made that mistake. If it got everything right, give it an off-topic command like "What\'s for lunch?" and use that one. Send the screenshot as a picture and write (2) and (3) in the box about your work. No names, faces or school details in your commands or your screenshot. If the website did not open, play the paper version and send your score table (as text or a photo) instead of the screenshot, with (2) and (3) from your game.',
          },
          fr: {
            title: 'Ma classe intelligente',
            brief:
              'Entraîne un modèle sur Machine Learning for Kids à comprendre des commandes pour le ventilateur et la lampe d’une classe virtuelle. Teste-le avec des phrases nouvelles, utilise-le dans la classe Scratch, puis montre ce qu’il a compris et où il s’est trompé.',
            requirements:
              'Rends trois choses\u00a0: (1) une capture d’écran de ta classe Scratch qui réagit à une commande, ou d’un résultat de test sur Machine Learning for Kids\u00a0; (2) deux commandes nouvelles, absentes de tes exemples, que le modèle a comprises, chacune avec l’étiquette qu’il a choisie\u00a0; (3) une commande qu’il a mal comprise, l’étiquette qu’il a choisie, et une ou deux phrases pour expliquer pourquoi il s’est trompé, d’après toi. S’il ne s’est jamais trompé, donne-lui une commande hors sujet, comme «\u00a0Qu’est-ce qu’on mange à midi\u00a0?\u00a0», et sers-toi de celle-là. Envoie la capture d’écran comme image et écris (2) et (3) dans «\u00a0À propos de votre travail\u00a0». Aucun nom, aucun visage ni aucun détail sur ton école dans tes commandes ou ta capture d’écran. Si le site ne s’est pas ouvert, joue la version sur papier et envoie ton tableau des résultats (en texte ou en photo) à la place de la capture d’écran, avec (2) et (3) tirés de ta partie.',
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
