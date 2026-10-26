// Module m5 of "AI Robotics Foundations" (ages 10-14): robots that learn to choose. It comes after
// m4 (robots that listen) and before m3 (build your autonomous robot, which stays last). It builds
// on the if/then rules, the elif of the Python traces and the rule "a safety rule never depends
// only on a guess" of m2-l2, and on the training data and bias of m2-l1; m3-l1 later reuses the
// idea of if/then rules checked in order.
// m5-l1: a robot vacuum test log (10 moments: distance ahead, battery, floor, the action a tester
// chose) turned into a decision tree drawn on paper: battery below 20% -> charge; else something
// closer than 15 cm -> turn; else forward. The tree never asks about the floor. How a tree is
// grown (try every question, keep the one that sorts the rows best, repeat in each branch): on the
// log, "battery below 20%?" gathers the 3 charge moments at once, and no distance or floor
// question gathers all the moments of one action like that (moment 6, 8 cm with 10% battery, is
// why distance cannot go first). The lesson says that real tools use a more precise score. Any
// distance threshold between 14 and 45 cm works for the second question (no moment in between:
// the gap). Overfitting with moment 11 (65 cm, 80%, tiles, turn: a cat ran past): to fit it, a
// tree needs an extra branch such as "floor is tiles and battery above 70% -> turn", which no
// other row of that branch matches. The Python code activity, to trace by hand: with question 2
// completed, the four tests print forward, turn, charge, forward; the bonus test (90, 85, "tiles")
// gives turn once the cat branch is added. Then a hint tutor activity (the learner's own made-up
// log) and a reflection.
// m5-l2: the Machine Learning for Kids activity Zombie Escape! (Fuir les zombies !, the site's
// French title; worksheet-zombieescape.pdf; numbers; Scratch 3; Try it now, as the worksheet
// itself does, although its teacher's notes list a username and password; numbers projects need
// no API keys). The site rates it advanced (level 3); its teacher's notes say Intermediate, 45
// minutes to 1 hour, so the lesson asks for pairs and teacher help with Scratch for 10- and
// 11-year-olds, and the hint allows three sensors instead of five (the teacher's notes say fewer
// sensors make the Scratch part simpler but the model weaker). The lesson never says which
// sensors predict zombies: the teacher's notes keep the zombie behaviour for the end of the lesson.
// Facts checked in the site's code (IBM/taxinomitis): Try it now allows one project at a time
// (NEWPROJECT.ERRORS.TRYITNOW); numbers projects need at least five examples per label
// (models.controller.js, minimumExamples 'five'); numbers models are trained with gradient-boosted
// trees (ydf GradientBoostedTreesLearner, mlforkids-newnumbers/app/models.py) and the
// "Describe your model!" page draws one scikit-learn DecisionTreeClassifier grown from the same
// examples (viz.py), hence "behind the scenes it combines many small trees". That button label is
// English in the French interface too. The Scratch template (zombie-escape.sb3) records both rooms
// of each corridor with their true state, so the game labels the examples, not the player. A paper
// version (a partner hides a zombie rule, 12 room cards with made-up readings that are not on the
// worksheet's sensor list, 8 to train and 4 to test, then a round with bad examples); the hand-in
// project-m5 (assignment: a screenshot, the sensors, one rule the model seems to have learned, one
// bad choice and why, one improvement; a good set of sensors can give a perfect escape, so item 4
// and the reflection offer a fallback: an earlier escape, or a made-up room unlike the examples);
// the module quiz quiz-m5 and a reflection. Examples of readings name the robot vacuum's sensors,
// never the game's. Project requirements, code_activity instructions and hints, and ml_activity
// bringBack and hint are shown as plain text, so they use no Markdown.
// No video block in this module: no curated video in the course files is about
// decision trees, and the training-data video of m2-l2 is not repeated.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m5: SeedModulePart = {
  module: {
    id: 'm5',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Robots that learn to choose',
          description:
            'Turn sensor numbers into decisions with decision trees, then train a robot in a game to choose its escape route from examples you collect.',
        },
        fr: {
          title: 'Des robots qui apprennent à choisir',
          description:
            'Transforme des mesures de capteurs en décisions grâce aux arbres de décision, puis entraîne le robot d’un jeu à choisir sa route pour s’échapper, à partir d’exemples que tu rassembles.',
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
              title: 'Decision trees for robots',
              summary:
                'Turn a table of sensor readings into a decision tree, see how a computer picks the most useful question first, and why learning examples by heart is a trap.',
            },
            fr: {
              title: 'Des arbres de décision pour les robots',
              summary:
                'Transforme un tableau de mesures en arbre de décision, vois comment un ordinateur choisit d’abord la question la plus utile, et pourquoi apprendre les exemples par cœur est un piège.',
            },
          },
          estimatedMinutes: 30,
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
                heading: 'Can you find the rules?',
                body: "In module 2 you wrote a robot's rules yourself. But what if nobody knows the rules yet, and all you have is examples?\n\nHere is the test log of a robot vacuum: at ten moments, what three sensors measured and the action chosen by the person testing it.\n\n| Moment | Distance ahead (cm) | Battery (%) | Floor | Right action |\n|---|---|---|---|---|\n| 1 | 80 | 90 | carpet | forward |\n| 2 | 10 | 85 | tiles | turn |\n| 3 | 60 | 15 | carpet | charge |\n| 4 | 12 | 70 | carpet | turn |\n| 5 | 95 | 50 | tiles | forward |\n| 6 | 8 | 10 | tiles | charge |\n| 7 | 45 | 60 | tiles | forward |\n| 8 | 70 | 18 | tiles | charge |\n| 9 | 14 | 40 | carpet | turn |\n| 10 | 50 | 75 | carpet | forward |\n\nBefore you read on, look for rules that give the right action in every row. Which column would you check first? Does every column matter?",
              },
              fr: {
                heading: 'Sauras-tu trouver les règles\u00a0?',
                body: 'Dans le module 2, tu as écrit toi-même les règles d’un robot. Mais si personne ne connaît encore les règles, et que tu n’as que des exemples\u00a0?\n\nVoici le journal de test d’un robot aspirateur\u00a0: à dix moments, ce qu’ont mesuré trois capteurs et l’action choisie par la personne qui le testait.\n\n| Moment | Distance devant (cm) | Batterie (%) | Sol | Bonne action |\n|---|---|---|---|---|\n| 1 | 80 | 90 | moquette | avancer |\n| 2 | 10 | 85 | carrelage | tourner |\n| 3 | 60 | 15 | moquette | recharger |\n| 4 | 12 | 70 | moquette | tourner |\n| 5 | 95 | 50 | carrelage | avancer |\n| 6 | 8 | 10 | carrelage | recharger |\n| 7 | 45 | 60 | carrelage | avancer |\n| 8 | 70 | 18 | carrelage | recharger |\n| 9 | 14 | 40 | moquette | tourner |\n| 10 | 50 | 75 | moquette | avancer |\n\nAvant de lire la suite, cherche des règles qui donnent la bonne action à chaque ligne. Quelle colonne regarderais-tu en premier\u00a0? Toutes les colonnes comptent-elles\u00a0?',
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
                heading: 'From a table to a tree',
                body: 'A **decision tree** is a set of questions arranged like an upside-down tree. The robot starts at the top, answers a question, follows the *yes* or the *no* branch to the next question, and stops at a **leaf**: an action.\n\nThis tree gives the right action for all ten moments of the log:\n\n- **Is the battery below 20%?**\n  - yes → **charge**\n  - no → **Is something closer than 15 cm?**\n    - yes → **turn**\n    - no → **forward**\n\nCheck moment 9 (14 cm, 40%): the battery is not below 20%, so go to the second question; 14 cm is closer than 15 cm, so the robot turns. Right!\n\n**Draw it on paper:** each question in a box, with two arrows, *yes* and *no*, leading to the next question or to a leaf (a circle with an action). Then test your drawing with three moments of the log, following one path from the top each time.\n\nNotice two things:\n\n- **The tree never asks about the floor.** In this log, carpet or tiles makes no difference to the right action, so the tree leaves that sensor out.\n- **A tree is if/then rules in order,** like the `if`, `elif` and `else` you used in module 2. The order matters: ask the distance question first, and moment 6 (8 cm, but an almost empty battery) gets *turn* instead of *charge*.',
              },
              fr: {
                heading: 'D’un tableau à un arbre',
                body: 'Un **arbre de décision** est un ensemble de questions rangées comme un arbre à l’envers. Le robot part du haut, répond à une question, suit la branche *oui* ou la branche *non* jusqu’à la question suivante, et s’arrête sur une **feuille**\u00a0: une action.\n\nCet arbre donne la bonne action pour les dix moments du journal\u00a0:\n\n- **La batterie est-elle sous 20\u00a0%\u00a0?**\n  - oui → **recharger**\n  - non → **Y a-t-il un obstacle à moins de 15\u00a0cm\u00a0?**\n    - oui → **tourner**\n    - non → **avancer**\n\nVérifie le moment 9 (14\u00a0cm, 40\u00a0%)\u00a0: la batterie n’est pas sous 20\u00a0%, on passe donc à la deuxième question\u00a0; 14\u00a0cm, c’est moins de 15\u00a0cm, donc le robot tourne. Bonne réponse\u00a0!\n\n**Dessine-le sur papier\u00a0:** chaque question dans une case, avec deux flèches, *oui* et *non*, qui mènent à la question suivante ou à une feuille (un rond avec une action). Teste ensuite ton dessin avec trois moments du journal, en suivant à chaque fois un seul chemin depuis le haut.\n\nRemarque deux choses\u00a0:\n\n- **L’arbre ne pose jamais de question sur le sol.** Dans ce journal, moquette ou carrelage, cela ne change rien à la bonne action\u00a0: l’arbre laisse donc ce capteur de côté.\n- **Un arbre, ce sont des règles si… alors rangées dans l’ordre,** comme les `if`, `elif` et `else` que tu as utilisés dans le module 2. L’ordre compte\u00a0: pose d’abord la question de la distance, et le moment 6 (8\u00a0cm, mais une batterie presque vide) donne *tourner* au lieu de *recharger*.',
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
                heading: 'How a computer grows a tree',
                body: 'A computer grows a tree the way a good player of *20 questions* plays: start with the question that rules out the most answers.\n\n1. **Try every question:** for a number, thresholds between the values in the table (*below 15? below 30?*); for a choice, each option (*carpet?*).\n2. **Keep the most useful one,** the question that sorts the rows into groups with a single action. *Battery below 20%?* puts all three *charge* moments together at once, and no distance or floor question gathers all the moments of one action like that. So the battery question goes at the top.\n3. **Repeat inside each branch** with the rows that reached it, until every group has one action.\n\nReal tools measure *most useful* with a more precise score, but the idea is the same. For the second question, any distance threshold between 14 and 45 cm would work just as well, because no moment lies in between: at 25 cm, nobody knows the right action. Only more examples can tell.\n\n**Overfitting: learning by heart.** Add moment 11: *65 cm, 80%, tiles, turn*. The tester chose *turn* because a cat ran past, but the log does not say so. To fit this row, the tree must grow an extra branch, such as *if the floor is tiles and the battery is above 70%, turn*. It has learned an accident, not a rule: on tiles with a well-charged battery, the robot now turns for nothing. A model that copies the accidents in its training examples and does worse in new situations is **overfitting**. Engineers fight it with small trees (few questions, no branch for just one or two examples), more varied examples, and tests with new examples that were not used for training.\n\nAnd remember module 2: a learned tree is still a guess. A safety rule such as *stop if the bumper is pressed* is written by people and checked before the tree.',
              },
              fr: {
                heading: 'Comment un ordinateur fait pousser un arbre',
                body: 'Un ordinateur fait pousser un arbre comme un bon joueur du jeu des *20 questions*\u00a0: il commence par la question qui élimine le plus de réponses.\n\n1. **Il essaie toutes les questions\u00a0:** pour un nombre, des seuils entre les valeurs du tableau (*moins de 15\u00a0? moins de 30\u00a0?*)\u00a0; pour un choix, chaque option (*moquette\u00a0?*).\n2. **Il garde la plus utile,** celle qui range les lignes en groupes d’une seule action. *Batterie sous 20\u00a0%\u00a0?* réunit d’un coup les trois moments *recharger*, et aucune question sur la distance ou sur le sol ne réunit ainsi tous les moments d’une même action. La question de la batterie va donc en haut.\n3. **Il recommence dans chaque branche** avec les lignes qui y sont arrivées, jusqu’à ce que chaque groupe n’ait plus qu’une action.\n\nLes vrais outils mesurent «\u00a0la plus utile\u00a0» avec un score plus précis, mais l’idée est la même. Pour la deuxième question, n’importe quel seuil de distance entre 14 et 45\u00a0cm marcherait aussi bien, car aucun moment ne se trouve entre les deux\u00a0: à 25\u00a0cm, personne ne connaît la bonne action. Seuls de nouveaux exemples peuvent le dire.\n\n**Le surapprentissage\u00a0: apprendre par cœur.** Ajoute le moment 11\u00a0: *65\u00a0cm, 80\u00a0%, carrelage, tourner*. La personne qui testait a choisi *tourner* parce qu’un chat passait, mais le journal ne le dit pas. Pour coller à cette ligne, il faut ajouter une branche à l’arbre, par exemple *si le sol est du carrelage et que la batterie dépasse 70\u00a0%, tourne*. Il a appris un accident, pas une règle\u00a0: sur du carrelage, avec une batterie bien chargée, le robot tourne désormais pour rien. Un modèle qui recopie les accidents de ses exemples d’entraînement et se débrouille moins bien dans les situations nouvelles fait du **surapprentissage** (*overfitting* en anglais). Les ingénieurs le combattent avec de petits arbres (peu de questions, pas de branche pour un ou deux exemples seulement), des exemples plus variés, et des tests avec de nouveaux exemples qui n’ont pas servi à l’entraînement.\n\nEt souviens-toi du module 2\u00a0: un arbre appris reste une estimation. Une règle de sécurité comme *arrête-toi si le pare-chocs est enfoncé* est écrite par des personnes et vérifiée avant l’arbre.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b4',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Turn the tree into Python and test it on four new sets of readings. The program is saved, not run: trace it by hand. The comments after # explain the new words.\n\n1. Complete question 2 where it says TO DO, using the tree you drew.\n2. In the comments at the bottom, write what the program prints for each test.\n3. The test (25, 80, "carpet") falls in the gap in the log (no moment between 14 and 45 cm). Is "forward" safe there? Write which moment you would add to the log to find out.\n4. The program never uses floor. In a comment, explain why that is not a bug.\n5. Bonus: just above else, add the cat branch: the line elif floor == "tiles" and battery > 70: (and means both must be true), with action = "turn" indented under it. Add the test (90, 85, "tiles") to the list, trace it and explain in a comment why this branch is overfitting.',
                hint: 'For step 1, add two lines just above else: "elif distance < 15:" and, indented under it, action = "turn". elif means "else if": Python only asks it when the answer to the battery question is no, just like the tree.',
              },
              fr: {
                instructions:
                  'Transforme l’arbre en Python et teste-le sur quatre nouveaux ensembles de mesures. Le programme est enregistré, pas exécuté\u00a0: déroule-le à la main. Les commentaires après # expliquent les mots nouveaux.\n\n1. Complète la question 2 à l’endroit marqué TO DO (À FAIRE), à partir de l’arbre que tu as dessiné.\n2. Dans les commentaires en bas, écris ce que le programme affiche pour chaque test.\n3. Le test (25, 80, "carpet") tombe dans le trou du journal (aucun moment entre 14 et 45\u00a0cm). Avancer (forward) est-il prudent à cet endroit\u00a0? Écris quel moment tu ajouterais au journal pour le savoir.\n4. Le programme n’utilise jamais floor (le sol). Explique dans un commentaire pourquoi ce n’est pas une erreur.\n5. Bonus\u00a0: juste au-dessus de else, ajoute la branche du chat\u00a0: la ligne «\u00a0elif floor == "tiles" and battery > 70:\u00a0» (and veut dire que les deux conditions doivent être vraies), avec «\u00a0action = "turn"\u00a0» en retrait en dessous. Ajoute le test (90, 85, "tiles") à la liste, déroule-le et explique dans un commentaire pourquoi cette branche est du surapprentissage.',
                hint: 'Pour l’étape 1, ajoute deux lignes juste au-dessus de else\u00a0: «\u00a0elif distance < 15:\u00a0» puis, en retrait en dessous, «\u00a0action = "turn"\u00a0». elif veut dire «\u00a0sinon si\u00a0»\u00a0: Python ne pose cette question que si la réponse à la question de la batterie est non, exactement comme l’arbre.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté\u00a0: déroule-le à la main.',
                '# One test = (distance in cm, battery in %, floor). carpet = moquette, tiles = carrelage.',
                '# / Un test = (distance en cm, batterie en %, sol).',
                '# Actions: charge = recharger, turn = tourner, forward = avancer.',
                'tests = [(70, 65, "carpet"), (9, 50, "tiles"), (40, 12, "tiles"), (25, 80, "carpet")]',
                '',
                '# The loop takes each test in turn and gives its three readings a name.',
                '# / La boucle prend chaque test tour à tour et donne un nom à ses trois mesures.',
                'for distance, battery, floor in tests:',
                '    # Question 1, at the top of the tree / Question 1, en haut de l’arbre',
                '    if battery < 20:',
                '        action = "charge"',
                '    # TO DO: question 2, only asked when the answer to question 1 is no.',
                '    # / À FAIRE\u00a0: la question 2, posée seulement si la réponse à la question 1 est non.',
                '    else:',
                '        action = "forward"',
                '    print(distance, battery, floor, action)',
                '',
                '# My trace / Ma trace:',
                '# 70 65 carpet forward',
              ),
            },
          },
          {
            id: 'm5-l1-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Invent a robot (a plant-watering robot, a robot goalkeeper, a rover…) and write a log of 6 to 8 moments: two sensor readings and the right action for each. Ask the AI tutor for a hint about which question your tree should ask first, not for the tree itself. Then draw the tree yourself and check it against every row. Use made-up details only.',
                starterPrompt:
                  'I am drawing a decision tree for my robot from this log: [paste your table]. Which question should I ask first? Give me a hint about how to compare the questions, not the answer.',
              },
              fr: {
                instructions:
                  'Invente un robot (un robot qui arrose les plantes, un robot gardien de but, un rover…) et écris un journal de 6 à 8 moments\u00a0: deux mesures de capteurs et la bonne action pour chacun. Demande au tuteur IA un indice sur la question que ton arbre doit poser en premier, pas l’arbre lui-même. Dessine ensuite l’arbre toi-même et vérifie-le sur chaque ligne. N’utilise que des détails inventés.',
                starterPrompt:
                  'Je dessine un arbre de décision pour mon robot à partir de ce journal\u00a0: [colle ton tableau]. Quelle question dois-je poser en premier\u00a0? Donne-moi un indice pour comparer les questions, pas la réponse.',
              },
            },
            data: { tutorMode: 'hint', labToolId: null },
          },
          {
            id: 'm5-l1-b6',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think about the cat in moment 11. When should a robot learn from an unusual example, and when is it better to leave the example out? Give one case of each.',
              },
              fr: {
                prompt:
                  'Repense au chat du moment 11. Quand un robot doit-il apprendre d’un exemple inhabituel, et quand vaut-il mieux laisser cet exemple de côté\u00a0? Donne un cas de chaque.',
              },
            },
            data: { minLength: 50 },
          },
        ],
      },
      {
        id: 'm5-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Train a robot to escape',
              summary:
                "Choose a robot's sensors, collect examples by playing Zombie Escape! on Machine Learning for Kids, and find out what bad training examples do to its choices.",
            },
            fr: {
              title: 'Entraîne un robot à s’échapper',
              summary:
                'Choisis les capteurs d’un robot, rassemble des exemples en jouant à Fuir les zombies\u00a0! sur Machine Learning for Kids, et découvre comment de mauvais exemples d’entraînement faussent ses choix.',
            },
          },
          estimatedMinutes: 50,
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
                heading: 'Which door is safe?',
                body: "Picture two closed doors. Behind one hides a cartoon zombie; behind the other, nothing. You may not open them, but your robot gives you a few readings about each room. Which readings would you trust, and how could you find out which ones matter?\n\nIn today's game you answer by playing: every room your robot checks becomes an example with its true answer, and a model learns from those **examples**.\n\nIn lesson 1 you grew a decision tree by hand. Today the computer grows one from the examples you collect.",
              },
              fr: {
                heading: 'Quelle porte est sans danger\u00a0?',
                body: 'Imagine deux portes fermées. Derrière l’une se cache un zombie de dessin animé\u00a0; derrière l’autre, rien. Tu n’as pas le droit de les ouvrir, mais ton robot te donne quelques mesures sur chaque chambre. À quelles mesures ferais-tu confiance, et comment savoir lesquelles comptent vraiment\u00a0?\n\nDans le jeu d’aujourd’hui, tu vas répondre en jouant\u00a0: chaque chambre que vérifie ton robot devient un exemple accompagné de la vraie réponse, et un modèle apprend à partir de ces **exemples**.\n\nDans la leçon 1, tu as fait pousser un arbre de décision à la main. Aujourd’hui, c’est l’ordinateur qui en fait pousser un à partir des exemples que tu rassembles.',
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
                heading: 'Clues, examples and advice',
                body: '**Features: readings that describe a situation.** A model cannot look inside a room; it only gets readings. They can be numbers, like the distance and the battery level of the robot vacuum, or one choice from a short list, like its floor: carpet or tiles. Each kind of reading is a **feature**, and choosing which ones a model learns from is **feature selection**. You will pick five of the twelve sensors listed in the worksheet. Remember the floor sensor of the robot vacuum: not every reading helps, and finding out which ones do is part of the game. A tree can leave a useless sensor out, but it cannot learn from a clue you never gave it.\n\n**Examples and labels.** As you play, every room your robot passes is added to the training data: its readings and its label, *safe* or *zombie*, from what was really behind the door. Machine Learning for Kids learns from them with trees (behind the scenes, it combines many small ones). Its **Describe your model!** page draws a decision tree grown from your examples, usually with the most useful questions near the top.\n\n**Bad examples make bad choices.**\n\n- **Too few examples:** chance patterns look like rules (overfitting again).\n- **Useless features:** nothing in the numbers predicts a zombie, so the model guesses.\n- **One-sided examples:** if every training room was small, the model knows nothing about big ones, like the gap in the robot vacuum log.\n- **Wrong labels:** here the game labels the rooms, but in real projects people write the labels, and the model copies their mistakes.\n\n**Advice, not orders.** In Escape! mode, the model highlights any door it predicts is safe, and you decide. In serious places, such as hospitals, a model like this should only advise: a person checks the advice and stays responsible, because the model can be wrong, or unfair if its examples left some people out, as you saw in module 2.',
              },
              fr: {
                heading: 'Des indices, des exemples et des conseils',
                body: '**Les caractéristiques\u00a0: des mesures qui décrivent une situation.** Un modèle ne peut pas regarder dans une chambre\u00a0; il ne reçoit que des mesures. Il peut s’agir de nombres, comme la distance et le niveau de batterie du robot aspirateur, ou d’un choix dans une courte liste, comme son sol\u00a0: moquette ou carrelage. Chaque sorte de mesure est une **caractéristique** (en anglais *feature*), et choisir celles dont un modèle va apprendre, c’est la **sélection des caractéristiques**. Tu vas choisir cinq des douze capteurs de la fiche. Souviens-toi du capteur de sol du robot aspirateur\u00a0: toutes les mesures n’aident pas, et découvrir lesquelles aident fait partie du jeu. Un arbre peut laisser de côté un capteur inutile, mais il ne peut pas apprendre d’un indice que tu ne lui as jamais donné.\n\n**Exemples et étiquettes.** Pendant que tu joues, chaque chambre devant laquelle passe ton robot s’ajoute aux données d’entraînement\u00a0: ses mesures et son étiquette, *safe* (sans danger) ou *zombie*, d’après ce qui se trouvait vraiment derrière la porte. Machine Learning for Kids apprend de ces exemples avec des arbres (en coulisses, il en combine beaucoup de petits). Sa page **Describe your model!** (décris ton modèle) dessine un arbre de décision issu de tes exemples, en général avec les questions les plus utiles vers le haut.\n\n**De mauvais exemples donnent de mauvais choix.**\n\n- **Trop peu d’exemples\u00a0:** des ressemblances dues au hasard passent pour des règles (encore le surapprentissage).\n- **Des caractéristiques inutiles\u00a0:** rien dans les nombres ne permet de prévoir un zombie, alors le modèle devine.\n- **Des exemples d’un seul genre\u00a0:** si toutes les chambres d’entraînement étaient petites, le modèle ne sait rien des grandes chambres, comme le trou dans le journal du robot aspirateur.\n- **De mauvaises étiquettes\u00a0:** ici, c’est le jeu qui étiquette les chambres, mais dans les vrais projets, ce sont des personnes qui écrivent les étiquettes, et le modèle recopie leurs erreurs.\n\n**Des conseils, pas des ordres.** En mode Escape!, le modèle met en valeur chaque porte qu’il juge sans danger, et c’est toi qui décides. Dans des domaines sérieux, comme la santé, un modèle de ce genre ne devrait que conseiller\u00a0: une personne vérifie le conseil et reste responsable, car le modèle peut se tromper, ou être injuste si ses exemples ont laissé certaines personnes de côté, comme tu l’as vu dans le module 2.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b3',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Zombie Escape! Train your robot to choose a safe door',
                instructions:
                  "**Goal:** choose your robot's sensors, collect examples by playing, then let a model trained on them recommend a door, and judge its advice. The big idea: a model can learn a decision from numbers that describe a situation, and bad examples make bad choices.\n\n**Work in pairs.** The site rates this as one of its harder projects (its teacher's notes allow 45 minutes to an hour). If you are 10 or 11, ask your teacher to help with the Scratch part. The project uses no camera, no microphone and nothing about you.\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**. It keeps one project at a time: if you already have one, delete it once its work is handed in.\n2. In the official worksheet (PDF), read the list of sensors and choose five that you think will predict zombies. Write down each one with your reason before you play.\n3. Create a project named *Zombie Escape* that recognises **numbers**, and add one value for each sensor you chose, of the kind the worksheet shows (a number or a multiple-choice value).\n4. In **Train**, add the labels *safe* and *zombie*. Keep these names, so that the worksheet's Scratch template matches.\n5. In **Make**, open Scratch 3 and the *Zombie Escape* project template, and follow the worksheet to connect your sensors. Play in **Train** mode: every room your robot passes becomes a training example. Look for patterns.\n6. Follow the worksheet to add the prediction blocks, then play in **Escape!** mode: the model highlights any door it predicts is safe, and you decide. Note how many times you were attacked, then play again: does the advice improve?\n7. In **Learn & Test**, click **Describe your model!**. Which sensor is at the top of the tree? Test a made-up room, then take a screenshot of the tree or of your escape result.",
                bringBack:
                  'For the project below: your screenshot (of the tree or of your escape result), the sensors you chose, one rule the model seems to have learned, one bad choice it made (or, if it never went wrong, its prediction for a made-up room unlike your examples) with your explanation of why, and one improvement you would make.',
                hint: "Bad advice? Play more rounds in Train mode: the site needs at least five examples of each label, and more is better. Still bad? Your sensors may be poor clues: compare with a pair who chose different ones. Short of time? With your teacher's agreement, use three sensors instead of five: quicker to build, but less for the robot to go on. No site? Use the paper version below.",
              },
              fr: {
                title: 'Fuir les zombies\u00a0! Entraîne ton robot à choisir une porte sans danger',
                instructions:
                  '**Objectif\u00a0:** choisir les capteurs de ton robot, rassembler des exemples en jouant, puis laisser un modèle entraîné sur ces exemples te conseiller une porte, et juger ses conseils. La grande idée\u00a0: un modèle peut apprendre une décision à partir de nombres qui décrivent une situation, et de mauvais exemples donnent de mauvais choix.\n\n**Travaille en binôme.** Le site classe ce projet parmi ses plus difficiles (ses notes pour l’enseignant prévoient de 45\u00a0minutes à une heure). Si tu as 10 ou 11\u00a0ans, demande à ton enseignant de t’aider pour la partie Scratch. Le projet n’utilise ni caméra, ni micro, ni aucune information sur toi.\n\n1. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*). Ce mode ne garde qu’un projet à la fois\u00a0: si tu en as déjà un, supprime-le une fois son travail rendu.\n2. Dans la fiche officielle (PDF), lis la liste des capteurs et choisis-en cinq qui, d’après toi, permettront de prévoir les zombies. Note chacun avec la raison de ton choix avant de jouer.\n3. Crée un projet nommé *Zombie Escape* qui reconnaît des **nombres** (*numbers*), et ajoute une valeur pour chaque capteur choisi, du type indiqué par la fiche (un nombre ou une valeur à choix multiple).\n4. Dans **Entraîner** (*Train*), ajoute les étiquettes *safe* (sans danger) et *zombie*. Garde ces noms anglais pour que le gabarit Scratch de la fiche fonctionne.\n5. Dans **Faire** (*Make*), ouvre Scratch 3 et le gabarit de projet *Zombie Escape*, et suis la fiche pour brancher tes capteurs. Joue en mode **Train** (entraînement)\u00a0: chaque chambre devant laquelle passe ton robot devient un exemple d’entraînement. Cherche des régularités.\n6. Suis la fiche pour ajouter les blocs de prédiction, puis joue en mode **Escape!** (s’échapper)\u00a0: le modèle met en valeur chaque porte qu’il juge sans danger, et c’est toi qui décides. Note le nombre d’attaques, puis rejoue\u00a0: les conseils s’améliorent-ils\u00a0?\n7. Dans **Apprendre & Tester** (*Learn & Test*), clique sur **Describe your model!** (décris ton modèle). Quel capteur se trouve en haut de l’arbre\u00a0? Teste une chambre inventée, puis fais une capture d’écran de l’arbre ou du résultat de ta fuite.',
                bringBack:
                  'Pour le projet ci-dessous\u00a0: ta capture d’écran (de l’arbre ou du résultat de ta fuite), les capteurs que tu as choisis, une règle que le modèle semble avoir apprise, un mauvais choix qu’il a fait (ou, s’il ne s’est jamais trompé, sa prédiction pour une chambre inventée qui ne ressemble à aucun de tes exemples) en expliquant pourquoi, d’après toi, et une amélioration que tu ferais.',
                hint: 'De mauvais conseils\u00a0? Joue plus de parties en mode Train\u00a0: le site demande au moins cinq exemples de chaque étiquette, et davantage, c’est mieux. Toujours mauvais\u00a0? Tes capteurs sont peut-être de mauvais indices\u00a0: compare avec un binôme qui en a choisi d’autres. Peu de temps\u00a0? Avec l’accord de ton enseignant, prends trois capteurs au lieu de cinq\u00a0: c’est plus rapide à construire, mais le robot a moins d’indices. Pas de site\u00a0? Fais la version sur papier ci-dessous.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-zombieescape.pdf',
              projectType: 'numbers',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm5-l2-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Zombie doors on paper',
                body: "Site blocked? Try the same idea with cards and a partner.\n\n1. **The hotel.** Player A secretly writes a zombie rule that uses one or two readings, such as *zombie when the smell is above 6*, and hides it.\n2. **The rooms.** A makes 12 room cards, each with five made-up readings: smell (0 to 10), number of plants, number of paintings, dust (0 to 10) and room number, and writes *safe* or *zombie* on the back, following the secret rule. A chooses the readings so that about half of the rooms are zombie rooms, shuffles the cards and deals 8 for training and 4 for testing, checking that both piles have safe and zombie rooms.\n3. **Training.** Player B, the robot's trainer, studies 8 cards with their labels showing and draws a decision tree that sorts them, most useful question first.\n4. **Testing.** A shows the 4 other cards one at a time, label hidden. B follows the tree to predict *safe* or *zombie*. Count the right answers.\n5. **Bad examples.** Play again, but this time B trains on only 3 cards, or only on safe rooms. How many mistakes now?\n6. Swap roles.\n\nFor the project, photograph your paper tree (only the paper: no faces, names or school details) and type the rule it learned, your test results, one wrong prediction and why the tree got it wrong, and the improvement asked for in point 5 of the project.",
              },
              fr: {
                heading: 'Pas de site\u00a0? Les portes des zombies sur papier',
                body: 'Le site est bloqué\u00a0? Reprends la même idée avec des cartes et un ou une partenaire.\n\n1. **L’hôtel.** Le joueur A écrit en secret une règle des zombies qui utilise une ou deux mesures, par exemple *zombie quand l’odeur dépasse 6*, et la cache.\n2. **Les chambres.** A fabrique 12 cartes de chambre, chacune avec cinq mesures inventées\u00a0: odeur (de 0 à 10), nombre de plantes, nombre de tableaux, poussière (de 0 à 10) et numéro de chambre, et écrit *sans danger* ou *zombie* au dos, en suivant la règle secrète. A choisit les mesures pour qu’environ la moitié des chambres soient des chambres à zombies, mélange les cartes et en distribue 8 pour l’entraînement et 4 pour le test, en vérifiant que chaque paquet contient des chambres sans danger et des chambres à zombies.\n3. **L’entraînement.** Le joueur B, qui entraîne le robot, étudie 8 cartes, étiquette visible, et dessine un arbre de décision qui les range, en commençant par la question la plus utile.\n4. **Le test.** A montre les 4 autres cartes une par une, étiquette cachée. B suit son arbre pour prédire *sans danger* ou *zombie*. Comptez les bonnes réponses.\n5. **De mauvais exemples.** Rejouez, mais cette fois B s’entraîne avec 3 cartes seulement, ou seulement avec des chambres sans danger. Combien d’erreurs maintenant\u00a0?\n6. Échangez les rôles.\n\nPour le projet, photographie ton arbre sur papier (seulement la feuille\u00a0: aucun visage, aucun nom ni aucun détail sur ton école) et tape au clavier la règle qu’il a apprise, tes résultats de test, une prédiction fausse en expliquant pourquoi l’arbre s’est trompé, et l’amélioration demandée au point 5 du projet.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b5',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in what your robot learned: a screenshot, your sensors, one rule the model seems to have learned, one bad choice it made and one improvement. The list under What to hand in says exactly what your teacher will look at. Hand it in during this lesson, while your project is still open.',
              },
              fr: {
                intro:
                  'Rends ce que ton robot a appris\u00a0: une capture d’écran, tes capteurs, une règle que le modèle semble avoir apprise, un mauvais choix qu’il a fait et une amélioration. La liste «\u00a0Ce qu’il faut rendre\u00a0» indique exactement ce que ton enseignant va regarder. Rends-le pendant cette leçon, tant que ton projet est encore ouvert.',
              },
            },
            data: { projectId: 'project-m5' },
          },
          {
            id: 'm5-l2-b6',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: { intro: 'Check what you know about decision trees and learning from examples.' },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur les arbres de décision et l’apprentissage à partir d’exemples.',
              },
            },
            data: { quizId: 'quiz-m5' },
          },
          {
            id: 'm5-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think about the bad choice your model made (if it never went wrong, use the made-up room from your project). What do you think caused it: too few examples, poor sensors, a room unlike its examples, or bad luck? Would you let a robot trained like this decide alone, with no person checking its advice? Explain why.',
              },
              fr: {
                prompt:
                  'Repense au mauvais choix de ton modèle (s’il ne s’est jamais trompé, prends la chambre inventée de ton projet). D’après toi, qu’est-ce qui l’a causé\u00a0: trop peu d’exemples, de mauvais capteurs, une chambre qui ne ressemble pas à ses exemples ou la malchance\u00a0? Laisserais-tu un robot entraîné de cette façon décider seul, sans personne pour vérifier ses conseils\u00a0? Explique pourquoi.',
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
      id: 'quiz-m5',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: robots that learn to choose',
            instructions:
              'Seven questions about decision trees and learning from examples. You need 70% to pass.',
          },
          fr: {
            title: 'Quiz\u00a0: des robots qui apprennent à choisir',
            instructions:
              'Sept questions sur les arbres de décision et l’apprentissage à partir d’exemples. Il faut 70\u00a0% pour réussir.',
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
                  'The robot vacuum\'s tree first asks "Is the battery below 20%?" (yes: charge), then "Is something closer than 15 cm?" (yes: turn, no: forward). The readings are 10 cm and 15% battery. What does the robot do?',
              },
              fr: {
                prompt:
                  'L’arbre du robot aspirateur demande d’abord «\u00a0La batterie est-elle sous 20\u00a0%\u00a0?\u00a0» (oui\u00a0: recharger), puis «\u00a0Y a-t-il un obstacle à moins de 15\u00a0cm\u00a0?\u00a0» (oui\u00a0: tourner, non\u00a0: avancer). Les mesures sont 10\u00a0cm et 15\u00a0% de batterie. Que fait le robot\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'It goes to charge' },
                  fr: { text: 'Il va se recharger' },
                },
              },
              {
                id: 'b',
                translations: { en: { text: 'It turns' }, fr: { text: 'Il tourne' } },
              },
              {
                id: 'c',
                translations: { en: { text: 'It drives forward' }, fr: { text: 'Il avance' } },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The top question is asked first: 15% is below 20%, so the robot goes to charge, and the distance question is never asked. In a tree, the order of the questions matters.',
              },
              fr: {
                text: 'La question du haut est posée en premier\u00a0: 15\u00a0% est sous 20\u00a0%, donc le robot va se recharger, et la question de la distance n’est jamais posée. Dans un arbre, l’ordre des questions compte.',
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
                  'A rover\'s log records three readings (distance ahead, light level and the colour of the rover\'s flag) and the right action for each moment. "Is the distance below 20 cm?" puts every turn moment on one side and every forward moment on the other. "Is the flag red?" leaves both groups mixed. Which question should a computer put at the top of the tree?',
              },
              fr: {
                prompt:
                  'Le journal d’un rover note trois mesures (la distance devant lui, la luminosité et la couleur de son drapeau) et la bonne action pour chaque moment. «\u00a0La distance est-elle sous 20\u00a0cm\u00a0?\u00a0» met tous les moments «\u00a0tourner\u00a0» d’un côté et tous les moments «\u00a0avancer\u00a0» de l’autre. «\u00a0Le drapeau est-il rouge\u00a0?\u00a0» laisse les deux groupes mélangés. Quelle question un ordinateur doit-il placer en haut de l’arbre\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The distance question, because it sorts the moments best' },
                  fr: {
                    text: 'La question de la distance, parce qu’elle range le mieux les moments',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The flag question, because a colour is easy to measure' },
                  fr: {
                    text: 'La question du drapeau, parce qu’une couleur est facile à mesurer',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It makes no difference which question comes first' },
                  fr: { text: 'L’ordre des questions ne change rien' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A computer that grows a tree tries every question and keeps the one that leaves the groups most sorted. The distance question sorts everything at once; the flag says nothing about the right action, so the tree can leave it out.',
              },
              fr: {
                text: 'Un ordinateur qui fait pousser un arbre essaie toutes les questions et garde celle qui laisse les groupes les mieux rangés. La question de la distance range tout d’un coup\u00a0; le drapeau ne dit rien de la bonne action, donc l’arbre peut le laisser de côté.',
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
                  'If one of your sensors makes no difference to the right action, a decision tree can learn to leave it out.',
              },
              fr: {
                prompt:
                  'Si l’un de tes capteurs ne change rien à la bonne action, un arbre de décision peut apprendre à s’en passer.',
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
                text: 'True. Like the floor sensor of the robot vacuum, a sensor that never helps to sort the examples is simply not used. But a tree cannot learn from a clue you never gave it, so choosing good sensors still matters.',
              },
              fr: {
                text: 'Vrai. Comme le capteur de sol du robot aspirateur, un capteur qui n’aide jamais à ranger les exemples n’est tout simplement pas utilisé. Mais un arbre ne peut pas apprendre d’un indice que tu ne lui as jamais donné\u00a0: bien choisir ses capteurs reste donc important.',
              },
            },
          },
          {
            id: 'q4',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'A tree grows an extra branch just to get one strange example right, such as the day a cat ran past the robot, and then makes worse choices in new situations. What is this called? (one word)',
              },
              fr: {
                prompt:
                  'L’ordinateur fait pousser une branche de plus à l’arbre rien que pour ne pas se tromper sur un exemple bizarre, comme le jour où un chat est passé devant le robot, et l’arbre fait ensuite de moins bons choix dans les situations nouvelles. Comment cela s’appelle-t-il\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'overfitting',
                'over-fitting',
                'over fitting',
                'overfit',
                'over-fit',
                'overfitted',
                'overfits',
                'overfiting',
                'overtraining',
                'over-training',
              ],
              fr: [
                'surapprentissage',
                'sur-apprentissage',
                'sur apprentissage',
                'le surapprentissage',
                'du surapprentissage',
                'surajustement',
                'sur-ajustement',
                'surentraînement',
                'sur-entraînement',
                'overfitting',
              ],
            },
            explanation: {
              en: {
                text: 'Overfitting: the tree learned an accident by heart instead of a general rule. Smaller trees, more varied examples and tests with new examples help to avoid it.',
              },
              fr: {
                text: 'Le surapprentissage (overfitting en anglais)\u00a0: l’arbre a appris un accident par cœur au lieu d’une règle générale. Des arbres plus petits, des exemples plus variés et des tests avec de nouveaux exemples aident à l’éviter.',
              },
            },
          },
          {
            id: 'q5',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'In Zombie Escape!, your model keeps highlighting doors that hide zombies. Which of these could be the cause? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Dans Fuir les zombies\u00a0!, ton modèle met sans cesse en valeur des portes qui cachent des zombies. Qu’est-ce qui peut en être la cause\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'You collected only a few training examples' },
                  fr: { text: 'Tu n’as rassemblé que quelques exemples d’entraînement' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The sensors you chose measure things that make no difference to zombies',
                  },
                  fr: {
                    text: 'Les capteurs que tu as choisis mesurent des choses qui ne changent rien pour les zombies',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Your training rooms were all of one kind, unlike the rooms you met while escaping',
                  },
                  fr: {
                    text: 'Tes chambres d’entraînement étaient toutes du même genre, contrairement à celles que tu as rencontrées en t’échappant',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Your Scratch robot is the wrong colour' },
                  fr: { text: 'Ton robot Scratch n’a pas la bonne couleur' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'You played the game in full screen' },
                  fr: { text: 'Tu as joué en plein écran' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Bad examples make bad choices: too few of them, useless features or one-sided examples all lead to poor predictions. How the game looks on screen changes nothing in the model.',
              },
              fr: {
                text: 'De mauvais exemples donnent de mauvais choix\u00a0: trop peu d’exemples, des caractéristiques inutiles ou des chambres toutes du même genre mènent à de mauvaises prédictions. L’apparence du jeu à l’écran ne change rien au modèle.',
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
                  'During your escape, the model highlights any door it predicts is safe. Which sentence is right?',
              },
              fr: {
                prompt:
                  'Pendant ta fuite, le modèle met en valeur chaque porte qu’il juge sans danger. Quelle phrase est juste\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'The model gives advice and you make the final choice, because its prediction can be wrong',
                  },
                  fr: {
                    text: 'Le modèle donne un conseil et c’est toi qui fais le choix final, car sa prédiction peut être fausse',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Once it has been trained, the model is always right' },
                  fr: { text: 'Une fois entraîné, le modèle a toujours raison' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'You should always follow it, because a computer cannot be unfair' },
                  fr: {
                    text: 'Tu dois toujours le suivre, parce qu’un ordinateur ne peut pas être injuste',
                  },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A prediction learned from examples is a well-informed guess, and it is only as good and as fair as its examples. In serious places, models like this should only advise: a person decides and stays responsible.',
              },
              fr: {
                text: 'Une prédiction apprise à partir d’exemples est une estimation éclairée, qui ne vaut que ce que valent ses exemples, y compris en matière d’équité. Dans des domaines sérieux, ces modèles ne devraient que conseiller\u00a0: une personne décide et reste responsable.',
              },
            },
          },
          {
            id: 'q7',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'A delivery robot chooses its route with a decision tree learned from examples. Where should the rule "stop at once if the bumper is pressed" go?',
              },
              fr: {
                prompt:
                  'Un robot livreur choisit son chemin grâce à un arbre de décision appris à partir d’exemples. Où faut-il placer la règle «\u00a0arrête-toi immédiatement si le pare-chocs est enfoncé\u00a0»\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Outside the tree: written by people and checked before the tree, whatever the tree says',
                  },
                  fr: {
                    text: 'En dehors de l’arbre\u00a0: écrite par des personnes et vérifiée avant l’arbre, quoi que dise l’arbre',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Nowhere: with enough examples, the tree will learn to stop by itself',
                  },
                  fr: {
                    text: 'Nulle part\u00a0: avec assez d’exemples, l’arbre apprendra à s’arrêter tout seul',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'At the bottom of the tree, after every other question' },
                  fr: { text: 'En bas de l’arbre, après toutes les autres questions' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A learned tree is still a guess, and as in module 2, a safety rule must never depend only on a guess. It is written by people, uses a simple, reliable sensor and always wins over the tree.',
              },
              fr: {
                text: 'Un arbre appris reste une estimation, et comme dans le module 2, une règle de sécurité ne doit jamais dépendre seulement d’une estimation. Elle est écrite par des personnes, s’appuie sur un capteur simple et fiable et l’emporte toujours sur l’arbre.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m5',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Zombie Escape: what did my robot learn?',
            brief:
              'Train a robot on Machine Learning for Kids (the Zombie Escape! activity) to predict which hotel rooms are safe, from the readings of sensors you choose. Collect examples by playing, let the model advise you during your escape, then look at the decision tree it grew. Show what it learned, where it went wrong and why.',
            requirements:
              'Hand in:\n\n1. A screenshot of the tree on the Describe your model! page, or of your escape result with the number of attacks. Only the site or the game should be in it.\n2. Your sensors: the sensors you chose, and the one you now think helped most.\n3. One rule the model seems to have learned, written like a branch of a decision tree (for example: "if [sensor] is below [number], it predicts zombie"), and how you know: from the tree, or from testing made-up rooms.\n4. One bad choice the model made (a door it highlighted that hid a zombie, or a safe door it did not highlight) and one or two sentences on why you think it happened: too few examples, a sensor that is a poor clue, a room unlike its examples, or bad luck. If the model made no bad choice in your last escape, use one from an earlier escape, or test it on a made-up room unlike any of your examples (with readings far higher or lower than any you collected): say what it predicted and why that prediction may be wrong.\n5. One improvement: what you would change (other sensors, more examples, more varied rooms), and whether you would let the robot decide alone, without you.\n\nSend the screenshot as an image and type the rest in the About your work box. Paper version: send a photo of your paper tree instead of the screenshot (only the paper should be in it: no faces, names or school details), and type the rule it learned, your test results, one wrong prediction and why the tree got it wrong, and point 5.\n\nYour teacher looks at: a rule that matches your screenshot or your tests (technical quality); a clear explanation of the bad choice, using examples, sensors or overfitting (understanding); your improvement idea (creativity); and a sensible view of who makes the final decision, with no personal details (responsible use of AI).',
          },
          fr: {
            title: 'Fuir les zombies\u00a0: qu’a appris mon robot\u00a0?',
            brief:
              'Entraîne un robot sur Machine Learning for Kids (activité Fuir les zombies\u00a0!) à prédire quelles chambres d’hôtel sont sans danger, à partir des mesures des capteurs que tu choisis. Rassemble des exemples en jouant, laisse le modèle te conseiller pendant ta fuite, puis regarde l’arbre de décision qu’il a fait pousser. Montre ce qu’il a appris, où il s’est trompé et pourquoi.',
            requirements:
              'Rends\u00a0:\n\n1. Une capture d’écran de l’arbre sur la page Describe your model!, ou du résultat de ta fuite avec le nombre d’attaques. On ne doit y voir que le site ou le jeu.\n2. Tes capteurs\u00a0: les capteurs que tu as choisis, et celui qui, avec le recul, a le plus aidé ton robot.\n3. Une règle que le modèle semble avoir apprise, écrite comme une branche d’un arbre de décision (par exemple\u00a0: «\u00a0si [capteur] est sous [nombre], il prédit zombie\u00a0»), et comment tu le sais\u00a0: grâce à l’arbre, ou en testant des chambres inventées.\n4. Un mauvais choix du modèle (une porte qu’il a mise en valeur et qui cachait un zombie, ou une porte sans danger qu’il n’a pas mise en valeur) et une ou deux phrases pour expliquer, d’après toi, pourquoi il a fait ce choix\u00a0: trop peu d’exemples, un capteur qui est un mauvais indice, une chambre qui ne ressemble pas à ses exemples, ou la malchance. Si le modèle ne s’est pas trompé pendant ta dernière fuite, prends un mauvais choix d’une fuite précédente, ou teste-le sur une chambre inventée qui ne ressemble à aucun de tes exemples (avec des mesures bien plus hautes ou plus basses que toutes celles que tu as rassemblées)\u00a0: dis ce qu’il a prédit et pourquoi cette prédiction peut être fausse.\n5. Une amélioration\u00a0: ce que tu changerais (d’autres capteurs, plus d’exemples, des chambres plus variées), et si tu laisserais le robot décider seul, sans toi.\n\nEnvoie la capture d’écran comme image et tape le reste dans la zone «\u00a0À propos de votre travail\u00a0». Version sur papier\u00a0: envoie une photo de ton arbre sur papier à la place de la capture d’écran (on ne doit y voir que la feuille\u00a0: aucun visage, aucun nom ni aucun détail sur ton école), et tape la règle qu’il a apprise, tes résultats de test, une prédiction fausse en expliquant pourquoi l’arbre s’est trompé, et le point 5.\n\nTon enseignant regarde\u00a0: une règle qui correspond à ta capture d’écran ou à tes tests (qualité technique)\u00a0; une explication claire du mauvais choix, avec les exemples, les capteurs ou le surapprentissage (compréhension)\u00a0; ton idée d’amélioration (créativité)\u00a0; et un avis réfléchi sur qui prend la décision finale, sans aucune donnée personnelle (usage responsable de l’IA).',
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
