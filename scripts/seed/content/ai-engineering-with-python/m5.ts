// Module m5 of "AI Engineering with Python" (ages 14-16): the engineering challenge, the last
// module of the course. It comes after m1 (Python for AI), m2 (machine learning basics), m3
// (language and vision) and m4 (APIs and automation), and its final project, project-m5, is
// required for the certificate. It refers back to the mistakes of the roof weather station club
// (the 72% forecast beaten by the 75% "always no rain" rule of "Classification, regression and
// evaluation"; the crash at comment 61 of "Calling AI services safely"; the weekend run of
// "Automate and test a pipeline", stopped at comment 212 and restarted from the beginning, which
// counted the first 211 comments twice), to the CSV files of "Working with data", to the sealed
// test set, the baseline and
// the cost of mistakes of m2-l1, to the key rules of "Predict outcomes with Python" and "Classify
// text from Python", to the model card of "Computer vision with ready-trained models", to the
// 0-100 versus 0-1 confidence of "Calling AI services safely", and to the tests, failing tests and
// human in the loop of "Automate and test a pipeline"; it teaches none of them again. One new
// idea: a practice set (a validation set, not named so) to compare versions while the sealed test
// set stays closed; in French it is the « jeu de mise au point » (« jeu d’essai » would read as
// test data). Other modules and lessons are named, not numbered, in the text.
// One invented worked example runs through both lessons: the club's "Water today?" advisor for
// the school's vegetable garden, a numbers model (the day before's rain, maximum temperature and
// humidity from the roof station) that shows Water today, No need today or Check the soil on the
// hall screen by 7:30. Its numbers are invented and consistent: 80 logged mornings from September
// to December, 22 dry and 58 not dry ("never water" right on 58, about 73%), split by time into 50
// to train (13 dry), 10 practice mornings (3 dry, 7 not) and 20 sealed test mornings (6 dry, 14
// not). Success criteria: at most 1 in 10 dry mornings missed, at most 1 in 4 of the others
// watered for nothing, at most 1 in 4 of all mornings sent to a person, every behaviour test
// passed. Build log, on the practice set: never water misses 3 of 3, always water wastes 7 of 7,
// v1 misses 1 and wastes 1, v2 (threshold 70) misses 0, wastes 1 and sends 2 of 10 to a person;
// the missing-reading check is a behaviour fix, added with its test b3, that changes no practice
// result (one change at a time). The sealed test, as the presentation of m5-l2 reports it: of the
// 6 dry mornings, 4 caught, 1 sent to a person and 1 missed (the windy morning m4: the station has
// no wind sensor); of the 14 others, 2 watered for nothing, 3 sent to a person and 9 right; 4 of
// 20 sent to a person. The quiz's short answer (always water wastes 14) follows from it. On the 8
// mornings of the code activity, the stand-in model gives the trained model's answers and
// confidences (m2 no_need at 90, m3 water at 65, m4 no_need at 75), and the text says so. In the
// starter code, b1, b2 and b4 rely on the stand-in's answers: a comment and step 8 say how to
// replace them with a fixed-confidence fake model; the test table of m5-l2-b3 uses only
// behaviour rows whose result is certain (b1 checks the message is shown by 7:30, b7 a confidence
// of exactly 70).
// m5-l1: requirements (users first, the AI's one job and what it does not do, must / should /
// could / won't, vague versus testable), a data plan (source, labels and their rule, counts and
// balance, split, privacy, storage, licence), success criteria written before building (the cost
// of mistakes, each kind counted, the work handed to people, baselines, a test set big enough),
// risks and mitigations by kind, rated likely and bad, and the riskiest assumption tested first;
// three routes (Machine Learning for Kids, Python, a no-code tool such as Teachable Machine, with
// objects and made-up sounds only) and six invented ideas; an eleven-section one-page design
// document (try, on paper); a challenge_me tutor activity (the tutor as a design reviewer); the
// module quiz quiz-m5 (stage check, seven questions on m5-l1, where the outline puts it) and a
// reflection. No video block: no curated video in the course files is about planning, and the 45
// minutes are full; the module's watch stage is in m5-l2.
// m5-l2: building in steps (v0 baseline, v1 walking skeleton, one change at a time, a build log,
// saved versions, the sealed test set kept closed, time-boxing, secrets kept out); a test table
// with two kinds of rows (behaviour tests, which must all pass, and model tests, counted against
// the criteria), its columns and rules; limits written as facts (six questions, after the model
// card of m3-l2) and a 3-minute presentation (about 400 spoken words, five timed parts). The watch
// stage is the club's presentation, read aloud with a coach's notes, as m1 and m3 use written
// traces. Then the Python code activity (try), checked with Python 3.13: as given, it prints b1 to
// b4 PASS, "b5 | broken rain sensor | expected check_soil | got no_need | FAIL", "4 of 5 behaviour
// tests pass", the advice of m1 to m8 (water, no_need, check_soil, no_need, water, no_need,
// no_need, check_soil) and {'dry -> water': 1, 'not dry -> no_need': 3, 'dry -> check_soil': 1,
// 'dry -> no_need': 1, 'not dry -> water': 1, 'not dry -> check_soil': 1}: criterion 1 not met (1
// of 3), 2 met (1 of 5), 3 met at the limit (2 of 8). With TODO 1 (rain below 0, humidity outside
// 0-100), b5 passes and a humidity of 120 gives check_soil; meets_criteria, written as the hint
// suggests, prints not met, met, met. At THRESHOLD = 80, m3, m4, m7 and m8 go to a person (4 of
// 8: criterion 3 breaks), nothing is missed, and b5 passes even without TODO 1, for the wrong
// reason. The baselines on the 8 mornings, by hand: always water misses 0 of 3 and wastes 5 of 5;
// never water misses 3 of 3 and wastes none. Then a check_my_work tutor activity (not in the
// outline: added so that the learner's test table is checked before the hand-in), the project
// block (build) and a reflection.
// No Machine Learning for Kids activity block: the learner chooses the project type, and an
// ml_activity block names one, so the site is one route of the project instead, in the text.
// Facts used, from the site's code at taxinomitis f360de1: Try it now projects "will be deleted
// after (at least) four hours" (en.json TRY_NOW_EXPLANATION); one project at a time
// (NEWPROJECT.ERRORS.TRYITNOW); saving and loading projects is for accounts only, and accounts
// keep projects between lessons (the grid and the text of HELP.ACCOUNTISSUES); the training page
// asks for at least five examples of each label, eight for sounds (minimumExamples in
// models.controller.js), although reviewTrainingData in models.service.js lets a text, images or
// numbers project train with one label short, so the text says "asks for", not "needs"; a sounds
// project needs every label at eight. Camera and microphone routes say that the webcam or the
// microphone needs the teacher's permission (no ml_activity notice covers them here), and pose
// models are excluded. If the sites are blocked, m5-l1-b5 gives a fallback: the Python route with
// a hand-written stand-in model, traced by hand.
// No worksheet is linked: the course's own activities (Titanic, Make me happy, Mobilenet) are
// named through their lessons. The French site's labels are Essayer maintenant and Apprendre &
// Tester. Teachable Machine is described as in from-ai-user-to-ai-developer m2-l1.
// project-m5 (kind project, 500 XP, required for the certificate) takes code, text, link, pdf or
// image. A submission has one type, so the requirements say how to send its six parts (one PDF;
// code, with the rest in "About your work"; text; up to five photos; or a link). Its rubric
// weighs technical quality 35, understanding 25, responsible AI 25 and creativity 15, as the
// capstone of from-ai-user-to-ai-developer. The instructions and hints of code_activity and
// ai_activity blocks, reflection prompts, quiz texts and project texts are plain text (the player
// renders no Markdown there), so they use no backticks, as in m1 to m4. French typography uses
// \u00a0 escapes, as in the other course files. No personal data: every idea, reading and test
// case is invented. The data plan's source row says why the station's spring readings of m1 and
// m2 are not in the advisor's data (the soil checks, its labels, began in September), and
// project-m5 names the two lessons by title, since a project is also read away from its lesson.

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
          title: 'Engineering challenge',
          description:
            'Plan, build, test and present a small AI system that solves a real problem, with its design document and its test results. This is your final project, and it is required for the certificate.',
        },
        fr: {
          title: 'Défi d’ingénierie',
          description:
            'Conçois, construis, teste et présente un petit système d’IA qui résout un vrai problème, avec son document de conception et ses résultats de tests. C’est ton projet final, et il est nécessaire pour obtenir le certificat.',
        },
      },
    },
    lessons: [
      // --- m5-l1: Plan your AI system -----------------------------------------------------------
      {
        id: 'm5-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Plan your AI system',
              summary:
                'Turn an idea into a one-page design document: requirements you can test, a data plan, success criteria with baselines, risks and their mitigations, and a route that fits your tools.',
            },
            fr: {
              title: 'Planifie ton système d’IA',
              summary:
                'Transforme une idée en document de conception d’une page\u00a0: des exigences vérifiables, un plan de données, des critères de réussite avec leurs références, les risques et leurs parades, et une voie adaptée à tes outils.',
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
                heading: 'One page before the first line of code',
                body: "In this course, the club of the roof weather station made the classic mistakes of AI engineering, and each one would have been cheap to catch on paper:\n\n- its first forecast scored 72%, which sounded good until the rule *always no rain* scored 75% (*Classification, regression and evaluation*);\n- its first comment script crashed at comment 61 (*Calling AI services safely*), and its weekend run, restarted from the beginning after it stopped at comment 212, counted the first 211 comments twice (*Automate and test a pipeline*);\n- nobody had decided in advance what *good enough* meant, what to do when the model was unsure, or which data must never leave the school.\n\nNone of these is a coding problem. Each one is a question that nobody asked before the first line of code: *Who is it for? What must it do? How will we know that it works? What could go wrong?* Engineers answer them in a short **design document** before they build, and keep it up to date while they build.\n\nThis module is your **engineering challenge**, and its project is required for your certificate. You will plan, build, test and present a small AI system that solves a real problem for people around you:\n\n1. **This lesson:** choose an idea and a route that fit your tools, then write a one-page design document.\n2. **Next lesson:** build your system in small steps, test it with a test table, write down its limits and present it in 3 minutes.\n\nTo show what each part looks like, the club takes on a challenge of its own alongside you: *Water today?*, an advisor for the school's vegetable garden. Its data and its numbers are invented for this module. Your system will be different: borrow the method, not the idea.",
              },
              fr: {
                heading: 'Une page avant la première ligne de code',
                body: 'Dans ce cours, le club de la station météo du toit a commis les erreurs classiques de l’ingénierie de l’IA, et chacune aurait pu être repérée à peu de frais sur papier\u00a0:\n\n- sa première prévision obtenait 72\u00a0%, ce qui semblait bien, jusqu’à ce que la règle *toujours pas de pluie* obtienne 75\u00a0% (leçon *Classification, régression et évaluation*)\u00a0;\n- son premier script de commentaires a planté au 61e\u00a0commentaire (leçon *Appeler des services d’IA en toute sécurité*), et son traitement du week-end, relancé depuis le début après s’être arrêté au 212e, a compté deux fois les 211\u00a0premiers commentaires (leçon *Automatiser et tester un pipeline*)\u00a0;\n- personne n’avait décidé à l’avance ce que voulait dire *assez bon*, ce qu’il fallait faire quand le modèle doutait, ni quelles données ne devaient jamais sortir du lycée.\n\nAucun de ces problèmes n’est un problème de programmation. Chacun est une question que personne n’a posée avant la première ligne de code\u00a0: *Pour qui est-ce\u00a0? Que doit faire le système\u00a0? Comment saura-t-on qu’il marche\u00a0? Qu’est-ce qui peut mal tourner\u00a0?* Les ingénieurs y répondent dans un court **document de conception**, avant de construire, et le tiennent à jour pendant la construction.\n\nCe module est ton **défi d’ingénierie**, et son projet est nécessaire pour obtenir ton certificat. Tu vas planifier, construire, tester et présenter un petit système d’IA qui résout un vrai problème pour les gens autour de toi\u00a0:\n\n1. **Dans cette leçon\u00a0:** choisis une idée et une voie adaptées à tes outils, puis rédige un document de conception d’une page.\n2. **Dans la prochaine leçon\u00a0:** construis ton système par petites étapes, teste-le avec un tableau de tests, note ses limites et présente-le en 3\u00a0minutes.\n\nPour te montrer à quoi ressemble chaque partie, le club relève lui aussi un défi en même temps que toi\u00a0: *Arroser aujourd’hui\u00a0?*, un conseiller pour le potager du lycée. Ses données et ses chiffres sont inventés pour ce module. Ton système sera différent\u00a0: emprunte la méthode, pas l’idée.',
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
                heading: 'From a problem to requirements you can test',
                body: "**Start with people, not with a model.** Before you choose a tool, write down who has the problem, what happens today and why it matters. Ask two or three of those people what bothers them: their answers are worth more than your guesses. Ask them about the problem, never for their personal data.\n\nThe club's problem: volunteers water the vegetable beds before school, on a rota. Some mornings they water soil that is still wet after the rain; in a dry, windy week, nobody thinks of it and the lettuces wilt.\n\n**Give the AI one clear job, and say what it does not do.** Write the job as *input → output*:\n\n- *Water today?* reads the roof station's readings of the day before (rain, maximum temperature, humidity) and shows on the hall screen, by 7:30, one of three messages: *Water today*, *No need today* or *Check the soil*.\n- It does **not** water anything, choose the rota or replace a person's check when it is unsure. It uses no camera and no personal data.\n\n**Sort your requirements.** A **requirement** is something your system must do or respect. Sort them into *must* (or the system has failed), *should* (important, but it can wait) and *could* (only if there is time), and add a *won't* list: what you have decided not to do this time. That last list protects your time.\n\n**Make every requirement testable.** If you cannot say how you will check it, it is a wish:\n\n| Vague | Testable |\n|---|---|\n| *It should be reliable.* | On the sealed test mornings, it misses at most 1 dry morning in 10 and waters for nothing on at most 1 in 4 of the others. |\n| *It should be fast.* | The message is on the screen by 7:30 every school morning. |\n| *It should be safe.* | A missing or impossible reading always gives *Check the soil*, never a guess. |\n| *It should respect privacy.* | The data file has five columns: the date, three readings and the label. No name, photo or personal detail is stored or sent. |\n\n**Keep it small.** One clear job, done well and honestly tested, beats an impressive system that nobody has checked. If your idea needs three models, build the one that matters most.",
              },
              fr: {
                heading: 'D’un problème à des exigences vérifiables',
                body: '**Pars des personnes, pas d’un modèle.** Avant de choisir un outil, écris qui a le problème, ce qui se passe aujourd’hui et pourquoi c’est important. Demande à deux ou trois de ces personnes ce qui les gêne\u00a0: leurs réponses valent mieux que tes suppositions. Interroge-les sur le problème, jamais sur leurs données personnelles.\n\nLe problème du club\u00a0: des bénévoles arrosent les carrés du potager avant les cours, à tour de rôle. Certains matins, ils arrosent une terre encore mouillée par la pluie\u00a0; pendant une semaine sèche et venteuse, personne n’y pense et les salades flétrissent.\n\n**Confie à l’IA une seule mission claire, et dis ce qu’elle ne fait pas.** Écris la mission sous la forme *entrée → sortie*\u00a0:\n\n- *Arroser aujourd’hui\u00a0?* lit les mesures relevées la veille par la station du toit (pluie, température maximale, humidité) et affiche sur l’écran du hall, avant 7\u00a0h\u00a030, l’un de trois messages\u00a0: *Arroser aujourd’hui*, *Pas besoin aujourd’hui* ou *Vérifier la terre*.\n- Il n’arrose **rien**, ne choisit pas le tour de rôle et ne remplace pas la vérification d’une personne quand il doute. Il n’utilise ni caméra ni donnée personnelle.\n\n**Trie tes exigences.** Une **exigence** est une chose que ton système doit faire ou respecter. Classe-les en *obligatoire* (sinon le système a échoué), *souhaitable* (important, mais cela peut attendre) et *facultatif* (seulement s’il reste du temps), et ajoute une liste *pas cette fois*\u00a0: ce que tu as décidé de ne pas faire. Cette dernière liste protège ton temps.\n\n**Rends chaque exigence vérifiable.** Si tu ne peux pas dire comment tu la vérifieras, c’est un souhait\u00a0:\n\n| Vague | Vérifiable |\n|---|---|\n| *Il doit être fiable.* | Sur les matins du jeu de test scellé, il rate au plus 1\u00a0matin sec sur 10 et fait arroser pour rien au plus 1\u00a0matin sur 4 parmi les autres. |\n| *Il doit être rapide.* | Le message est à l’écran avant 7\u00a0h\u00a030 chaque matin de cours. |\n| *Il doit être sûr.* | Une mesure manquante ou impossible donne toujours *Vérifier la terre*, jamais une supposition. |\n| *Il doit respecter la vie privée.* | Le fichier de données a cinq colonnes\u00a0: la date, trois mesures et l’étiquette. On ne conserve et on n’envoie aucun nom, aucune photo, aucune information personnelle. |\n\n**Reste modeste.** Une seule mission claire, bien remplie et honnêtement testée, vaut mieux qu’un système impressionnant que personne n’a vérifié. Si ton idée demande trois modèles, construis celui qui compte le plus.',
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
                heading: 'A data plan and success criteria, written before you build',
                body: "**The data plan** says where every example comes from, before you collect a single one. For each question, the club's answer:\n\n| Question | *Water today?* |\n|---|---|\n| **Source** | The roof station's readings (as in *Working with data*), one row per school morning since September, when the soil checks began: its spring readings have no label |\n| **Label, and who gives it** | *dry* or *not dry*, from the check that the garden teacher agreed to make at 7:00 every morning this term, with one written rule: dry means no dampness 2 cm down, in the middle of bed 1 |\n| **How many, and how balanced** | 80 mornings so far: 22 dry and 58 not dry. Too few dry ones, so the club keeps logging |\n| **How they are split** | By time: the 50 oldest mornings to train, the next 10 as a **practice set** to compare versions, and the 20 most recent as the sealed **test set**, opened once, at the end |\n| **Privacy and consent** | Readings and labels only. The rota, with its names, stays out of the file |\n| **Where it is kept** | One CSV file in the club's folder, with a backup copy, so that the model can be rebuilt at any time |\n| **Licence and credit** | The data is the club's own. For any data you did not make yourself, check its licence and credit it |\n\nThe practice set is new: it lets you compare versions while you build, so that the test set stays sealed until the final result, as in *Classification, regression and evaluation*.\n\n**Success criteria** say what *good enough* means. You write them **before** you build, so that the results cannot bend them. Four steps:\n\n1. **Start from the cost of mistakes.** For the garden, a missed dry morning (wilted lettuces) is worse than watering for nothing (some wasted water and ten minutes).\n2. **Count each kind of mistake separately.** *Never water* would be right on 58 of the 80 mornings, about 73%, and would still miss every dry one. Accuracy alone hides that, so the club counts the dry mornings missed and the mornings watered for nothing.\n3. **Count the work you hand to people.** Each *Check the soil* costs a volunteer a minute: decide how many the users will accept.\n4. **Name the baselines to beat**: here, *always water* and *never water*. Each one fails one count completely: *always water* waters for nothing every time, and *never water* misses every dry morning. A model is worth the trouble only if it does well on both counts at once.\n\nThe club's criteria, on the sealed test set: at most **1 in 10** dry mornings missed, at most **1 in 4** of the other mornings watered for nothing, at most **1 in 4** of all mornings sent to a person, and every behaviour test passed. Behaviour tests check the code around the model, such as *a missing reading gives Check the soil*: you will write them in the next lesson.\n\nMake sure that the test set can show it: with 6 dry mornings among the 20, a single miss already breaks the first criterion. Collect enough examples of the rare label, or say honestly that the test is too small to be sure.",
              },
              fr: {
                heading:
                  'Un plan de données et des critères de réussite, écrits avant de construire',
                body: '**Le plan de données** indique d’où vient chaque exemple, avant même que tu en collectes un seul. Pour chaque question, la réponse du club\u00a0:\n\n| Question | *Arroser aujourd’hui\u00a0?* |\n|---|---|\n| **Source** | Les mesures de la station du toit (comme dans la leçon *Travailler avec des données*), une ligne par matin de cours depuis septembre, quand les vérifications de la terre ont commencé\u00a0: ses mesures du printemps n’ont pas d’étiquette |\n| **Étiquette, et qui la donne** | *sec* ou *pas sec*, d’après la vérification que l’enseignant responsable du potager a accepté de faire à 7\u00a0h chaque matin de ce trimestre, avec une règle écrite\u00a0: sec signifie aucune humidité à 2\u00a0cm de profondeur, au milieu du carré\u00a01 |\n| **Combien, et quel équilibre** | 80\u00a0matins pour l’instant\u00a0: 22\u00a0secs et 58\u00a0pas secs. Trop peu de matins secs\u00a0: le club continue de les noter |\n| **Comment on les répartit** | Par ordre chronologique\u00a0: les 50\u00a0matins les plus anciens pour l’entraînement, les 10\u00a0suivants comme **jeu de mise au point** pour comparer les versions, et les 20\u00a0plus récents comme **jeu de test** scellé, ouvert une seule fois, à la fin |\n| **Vie privée et consentement** | Seulement des mesures et des étiquettes. Le tableau du tour de rôle, avec ses noms, reste hors du fichier |\n| **Où on les range** | Un fichier CSV dans le dossier du club, avec une copie de secours, pour pouvoir reconstruire le modèle à tout moment |\n| **Licence et crédit** | Les données appartiennent au club. Pour toute donnée que tu n’as pas produite toi-même, vérifie sa licence et cite sa source |\n\nLe jeu de mise au point est nouveau\u00a0: il te permet de comparer les versions pendant la construction, pour que le jeu de test reste sous scellés jusqu’au résultat final, comme dans la leçon *Classification, régression et évaluation*.\n\n**Les critères de réussite** disent ce que signifie *assez bon*. Tu les écris **avant** de construire, pour que les résultats ne puissent pas les faire plier. Quatre étapes\u00a0:\n\n1. **Pars du coût des erreurs.** Pour le potager, un matin sec raté (des salades flétries) est pire qu’un arrosage pour rien (un peu d’eau gaspillée et dix minutes).\n2. **Compte chaque type d’erreur séparément.** *Ne jamais arroser* aurait raison sur 58 des 80\u00a0matins, soit environ 73\u00a0%, et raterait pourtant tous les matins secs. L’exactitude seule le cache\u00a0: le club compte donc les matins secs ratés et les matins arrosés pour rien.\n3. **Compte le travail que tu confies aux personnes.** Chaque *Vérifier la terre* coûte une minute à un bénévole\u00a0: décide combien les utilisateurs en accepteront.\n4. **Nomme les références à battre**\u00a0: ici, *toujours arroser* et *ne jamais arroser*. Chacune échoue complètement sur un compte\u00a0: *toujours arroser* fait arroser pour rien à chaque fois, et *ne jamais arroser* rate tous les matins secs. Un modèle ne vaut la peine que s’il s’en sort bien sur les deux comptes à la fois.\n\nLes critères du club, sur le jeu de test scellé\u00a0: au plus **1\u00a0sur 10** des matins secs ratés, au plus **1\u00a0sur 4** des autres matins arrosés pour rien, au plus **1\u00a0sur 4** de tous les matins confiés à une personne, et tous les tests de comportement réussis. Les tests de comportement vérifient le code autour du modèle, comme *une mesure manquante donne Vérifier la terre*\u00a0: tu les écriras dans la prochaine leçon.\n\nVérifie que le jeu de test peut le montrer\u00a0: avec 6\u00a0matins secs sur 20, un seul raté fait déjà échouer le premier critère. Rassemble assez d’exemples de l’étiquette rare, ou dis honnêtement que le test est trop petit pour conclure.',
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
                heading: 'Risks and mitigations',
                body: 'A **risk** is something that could go wrong, and a **mitigation** is what you do now so that it happens less often, or does less harm. List them by kind, so that you do not forget a whole family:\n\n| Kind of risk | In *Water today?* | Mitigation |\n|---|---|---|\n| **Situations missing from the data**: a season, a place, a group of users | All 80 mornings are from September to December: no spring, no summer | Test on new mornings as they come; write it in the limits; until then, a person checks the soil twice a week |\n| **Results that differ between groups** | No people here; in a text system, comments written in another language (*APIs and automation*) | Measure the results group by group; add examples for the group that the model serves worst |\n| **Labels that disagree, or measure the wrong thing** | Two volunteers do not mean the same thing by *dry* | One written rule; the teacher checks 10 labels again |\n| **Too few examples of one label** | 22 dry mornings out of 80 | Count each kind of mistake; keep logging dry mornings |\n| **Missing or impossible inputs** | The station is offline; a fault reports −1 mm of rain | Check every input; *Check the soil* instead of a guess; a behaviour test for each case |\n| **Over-trust** | Volunteers stop looking at the soil at all | The screen says that it is advice; *Check the soil* when the model is unsure; a spot check every week |\n| **Privacy** | The rota sheet has names on it | It never goes into the data: readings and labels only |\n| **Misuse** | Someone uses the log to blame a volunteer for a wilted bed | Out-of-scope uses written down; no names in the log |\n| **Dependence on a tool or a service** | The model is deleted, or the service is down | Keep the examples to retrain; with no answer, the screen says *Check the soil* |\n\nThen rate each risk: **how likely** is it, and **how bad** would it be? Mitigate first the risks that are both likely and bad. You will accept some risks: write them down, so that they become known limits instead of surprises.\n\n**Test the riskiest assumption first.** Every plan rests on something that could sink it: *Can a model tell my labels apart from these features? Will I find 20 examples of the rare label?* Check it before you build anything else, in 15 minutes: ten rows on paper, or a throwaway project with five examples per label. On Machine Learning for Kids, delete that project afterwards: *Try it now* keeps only one project at a time.',
              },
              fr: {
                heading: 'Risques et parades',
                body: 'Un **risque** est quelque chose qui pourrait mal tourner, et une **parade** (on parle aussi de *mesure d’atténuation*) est ce que tu fais dès maintenant pour qu’il arrive moins souvent, ou fasse moins de dégâts. Range-les par type, pour n’oublier aucune famille\u00a0:\n\n| Type de risque | Dans *Arroser aujourd’hui\u00a0?* | Parade |\n|---|---|---|\n| **Des situations absentes des données**\u00a0: une saison, un lieu, un groupe d’utilisateurs | Les 80\u00a0matins vont de septembre à décembre\u00a0: ni printemps, ni été | Tester sur les nouveaux matins dès qu’ils arrivent\u00a0; l’écrire dans les limites\u00a0; d’ici là, une personne vérifie la terre deux fois par semaine |\n| **Des résultats différents selon les groupes** | Pas de personnes ici\u00a0; dans un système de textes, les commentaires écrits dans une autre langue (module *API et automatisation*) | Mesurer les résultats groupe par groupe\u00a0; ajouter des exemples pour le groupe que le modèle sert le moins bien |\n| **Des étiquettes incohérentes, ou qui mesurent autre chose** | Deux bénévoles n’entendent pas la même chose par *sec* | Une règle écrite\u00a0; l’enseignant revérifie 10\u00a0étiquettes |\n| **Trop peu d’exemples d’une étiquette** | 22\u00a0matins secs sur 80 | Compter chaque type d’erreur\u00a0; continuer à noter les matins secs |\n| **Des entrées manquantes ou impossibles** | La station est hors ligne\u00a0; une panne annonce −1\u00a0mm de pluie | Vérifier chaque entrée\u00a0; *Vérifier la terre* plutôt qu’une supposition\u00a0; un test de comportement pour chaque cas |\n| **La confiance excessive** | Les bénévoles ne regardent plus du tout la terre | L’écran précise que c’est un conseil\u00a0; *Vérifier la terre* quand le modèle doute\u00a0; un contrôle au hasard chaque semaine |\n| **La vie privée** | Le tableau du tour de rôle porte des noms | Il n’entre jamais dans les données\u00a0: seulement des mesures et des étiquettes |\n| **Le détournement** | Quelqu’un se sert du journal pour reprocher à un bénévole un carré flétri | Des usages hors périmètre écrits noir sur blanc\u00a0; aucun nom dans le journal |\n| **La dépendance à un outil ou à un service** | Le modèle est effacé, ou le service est en panne | Garder les exemples pour réentraîner\u00a0; sans réponse, l’écran affiche *Vérifier la terre* |\n\nÉvalue ensuite chaque risque\u00a0: **est-il probable**, et **serait-il grave**\u00a0? Traite d’abord les risques à la fois probables et graves. Tu en accepteras certains\u00a0: note-les, pour qu’ils deviennent des limites connues plutôt que des surprises.\n\n**Teste d’abord l’hypothèse la plus risquée.** Tout plan repose sur une hypothèse qui pourrait le faire couler\u00a0: *Un modèle peut-il distinguer mes étiquettes à partir de ces caractéristiques\u00a0? Trouverai-je 20\u00a0exemples de l’étiquette rare\u00a0?* Vérifie-la avant de construire quoi que ce soit d’autre, en 15\u00a0minutes\u00a0: dix lignes sur papier, ou un projet jetable avec cinq exemples par étiquette. Sur Machine Learning for Kids, supprime ce projet ensuite\u00a0: «\u00a0Essayer maintenant\u00a0» (*Try it now*) ne garde qu’un projet à la fois.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b5',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Choose a route and an idea that fit your tools',
                body: "Your system can be built in three ways. Choose the route that your school's tools and your time allow: the engineering is the same in all three.\n\n| Route | What you build | What to know first |\n|---|---|---|\n| **Machine Learning for Kids** | Train your own text, images, numbers or sounds model, as in *Predict outcomes with Python* and *Classify text from Python*, then use it from Python or Scratch, or test it on the *Learn & Test* page | With *Try it now*, no account: one project at a time, deleted after at least four hours. The site asks for at least five examples of each label (eight for sounds) before you train: aim for far more. The webcam or the microphone only with your teacher's permission |\n| **Python** | A pipeline around a model, as in *APIs and automation*: your Machine Learning for Kids model, or a service that your teacher provides | Code is written and traced here, then run in an environment that your teacher approves. Keys never go in code, and you never create your own account with an AI provider |\n| **A no-code tool** | Train and test a model with a tool that your teacher approves, such as [Teachable Machine](https://teachablemachine.withgoogle.com), which trains image, sound or pose models in the browser | Objects and made-up sounds only: never people, faces or voices. The webcam or the microphone only with your teacher's permission; no pose models, which need a person. Your design document and your test table carry the engineering |\n\nSome ideas, all with invented or anonymous data:\n\n| Idea | Model | Route that fits | Watch out for |\n|---|---|---|---|\n| *Water today?* (the club's) | Numbers: readings → water or not | Machine Learning for Kids, from Python | Few dry mornings; seasons that the data never saw |\n| *Which bin?* Sort packaging into paper, plastic, metal or food waste | Images of objects | Machine Learning for Kids or a no-code tool | A model that learns the background instead of the object |\n| *Newsletter sorter*: sort club notices by topic, with a *not sure* pile for an editor | Text | Machine Learning for Kids, from Python | Very short notices; notices in another language |\n| *Lost-property finder* | Images of objects | MobileNet as it is, or transfer learning on photos of the objects in the lost-property box (*Computer vision with ready-trained models*) | Names written on objects: keep them out of every photo |\n| *Help-desk router*: send questions about the school's computers to the right volunteer | Text | Python, with a service that your teacher provides | Test with invented questions; never send passwords or names |\n| *Instrument sorter*: recorder, drum or triangle? | Sounds | Machine Learning for Kids or a no-code tool | The microphone only with your teacher's permission; instruments only, no voices |\n\nYour own idea is better than any of these if it solves a real problem for people you can ask. Check it with your teacher before you write the design document.\n\nIf these sites are blocked at your school, take the Python route with a stand-in model, like the club's test runner in the next lesson: a small tree of questions that you write from your training rows, traced by hand and tested with the same test table. Say so in your limits.\n\n**On Machine Learning for Kids, plan for the four hours.** Keep every training example in your own file (a document for text, a CSV file for numbers, a folder for drawings and photos of objects), so that you can rebuild the project in minutes. Train it and run your test table in the same sitting, and take screenshots of the results, with no personal data in them. If your project needs several sessions, ask your teacher whether your class has accounts on the site, which keep projects from one lesson to the next. The project key or the model's address stays in the site's page and your own notebook, and becomes `YOUR-KEY` in everything you hand in, as with your Titanic model.",
              },
              fr: {
                heading: 'Choisis une voie et une idée adaptées à tes outils',
                body: 'Ton système peut se construire de trois façons. Choisis la voie que permettent les outils de ton établissement et ton temps\u00a0: l’ingénierie est la même dans les trois.\n\n| Voie | Ce que tu construis | Ce qu’il faut savoir d’abord |\n|---|---|---|\n| **Machine Learning for Kids** | Entraîne ton propre modèle de textes, d’images, de nombres ou de sons, comme dans les leçons *Prédire des résultats avec Python* et *Classer du texte depuis Python*, puis utilise-le depuis Python ou Scratch, ou teste-le sur la page *Apprendre & Tester* | Avec «\u00a0Essayer maintenant\u00a0», sans compte\u00a0: un seul projet à la fois, effacé au bout d’au moins quatre heures. Le site demande au moins cinq exemples par étiquette (huit pour les sons) avant l’entraînement\u00a0: vise bien davantage. La webcam ou le micro seulement avec l’autorisation de ton enseignant |\n| **Python** | Un pipeline autour d’un modèle, comme dans le module *API et automatisation*\u00a0: ton modèle de Machine Learning for Kids, ou un service fourni par ton enseignant | Le code est écrit et suivi à la main ici, puis exécuté dans un environnement approuvé par ton enseignant. Les clés ne vont jamais dans le code, et tu ne crées jamais toi-même de compte chez un fournisseur d’IA |\n| **Un outil sans code** | Entraîne et teste un modèle avec un outil approuvé par ton enseignant, comme [Teachable Machine](https://teachablemachine.withgoogle.com), qui entraîne dans le navigateur des modèles d’images, de sons ou de postures | Uniquement des objets et des sons inventés\u00a0: jamais de personnes, de visages ni de voix. La webcam ou le micro seulement avec l’autorisation de ton enseignant\u00a0; pas de modèle de postures, qui demande une personne. C’est ton document de conception et ton tableau de tests qui montrent ton travail d’ingénierie |\n\nQuelques idées, toutes avec des données inventées ou anonymes\u00a0:\n\n| Idée | Modèle | Voie adaptée | Points de vigilance |\n|---|---|---|---|\n| *Arroser aujourd’hui\u00a0?* (celle du club) | Nombres\u00a0: mesures → arroser ou non | Machine Learning for Kids, depuis Python | Peu de matins secs\u00a0; des saisons absentes des données |\n| *Quelle poubelle\u00a0?* Trier les emballages entre papier, plastique, métal et déchets alimentaires | Images d’objets | Machine Learning for Kids ou un outil sans code | Un modèle qui apprend le fond au lieu de l’objet |\n| *Trieur de la gazette*\u00a0: classer les annonces des clubs par thème, avec une pile *pas sûr* pour un rédacteur | Texte | Machine Learning for Kids, depuis Python | Des annonces très courtes\u00a0; des annonces dans une autre langue |\n| *Objets trouvés* | Images d’objets | MobileNet tel quel, ou un apprentissage par transfert sur des photos des objets rapportés aux objets trouvés (leçon *La vision par ordinateur avec des modèles déjà entraînés*) | Les noms écrits sur les objets\u00a0: garde-les hors de chaque photo |\n| *Aiguilleur du support informatique*\u00a0: envoyer les questions sur les ordinateurs du lycée au bon bénévole | Texte | Python, avec un service fourni par ton enseignant | Teste avec des questions inventées\u00a0; n’envoie jamais de mot de passe ni de nom |\n| *Trieur d’instruments*\u00a0: flûte, tambour ou triangle\u00a0? | Sons | Machine Learning for Kids ou un outil sans code | Le micro seulement avec l’autorisation de ton enseignant\u00a0; uniquement des instruments, aucune voix |\n\nTa propre idée vaut mieux que toutes celles-ci si elle résout un vrai problème pour des personnes que tu peux interroger. Fais-la valider par ton enseignant avant de rédiger le document de conception.\n\nSi ces sites sont bloqués dans ton établissement, prends la voie Python avec un modèle de remplacement, comme le programme de tests du club dans la prochaine leçon\u00a0: un petit arbre de questions que tu écris à partir de tes lignes d’entraînement, suivi à la main et testé avec le même tableau de tests. Indique-le dans tes limites.\n\n**Sur Machine Learning for Kids, tiens compte des quatre heures.** Garde chaque exemple d’entraînement dans ton propre fichier (un document pour les textes, un fichier CSV pour les nombres, un dossier pour les dessins et les photos d’objets), pour pouvoir reconstruire le projet en quelques minutes. Entraîne-le et passe ton tableau de tests pendant la même séance, et fais des captures d’écran des résultats, sans aucune donnée personnelle. Si ton projet demande plusieurs séances, demande à ton enseignant si ta classe dispose de comptes sur le site, qui conservent les projets d’une leçon à l’autre. La clé du projet ou l’adresse du modèle reste dans la page du site et dans ton propre notebook, et devient `YOUR-KEY` dans tout ce que tu rends, comme pour ton modèle du Titanic.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b6',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Write your one-page design document',
                body: "Now write yours, on paper, in your notes or in a document: about 20 minutes, one to three lines per section. Write no names, not even first names or initials (use roles instead: a volunteer, the garden teacher), and no personal data. Write *version 1* and the date at the top: in the next lesson you will build from this page, and update it whenever you learn something. If you run out of time, finish the page at home or at the start of the next lesson.\n\n| Section | What to write |\n|---|---|\n| **1. Problem and users** | Who has the problem, what happens today, and what the people you asked told you |\n| **2. The AI's job** | Input → output, in one line; and what the system does **not** do |\n| **3. Requirements** | *Must*, *should*, *could* and *won't*, each with the way you will check it |\n| **4. Route and tools** | Machine Learning for Kids, Python or a no-code tool, and what your teacher has approved |\n| **5. Data plan** | Source, labels and the rule for each, examples per label, the split (training, practice, sealed test), privacy, where it is kept, licence |\n| **6. Success criteria** | Each kind of mistake counted separately, the work handed to people and the baselines to beat, all written **before** you build |\n| **7. Risks and mitigations** | At least four, of different kinds, each rated *likely?* and *bad?*, with its mitigation |\n| **8. Human in the loop** | Who checks what when the system is unsure or wrong, and how a person can overrule it |\n| **9. Test plan** | Your first eight test cases, each with the result you expect: normal cases, edge cases, missing or impossible inputs, and a situation that your data never saw |\n| **10. Plan of work** | The steps of the next lesson, from the baseline to version 1 and beyond, with a time for each |\n| **11. AI help and credits** | Which AI tools helped you, with what, and how you checked; the data and code you did not write |\n\nBefore you move on, check your page against three questions. Could a classmate build the system from it? Could your teacher tell from section 6 alone whether the system worked? Does section 9 have a test for every *must* of section 3?",
              },
              fr: {
                heading: 'Rédige ton document de conception d’une page',
                body: 'À toi d’écrire le tien, sur papier, dans tes notes ou dans un document\u00a0: environ 20\u00a0minutes, une à trois lignes par rubrique. N’écris aucun nom, pas même un prénom ou des initiales (indique plutôt des rôles\u00a0: un bénévole, l’enseignant du potager), ni aucune donnée personnelle. Écris *version 1* et la date en haut de la page\u00a0: dans la prochaine leçon, tu construiras à partir de cette page, et tu la mettras à jour chaque fois que tu apprendras quelque chose. Si tu manques de temps, termine la page chez toi ou au début de la prochaine leçon.\n\n| Rubrique | Ce que tu écris |\n|---|---|\n| **1. Problème et utilisateurs** | Qui a le problème, ce qui se passe aujourd’hui, et ce que t’ont dit les personnes interrogées |\n| **2. La mission de l’IA** | Entrée → sortie, en une ligne\u00a0; et ce que le système ne fait **pas** |\n| **3. Exigences** | *Obligatoire*, *souhaitable*, *facultatif* et *pas cette fois*, chacune avec la façon de la vérifier |\n| **4. Voie et outils** | Machine Learning for Kids, Python ou un outil sans code, et ce que ton enseignant a approuvé |\n| **5. Plan de données** | Source, étiquettes et règle pour chacune, nombre d’exemples par étiquette, répartition (entraînement, mise au point, test scellé), vie privée, lieu de stockage, licence |\n| **6. Critères de réussite** | Chaque type d’erreur compté séparément, le travail confié aux personnes et les références à battre, le tout écrit **avant** de construire |\n| **7. Risques et parades** | Au moins quatre, de types différents, chacun évalué (*probable\u00a0?* *grave\u00a0?*), avec sa parade |\n| **8. Humain dans la boucle** | Qui vérifie quoi quand le système doute ou se trompe, et comment une personne peut passer outre |\n| **9. Plan de tests** | Tes huit premiers cas de test, chacun avec le résultat attendu\u00a0: des cas normaux, des cas limites, des entrées manquantes ou impossibles, et une situation absente de tes données |\n| **10. Plan de travail** | Les étapes de la prochaine leçon, de la référence à la version\u00a01 et au-delà, avec une durée pour chacune |\n| **11. Aide de l’IA et crédits** | Quels outils d’IA t’ont aidé, pour quoi, et comment tu as vérifié\u00a0; les données et le code que tu n’as pas écrits |\n\nAvant de passer à la suite, vérifie ta page avec trois questions. Un camarade pourrait-il construire le système à partir d’elle\u00a0? Ton enseignant pourrait-il dire, avec la seule rubrique\u00a06, si le système a réussi\u00a0? La rubrique\u00a09 contient-elle un test pour chaque exigence obligatoire de la rubrique\u00a03\u00a0?',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Put your plan to the test before you build. Ask the AI tutor to act as a tough design reviewer and to ask you one hard question at a time about your requirements, your data, your success criteria or your risks. Answer each one, then improve your design document wherever your answer was weak. The plan stays yours: the tutor asks, you decide. Describe your system without names, personal data or keys.',
                starterPrompt:
                  'Challenge my AI system plan like a tough design reviewer. My system: [who it is for, what goes in and what comes out]. My success criteria: [paste them]. My biggest risk: [paste it]. Ask me one hard question at a time about my requirements, data plan, success criteria or risks. Wait for my answer, tell me what is still weak in it, then ask the next question. Do not rewrite my plan for me.',
              },
              fr: {
                instructions:
                  'Mets ton plan à l’épreuve avant de construire. Demande au tuteur IA de jouer un relecteur de conception exigeant et de te poser une question difficile à la fois sur tes exigences, tes données, tes critères de réussite ou tes risques. Réponds à chacune, puis améliore ton document de conception partout où ta réponse était faible. Le plan reste le tien\u00a0: le tuteur pose les questions, c’est toi qui décides. Décris ton système sans nom, sans donnée personnelle et sans clé.',
                starterPrompt:
                  'Mets mon plan de système d’IA à l’épreuve, comme un relecteur de conception exigeant. Mon système\u00a0: [pour qui, ce qui entre et ce qui sort]. Mes critères de réussite\u00a0: [colle-les]. Mon plus gros risque\u00a0: [colle-le]. Pose-moi une question difficile à la fois sur mes exigences, mon plan de données, mes critères de réussite ou mes risques. Attends ma réponse, dis-moi ce qui reste faible dedans, puis pose la question suivante. Ne réécris pas mon plan à ma place.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm5-l1-b8',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'A stage check before you build: requirements, data plans, success criteria, baselines, risks and the limits of your tools.',
              },
              fr: {
                intro:
                  'Un point d’étape avant de construire\u00a0: exigences, plans de données, critères de réussite, références, risques et limites de tes outils.',
              },
            },
            data: { quizId: 'quiz-m5' },
          },
          {
            id: 'm5-l1-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Which part of your design document are you least sure about: the data, the success criteria or one of the risks? Say what you will check first in the next lesson, and which result would make you change your plan.',
              },
              fr: {
                prompt:
                  'De quelle partie de ton document de conception es-tu le moins sûr\u00a0: les données, les critères de réussite ou l’un des risques\u00a0? Dis ce que tu vérifieras en premier dans la prochaine leçon, et quel résultat te ferait changer ton plan.',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },

      // --- m5-l2: Build, test and present ---------------------------------------------------------
      {
        id: 'm5-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Build, test and present',
              summary:
                'Build your AI system in small steps from a baseline, test it with a test table, write down its limits and present it in 3 minutes, then hand in your final project.',
            },
            fr: {
              title: 'Construis, teste et présente',
              summary:
                'Construis ton système d’IA par petites étapes à partir d’une référence, teste-le avec un tableau de tests, note ses limites et présente-le en 3\u00a0minutes, puis rends ton projet final.',
            },
          },
          estimatedMinutes: 90,
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
                heading: 'It worked yesterday',
                body: "On the first evening, the club ran *Water today?* once, on a laptop: *No need today*, with a confidence of 90. It looked finished. The next morning, the hall screen showed an error message: the station had been offline overnight and, although the design document asked for *Check the soil* when a reading is missing, nobody had tried that case. A week later, the screen said *No need today* on a very windy morning, and the lettuces wilted anyway.\n\nThe model was not the problem. The system had run once, on one easy case, and had never really been tested. So the club started again, the way engineers work. In this lesson you will do the same: turn your design document into a system **built in steps**, **tested** with a table of cases written in advance, **documented** with its limits and **explained** in 3 minutes. Read this lesson and trace the club's test runner first (about 35 minutes). Then here is one way to spend your first project session:\n\n| Time | Step |\n|---|---|\n| 10 min | Set up: your design document, a folder or a notebook for the project, and an empty build log |\n| 35 min | Build: version 0 (the baseline), version 1 (the smallest system that works from end to end), then one improvement at a time |\n| 20 min | Test with your test table, then open the sealed test set, once |\n| 10 min | Write down the limits |\n| 15 min | Prepare and rehearse the 3-minute presentation |\n\nYou will probably need more than one session to finish the project: plan the others with your teacher and, on Machine Learning for Kids, remember the four hours of *Try it now*.",
              },
              fr: {
                heading: 'Ça marchait hier',
                body: 'Le premier soir, le club a lancé *Arroser aujourd’hui\u00a0?* une seule fois, sur un ordinateur portable\u00a0: *Pas besoin aujourd’hui*, avec une confiance de 90. Cela semblait terminé. Le lendemain matin, l’écran du hall affichait un message d’erreur\u00a0: la station avait été hors ligne pendant la nuit et, bien que le document de conception exige *Vérifier la terre* quand une mesure manque, personne n’avait essayé ce cas. Une semaine plus tard, l’écran affichait *Pas besoin aujourd’hui* un matin de grand vent, et les salades ont flétri quand même.\n\nLe modèle n’était pas le problème. Le système avait tourné une fois, sur un cas facile, et n’avait jamais vraiment été testé. Le club a donc tout repris, à la manière des ingénieurs. Dans cette leçon, tu vas faire de même\u00a0: transformer ton document de conception en un système **construit par étapes**, **testé** avec un tableau de cas écrits à l’avance, **documenté** avec ses limites et **expliqué** en 3\u00a0minutes. Lis d’abord cette leçon et suis à la main le programme de tests du club (environ 35\u00a0minutes). Voici ensuite une façon d’utiliser ta première séance de projet\u00a0:\n\n| Durée | Étape |\n|---|---|\n| 10\u00a0min | Préparer\u00a0: ton document de conception, un dossier ou un notebook pour le projet, et un journal de construction vide |\n| 35\u00a0min | Construire\u00a0: la version\u00a00 (la référence), la version\u00a01 (le plus petit système qui marche de bout en bout), puis une amélioration à la fois |\n| 20\u00a0min | Tester avec ton tableau de tests, puis ouvrir le jeu de test scellé, une seule fois |\n| 10\u00a0min | Rédiger les limites |\n| 15\u00a0min | Préparer et répéter la présentation de 3\u00a0minutes |\n\nIl te faudra sans doute plus d’une séance pour terminer le projet\u00a0: prévois les suivantes avec ton enseignant et, sur Machine Learning for Kids, n’oublie pas les quatre heures d’«\u00a0Essayer maintenant\u00a0».',
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
                heading: 'Build in small steps, from a baseline',
                body: "**Version 0: the baseline.** Start with the simplest rule, one that ignores the features, and measure it on your practice set. It takes five minutes, gives you the score to beat, and proves that your test cases and your counting work before any model is involved.\n\n**Version 1: the smallest system that works from end to end.** Input → model → output, even with a weak model and no polish. Engineers sometimes call it a *walking skeleton*. It shows assembly problems early, while they are cheap: feature names that differ between your data and the model, a confidence from 0 to 100 where your code expected 0 to 1, as in *Calling AI services safely*, an empty input that crashes everything.\n\n**Then one change at a time.** More varied examples, a new feature, a threshold, a check on the inputs: make one change, run the **same** practice cases again, write the result in your **build log**, then keep the change or undo it. If you change three things at once and the score moves, you will not know why.\n\nThe club's build log, on its 10 practice mornings (3 dry, 7 not dry):\n\n| Version | What changed | Dry mornings missed | Watered for nothing | Sent to a person | Decision |\n|---|---|---|---|---|---|\n| v0a | *Never water* | 3 of 3 | 0 of 7 | 0 | A bar to beat |\n| v0b | *Always water* | 0 of 3 | 7 of 7 | 0 | The other bar |\n| v1 | Machine Learning for Kids numbers model: rain, maximum temperature, humidity | 1 of 3 | 1 of 7 | 0 | Keep |\n| v2 | + *Check the soil* below a confidence of 70 | 0 of 3 | 1 of 7 | 2 of 10 | Keep |\n| v3 | Idea: + days since the last rain | | | | Not built: no time |\n\nThe missing-reading check was a behaviour fix, added with its test b3: it changed no result on the practice set.\n\nFour habits keep the build under control:\n\n- **Save each version that works** (a copy of the file, or a new notebook cell) before you change it, so that you can always go back.\n- **Keep the test set sealed.** Improve with the practice set only; open the test set once, at the end, and report what it says, even when it disappoints you.\n- **Time-box each step.** If a step takes more than 20 minutes, simplify: drop a *could*, never the tests.\n- **Keep secrets out**: the key in an environment variable or in the site's page, as you have done since *Predict outcomes with Python*, and no personal data in files, screenshots or logs.",
              },
              fr: {
                heading: 'Construis par petites étapes, à partir d’une référence',
                body: '**Version\u00a00\u00a0: la référence.** Commence par la règle la plus simple, celle qui ignore les caractéristiques, et mesure-la sur ton jeu de mise au point. Cela prend cinq minutes, te donne le score à battre, et prouve que tes cas de test et ta façon de compter fonctionnent avant même qu’un modèle entre en jeu.\n\n**Version\u00a01\u00a0: le plus petit système qui marche de bout en bout.** Entrée → modèle → sortie, même avec un modèle faible et sans finitions. Les ingénieurs l’appellent parfois *walking skeleton*\u00a0: un squelette qui tient déjà debout. Il révèle tôt les problèmes d’assemblage, tant qu’ils coûtent peu\u00a0: des noms de caractéristiques qui diffèrent entre tes données et le modèle, une confiance de 0 à 100 là où ton code attendait 0 à 1, comme dans la leçon *Appeler des services d’IA en toute sécurité*, une entrée vide qui fait tout planter.\n\n**Puis un changement à la fois.** Des exemples plus variés, une nouvelle caractéristique, un seuil, une vérification des entrées\u00a0: fais un changement, repasse **les mêmes** exemples de mise au point, note le résultat dans ton **journal de construction**, puis garde le changement ou annule-le. Si tu changes trois choses à la fois et que le score bouge, tu ne sauras pas pourquoi.\n\nLe journal de construction du club, sur ses 10\u00a0matins de mise au point (3\u00a0secs, 7\u00a0pas secs)\u00a0:\n\n| Version | Ce qui a changé | Matins secs ratés | Arrosés pour rien | Confiés à une personne | Décision |\n|---|---|---|---|---|---|\n| v0a | *Ne jamais arroser* | 3 sur 3 | 0 sur 7 | 0 | Un score à battre |\n| v0b | *Toujours arroser* | 0 sur 3 | 7 sur 7 | 0 | L’autre score à battre |\n| v1 | Modèle de nombres de Machine Learning for Kids\u00a0: pluie, température maximale, humidité | 1 sur 3 | 1 sur 7 | 0 | On garde |\n| v2 | + *Vérifier la terre* sous une confiance de 70 | 0 sur 3 | 1 sur 7 | 2 sur 10 | On garde |\n| v3 | Idée\u00a0: + nombre de jours depuis la dernière pluie | | | | Pas construite\u00a0: pas le temps |\n\nLa vérification des mesures manquantes était une correction de comportement, ajoutée avec son test b3\u00a0: elle n’a changé aucun résultat sur le jeu de mise au point.\n\nQuatre habitudes gardent la construction sous contrôle\u00a0:\n\n- **Enregistre chaque version qui marche** (une copie du fichier, ou une nouvelle cellule du notebook) avant de la modifier, pour pouvoir toujours revenir en arrière.\n- **Garde le jeu de test sous scellés.** Améliore uniquement avec le jeu de mise au point\u00a0; ouvre le jeu de test une seule fois, à la fin, et rapporte ce qu’il dit, même s’il te déçoit.\n- **Limite la durée de chaque étape.** Si une étape prend plus de 20\u00a0minutes, simplifie\u00a0: abandonne un *facultatif*, jamais les tests.\n- **Garde les secrets à l’écart**\u00a0: la clé dans une variable d’environnement ou dans la page du site, comme tu le fais depuis la leçon *Prédire des résultats avec Python*, et aucune donnée personnelle dans les fichiers, les captures d’écran ou les journaux.',
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
                heading: 'Test with a test table',
                body: "A test table lists every case **before** you run it, with the result you expect, then records what really happened. An AI system needs two kinds of rows:\n\n- **Behaviour tests** check the code around the model: a missing input, an impossible value, an empty text, an answer exactly at the threshold. Their expected result is certain, so every one of them must pass, like the tests of *Automate and test a pipeline*.\n- **Model tests** check the model's answers on examples it has never seen, against the true label found by a person. Nobody expects a model to get them all right: you count each kind of result and compare the counts with your success criteria and your baselines.\n\n| Id | Kind | Input | Expected (written before) | Result | Pass? | How tested |\n|---|---|---|---|---|---|---|\n| b1 | Behaviour: normal | 6 mm of rain, 14 °C, 85% | One of the three messages, on the screen by 7:30 | *No need today*, at 7:05 | Yes | Run |\n| b7 | Behaviour: edge case | A fake model that answers *Water* at a confidence of exactly 70 | *Water* (70 is not below the threshold) | *Water* | Yes | Traced by hand |\n| n1 | New situation | A heatwave: 0 mm, 31 °C, 35% | *Water* | *Water* | Yes | On the *Learn & Test* page |\n| s1 | Model, new season | Spring mornings | The soil as the teacher finds it | Not tested yet | | No spring data yet |\n\nRules that keep a test table honest:\n\n- **Cover every kind of case**: normal cases, edge cases, missing or impossible inputs, situations that your data never saw, and each group of users or conditions, so that a model that works worse for some of them shows up.\n- **Give every *must* at least one test**, and write the test's id next to the requirement in your design document.\n- **Say how each result was obtained**: run, traced by hand or tried on a website. *Not tested yet* is an honest result; an invented one is not.\n- **Never change an expected result after the test.** A failing test is information, as in *Automate and test a pipeline*: fix the code, or write the failure down as a limit.\n- **End with a summary** in the words of your criteria: *behaviour tests: 7 of 7 pass; sealed test: dry mornings missed, 1 of 6; criterion: at most 1 in 10; not met.*",
              },
              fr: {
                heading: 'Teste avec un tableau de tests',
                body: 'Un tableau de tests liste chaque cas **avant** que tu le lances, avec le résultat attendu, puis note ce qui s’est vraiment passé. Un système d’IA a besoin de deux types de lignes\u00a0:\n\n- Les **tests de comportement** vérifient le code autour du modèle\u00a0: une entrée manquante, une valeur impossible, un texte vide, une réponse pile au seuil. Leur résultat attendu est certain\u00a0: chacun d’eux doit donc réussir, comme les tests de la leçon *Automatiser et tester un pipeline*.\n- Les **tests du modèle** vérifient ses réponses sur des exemples qu’il n’a jamais vus, par rapport à la vraie étiquette trouvée par une personne. Personne n’attend d’un modèle qu’il les réussisse tous\u00a0: tu comptes chaque type de résultat et tu compares ces comptes avec tes critères de réussite et tes références.\n\n| N° | Type | Entrée | Attendu (écrit avant) | Résultat | Réussi\u00a0? | Méthode |\n|---|---|---|---|---|---|---|\n| b1 | Comportement\u00a0: normal | 6\u00a0mm de pluie, 14\u00a0°C, 85\u00a0% | L’un des trois messages, à l’écran avant 7\u00a0h\u00a030 | *Pas besoin aujourd’hui*, à 7\u00a0h\u00a005 | Oui | Exécuté |\n| b7 | Comportement\u00a0: cas limite | Un faux modèle qui répond *Arroser* avec une confiance d’exactement 70 | *Arroser* (70 n’est pas sous le seuil) | *Arroser* | Oui | Suivi à la main |\n| n1 | Situation nouvelle | Une canicule\u00a0: 0\u00a0mm, 31\u00a0°C, 35\u00a0% | *Arroser* | *Arroser* | Oui | Sur la page *Apprendre & Tester* |\n| s1 | Modèle, nouvelle saison | Matins de printemps | La terre telle que la trouve l’enseignant | Pas encore testé | | Pas encore de données de printemps |\n\nLes règles qui gardent un tableau de tests honnête\u00a0:\n\n- **Couvre tous les types de cas**\u00a0: des cas normaux, des cas limites, des entrées manquantes ou impossibles, des situations absentes de tes données, et chaque groupe d’utilisateurs ou de conditions, pour qu’un modèle qui marche moins bien pour certains se remarque.\n- **Donne au moins un test à chaque exigence obligatoire**, et écris le numéro du test à côté de l’exigence dans ton document de conception.\n- **Indique comment chaque résultat a été obtenu**\u00a0: exécuté, suivi à la main ou essayé sur un site. *Pas encore testé* est un résultat honnête\u00a0; un résultat inventé ne l’est pas.\n- **Ne change jamais un résultat attendu après le test.** Un test qui échoue t’apprend quelque chose, comme dans la leçon *Automatiser et tester un pipeline*\u00a0: corrige le code, ou note l’échec comme une limite.\n- **Termine par un bilan** avec les mots de tes critères\u00a0: *tests de comportement\u00a0: 7 sur 7 réussis\u00a0; jeu scellé\u00a0: matins secs ratés, 1 sur 6\u00a0; critère\u00a0: au plus 1 sur 10\u00a0; non atteint.*',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Write down the limits, then present in 3 minutes',
                body: "**The limits.** In *Computer vision with ready-trained models*, MobileNet came with a model card that says what it was trained on and where it fails. Your system needs the same: a **limits** section, written as facts with evidence, not as excuses. *May not be perfect* tells a user nothing; *missed a dry morning on a very windy day: the station has no wind sensor* tells them when to check. Answer six questions:\n\n1. **Trained on what, and not on what?** Period, places, conditions, groups. (*September to December only.*)\n2. **Tested where, and where not?** Your *not tested yet* rows. (*No spring or summer morning.*)\n3. **Known failures, and what they have in common.** (*Windy days; beds in the shade; seedlings just planted.*)\n4. **Who is affected when it is wrong, and how?** (*Wilted plants; some wasted water; the volunteers' time.*)\n5. **What should users do** when it is unsure or wrong? (*Check the soil; tell the club, which logs that morning.*)\n6. **Out-of-scope uses**: what it must not be used for. (*The sports field; judging the volunteers.*)\n\n**A presentation of 3 minutes** is about 400 spoken words, so every sentence must earn its place. One slide or one card per part is enough:\n\n| Time | Part | What it shows |\n|---|---|---|\n| 0:00–0:30 | The problem | One real situation and the people who have it |\n| 0:30–1:10 | How it works | Input → model → output, and where a person decides |\n| 1:10–1:50 | Demo | Three inputs: an easy one, a hard one and one where it fails, live, as screenshots or as a table |\n| 1:50–2:30 | Results | Your counts next to your criteria and your baselines, and what you have not tested |\n| 2:30–3:00 | Limits and next step | The limit that every user must know, what you would do next, and the AI help you used |\n\nRehearse at least once with a timer. Show no personal data, no key and no face on any slide. When someone asks a question you cannot answer, say so: *we did not test that* is a good answer.",
              },
              fr: {
                heading: 'Note les limites, puis présente en 3\u00a0minutes',
                body: '**Les limites.** Dans la leçon *La vision par ordinateur avec des modèles déjà entraînés*, MobileNet était accompagné d’une fiche de modèle qui dit sur quoi il a été entraîné et où il échoue. Ton système a besoin de la même chose\u00a0: une rubrique **limites**, écrite avec des faits et des preuves, pas avec des excuses. *Peut ne pas être parfait* n’apprend rien à l’utilisateur\u00a0; *a raté un matin sec par grand vent\u00a0: la station n’a pas de capteur de vent* lui dit quand vérifier. Réponds à six questions\u00a0:\n\n1. **Entraîné sur quoi, et pas sur quoi\u00a0?** Période, lieux, conditions, groupes. (*De septembre à décembre seulement.*)\n2. **Testé où, et où pas\u00a0?** Tes lignes *pas encore testé*. (*Aucun matin de printemps ni d’été.*)\n3. **Les échecs connus, et ce qu’ils ont en commun.** (*Les jours de vent\u00a0; les carrés à l’ombre\u00a0; les jeunes plants tout juste repiqués.*)\n4. **Qui est touché quand il se trompe, et comment\u00a0?** (*Des plantes flétries\u00a0; un peu d’eau gaspillée\u00a0; le temps des bénévoles.*)\n5. **Que doivent faire les utilisateurs** quand le système doute ou se trompe\u00a0? (*Vérifier la terre\u00a0; prévenir le club, qui note ce matin-là.*)\n6. **Les usages hors périmètre**\u00a0: ce à quoi il ne doit pas servir. (*Le terrain de sport\u00a0; juger les bénévoles.*)\n\n**Une présentation de 3\u00a0minutes** représente environ 400\u00a0mots prononcés\u00a0: chaque phrase doit mériter sa place. Une diapositive ou une fiche par partie suffit\u00a0:\n\n| Temps | Partie | Ce qu’elle montre |\n|---|---|---|\n| 0:00–0:30 | Le problème | Une situation réelle et les personnes qui la vivent |\n| 0:30–1:10 | Comment ça marche | Entrée → modèle → sortie, et le moment où une personne décide |\n| 1:10–1:50 | Démonstration | Trois entrées\u00a0: une facile, une difficile et une où il échoue, en direct, en captures d’écran ou sous forme de tableau |\n| 1:50–2:30 | Résultats | Tes comptes à côté de tes critères et de tes références, et ce que tu n’as pas testé |\n| 2:30–3:00 | Limites et suite | La limite que chaque utilisateur doit connaître, ce que tu ferais ensuite, et l’aide de l’IA dont tu t’es servi |\n\nRépète au moins une fois avec un minuteur. Ne montre aucune donnée personnelle, aucune clé ni aucun visage sur tes diapositives. Quand on te pose une question à laquelle tu ne sais pas répondre, dis-le\u00a0: *nous ne l’avons pas testé* est une bonne réponse.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b5',
            type: RICH,
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: "Watch a 3-minute presentation, with the coach's notes",
                body: "Here is the club's presentation of *Water today?*, as one of its members gave it, with a coach's note after each part. Read it aloud with a timer: it takes about 3 minutes.\n\n**[0:00] The problem**\n\n> This autumn, we watered the vegetable beds on mornings when the soil was still wet from the rain and, in one dry, windy week, nobody watered at all: we lost a row of lettuces. The volunteers on the morning rota asked us for one thing: tell us before 7:30 whether to water today.\n\n*Coach:* one real situation, and the users' own words. No definition of AI.\n\n**[0:30] How it works**\n\n> Every morning, our program reads the rain, the maximum temperature and the humidity of the day before from the roof station. A model trained on Machine Learning for Kids, on 50 mornings that our garden teacher checked by hand, answers water or no need, with a confidence. If the confidence is below 70, or if a reading is missing or impossible, the screen does not guess: it says Check the soil, and a volunteer pushes a finger into the soil.\n\n*Coach:* the person in the loop is part of how it works, not an afterthought.\n\n**[1:10] Demo**\n\n> Three mornings from our test set. After 4.5 mm of rain: No need, at 90, and the soil was wet. A cool, dry morning: Check the soil, because the model's confidence was only 65. And a very windy morning: No need, at 75, but the soil was dry. Our model cannot feel the wind: the station has no wind sensor.\n\n*Coach:* a failure shown on purpose, with its cause. It builds more trust than three successes.\n\n**[1:50] Results**\n\n> We kept 20 mornings sealed until the end. Of the 6 dry ones, we caught 4, a volunteer checked 1, and we missed 1. Of the 14 others, we watered for nothing twice, within our limit of 1 in 4. In all, 4 mornings out of 20 went to a volunteer, within our limit of 5. Our criteria allowed 1 miss in 10 dry mornings: with 1 in 6, we have not met that one, and 6 dry mornings are too few to be sure either way. Never watering would have missed all 6; always watering would have watered for nothing 14 times.\n\n*Coach:* numbers next to the criteria and the baselines, including the criterion that was not met.\n\n**[2:30] Limits and next step**\n\n> Our advisor has never seen a spring or a summer morning, and it cannot know about wind, shade or new seedlings. Until it has been tested on spring mornings, a volunteer checks the soil twice a week. Next, we will log more dry mornings and test a new feature: the number of days since the last rain. We used the AI tutor to challenge our plan; every number here comes from our own tests.\n\n*Coach:* the limit, what users should do about it, and honest credit for the AI help.",
              },
              fr: {
                heading: 'Regarde une présentation de 3\u00a0minutes, avec les notes du coach',
                body: 'Voici la présentation d’*Arroser aujourd’hui\u00a0?* telle qu’un membre du club l’a faite, avec une note du coach après chaque partie. Lis-la à voix haute avec un minuteur\u00a0: elle dure environ 3\u00a0minutes.\n\n**[0:00] Le problème**\n\n> Cet automne, nous avons arrosé le potager des matins où la terre était encore mouillée par la pluie et, pendant une semaine sèche et venteuse, personne n’a arrosé du tout\u00a0: nous avons perdu un rang de salades. Les bénévoles du tour de rôle du matin nous ont demandé une seule chose\u00a0: dites-nous avant 7\u00a0h\u00a030 s’il faut arroser aujourd’hui.\n\n*Coach\u00a0:* une situation réelle, et les mots mêmes des utilisateurs. Aucune définition de l’IA.\n\n**[0:30] Comment ça marche**\n\n> Chaque matin, notre programme lit sur la station du toit la pluie, la température maximale et l’humidité de la veille. Un modèle entraîné sur Machine Learning for Kids, à partir de 50\u00a0matins que l’enseignant responsable du potager a vérifiés à la main, répond arroser ou pas besoin, avec une confiance. Si la confiance est inférieure à 70, ou si une mesure manque ou est impossible, l’écran ne devine pas\u00a0: il affiche Vérifier la terre, et un bénévole enfonce un doigt dans la terre.\n\n*Coach\u00a0:* la personne dans la boucle fait partie du fonctionnement, ce n’est pas un ajout de dernière minute.\n\n**[1:10] Démonstration**\n\n> Trois matins de notre jeu de test. Après 4,5\u00a0mm de pluie\u00a0: Pas besoin, à 90, et la terre était mouillée. Un matin frais et sec\u00a0: Vérifier la terre, parce que la confiance du modèle n’était que de 65. Et un matin de grand vent\u00a0: Pas besoin, à 75, mais la terre était sèche. Notre modèle ne peut pas sentir le vent\u00a0: la station n’a pas de capteur de vent.\n\n*Coach\u00a0:* un échec montré exprès, avec sa cause. Il inspire plus confiance que trois réussites.\n\n**[1:50] Résultats**\n\n> Nous avons gardé 20\u00a0matins sous scellés jusqu’à la fin. Sur les 6\u00a0matins secs, nous en avons repéré 4, un bénévole en a vérifié 1, et nous en avons raté 1. Sur les 14\u00a0autres, nous avons fait arroser pour rien deux fois, dans notre limite de 1 sur 4. En tout, 4\u00a0matins sur 20 ont été confiés à un bénévole, dans notre limite de 5. Nos critères autorisaient 1\u00a0raté sur 10\u00a0matins secs\u00a0: avec 1 sur 6, nous n’avons pas atteint ce critère, et 6\u00a0matins secs sont trop peu pour conclure dans un sens ou dans l’autre. Ne jamais arroser aurait raté les 6\u00a0; toujours arroser aurait fait arroser pour rien 14\u00a0fois.\n\n*Coach\u00a0:* des chiffres à côté des critères et des références, y compris le critère qui n’est pas atteint.\n\n**[2:30] Limites et suite**\n\n> Notre conseiller n’a jamais vu de matin de printemps ni d’été, et il ne peut rien savoir du vent, de l’ombre ni des jeunes plants. Tant qu’il n’a pas été testé sur des matins de printemps, un bénévole vérifie la terre deux fois par semaine. Ensuite, nous noterons plus de matins secs et nous testerons une nouvelle caractéristique\u00a0: le nombre de jours depuis la dernière pluie. Nous avons utilisé le tuteur IA pour mettre notre plan à l’épreuve\u00a0; tous les chiffres présentés ici viennent de nos propres tests.\n\n*Coach\u00a0:* la limite, ce que les utilisateurs doivent faire face à elle, et une mention honnête de l’aide de l’IA.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b6',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Read the club's test runner like an engineer. It runs the advisor on its two kinds of tests: behaviour tests for the code around the model, and 8 of the 20 mornings of the sealed test set. A stand-in model, a small tree of questions, takes the place of the club's trained model, so the file needs no website and no key. On these 8 mornings it gives the same answers and confidences as the club's trained model did, so your trace matches the club's presentation. It is saved, not run: trace it by hand.\n\n1. Trace run_behaviour_tests: write the five lines and the last line that it prints. Which test fails, and what does that tell you about advise?\n2. TODO 1: add the range check to advise. Which test passes now?\n3. TODO 2: add a test with a humidity of 120 (expected: check_soil) and one more edge case of your own, with its expected result written before you trace it.\n4. Trace run_mornings: write the eight lines and the dictionary that it prints. Which key counts the missed dry mornings, and which the mornings watered for nothing?\n5. Compare the counts with the success criteria at the top of the file. Which are met on these 8 mornings? The count says the first one is not met: why are 3 dry mornings still too few to know how often the advisor really misses a dry morning?\n6. Without the code, work out what the baselines \"always water\" and \"never water\" would give on the same 8 mornings.\n7. Challenge, TODO 3: write meets_criteria(counts). Then set THRESHOLD to 80 and trace run_mornings again: what changes, and which criterion breaks? Would b5 have passed at 80 without TODO 1, and would it have been for the right reason?\n8. For your own project: copy the file into your notebook, replace stand_in_model with a function that asks your own model and returns (label, confidence), as predict did in Predict outcomes with Python, and write your own tests. Tests b1, b2 and b4 rely on the stand-in's answers: with your own model, replace b4 with a fake model that always returns a fixed confidence (for example 65), and move b1 and b2 to your model tests. Your key stays out of the file, as always.\n\nIf your school gives you a Python environment, run python test_advisor.py there and compare its output with your trace.",
                hint: 'advise checks for missing readings before it calls the model. In b5, -1.0 is not None, so the model answers: -1.0 is below 2, 15.0 is below 18 and 80 is not below 60, which gives no_need at 75, and 75 is not below the threshold. counts.get(key, 0) + 1 is the counting pattern of Python essentials for data. For TODO 3, a key that starts with "dry" counts a dry morning, and "dry -> no_need" is a miss. With THRESHOLD = 80, every answer at 75 or 65 becomes check_soil.',
              },
              fr: {
                instructions:
                  'Lis le programme de tests du club comme un ingénieur. Il fait passer au conseiller ses deux types de tests\u00a0: les tests de comportement du code autour du modèle, et 8 des 20\u00a0matins du jeu de test scellé. Un modèle de remplacement, un petit arbre de questions, tient la place du modèle entraîné du club\u00a0: le fichier n’a donc besoin ni de site ni de clé. Sur ces 8\u00a0matins, il donne les mêmes réponses et les mêmes confiances que le modèle entraîné du club\u00a0: ta trace correspond donc à la présentation du club. Il est enregistré, pas exécuté\u00a0: suis-le à la main. Dans le code, les noms sont en anglais\u00a0: advise = conseiller, readings = mesures, rain_mm = pluie en mm, max_temp_c = température maximale en °C, humidity_pct = humidité en %, water = arroser, no_need = pas besoin, check_soil = vérifier la terre, soil = terre, dry = sèche, not dry = pas sèche, expected = attendu, got = obtenu, PASS = réussi, FAIL = échoué, morning = matin, counts = comptes, stand_in_model = modèle de remplacement, meets_criteria = atteint les critères, met = atteint.\n\n1. Suis run_behaviour_tests\u00a0: écris les cinq lignes et la dernière ligne qu’il affiche. Quel test échoue, et que t’apprend-il sur advise\u00a0?\n2. TODO\u00a01\u00a0: ajoute à advise la vérification des plages de valeurs. Quel test réussit maintenant\u00a0?\n3. TODO\u00a02\u00a0: ajoute un test avec une humidité de 120 (attendu\u00a0: check_soil) et un autre cas limite de ton choix, avec son résultat attendu écrit avant de le suivre.\n4. Suis run_mornings\u00a0: écris les huit lignes et le dictionnaire qu’il affiche. Quelle clé compte les matins secs ratés, et laquelle les matins arrosés pour rien\u00a0?\n5. Compare les comptes avec les critères de réussite écrits en haut du fichier. Lesquels sont atteints sur ces 8\u00a0matins\u00a0? Le compte dit que le premier n’est pas atteint\u00a0: pourquoi 3\u00a0matins secs sont-ils quand même trop peu pour savoir à quelle fréquence le conseiller rate vraiment un matin sec\u00a0?\n6. Sans le code, calcule ce que donneraient les références «\u00a0toujours arroser\u00a0» et «\u00a0ne jamais arroser\u00a0» sur les mêmes 8\u00a0matins.\n7. Défi, TODO\u00a03\u00a0: écris meets_criteria(counts). Règle ensuite THRESHOLD (le seuil) sur 80 et suis de nouveau run_mornings\u00a0: qu’est-ce qui change, et quel critère n’est plus atteint\u00a0? b5 aurait-il réussi à 80 sans le TODO\u00a01, et aurait-ce été pour la bonne raison\u00a0?\n8. Pour ton propre projet\u00a0: copie le fichier dans ton notebook, remplace stand_in_model par une fonction qui interroge ton propre modèle et renvoie (étiquette, confiance), comme predict dans la leçon Prédire des résultats avec Python, et écris tes propres tests. Les tests b1, b2 et b4 reposent sur les réponses du modèle de remplacement\u00a0: avec ton propre modèle, remplace b4 par un faux modèle qui renvoie toujours la même confiance (par exemple 65), et range b1 et b2 parmi tes tests du modèle. Ta clé reste hors du fichier, comme toujours.\n\nSi ton établissement te donne accès à un environnement Python, lance python test_advisor.py dans cet environnement et compare ce qu’il affiche avec ta trace.',
                hint: 'advise vérifie les mesures manquantes avant d’appeler le modèle. Pour b5, -1.0 n’est pas None\u00a0: le modèle répond donc. -1.0 est inférieur à 2, 15.0 est inférieur à 18 et 80 n’est pas inférieur à 60, ce qui donne no_need à 75, et 75 n’est pas sous le seuil. counts.get(key, 0) + 1 est le motif de comptage de la leçon L’essentiel de Python pour les données. Pour le TODO\u00a03, une clé qui commence par "dry" compte un matin sec, et "dry -> no_need" est un raté. Avec THRESHOLD = 80, toute réponse à 75 ou à 65 devient check_soil.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                "# test_advisor.py: runs the club's watering advisor on its two kinds of tests. The stand-in",
                '# model replaces the trained model, so this file needs no website, no network and no key.',
                '',
                'THRESHOLD = 70  # below this confidence, a person checks the soil / une personne vérifie',
                'FIELDS = ["rain_mm", "max_temp_c", "humidity_pct"]  # the day before, from the roof station',
                '',
                '# Success criteria of the design document, on the sealed test set: at most 1 in 10 dry',
                '# mornings missed, at most 1 in 4 of the other mornings watered for nothing, and at most',
                '# 1 in 4 of all mornings sent to a person.',
                '',
                '',
                'def morning(rain_mm, max_temp_c, humidity_pct):',
                '    """The readings of one morning, as a dictionary with the field names of the project."""',
                '    return {"rain_mm": rain_mm, "max_temp_c": max_temp_c, "humidity_pct": humidity_pct}',
                '',
                '',
                'def stand_in_model(readings):',
                '    """Stands in for the trained model: a small tree of questions. Returns (label, confidence),',
                '    with a confidence from 0 to 100, as Machine Learning for Kids gives it."""',
                '    if readings["rain_mm"] >= 2:',
                '        return "no_need", 90',
                '    if readings["max_temp_c"] >= 18:',
                '        return "water", 85',
                '    if readings["humidity_pct"] < 60:',
                '        return "water", 65',
                '    return "no_need", 75',
                '',
                '',
                'def advise(readings, model):',
                '    """The advisor: "water", "no_need", or "check_soil" when a person must decide."""',
                '    for field in FIELDS:',
                '        if readings.get(field) is None:',
                '            return "check_soil"  # a missing reading: never guess / ne jamais deviner',
                '    # TODO 1: a reading that cannot be true (rain below 0, humidity below 0 or above 100) is a',
                '    # sensor fault: return "check_soil" for it too.',
                '    label, confidence = model(readings)',
                '    if confidence < THRESHOLD:',
                '        return "check_soil"',
                '    return label',
                '',
                '',
                '# --- 1. Behaviour tests: the code around the model. Every one of them must pass.',
                '# (id, what it checks, readings, expected advice, written BEFORE the test was run)',
                "# b1, b2 and b4 use the stand-in's answers. With your own model, test the threshold with a",
                '# fake model that always returns a fixed confidence (for example 65), and move b1 and b2 to',
                '# your model tests.',
                'BEHAVIOUR_TESTS = [',
                '    ("b1", "heavy rain", morning(6.0, 14.0, 85), "no_need"),',
                '    ("b2", "hot and dry", morning(0.0, 23.5, 45), "water"),',
                '    ("b3", "rain reading missing", morning(None, 17.0, 62), "check_soil"),',
                '    ("b4", "model unsure", morning(0.5, 15.0, 52), "check_soil"),',
                '    ("b5", "broken rain sensor", morning(-1.0, 15.0, 80), "check_soil"),',
                '    # TODO 2: humidity of 120 (expected: check_soil), and one more edge case of your own.',
                ']',
                '',
                '',
                'def run_behaviour_tests(tests, model):',
                '    """Print one line per test, then the number that pass."""',
                '    passed = 0',
                '    for test_id, what, readings, expected in tests:',
                '        got = advise(readings, model)',
                '        result = "PASS" if got == expected else "FAIL"',
                '        if result == "PASS":',
                '            passed += 1',
                '        print(f"{test_id} | {what} | expected {expected} | got {got} | {result}")',
                '    print(f"{passed} of {len(tests)} behaviour tests pass")',
                '',
                '',
                '# --- 2. Model tests: the sealed test set, opened once, at the end (here, 8 of its 20 mornings).',
                '# (id, readings, was the soil dry? as the garden teacher found it that morning)',
                'TEST_MORNINGS = [',
                '    ("m1", morning(0.0, 19.5, 50), True),',
                '    ("m2", morning(4.5, 13.0, 88), False),',
                '    ("m3", morning(0.0, 16.5, 55), True),',
                '    ("m4", morning(0.2, 17.5, 64), True),  # the garden notebook says: very windy',
                '    ("m5", morning(0.0, 18.5, 72), False),',
                '    ("m6", morning(3.0, 20.0, 60), False),',
                '    ("m7", morning(0.0, 12.5, 81), False),',
                '    ("m8", morning(None, 15.0, 70), False),  # the station was offline that night',
                ']',
                '',
                '',
                'def run_mornings(mornings, model):',
                '    """Print the advice for each morning, then count each pair (soil, advice)."""',
                '    counts = {}',
                '    for morning_id, readings, soil_dry in mornings:',
                '        soil = "dry" if soil_dry else "not dry"',
                '        advice = advise(readings, model)',
                '        print(f"{morning_id}: soil {soil}, advice {advice}")',
                '        key = f"{soil} -> {advice}"',
                '        counts[key] = counts.get(key, 0) + 1',
                '    return counts',
                '',
                '',
                '# TODO 3 (challenge): write meets_criteria(counts), which prints "met" or "not met" for each',
                '# success criterion. / Défi : « met » = atteint, « not met » = non atteint.',
                '',
                '',
                'if __name__ == "__main__":',
                '    run_behaviour_tests(BEHAVIOUR_TESTS, stand_in_model)  # 1.',
                '    counts = run_mornings(TEST_MORNINGS, stand_in_model)  # 2.',
                '    print(counts)',
                '    # meets_criteria(counts)  # TODO 3: remove the # once it is written.',
              ),
            },
          },
          {
            id: 'm5-l2-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Before you hand in, paste your test table and your success criteria (no personal data, no key) and ask the AI tutor to check them. It should tell you which kinds of case are missing, which expected results are too vague to check and whether your summary matches your criteria. It must not write tests or results for you: every result in your table comes from your own system.',
                starterPrompt:
                  'Check my work without writing tests for me. My AI system: [one line: input -> output]. My success criteria: [paste them]. My test table (id, kind, input, expected, result, how tested): [paste it]. Which kinds of case are missing? Which expected results are too vague to check? Does my summary match my criteria?',
              },
              fr: {
                instructions:
                  'Avant de rendre ton projet, colle ton tableau de tests et tes critères de réussite (sans donnée personnelle ni clé) et demande au tuteur IA de les vérifier. Il doit te dire quels types de cas manquent, quels résultats attendus sont trop vagues pour être vérifiés et si ton bilan correspond à tes critères. Il ne doit pas écrire de tests ni de résultats à ta place\u00a0: chaque résultat de ton tableau vient de ton propre système.',
                starterPrompt:
                  'Vérifie mon travail sans écrire de tests à ma place. Mon système d’IA\u00a0: [une ligne\u00a0: entrée -> sortie]. Mes critères de réussite\u00a0: [colle-les]. Mon tableau de tests (numéro, type, entrée, attendu, résultat, méthode de test)\u00a0: [colle-le]. Quels types de cas manquent\u00a0? Quels résultats attendus sont trop vagues pour être vérifiés\u00a0? Mon bilan correspond-il à mes critères\u00a0?',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm5-l2-b8',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your final project: your design document, your system, your build log, your test table, its limits and your 3-minute presentation. It is required for your certificate, and your teacher has the final word on the review.',
              },
              fr: {
                intro:
                  'Rends ton projet final\u00a0: ton document de conception, ton système, ton journal de construction, ton tableau de tests, ses limites et ta présentation de 3\u00a0minutes. Il est nécessaire pour obtenir ton certificat, et c’est ton enseignant qui a le dernier mot sur l’évaluation.',
              },
            },
            data: { projectId: 'project-m5' },
          },
          {
            id: 'm5-l2-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Look back at your system and at the whole course. Which engineering habit made the biggest difference to your project: a baseline, a sealed test set, a threshold with a person in the loop, tests for the code around the model, or keys and personal data kept out? Describe one moment when it caught a problem, and say what you would do with one more week.',
              },
              fr: {
                prompt:
                  'Repense à ton système et à tout le cours. Quelle habitude d’ingénieur a le plus compté pour ton projet\u00a0: une référence, un jeu de test scellé, un seuil avec une personne dans la boucle, des tests pour le code autour du modèle, ou des clés et des données personnelles tenues à l’écart\u00a0? Raconte un moment où elle a révélé un problème, et dis ce que tu ferais avec une semaine de plus.',
              },
            },
            data: { minLength: 120 },
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
            title: 'Check: engineering challenge',
            instructions:
              'Seven questions on planning an AI system: requirements, data plans, success criteria, baselines, risks and the limits of your tools. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: défi d’ingénierie',
            instructions:
              'Sept questions sur la planification d’un système d’IA\u00a0: exigences, plans de données, critères de réussite, références, risques et limites de tes outils. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
              en: { prompt: 'Which of these requirements for the watering advisor can be tested?' },
              fr: {
                prompt:
                  'Laquelle de ces exigences pour le conseiller d’arrosage peut être vérifiée par un test\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The advisor should be reliable.' },
                  fr: { text: 'Le conseiller doit être fiable.' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The advisor should be useful to the garden.' },
                  fr: { text: 'Le conseiller doit être utile au potager.' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'When a reading is missing, the screen shows Check the soil instead of advice.',
                  },
                  fr: {
                    text: 'Quand une mesure manque, l’écran affiche Vérifier la terre au lieu d’un conseil.',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The advisor uses the most advanced model available.' },
                  fr: { text: 'Le conseiller utilise le modèle le plus avancé qui existe.' },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A testable requirement says what you will observe, and when it counts as met: give the system a missing reading and look at the screen. Reliable and useful stay wishes until you turn them into numbers or behaviours, and the most advanced model is a choice of tool, not something the users need.',
              },
              fr: {
                text: 'Une exigence vérifiable dit ce que tu observeras, et à quelle condition elle est remplie\u00a0: donne au système une mesure manquante et regarde l’écran. Fiable et utile restent des souhaits tant que tu ne les traduis pas en chiffres ou en comportements, et le modèle le plus avancé est un choix d’outil, pas un besoin des utilisateurs.',
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
                  "In the club's data, 58 of the 80 mornings were not dry. Which success criteria suit the advisor best?",
              },
              fr: {
                prompt:
                  'Dans les données du club, 58 des 80\u00a0matins n’étaient pas secs. Quels critères de réussite conviennent le mieux au conseiller\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'At least 70% accuracy on the test set' },
                  fr: { text: 'Au moins 70\u00a0% d’exactitude sur le jeu de test' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'On the sealed test set: at most 1 dry morning in 10 missed, at most 1 in 4 of the other mornings watered for nothing, and, unlike either baseline, good on both counts at once',
                  },
                  fr: {
                    text: 'Sur le jeu de test scellé\u00a0: au plus 1\u00a0matin sec sur 10 raté, au plus 1\u00a0matin sur 4 arrosé pour rien parmi les autres, et, contrairement aux deux références, de bons résultats sur les deux comptes à la fois',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Every test morning right, with no mistake at all' },
                  fr: { text: 'Tous les matins de test justes, sans aucune erreur' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'We will decide once we have seen the first results' },
                  fr: { text: 'Nous déciderons après avoir vu les premiers résultats' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The rule "never water" would already score about 73% on this data while missing every dry morning, so accuracy alone says little: count each kind of mistake. No model is right every time, so a perfect score as the criterion only invites bent tests. And criteria written after the results tend to be fitted to them.',
              },
              fr: {
                text: 'La règle «\u00a0ne jamais arroser\u00a0» obtiendrait déjà environ 73\u00a0% sur ces données tout en ratant tous les matins secs\u00a0: l’exactitude seule dit peu de chose, alors compte chaque type d’erreur. Aucun modèle n’a raison à chaque fois\u00a0: exiger un score parfait pousse seulement à tordre les tests. Et des critères écrits après les résultats finissent par être taillés pour eux.',
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
                  'Which of these belong in the data plan of your design document? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquels de ces éléments ont leur place dans le plan de données de ton document de conception\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Where the examples come from, who labels them, and the written rule for each label',
                  },
                  fr: {
                    text: 'D’où viennent les exemples, qui les étiquette, et la règle écrite pour chaque étiquette',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'How many examples each label has, and whether they are balanced' },
                  fr: {
                    text: 'Combien d’exemples a chaque étiquette, et si elles sont équilibrées',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Which examples are kept apart as the sealed test set, and how they are chosen',
                  },
                  fr: {
                    text: 'Quels exemples sont mis de côté comme jeu de test scellé, et comment on les choisit',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'The name of the volunteer on duty each morning, to explain the mistakes later',
                  },
                  fr: {
                    text: 'Le nom du bénévole de service chaque matin, pour expliquer les erreurs plus tard',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'The accuracy that the model will reach' },
                  fr: { text: 'L’exactitude que le modèle atteindra' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "A data plan says where every example comes from, how it is labelled, how many there are and how they are split, before any is collected. The names of real people are personal data that the model does not need, and they invite blame. The model's accuracy is a result, not a plan: the success criteria say what you hope for, the tests say what you got.",
              },
              fr: {
                text: 'Un plan de données dit d’où vient chaque exemple, comment il est étiqueté, combien il y en a et comment on les répartit, avant toute collecte. Le nom de personnes réelles est une donnée personnelle dont le modèle n’a pas besoin, et il ouvre la porte aux reproches. L’exactitude du modèle est un résultat, pas un plan\u00a0: les critères de réussite disent ce que tu espères, les tests disent ce que tu as obtenu.',
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
                  "All 80 of the club's mornings were logged between September and December. Which mitigation fits this risk best?",
              },
              fr: {
                prompt:
                  'Les 80\u00a0matins du club ont tous été notés entre septembre et décembre. Quelle parade convient le mieux à ce risque\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Train the model for longer' },
                  fr: { text: 'Entraîner le modèle plus longtemps' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Add the sealed test mornings to the training data' },
                  fr: {
                    text: 'Ajouter les matins du jeu de test scellé aux données d’entraînement',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Write it in the limits, test on spring mornings as soon as they are logged, and have a person check the soil until then',
                  },
                  fr: {
                    text: 'L’écrire dans les limites, tester sur les matins de printemps dès qu’ils sont notés, et faire vérifier la terre par une personne d’ici là',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Leave it out of the documentation, so that the volunteers trust the advisor',
                  },
                  fr: {
                    text: 'Ne pas en parler dans la documentation, pour que les bénévoles fassent confiance au conseiller',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'No amount of training teaches a model about seasons it has never seen, and moving the test mornings into training only removes your honest measurement. Say what the data covers, test the new situation as soon as you can, and keep a person checking in the meantime. Hiding a limit does not remove it: it only moves the surprise to the users.',
              },
              fr: {
                text: 'Aucun entraînement ne peut apprendre à un modèle des saisons qu’il n’a jamais vues, et déplacer les matins de test dans l’entraînement ne fait que supprimer ta mesure honnête. Dis ce que couvrent les données, teste la nouvelle situation dès que possible, et garde une personne qui vérifie en attendant. Cacher une limite ne la fait pas disparaître\u00a0: la surprise est seulement reportée sur les utilisateurs.',
              },
            },
          },
          {
            id: 'q5',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'The riskiest assumption of a plan, such as whether a model can tell your labels apart at all, is best tested last, once the rest of the system is built.',
              },
              fr: {
                prompt:
                  'L’hypothèse la plus risquée d’un plan, par exemple savoir si un modèle peut tout simplement distinguer tes étiquettes, se teste de préférence en dernier, une fois le reste du système construit.',
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
                text: 'False. Test it first, and cheaply: ten rows on paper, or a throwaway project with five examples per label, can show in 15 minutes whether the idea can work. If it cannot, you have lost a quarter of an hour instead of the whole project.',
              },
              fr: {
                text: 'Faux. Teste-la en premier, et à peu de frais\u00a0: dix lignes sur papier, ou un projet jetable avec cinq exemples par étiquette, peuvent montrer en 15\u00a0minutes si l’idée peut marcher. Si elle ne le peut pas, tu as perdu un quart d’heure au lieu du projet entier.',
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
                  'Your plan uses Machine Learning for Kids with Try it now, and the project will take three sessions. What should the plan say?',
              },
              fr: {
                prompt:
                  'Ton plan utilise Machine Learning for Kids avec «\u00a0Essayer maintenant\u00a0», et le projet prendra trois séances. Que doit dire le plan\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Nothing special: the website keeps every project until you delete it',
                  },
                  fr: {
                    text: 'Rien de particulier\u00a0: le site garde chaque projet jusqu’à ce que tu le supprimes',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Keep the training examples in your own file so that the project can be rebuilt, train and run the test table in the same sitting, and ask your teacher whether the class has accounts',
                  },
                  fr: {
                    text: 'Garder les exemples d’entraînement dans ton propre fichier pour pouvoir reconstruire le projet, entraîner et passer le tableau de tests pendant la même séance, et demander à ton enseignant si la classe a des comptes',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Paste the project key into RoboHolic, so that it is not lost' },
                  fr: { text: 'Coller la clé du projet dans RoboHolic, pour ne pas la perdre' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Create three Try it now projects at once, one per session' },
                  fr: {
                    text: 'Créer trois projets «\u00a0Essayer maintenant\u00a0» à la fois, un par séance',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A Try it now project is deleted after at least four hours, and only one can exist at a time. Keeping your examples lets you rebuild it in minutes, and testing in the same sitting keeps your results. Class accounts, which a teacher sets up, keep projects from one lesson to the next. A key never goes into RoboHolic or into anything you hand in.',
              },
              fr: {
                text: 'Un projet «\u00a0Essayer maintenant\u00a0» est effacé au bout d’au moins quatre heures, et un seul peut exister à la fois. Garder tes exemples te permet de le reconstruire en quelques minutes, et tester pendant la même séance préserve tes résultats. Les comptes de classe, qu’un enseignant met en place, conservent les projets d’une leçon à l’autre. Une clé ne va jamais dans RoboHolic, ni dans aucun des travaux que tu rends.',
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
                  'The club\'s sealed test set has 20 mornings: 6 dry and 14 not dry. On how many of them would the baseline "always water" make the volunteers water for nothing? (a number)',
              },
              fr: {
                prompt:
                  'Le jeu de test scellé du club compte 20\u00a0matins\u00a0: 6\u00a0secs et 14\u00a0pas secs. Sur combien de ces matins la référence «\u00a0toujours arroser\u00a0» ferait-elle arroser pour rien\u00a0? (un nombre)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                '14',
                'fourteen',
                '14 mornings',
                'fourteen mornings',
                '14 of 20',
                '14 out of 20',
                '14/20',
                '14 of 14',
                '14/14',
                'all 14',
              ],
              fr: [
                '14',
                'quatorze',
                '14 matins',
                'quatorze matins',
                '14 sur 20',
                '14/20',
                '14 sur 14',
                '14/14',
                'les 14',
                'tous les 14',
              ],
            },
            explanation: {
              en: {
                text: '14. The baseline "always water" waters every morning, so it never misses a dry one (0 of 6), but it waters for nothing on all 14 of the others. That is why the club counts both kinds of mistake: each baseline wins on one count and loses on the other, and a useful model must do well on both.',
              },
              fr: {
                text: '14. La référence «\u00a0toujours arroser\u00a0» fait arroser tous les matins\u00a0: elle ne rate donc jamais un matin sec (0 sur 6), mais elle fait arroser pour rien les 14\u00a0autres. C’est pourquoi le club compte les deux types d’erreur\u00a0: chaque référence gagne sur un compte et perd sur l’autre, et un modèle utile doit bien s’en sortir sur les deux.',
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
        kind: 'project',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Engineering challenge: an AI system, designed, tested and presented',
            brief:
              'Plan, build, test and present a small AI system that solves a real problem for people around you: your class, a school club, the school garden, the canteen. Choose the route that your tools allow: Machine Learning for Kids (your own text, images, numbers or sounds model, used from Python or Scratch, or tested on its Learn & Test page), Python (a pipeline around a model, such as your Machine Learning for Kids model or a service that your teacher provides) or a no-code tool that your teacher approves. Follow the two lessons of the Engineering challenge module ("Plan your AI system" and "Build, test and present"): write your one-page design document before you build, build in small steps from a baseline, test with a table of cases written in advance, write down the limits and prepare a 3-minute presentation. You are the engineer: the AI does one clear job inside your system, and you are responsible for checking it. Use only tools and accounts that your teacher approves, and never create your own account with an AI provider to get a key. You may hand in code that you could not run: say which results you traced by hand. With Try it now, a Machine Learning for Kids project is deleted after at least four hours, so keep your training examples in your own file, and train and test in the same sitting. Never write down a result you did not observe: "not tested yet" is an honest answer, and an invented number is not. Plan for several sessions, about 3 to 4 hours in all, as your teacher decides.',
            requirements:
              'Hand in six things.\n\n1. Your design document: the page you wrote in "Plan your AI system", with its eleven sections, marked version 1, and the changes you made while building, marked version 2. Your success criteria must be the ones you wrote before you built anything.\n2. Your system: the code (a Python file or notebook, with your key or your model\'s address replaced by YOUR-KEY), or, for the Machine Learning for Kids or no-code route, your labels with the number of training examples of each, and screenshots of the trained model being tested, with no personal data in them. A link to your project is welcome if your teacher can open it.\n3. Your build log: at least three versions, starting with the baseline, each with what changed and its result on your practice cases.\n4. Your test table: at least 15 cases written before you ran them, including behaviour tests (at least one missing or impossible input and one edge case) and model tests on examples the model never saw, each with the expected result, the result, pass or fail, and how it was tested (run, traced by hand or on a website); then a summary that compares your counts with your success criteria and your baseline.\n5. Your limits: what the system was trained and tested on, its known failures, who is affected when it is wrong, what users should do, what has not been tested yet and its out-of-scope uses.\n6. Your 3-minute presentation: your slides (as a PDF or as images) or your script, with three example inputs, including one where the system fails. If your teacher organises presentations, give yours to the class too.\n\nAdd a line on AI help: which tools helped you, with what, and how you checked their work.\n\nHow to send it: the simplest is one PDF that holds everything, with your code at the end. You can also choose Code and paste your program, then write the rest in "About your work" (up to 5,000 characters: if it does not fit, choose PDF or Text instead); send everything as Text; send photos of your paper pages as Image (no names or faces in them, up to five files); or send a link to a shared document that your teacher can open.\n\nRules: no personal data anywhere (no names, photos, voices or contact details of real people); no key; invented or anonymous data only, and objects, never people; respect the licence of any data you did not make, and credit it; credit any code or AI help you used.\n\nHow it is assessed: Technical quality (a design document with testable requirements and success criteria written before building; a system built in steps from a baseline that works end to end, run or honestly traced; a complete, honest test table); Understanding (you explain how your system works and why it fails, with the ideas of the course: features and labels, baselines, sealed test sets, confidence and thresholds, pipelines, in your limits and your 3-minute presentation); Responsible use of AI (a person in the loop, limits written as facts, privacy and keys protected, AI help credited); Creativity (a useful idea for real users, and hard test cases well chosen).',
          },
          fr: {
            title: 'Défi d’ingénierie\u00a0: un système d’IA conçu, testé et présenté',
            brief:
              'Conçois, construis, teste et présente un petit système d’IA qui résout un vrai problème pour les gens autour de toi\u00a0: ta classe, un club du lycée, le potager, la cantine. Choisis la voie que permettent tes outils\u00a0: Machine Learning for Kids (ton propre modèle de textes, d’images, de nombres ou de sons, utilisé depuis Python ou Scratch, ou testé sur sa page Apprendre & Tester), Python (un pipeline autour d’un modèle, comme ton modèle de Machine Learning for Kids ou un service fourni par ton enseignant) ou un outil sans code approuvé par ton enseignant. Suis les deux leçons du module Défi d’ingénierie («\u00a0Planifie ton système d’IA\u00a0» et «\u00a0Construis, teste et présente\u00a0»)\u00a0: rédige ton document de conception d’une page avant de construire, construis par petites étapes à partir d’une référence, teste avec un tableau de cas écrits à l’avance, note les limites et prépare une présentation de 3\u00a0minutes. C’est toi l’ingénieur\u00a0: l’IA remplit une mission claire dans ton système, et c’est à toi de la vérifier. N’utilise que des outils et des comptes approuvés par ton enseignant, et ne crée jamais toi-même de compte chez un fournisseur d’IA pour obtenir une clé. Tu peux rendre du code que tu n’as pas pu exécuter\u00a0: indique quels résultats tu as obtenus en suivant le code à la main. Avec «\u00a0Essayer maintenant\u00a0», un projet de Machine Learning for Kids est effacé au bout d’au moins quatre heures\u00a0: garde tes exemples d’entraînement dans ton propre fichier, et entraîne et teste pendant la même séance. Ne note jamais un résultat que tu n’as pas observé\u00a0: «\u00a0pas encore testé\u00a0» est une réponse honnête, un nombre inventé ne l’est pas. Prévois plusieurs séances, environ 3 à 4\u00a0heures au total, selon ce que décide ton enseignant.',
            requirements:
              'Rends six éléments.\n\n1. Ton document de conception\u00a0: la page rédigée dans la leçon «\u00a0Planifie ton système d’IA\u00a0», avec ses onze rubriques, marquée version\u00a01, et les changements faits pendant la construction, marqués version\u00a02. Tes critères de réussite doivent être ceux que tu as écrits avant de construire quoi que ce soit.\n2. Ton système\u00a0: le code (un fichier Python ou un notebook, avec ta clé ou l’adresse de ton modèle remplacée par YOUR-KEY), ou, pour la voie Machine Learning for Kids ou sans code, tes étiquettes avec le nombre d’exemples d’entraînement de chacune, et des captures d’écran de ton modèle entraîné, prises pendant que tu le testes, sans aucune donnée personnelle. Un lien vers ton projet est bienvenu si ton enseignant peut l’ouvrir.\n3. Ton journal de construction\u00a0: au moins trois versions, en commençant par la référence, chacune avec ce qui a changé et son résultat sur tes exemples de mise au point.\n4. Ton tableau de tests\u00a0: au moins 15\u00a0cas écrits avant de les lancer, dont des tests de comportement (au moins une entrée manquante ou impossible et un cas limite) et des tests du modèle sur des exemples qu’il n’a jamais vus, chacun avec le résultat attendu, le résultat obtenu, réussi ou échoué, et la façon dont il a été testé (exécuté, suivi à la main ou sur un site)\u00a0; puis un bilan qui compare tes comptes avec tes critères de réussite et ta référence.\n5. Tes limites\u00a0: sur quoi le système a été entraîné et testé, ses échecs connus, qui est touché quand il se trompe, ce que doivent faire les utilisateurs, ce qui n’a pas encore été testé et ses usages hors périmètre.\n6. Ta présentation de 3\u00a0minutes\u00a0: tes diapositives (en PDF ou en images) ou ton texte, avec trois exemples d’entrées, dont un où le système échoue. Si ton enseignant organise des présentations, fais aussi la tienne devant la classe.\n\nAjoute une ligne sur l’aide de l’IA\u00a0: quels outils t’ont aidé, pour quoi, et comment tu as vérifié leur travail.\n\nPour l’envoyer\u00a0: le plus simple est un seul PDF qui contient tout, avec ton code à la fin. Tu peux aussi choisir Code et coller ton programme, puis écrire le reste dans «\u00a0À propos de votre travail\u00a0» (5\u00a0000\u00a0caractères au plus\u00a0: si cela ne tient pas, choisis plutôt PDF ou Texte)\u00a0; envoyer tout sous forme de texte\u00a0; envoyer des photos de tes pages papier sous forme d’images (sans nom ni visage, cinq fichiers au plus)\u00a0; ou envoyer un lien vers un document partagé que ton enseignant peut ouvrir.\n\nRègles\u00a0: aucune donnée personnelle nulle part (ni nom, ni photo, ni voix, ni coordonnées de personnes réelles)\u00a0; aucune clé\u00a0; uniquement des données inventées ou anonymes, et des objets, jamais des personnes\u00a0; respecte la licence de toute donnée que tu n’as pas produite, et cite sa source\u00a0; cite tout code et toute aide de l’IA dont tu t’es servi.\n\nCritères d’évaluation\u00a0: Qualité technique (un document de conception avec des exigences vérifiables et des critères de réussite écrits avant de construire\u00a0; un système construit par étapes à partir d’une référence, qui marche de bout en bout, exécuté ou honnêtement suivi à la main\u00a0; un tableau de tests complet et honnête)\u00a0; Compréhension (tu expliques comment fonctionne ton système et pourquoi il échoue, avec les notions du cours\u00a0: caractéristiques et étiquettes, références, jeux de test scellés, confiance et seuils, pipelines, dans tes limites et ta présentation de 3\u00a0minutes)\u00a0; Usage responsable de l’IA (une personne dans la boucle, des limites écrites comme des faits, la vie privée et les clés protégées, l’aide de l’IA citée)\u00a0; Créativité (une idée utile pour de vrais utilisateurs, et des cas de test difficiles bien choisis).',
          },
        },
        allowedSubmissionTypes: ['code', 'text', 'link', 'pdf', 'image'],
        rubric: [
          { key: 'technicalQuality', weight: 35 },
          { key: 'understanding', weight: 25 },
          { key: 'responsibleAi', weight: 25 },
          { key: 'creativity', weight: 15 },
        ],
        xpReward: 500,
        requiredForCertificate: true,
      },
    },
  ],
};
