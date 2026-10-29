// Module m2 of "AI Engineering with Python" (ages 14-16): machine learning basics. It comes after
// m1 (Python for AI), whose last lesson ends with a clean table whose columns become features and
// a label, and before m3 (language and vision), m4 (APIs and automation) and m5 (the engineering
// challenge). It builds on m1's roof weather station (the same club, its clean readings and its
// yes/no rain label), on most_common from "Python essentials for data" (here, the majority-class
// baseline) and on the duplicates of "Working with data" (a duplicate on both sides of a split).
// m2-l1: supervised learning (examples, features, label, training, prediction), classification
// and regression (does "being close" mean anything?), numbers that are really categories, the
// same question asked both ways; a train/test split (about 20%, by time for data recorded over
// time), the sealed test set, accuracy, the majority-class baseline, mean absolute error and the
// mean baseline, small test sets, mistakes of different cost. The hook is an invented forecast
// (72% against a 75% "always no rain" rule; the size of its test set is not given). The watch
// stage reuses the Crash Course AI #2 video (4qVRBYAdLAo), already curated in
// from-ai-user-to-ai-developer m1-l1, with our own caption and summary written from that course's
// curated summary; the caption marks it optional, as the episode is long for a 40-minute lesson.
// The Python code activity (a second version of the hook's model, on the club's fifty days:
// trained on the first 40 days from 1 March, tested on the next 10), traced by hand
// (checked with Python 3, with a solution of each TODO): line 1 prints "model accuracy: 80%",
// line 2 "baseline always says: no", line 3 "model MAE: 0.80 °C"; the baseline scores 70%, its
// mean is 11.25 and its MAE 1.35 °C; the model catches 2 of the 3 rainy test days, the baseline
// none. Then a quiz_me tutor activity and a reflection.
// m2-l2: Machine Learning for Kids, Titanic (worksheet-titanic-python.pdf, beginner, numbers,
// Python only, last updated 12 December 2024; teacher's notes teachersnotes-titanic.pdf and
// teachersnotes-titanic-fr.pdf: 45 minutes, "might be upsetting for some children", reviewing the
// training data is "the most significant part"). The worksheet logs in, but the "Copy template"
// button of the Projects page is shown to every signed-in user, Try it now included
// (public/components/projects/projects.html at taxinomitis f360de1), and numbers projects offer
// Python and Colab (supportedMakes in projects.service.js), so access is try_it_now and step 1
// says to skip the login. With "Store on your computer", as the worksheet does, the Python sample
// has no key, only the model's status URL (modelurl), which lets anyone download the model while
// it is online; a cloud project's sample also has a key that can add training examples
// (pythonnumbers.html and resources/mlforkidsnumbers.py). Hence one rule for both secrets: the ML4K
// page and the learner's own notebook only, YOUR-KEY in anything brought back, never pasted into
// RoboHolic. The model is a gradient-boosted trees model (ydf GradientBoostedTreesLearner in
// mlforkids-newnumbers/app/models.py), described as "many small decision trees". The template's
// numbers come from mlforkids-api/resources/datasets/numbers/titanic.json at the same commit: 712
// passengers, 288 survived and 424 did not (baseline 60%); every row has a ticket class, so the
// dataset holds no crew, most of whom died (b3); by class and gender, survived / did not:
// women 80/3, 68/6, 47/55 and men 40/61, 15/84, 38/215 (the paper fallback's table); the rule
// "women survived" gets 555 right (78%), "women of first and second class survived" 563 (79%). The
// feature names and the shortened ports (Southampt, Queenstwn) are the dataset's. Historical facts
// are kept to what is well established (date, route, more than 1,500 of about 2,200 died, lifeboats
// for about half, "women and children first", lower-deck third-class cabins, lifeboat places for
// all required afterwards), and the reasons are given as historians' explanations. The respect
// note, the invented-passengers rule and the "no would-I-have-survived games" rule follow the
// teacher's notes' warning; a learner the subject upsets can ask the teacher for another numbers
// dataset (b1 and project-m2). The template (code_activity, stage build) is our own code around the
// two lines the learner pastes from the site; while project is None it answers with the baseline,
// so every row reads did_not_survive 60% (checked with Python 3, and with a stand-in model).
// Hand-in project-m2 (assignment, 150 XP, not needed for the certificate) takes code, text or image;
// a code submission carries no attachments, so the table and the limitation go in "About your
// work". The module quiz quiz-m2 (both lessons) and the closing reflection end the lesson. A short
// answer takes at most 10 accepted answers per language, and a French attempt is also checked
// against the English ones, so q4's French list holds only the French forms.
// The worksheet is CC BY-NC-SA 4.0: it is linked, never copied or translated, and the numbered
// steps are our own framing that defers to the PDF for the clicks; the worksheet tests with two
// film characters, the lesson with passengers the learner invents. French learners get the English
// PDF; the French site's labels are Essayer maintenant, Projets, Copier le modèle (the French word
// for "template" is also the word for "model", hence the note in step 2), Les rescapés du Titanic,
// Entraîner, Apprendre & Tester and Faire. The instructions and hints of code_activity and
// ai_activity blocks, the bringBack and hint of the ml_activity block, reflection prompts and quiz
// texts are plain text (the player renders no Markdown there), so they use no backticks, as in m1.
// French typography uses \u00a0 escapes, as in the other course files. The last key rule of b2
// glosses environment variables and points ahead to "Calling AI services safely" (m4-l1), which
// explains them: the templates of m2-l2 and m3-l1 read the key from one before m4 teaches it.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m2: SeedModulePart = {
  module: {
    id: 'm2',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Machine learning basics',
          description:
            'Classification and regression, training and testing honestly against a baseline, then a model trained on a real historical dataset, the Titanic passenger records, and called from your own Python program.',
        },
        fr: {
          title: 'Les bases de l’apprentissage automatique',
          description:
            'Classification et régression, entraînement et test honnêtes face à une référence, puis un modèle entraîné sur un vrai jeu de données historique, les registres des passagers du Titanic, et appelé depuis ton propre programme Python.',
        },
      },
    },
    lessons: [
      // --- m2-l1: Classification, regression and evaluation --------------------------------------
      {
        id: 'm2-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Classification, regression and evaluation',
              summary:
                'Supervised learning with features and labels, classification and regression, a train/test split, and the baseline every model must beat, scored with accuracy for categories and mean absolute error for numbers.',
            },
            fr: {
              title: 'Classification, régression et évaluation',
              summary:
                'L’apprentissage supervisé avec ses caractéristiques et ses étiquettes, la classification et la régression, la séparation entraînement/test, et la référence que tout modèle doit battre, mesurée par l’exactitude pour les catégories et par l’erreur absolue moyenne pour les nombres.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'A forecast that never looks at the sky',
                body: 'The school club of the last module now has fifty days of clean readings from its roof weather station, and a new goal: every afternoon, show a forecast on the screen in the school hall, *rain tomorrow* or *no rain tomorrow*. One member trains a model and proudly reports: **right on 72% of the test days**.\n\nAnother member is not impressed. At this time of year, in the club\'s town, it rains on about one day in four. A "forecast" that always says *no rain*, without looking at a single reading, would be right about 75% of the time. On accuracy, the model does worse than a one-line rule.\n\nThat is the question of this lesson: what exactly are you predicting, and how do you know that your model is any good? You will meet the two big families of supervised learning, see how to test a model on data it has never seen, and always compare it with the simplest possible guess: a **baseline**.',
              },
              fr: {
                heading: 'Une prévision qui ne regarde jamais le ciel',
                body: 'Le club du lycée du module précédent dispose maintenant de cinquante jours de mesures propres venant de sa station météo sur le toit, et d’un nouvel objectif\u00a0: afficher chaque après-midi, sur l’écran du hall, une prévision, *pluie demain* ou *pas de pluie demain*. Un membre entraîne un modèle et annonce fièrement\u00a0: **juste pour 72\u00a0% des jours de test**.\n\nUne autre élève du club n’est pas impressionnée. À cette période de l’année, dans la ville du club, il pleut environ un jour sur quatre. Une «\u00a0prévision\u00a0» qui annonce toujours *pas de pluie*, sans regarder la moindre mesure, aurait raison environ 75\u00a0% du temps. Pour ce qui est de l’exactitude, le modèle fait moins bien qu’une règle d’une ligne.\n\nC’est la question de cette leçon\u00a0: que prédit-on exactement, et comment savoir si un modèle est vraiment bon\u00a0? Tu vas découvrir les deux grandes familles de l’apprentissage supervisé, voir comment tester un modèle sur des données qu’il n’a jamais vues, et toujours le comparer à la prévision la plus simple possible\u00a0: une **référence** (*baseline*).',
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
                heading: 'Features, labels and two kinds of task',
                body: "In **supervised learning**, a model learns from examples whose answer is already known. The roof station's clean table, now with humidity and air-pressure readings and a label for the next day, is exactly that:\n\n| temp_c | humidity_pct | pressure_hpa | rain_tomorrow |\n|---|---|---|---|\n| 9.5 | 88 | 1004 | yes |\n| 12.5 | 61 | 1021 | no |\n| 11.0 | 79 | 1012 | yes |\n\n- Each **row** is an **example**: one day.\n- The **features** are the inputs the model may look at: the temperature, the humidity, the air pressure.\n- The **label** is the answer to learn: here, *will it rain tomorrow?* Every training day has one, because its next day has already happened.\n- **Training** means adjusting a model so that its outputs match the labels of the training examples as often as possible. **Prediction** means using the trained model on a new row whose label nobody knows yet.\n\n**Two kinds of label, two kinds of task.**\n\n| Task | The label is... | Examples | The model gives... |\n|---|---|---|---|\n| **Classification** | A category, from a fixed list | Rain tomorrow: yes or no. Which bin: paper, plastic or other. Did a passenger survive? | A label, often with a confidence |\n| **Regression** | A number on a scale | Tomorrow's maximum temperature in °C. How many minutes late the bus will be. | A number |\n\nTo tell them apart, ask whether *being close* means anything. Predicting 11 °C on a 12 °C day is nearly right; predicting *plastic* for a piece of *paper* is simply wrong. Watch out for numbers that are really categories: a ticket class 1, 2 or 3, a postcode, a room number. Their average makes no sense: treat them as categories, or at most as an order (first class comes before second), never as quantities.\n\nThe same question can often be asked both ways, and you choose: *how many minutes late will the bus be?* (regression) or *will it be more than 5 minutes late?* (classification).\n\nWhatever the task, the model understands neither weather nor buses. It finds patterns that link the feature columns to the label column, and it only knows the situations that its examples contain.",
              },
              fr: {
                heading: 'Caractéristiques, étiquettes et deux sortes de tâches',
                body: 'En **apprentissage supervisé**, un modèle apprend à partir d’exemples dont on connaît déjà la réponse. Le tableau propre de la station du toit, complété par l’humidité, la pression de l’air et une étiquette pour le lendemain, en est un parfait exemple (temp_c = température en °C, humidity_pct = humidité en %, pressure_hpa = pression en hectopascals, rain_tomorrow = pluie le lendemain, yes = oui, no = non)\u00a0:\n\n| temp_c | humidity_pct | pressure_hpa | rain_tomorrow |\n|---|---|---|---|\n| 9.5 | 88 | 1004 | yes |\n| 12.5 | 61 | 1021 | no |\n| 11.0 | 79 | 1012 | yes |\n\n- Chaque **ligne** est un **exemple**\u00a0: un jour.\n- Les **caractéristiques** (*features*) sont les informations que le modèle a le droit d’observer\u00a0: la température, l’humidité, la pression de l’air.\n- L’**étiquette** (*label*) est la réponse à apprendre\u00a0: ici, *pleuvra-t-il demain\u00a0?* Chaque jour d’entraînement en a une, puisque son lendemain a déjà eu lieu.\n- **Entraîner** un modèle, c’est l’ajuster pour que ses sorties correspondent le plus souvent possible aux étiquettes des exemples d’entraînement. **Prédire**, c’est utiliser le modèle entraîné sur une nouvelle ligne dont personne ne connaît encore l’étiquette.\n\n**Deux sortes d’étiquettes, deux sortes de tâches.**\n\n| Tâche | L’étiquette est… | Exemples | Le modèle donne… |\n|---|---|---|---|\n| **Classification** | Une catégorie, choisie dans une liste fixe | Pluie demain\u00a0: oui ou non. Quelle poubelle\u00a0: papier, plastique ou autre. Un passager a-t-il survécu\u00a0? | Une étiquette, souvent avec une confiance |\n| **Régression** | Un nombre sur une échelle | La température maximale de demain en °C. Le nombre de minutes de retard du bus. | Un nombre |\n\nPour les distinguer, demande-toi si *être proche* veut dire quelque chose. Prédire 11\u00a0°C pour une journée à 12\u00a0°C, c’est presque juste\u00a0; prédire *plastique* pour un morceau de *papier*, c’est faux, tout simplement. Méfie-toi des nombres qui sont en réalité des catégories\u00a0: une classe de billet 1, 2 ou 3, un code postal, un numéro de salle. Leur moyenne n’a aucun sens\u00a0: traite-les comme des catégories, ou tout au plus comme un ordre (la première classe passe avant la deuxième), jamais comme des quantités.\n\nOn peut souvent poser la même question des deux façons, et c’est à toi de choisir\u00a0: *combien de minutes de retard aura le bus\u00a0?* (régression) ou *aura-t-il plus de 5\u00a0minutes de retard\u00a0?* (classification).\n\nQuelle que soit la tâche, le modèle ne comprend ni la météo ni les bus. Il repère des régularités qui relient les colonnes des caractéristiques à la colonne de l’étiquette, et il ne connaît que les situations que contiennent ses exemples.',
              },
            },
            data: {},
          },
          {
            id: 'm2-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Test it honestly: split, score, compare',
                body: "A model is only useful on examples it has never seen, so that is where it must be **tested**.\n\n1. **Split before you train.** Keep part of the labelled data aside as a **test set**, often about 20%, and train on the rest, the **training set**. For data recorded over time, like the station's, test on the *latest* days and train on the earlier ones: that is the situation the model will face, predicting a future it has not seen.\n2. **Keep the test set sealed.** Look at it once, at the end. If you tune the model until it scores well on the test set, or if the same example sits in both sets (the duplicates of *Working with data*), the score becomes too good to be true.\n3. **Score it.** For classification, **accuracy** = correct predictions ÷ test examples.\n4. **Compare it with a baseline**: the simplest guess, one that ignores the features.\n\n| Task | Baseline | Score to compare |\n|---|---|---|\n| Classification | Always predict the **most common label of the training set**, the majority class: your `most_common` function of *Python essentials for data* | Accuracy |\n| Regression | Always predict the **mean of the training labels** | Mean absolute error |\n\nThe **mean absolute error** (MAE) scores a regression model: for each test example, take the size of the error, whatever its sign, then average them. It is in the unit of the label: an MAE of 0.8 °C means that the predictions are 0.8 °C away from the truth on average. Lower is better, and 0 would be perfect.\n\nA model that does not clearly beat its baseline has probably learned little, however impressive its score sounds. Before you decide, look at two more things. The size of the test set: with 10 test days, a single day moves the accuracy by 10 points. And the kinds of mistakes: accuracy counts every mistake the same, but for the club, a missed rainy day (and a soaked sports kit) may matter more than a false alarm. When one kind of mistake matters more, count each kind separately, as you will in the activity.",
              },
              fr: {
                heading: 'Teste honnêtement\u00a0: séparer, mesurer, comparer',
                body: 'Un modèle n’est utile que sur des exemples qu’il n’a jamais vus\u00a0: c’est donc sur de tels exemples qu’il faut le **tester**.\n\n1. **Sépare avant d’entraîner.** Mets de côté une partie des données étiquetées, souvent environ 20\u00a0%, comme **jeu de test**, et entraîne le modèle sur le reste, le **jeu d’entraînement**. Pour des données enregistrées au fil du temps, comme celles de la station, teste sur les jours *les plus récents* et entraîne sur les jours précédents\u00a0: c’est la situation que le modèle rencontrera, prédire un avenir qu’il n’a pas vu.\n2. **Garde le jeu de test sous scellés.** Ne le regarde qu’une fois, à la fin. Si tu ajustes le modèle jusqu’à ce qu’il obtienne un bon score sur le jeu de test, ou si un même exemple se trouve dans les deux jeux (les doublons de la leçon *Travailler avec des données*), le score devient trop beau pour être vrai.\n3. **Mesure.** Pour une classification, l’**exactitude** (*accuracy*) = prédictions justes ÷ exemples de test.\n4. **Compare avec une référence**\u00a0: la prévision la plus simple, qui ignore les caractéristiques.\n\n| Tâche | Référence | Mesure à comparer |\n|---|---|---|\n| Classification | Toujours prédire l’**étiquette la plus fréquente du jeu d’entraînement**, la classe majoritaire\u00a0: ta fonction `most_common` de la leçon *L’essentiel de Python pour les données* | Exactitude |\n| Régression | Toujours prédire la **moyenne des étiquettes d’entraînement** | Erreur absolue moyenne |\n\nL’**erreur absolue moyenne** (*mean absolute error*, MAE) sert à évaluer un modèle de régression\u00a0: pour chaque exemple de test, on prend l’écart entre la prédiction et la vérité en valeur absolue, c’est-à-dire sans tenir compte du signe, puis on fait la moyenne de ces écarts. Elle s’exprime dans l’unité de l’étiquette\u00a0: une MAE de 0,8\u00a0°C signifie que les prédictions s’écartent de la vérité de 0,8\u00a0°C en moyenne. Plus elle est basse, mieux c’est, et 0 serait parfait.\n\nUn modèle qui ne bat pas nettement sa référence n’a sans doute pas appris grand-chose, aussi impressionnant que paraisse son score. Avant de conclure, regarde deux autres choses. La taille du jeu de test\u00a0: avec 10\u00a0jours de test, un seul jour fait varier l’exactitude de 10\u00a0points. Et les types d’erreurs\u00a0: l’exactitude compte toutes les erreurs de la même façon, mais pour le club, un jour de pluie manqué (et des tenues de sport trempées) compte peut-être plus qu’une fausse alerte. Quand un type d’erreur pèse plus lourd, compte chaque type à part, comme tu le feras dans l’activité.',
              },
            },
            data: {},
          },
          {
            id: 'm2-l1-b4',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: Supervised Learning (Crash Course AI #2)',
                caption:
                  'From the Crash Course AI series: a program learns to tell donuts from bagels from labelled examples. As you watch, spot the features, the label and how the mistakes are counted. Optional if time is short: the activity below matters more.',
                transcript:
                  'In short: supervised learning means learning from examples that come with the right answer, the label. The episode sets a bakery problem, telling donuts from bagels, and turns each item into measurable features. These go into a perceptron, a very simple model loosely inspired by a neuron: it multiplies each input by a weight, adds them up and compares the total with a threshold to decide. During training, the weights are nudged every time the model gets an example wrong. The episode also introduces precision and recall, two ways of counting different kinds of mistakes; this lesson sticks to accuracy, a baseline and counting the rainy days a model catches. Keep in mind: the perceptron does not know what a donut is; it only learns the patterns that its labelled examples contain.',
              },
              fr: {
                title: 'Regarde\u00a0: l’apprentissage supervisé (Crash Course AI, épisode\u00a02)',
                caption:
                  'Une vidéo en anglais de la série Crash Course AI\u00a0: un programme apprend à distinguer les donuts des bagels grâce à des exemples étiquetés. Repère les caractéristiques, l’étiquette et la façon de compter les erreurs. Facultatif si le temps manque\u00a0: l’activité ci-dessous compte davantage.',
                transcript:
                  'En bref\u00a0: l’apprentissage supervisé consiste à apprendre à partir d’exemples accompagnés de la bonne réponse, l’étiquette. L’épisode pose un problème de boulangerie, distinguer les donuts des bagels, et transforme chaque article de la boulangerie en caractéristiques mesurables. Celles-ci sont données à un perceptron, un modèle très simple vaguement inspiré d’un neurone\u00a0: il multiplie chaque entrée par un poids, additionne le tout et compare le total à un seuil pour décider. Pendant l’entraînement, les poids sont légèrement corrigés chaque fois que le modèle se trompe sur un exemple. L’épisode présente aussi la précision et le rappel, deux façons de compter différents types d’erreurs\u00a0; cette leçon s’en tient à l’exactitude, à une référence et au nombre de jours de pluie qu’un modèle repère. À retenir\u00a0: le perceptron ne sait pas ce qu’est un donut\u00a0; il apprend seulement les régularités que contiennent ses exemples étiquetés.',
              },
            },
            data: {
              source: 'youtube',
              videoId: '4qVRBYAdLAo',
              fileId: null,
              durationSeconds: null,
            },
          },
          {
            id: 'm2-l1-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Judge the roof station's model. After the disappointing result at the start of this lesson, the club member trained a second version. It was trained on the first 40 days of readings, from 1 March, and tested on the 10 days that followed; its test predictions are written in the code, because what you are learning here is how to judge them. Your code is saved, not run, so trace it by hand:\n\n1. Write what lines 1, 2 and 3 print. Compare model_pred with test_truth position by position, as zip does.\n2. TODO 1: build the predictions of the baseline, one per test day, and print their accuracy. Does the model beat the baseline? By how many test days? Would you trust that difference with only 10 days?\n3. Count by hand how many of the 3 rainy test days the model caught, and how many the baseline caught. Why might that matter more to the club than accuracy?\n4. Why is the baseline label taken from the training days, and not from the test days?\n5. TODO 2: the regression baseline. Compute the mean of train_temps, build its predictions and print its MAE. Does the model beat it?\n6. In a comment: why would accuracy be a poor score for temperatures? Explain the model's MAE in one sentence that a club member would understand.\n\nIf your school gives you a Python environment, such as Jupyter, you can run the program there and compare its output with your trace.",
                hint: '[baseline_label] * len(test_truth) makes a list that repeats the label once per test day. For TODO 2, the mean is sum(train_temps) / len(train_temps), and [m] * len(test_temps) repeats it once per test day. abs drops the sign of a number: abs(-1.5) is 1.5.',
              },
              fr: {
                instructions:
                  'Juge le modèle de la station du toit. Après le résultat décevant du début de la leçon, le membre du club en a entraîné une deuxième version. Elle a été entraînée sur les 40\u00a0premiers jours de mesures, à partir du 1er\u00a0mars, et testée sur les 10\u00a0jours suivants\u00a0; ses prédictions de test sont écrites dans le code, car ce que tu apprends ici, c’est à les juger. Dans le code, les noms sont en anglais\u00a0: train_counts = effectifs des jours d’entraînement, test_truth = vérité des jours de test, model_pred = prédictions du modèle, most_common = la plus fréquente, accuracy = exactitude, baseline = référence, train_temps = températures d’entraînement, mean_absolute_error = erreur absolue moyenne, yes = oui, no = non. Ton code est enregistré, pas exécuté\u00a0: suis-le à la main.\n\n1. Écris ce qu’affichent les lignes 1, 2 et 3. Compare model_pred et test_truth position par position, comme le fait zip.\n2. TODO\u00a01\u00a0: construis les prédictions de la référence, une par jour de test, et affiche leur exactitude. Le modèle bat-il la référence\u00a0? De combien de jours de test\u00a0? Ferais-tu confiance à cet écart avec seulement 10\u00a0jours\u00a0?\n3. Compte à la main combien des 3\u00a0jours de pluie du test le modèle a repérés, et combien la référence en a repéré. Pourquoi cela pourrait-il compter davantage que l’exactitude pour le club\u00a0?\n4. Pourquoi l’étiquette de la référence vient-elle des jours d’entraînement, et non des jours de test\u00a0?\n5. TODO\u00a02\u00a0: la référence de la régression. Calcule la moyenne de train_temps, construis ses prédictions et affiche sa MAE. Le modèle la bat-il\u00a0?\n6. Dans un commentaire\u00a0: pourquoi l’exactitude serait-elle une mauvaise mesure pour des températures\u00a0? Explique la MAE du modèle en une phrase qu’un membre du club comprendrait.\n\nSi ton établissement te donne accès à un environnement Python, comme Jupyter, tu peux y exécuter le programme et comparer sa sortie avec ta trace.',
                hint: '[baseline_label] * len(test_truth) crée une liste qui répète l’étiquette une fois par jour de test. Pour le TODO\u00a02, la moyenne vaut sum(train_temps) / len(train_temps), et [m] * len(test_temps) la répète une fois par jour de test. abs enlève le signe d’un nombre\u00a0: abs(-1.5) vaut 1.5.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# The roof station again: a model trained on its first 40 days (from 1 March), tested on',
                '# the 10 days that followed. / Entraîné sur ses 40 premiers jours, testé sur les 10 suivants.',
                '',
                '# Part 1: classification. Will it rain tomorrow? ("yes" or "no")',
                'train_counts = {"no": 29, "yes": 11}  # the labels of the 40 training days, counted',
                '',
                'test_truth = ["no", "yes", "no", "no", "yes", "no", "no", "yes", "no", "no"]',
                'model_pred = ["no", "yes", "yes", "no", "no", "no", "no", "yes", "no", "no"]',
                '',
                '',
                'def most_common(counts):',
                '    """The label with the largest count, as in Python essentials for data."""',
                '    best_label, best_count = None, 0',
                '    for label, count in counts.items():',
                '        if count > best_count:',
                '            best_label, best_count = label, count',
                '    return best_label',
                '',
                '',
                'def accuracy(predictions, truths):',
                '    """The share of predictions that match the truth, from 0 to 1."""',
                '    correct = 0',
                '    # zip pairs the two lists: (1st prediction, 1st truth), (2nd, 2nd)...',
                '    # / zip associe les deux listes : (1re prédiction, 1re vérité), (2e, 2e)...',
                '    for predicted, actual in zip(predictions, truths):',
                '        if predicted == actual:',
                '            correct += 1  # += 1 adds 1 / ajoute 1',
                '    return correct / len(truths)',
                '',
                '',
                'print(f"model accuracy: {accuracy(model_pred, test_truth):.0%}")  # 1.',
                '',
                'baseline_label = most_common(train_counts)',
                'print("baseline always says:", baseline_label)  # 2.',
                '# TODO 1: make a list that repeats baseline_label once per test day, then print its accuracy.',
                '# / Crée une liste qui répète baseline_label une fois par jour de test, puis affiche son exactitude.',
                '',
                '# Part 2: regression. Tomorrow’s maximum temperature, in °C (a shorter record).',
                'train_temps = [9.5, 11.0, 12.5, 10.5, 13.0, 12.0, 10.0, 11.5]',
                'test_temps = [12.0, 9.0, 14.0, 11.0, 10.5]',
                'model_temps = [11.5, 10.0, 12.5, 11.0, 11.5]',
                '',
                '',
                'def mean_absolute_error(predictions, truths):',
                '    """The average size of the errors, in the unit of the label."""',
                '    total = 0',
                '    for predicted, actual in zip(predictions, truths):',
                '        total += abs(predicted - actual)  # abs drops the sign / abs enlève le signe',
                '    return total / len(truths)',
                '',
                '',
                'print(f"model MAE: {mean_absolute_error(model_temps, test_temps):.2f} °C")  # 3.',
                '# TODO 2: the baseline predicts the mean of train_temps for every test day.',
                '# Compute that mean, make the list of its predictions and print its MAE.',
                '# / La référence prédit la moyenne de train_temps chaque jour de test : calcule cette moyenne,',
                '# crée la liste de ses prédictions et affiche sa MAE.',
                '',
                '# My answers / Mes réponses :',
              ),
            },
          },
          {
            id: 'm2-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to quiz you on prediction tasks, one at a time. For each task, say whether it is classification or regression, what the label is and which baseline you would compare a model with. Answer before you read its explanation, and keep personal details out of your messages.',
                starterPrompt:
                  'Quiz me on machine learning tasks, one at a time. Describe a prediction task, and I will say whether it is classification or regression, what the label is and which baseline I would compare a model with. Wait for my answer before you explain.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de t’interroger sur des tâches de prédiction, une à la fois. Pour chacune, dis s’il s’agit d’une classification ou d’une régression, quelle est l’étiquette et à quelle référence tu comparerais un modèle. Réponds avant de lire son explication, et ne mets aucune information personnelle dans tes messages.',
                starterPrompt:
                  'Interroge-moi sur des tâches d’apprentissage automatique, une à la fois. Décris une tâche de prédiction, et je te dirai s’il s’agit d’une classification ou d’une régression, quelle est l’étiquette et à quelle référence je comparerais un modèle. Attends ma réponse avant d’expliquer.',
              },
            },
            data: { tutorMode: 'quiz_me', labToolId: null },
          },
          {
            id: 'm2-l1-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of a prediction that an app makes for you: a travel time, a weather forecast, a recommendation. Is it classification or regression? Which baseline would you compare it with, and what evidence would make you trust it?',
              },
              fr: {
                prompt:
                  'Pense à une prédiction que fait une application pour toi\u00a0: une durée de trajet, une prévision météo, une recommandation. Est-ce une classification ou une régression\u00a0? À quelle référence la comparerais-tu, et quelles preuves te donneraient confiance en elle\u00a0?',
              },
            },
            data: { minLength: 80 },
          },
        ],
      },

      // --- m2-l2: Predict outcomes with Python --------------------------------------------------
      {
        id: 'm2-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Predict outcomes with Python',
              summary:
                'Train a model on the Titanic passenger records with Machine Learning for Kids, call it from Python with passengers you invent, and work out what it reveals about 1912 and why it must never judge people.',
            },
            fr: {
              title: 'Prédire des résultats avec Python',
              summary:
                'Entraîne un modèle sur les registres des passagers du Titanic avec Machine Learning for Kids, appelle-le depuis Python avec des passagers que tu inventes, et découvre ce qu’il révèle de 1912 et pourquoi il ne doit jamais juger personne.',
            },
          },
          estimatedMinutes: 60,
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
                heading: 'A real ship, real people',
                body: 'Late on 14 April 1912, the RMS Titanic, a British liner on its first voyage from Southampton to New York, struck an iceberg in the North Atlantic. Less than three hours later, it had sunk. More than 1,500 of the roughly 2,200 people on board died. The ship carried lifeboats for only about half of them.\n\nRecords of the passengers still exist: their ticket class, their age, the family with them, the fare they paid, where they boarded, and whether they lived. Today they form one of the best-known datasets for learning machine learning, and Machine Learning for Kids offers several hundred of these records as a ready-made project.\n\nBefore you start, remember what this data is. **Every row is a real person**, and most of them died that night. Work like a historian: carefully and respectfully. No jokes, no "would I have survived?" games with yourself or people you know, and only **invented passengers** in your tests. If the subject is hard for you, talk to your teacher before you begin. Your teacher can give you another numbers dataset for the same steps; your hand-in then follows the same requirements with that data.\n\nThis lesson asks more than *can a model predict this?* It asks what a model trained on the past reveals about it, and why such predictions must never be used to judge people. Plan your 60 minutes: about 10 to read, 15 to explore the data and train the model, 20 for the Python part, and 15 for your hand-in, the tutor challenge, the quiz and the reflection.',
              },
              fr: {
                heading: 'Un vrai navire, de vraies personnes',
                body: 'Tard dans la soirée du 14\u00a0avril 1912, le RMS Titanic, un paquebot britannique qui effectuait son premier voyage de Southampton à New York, a heurté un iceberg dans l’Atlantique Nord. Moins de trois heures plus tard, il avait sombré. Plus de 1\u00a0500 des quelque 2\u00a0200\u00a0personnes à bord sont mortes. Le navire n’avait de canots de sauvetage que pour la moitié environ d’entre elles.\n\nLes registres des passagers nous sont parvenus\u00a0: leur classe de billet, leur âge, la famille qui les accompagnait, le prix payé, leur port d’embarquement, et s’ils ont survécu. Ils forment aujourd’hui l’un des jeux de données les plus connus pour s’initier à l’apprentissage automatique, et Machine Learning for Kids en propose plusieurs centaines sous forme de projet tout prêt.\n\nAvant de commencer, n’oublie pas ce que sont ces données. **Chaque ligne est une personne réelle**, et la plupart sont mortes cette nuit-là. Travaille comme un historien ou une historienne\u00a0: avec soin et avec respect. Pas de blagues, pas de jeu du «\u00a0aurais-je survécu\u00a0?\u00a0» avec toi-même ou avec des gens que tu connais, et uniquement des **passagers inventés** dans tes tests. Si ce sujet est difficile pour toi, parles-en à ton enseignant avant de commencer. Il peut te proposer un autre jeu de données numériques pour suivre les mêmes étapes\u00a0; ton rendu suit alors les mêmes consignes avec ces données.\n\nCette leçon ne s’arrête pas à la question *un modèle peut-il prédire cela\u00a0?* Elle demande ce que révèle du passé un modèle entraîné sur lui, et pourquoi de telles prédictions ne doivent jamais servir à juger des personnes. Organise tes 60\u00a0minutes\u00a0: environ 10 pour lire, 15 pour explorer les données et entraîner le modèle, 20 pour la partie Python, et 15 pour ton rendu, le défi du tuteur, le quiz et la réflexion.',
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
                heading: 'Seven features, one label, a model you call from Python',
                body: "The **Titanic survivors** project holds 712 passengers, each one a row with seven features and one label:\n\n| Feature | What it records | Number or category? |\n|---|---|---|\n| ticket class | 1, 2 or 3: first, second or third class | A category with an order, written as a number |\n| gender | male or female, as written in the records | Category |\n| age | In years; a baby's age is a fraction of a year, such as 0.42 (about 5 months) | Number |\n| sibl. sp. | Brothers and sisters, or a husband or wife, on board | Number |\n| par. ch. | Parents, or children, on board | Number |\n| ticket fare | The price paid, in pounds of 1912 | Number |\n| embarked | Where they boarded: Southampton, Cherbourg or Queenstown | Category |\n\nThe label is `survived` or `did_not_survive`: this is **classification**, on the kind of table you cleaned in *Working with data*. Start with the baseline of the last lesson: 424 of the 712 passengers did not survive, so always answering `did_not_survive` is right for about 60% of them. A model has to do better than that to be worth using.\n\n**The model.** When you train, the site builds a model from many small decision trees. Each tree asks yes-or-no questions about the features, such as *is the ticket class 3?* or *is the age under 10?*, and the model adds up their answers into a label and a **confidence**, from 0 to 100.\n\n**Calling it from Python.** The project's **Make** page, then **Python**, shows a short code sample. It loads your trained model from its web address; then `classify` takes a dictionary with one value per feature and returns every label with its confidence, the most likely first. You need somewhere to run Python that your teacher approves, with the few libraries and the helper file that the page lists. Ask your teacher to have this Python environment ready before the lesson: installing it takes time. The model stays online only for a short time, and a Try it now project for a few hours: finish your hand-in during this lesson.\n\n**Two secrets.** The sample contains your **model's web address** and, if your project is stored in the cloud, a **key**. Anyone who has them can use your model, and the key even lets them add training examples to your project. So:\n\n- they stay in two places only: the Machine Learning for Kids page and your own Python notebook (Jupyter, or Colab if your teacher approves);\n- before you bring anything back (code, a screenshot, a table), replace each of them with `YOUR-KEY`;\n- never paste them into RoboHolic: not into the tutor, a reflection or your hand-in;\n- better, read them from environment variables, values set outside the code (*Calling AI services safely* shows how), as this lesson's template does.\n\nIf one of them ends up somewhere by mistake, delete the project on Machine Learning for Kids and tell your teacher.",
              },
              fr: {
                heading: 'Sept caractéristiques, une étiquette, un modèle appelé depuis Python',
                body: 'Le projet **Les rescapés du Titanic** (*Titanic survivors*) contient 712\u00a0passagers\u00a0: chacun forme une ligne, avec sept caractéristiques et une étiquette. Sur le site, les noms des caractéristiques restent en anglais\u00a0:\n\n| Caractéristique | Ce qu’elle indique | Nombre ou catégorie\u00a0? |\n|---|---|---|\n| ticket class | 1, 2 ou 3\u00a0: première, deuxième ou troisième classe | Une catégorie ordonnée, écrite avec un nombre |\n| gender | male (homme) ou female (femme), comme dans les registres | Catégorie |\n| age | L’âge en années\u00a0; pour un bébé, un nombre décimal, comme 0,42 (environ 5\u00a0mois\u00a0; écrit 0.42 sur le site) | Nombre |\n| sibl. sp. | Frères et sœurs, ou mari ou femme, à bord | Nombre |\n| par. ch. | Parents, ou enfants, à bord | Nombre |\n| ticket fare | Le prix payé, en livres sterling de 1912 | Nombre |\n| embarked | Le port d’embarquement\u00a0: Southampton, Cherbourg ou Queenstown | Catégorie |\n\nL’étiquette est `survived` (a survécu) ou `did_not_survive` (n’a pas survécu)\u00a0: c’est une **classification**, sur le genre de tableau que tu as nettoyé dans la leçon *Travailler avec des données*. Commence par la référence de la leçon précédente\u00a0: 424 des 712\u00a0passagers n’ont pas survécu, donc répondre toujours `did_not_survive` est juste pour environ 60\u00a0% d’entre eux. Un modèle doit faire mieux pour valoir la peine d’être utilisé.\n\n**Le modèle.** À l’entraînement, le site construit un modèle fait de nombreux petits arbres de décision. Chaque arbre pose des questions fermées sur les caractéristiques, comme *la classe du billet est-elle 3\u00a0?* ou *l’âge est-il inférieur à 10\u00a0ans\u00a0?*, et le modèle additionne leurs réponses pour donner une étiquette et une **confiance**, de 0 à 100.\n\n**L’appel depuis Python.** La page **Faire** (*Make*) du projet, puis **Python**, montre un court exemple de code. Il charge ton modèle entraîné à partir de son adresse web\u00a0; ensuite, `classify` prend un dictionnaire avec une valeur par caractéristique et renvoie chaque étiquette avec sa confiance, la plus probable en premier. Il te faut un environnement Python approuvé par ton enseignant, avec les quelques bibliothèques et le fichier d’aide qu’indique la page. Demande à ton enseignant de préparer cet environnement Python avant la leçon\u00a0: son installation prend du temps. Le modèle ne reste en ligne que peu de temps, et un projet «\u00a0Essayer maintenant\u00a0» quelques heures\u00a0: termine ton rendu pendant cette leçon.\n\n**Deux secrets.** L’exemple contient l’**adresse web de ton modèle** et, si ton projet est stocké dans le cloud, une **clé**. Quiconque les possède peut utiliser ton modèle, et la clé permet même d’ajouter des exemples d’entraînement à ton projet. Donc\u00a0:\n\n- elles restent à deux endroits seulement\u00a0: la page de Machine Learning for Kids et ton propre notebook Python (Jupyter, ou Colab si ton enseignant l’approuve)\u00a0;\n- avant de rapporter quoi que ce soit (code, capture d’écran, tableau), remplace chacune d’elles par `YOUR-KEY`\u00a0;\n- ne les colle jamais dans RoboHolic\u00a0: ni dans le tuteur, ni dans une réflexion, ni dans ton rendu\u00a0;\n- mieux, lis-les depuis des variables d’environnement, des valeurs définies en dehors du code (la leçon *Appeler des services d’IA en toute sécurité* montre comment faire), comme le fait le gabarit de cette leçon.\n\nSi l’une d’elles s’est retrouvée quelque part par erreur, supprime le projet sur Machine Learning for Kids et préviens ton enseignant.',
              },
            },
            data: {},
          },
          {
            id: 'm2-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'What the model reveals about 1912, and what it must never decide',
                body: "**A pattern, not an explanation.** Once the model is trained, you will see its predictions move a lot with gender, ticket class and age. It has found something true about the past: that night, who survived was not a matter of chance. Historians point to reasons such as the order *women and children first* as the lifeboats were loaded, and the fact that most third-class cabins were on the lower decks, furthest from the lifeboats. The model knows none of this. It sees that some feature values go with some labels, and it cannot tell a cause from a coincidence: ticket class, fare and port of boarding are tangled together. Two passengers who differ in one feature only are your best tool to see what the model relies on.\n\n**A sample, not the whole ship.** The project holds 712 passengers out of the roughly 2,200 people on board. Every row has a ticket class, so no crew member is in it, and most of the crew died. In the project, about 4 passengers in 10 survived; on the whole ship, fewer than 1 person in 3 did. When a whole group is missing from a dataset, the model knows nothing about it, and the picture tilts.\n\n**No honest score here.** All 712 passengers are used for training, and your invented passengers have no real outcome to check. A confidence of 85% is the model's own estimate, not a measured accuracy.\n\n**Why such predictions must never be used to judge people.**\n\n- **A prediction describes a group, not a person.** A prediction of `did_not_survive` with 85% confidence means that most passengers like this one died. It says nothing certain about any one of them: people beat the odds in both directions.\n- **The strongest features are things nobody chooses**: gender, and the money a family had. Deciding anything about people today with a model like this would turn the inequalities of 1912 into rules. In many countries, the law forbids treating people worse because of characteristics such as their sex. And this is how bias gets into real systems: a model trained on an unfair past, then used to decide on loans, jobs or school places, repeats that past.\n- **The world changes.** After the disaster, new rules required lifeboat places for everyone on board. A model of 1912 knows nothing about any later ship.\n\nA model like this is a lens on the past, not a judge of people.",
              },
              fr: {
                heading: 'Ce que le modèle révèle de 1912, et ce qu’il ne doit jamais décider',
                body: '**Une régularité, pas une explication.** Une fois le modèle entraîné, tu verras ses prédictions changer beaucoup selon le genre, la classe du billet et l’âge. Il a trouvé quelque chose de vrai sur le passé\u00a0: cette nuit-là, survivre n’était pas une affaire de hasard. Les historiens avancent des raisons comme la consigne *les femmes et les enfants d’abord* au moment de remplir les canots, et le fait que la plupart des cabines de troisième classe se trouvaient sur les ponts inférieurs, les plus éloignés des canots. Le modèle n’en sait rien. Il voit que certaines valeurs des caractéristiques vont avec certaines étiquettes, et il ne sait pas distinguer une cause d’une coïncidence\u00a0: la classe du billet, le prix et le port d’embarquement sont liés entre eux. Deux passagers qui ne diffèrent que par une seule caractéristique sont ton meilleur outil pour voir sur quoi le modèle s’appuie.\n\n**Un échantillon, pas tout le navire.** Le projet contient 712 passagers sur les quelque 2\u00a0200\u00a0personnes à bord. Chaque ligne a une classe de billet\u00a0: l’équipage n’y figure donc pas, et la plupart de ses membres sont morts. Dans le projet, environ 4 passagers sur 10 ont survécu\u00a0; sur l’ensemble du navire, moins d’une personne sur 3. Quand tout un groupe manque dans un jeu de données, le modèle n’en sait rien, et l’image se déforme.\n\n**Pas de score honnête ici.** Les 712\u00a0passagers servent tous à l’entraînement, et pour tes passagers inventés, il n’y a pas de vraie réponse à vérifier. Une confiance de 85\u00a0% est l’estimation du modèle lui-même, pas une exactitude mesurée.\n\n**Pourquoi de telles prédictions ne doivent jamais servir à juger des personnes.**\n\n- **Une prédiction décrit un groupe, pas une personne.** Une prédiction `did_not_survive` avec 85\u00a0% de confiance signifie que la plupart des passagers semblables à celui-ci sont morts. Cela ne dit rien de certain sur aucun d’eux en particulier\u00a0: des gens ont déjoué les probabilités dans les deux sens.\n- **Les caractéristiques les plus fortes sont des choses que personne ne choisit**\u00a0: le genre, et l’argent qu’avait une famille. Décider quoi que ce soit sur des personnes aujourd’hui avec un tel modèle transformerait les inégalités de 1912 en règles. Dans beaucoup de pays, la loi interdit de traiter quelqu’un moins bien en raison de caractéristiques comme son sexe. Et c’est ainsi que les biais entrent dans de vrais systèmes\u00a0: un modèle entraîné sur un passé injuste, puis utilisé pour décider d’un prêt, d’un emploi ou d’une place dans une école, reproduit ce passé.\n- **Le monde change.** Après la catastrophe, de nouvelles règles ont exigé des places dans les canots pour toutes les personnes à bord. Un modèle de 1912 ne sait rien des navires qui ont suivi.\n\nUn tel modèle est une loupe sur le passé, pas un juge des personnes.',
              },
            },
            data: {},
          },
          {
            id: 'm2-l2-b4',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Titanic: a model of the past, called from Python',
                instructions:
                  "**Your goal:** train a model on the Titanic survivors project, call it from your own Python program with passengers you invent, and work out what it has learned, and what it cannot know.\n\n1. Open Machine Learning for Kids and choose **Try it now**. For the click-by-click steps, follow the official worksheet (PDF), but skip its login step: you need no account.\n2. In **Projects**, use **Copy template** to import **Titanic survivors**, and keep it on your computer (**Store on your computer**), as the worksheet does.\n3. On the **Train** page, look at the two labels before you train anything. Write down three patterns you expect, then check each one in the examples.\n4. On **Learn & Test**, train the model and try two passengers you invent in the test boxes.\n5. Open **Make**, then **Python** (or **Colab**, only with a school account your teacher approves). With the worksheet, set up Python and copy the code sample into your own notebook. The model's address, and the key if there is one, stay there.\n6. Organise your program like the template further down: at least four invented passengers, including two pairs that differ in one feature only. Note each prediction and its confidence.\n7. Write down one limitation of the model: something it cannot know, or a use it must never be put to.\n8. Before you bring anything back, replace the key and the model's web address with `YOUR-KEY` everywhere.",
                bringBack:
                  "Your Python program with the key and the model's address replaced by YOUR-KEY, a table of your invented passengers (features, prediction, confidence) and one limitation of the model, explained. All of it goes into the project below.",
                hint: 'The prediction never changes? Change one feature at a time, and far enough to matter: a child instead of an adult, first class instead of third. A message says the model is no longer available? Models stay online for a short time only: train again on Learn & Test and use the new address. An error about a missing module? The libraries listed on the Python page must be installed first; your teacher can help.',
              },
              fr: {
                title: 'Titanic\u00a0: un modèle du passé, appelé depuis Python',
                instructions:
                  '**Ton but\u00a0:** entraîner un modèle sur le projet des rescapés du Titanic, l’appeler depuis ton propre programme Python avec des passagers que tu inventes, et comprendre ce qu’il a appris, et ce qu’il ne peut pas savoir.\n\n1. Ouvre Machine Learning for Kids et choisis **Essayer maintenant** (*Try it now*). Pour le détail des clics, suis la fiche officielle (PDF), mais saute son étape de connexion\u00a0: tu n’as pas besoin de compte.\n2. Dans **Projets**, utilise **Copier le modèle** (*Copy template*\u00a0; ici, «\u00a0modèle\u00a0» veut dire projet tout prêt) pour importer **Les rescapés du Titanic**, et garde-le sur ton ordinateur (*Store on your computer*), comme le fait la fiche.\n3. Sur la page **Entraîner** (*Train*), regarde les deux étiquettes avant tout entraînement. Note trois régularités auxquelles tu t’attends, puis vérifie chacune d’elles dans les exemples.\n4. Sur **Apprendre & Tester** (*Learn & Test*), entraîne le modèle et essaie deux passagers inventés dans les cases de test.\n5. Ouvre **Faire** (*Make*), puis **Python** (ou **Colab**, seulement avec un compte de l’établissement approuvé par ton enseignant). Avec la fiche, prépare ton environnement Python et copie l’exemple de code dans ton propre notebook. L’adresse du modèle, et la clé s’il y en a une, restent là.\n6. Organise ton programme comme le gabarit plus bas\u00a0: au moins quatre passagers inventés, dont deux paires qui ne diffèrent que par une seule caractéristique. Note chaque prédiction et sa confiance.\n7. Note une limite du modèle\u00a0: quelque chose qu’il ne peut pas savoir, ou un usage qu’on ne doit jamais en faire.\n8. Avant de rapporter quoi que ce soit, remplace partout la clé et l’adresse web du modèle par `YOUR-KEY`.',
                bringBack:
                  'Ton programme Python avec la clé et l’adresse du modèle remplacées par YOUR-KEY, un tableau de tes passagers inventés (caractéristiques, prédiction, confiance) et une limite du modèle, expliquée. Tout cela va dans le projet ci-dessous.',
                hint: 'La prédiction ne change jamais\u00a0? Modifie une caractéristique à la fois, et assez nettement pour que cela compte\u00a0: un enfant au lieu d’un adulte, la première classe au lieu de la troisième. Un message indique que le modèle n’est plus disponible\u00a0? Les modèles ne restent en ligne que peu de temps\u00a0: entraîne-le de nouveau sur Apprendre & Tester et utilise la nouvelle adresse. Une erreur à propos d’un module manquant\u00a0? Il faut d’abord installer les bibliothèques indiquées sur la page Python\u00a0; ton enseignant peut t’aider.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-titanic-python.pdf',
              projectType: 'numbers',
              codeTool: 'python',
              access: 'try_it_now',
            },
          },
          {
            id: 'm2-l2-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No Python, or no website? Two fallbacks',
                body: '**If Python will not run** but the website works, type each invented passenger into the test boxes of the **Learn & Test** page and note the label and the confidence it shows. Fill in the template below with your passengers, write by hand the table it would print, using those values, and say so in your hand-in.\n\n**If the website is blocked**, be the training algorithm on paper. Here are the 712 passengers of the project, counted by ticket class and gender:\n\n| Ticket class | Women who survived | Women who did not | Men who survived | Men who did not |\n|---|---|---|---|---|\n| 1 | 80 | 3 | 40 | 61 |\n| 2 | 68 | 6 | 15 | 84 |\n| 3 | 47 | 55 | 38 | 215 |\n\n1. Count how many of the 712 passengers the baseline (*always did_not_survive*) gets right, and work out its accuracy.\n2. Rule A: *women survived, men did not*. How many passengers does it get right? Does it beat the baseline?\n3. Write a Rule B that also uses the ticket class, and try to beat Rule A.\n4. Apply your best rule to four passengers you invent, including two who differ in one feature only.\n5. These scores were measured on the very passengers the rules were built from. Why are they too kind, and what would an honest test need?\n\nHand in your table, your rules and your answers instead of the Python program.',
              },
              fr: {
                heading: 'Pas de Python, ou pas de site\u00a0? Deux solutions de secours',
                body: '**Si Python ne fonctionne pas** mais que le site s’ouvre, tape chaque passager inventé dans les cases de test de la page **Apprendre & Tester** et note l’étiquette et la confiance affichées. Remplis le gabarit ci-dessous avec tes passagers, écris à la main le tableau qu’il afficherait, avec ces valeurs, et précise-le dans ton rendu.\n\n**Si le site est bloqué**, joue le rôle de l’algorithme d’entraînement, sur papier. Voici les 712\u00a0passagers du projet, comptés par classe de billet et par genre\u00a0:\n\n| Classe du billet | Femmes qui ont survécu | Femmes qui n’ont pas survécu | Hommes qui ont survécu | Hommes qui n’ont pas survécu |\n|---|---|---|---|---|\n| 1 | 80 | 3 | 40 | 61 |\n| 2 | 68 | 6 | 15 | 84 |\n| 3 | 47 | 55 | 38 | 215 |\n\n1. Compte combien des 712\u00a0passagers la référence (*toujours did_not_survive*) classe correctement, et calcule son exactitude.\n2. Règle A\u00a0: *les femmes ont survécu, les hommes non*. Combien de passagers classe-t-elle correctement\u00a0? Bat-elle la référence\u00a0?\n3. Écris une règle B qui utilise aussi la classe du billet, et essaie de battre la règle A.\n4. Applique ta meilleure règle à quatre passagers que tu inventes, dont deux qui ne diffèrent que par une seule caractéristique.\n5. Ces scores ont été mesurés sur les passagers mêmes à partir desquels les règles ont été construites. Pourquoi sont-ils trop flatteurs, et que faudrait-il pour un test honnête\u00a0?\n\nRends ton tableau, tes règles et tes réponses à la place du programme Python.',
              },
            },
            data: {},
          },
          {
            id: 'm2-l2-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to challenge you: it describes, one at a time, ways in which someone might use a model trained on the Titanic records, from a museum exhibition to an insurance company. For each one, say whether it is acceptable and why, with the ideas of this lesson. Then decide for yourself whether its feedback is fair. Never paste your key or your model address into the chat.',
                starterPrompt:
                  'Challenge me: describe, one at a time, four different ways in which someone might use a model trained on the Titanic passenger records, from teaching history to deciding something about people today. For each one, I will say whether it is acceptable and why. Wait for my answer before you give your opinion.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de te mettre au défi\u00a0: il te décrit, une par une, des façons dont quelqu’un pourrait utiliser un modèle entraîné sur les registres du Titanic, d’une exposition de musée à une compagnie d’assurance. Pour chacune, dis si c’est acceptable et pourquoi, avec les idées de cette leçon. Décide ensuite par toi-même si ses remarques sont justes. Ne colle jamais ta clé ni l’adresse de ton modèle dans la conversation.',
                starterPrompt:
                  'Mets-moi au défi\u00a0: décris-moi, une à la fois, quatre façons différentes dont quelqu’un pourrait utiliser un modèle entraîné sur les registres des passagers du Titanic, de l’enseignement de l’histoire à une décision prise aujourd’hui sur des personnes. Pour chacune, je te dirai si c’est acceptable et pourquoi. Attends ma réponse avant de donner ton avis.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm2-l2-b7',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Organise your program like this template, in your own notebook. It is saved here, not run, and it must never contain your real key or your model's real address. First, trace it here: as it stands, project is None, so what does the table show for passengers A and B, and why?\n\nIn your own copy:\n\n1. TODO 1: replace project = None with the lines of your project's Python page that import MLforKidsNumbers and create project, and make them use MODEL_URL (and KEY, if your sample has one) instead of the values written in them.\n2. TODO 2: invent at least two more passengers, so that you have at least two pairs that differ in one feature only. Use the feature names and values that your project's Python page shows.\n3. Run it, and copy the table it prints into your hand-in.\n4. TODO 3: for each pair, write which feature you changed and how the prediction and its confidence moved. Passenger B is A in first class, at A's third-class fare: is that a realistic passenger? What does it tell you about features that go together?\n5. For which of your passengers does the model answer something other than the baseline?\n6. TODO 4: write one limitation of the model in three to five sentences.\n7. Before you hand it in, search your code for your key and your model's address: only YOUR-KEY may appear.",
                hint: 'While project is None, every passenger gets did_not_survive at 60%: that is the baseline, as expected. An "Unrecognised URL" error means that MODEL_URL still says YOUR-KEY: set ML4K_MODEL_URL, or write the address there in your own notebook only. A "Missing required value" message means that a feature name is spelled differently from your project\'s: copy the names from its Python page. A message that the model is no longer available? Train it again on Learn & Test and use the new address.',
              },
              fr: {
                instructions:
                  'Organise ton programme comme ce gabarit, dans ton propre notebook. Il est enregistré ici, pas exécuté, et il ne doit jamais contenir ta vraie clé ni la vraie adresse de ton modèle. Dans le code, les noms sont en anglais\u00a0: passenger = passager, features = caractéristiques, predict = prédire, results = résultats, best = le meilleur, label = étiquette, confidence = confiance, values = valeurs, BASELINE = la référence, male = homme, female = femme. Commence par le suivre ici\u00a0: tel quel, project vaut None. Qu’affiche alors le tableau pour les passagers A et B, et pourquoi\u00a0?\n\nDans ta propre copie\u00a0:\n\n1. TODO\u00a01\u00a0: remplace project = None par les lignes de la page Python de ton projet qui importent MLforKidsNumbers et créent project, et fais-leur utiliser MODEL_URL (et KEY, si ton exemple contient une clé) au lieu des valeurs écrites dedans.\n2. TODO\u00a02\u00a0: invente au moins deux autres passagers, pour avoir au moins deux paires qui ne diffèrent que par une seule caractéristique. Utilise les noms et les valeurs de caractéristiques qu’affiche la page Python de ton projet.\n3. Exécute-le, puis copie dans ton rendu le tableau qu’il affiche.\n4. TODO\u00a03\u00a0: pour chaque paire, écris quelle caractéristique tu as changée et comment la prédiction et sa confiance ont bougé. Le passager B est A en première classe, au prix du billet de troisième classe de A\u00a0: est-ce un passager réaliste\u00a0? Qu’est-ce que cela t’apprend sur les caractéristiques qui vont ensemble\u00a0?\n5. Pour lesquels de tes passagers le modèle répond-il autre chose que la référence\u00a0?\n6. TODO\u00a04\u00a0: écris une limite du modèle en trois à cinq phrases.\n7. Avant de rendre ton travail, cherche ta clé et l’adresse de ton modèle dans ton code\u00a0: seul YOUR-KEY doit apparaître.',
                hint: 'Tant que project vaut None, chaque passager reçoit did_not_survive à 60\u00a0%\u00a0: c’est la référence, c’est normal. Une erreur «\u00a0Unrecognised URL\u00a0» signifie que MODEL_URL vaut encore YOUR-KEY\u00a0: définis ML4K_MODEL_URL, ou écris l’adresse à cet endroit, dans ton propre notebook seulement. Un message «\u00a0Missing required value\u00a0» signifie qu’un nom de caractéristique n’est pas écrit comme dans ton projet\u00a0: recopie les noms depuis sa page Python. Un message indique que le modèle n’est plus disponible\u00a0? Entraîne-le de nouveau sur Apprendre & Tester et utilise la nouvelle adresse.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# titanic_predictions.py: ask YOUR Titanic model about passengers you invent.',
                '# Saved here, not run: copy it into your own notebook. NEVER write your key or model address here.',
                '# Enregistré ici, pas exécuté : copie-le dans ton notebook. N’y écris JAMAIS ta clé ni l’adresse de ton modèle.',
                'import os',
                '',
                '# In your own notebook only: set the environment variable ML4K_MODEL_URL (and ML4K_KEY if your',
                '# sample has a key), or write the values in place of YOUR-KEY there. Put YOUR-KEY back before',
                '# you share anything.',
                'MODEL_URL = os.environ.get("ML4K_MODEL_URL", "YOUR-KEY")',
                'KEY = os.environ.get("ML4K_KEY", "YOUR-KEY")',
                '',
                "# TODO 1: replace the next line with the lines of your project's Python page that import",
                '# MLforKidsNumbers and create project, using MODEL_URL (and KEY, if your sample has one)',
                '# instead of the values written in them.',
                'project = None',
                '',
                '# The majority-class baseline: 424 of the 712 passengers of the project did not survive.',
                'BASELINE = ("did_not_survive", round(100 * 424 / 712))',
                '',
                'FEATURES = ["ticket class", "gender", "age", "sibl. sp.", "par. ch.", "ticket fare", "embarked"]',
                '',
                '',
                'def passenger(ticket_class, gender, age, siblings_spouses, parents_children, fare, embarked):',
                '    """One passenger, as a dictionary with the feature names of the project."""',
                '    values = [ticket_class, gender, age, siblings_spouses, parents_children, fare, embarked]',
                '    return dict(zip(FEATURES, values))',
                '',
                '',
                'def predict(features):',
                '    """Return the best label and its confidence, from 0 to 100, for one passenger."""',
                '    if project is None:  # no model yet: the baseline answers / pas encore de modèle',
                '        return BASELINE',
                '    results = project.classify(features)  # one entry per label, the most confident first',
                '    best = results[0]',
                '    return best["class_name"], best["confidence"]',
                '',
                '',
                '# Invented passengers only: never real people, never you or anyone you know.',
                "# Use the names and values of your project's Python page: the site shortens Southampton",
                '# and Queenstown to "Southampt" and "Queenstwn".',
                'PASSENGERS = {',
                '    "A": passenger(3, "male", 30, 0, 0, 8.0, "Southampt"),',
                '    "B": passenger(1, "male", 30, 0, 0, 8.0, "Southampt"),  # A, in first class',
                '    # TODO 2: at least 2 more, so that you have 2 pairs that differ in ONE feature only',
                '}',
                '',
                'print("| passenger | " + " | ".join(FEATURES) + " | prediction | confidence |")',
                'print("|---" * (len(FEATURES) + 3) + "|")',
                'for name, features in PASSENGERS.items():',
                '    label, confidence = predict(features)',
                '    values = " | ".join(str(value) for value in features.values())',
                '    print(f"| {name} | {values} | {label} | {confidence}% |")',
                '',
                '# TODO 3: for each pair, which feature did you change, and how did the prediction move?',
                '# TODO 4: one limitation of this model, in three to five sentences.',
              ),
            },
          },
          {
            id: 'm2-l2-b8',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  "Hand in your Titanic model: the program with the key and the model's address replaced by YOUR-KEY, the predictions for your invented passengers and one limitation, explained.",
              },
              fr: {
                intro:
                  'Rends ton modèle du Titanic\u00a0: le programme avec la clé et l’adresse du modèle remplacées par YOUR-KEY, les prédictions pour tes passagers inventés et une limite, expliquée.',
              },
            },
            data: { projectId: 'project-m2' },
          },
          {
            id: 'm2-l2-b9',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about classification, regression, honest testing and your Titanic model.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur la classification, la régression, les tests honnêtes et ton modèle du Titanic.',
              },
            },
            data: { quizId: 'quiz-m2' },
          },
          {
            id: 'm2-l2-b10',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'A friend says: "The model gives third-class men a low chance of survival, so it proves something about them." Explain why it does not. Then say what the model does tell us about 1912, and name one use of a model like this that you would refuse.',
              },
              fr: {
                prompt:
                  'Un ami affirme\u00a0: «\u00a0Le modèle donne peu de chances de survie aux hommes de troisième classe, donc ça prouve quelque chose sur eux.\u00a0» Explique pourquoi ce n’est pas le cas. Dis ensuite ce que le modèle nous apprend vraiment sur 1912, et cite un usage d’un tel modèle que tu refuserais.',
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
      id: 'quiz-m2',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: machine learning basics',
            instructions:
              'Seven questions on classification, regression, honest testing and your Titanic model. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: les bases de l’apprentissage automatique',
            instructions:
              'Sept questions sur la classification, la régression, les tests honnêtes et ton modèle du Titanic. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
              en: { prompt: 'Which of these is a regression task?' },
              fr: { prompt: 'Laquelle de ces tâches est une régression\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Predicting whether it will rain tomorrow' },
                  fr: { text: 'Prédire s’il pleuvra demain' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: "Predicting tomorrow's maximum temperature in °C" },
                  fr: { text: 'Prédire la température maximale de demain en °C' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Predicting which bin a piece of rubbish goes in: paper, plastic or other',
                  },
                  fr: {
                    text: 'Prédire dans quelle poubelle va un déchet\u00a0: papier, plastique ou autre',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Predicting whether a Titanic passenger survived' },
                  fr: { text: 'Prédire si un passager du Titanic a survécu' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Regression predicts a number on a scale, where being close means something: 11 °C for a 12 °C day is nearly right. The three others predict a category from a fixed list: they are classification tasks.',
              },
              fr: {
                text: 'Une régression prédit un nombre sur une échelle, où être proche veut dire quelque chose\u00a0: 11\u00a0°C pour une journée à 12\u00a0°C, c’est presque juste. Les trois autres prédisent une catégorie choisie dans une liste fixe\u00a0: ce sont des classifications.',
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
                  'A rain model is tested on 50 days: 40 dry and 10 rainy. In its training data too, most days were dry. It scores 82% accuracy. What is the best reading?',
              },
              fr: {
                prompt:
                  'Un modèle de pluie est testé sur 50\u00a0jours\u00a0: 40 secs et 10 pluvieux. Dans ses données d’entraînement aussi, la plupart des jours étaient secs. Il obtient 82\u00a0% d’exactitude. Quelle est la meilleure interprétation\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Excellent: 82% is a high score' },
                  fr: { text: 'Excellent\u00a0: 82\u00a0%, c’est un score élevé' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'It is barely better than always predicting "dry", which scores 80% on these days',
                  },
                  fr: {
                    text: 'Il fait à peine mieux que la prévision «\u00a0toujours sec\u00a0», qui obtient 80\u00a0% sur ces jours',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It is worse than its baseline, which scores 90%' },
                  fr: { text: 'Il fait moins bien que sa référence, qui obtient 90\u00a0%' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Nothing can be said without its training score' },
                  fr: { text: 'On ne peut rien dire sans son score d’entraînement' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Always predicting the majority label, dry, is right on 40 of the 50 test days: 80%. The model gets 41 right, a single day more. That is far too small a difference to show that it has learned much.',
              },
              fr: {
                text: 'Prédire toujours l’étiquette majoritaire, sec, est juste pour 40 des 50\u00a0jours de test\u00a0: 80\u00a0%. Le modèle en a 41 de justes, un seul jour de plus. C’est un écart bien trop faible pour montrer qu’il a appris grand-chose.',
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
                  'To build the majority-class baseline, you take the most common label of the test set.',
              },
              fr: {
                prompt:
                  'Pour construire la référence de la classe majoritaire, on prend l’étiquette la plus fréquente du jeu de test.',
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
                text: 'False. The baseline, like the model, is built from the training set only. The test set stays sealed until the final measurement: using its labels to build anything, even a baseline, means peeking at the answers.',
              },
              fr: {
                text: 'Faux. La référence, comme le modèle, se construit à partir du jeu d’entraînement uniquement. Le jeu de test reste sous scellés jusqu’à la mesure finale\u00a0: utiliser ses étiquettes pour construire quoi que ce soit, même une référence, revient à regarder les réponses.',
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
                  "A model predicts tomorrow's maximum temperature on 4 test days. It predicts 14, 10, 12 and 20 °C; the real values were 12, 13, 12 and 17 °C. What is its mean absolute error, in °C? (a number)",
              },
              fr: {
                prompt:
                  'Un modèle prédit la température maximale du lendemain sur 4\u00a0jours de test. Il prédit 14, 10, 12 et 20\u00a0°C\u00a0; les vraies valeurs étaient 12, 13, 12 et 17\u00a0°C. Quelle est son erreur absolue moyenne, en °C\u00a0? (un nombre)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                '2',
                '2.0',
                '2.00',
                '2c',
                '2 c',
                '2°',
                '2°c',
                '2 °c',
                '2 degrees',
                '2 degrees celsius',
              ],
              fr: [
                '2',
                '2,0',
                '2,00',
                '2,00 °c',
                '2 degré',
                '2 degrés',
                '2 degrés celsius',
                'deux',
                'deux degrés',
                'deux degrés celsius',
              ],
            },
            explanation: {
              en: {
                text: 'The errors are 2, 3, 0 and 3 °C (their sign does not matter), and their mean is 8 / 4 = 2 °C: on average, the predictions are 2 °C away from the real temperature.',
              },
              fr: {
                text: 'Les erreurs valent 2, 3, 0 et 3\u00a0°C (leur signe ne compte pas), et leur moyenne vaut 8 / 4 = 2\u00a0°C\u00a0: en moyenne, les prédictions s’écartent de 2\u00a0°C de la vraie température.',
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
                  'You hand in the Python program that calls your Titanic model. Which of these may appear in it? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Tu rends le programme Python qui appelle ton modèle du Titanic. Lesquels de ces éléments peuvent y figurer\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'YOUR-KEY in place of the key and of the model address' },
                  fr: { text: 'YOUR-KEY à la place de la clé et de l’adresse du modèle' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The passengers you invented' },
                  fr: { text: 'Les passagers que tu as inventés' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The real web address of your trained model' },
                  fr: { text: 'La vraie adresse web de ton modèle entraîné' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Comments that explain how each prediction moved' },
                  fr: { text: 'Des commentaires qui expliquent comment chaque prédiction a bougé' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Your own age and details, to see whether you would have survived' },
                  fr: {
                    text: 'Ton âge et tes propres informations, pour voir si tu aurais survécu',
                  },
                },
              },
              {
                id: 'f',
                translations: {
                  en: { text: 'The project key, so that your teacher can test your model' },
                  fr: {
                    text: 'La clé du projet, pour que ton enseignant puisse tester ton modèle',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "The key and the model's address are secrets: anyone who has them can use your model, and the key can even add training examples to your project. Replace both with YOUR-KEY. And your tests use invented passengers only, never yourself or anyone you know.",
              },
              fr: {
                text: 'La clé et l’adresse du modèle sont des secrets\u00a0: quiconque les possède peut utiliser ton modèle, et la clé permet même d’ajouter des exemples d’entraînement à ton projet. Remplace-les toutes les deux par YOUR-KEY. Et tes tests n’utilisent que des passagers inventés, jamais toi-même ni quelqu’un que tu connais.',
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
                  'For an invented third-class passenger, your model answers did_not_survive with a confidence of 85%. What is the best reading?',
              },
              fr: {
                prompt:
                  'Pour un passager de troisième classe inventé, ton modèle répond did_not_survive avec une confiance de 85\u00a0%. Quelle est la meilleure interprétation\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'A person like this would certainly have died' },
                  fr: { text: 'Une personne comme celle-ci serait forcément morte' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Most passengers in the 1912 records who resemble this one did not survive; it says nothing certain about any one person',
                  },
                  fr: {
                    text: 'La plupart des passagers des registres de 1912 qui ressemblent à celui-ci n’ont pas survécu\u00a0; cela ne dit rien de certain sur une personne en particulier',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The model has found out why third-class passengers died' },
                  fr: {
                    text: 'Le modèle a découvert pourquoi les passagers de troisième classe sont morts',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The model is right for 85% of its test passengers' },
                  fr: { text: 'Le modèle a raison pour 85\u00a0% de ses passagers de test' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "A prediction sums up what happened to similar people in the data; it explains nothing. And the confidence is the model's own estimate: all 712 passengers were used for training and this passenger is invented, so there is nothing to check it against.",
              },
              fr: {
                text: 'Une prédiction résume ce qui est arrivé à des personnes semblables dans les données\u00a0; elle n’explique rien. Et la confiance est l’estimation du modèle lui-même\u00a0: les 712\u00a0passagers ont tous servi à l’entraînement et ce passager est inventé, il n’y a donc rien à quoi la comparer.',
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
                  "An insurance company wants to set its prices with a model that, like yours, learned from people's gender and wealth. What is the main problem?",
              },
              fr: {
                prompt:
                  'Une compagnie d’assurance veut fixer ses prix avec un modèle qui, comme le tien, a appris à partir du genre et de la richesse des gens. Quel est le problème principal\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'None: a model with good accuracy is fair by definition' },
                  fr: {
                    text: 'Aucun\u00a0: un modèle avec une bonne exactitude est juste par définition',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'It would turn the patterns of an unequal past into rules for judging people today, on features they did not choose',
                  },
                  fr: {
                    text: 'Il transformerait les régularités d’un passé inégal en règles pour juger les gens aujourd’hui, à partir de caractéristiques qu’ils n’ont pas choisies',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The model would need more decision trees' },
                  fr: { text: 'Le modèle aurait besoin de plus d’arbres de décision' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Prices are numbers, so a classifier can never be used' },
                  fr: {
                    text: 'Les prix sont des nombres, donc on ne peut jamais utiliser un classifieur',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Accuracy does not make a decision fair. A model trained on an unfair past repeats it, and in many countries the law forbids treating people worse because of characteristics such as their sex. A model of the Titanic records is a lens on 1912, not a tool for judging people.',
              },
              fr: {
                text: 'L’exactitude ne rend pas une décision juste. Un modèle entraîné sur un passé injuste le reproduit, et dans beaucoup de pays, la loi interdit de traiter quelqu’un moins bien en raison de caractéristiques comme son sexe. Un modèle des registres du Titanic est une loupe sur 1912, pas un outil pour juger des personnes.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m2',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'My Titanic model in Python',
            brief:
              "Train a model on the Titanic survivors project of Machine Learning for Kids, call it from your own Python program with passengers you invent, and explain what it has learned about 1912 and what it must never be used for. Use Try it now (no account), follow the official Titanic (Python) worksheet for the clicks and the template of the lesson for the structure, and hand in your work in the same lesson: a Try it now project is deleted after a few hours, and the model stays online for a short time only. Treat the subject with respect: every row of the data is a real person, and every passenger you test is invented. Your project key and your model's web address are secrets: they stay in the Machine Learning for Kids page and your own notebook, and they are replaced with YOUR-KEY in everything you hand in.",
            requirements:
              'Hand in three things. 1) Your Python program: the template of the lesson (or the worksheet\'s program) with your invented passengers, and the key and the model\'s web address replaced by YOUR-KEY. Search your code for them before you send it; if one of them was sent by mistake, delete the project on Machine Learning for Kids and tell your teacher. 2) The predictions for at least four invented passengers, as a table: the seven features, the label your model gave and its confidence. At least two pairs of passengers must differ in one feature only; for each pair, add one sentence on how the prediction moved. Add one sentence that compares your model with the baseline that always answers did_not_survive. 3) One limitation of the model, explained in three to five sentences: something it cannot know, why a prediction is not a fact about a person, or why a model like this must not be used to judge people today. How to send it: choose Code and paste your program, then write the table and the limitation in "About your work"; or send everything as Text. If you did the paper version, you can send a photo of your work as an Image, with the explanation in "About your work". If your teacher gave you another numbers dataset, use it instead: the same three things, with its features and labels. Invented passengers only: no real people, not yourself, nobody you know. If Python would not run, hand in the template filled in with the predictions of the Learn & Test page; if the website was blocked, hand in the paper version (your table, your rules and your answers). How it is assessed: Understanding (the features, the baseline, and what a prediction does and does not mean); Technical quality (a well-organised program and a clear, honest table); Responsible use of AI (no key, no real people, a respectful tone and a clear limit on how the model may be used); Creativity (passenger pairs well chosen to reveal what the model relies on).',
          },
          fr: {
            title: 'Mon modèle du Titanic en Python',
            brief:
              'Entraîne un modèle sur le projet des rescapés du Titanic de Machine Learning for Kids, appelle-le depuis ton propre programme Python avec des passagers que tu inventes, et explique ce qu’il a appris sur 1912 et l’usage qu’on ne doit jamais en faire. Utilise «\u00a0Essayer maintenant\u00a0» (Try it now, sans compte), suis la fiche officielle Titanic (version Python) pour les clics et le gabarit de la leçon pour la structure, et rends ton travail pendant la même leçon\u00a0: un projet «\u00a0Essayer maintenant\u00a0» est effacé au bout de quelques heures, et le modèle ne reste en ligne que peu de temps. Traite le sujet avec respect\u00a0: chaque ligne des données est une personne réelle, et chaque passager que tu testes est inventé. La clé de ton projet et l’adresse web de ton modèle sont des secrets\u00a0: elles restent dans la page de Machine Learning for Kids et dans ton propre notebook, et elles sont remplacées par YOUR-KEY dans tout ce que tu rends.',
            requirements:
              'Rends trois choses. 1) Ton programme Python\u00a0: le gabarit de la leçon (ou le programme de la fiche) avec tes passagers inventés, et la clé et l’adresse web du modèle remplacées par YOUR-KEY. Cherche-les dans ton code avant de l’envoyer\u00a0; si l’une d’elles a été envoyée par erreur, supprime le projet sur Machine Learning for Kids et préviens ton enseignant. 2) Les prédictions pour au moins quatre passagers inventés, sous forme de tableau\u00a0: les sept caractéristiques, l’étiquette donnée par ton modèle et sa confiance. Au moins deux paires de passagers ne doivent différer que par une seule caractéristique\u00a0; pour chaque paire, ajoute une phrase sur la façon dont la prédiction a bougé. Ajoute une phrase qui compare ton modèle à la référence qui répond toujours did_not_survive. 3) Une limite du modèle, expliquée en trois à cinq phrases\u00a0: quelque chose qu’il ne peut pas savoir, pourquoi une prédiction n’est pas un fait sur une personne, ou pourquoi un tel modèle ne doit pas servir à juger des personnes aujourd’hui. Pour l’envoyer\u00a0: choisis Code et colle ton programme, puis écris le tableau et la limite dans «\u00a0À propos de votre travail\u00a0»\u00a0; ou envoie tout sous forme de texte. Si tu as fait la version sur papier, tu peux envoyer une photo de ton travail sous forme d’image, avec l’explication dans «\u00a0À propos de votre travail\u00a0». Si ton enseignant t’a donné un autre jeu de données numériques, utilise-le à la place\u00a0: les trois mêmes choses, avec ses caractéristiques et ses étiquettes. Uniquement des passagers inventés\u00a0: aucune personne réelle, ni toi, ni quelqu’un que tu connais. Si Python ne fonctionnait pas, rends le gabarit rempli avec les prédictions de la page Apprendre & Tester\u00a0; si le site était bloqué, rends la version sur papier (ton tableau, tes règles et tes réponses). Critères d’évaluation\u00a0: Compréhension (les caractéristiques, la référence, et ce que signifie ou non une prédiction)\u00a0; Qualité technique (un programme bien organisé et un tableau clair et honnête)\u00a0; Usage responsable de l’IA (aucune clé, aucune personne réelle, un ton respectueux et une limite claire à l’usage du modèle)\u00a0; Créativité (des paires de passagers bien choisies pour révéler sur quoi s’appuie le modèle).',
          },
        },
        allowedSubmissionTypes: ['code', 'text', 'image'],
        rubric: [
          { key: 'understanding', weight: 35 },
          { key: 'technicalQuality', weight: 25 },
          { key: 'responsibleAi', weight: 30 },
          { key: 'creativity', weight: 10 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
