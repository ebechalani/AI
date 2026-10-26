// "AI Engineering with Python": the first course of the ai-engineer pathway (ages 14-16). Five
// modules, ten lessons and 500 minutes, in this order: m1 "Python for AI" (values and types, lists,
// dictionaries, loops, functions and tracebacks; reading a CSV file with the csv module, cleaning
// and summarising it), m2 "Machine learning basics" (classification and regression, a sealed test
// set, the baseline, accuracy and mean absolute error; the Titanic model called from Python), m3
// "Language and vision" (a text classifier in a pipeline, its confidence and a threshold; MobileNet,
// transfer learning and the gaps of a training set), m4 "APIs and automation" (HTTP, JSON and status
// codes, keys in environment variables, rate limits, retries with backoff, costs and privacy; an
// automated pipeline with tests, logs, safe reruns and a human in the loop) and m5 "Engineering
// challenge" (a one-page design document; building in steps from a baseline, a test table, limits
// and a 3-minute presentation), which ends the course with project-m5, the only project the
// certificate needs. Blocks cover every lesson stage in every module; one quiz per module; English
// and French; no uploaded files.
//
// The whole course is new, so every module lives in ./ai-engineering-with-python/, whose headers
// say what each one covers and how it was checked, and is spread here in course order; the quizzes
// and projects of the module files follow in the same order. One invented story runs through the
// course: a school club and its roof weather station (m1, m2), its open-day mascot and the
// lost-property box (m3), the comments of the science fair (m4) and the garden advisor "Water
// today?" (m5). The modules name one another's lessons by their titles, never by number (the
// lesson player numbers lessons across the whole course). The course is new in the content
// release 2026-10-longer-courses (releases.ts) and comes after the five demo courses in
// SEED_COURSES (index.ts). Its visibility is 'private' here, as in the other course files: the
// runner writes every official course as public.
//
// Three Machine Learning for Kids activities, all "Try it now" (no accounts, nothing about the
// learner is stored): Titanic, Python version (m2-l2, a numbers model of the 1912 passenger records,
// called from the learner's own Python program with invented passengers only), Make me happy,
// Python version (m3-l1, a text model of kind and mean messages to an invented mascot, called from
// Python with a confidence threshold) and Mobilenet (m3-l2, a ready-trained image model tested in
// Scratch on objects and drawings only). The project key and the model's address stay on the
// website and in the learner's own notebook, and become YOUR-KEY in anything brought back. Each
// activity has a paper version for schools that block the site and an optional hand-in
// (project-m2, project-m3, project-m3-2); m5 offers the site as one route of the final project,
// without an ml_activity block. Coding activities are written and saved, not run: the learner
// traces them by hand, and the module headers give their outputs, checked with Python 3. The three
// videos are in English and already curated in other course files: Crash Course AI #2 (m2-l1),
// Code.org's How AI Works video on computer vision (m3-l2) and IBM Technology's "What is a REST
// API?" (m4-l1). The other watch stages are written: a trace table (m1-l1), a toy model worked by
// hand (m3-l1) and a presentation read aloud with a coach's notes (m5-l2).

import type { SeedCourse } from '../types';
import { m1 } from './ai-engineering-with-python/m1';
import { m2 } from './ai-engineering-with-python/m2';
import { m3 } from './ai-engineering-with-python/m3';
import { m4 } from './ai-engineering-with-python/m4';
import { m5 } from './ai-engineering-with-python/m5';

export const aiEngineeringWithPython: SeedCourse = {
  id: 'ai-engineering-with-python',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'AI Engineering with Python',
        summary:
          'Write the Python an AI engineer uses: clean a dataset, judge models against a baseline, call your own Machine Learning for Kids models from code, test a ready-trained vision model, call AI services safely, automate a tested pipeline, then plan, build and present your own AI system.',
        description:
          'Most of an AI system is ordinary code around a model, and this course teaches you to write it in Python. In ten lessons, you do the work of an AI engineer alongside a school club and its roof weather station. You start with the Python you need for data: values and types, lists, dictionaries, loops and functions, and how to read an error message. Then you read a CSV file with Python, clean its missing values, duplicates, units and typos, and summarise it with a mean and a median. Next come the basics of machine learning: features and labels, classification and regression, a test set kept sealed until the end, and the baseline that every model must beat, scored with accuracy or with the mean absolute error. After that, you put a text classifier inside a pipeline and choose the confidence threshold below which your program says that it is not sure, then you test a ready-trained image model and discover transfer learning and the gaps and biases that a training set leaves behind. You then find out what a request to an AI service contains, and how to make it safe, reliable and affordable: status codes, keys kept in environment variables, rate limits, retries with backoff, costs and privacy. And you build an automated pipeline, with tests, logs and safe reruns, that leaves the uncertain decisions to a person. Three activities on Machine Learning for Kids put these ideas into practice. In Titanic, you train a model on the records of 712 real passengers of 1912, call it from your own Python program with passengers you invent, and work out what it reveals about the past and why it must never be used to judge people. In Make me happy, you train a classifier of kind and mean messages for an invented mascot and call it from Python with a threshold. In Mobilenet, you test an image model trained by others on more than a million photos and find out what it cannot see. They use "Try it now", so no account is needed, and your project key stays on the website and in your own notebook. Each one has a paper version for when the website cannot be opened, and a short hand-in. Each module has a quiz, and the course ends with an engineering challenge: you plan, build, test and present a small AI system of your own, with a design document, a build log, a test table, its limits and a 3-minute presentation. This final project leads to the certificate. Coding activities are written and saved in the lesson, not run: you trace the code by hand, line by line, as the computer would. The Python parts of the Machine Learning for Kids activities run in your own notebook, in an environment that your teacher approves, and each one has a fallback for when Python is not available.',
        outcomes: [
          'Write and trace Python programs with lists, dictionaries, loops and functions, and read an error message from the bottom up',
          'Read a CSV file with Python, clean its missing values, duplicates, units and labels, and summarise it with simple statistics',
          'Tell classification from regression, keep a sealed test set, and judge a model against a baseline with accuracy or mean absolute error',
          'Train numbers and text models on Machine Learning for Kids and call them from your own Python program, with the key kept secret',
          'Choose a confidence threshold, test a classifier honestly on new examples, and explain the gaps and biases of a ready-trained image model',
          'Call an AI service safely: status codes, keys in environment variables, rate limits, retries with backoff, costs and privacy',
          'Build an automated pipeline with tests, logs and safe reruns that leaves the uncertain decisions to a person',
          'Plan, build, test and present a small AI system with a design document, success criteria, a test table and its limits',
        ],
      },
      fr: {
        title: 'Ingénierie de l’IA avec Python',
        summary:
          'Code en Python comme un ingénieur en IA\u00a0: nettoie des données, juge des modèles face à une référence, appelle tes modèles de Machine Learning for Kids et des services d’IA en toute sécurité, teste un modèle de vision déjà entraîné, automatise un pipeline testé et crée ton propre système d’IA.',
        description:
          'L’essentiel d’un système d’IA, c’est du code ordinaire autour d’un modèle, et ce cours t’apprend à l’écrire en Python. En dix leçons, tu fais le travail d’un ingénieur en IA aux côtés d’un club du lycée et de sa station météo installée sur le toit. Tu commences par le Python dont tu as besoin pour les données\u00a0: valeurs et types, listes, dictionnaires, boucles et fonctions, et la lecture d’un message d’erreur. Puis tu lis un fichier CSV avec Python, tu nettoies ses valeurs manquantes, ses doublons, ses unités et ses fautes de frappe, et tu le résumes avec une moyenne et une médiane. Viennent ensuite les bases de l’apprentissage automatique\u00a0: les caractéristiques et les étiquettes, la classification et la régression, un jeu de test gardé sous scellés jusqu’à la fin, et la référence que tout modèle doit battre, mesurée par l’exactitude ou par l’erreur absolue moyenne. Après cela, tu places un classifieur de texte dans un pipeline et tu choisis le seuil de confiance sous lequel ton programme dit qu’il n’est pas sûr, puis tu testes un modèle d’images déjà entraîné et tu découvres l’apprentissage par transfert, ainsi que les lacunes et les biais que laisse un jeu d’entraînement. Tu découvres ensuite ce que contient une requête à un service d’IA, et comment la rendre sûre, fiable et abordable\u00a0: codes d’état, clés rangées dans des variables d’environnement, limites de débit, nouvelles tentatives avec des attentes croissantes, coûts et vie privée. Et tu construis un pipeline automatisé, avec des tests, un journal et des relances sans danger, qui laisse les décisions incertaines à une personne. Trois activités sur Machine Learning for Kids mettent ces idées en pratique. Dans Titanic, tu entraînes un modèle sur les registres de 712\u00a0vrais passagers de 1912, tu l’appelles depuis ton propre programme Python avec des passagers que tu inventes, et tu découvres ce qu’il révèle du passé et pourquoi il ne doit jamais servir à juger des personnes. Dans Rends-moi heureux (Make me happy), tu entraînes un classifieur de messages gentils et méchants pour une mascotte inventée et tu l’appelles depuis Python avec un seuil. Dans Mobilenet, tu testes un modèle d’images entraîné par d’autres sur plus d’un million de photos et tu découvres ce qu’il ne sait pas voir. Elles se font avec «\u00a0Essayer maintenant\u00a0» (Try it now)\u00a0: pas besoin de créer de compte, et ta clé de projet reste sur le site et dans ton propre notebook. Chacune a une version sur papier pour le cas où le site ne s’ouvre pas, et un court travail à rendre. Chaque module comporte un quiz, et le cours se termine par un défi d’ingénierie\u00a0: tu conçois, construis, testes et présentes ton propre petit système d’IA, avec un document de conception, un journal de construction, un tableau de tests, ses limites et une présentation de 3\u00a0minutes. Ce projet final mène au certificat. Les activités de programmation sont écrites et enregistrées dans la leçon, pas exécutées\u00a0: tu suis le code à la main, ligne par ligne, comme le ferait l’ordinateur. Les parties en Python des activités de Machine Learning for Kids s’exécutent dans ton propre notebook, dans un environnement approuvé par ton enseignant, et chacune a une solution de repli pour le cas où Python n’est pas disponible.',
        outcomes: [
          'Écrire et suivre à la main des programmes Python avec des listes, des dictionnaires, des boucles et des fonctions, et lire un message d’erreur de bas en haut',
          'Lire un fichier CSV avec Python, nettoyer ses valeurs manquantes, ses doublons, ses unités et ses étiquettes, et le résumer par quelques statistiques simples',
          'Distinguer classification et régression, garder un jeu de test scellé et juger un modèle face à une référence avec l’exactitude ou l’erreur absolue moyenne',
          'Entraîner des modèles de nombres et de texte sur Machine Learning for Kids et les appeler depuis ton propre programme Python, sans divulguer la clé',
          'Choisir un seuil de confiance, tester honnêtement un classifieur sur de nouveaux exemples et expliquer les lacunes et les biais d’un modèle d’images déjà entraîné',
          'Appeler un service d’IA en toute sécurité\u00a0: codes d’état, clés dans des variables d’environnement, limites de débit, nouvelles tentatives espacées, coûts et vie privée',
          'Construire un pipeline automatisé, avec des tests, un journal et des relances sans danger, qui laisse les décisions incertaines à une personne',
          'Concevoir, construire, tester et présenter un petit système d’IA avec un document de conception, des critères de réussite, un tableau de tests et ses limites',
        ],
      },
    },
    audience: 'student',
    area: 'coding',
    tags: [
      'python',
      'data-cleaning',
      'machine-learning',
      'machine-learning-for-kids',
      'classification',
      'computer-vision',
      'apis',
      'automation',
      'testing',
      'responsible-ai',
    ],
    ageMin: 14,
    ageMax: 16,
    estimatedMinutes: 500,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'ai-engineer',
    order: 1,
    accessTier: 'free',
  },

  modules: [m1.module, m2.module, m3.module, m4.module, m5.module],

  quizzes: [...m1.quizzes, ...m2.quizzes, ...m3.quizzes, ...m4.quizzes, ...m5.quizzes],

  projects: [...m1.projects, ...m2.projects, ...m3.projects, ...m4.projects, ...m5.projects],
};
