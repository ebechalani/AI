// "From Idea to AI Product": the first course of the ai-innovator pathway (ages 16-18), new in a
// content release (ARCHITECTURE.md 11.7). Five modules, ten lessons and 480 minutes, in this order:
// m1 "Advanced generative AI" (how large language models are built: tokens, next-token
// prediction, pre-training, instruction and preference tuning, the context window, sampling and
// temperature; hallucinations, retrieval-augmented generation with citations that can be checked,
// and a small evaluation set), m2 "AI agents and automation" (the agent loop and tool calls, four
// ways agents fail, indirect prompt injection and least privilege; an agent designed on paper with
// approval points, logs, limits and costs, and the loop that enforces them), m3 "From problem to
// product" (user research, a problem statement and a value proposition, when not to use AI;
// prototypes from paper to MVP, success, vanity and counter-metrics, a Wizard-of-Oz user test),
// m4 "Responsible AI, business and society" (a risk register, the EU AI Act and the GDPR as a map,
// not legal advice, transparency, accessibility and security; unit economics, pricing, what makes
// a product hard to copy, and what AI changes for work, the planet and misuse) and m5 "Startup
// capstone" (a lean canvas, a roadmap ordered by risk and a pitch; the final project, project-m5:
// a prototype of the startup's riskiest part tested with users and an evaluation set, a
// responsible-AI plan and a pitch). Blocks cover every lesson stage; one quiz per module; English
// and French; no uploaded files.
//
// Every module lives in ./from-idea-to-ai-product/, whose headers say what each one covers and
// which facts and code traces were checked. A release writes a new course whole; once a database
// holds it, its modules, lessons, blocks, quizzes and project must not be changed, only added to.
// The modules refer to earlier lessons by their titles; m2 and m4 also name modules by number
// ("module 1" to "module 5", as the player labels them), which holds as long as the modules keep
// this order. Later modules build on the work of earlier ones: the evaluation set of m1-l2 is
// reused in m2-l2, m3-l2 and the capstone, the one-pager of m3-l1 leads to the Wizard-of-Oz test
// of m3-l2 and to the startup of m5, and the risk register of m4-l1 to the responsible-AI plan of
// m5-l2.
//
// One Machine Learning for Kids activity, with "Try it now" (no account): RAG-time (m1-l2,
// optional; a small language model run in the browser is asked the same questions before and
// after the learner puts the right text in its context), with a closed-book, open-book paper
// version for schools that block the site. What learners bring back from it goes into the
// lesson's evaluation code and reflection, so it has no hand-in project. In m5-l2, a no-code
// classifier trained with Try it now is one of six routes for the prototype, described in the
// lesson text and the project brief (no ml_activity block, so the lesson states the safety rules
// itself). project-m5 is the only project and the one the certificate needs. Coding activities
// (m1-l1, m1-l2, m2-l2, m4-l2, all in Python) are saved, not run, and traced by hand. The one
// video, in English, is Code.org's How AI Works video on chatbots and large language models
// (m1-l1), also curated in other courses; no curated video fits the other lessons.

import type { SeedCourse } from '../types';
import { m1 } from './from-idea-to-ai-product/m1';
import { m2 } from './from-idea-to-ai-product/m2';
import { m3 } from './from-idea-to-ai-product/m3';
import { m4 } from './from-idea-to-ai-product/m4';
import { m5 } from './from-idea-to-ai-product/m5';

export const fromIdeaToAiProduct: SeedCourse = {
  id: 'from-idea-to-ai-product',
  course: {
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'From Idea to AI Product',
        summary:
          'Turn an idea into an AI product: learn how language models are built and grounded in sources, design agents with a human in the loop, research a real problem and test your idea, weigh risks, laws and business models, then plan, build, test and pitch your own AI startup.',
        description:
          'Most AI products are built on a model that someone else made. This course shows you how to turn an idea into a product that people need and can trust. In ten lessons you will first open up the large language model: tokens, next-token prediction, the three stages of training, the context window, sampling and temperature, and the limits that follow from them. You will find out why models make things up, how retrieval-augmented generation grounds answers in sources with citations you can check, and how a small evaluation set, written before testing, measures whether it works. Next you will see what makes an AI agent (a model that chooses actions in a loop, with tools, memory and a stop rule), the four ways agents fail, including prompt injection, and the principle of least privilege; then you will design an agent on paper with its approval points, logs, limits and costs. After that, you will work like a product team: interview the people you want to help, write a problem statement and a value proposition, decide honestly whether AI is the right tool, and test your riskiest assumption with a Wizard-of-Oz prototype, success metrics and a threshold set in advance. You will learn to think in risks, with a risk register, a map of the EU AI Act and the GDPR (not legal advice) and the habits that earn trust: transparency, accessibility and security. You will also work out what an AI product costs to run, how it can charge, what makes it hard to copy, and what it changes for jobs, for the planet and in the hands of people who would misuse it. Machine Learning for Kids comes in twice, with "Try it now", so no account is needed. In RAG-time, an optional activity, you ask a small language model the same questions before and after you give it the right text, and see what retrieval changes; a paper version, closed book then open book, teaches the same idea when the website cannot be used. Later, a no-code classifier trained on the site is one of the routes you can choose for the prototype of your final project. Finally, in the startup capstone, you plan your startup with a lean canvas, a roadmap ordered by risk and a pitch in which every claim is evidence or a labelled assumption; then you build a prototype of its riskiest part, test it with real users and an evaluation set, write a responsible-AI plan and pitch it with your evidence, your risks and your ask. Each module has a quiz, and the course ends with this final project and a certificate. Coding activities in Python (a tiny language model, an evaluation scorer, an agent loop and the unit economics of a product) are written and saved in the lesson, not run, so you work out by hand what the code does; you can run them later in an environment your teacher approves.',
        outcomes: [
          'Explain how a large language model is built and tuned, and how tokens, the context window and temperature shape what it writes and where it fails',
          "Ground a model's answers in sources with retrieval and citations that can be checked, and measure them with an evaluation set written in advance",
          'Explain how an AI agent works and fails, and design one with least privilege, approval points, logs and limits',
          'Research a real problem with its users, write a problem statement and a value proposition, and decide honestly whether AI is the right tool',
          'Test an idea cheaply with Wizard-of-Oz and prompt prototypes, success metrics, counter-metrics and a threshold set in advance',
          'Write a risk register, place a product on the map of the EU AI Act and the GDPR, and design for transparency, accessibility and security',
          'Work out the unit economics of an AI product, choose how it charges, and weigh its impact on jobs, the planet and misuse',
          'Plan, prototype, test and pitch an AI startup with a lean canvas, a roadmap ordered by risk and a responsible-AI plan',
        ],
      },
      fr: {
        title: 'De l’idée au produit d’IA',
        summary:
          'Fais d’une idée un produit d’IA\u00a0: découvre comment les modèles de langage sont construits et ancrés dans des sources, conçois des agents avec un humain dans la boucle, étudie un vrai problème, teste ton idée, pèse risques, lois et économie, puis planifie, construis, teste et présente ta startup.',
        description:
          'La plupart des produits d’IA reposent sur un modèle créé par quelqu’un d’autre. Ce cours te montre comment transformer une idée en un produit dont les gens ont besoin et auquel ils peuvent se fier. En dix leçons, tu vas d’abord ouvrir la boîte du grand modèle de langage\u00a0: les tokens, la prédiction du token suivant, les trois étapes de l’entraînement, la fenêtre de contexte, l’échantillonnage et la température, et les limites qui en découlent. Tu découvriras pourquoi les modèles inventent, comment la génération augmentée par récupération (RAG) ancre les réponses dans des sources avec des citations vérifiables, et comment un petit jeu d’évaluation, écrit avant les tests, mesure si cela fonctionne. Tu verras ensuite ce qui fait un agent d’IA (un modèle qui choisit des actions en boucle, avec des outils, une mémoire et une règle d’arrêt), les quatre façons dont les agents échouent, dont l’injection de prompt, et le principe du moindre privilège\u00a0; puis tu concevras un agent sur papier, avec ses points de validation, ses journaux, ses limites et ses coûts. Tu travailleras alors comme une équipe produit\u00a0: interroger les personnes que tu veux aider, rédiger un énoncé du problème et une proposition de valeur, décider honnêtement si l’IA est le bon outil, et tester ton hypothèse la plus risquée avec un prototype Magicien d’Oz, des indicateurs de réussite et un seuil fixé à l’avance. Tu apprendras à raisonner en termes de risques, avec un registre des risques, une carte du règlement européen sur l’IA (AI Act) et du RGPD (pas un avis juridique) et les habitudes qui gagnent la confiance\u00a0: transparence, accessibilité et sécurité. Tu calculeras aussi ce que coûte le fonctionnement d’un produit d’IA, comment le faire payer, ce qui le rend difficile à copier, et ce qu’il change pour l’emploi, pour la planète et entre les mains de ceux qui voudraient le détourner. Machine Learning for Kids intervient deux fois, avec «\u00a0Essayer maintenant\u00a0» (Try it now)\u00a0: pas besoin de créer de compte. Dans RAG-time, une activité facultative, tu poses les mêmes questions à un petit modèle de langage avant et après lui avoir donné le bon texte, et tu vois ce que change la récupération\u00a0; une version sur papier, livre fermé puis livre ouvert, enseigne la même idée quand le site ne s’ouvre pas. Plus tard, un classifieur sans code entraîné sur le site sera l’une des voies possibles pour le prototype de ton projet final. Enfin, dans le projet final de startup, tu planifies ta startup avec un lean canvas, une feuille de route ordonnée selon les risques et un pitch où chaque affirmation est une preuve ou une hypothèse signalée comme telle\u00a0; puis tu construis un prototype de sa partie la plus risquée, tu le testes avec de vrais utilisateurs et un jeu d’évaluation, tu rédiges un plan d’IA responsable et tu présentes ton pitch avec tes preuves, tes risques et ta demande. Chaque module comporte un quiz, et le cours se termine par ce projet final, puis par un certificat. Les activités de programmation en Python (un tout petit modèle de langage, un programme qui note un jeu d’évaluation, une boucle d’agent et l’économie unitaire d’un produit) sont écrites et enregistrées dans la leçon, pas exécutées\u00a0: tu détermines à la main ce que fait le code, et tu pourras l’exécuter plus tard dans un environnement approuvé par ton enseignant.',
        outcomes: [
          'Expliquer comment un grand modèle de langage est construit et ajusté, et comment les tokens, la fenêtre de contexte et la température façonnent ce qu’il écrit et ses erreurs',
          'Ancrer les réponses d’un modèle dans des sources grâce à la récupération et à des citations vérifiables, et les mesurer avec un jeu d’évaluation écrit à l’avance',
          'Expliquer comment un agent d’IA fonctionne et échoue, et en concevoir un avec le moindre privilège, des points de validation, des journaux et des limites',
          'Étudier un vrai problème avec ses utilisateurs, rédiger un énoncé du problème et une proposition de valeur, et décider honnêtement si l’IA est le bon outil',
          'Tester une idée à moindre coût avec des prototypes Magicien d’Oz et des prototypes de prompt, des indicateurs de réussite, des indicateurs garde-fous et un seuil fixé à l’avance',
          'Rédiger un registre des risques, situer un produit sur la carte de l’AI Act et du RGPD, et concevoir pour la transparence, l’accessibilité et la sécurité',
          'Calculer l’économie unitaire d’un produit d’IA, choisir comment le faire payer, et peser ses impacts sur l’emploi, la planète et les détournements',
          'Planifier, prototyper, tester et présenter une startup d’IA avec un lean canvas, une feuille de route ordonnée selon les risques et un plan d’IA responsable',
        ],
      },
    },
    audience: 'student',
    area: 'innovation',
    tags: [
      'generative-ai',
      'rag',
      'ai-agents',
      'automation',
      'product-design',
      'user-research',
      'responsible-ai',
      'entrepreneurship',
      'startups',
      'machine-learning-for-kids',
    ],
    ageMin: 16,
    ageMax: 18,
    estimatedMinutes: 480,
    visibility: 'private',
    certificateEnabled: true,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    isOfficial: true,
    pathwayId: 'ai-innovator',
    order: 1,
    accessTier: 'free',
  },

  modules: [m1.module, m2.module, m3.module, m4.module, m5.module],

  quizzes: [...m1.quizzes, ...m2.quizzes, ...m3.quizzes, ...m4.quizzes, ...m5.quizzes],

  projects: [...m1.projects, ...m2.projects, ...m3.projects, ...m4.projects, ...m5.projects],
};
