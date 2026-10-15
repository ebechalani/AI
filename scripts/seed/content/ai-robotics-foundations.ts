// "AI Robotics Foundations": the AI Robotics demo course (ages 10-14) of brief section 22, the
// first course of the ai-robotics pathway. Three modules: how robots work (the sense, decide, act
// loop; sensors and actuators), robots that see and decide (computer vision with rules and
// learned models, lighting and training data; if/then rules, learned behaviour and state
// machines), and building an autonomous robot (plan and program a line follower or an obstacle
// avoider on a simulator if the teacher provides one, a kit or a paper dry run; safety, test log,
// improvements; the project). Blocks cover every lesson stage; one quiz per module; one project;
// English and French; no uploaded files. Coding activities (blocks or simple Python, with
// bilingual comments that explain each new Python word) are saved, not run, and the robot.*
// commands are generic examples, not one brand's API. The four videos are in English:
// Crash Course Engineering #33, a TED-Ed lesson by Sajan Saini, and two videos of Code.org's How
// AI Works series; the watch stage of m3-l1 is an unplugged "watch and observe" activity.

import type { SeedCourse } from '../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const aiRoboticsFoundations: SeedCourse = {
  id: 'ai-robotics-foundations',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Robotics Foundations',
        summary:
          'Find out how robots sense, see and decide, then plan, program and test your own line-following or obstacle-avoiding robot.',
        description:
          'Robots are machines that sense the world, decide what to do and act on it, again and again. In six lessons you will take that loop apart: the sensors and motors a robot uses, how a camera and an AI model let it recognise lines and objects (and why lighting and training data change everything), and how it chooses what to do with fixed rules, learned behaviour and states. Then you will become a robotics engineer: plan, program and test a line-following or obstacle-avoiding robot on a robot simulator (if your teacher gives you one), on a classroom kit or as a paper dry run, keep a test log, and improve your robot with evidence. Coding activities use blocks or simple Python and are saved in the lesson, not run, so you trace them by hand; you can run them later on a simulator or on a kit your teacher approves. You will also learn to work safely around real robots and to use AI help responsibly. The course ends with a robot project and a certificate.',
        outcomes: [
          'Describe a robot as a sense, decide, act loop and spot that loop in real machines',
          "Choose sensors (touch, distance, light, camera) and actuators (motors, servos) for a robot's job",
          'Explain how a robot recognises lines and objects with a camera, and why lighting and training data change the result',
          'Compare fixed if/then rules with learned behaviour, and design a simple state machine',
          'Plan, program and test a line-following or obstacle-avoiding robot, and improve it using a test log',
          'Work safely around real robots and use AI help responsibly',
        ],
      },
      fr: {
        title: 'Les bases de la robotique IA',
        summary:
          'Découvre comment les robots perçoivent, voient et décident, puis conçois, programme et teste ton propre robot suiveur de ligne ou éviteur d’obstacles.',
        description:
          'Un robot est une machine qui perçoit le monde, décide quoi faire et agit, encore et encore. En six leçons, tu vas démonter cette boucle\u00a0: les capteurs et les moteurs qu’utilise un robot, la façon dont une caméra et un modèle d’IA lui permettent de reconnaître des lignes et des objets (et pourquoi l’éclairage et les données d’entraînement changent tout), et la manière dont il choisit quoi faire grâce à des règles fixes, à un comportement appris et à des états. Ensuite, tu deviendras ingénieur ou ingénieure en robotique\u00a0: tu concevras, programmeras et testeras un robot suiveur de ligne ou éviteur d’obstacles sur un simulateur de robot (si ton enseignant t’en propose un), sur un kit de ta classe ou lors d’un essai à blanc sur papier, tu tiendras un journal de tests et tu amélioreras ton robot à partir de preuves. Les activités de programmation utilisent des blocs ou du Python simple\u00a0; elles sont enregistrées dans la leçon, pas exécutées\u00a0: tu les déroules donc à la main, et tu pourras les exécuter plus tard sur un simulateur ou sur un kit approuvé par ton enseignant. Tu apprendras aussi à travailler en sécurité près de vrais robots et à utiliser l’aide de l’IA de façon responsable. Le cours se termine par un projet de robot et un certificat.',
        outcomes: [
          'Décrire un robot comme une boucle percevoir, décider, agir, et repérer cette boucle dans de vraies machines',
          'Choisir des capteurs (contact, distance, lumière, caméra) et des actionneurs (moteurs, servomoteurs) adaptés à la tâche d’un robot',
          'Expliquer comment un robot reconnaît des lignes et des objets avec une caméra, et pourquoi l’éclairage et les données d’entraînement changent le résultat',
          'Comparer des règles fixes «\u00a0si… alors\u00a0» avec un comportement appris, et concevoir une machine à états simple',
          'Concevoir, programmer et tester un robot suiveur de ligne ou éviteur d’obstacles, puis l’améliorer grâce à un journal de tests',
          'Travailler en sécurité près de vrais robots et utiliser l’aide de l’IA de façon responsable',
        ],
      },
    },
    audience: 'student',
    area: 'robotics',
    tags: [
      'robotics',
      'sensors',
      'vision',
      'autonomous',
      'line-following',
      'state-machines',
      'python',
      'responsible-ai',
    ],
    ageMin: 10,
    ageMax: 14,
    estimatedMinutes: 270,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: ['simulator', 'generic-camera-rover'],
    requiredCapabilities: ['drive', 'distance', 'line'],
    isOfficial: true,
    pathwayId: 'ai-robotics',
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
            title: 'How robots work',
            description:
              'What makes a machine a robot, the sense, decide, act loop, and the sensors and actuators that connect a robot to the world.',
          },
          fr: {
            title: 'Comment fonctionne un robot',
            description:
              'Ce qui fait d’une machine un robot, la boucle percevoir, décider, agir, et les capteurs et actionneurs qui relient un robot au monde.',
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
                title: 'What is a robot?',
                summary:
                  'Robot or not? Discover the sense, decide, act loop that every robot repeats many times a second.',
              },
              fr: {
                title: 'Qu’est-ce qu’un robot\u00a0?',
                summary:
                  'Robot ou pas\u00a0? Découvre la boucle percevoir, décider, agir que tout robot répète plusieurs fois par seconde.',
              },
            },
            estimatedMinutes: 30,
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
                  heading: 'Robot or not?',
                  body: 'Look at these five machines and decide: which ones are robots?\n\n1. A **toaster** that pops up after two minutes.\n2. A **remote-control car** driven by a friend.\n3. A **robot vacuum** that bumps into a chair, turns and carries on cleaning.\n4. An **automatic door** that opens when someone walks up to it.\n5. A **Mars rover** that drives around rocks while its team is millions of kilometres away.\n\nEngineers do not all agree on one definition, but most would say that the vacuum and the rover are robots, and that the toaster and the remote-control car are not. The toaster only runs a timer, and the car does nothing that a person has not decided. The vacuum and the rover **sense** what is around them, **decide** what to do with a program, and **act**, on their own, again and again. The automatic door is a borderline case: it senses and acts, but its decision is one very simple rule.\n\nIn this lesson you will find out what that loop is and why it matters.',
                },
                fr: {
                  heading: 'Robot ou pas\u00a0?',
                  body: 'Observe ces cinq machines et décide\u00a0: lesquelles sont des robots\u00a0?\n\n1. Un **grille-pain** qui éjecte les tartines au bout de deux minutes.\n2. Une **voiture télécommandée** pilotée par un ami.\n3. Un **robot aspirateur** qui heurte une chaise, tourne et continue à nettoyer.\n4. Une **porte automatique** qui s’ouvre quand quelqu’un s’en approche.\n5. Un **rover martien** qui contourne des rochers alors que son équipe se trouve à des millions de kilomètres.\n\nLes ingénieurs ne sont pas tous d’accord sur une définition unique, mais la plupart diraient que l’aspirateur et le rover sont des robots, et que le grille-pain et la voiture télécommandée n’en sont pas. Le grille-pain se contente de suivre une minuterie, et la voiture ne fait rien qu’une personne n’ait décidé. L’aspirateur et le rover **perçoivent** ce qui les entoure, **décident** quoi faire grâce à un programme, puis **agissent**, tout seuls, encore et encore. La porte automatique est un cas limite\u00a0: elle perçoit et elle agit, mais sa décision se résume à une règle très simple.\n\nDans cette leçon, tu vas découvrir cette boucle et comprendre pourquoi elle est si importante.',
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
                  heading: 'The sense, decide, act loop',
                  body: "Every robot repeats the same three steps, often dozens of times a second:\n\n- **Sense.** Sensors measure the world and turn it into numbers: a distance in centimetres, an amount of light, a button pressed or not, the pixels of a camera image.\n- **Decide.** The robot's computer, its **controller**, runs a program that turns those numbers into a choice: go forward, turn, stop, pick something up.\n- **Act.** Actuators carry out the choice: motors turn wheels, a servo moves an arm, a speaker beeps, a light flashes.\n\nThen the loop starts again, because acting changes the world and the robot has to sense the new situation. A robot vacuum senses a chair leg, decides to turn, turns, senses that the way is clear, and drives on.\n\n**Is that AI?** Not always. Many robots decide with simple rules written by a programmer, such as *if the bumper is pressed, reverse*. AI comes in when the input is too messy for simple rules, for example recognising a person in a camera image, or when the behaviour is **learned from examples** instead of written by hand. You will meet both in this course.\n\n**A word about thinking.** Engineers often call this loop *sense, think, act*. It is a handy name, but a robot does not think or feel: its decide step is a program doing calculations, even when it uses AI. People design the program, choose the data and stay responsible for what the robot does.\n\n**Why autonomy matters.** A radio message takes several minutes to travel between Earth and Mars, so a rover cannot wait for a person to steer every metre. It runs its own sense, decide, act loop to drive safely between the commands its team sends.",
                },
                fr: {
                  heading: 'La boucle percevoir, décider, agir',
                  body: 'Tout robot répète les trois mêmes étapes, souvent des dizaines de fois par seconde\u00a0:\n\n- **Percevoir.** Les capteurs mesurent le monde et le transforment en nombres\u00a0: une distance en centimètres, une quantité de lumière, un bouton enfoncé ou non, les pixels d’une image de caméra.\n- **Décider.** L’ordinateur du robot, son **contrôleur**, exécute un programme qui transforme ces nombres en choix\u00a0: avancer, tourner, s’arrêter, attraper un objet.\n- **Agir.** Les actionneurs réalisent ce choix\u00a0: des moteurs font tourner les roues, un servomoteur déplace un bras, un haut-parleur émet un bip, une lumière clignote.\n\nPuis la boucle recommence, car en agissant, le robot change le monde, et il doit percevoir la nouvelle situation. Un robot aspirateur repère un pied de chaise, décide de tourner, tourne, détecte que la voie est libre, puis repart.\n\n**Est-ce de l’IA\u00a0?** Pas toujours. Beaucoup de robots décident avec des règles simples écrites par un programmeur, comme *si le pare-chocs est enfoncé, recule*. L’IA intervient quand les données sont trop complexes pour des règles simples, par exemple pour reconnaître une personne sur une image de caméra, ou quand le comportement est **appris à partir d’exemples** au lieu d’être écrit à la main. Tu rencontreras les deux dans ce cours.\n\n**Et la pensée\u00a0?** Les ingénieurs anglophones appellent souvent cette boucle *sense, think, act* (percevoir, penser, agir). C’est un nom pratique, mais un robot ne pense pas et ne ressent rien\u00a0: son étape «\u00a0décider\u00a0» est un programme qui fait des calculs, même quand il utilise de l’IA. Ce sont des personnes qui conçoivent le programme, choisissent les données et restent responsables de ce que fait le robot.\n\n**Pourquoi l’autonomie compte.** Un message radio met plusieurs minutes à voyager entre la Terre et Mars\u00a0: un rover ne peut donc pas attendre qu’une personne le dirige à chaque mètre. Il fait tourner sa propre boucle percevoir, décider, agir pour rouler en sécurité entre deux ordres envoyés par son équipe.',
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
                  title: 'Watch: how robots sense, decide and act',
                  caption:
                    'Crash Course Engineering #33, How Engineering Robots Works (about 11 minutes): sensors, actuators and the computer that links them. It is fast: turn on subtitles or slow it down, and pause at each robot.',
                  transcript:
                    'In short: the episode explains that a robot combines three kinds of parts. Sensors let it read its surroundings and its own position. Actuators, such as motors, and effectors, such as grippers or tools, let it move and handle objects. A computer coordinates the two: it reads the sensors, runs the program and commands the actuators, then checks the sensors again to correct what it is doing. The examples include robots used in factories, in surgery and on farms. As you watch, spot the sense, decide and act parts of each robot.',
                },
                fr: {
                  title: 'Regarde\u00a0: comment les robots perçoivent, décident et agissent',
                  caption:
                    'Crash Course Engineering, épisode 33, How Engineering Robots Works (environ 11\u00a0minutes, vidéo en anglais)\u00a0: les capteurs, les actionneurs et l’ordinateur qui les relie. Le rythme est rapide\u00a0: active les sous-titres ou ralentis la vidéo, et fais une pause à chaque robot.',
                  transcript:
                    'En bref\u00a0: l’épisode explique qu’un robot associe trois sortes d’éléments. Les capteurs lui permettent de mesurer son environnement et sa propre position. Les actionneurs, comme les moteurs, et les effecteurs, comme les pinces ou les outils, lui permettent de bouger et de manipuler des objets. Un ordinateur coordonne le tout\u00a0: il lit les capteurs, exécute le programme et commande les actionneurs, puis vérifie de nouveau les capteurs pour corriger ce qu’il fait. Parmi les exemples\u00a0: des robots utilisés dans les usines, en chirurgie et dans les champs. Pendant la vidéo, repère pour chaque robot ce qui perçoit, ce qui décide et ce qui agit.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'uNfUAJBuZ0s',
                fileId: null,
                durationSeconds: null,
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
                    'Here is the program of a simple robot vacuum, in blocks. Your program is saved, not run, so be the robot yourself:\n\n1. At the end of each line, after //, write SENSE, DECIDE or ACT. The first one is done for you.\n2. The vacuum is 25 cm from a wall. What does it do? And at 8 cm? Write your answers in the comments at the bottom.\n3. Change the safe distance from 10 to a value you think is better, and explain why in a comment.',
                  hint: 'Lines that read a sensor are SENSE, lines with "if" or "else" are DECIDE, and lines that move, stop or beep are ACT.',
                },
                fr: {
                  instructions:
                    'Voici le programme d’un robot aspirateur simple, en blocs. Ton programme est enregistré, pas exécuté\u00a0: joue toi-même le rôle du robot.\n\n1. À la fin de chaque ligne, après //, écris SENSE (percevoir), DECIDE (décider) ou ACT (agir). La première est déjà faite.\n2. L’aspirateur est à 25\u00a0cm d’un mur. Que fait-il\u00a0? Et à 8\u00a0cm\u00a0? Écris tes réponses dans les commentaires, tout en bas.\n3. Remplace la distance de sécurité de 10 par une valeur qui te semble meilleure, et explique pourquoi dans un commentaire.',
                  hint: 'Les lignes qui lisent un capteur, c’est SENSE\u00a0; les lignes avec «\u00a0if\u00a0» (si) ou «\u00a0else\u00a0» (sinon), c’est DECIDE\u00a0; les lignes qui font bouger, arrêter ou biper le robot, c’est ACT.',
                },
              },
              data: {
                language: 'blocks',
                starterCode: lines(
                  'when green flag clicked',
                  'forever',
                  '  set [distance] to (distance sensor in cm)   // SENSE',
                  '  if <(distance) < [10]> then                 //',
                  '    stop motors                               //',
                  '    play sound [beep]                         //',
                  '    turn right for (0.5) seconds              //',
                  '  else                                        //',
                  '    drive forward                             //',
                  '  end',
                  'end',
                  '',
                  '// 25 cm:',
                  '// 8 cm:',
                  '// My safe distance / Ma distance de sécurité:',
                ),
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
                    'Ask the AI tutor to explain the sense, decide, act loop of a robot you find interesting, such as a robot lawn mower or a Mars rover. Check its answer: does it name real sensors and actuators? Never type your name, your school or where you live.',
                  starterPrompt:
                    'Explain the sense, decide, act loop of a robot lawn mower. Which sensors and actuators does it use, and what does it decide?',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de t’expliquer la boucle percevoir, décider, agir d’un robot qui t’intéresse, comme un robot tondeuse ou un rover martien. Vérifie sa réponse\u00a0: cite-t-il de vrais capteurs et de vrais actionneurs\u00a0? Ne tape jamais ton nom, le nom de ton école ou l’endroit où tu habites.',
                  starterPrompt:
                    'Explique-moi la boucle percevoir, décider, agir d’un robot tondeuse. Quels capteurs et quels actionneurs utilise-t-il, et que décide-t-il\u00a0?',
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
                    'Choose a machine you use at home or at school. Is it a robot? Explain your answer using the words sense, decide and act.',
                },
                fr: {
                  prompt:
                    'Choisis une machine que tu utilises à la maison ou à l’école. Est-ce un robot\u00a0? Justifie ta réponse avec les mots percevoir, décider et agir.',
                },
              },
              data: { minLength: 40 },
            },
          ],
        },
        {
          id: 'm1-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Sensors and actuators',
                summary:
                  'Meet the sensors that give a robot its numbers and the actuators that turn its decisions into movement.',
              },
              fr: {
                title: 'Capteurs et actionneurs',
                summary:
                  'Découvre les capteurs qui fournissent des nombres au robot et les actionneurs qui transforment ses décisions en mouvements.',
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
                  heading: 'A world made of numbers',
                  body: 'Imagine exploring a room with your eyes closed, your ears covered and only one clue: a voice that calls out a number every tenth of a second, telling you how far away the wall in front of you is. Could you cross the room without bumping into anything?\n\nThat is how a robot experiences the world. It does not see a room, a chair or a friend. It only gets **numbers from its sensors**, and everything it does depends on how good those numbers are. Choosing the right sensors is one of the first jobs of a robotics engineer.',
                },
                fr: {
                  heading: 'Un monde fait de nombres',
                  body: 'Imagine que tu explores une pièce les yeux fermés et les oreilles bouchées, avec un seul indice\u00a0: une voix qui annonce un nombre tous les dixièmes de seconde, pour te dire à quelle distance se trouve le mur devant toi. Pourrais-tu traverser la pièce sans rien heurter\u00a0?\n\nC’est ainsi qu’un robot perçoit le monde. Il ne voit ni une pièce, ni une chaise, ni un ami. Il reçoit seulement des **nombres venant de ses capteurs**, et tout ce qu’il fait dépend de la qualité de ces nombres. Choisir les bons capteurs est l’une des premières tâches d’un ingénieur en robotique.',
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
                  heading: 'Sensors in, actuators out',
                  body: "**Sensors** turn something in the world into a number:\n\n| Sensor | What it measures | How it works | Watch out for |\n|---|---|---|---|\n| Touch (bump) switch | Pressed or not | A button closes an electric circuit | It only reacts once the robot has already hit something |\n| Ultrasonic distance sensor | A distance (about 2 to 400 cm for a classroom sensor) | It sends a sound pulse too high for you to hear and times its echo, like a bat | Soft or slanted surfaces can swallow or deflect the echo |\n| Infrared or lidar distance sensor | A distance | It sends invisible light and measures what comes back | Bright sunlight and shiny or black surfaces can confuse it |\n| Light or line sensor | How much light the floor reflects | White reflects a lot of light, black very little | Shadows and changing room light |\n| Camera | An image: a grid of pixels | Each pixel is a few numbers that code its colour | Darkness, glare, and a huge amount of data to process |\n\n**Actuators** turn the robot's decisions into action: **DC motors** spin wheels faster or slower, **servo motors** turn to an exact angle (an arm, a gripper, a steering wheel), and **speakers**, **lights** and **screens** let the robot show what it is doing.\n\n**Sensors are never perfect.** Measure the distance to the same wall ten times and you may get 19, 20, 20, 21 and, once, 400, because an echo got lost. Good robot programs expect this **noise**: they keep a safety margin, treat a strange reading with suspicion and choose the safe action (slow down or stop) until the sensor makes sense again, and they often combine several sensors. Many self-driving cars, for example, combine cameras, radar and lidar, so that one sensor can make up for the weaknesses of another.",
                },
                fr: {
                  heading: 'Des capteurs pour l’entrée, des actionneurs pour la sortie',
                  body: 'Les **capteurs** transforment quelque chose du monde en nombre\u00a0:\n\n| Capteur | Ce qu’il mesure | Comment il fonctionne | Attention à… |\n|---|---|---|---|\n| Capteur de contact (pare-chocs) | Enfoncé ou non | Un bouton ferme un circuit électrique | Il ne réagit qu’une fois que le robot a déjà heurté quelque chose |\n| Capteur de distance à ultrasons | Une distance (environ 2 à 400\u00a0cm pour un capteur de classe) | Il envoie un son trop aigu pour que tu l’entendes et mesure le temps que met l’écho à revenir, comme une chauve-souris | Les surfaces molles ou inclinées peuvent absorber ou dévier l’écho |\n| Capteur de distance infrarouge ou lidar | Une distance | Il envoie une lumière invisible et mesure ce qui revient | Le plein soleil et les surfaces brillantes ou noires peuvent le tromper |\n| Capteur de lumière ou de ligne | La quantité de lumière renvoyée par le sol | Le blanc renvoie beaucoup de lumière, le noir très peu | Les ombres et les changements d’éclairage |\n| Caméra | Une image\u00a0: une grille de pixels | Chaque pixel correspond à quelques nombres qui codent sa couleur | L’obscurité, les reflets, et une énorme quantité de données à traiter |\n\nLes **actionneurs** transforment les décisions du robot en actions\u00a0: les **moteurs à courant continu** font tourner les roues plus ou moins vite, les **servomoteurs** tournent jusqu’à un angle précis (un bras, une pince, une direction), et les **haut-parleurs**, les **lumières** et les **écrans** permettent au robot de montrer ce qu’il fait.\n\n**Les capteurs ne sont jamais parfaits.** Mesure dix fois la distance d’un même mur et tu obtiendras peut-être 19, 20, 20, 21 et, une fois, 400, parce qu’un écho s’est perdu. Un bon programme de robot s’attend à ce **bruit**\u00a0: il garde une marge de sécurité, se méfie d’une mesure bizarre et choisit l’action sûre (ralentir ou s’arrêter) jusqu’à ce que le capteur redevienne cohérent, et il combine souvent plusieurs capteurs. Beaucoup de voitures autonomes, par exemple, combinent caméras, radars et lidars, pour qu’un capteur puisse compenser les faiblesses d’un autre.',
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
                  title: 'Watch: how do self-driving cars "see"?',
                  caption:
                    'A short TED-Ed lesson by Sajan Saini about lidar, the laser distance sensor that many self-driving cars use.',
                  transcript:
                    'In short: to drive safely, a self-driving car must find the obstacles around it and work out their size, shape and position in a fraction of a second, whatever the weather and the light. Radar sends out radio waves and times their echoes, but its wide beam cannot show fine detail. Lidar works like a very fast measuring tape made of light: it fires short pulses from a narrow, invisible infrared laser and measures how long each one takes to bounce back. Thousands of these measurements build a detailed 3D picture of the road. Early lidars were bulky spinning boxes on the roof, and engineers are working on versions as small as a chip. It is the same idea as a classroom distance sensor: send something out, time the echo, turn the time into a distance.',
                },
                fr: {
                  title:
                    'Regarde\u00a0: comment une voiture autonome peut-elle «\u00a0voir\u00a0»\u00a0?',
                  caption:
                    'Une courte leçon TED-Ed de Sajan Saini (vidéo en anglais) sur le lidar, le capteur de distance laser qu’utilisent de nombreuses voitures autonomes.',
                  transcript:
                    'En bref\u00a0: pour rouler en sécurité, une voiture autonome doit repérer les obstacles autour d’elle et déterminer leur taille, leur forme et leur position en une fraction de seconde, quels que soient le temps et l’éclairage. Le radar envoie des ondes radio et mesure le temps de retour de leurs échos, mais son faisceau large ne permet pas de voir les détails. Le lidar fonctionne comme un mètre ruban ultrarapide fait de lumière\u00a0: il envoie de courtes impulsions avec un laser infrarouge invisible et très étroit, et mesure le temps que met chacune à revenir. Des milliers de ces mesures construisent une image 3D détaillée de la route. Les premiers lidars étaient de gros boîtiers tournants posés sur le toit, et les ingénieurs travaillent à des versions de la taille d’une puce. C’est la même idée que le capteur de distance d’une classe\u00a0: envoyer quelque chose, chronométrer l’écho, transformer ce temps en distance.',
                },
              },
              data: {
                source: 'youtube',
                videoId: 'PRg5RNU_JLk',
                fileId: null,
                durationSeconds: null,
              },
            },
            {
              id: 'm1-l2-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Be the robot\'s controller. This program reads a list of distance measurements, one every tenth of a second, while the robot drives towards a wall. It is saved, not run, so trace it by hand. New to Python? Read each line as a sentence; the comments after # explain the new words.\n\n1. Write, in the comments at the bottom, what the program prints for each reading.\n2. Real sensors glitch: the reading 400 is a lost echo. Look at the readings just before and after it: how far away is the wall really? What does the robot do at that moment, and why is that dangerous?\n3. Change the program so that a reading above 300 counts as "not sure": the robot cannot trust its sensor, so the safe choice is to stop (or slow down) for that reading. Explain your change in a comment.\n4. The robot moves about 6 cm between two readings. Is a safe distance of 15 cm enough? Write the value you would choose, and why.',
                  hint: 'For step 3, add a new test at the top of the loop, before the others: "if distance > 300:" and, indented on the next line, print(distance, "unsure: STOP"). Then change the old "if" into "elif", which means "else if".',
                },
                fr: {
                  instructions:
                    'Joue le rôle du contrôleur du robot. Ce programme lit une liste de mesures de distance, une tous les dixièmes de seconde, pendant que le robot roule vers un mur. Il est enregistré, pas exécuté\u00a0: déroule-le à la main. Tu débutes en Python\u00a0? Lis chaque ligne comme une phrase\u00a0; les commentaires après # expliquent les mots nouveaux.\n\n1. Écris, dans les commentaires en bas, ce que le programme affiche pour chaque mesure.\n2. Les vrais capteurs ont des ratés\u00a0: la mesure 400 correspond à un écho perdu. Regarde les mesures juste avant et juste après\u00a0: à quelle distance se trouve vraiment le mur\u00a0? Que fait le robot à ce moment-là, et pourquoi est-ce dangereux\u00a0?\n3. Modifie le programme pour qu’une mesure supérieure à 300 soit considérée comme «\u00a0douteuse\u00a0»\u00a0: le robot ne peut pas se fier à son capteur, donc le choix le plus sûr est de s’arrêter (ou de ralentir) pour cette mesure. Explique ta modification dans un commentaire.\n4. Le robot avance d’environ 6\u00a0cm entre deux mesures. Une distance de sécurité de 15\u00a0cm suffit-elle\u00a0? Écris la valeur que tu choisirais, et pourquoi.',
                  hint: 'Pour l’étape 3, ajoute un nouveau test en haut de la boucle, avant les autres\u00a0: «\u00a0if distance > 300:\u00a0» puis, en retrait à la ligne suivante, «\u00a0print(distance, "unsure: STOP")\u00a0». Transforme ensuite l’ancien «\u00a0if\u00a0» en «\u00a0elif\u00a0», qui veut dire «\u00a0sinon si\u00a0».',
                },
              },
              data: {
                language: 'python',
                starterCode: lines(
                  '# Saved, not run: trace it by hand. / Enregistré, pas exécuté\u00a0: déroule-le à la main.',
                  '# Distance readings in cm, one every 0.1 s. / Mesures de distance en cm, une toutes les 0,1 s.',
                  'readings = [60, 54, 48, 42, 36, 30, 24, 18, 400, 6]',
                  '',
                  'SAFE_DISTANCE = 15  # cm',
                  '',
                  '# The loop takes each reading in turn and calls it distance.',
                  '# / La boucle prend chaque mesure tour à tour et l’appelle distance.',
                  'for distance in readings:',
                  '    if distance < SAFE_DISTANCE:',
                  '        # print shows a line on the screen. / print affiche une ligne à l’écran.',
                  '        print(distance, "STOP")',
                  '    else:',
                  '        print(distance, "forward")',
                  '',
                  '# My trace / Ma trace:',
                  '# 60 forward',
                ),
              },
            },
            {
              id: 'm1-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to set you a robot mission and to challenge you to choose its sensors and actuators. Explain your choices, then compare them with the table in this lesson. If the tutor mentions a sensor you have not met, ask it what that sensor measures.',
                  starterPrompt:
                    'Give me a mission for a small classroom robot, and challenge me to choose the sensors and actuators it needs. Do not give me the answer straight away.',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de te proposer une mission de robot et de te mettre au défi d’en choisir les capteurs et les actionneurs. Justifie tes choix, puis compare-les au tableau de cette leçon. Si le tuteur cite un capteur que tu ne connais pas, demande-lui ce qu’il mesure.',
                  starterPrompt:
                    'Propose-moi une mission pour un petit robot de classe, et mets-moi au défi de choisir les capteurs et les actionneurs dont il a besoin. Ne me donne pas la réponse tout de suite.',
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
                en: { intro: 'Check what you know about robots, sensors and actuators.' },
                fr: {
                  intro: 'Vérifie ce que tu sais sur les robots, les capteurs et les actionneurs.',
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
                    'Pick one sensor from the table. Describe a situation where it could give a wrong reading, and one way the robot could cope with it.',
                },
                fr: {
                  prompt:
                    'Choisis un capteur du tableau. Décris une situation où il pourrait donner une mesure fausse, et une façon dont le robot pourrait y faire face.',
                },
              },
              data: { minLength: 50 },
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
            title: 'Robots that see and decide',
            description:
              'How a robot turns camera images into useful information with AI, and how it chooses what to do with rules, states and learned behaviour.',
          },
          fr: {
            title: 'Des robots qui voient et qui décident',
            description:
              'Comment un robot transforme les images de sa caméra en informations utiles grâce à l’IA, et comment il choisit quoi faire avec des règles, des états et un comportement appris.',
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
                title: 'Seeing with AI',
                summary:
                  'How a robot finds a line or recognises an object in a camera image, and why lighting and training data matter so much.',
              },
              fr: {
                title: 'Voir grâce à l’IA',
                summary:
                  'Comment un robot repère une ligne ou reconnaît un objet sur une image de caméra, et pourquoi l’éclairage et les données d’entraînement comptent autant.',
              },
            },
            estimatedMinutes: 35,
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
                  heading: 'What does a camera give a robot?',
                  body: "When you look at a photo of a cat, you simply *see* a cat. A robot's camera gives its computer something very different: a grid of tiny squares called **pixels** and, for each pixel, three numbers from 0 to 255 that say how much red, green and blue it contains.\n\nA small camera image of 320\u00a0×\u00a0240 pixels already has 76,800 pixels, so about 230,000 numbers, and the camera sends a new image many times a second. Nowhere in those numbers is the word *cat*, *line* or *person*. Turning a flood of numbers into useful information is called **computer vision**, and it is one of the places where AI helps robots most.",
                },
                fr: {
                  heading: 'Que donne une caméra à un robot\u00a0?',
                  body: 'Quand tu regardes la photo d’un chat, tu *vois* tout simplement un chat. La caméra d’un robot donne à son ordinateur quelque chose de très différent\u00a0: une grille de minuscules carrés appelés **pixels** et, pour chaque pixel, trois nombres de 0 à 255 qui indiquent sa quantité de rouge, de vert et de bleu.\n\nUne petite image de 320\u00a0×\u00a0240 pixels compte déjà 76\u00a0800 pixels, soit environ 230\u00a0000 nombres, et la caméra envoie une nouvelle image plusieurs fois par seconde. Nulle part dans ces nombres on ne trouve le mot *chat*, *ligne* ou *personne*. Transformer ce flot de nombres en informations utiles, c’est ce qu’on appelle la **vision par ordinateur**, et c’est l’un des domaines où l’IA aide le plus les robots.',
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
                  heading: 'Two ways to see: rules and learned models',
                  body: '**1. Hand-written rules.** For a simple, controlled job, a programmer can write the rule directly. To follow a black line on a white floor, the robot looks at one row of pixels near the bottom of the image and marks every pixel darker than a **threshold** as *line*. If the dark pixels are left of centre, it steers left; if they are right of centre, it steers right. It is fast, easy to test and easy to explain.\n\n**2. Learned models.** Writing rules for *every possible bottle* or *every possible person* is impossible. Instead, engineers **train** a model with thousands of labelled example images: *this is a bottle, this is a can, this is neither*. The model learns patterns in layers, from edges and colours to shapes and then whole objects. When it gets a new image, it gives a **label and a confidence score**, for example *can, 87%*. That is a well-informed guess, not understanding: the model does not know what a can is.\n\n**Why lighting matters.** A threshold that works under classroom lights can fail near a sunny window: a shadow becomes darker than the threshold and looks like the line, and glare makes black tape look grey. Even a learned model receives different numbers when the light changes.\n\n**Why training data matters.** A model only knows what it was shown. Train it only on photos of a bright, tidy lab and it may fail in a dim, cluttered corridor; show it only red balls and it may miss the blue ones. Good teams collect **varied** examples (different lights, angles, backgrounds and objects) and always **test in the real place** where the robot will work. When the missing examples are about people, it becomes **bias**: a person detector trained mostly on adults walking may miss children or wheelchair users, and for a robot that is a safety problem, not just a mistake.\n\n**Cameras and privacy.** A robot camera can capture people. Point it at the track or the objects, not at your classmates, and never save or share images of people without their permission.',
                },
                fr: {
                  heading: 'Deux façons de voir\u00a0: des règles ou des modèles appris',
                  body: '**1. Des règles écrites à la main.** Pour une tâche simple et bien maîtrisée, un programmeur peut écrire la règle directement. Pour suivre une ligne noire sur un sol blanc, le robot regarde une rangée de pixels en bas de l’image et marque comme *ligne* chaque pixel plus sombre qu’un **seuil**. Si les pixels sombres sont à gauche du centre, il tourne à gauche\u00a0; s’ils sont à droite, il tourne à droite. C’est rapide, facile à tester et facile à expliquer.\n\n**2. Des modèles appris.** Écrire des règles pour *toutes les bouteilles possibles* ou *toutes les personnes possibles* est impossible. Les ingénieurs **entraînent** donc un modèle avec des milliers d’images d’exemple étiquetées\u00a0: *ceci est une bouteille, ceci est une canette, ceci n’est ni l’une ni l’autre*. Le modèle apprend des régularités par couches successives\u00a0: d’abord des bords et des couleurs, puis des formes, puis des objets entiers. Face à une nouvelle image, il donne une **étiquette et un score de confiance**, par exemple *canette, 87\u00a0%*. C’est une estimation bien informée, pas une compréhension\u00a0: le modèle ne sait pas ce qu’est une canette.\n\n**Pourquoi l’éclairage compte.** Un seuil qui fonctionne sous les lampes de la classe peut échouer près d’une fenêtre ensoleillée\u00a0: une ombre devient plus sombre que le seuil et ressemble à la ligne, et un reflet fait paraître grise une bande noire. Même un modèle appris reçoit d’autres nombres quand la lumière change.\n\n**Pourquoi les données d’entraînement comptent.** Un modèle ne connaît que ce qu’on lui a montré. Entraîne-le uniquement avec des photos d’un laboratoire clair et bien rangé, et il risque d’échouer dans un couloir sombre et encombré\u00a0; montre-lui seulement des balles rouges, et il risque de rater les bleues. Les bonnes équipes rassemblent des exemples **variés** (éclairages, angles, arrière-plans et objets différents) et **testent toujours sur place**, là où le robot va travailler. Quand les exemples manquants concernent des personnes, on parle de **biais**\u00a0: un détecteur de personnes entraîné surtout avec des adultes qui marchent risque de rater des enfants ou des personnes en fauteuil roulant, et pour un robot, c’est un problème de sécurité, pas une simple erreur.\n\n**Caméras et vie privée.** La caméra d’un robot peut filmer des personnes. Oriente-la vers la piste ou vers les objets, pas vers tes camarades, et n’enregistre ni ne partage jamais d’images de personnes sans leur accord.',
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
                  title: 'Watch: how computer vision works',
                  caption:
                    "From Code.org's How AI Works series (about 6 minutes): how a computer learns to recognise what is in an image.",
                  transcript:
                    'In short: to a computer, an image is only a grid of numbers. A computer vision model learns to recognise what is in an image by being trained on many labelled examples. It works in layers: the first layers react to simple features such as edges and patches of colour, the next ones combine them into shapes and parts, and the last ones combine those into whole objects to make a prediction. The video shows why this is harder than it sounds, for example when a computer has to tell a chihuahua from a muffin. Engineers from companies that build self-driving cars and farming robots explain how computer vision helps their machines find their way and recognise what is around them. Remember that the model does not understand what is in the image: it matches patterns of numbers learned from its training examples, so it can be wrong when the world looks different from its examples.',
                },
                fr: {
                  title: 'Regarde\u00a0: comment fonctionne la vision par ordinateur',
                  caption:
                    'Une vidéo de la série How AI Works de Code.org (environ 6\u00a0minutes, en anglais)\u00a0: comment un ordinateur apprend à reconnaître ce que contient une image.',
                  transcript:
                    'En bref\u00a0: pour un ordinateur, une image n’est qu’une grille de nombres. Un modèle de vision par ordinateur apprend à reconnaître ce que contient une image en s’entraînant sur de nombreux exemples étiquetés. Il fonctionne par couches\u00a0: les premières réagissent à des éléments simples comme des bords ou des taches de couleur, les suivantes les assemblent en formes et en parties, et les dernières les combinent en objets entiers pour faire une prédiction. La vidéo montre pourquoi c’est plus difficile qu’il n’y paraît, par exemple quand un ordinateur doit distinguer un chihuahua d’un muffin. Des ingénieurs d’entreprises qui fabriquent des voitures autonomes et des robots agricoles expliquent comment la vision par ordinateur aide leurs machines à trouver leur chemin et à reconnaître ce qui les entoure. N’oublie pas que le modèle ne comprend pas ce que contient l’image\u00a0: il repère des régularités dans des nombres, apprises à partir de ses exemples d’entraînement, et il peut donc se tromper quand le monde ne ressemble pas à ses exemples.',
                },
              },
              data: {
                source: 'youtube',
                videoId: '2hXG8v8p0KM',
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
                    'Program the vision rule of a line follower. The list "row" is one row of pixels from the bottom of the camera image (0 = black, 255 = white). The program is saved, not run, so trace it by hand:\n\n1. Work out what it prints for "row" and write it as a comment.\n2. Now the robot drives into a shadow. Change "pixels = row" to "pixels = shadow_row" and trace again. Is the answer right? Look at where the dark tape really is.\n3. Try THRESHOLD = 50 with both rows. Does it work now? Why is a fixed threshold still risky?\n4. Bonus: compute the threshold from the row itself, halfway between its darkest and its brightest pixel, and check both rows again.',
                  hint: 'In "shadow_row" every pixel is below 100, so every position counts as line. Their average position is the middle of the row, even though the tape is on the right.',
                },
                fr: {
                  instructions:
                    'Programme la règle de vision d’un robot suiveur de ligne. La liste «\u00a0row\u00a0» est une rangée de pixels prise en bas de l’image de la caméra (0 = noir, 255 = blanc). Le programme est enregistré, pas exécuté\u00a0: déroule-le à la main.\n\n1. Détermine ce qu’il affiche pour «\u00a0row\u00a0» et écris-le en commentaire.\n2. Le robot entre maintenant dans une ombre. Remplace «\u00a0pixels = row\u00a0» par «\u00a0pixels = shadow_row\u00a0» et déroule-le de nouveau. La réponse est-elle juste\u00a0? Regarde où se trouve vraiment la bande noire.\n3. Essaie THRESHOLD = 50 avec les deux rangées. Est-ce que ça fonctionne maintenant\u00a0? Pourquoi un seuil fixe reste-t-il risqué\u00a0?\n4. Bonus\u00a0: calcule le seuil à partir de la rangée elle-même, à mi-chemin entre son pixel le plus sombre et son pixel le plus clair, puis vérifie de nouveau les deux rangées.',
                  hint: 'Dans «\u00a0shadow_row\u00a0», tous les pixels sont en dessous de 100\u00a0: toutes les positions comptent donc comme de la ligne. Leur position moyenne est le milieu de la rangée, alors que la bande est à droite.',
                },
              },
              data: {
                language: 'python',
                starterCode: lines(
                  '# Saved, not run: trace it by hand. / Enregistré, pas exécuté\u00a0: déroule-le à la main.',
                  '# One row of pixels from the bottom of the camera image. 0 = black, 255 = white.',
                  '# / Une rangée de pixels du bas de l’image de la caméra. 0 = noir, 255 = blanc.',
                  'row = [210, 205, 198, 60, 42, 55, 201, 207, 212]',
                  'shadow_row = [95, 90, 88, 85, 80, 82, 30, 25, 35]',
                  '',
                  'pixels = row',
                  'THRESHOLD = 100  # darker than this = line / plus sombre = ligne',
                  '',
                  'dark = []  # an empty list / une liste vide',
                  '# enumerate gives the position (Python counts from 0) and the brightness of each pixel.',
                  '# / enumerate donne la position (Python compte à partir de 0) et la luminosité de chaque pixel.',
                  'for position, brightness in enumerate(pixels):',
                  '    if brightness < THRESHOLD:',
                  '        dark.append(position)  # add it to the list / ajoute-la à la liste',
                  '',
                  '# len = how many pixels (9). // divides and drops the decimals: 9 // 2 = 4.',
                  '# / len = le nombre de pixels (9). // divise sans garder les décimales\u00a0: 9 // 2 = 4.',
                  'middle = len(pixels) // 2',
                  'if len(dark) == 0:',
                  '    print("line lost")',
                  'else:',
                  '    # The average position of the dark pixels. / La position moyenne des pixels sombres.',
                  '    line_at = sum(dark) / len(dark)',
                  '    if line_at < middle - 1:',
                  '        print("line LEFT: turn left")',
                  '    elif line_at > middle + 1:',
                  '        print("line RIGHT: turn right")',
                  '    else:',
                  '        print("line CENTRE: go straight")',
                  '',
                  '# My trace / Ma trace:',
                ),
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
                    'Ask the AI tutor why a vision model trained only in a bright classroom could fail in a dark corridor, and which extra pictures would help. Then decide for yourself whether its list is complete. Do not describe real people or share their photos.',
                  starterPrompt:
                    'Why could a robot vision model trained only on photos taken in a bright classroom fail in a dark corridor? What kinds of training pictures should be added?',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA pourquoi un modèle de vision entraîné uniquement dans une classe bien éclairée pourrait échouer dans un couloir sombre, et quelles images supplémentaires aideraient. Décide ensuite par toi-même si sa liste est complète. Ne décris pas de vraies personnes et ne partage pas leurs photos.',
                  starterPrompt:
                    'Pourquoi un modèle de vision de robot entraîné uniquement avec des photos prises dans une classe bien éclairée pourrait-il échouer dans un couloir sombre\u00a0? Quels types d’images faudrait-il ajouter aux données d’entraînement\u00a0?',
                },
              },
              data: { tutorMode: 'explain', labToolId: null },
            },
            {
              id: 'm2-l1-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'A robot must recognise cans and bottles for recycling in a busy school canteen. List three kinds of example pictures you would collect to train it, and explain why each one helps.',
                },
                fr: {
                  prompt:
                    'Un robot doit reconnaître les canettes et les bouteilles à recycler dans une cantine scolaire très animée. Cite trois types d’images d’exemple que tu rassemblerais pour l’entraîner, et explique en quoi chacun est utile.',
                },
              },
              data: { minLength: 60 },
            },
          ],
        },
        {
          id: 'm2-l2',
          input: {
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Making decisions',
                summary:
                  'Fixed rules, learned behaviour and state machines: how a robot chooses what to do next, and how to keep those choices safe.',
              },
              fr: {
                title: 'Prendre des décisions',
                summary:
                  'Règles fixes, comportement appris et machines à états\u00a0: comment un robot choisit ce qu’il fait ensuite, et comment faire en sorte que ces choix restent sûrs.',
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
                  heading: 'Who decides, and how?',
                  body: 'A heating thermostat follows one rule: *if the room is colder than 20\u00a0°C, heat*. Nobody needs AI for that.\n\nNow imagine a robot that sorts rubbish into recycling bins by looking at it. Bottles come in hundreds of shapes, crushed or whole, clean or dirty, under every kind of light. Could you write a rule for every case?\n\nRobots make decisions in different ways, and choosing the right way for each job is part of designing a robot that is useful **and** safe.',
                },
                fr: {
                  heading: 'Qui décide, et comment\u00a0?',
                  body: 'Un thermostat de chauffage suit une seule règle\u00a0: *si la pièce est à moins de 20\u00a0°C, chauffe*. Pas besoin d’IA pour ça.\n\nImagine maintenant un robot qui trie les déchets dans les bacs de recyclage en les regardant. Il existe des centaines de formes de bouteilles, et chacune peut être écrasée ou entière, propre ou sale, et vue sous toutes sortes d’éclairages. Pourrais-tu écrire une règle pour chaque cas\u00a0?\n\nLes robots prennent leurs décisions de différentes manières, et choisir la bonne pour chaque tâche fait partie de la conception d’un robot utile **et** sûr.',
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
                  heading: 'Rules, learned behaviour and states',
                  body: '**If/then rules** are written by a programmer: *if the distance is less than 20 cm, turn*. They are predictable, quick to test and easy to explain, but someone has to think of every situation in advance.\n\n**Learned behaviour** comes from a model trained on examples, such as thousands of labelled pictures of *path clear* and *path blocked*. It copes with messy inputs that rules cannot describe, but it can be wrong in surprising ways, it is only as good as its training data, and it is harder to explain why it made a choice.\n\n**Real robots combine both.** A typical design uses a learned model to **perceive** (*is that a person, a box or a door?*) and clear rules, using a simple sensor, to **stay safe** (*if anything is closer than 1 metre, stop, whatever the model says it is*). A safety rule should never depend only on a guess.\n\n**State machines** keep a robot organised. At every moment the robot is in exactly one **state**, such as DRIVING or TURNING, and each state has its own behaviour. **Transitions** say which sensor reading moves it to another state:\n\n| State | What the robot does | Change when | Next state |\n|---|---|---|---|\n| DRIVING | Drive forward | Distance below 20 cm | TURNING |\n| TURNING | Turn left on the spot | Distance above 50 cm | DRIVING |\n| Any state | (whatever it was doing) | Bumper pressed | STOPPED |\n| STOPPED | Stop all motors and beep | A person presses restart | DRIVING |\n\nDrawing the states as circles joined by arrows, before you write any code, is one of the best ways to plan a robot.',
                },
                fr: {
                  heading: 'Règles, comportement appris et états',
                  body: 'Les **règles si… alors** sont écrites par un programmeur\u00a0: *si la distance est inférieure à 20\u00a0cm, tourne*. Elles sont prévisibles, rapides à tester et faciles à expliquer, mais quelqu’un doit penser à l’avance à toutes les situations.\n\nLe **comportement appris** vient d’un modèle entraîné sur des exemples, comme des milliers d’images étiquetées *voie libre* et *voie bloquée*. Il s’en sort avec des données complexes que des règles ne savent pas décrire, mais il peut se tromper de façon surprenante, il ne vaut que ce que valent ses données d’entraînement, et il est plus difficile d’expliquer pourquoi il a fait un choix.\n\n**Les vrais robots combinent les deux.** Une conception classique utilise un modèle appris pour **percevoir** (*est-ce une personne, une boîte ou une porte\u00a0?*) et des règles claires, appuyées sur un capteur simple, pour **garantir la sécurité** (*si quoi que ce soit se trouve à moins d’un mètre, arrête-toi, quel que soit le résultat du modèle*). Une règle de sécurité ne doit jamais dépendre seulement d’une estimation.\n\nLes **machines à états** aident un robot à rester organisé. À chaque instant, le robot se trouve dans un seul **état**, comme DRIVING (rouler) ou TURNING (tourner), et chaque état a son propre comportement. Les **transitions** indiquent quelle mesure d’un capteur le fait passer dans un autre état\u00a0:\n\n| État | Ce que fait le robot | Condition de passage | État suivant |\n|---|---|---|---|\n| DRIVING | Avancer | Distance inférieure à 20\u00a0cm | TURNING |\n| TURNING | Tourner à gauche sur place | Distance supérieure à 50\u00a0cm | DRIVING |\n| N’importe quel état | (ce qu’il était en train de faire) | Pare-chocs enfoncé | STOPPED |\n| STOPPED | Arrêter tous les moteurs et biper | Une personne appuie sur «\u00a0redémarrer\u00a0» | DRIVING |\n\nDessiner les états sous forme de cercles reliés par des flèches, avant d’écrire la moindre ligne de code, est l’une des meilleures façons de préparer un robot.',
                },
              },
              data: {},
            },
            {
              id: 'm2-l2-b3',
              type: 'video',
              stage: 'watch',
              defaultLocale: 'en',
              translations: {
                en: {
                  title: 'Watch: training data and bias',
                  caption:
                    "From Code.org's How AI Works series (about 3 minutes): why the data used to train a model shapes every decision it makes.",
                  transcript:
                    'In short: the most important part of machine learning is the data used to train the model. A model finds patterns in its training examples and uses them to make predictions, so if the examples are incomplete or unbalanced, its predictions will be too. When the data leaves some people or situations out, the model can make wrong or unfair decisions about them; this is called bias. The video gives everyday examples, such as recommendations based on what people have watched, and more serious ones, such as models that learn from medical images. The people who build a model are responsible for choosing training data that represents everyone and every situation it will meet, and for testing it. For a robot, that means training and testing it in all the places, lights and conditions where it will work.',
                },
                fr: {
                  title: 'Regarde\u00a0: données d’entraînement et biais',
                  caption:
                    'Une vidéo de la série How AI Works de Code.org (environ 3\u00a0minutes, en anglais)\u00a0: pourquoi les données utilisées pour entraîner un modèle influencent chacune de ses décisions.',
                  transcript:
                    'En bref\u00a0: l’élément le plus important de l’apprentissage automatique, ce sont les données qui servent à entraîner le modèle. Un modèle repère des régularités dans ses exemples d’entraînement et s’en sert pour faire des prédictions\u00a0: si les exemples sont incomplets ou déséquilibrés, ses prédictions le seront aussi. Quand les données laissent de côté certaines personnes ou certaines situations, le modèle peut prendre à leur sujet des décisions fausses ou injustes\u00a0: c’est ce qu’on appelle un biais. La vidéo donne des exemples de la vie courante, comme les recommandations fondées sur ce que les gens ont regardé, et des exemples plus sérieux, comme des modèles qui apprennent à partir d’images médicales. Les personnes qui construisent un modèle sont responsables du choix de données d’entraînement représentatives de toutes les personnes et de toutes les situations qu’il rencontrera, ainsi que de ses tests. Pour un robot, cela veut dire l’entraîner et le tester dans tous les lieux, tous les éclairages et toutes les conditions où il devra fonctionner.',
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
              id: 'm2-l2-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    "Trace an obstacle avoider written as a state machine. Each pass through the loop is one tick of the robot's control loop, with a new distance reading. The program is saved, not run:\n\n1. Write the state the robot is in after each reading, in the comments at the bottom.\n2. Why does the robot stay in TURNING at 30 cm, even though 30 is more than 20? What would go wrong if it switched back to DRIVING as soon as the distance was above 20?\n3. Add a STOPPED state: if bumper is True, the robot goes to STOPPED from any state and stays there. Use the list bumps, which has one value for each reading.",
                  hint: 'For step 3, test the bumper first, before the other "if" tests, and, because this trace has no restart button, give STOPPED no way out.',
                },
                fr: {
                  instructions:
                    'Déroule à la main le programme d’un robot éviteur d’obstacles écrit sous forme de machine à états. Chaque passage dans la boucle correspond à un tour de la boucle de contrôle du robot, avec une nouvelle mesure de distance. Le programme est enregistré, pas exécuté\u00a0:\n\n1. Écris l’état du robot après chaque mesure, dans les commentaires en bas.\n2. Pourquoi le robot reste-t-il dans l’état TURNING à 30\u00a0cm, alors que 30 est supérieur à 20\u00a0? Que se passerait-il s’il repassait en DRIVING dès que la distance dépasse 20\u00a0?\n3. Ajoute un état STOPPED\u00a0: si bumper vaut True, le robot passe en STOPPED depuis n’importe quel état et y reste. Utilise la liste bumps, qui contient une valeur pour chaque mesure.',
                  hint: 'Pour l’étape 3, teste le pare-chocs en premier, avant les autres «\u00a0if\u00a0», et, comme ce programme n’a pas de bouton «\u00a0redémarrer\u00a0», ne prévois aucune sortie de l’état STOPPED.',
                },
              },
              data: {
                language: 'python',
                starterCode: lines(
                  '# Saved, not run: trace it by hand. / Enregistré, pas exécuté\u00a0: déroule-le à la main.',
                  'distances = [90, 70, 45, 18, 15, 30, 60, 80, 40]',
                  '# True = bumper pressed / pare-chocs enfoncé',
                  'bumps = [False, False, False, False, False, False, False, False, True]',
                  '',
                  'state = "DRIVING"',
                  '',
                  '# tick = 0, 1, 2… one tick per reading (Python counts from 0).',
                  '# / tick = 0, 1, 2… un tour par mesure (Python compte à partir de 0).',
                  'for tick in range(len(distances)):',
                  '    distance = distances[tick]  # reading number tick / la mesure numéro tick',
                  '    bumper = bumps[tick]',
                  '',
                  '    if state == "DRIVING":',
                  '        if distance < 20:',
                  '            state = "TURNING"',
                  '    elif state == "TURNING":  # elif = else if / sinon si',
                  '        if distance > 50:',
                  '            state = "DRIVING"',
                  '',
                  '    print(distance, state)',
                  '',
                  '# My trace / Ma trace:',
                  '# 90 DRIVING',
                ),
              },
            },
            {
              id: 'm2-l2-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Ask the AI tutor to challenge you with robot situations. For each one, say whether you would use a fixed rule, a learned model or both, and why. Then ask it to point out any safety rule you forgot.',
                  starterPrompt:
                    'Challenge me with four robot situations, one at a time. For each one I will say whether a fixed rule, a learned model or both should make the decision, and you tell me whether my reasoning is sound.',
                },
                fr: {
                  instructions:
                    'Demande au tuteur IA de te mettre au défi avec des situations de robots. Pour chacune, dis si tu utiliserais une règle fixe, un modèle appris ou les deux, et pourquoi. Demande-lui ensuite de te signaler les règles de sécurité que tu aurais oubliées.',
                  starterPrompt:
                    'Mets-moi au défi avec quatre situations de robots, une par une. Pour chacune, je te dirai si la décision doit être prise par une règle fixe, par un modèle appris ou par les deux, et tu me diras si mon raisonnement tient la route.',
                },
              },
              data: { tutorMode: 'challenge_me', labToolId: null },
            },
            {
              id: 'm2-l2-b6',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: { intro: 'Check what you know about robot vision and decisions.' },
                fr: {
                  intro: 'Vérifie ce que tu sais sur la vision des robots et leurs décisions.',
                },
              },
              data: { quizId: 'quiz-m2' },
            },
            {
              id: 'm2-l2-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'A delivery robot drives along school corridors and uses a camera model to spot people. Which decisions would you leave to the model, and which would you write as fixed safety rules? Explain why. Which sensor would your safety rule use?',
                },
                fr: {
                  prompt:
                    'Un robot livreur circule dans les couloirs d’une école et utilise un modèle de vision pour repérer les personnes. Quelles décisions laisserais-tu au modèle, et lesquelles écrirais-tu sous forme de règles de sécurité fixes\u00a0? Explique pourquoi. Quel capteur ta règle de sécurité utiliserait-elle\u00a0?',
                },
              },
              data: { minLength: 60 },
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
            title: 'Build your autonomous robot',
            description:
              'Plan, program, test and improve a line-following or obstacle-avoiding robot on a simulator, on a kit or on paper, safely and with a test log.',
          },
          fr: {
            title: 'Construis ton robot autonome',
            description:
              'Conçois, programme, teste et améliore un robot suiveur de ligne ou éviteur d’obstacles, sur un simulateur, sur un kit ou sur papier, en sécurité et avec un journal de tests.',
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
                title: 'Plan and program your robot',
                summary:
                  "Choose your mission, set success criteria, design the states and rules, and write your robot's program.",
              },
              fr: {
                title: 'Conçois et programme ton robot',
                summary:
                  'Choisis ta mission, fixe tes critères de réussite, conçois les états et les règles, puis écris le programme de ton robot.',
              },
            },
            estimatedMinutes: 45,
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
                  heading: 'Choose your mission',
                  body: 'Time to become a robotics engineer. Choose one mission:\n\n- **Mission A: the line follower.** Follow a black line on a white floor from start to finish without losing it, and stop on your own at the finish bar: a short black strip across the end of the line, so that both sensors see black.\n- **Mission B: the obstacle avoider.** Explore an area for 60 seconds without touching any wall or obstacle.\n\nYou can build it on a **robot simulator** (if your teacher gives you one), on a **classroom kit** with wheels and a line or distance sensor (any brand), or, if you have neither, as a **paper robot**: draw the track, then move a counter by hand, following your program one step at a time. Engineers call this a **dry run**, and it finds a surprising number of bugs.\n\nThe line follower is also great practice for the robot challenges in the Robotics area.',
                },
                fr: {
                  heading: 'Choisis ta mission',
                  body: 'C’est le moment de devenir ingénieur ou ingénieure en robotique. Choisis une mission\u00a0:\n\n- **Mission A\u00a0: le suiveur de ligne.** Suivre une ligne noire sur un sol blanc du départ à l’arrivée sans la perdre, et s’arrêter tout seul sur la barre d’arrivée\u00a0: une courte bande noire posée en travers au bout de la ligne, pour que les deux capteurs voient du noir.\n- **Mission B\u00a0: l’éviteur d’obstacles.** Explorer une zone pendant 60\u00a0secondes sans toucher aucun mur ni aucun obstacle.\n\nTu peux le réaliser sur un **simulateur de robot** (si ton enseignant t’en propose un), sur un **kit de ta classe** équipé de roues et d’un capteur de ligne ou de distance (de n’importe quelle marque) ou, si tu n’as ni l’un ni l’autre, sous forme de **robot de papier**\u00a0: dessine la piste, puis déplace un pion à la main en suivant ton programme pas à pas. Les ingénieurs appellent cela un **essai à blanc**, et cela permet de trouver un nombre étonnant d’erreurs.\n\nLe suiveur de ligne est aussi un excellent entraînement pour les défis de l’espace Robotique.',
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
                  heading: 'Plan like an engineer',
                  body: 'Good robots start on paper. Your plan has five parts:\n\n1. **Goal and success criteria.** Make them measurable: *the robot completes the track in under 60 seconds without losing the line, in 3 runs out of 3*.\n2. **Sensors and actuators.** Which ones, where they sit on the robot, and what each one tells you.\n3. **States and rules.** A state table or a drawing of circles and arrows.\n4. **Program.** First in plain words or blocks, then in code.\n5. **Test plan.** What you will test, on which track, and how many runs.\n\n**How a two-sensor line follower decides.** Put two line sensors side by side, one on each side of the line:\n\n| Left sensor | Right sensor | What it means | Action |\n|---|---|---|---|\n| White | White | The line is between the sensors (or, if it lasts, the robot has lost the line) | Drive forward |\n| Black | White | The line has drifted to the left | Turn left |\n| White | Black | The line has drifted to the right | Turn right |\n| Black | Black | A crossing or the finish bar | Stop (or follow your plan for crossings) |\n\nThis robot will **wiggle**: it keeps correcting to the left and to the right. That is normal with simple on/off rules. Driving more slowly usually makes it more accurate; later, you can learn smoother control that turns a little or a lot depending on how far the robot is from the line.\n\n**For the obstacle avoider**, start from the DRIVING, TURNING and STOPPED states of the previous lesson.',
                },
                fr: {
                  heading: 'Conçois ton robot comme un ingénieur',
                  body: 'Les bons robots commencent sur papier. Ton plan comporte cinq parties\u00a0:\n\n1. **Objectif et critères de réussite.** Rends-les mesurables\u00a0: *le robot termine la piste en moins de 60\u00a0secondes sans perdre la ligne, lors de 3 essais sur 3*.\n2. **Capteurs et actionneurs.** Lesquels, où ils sont placés sur le robot, et ce que chacun t’indique.\n3. **États et règles.** Un tableau d’états ou un dessin avec des cercles et des flèches.\n4. **Programme.** D’abord en mots simples ou en blocs, puis en code.\n5. **Plan de tests.** Ce que tu vas tester, sur quelle piste, et combien d’essais tu feras.\n\n**Comment décide un suiveur de ligne à deux capteurs.** Place deux capteurs de ligne côte à côte, un de chaque côté de la ligne\u00a0:\n\n| Capteur gauche | Capteur droit | Ce que cela signifie | Action |\n|---|---|---|---|\n| Blanc | Blanc | La ligne est entre les capteurs (ou, si cela dure, le robot a perdu la ligne) | Avancer |\n| Noir | Blanc | La ligne s’est décalée vers la gauche | Tourner à gauche |\n| Blanc | Noir | La ligne s’est décalée vers la droite | Tourner à droite |\n| Noir | Noir | Un croisement ou la barre d’arrivée | S’arrêter (ou suivre ton plan pour les croisements) |\n\nCe robot va **zigzaguer**\u00a0: il corrige sans cesse à gauche et à droite. C’est normal avec des règles simples de type tout ou rien. Rouler plus lentement le rend en général plus précis\u00a0; plus tard, tu pourras découvrir des commandes plus douces, qui tournent plus ou moins selon l’écart entre le robot et la ligne.\n\n**Pour l’éviteur d’obstacles**, pars des états DRIVING, TURNING et STOPPED de la leçon précédente.',
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
                  heading: 'Watch and observe: the human robot',
                  body: 'No video this time: you will watch a robot made of people. Work with one or two classmates, or with someone at home.\n\n1. Make a line on the floor with tape or chalk, or draw one on a large sheet of paper for a finger to follow, and end it with a short finish bar across the line.\n2. The **robot** closes their eyes and may only obey four commands: *forward*, *turn left*, *turn right* and *stop*.\n3. The **sensors** stand behind and only say what the left and right sensors would see: *black* or *white*.\n4. The **controller** reads the rules of the line-follower table aloud and gives the command. Nobody else may help.\n\nObserve carefully and take notes. When did the robot wiggle? Did it ever lose the line, and why? What happened at a sharp curve, and when it moved faster? Then swap roles. If you are on your own, play all three roles with your finger on a drawn track.\n\n**Safety:** the robot moves slowly, on a clear floor, away from stairs and furniture, and a spotter walks beside them. This is exactly why real robots need an emergency stop.',
                },
                fr: {
                  heading: 'Observe\u00a0: le robot humain',
                  body: 'Pas de vidéo cette fois\u00a0: tu vas observer un robot fait de personnes. Travaille avec un ou deux camarades, ou avec quelqu’un à la maison.\n\n1. Trace une ligne au sol avec du ruban adhésif ou de la craie, ou dessine-la sur une grande feuille pour qu’un doigt la suive, et termine-la par une courte barre d’arrivée en travers.\n2. Le **robot** ferme les yeux et ne peut obéir qu’à quatre ordres\u00a0: *avance*, *tourne à gauche*, *tourne à droite* et *stop*.\n3. Les **capteurs** se placent derrière et disent seulement ce que verraient les capteurs gauche et droit\u00a0: *noir* ou *blanc*.\n4. Le **contrôleur** lit à voix haute les règles du tableau du suiveur de ligne et donne l’ordre. Personne d’autre n’a le droit d’aider.\n\nObserve attentivement et prends des notes. Quand le robot a-t-il zigzagué\u00a0? A-t-il perdu la ligne, et pourquoi\u00a0? Que s’est-il passé dans un virage serré, et quand il allait plus vite\u00a0? Ensuite, échangez les rôles. Si tu es seul ou seule, joue les trois rôles avec ton doigt sur une piste dessinée.\n\n**Sécurité\u00a0:** le robot avance lentement, sur un sol dégagé, loin des escaliers et des meubles, et une personne marche à côté de lui pour le protéger. C’est exactement pour cela que les vrais robots ont besoin d’un arrêt d’urgence.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l1-b4',
              type: 'code_activity',
              stage: 'try',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Here is a line follower in blocks, written from the table above. It is saved, not run. Check it like an engineer:\n\n1. Follow the program for each of the four sensor cases (white/white, black/white, white/black, black/black) and write the action next to each case in the comments at the bottom.\n2. Find the speed setting. Write what you expect to happen on a sharp curve if you double it.\n3. If you chose Mission B, rewrite the program for an obstacle avoider with a distance sensor and the DRIVING, TURNING and STOPPED states.',
                  hint: 'The "if" tests are checked in order, so the black/black case must come first. Otherwise the robot would turn left at the finish bar instead of stopping.',
                },
                fr: {
                  instructions:
                    'Voici un suiveur de ligne en blocs, écrit à partir du tableau ci-dessus. Il est enregistré, pas exécuté. Vérifie-le comme un ingénieur\u00a0:\n\n1. Déroule le programme pour chacun des quatre cas de capteurs (blanc/blanc, noir/blanc, blanc/noir, noir/noir) et écris l’action correspondante à côté de chaque cas, dans les commentaires en bas.\n2. Repère le réglage de vitesse. Écris ce qui risque de se passer dans un virage serré si tu le doubles.\n3. Si tu as choisi la mission B, réécris le programme pour un éviteur d’obstacles avec un capteur de distance et les états DRIVING, TURNING et STOPPED.',
                  hint: 'Les tests «\u00a0if\u00a0» sont vérifiés dans l’ordre\u00a0: le cas noir/noir doit donc venir en premier. Sinon, le robot tournerait à gauche sur la barre d’arrivée au lieu de s’arrêter.',
                },
              },
              data: {
                language: 'blocks',
                starterCode: lines(
                  'when green flag clicked',
                  'set [speed] to [30]',
                  'forever',
                  '  if <<left sensor sees black?> and <right sensor sees black?>> then',
                  '    stop motors',
                  '    stop all',
                  '  else',
                  '    if <left sensor sees black?> then',
                  '      turn left at speed (speed)',
                  '    else',
                  '      if <right sensor sees black?> then',
                  '        turn right at speed (speed)',
                  '      else',
                  '        drive forward at speed (speed)',
                  '      end',
                  '    end',
                  '  end',
                  'end',
                  '',
                  '// white / white (blanc / blanc):',
                  '// black / white (noir / blanc):',
                  '// white / black (blanc / noir):',
                  '// black / black (noir / noir):',
                  '// Speed doubled / Vitesse doublée:',
                ),
              },
            },
            {
              id: 'm3-l1-b5',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Not sure how your robot should handle a crossing or the finish bar (Mission A), or a corner it cannot escape (Mission B)? Ask the AI tutor for a hint, not for the whole program: you learn more, and the project stays yours. Describe your robot without any personal details.',
                  starterPrompt:
                    'I am planning a line-following robot with two line sensors. What should I think about for the moment when both sensors see black? Give me a hint, not the program.',
                },
                fr: {
                  instructions:
                    'Tu ne sais pas trop comment ton robot doit gérer un croisement ou la barre d’arrivée (mission A), ou un coin dont il n’arrive pas à sortir (mission B)\u00a0? Demande un indice au tuteur IA, pas le programme entier\u00a0: tu apprendras davantage, et le projet restera le tien. Décris ton robot sans aucune information personnelle.',
                  starterPrompt:
                    'Je prépare un robot suiveur de ligne avec deux capteurs de ligne. À quoi dois-je penser pour le moment où les deux capteurs voient du noir\u00a0? Donne-moi un indice, pas le programme.',
                },
              },
              data: { tutorMode: 'hint', labToolId: null },
            },
            {
              id: 'm3-l1-b6',
              type: 'code_activity',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Now write your own program for your mission, in Python or in the blocks style above. The starter is a line follower; change it for Mission B. It is saved, not run: the robot commands are examples, and your simulator or kit will name them differently. Before you finish:\n\n1. Fill in the mission, the success criteria and the AI help lines at the top.\n2. Keep the SENSE, DECIDE and ACT labels in the right places.\n3. Add at least one improvement of your own, for example a slower speed on curves, a beep at the end or a safety stop.\n4. Do a dry run on your paper track and fix anything that surprises you.\n\nIf an AI tool helps you with the code, say what it helped with on the AI help line, and check every line yourself.',
                  hint: 'Keep the order of the tests from the blocks version: black/black first, then left, then right, then forward.',
                },
                fr: {
                  instructions:
                    'Écris maintenant ton propre programme pour ta mission, en Python ou en blocs comme ci-dessus. Le programme de départ est un suiveur de ligne\u00a0; adapte-le pour la mission B. Il est enregistré, pas exécuté\u00a0: les commandes du robot sont des exemples, et ton simulateur ou ton kit les nomme autrement. Avant de terminer\u00a0:\n\n1. Remplis en haut les lignes Mission, Critères de réussite et Aide de l’IA.\n2. Garde les repères SENSE (percevoir), DECIDE (décider) et ACT (agir) aux bons endroits.\n3. Ajoute au moins une amélioration de ton choix, par exemple une vitesse plus lente dans les virages, un bip à la fin ou un arrêt de sécurité.\n4. Fais un essai à blanc sur ta piste en papier et corrige tout ce qui te surprend.\n\nSi un outil d’IA t’aide à écrire le code, indique sur quoi il t’a aidé à la ligne Aide de l’IA, et vérifie chaque ligne toi-même.',
                  hint: 'Garde l’ordre des tests de la version en blocs\u00a0: d’abord noir/noir, puis gauche, puis droite, puis avancer.',
                },
              },
              data: {
                language: 'python',
                starterCode: lines(
                  '# Saved, not run. The robot.* commands are examples: use the names of your platform.',
                  '# Enregistré, pas exécuté. Les commandes robot.* sont des exemples\u00a0: utilise les noms de ta plateforme.',
                  '#',
                  '# Mission:',
                  '# Success criteria / Critères de réussite:',
                  '# AI help / Aide de l’IA:',
                  '',
                  'SPEED = 30  # percent of full speed / pourcentage de la vitesse maximale',
                  '',
                  'while True:  # repeat forever / répète sans fin',
                  '    # SENSE',
                  '    left = robot.left_line_sensor()  # True on black / True sur le noir',
                  '    right = robot.right_line_sensor()',
                  '',
                  '    # DECIDE and ACT',
                  '    if left and right:  # both see black / les deux voient du noir',
                  '        robot.stop()',
                  '        break  # leave the loop: the program ends / sort de la boucle, le programme se termine',
                  '    elif left:  # elif = else if / sinon si',
                  '        robot.turn_left(SPEED)',
                  '    elif right:',
                  '        robot.turn_right(SPEED)',
                  '    else:',
                  '        robot.forward(SPEED)',
                ),
              },
            },
            {
              id: 'm3-l1-b7',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'Look at your program and your dry run. What do you predict will go wrong first when you test it, and what will you measure to find out?',
                },
                fr: {
                  prompt:
                    'Regarde ton programme et ton essai à blanc. Qu’est-ce qui risque de mal se passer en premier pendant les tests, et que vas-tu mesurer pour le savoir\u00a0?',
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
                title: 'Test, improve and show your robot',
                summary:
                  'Test safely, keep a test log, improve your robot one change at a time, and submit your project.',
              },
              fr: {
                title: 'Teste, améliore et présente ton robot',
                summary:
                  'Teste en sécurité, tiens un journal de tests, améliore ton robot une modification à la fois et rends ton projet.',
              },
            },
            estimatedMinutes: 90,
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
                  heading: 'Safety first around real robots',
                  body: 'Even a small robot has spinning wheels, parts that can pinch and a battery. Before every test on a real kit:\n\n1. **Clear the test area**, away from table edges, stairs, drinks and cables.\n2. **Start slow.** Test at low speed first, and only speed up once the robot behaves.\n3. **Keep hands, hair and sleeves away** from wheels, gears and grippers while the robot is switched on.\n4. **Know your emergency stop.** Before you start, agree how to stop the robot instantly: a stop button or the power switch. Practise using it once before the first run.\n5. **Take care with batteries.** Never use a battery that is damaged, swollen or hot: tell an adult straight away and do not charge it.\n6. **Have an adult nearby** whenever you test real hardware.\n\nA simulator and a paper robot have no wheels to catch your fingers, so they are a safe place to try risky ideas first.\n\n**Privacy and honesty.** If you film your robot, film only the robot: no faces, no names, no school uniforms or signs, and mute the sound or make sure nobody says a name. Never post the video publicly. If an AI tool helped you, say so in your project.',
                },
                fr: {
                  heading: 'La sécurité d’abord près des vrais robots',
                  body: 'Même un petit robot a des roues qui tournent, des pièces qui peuvent pincer et une batterie. Avant chaque essai sur un vrai kit\u00a0:\n\n1. **Dégage la zone de test**, loin des bords de table, des escaliers, des boissons et des câbles.\n2. **Commence doucement.** Teste d’abord à faible vitesse, et n’accélère qu’une fois que le robot se comporte correctement.\n3. **Garde mains, cheveux et manches à distance** des roues, des engrenages et des pinces quand le robot est allumé.\n4. **Connais ton arrêt d’urgence.** Avant de commencer, mets-toi d’accord sur la façon d’arrêter le robot immédiatement\u00a0: un bouton d’arrêt ou l’interrupteur d’alimentation. Entraîne-toi une fois à l’utiliser avant le premier essai.\n5. **Fais attention aux batteries.** N’utilise jamais une batterie abîmée, gonflée ou chaude\u00a0: préviens tout de suite un adulte et ne la recharge pas.\n6. **Travaille avec un adulte à proximité** chaque fois que tu testes du vrai matériel.\n\nUn simulateur et un robot de papier n’ont pas de roues pour te pincer les doigts\u00a0: ce sont des endroits sûrs pour essayer d’abord les idées risquées.\n\n**Vie privée et honnêteté.** Si tu filmes ton robot, ne filme que le robot\u00a0: pas de visages, pas de noms, pas d’uniformes ni de panneaux de ton école, et coupe le son ou vérifie que personne ne prononce de nom. Ne publie jamais la vidéo en ligne. Si un outil d’IA t’a aidé, indique-le dans ton projet.',
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
                  heading: 'Test like an engineer',
                  body: 'A robot that works once is lucky. A robot that works every time has been **tested**. Keep a **test log**, with one row per run:\n\n| Run | What I changed | What I expected | What happened | Next step |\n|---|---|---|---|---|\n| 1 | Nothing: first version, speed 30 | It follows the whole track | It lost the line on the sharp curve | Try a lower speed |\n| 2 | Speed 30 → 20 | It stays on the line in the curve | Track completed in 48 seconds | Repeat to check |\n| 3 | No change | The same as run 2 | Track completed in 50 seconds | Test in the shadow by the window |\n\nThree habits make a test log useful:\n\n- **Change one thing at a time.** If you change the speed and the threshold together, you will not know which one helped.\n- **Repeat runs.** Batteries, light and wheel grip change, so one good run proves little. Aim for 3 runs per version.\n- **Write down failures too.** A failure with a clear note is the most useful row in the log.\n\n**Paper robot?** One run means moving your counter through one test section (straight, gentle curve, sharp curve, finish bar) and writing down each sensor reading and decision. Your improvements are logic fixes, such as the order of the tests or what to do when both sensors see white.\n\n**Common problems and first things to try**\n\n- It overshoots curves: lower the speed, or make it turn more sharply.\n- It drives off the end, or loses the line on a curve: check your finish bar; to find a lost line again, remember which way you last turned and keep turning that way.\n- It loses the line in some places: check the lighting and your threshold.\n- It turns the wrong way: the left and right sensors or motors may be swapped.\n- It hits walls it meets at an angle: a slanted wall can bounce the echo away from the sensor; turn further, or add a second sensor.\n\n**If you used an AI tool** to help you find a bug, note it in the log, and check its suggestion with a test, like any other idea.',
                },
                fr: {
                  heading: 'Teste comme un ingénieur',
                  body: 'Un robot qui fonctionne une fois a eu de la chance. Un robot qui fonctionne à chaque fois a été **testé**. Tiens un **journal de tests**, avec une ligne par essai\u00a0:\n\n| Essai | Ce que j’ai changé | Ce que j’attendais | Ce qui s’est passé | Prochaine étape |\n|---|---|---|---|---|\n| 1 | Rien\u00a0: première version, vitesse 30 | Il suit toute la piste | Il a perdu la ligne dans le virage serré | Essayer une vitesse plus faible |\n| 2 | Vitesse 30 → 20 | Il reste sur la ligne dans le virage | Piste terminée en 48\u00a0secondes | Recommencer pour vérifier |\n| 3 | Aucun changement | La même chose qu’à l’essai 2 | Piste terminée en 50\u00a0secondes | Tester dans l’ombre, près de la fenêtre |\n\nTrois habitudes rendent un journal de tests utile\u00a0:\n\n- **Ne change qu’une chose à la fois.** Si tu modifies en même temps la vitesse et le seuil, tu ne sauras pas lequel des deux a aidé.\n- **Répète les essais.** Les piles, la lumière et l’adhérence des roues changent\u00a0: un seul bon essai ne prouve pas grand-chose. Vise 3 essais par version.\n- **Note aussi les échecs.** Un échec accompagné d’une note claire est la ligne la plus utile du journal.\n\n**Robot de papier\u00a0?** Un essai consiste à faire passer ton pion sur une section de test (ligne droite, virage doux, virage serré, barre d’arrivée) en notant chaque mesure des capteurs et chaque décision. Tes améliorations corrigent la logique, par exemple l’ordre des tests ou ce que fait le robot quand les deux capteurs voient du blanc.\n\n**Problèmes fréquents et premières pistes**\n\n- Il sort des virages\u00a0: réduis la vitesse, ou fais-le tourner plus franchement.\n- Il dépasse le bout de la ligne, ou perd la ligne dans un virage\u00a0: vérifie ta barre d’arrivée\u00a0; pour retrouver une ligne perdue, retiens de quel côté il a tourné en dernier et continue de tourner de ce côté.\n- Il perd la ligne à certains endroits\u00a0: vérifie l’éclairage et ton seuil.\n- Il tourne du mauvais côté\u00a0: les capteurs ou les moteurs gauche et droit sont peut-être inversés.\n- Il heurte les murs qu’il aborde en biais\u00a0: un mur incliné peut renvoyer l’écho loin du capteur\u00a0; tourne davantage, ou ajoute un deuxième capteur.\n\n**Si tu as utilisé un outil d’IA** pour t’aider à trouver une erreur, note-le dans le journal, et vérifie sa suggestion par un test, comme n’importe quelle autre idée.',
                },
              },
              data: {},
            },
            {
              id: 'm3-l2-b3',
              type: 'ai_activity',
              stage: 'ask_ai',
              defaultLocale: 'en',
              translations: {
                en: {
                  instructions:
                    'Use this once you have started the project below. When your test log has at least three rows, paste it into the AI tutor (with no names in it) and ask it to check the log. Does every row say what you changed and what happened? What should you test next? You decide which advice to follow.',
                  starterPrompt:
                    'Here is my robot test log. Can you check that each row says what I changed, what I expected and what happened, and suggest one more test I could run?',
                },
                fr: {
                  instructions:
                    'Sers-toi de cette activité une fois ton projet commencé (il se trouve plus bas). Quand ton journal de tests compte au moins trois lignes, colle-le dans le tuteur IA (sans aucun nom) et demande-lui de le vérifier. Chaque ligne indique-t-elle ce que tu as changé et ce qui s’est passé\u00a0? Que devrais-tu tester ensuite\u00a0? C’est toi qui décides quels conseils suivre.',
                  starterPrompt:
                    'Voici le journal de tests de mon robot. Peux-tu vérifier que chaque ligne indique ce que j’ai changé, ce que j’attendais et ce qui s’est passé, et me proposer un essai supplémentaire\u00a0?',
                },
              },
              data: { tutorMode: 'check_my_work', labToolId: null },
            },
            {
              id: 'm3-l2-b4',
              type: 'project',
              stage: 'build',
              defaultLocale: 'en',
              translations: {
                en: {
                  intro:
                    'Your project: plan, program, test and improve your own autonomous robot, then show your work. It usually takes more than one session. Read the brief and the requirements carefully: they say exactly what your teacher will look at.',
                },
                fr: {
                  intro:
                    'Ton projet\u00a0: conçois, programme, teste et améliore ton propre robot autonome, puis présente ton travail. Il demande en général plus d’une séance. Lis attentivement la consigne et les exigences\u00a0: elles indiquent exactement ce que ton enseignant va regarder.',
                },
              },
              data: { projectId: 'project-1' },
            },
            {
              id: 'm3-l2-b5',
              type: 'quiz',
              stage: 'check',
              defaultLocale: 'en',
              translations: {
                en: { intro: 'Final check: building, testing and working safely.' },
                fr: {
                  intro:
                    'Dernière vérification\u00a0: construire, tester et travailler en sécurité.',
                },
              },
              data: { quizId: 'quiz-m3' },
            },
            {
              id: 'm3-l2-b6',
              type: 'reflection',
              stage: 'reflect',
              defaultLocale: 'en',
              translations: {
                en: {
                  prompt:
                    'What was the most useful change you made to your robot? Explain how your test log showed that it helped, and what you would improve next.',
                },
                fr: {
                  prompt:
                    'Quelle a été la modification la plus utile apportée à ton robot\u00a0? Explique comment ton journal de tests a montré qu’elle était utile, et ce que tu améliorerais ensuite.',
                },
              },
              data: { minLength: 60 },
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
            title: 'Check: how robots work',
            instructions: 'Six questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: comment fonctionne un robot',
            instructions: 'Six questions. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
              en: { prompt: 'Which of these machines is a robot?' },
              fr: { prompt: 'Laquelle de ces machines est un robot\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A remote-control car that a person steers' },
                  fr: { text: 'Une voiture télécommandée qu’une personne dirige' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A robot vacuum that detects a wall and turns by itself' },
                  fr: { text: 'Un robot aspirateur qui détecte un mur et tourne tout seul' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A toaster that pops up after two minutes' },
                  fr: { text: 'Un grille-pain qui éjecte les tartines au bout de deux minutes' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The vacuum senses the wall, decides with its program and acts by turning, on its own. The car is steered by a person, and the toaster only runs a timer.',
              },
              fr: {
                text: 'L’aspirateur perçoit le mur, décide grâce à son programme et agit en tournant, tout seul. La voiture est dirigée par une personne, et le grille-pain suit seulement une minuterie.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: { prompt: 'Which of these are sensors? Choose all the right answers.' },
              fr: {
                prompt:
                  'Lesquels de ces éléments sont des capteurs\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'An ultrasonic distance sensor' },
                  fr: { text: 'Un capteur de distance à ultrasons' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A wheel motor' },
                  fr: { text: 'Un moteur de roue' },
                },
              },
              {
                id: 'c',
                translations: { en: { text: 'A camera' }, fr: { text: 'Une caméra' } },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'A bump switch' },
                  fr: { text: 'Un capteur de contact (pare-chocs)' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'A servo that moves a gripper' },
                  fr: { text: 'Un servomoteur qui actionne une pince' },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Sensors measure the world: distance, images, touch. Motors and servos are actuators: they make the robot move.',
              },
              fr: {
                text: 'Les capteurs mesurent le monde\u00a0: distance, images, contact. Les moteurs et les servomoteurs sont des actionneurs\u00a0: ils font bouger le robot.',
              },
            },
          },
          {
            id: 'q3',
            type: 'true_false',
            points: 1,
            translations: {
              en: { prompt: 'When a robot decides what to do, it thinks and feels like a person.' },
              fr: {
                prompt:
                  'Quand un robot décide quoi faire, il pense et ressent les choses comme une personne.',
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
                text: 'False. Its decide step is a program doing calculations, even when it uses AI. People design it and stay responsible for it.',
              },
              fr: {
                text: 'Faux. Son étape «\u00a0décider\u00a0» est un programme qui fait des calculs, même quand il utilise de l’IA. Ce sont des personnes qui le conçoivent et qui en restent responsables.',
              },
            },
          },
          {
            id: 'q4',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'How does an ultrasonic sensor measure a distance?' },
              fr: { prompt: 'Comment un capteur à ultrasons mesure-t-il une distance\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'It sends a sound pulse and times how long the echo takes to come back',
                  },
                  fr: {
                    text: 'Il envoie une impulsion sonore et mesure le temps que met l’écho à revenir',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It measures how much light bounces back from the object' },
                  fr: { text: 'Il mesure la quantité de lumière renvoyée par l’objet' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It listens for the sound that the object makes' },
                  fr: { text: 'Il écoute le bruit que fait l’objet' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Like a bat: it makes its own sound and times the echo. The longer the echo takes to come back, the farther away the object is. Measuring reflected light is how a line or infrared sensor works.',
              },
              fr: {
                text: 'Comme une chauve-souris\u00a0: il émet lui-même un son et chronomètre l’écho. Plus l’écho met de temps à revenir, plus l’objet est loin. Mesurer la lumière renvoyée, c’est ce que fait un capteur de ligne ou infrarouge.',
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
                  'A line sensor shines light on the floor. Over the black line, what does it measure?',
              },
              fr: {
                prompt:
                  'Un capteur de ligne éclaire le sol. Au-dessus de la ligne noire, que mesure-t-il\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'More reflected light than over the white floor' },
                  fr: { text: 'Plus de lumière renvoyée qu’au-dessus du sol blanc' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Less reflected light than over the white floor' },
                  fr: { text: 'Moins de lumière renvoyée qu’au-dessus du sol blanc' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Exactly the same amount of light' },
                  fr: { text: 'Exactement la même quantité de lumière' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Black absorbs most of the light and white reflects a lot of it, so the reading drops over the line.',
              },
              fr: {
                text: 'Le noir absorbe la plus grande partie de la lumière et le blanc en renvoie beaucoup\u00a0: la mesure baisse au-dessus de la ligne.',
              },
            },
          },
          {
            id: 'q6',
            type: 'short_answer',
            points: 1,
            translations: {
              en: { prompt: 'Complete the robot loop: sense → ? → act (one word)' },
              fr: {
                prompt: 'Complète la boucle du robot\u00a0: percevoir →\u00a0? → agir (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'decide',
                'decides',
                'deciding',
                'decision',
                'think',
                'plan',
                'compute',
                'process',
                'choose',
              ],
              fr: [
                'décider',
                'décide',
                'décision',
                'penser',
                'réfléchir',
                'planifier',
                'calculer',
                'traiter',
                'choisir',
              ],
            },
            explanation: {
              en: {
                text: 'Decide: the controller runs its program to choose an action. Engineers often say think, but it is a calculation, not thinking.',
              },
              fr: {
                text: 'Décider\u00a0: le contrôleur exécute son programme pour choisir une action. On dit parfois «\u00a0penser\u00a0», mais c’est un calcul, pas une réflexion.',
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
            title: 'Check: robots that see and decide',
            instructions: 'Six questions about robot vision and decisions. You need 70% to pass.',
          },
          fr: {
            title: 'Quiz\u00a0: des robots qui voient et qui décident',
            instructions:
              'Six questions sur la vision et les décisions des robots. Il faut 70\u00a0% pour réussir.',
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
              en: { prompt: "To a robot's computer, what is a camera image?" },
              fr: {
                prompt: 'Pour l’ordinateur d’un robot, qu’est-ce qu’une image de caméra\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A grid of numbers, a few for each pixel' },
                  fr: { text: 'Une grille de nombres, quelques-uns pour chaque pixel' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'A sentence that describes what is in front of it' },
                  fr: { text: 'Une phrase qui décrit ce qui se trouve devant lui' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A list of the objects that the camera recognised' },
                  fr: { text: 'Une liste des objets que la caméra a reconnus' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Each pixel is stored as numbers, often values for red, green and blue. The camera recognises nothing by itself: computer vision turns those numbers into useful information.',
              },
              fr: {
                text: 'Chaque pixel est enregistré sous forme de nombres, souvent des valeurs de rouge, de vert et de bleu. La caméra ne reconnaît rien elle-même\u00a0: c’est la vision par ordinateur qui transforme ces nombres en informations utiles.',
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
                  'A vision model trained only on photos of a bright, empty classroom fails in a dim, busy corridor. What would make it more reliable? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Un modèle de vision entraîné uniquement avec des photos d’une classe vide et bien éclairée échoue dans un couloir sombre et animé. Qu’est-ce qui le rendrait plus fiable\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Add training photos taken in dim light and in corridors' },
                  fr: {
                    text: 'Ajouter des photos d’entraînement prises dans la pénombre et dans des couloirs',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Test it in the place where it will really be used' },
                  fr: { text: 'Le tester à l’endroit où il sera vraiment utilisé' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Trust it more, because it scored 99% in the classroom' },
                  fr: {
                    text: 'Lui faire davantage confiance, puisqu’il a obtenu 99\u00a0% dans la classe',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Include examples with different backgrounds and angles' },
                  fr: {
                    text: 'Inclure des exemples avec des arrière-plans et des angles différents',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'If it must spot people, include children, adults and wheelchair users in the examples',
                  },
                  fr: {
                    text: 'S’il doit repérer des personnes, inclure des enfants, des adultes et des personnes en fauteuil roulant dans les exemples',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A model only knows what it was shown. Varied training data, with every kind of person it must detect, and tests in the real place make it more reliable; leaving some people out causes bias. A high score in one place proves little about another.',
              },
              fr: {
                text: 'Un modèle ne connaît que ce qu’on lui a montré. Des données d’entraînement variées, avec toutes les sortes de personnes qu’il doit détecter, et des tests sur place le rendent plus fiable\u00a0; laisser certaines personnes de côté crée des biais. Un bon score à un endroit ne prouve pas grand-chose ailleurs.',
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
                  'When a vision model says "stop sign, 92%", it is certain that it is looking at a stop sign.',
              },
              fr: {
                prompt:
                  'Quand un modèle de vision indique «\u00a0panneau stop, 92\u00a0%\u00a0», il est certain de voir un panneau stop.',
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
                text: 'False. 92% is a confidence score: a well-informed guess that can still be wrong, especially in conditions unlike its training data.',
              },
              fr: {
                text: 'Faux. 92\u00a0% est un score de confiance\u00a0: une estimation bien informée qui peut quand même être fausse, surtout dans des conditions différentes de ses données d’entraînement.',
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
                  'Which job is best done by a fixed if/then rule rather than a learned model?',
              },
              fr: {
                prompt:
                  'Quelle tâche vaut-il mieux confier à une règle fixe «\u00a0si… alors\u00a0» plutôt qu’à un modèle appris\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Stop all motors when the bumper is pressed' },
                  fr: { text: 'Arrêter tous les moteurs quand le pare-chocs est enfoncé' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Recognise every kind of plastic bottle in a pile of rubbish' },
                  fr: {
                    text: 'Reconnaître toutes les sortes de bouteilles en plastique dans un tas de déchets',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Tell apart 100 kinds of plants from photos' },
                  fr: { text: 'Distinguer 100 espèces de plantes sur des photos' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A bumper gives a simple, reliable signal, and a safety stop must be predictable. Recognising bottles or plants needs a model trained on many examples.',
              },
              fr: {
                text: 'Un pare-chocs donne un signal simple et fiable, et un arrêt de sécurité doit être prévisible. Reconnaître des bouteilles ou des plantes demande un modèle entraîné sur de nombreux exemples.',
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
                  'An obstacle avoider switches from DRIVING to TURNING when the distance is below 20 cm, and from TURNING back to DRIVING when it is above 50 cm. It starts in DRIVING and reads 40, then 15, then 35. Which state is it in now?',
              },
              fr: {
                prompt:
                  'Un robot éviteur d’obstacles passe de DRIVING à TURNING quand la distance est inférieure à 20\u00a0cm, et de TURNING à DRIVING quand elle dépasse 50\u00a0cm. Il démarre en DRIVING et mesure 40, puis 15, puis 35. Dans quel état est-il maintenant\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: { en: { text: 'DRIVING' }, fr: { text: 'DRIVING' } },
              },
              {
                id: 'b',
                translations: { en: { text: 'TURNING' }, fr: { text: 'TURNING' } },
              },
              {
                id: 'c',
                translations: { en: { text: 'STOPPED' }, fr: { text: 'STOPPED' } },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: '40 keeps it in DRIVING, 15 switches it to TURNING, and 35 is not above 50, so it stays in TURNING.',
              },
              fr: {
                text: '40 le laisse en DRIVING, 15 le fait passer en TURNING, et 35 ne dépasse pas 50\u00a0: il reste donc en TURNING.',
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
                  'In a state machine, what do we call each mode the robot can be in, such as DRIVING or TURNING? (one word)',
              },
              fr: {
                prompt:
                  'Dans une machine à états, comment appelle-t-on chaque mode dans lequel le robot peut se trouver, comme DRIVING ou TURNING\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['state', 'states', 'a state', 'the state', 'the states'],
              fr: ['état', 'états', 'un état', 'l’état', "l'état", 'les états'],
            },
            explanation: {
              en: {
                text: 'A state. The robot is in exactly one state at a time, and transitions move it from one state to another.',
              },
              fr: {
                text: 'Un état. Le robot se trouve dans un seul état à la fois, et les transitions le font passer d’un état à un autre.',
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
            title: 'Check: build, test and stay safe',
            instructions:
              'Six questions about building and testing your robot. You need 70% to pass.',
          },
          fr: {
            title: 'Quiz\u00a0: construire, tester et rester en sécurité',
            instructions:
              'Six questions sur la construction et les tests de ton robot. Il faut 70\u00a0% pour réussir.',
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
                  'A line follower has one sensor on each side of the line. The left sensor sees black and the right sensor sees white. What should it do?',
              },
              fr: {
                prompt:
                  'Un suiveur de ligne a un capteur de chaque côté de la ligne. Le capteur gauche voit du noir et le capteur droit du blanc. Que doit-il faire\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: { en: { text: 'Turn left' }, fr: { text: 'Tourner à gauche' } },
              },
              {
                id: 'b',
                translations: { en: { text: 'Turn right' }, fr: { text: 'Tourner à droite' } },
              },
              {
                id: 'c',
                translations: { en: { text: 'Stop' }, fr: { text: 'S’arrêter' } },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The line has drifted under the left sensor, so the robot turns left to bring it back between the two sensors.',
              },
              fr: {
                text: 'La ligne s’est décalée sous le capteur gauche\u00a0: le robot tourne à gauche pour la ramener entre les deux capteurs.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Your robot overshoots sharp curves. What is the best next test?' },
              fr: {
                prompt:
                  'Ton robot sort des virages serrés. Quel est le meilleur test à faire ensuite\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Change the speed, the threshold and the turning rule all at once' },
                  fr: {
                    text: 'Modifier en même temps la vitesse, le seuil et la règle pour tourner',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Lower only the speed, then do three runs on the same track' },
                  fr: {
                    text: 'Réduire seulement la vitesse, puis faire trois essais sur la même piste',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Run it once at full speed to see what happens' },
                  fr: { text: 'Le lancer une fois à pleine vitesse pour voir ce qui se passe' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Change one thing at a time and repeat the run, so that your test log shows which change made the difference.',
              },
              fr: {
                text: 'Ne change qu’une chose à la fois et répète l’essai\u00a0: ton journal de tests montrera ainsi quelle modification a fait la différence.',
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
                  'Which of these are good safety habits when you test a real robot? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquelles de ces habitudes sont de bonnes règles de sécurité quand tu testes un vrai robot\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Start at a low speed' },
                  fr: { text: 'Commencer à faible vitesse' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Keep fingers, hair and sleeves away from the wheels' },
                  fr: { text: 'Garder les doigts, les cheveux et les manches loin des roues' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Agree on how to stop the robot instantly before you start' },
                  fr: {
                    text: 'Convenir, avant de commencer, de la façon d’arrêter le robot immédiatement',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Test it near the edge of a table to see whether it stops in time' },
                  fr: {
                    text: 'Le tester près du bord d’une table pour voir s’il s’arrête à temps',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Keep charging a battery that feels hot or looks swollen' },
                  fr: { text: 'Continuer à recharger une batterie chaude ou gonflée' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A low speed, a safe distance and a known way to stop protect you. Table edges and damaged batteries are real dangers: clear the area, and tell an adult about a hot or swollen battery.',
              },
              fr: {
                text: 'Une vitesse réduite, une distance de sécurité et un moyen d’arrêt connu te protègent. Les bords de table et les batteries abîmées sont de vrais dangers\u00a0: dégage la zone, et signale à un adulte toute batterie chaude ou gonflée.',
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
                  "If an AI tool helped you write your robot's program, you should say so when you share your project.",
              },
              fr: {
                prompt:
                  'Si un outil d’IA t’a aidé à écrire le programme de ton robot, tu dois l’indiquer quand tu présentes ton projet.',
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
                text: 'True. Crediting AI help is honest, and it lets your teacher see what you did yourself.',
              },
              fr: {
                text: 'Vrai. Indiquer l’aide de l’IA, c’est honnête, et cela permet à ton enseignant de voir ce que tu as fait toi-même.',
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
                  "What do we call the button or switch that stops all of a robot's motors immediately? (two or three words)",
              },
              fr: {
                prompt:
                  'Comment appelle-t-on le bouton ou l’interrupteur qui arrête immédiatement tous les moteurs d’un robot\u00a0? (deux ou trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'emergency stop',
                'an emergency stop',
                'the emergency stop',
                'emergency stop button',
                'e-stop',
                'estop',
                'stop button',
                'kill switch',
                'emergency switch',
                'emergency button',
              ],
              fr: [
                'arrêt d’urgence',
                "arrêt d'urgence",
                'bouton d’arrêt d’urgence',
                "bouton d'arrêt d'urgence",
                'bouton d’arrêt',
                "bouton d'arrêt",
                'interrupteur d’urgence',
                "interrupteur d'urgence",
                "bouton d'urgence",
                'bouton stop',
              ],
            },
            explanation: {
              en: {
                text: 'An emergency stop. Agree how you will use it before every test on real hardware.',
              },
              fr: {
                text: 'Un arrêt d’urgence. Mets-toi d’accord sur la façon de l’utiliser avant chaque essai sur du vrai matériel.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Why do engineers keep a test log?' },
              fr: { prompt: 'Pourquoi les ingénieurs tiennent-ils un journal de tests\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'To see which change made a difference, and to avoid repeating ideas that failed',
                  },
                  fr: {
                    text: 'Pour voir quelle modification a fait la différence, et éviter de répéter des idées qui ont échoué',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'To prove that the robot works after one good run' },
                  fr: { text: 'Pour prouver que le robot fonctionne après un seul bon essai' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'So that the AI tutor can fix the robot for you' },
                  fr: { text: 'Pour que le tuteur IA puisse réparer le robot à ta place' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The log turns test runs into evidence: what you changed, what you expected and what really happened. One good run proves little, and you, not an AI tool, decide what to change.',
              },
              fr: {
                text: 'Le journal transforme les essais en preuves\u00a0: ce que tu as changé, ce que tu attendais et ce qui s’est réellement passé. Un seul bon essai ne prouve pas grand-chose, et c’est toi, pas un outil d’IA, qui décides quoi changer.',
              },
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
            title: 'My autonomous robot',
            brief:
              'Plan, program, test and improve a robot that completes Mission A (a line follower that stops at the finish bar) or Mission B (an obstacle avoider that explores for 60 seconds without touching anything). Build it on a robot simulator if your teacher gives you one, on a classroom kit with an adult present, or as a paper robot with a dry run. Run at least three tests, record them in a test log, make at least one improvement based on what your tests showed, and explain how your robot decides what to do.',
            requirements:
              "Submit your work as text, code, a link, images, a short video or a PDF. It must include:\n\n1. Your plan: the mission, measurable success criteria, the sensors and actuators, and a state table or drawing.\n2. Your program, in blocks or Python, with the SENSE, DECIDE and ACT parts labelled.\n3. Your test log: at least three runs and at least one improvement (what you changed, why, and what happened).\n4. An explanation of 5 to 8 sentences: how your robot decides what to do, one limit it still has, and what you would improve next.\n5. A safety note: how you kept your tests safe.\n6. AI help: if an AI tool helped you, what it did and how you checked it.\n\nYour teacher looks at: a plan, a program and a test log that fit together (technical quality); a clear explanation of sense, decide and act and of your robot's limits (understanding); your own improvement or extension (creativity); and safe testing, honest credit for AI help and no personal data (responsible use of AI).\n\nBefore you submit, ask the AI tutor (in the Ask AI step of this lesson) to check your test log. If you film the robot, film only the robot: no faces, no names, no school logos. Mute the sound or make sure nobody says a name. Upload your video here or use a link your teacher approves; never post it publicly.",
          },
          fr: {
            title: 'Mon robot autonome',
            brief:
              'Conçois, programme, teste et améliore un robot qui réussit la mission A (un suiveur de ligne qui s’arrête sur la barre d’arrivée) ou la mission B (un éviteur d’obstacles qui explore une zone pendant 60\u00a0secondes sans rien toucher). Réalise-le sur un simulateur de robot si ton enseignant t’en propose un, sur un kit de ta classe en présence d’un adulte, ou sous forme de robot de papier avec un essai à blanc. Fais au moins trois essais, note-les dans un journal de tests, apporte au moins une amélioration fondée sur ce que tes tests ont montré, et explique comment ton robot décide quoi faire.',
            requirements:
              'Envoie ton travail sous forme de texte, de code, de lien, d’images, d’une courte vidéo ou de PDF. Il doit contenir\u00a0:\n\n1. Ton plan\u00a0: la mission, des critères de réussite mesurables, les capteurs et les actionneurs, et un tableau ou un dessin des états.\n2. Ton programme, en blocs ou en Python, avec les parties SENSE (percevoir), DECIDE (décider) et ACT (agir) repérées.\n3. Ton journal de tests\u00a0: au moins trois essais et au moins une amélioration (ce que tu as changé, pourquoi, et ce qui s’est passé).\n4. Une explication de 5 à 8 phrases\u00a0: comment ton robot décide quoi faire, une limite qu’il a encore, et ce que tu améliorerais ensuite.\n5. Une note de sécurité\u00a0: comment tu as fait pour que tes essais restent sûrs.\n6. L’aide de l’IA\u00a0: si un outil d’IA t’a aidé, ce qu’il a fait et comment tu l’as vérifié.\n\nTon enseignant regarde\u00a0: un plan, un programme et un journal de tests cohérents entre eux (qualité technique)\u00a0; une explication claire de la boucle percevoir, décider, agir et des limites de ton robot (compréhension)\u00a0; ton amélioration ou ton extension personnelle (créativité)\u00a0; et des essais sûrs, une mention honnête de l’aide de l’IA et aucune donnée personnelle (usage responsable de l’IA).\n\nAvant de rendre ton projet, demande au tuteur IA (à l’étape «\u00a0Demander à l’IA\u00a0» de cette leçon) de vérifier ton journal de tests. Si tu filmes le robot, ne filme que le robot\u00a0: pas de visages, pas de noms, pas de logo de ton école. Coupe le son ou vérifie que personne ne prononce de nom. Dépose ta vidéo ici ou utilise un lien approuvé par ton enseignant\u00a0; ne la publie jamais en ligne.',
          },
        },
        allowedSubmissionTypes: ['text', 'code', 'link', 'image', 'video', 'pdf'],
        rubric: [
          { key: 'technicalQuality', weight: 40 },
          { key: 'understanding', weight: 30 },
          { key: 'creativity', weight: 15 },
          { key: 'responsibleAi', weight: 15 },
        ],
        xpReward: 300,
        requiredForCertificate: true,
      },
    },
  ],
};
