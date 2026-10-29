// Module m5 of "From Idea to AI Product" (ages 16-18): the startup capstone, the last module of the
// course. It comes after m1 (advanced generative AI), m2 (AI agents and automation), m3 (from
// problem to product) and m4 (responsible AI, business and society), and its final project,
// project-m5, is required for the certificate. It refers back by name, without teaching them
// again, to "Grounding, retrieval and evaluation" (m1-l2: the evaluation set, grounded answers
// with citations and abstentions), "Design an agent with a human in the loop" (m2-l2: approval
// points, the design sheet), "Find a problem worth solving" and "Prototype and measure" (m3: the
// Value Proposition Canvas of Osterwalder, the one-pager, the riskiest assumption, thresholds set
// in advance, the Wizard of Oz, the two questions of an AI product, "4 of 5 is a signal, not a
// statistic", automation bias in tests), the module "From problem to product", "Risk, regulation
// and trust" (m4-l1: the risk register scored likelihood x severity from 1 to 3, cause -> event
// -> harm, the mitigation ladder, residual risk, the map of the EU AI Act and the GDPR) and
// "Business models and impact" (m4-l2: users are not always customers, unit economics, pricing
// models, the model is rarely your advantage). The laws are not taught again: m5-l2 sends the
// learner back to m4's map and asks for "might apply, and why", never a claim of compliance.
// Modules and lessons are named, not numbered, in the text, as in m3.
// m5-l1: the hook is Theranos as widely reported (founded in 2003 by Elizabeth Holmes, then a
// 19-year-old university student; hundreds of millions of dollars from investors; the Wall Street
// Journal's reporting from 2015: its own device could not do what was claimed and most tests ran
// on other companies' machines; some patients received results the company later voided; shut
// down in 2018; Holmes convicted in 2022 of defrauding investors and sentenced to more than eleven
// years), then AI washing: in March 2024 the US SEC charged two investment advisers (Delphia and
// Global Predictions, not named in the text) with false and misleading statements about their use
// of AI, and both settled and paid penalties; nothing else is claimed. Then the Lean Canvas (Ash
// Maurya, adapted from Osterwalder's Business Model Canvas, four of whose boxes become Problem,
// Solution, Key metrics and Unfair advantage; the nine boxes in the order its author suggests
// filling them), E/A marks (French V for "vérifié" and H for "hypothèse", since P already means
// a participant code in m3 and "probabilité" in m4), and an invented startup that runs through the
// module: FeedbackLens, which groups a student council's anonymous suggestions by topic and drafts
// summaries that a council member approves. Every FeedbackLens figure (4 of 5 interviewed, two
// councils ready to pilot, 15 test comments, 11 then 13 of 15, 3 of 4 testers) is invented and
// labelled as such. A roadmap ordered by risk (question, done when, if not; a thin slice; a
// not-now list; responsible AI from milestone 1; time-boxing; planned evidence), whose milestone 1
// threshold (12 of 15, none naming a person summarised) the build log of m5-l2 meets (v1 11 of
// 15; v2, one prompt rule: still 11, the named comment flagged; v3, two groups allowed: 13 of 15;
// one change per version, as the rule says). The pitch in the outline's seven parts (problem, users, solution,
// demo, evidence, risks, ask; timings add up to 3 min 50 s, "about four minutes"), what investor
// decks usually add, and three rules (evidence or labelled assumption, an honest demo, credit and
// protect). The try stage is the plan on paper, starting from the m3 one-pager and the m4 risk
// register; then the outline's check_my_work tutor activity, the module quiz quiz-m5 (stage check,
// seven questions on m5-l1 and the earlier ideas it applies; it avoids m4's question on what makes
// a product hard to copy; options are not shuffled, so the correct answers sit in different
// places: q1 b, q2 c, q3 False, q5 d, q6 a) and a reflection.
// m5-l2: the final project. Six prototype routes (Wizard of Oz or concierge, prompt prototype,
// grounded helper, no-code classifier, agent or workflow, small coded app) and the rules of the
// build; a one-page responsible-AI plan in nine parts, with a FeedbackLens risk table in m4's
// scoring (6, 4, 4) with m4's Owner and Residual columns; pitch day (script, slides, a demo with a backup and a failure shown, six hard
// questions, "not tested yet", feedback as the audience). Then a challenge_me tutor activity (not
// in the outline: added so that the learner rehearses the question time, as a judge would ask),
// the project block (build) and a reflection. No try stage: the 90 minutes start the project.
// No Machine Learning for Kids activity block and no worksheet: the learner chooses the route of
// the prototype, and an ml_activity block would impose one project type, so the site is named as
// one route in m5-l2's text and in the brief, as in ai-engineering-with-python m5. Facts used,
// from the site's code at taxinomitis f360de1 (en.json, fr.json, models.controller.js): Try it now
// projects "will be deleted after (at least) four hours"; one project at a time; at least five
// examples per label for text and images projects; the Learn & Test page; the French labels
// "Essayer maintenant" and "Apprendre & Tester". Teachable Machine is named as an option, as in
// from-ai-user-to-ai-developer. With no ml_activity block, the player's fixed safety notice does
// not appear, so m5-l2-b2 and the brief say it themselves: webcam or microphone only with the
// teacher's permission, no personal details on the site. Interviewees and testers come from
// classmates, family or clubs with the teacher's agreement, never strangers online, as in m3.
// project-m5 (kind project, 500 XP, required for the certificate) takes text, link, pdf, video or
// image. A submission has one type and attaches files of that type only, so the requirements say
// how to send the six parts each way; with Video, the written parts go behind a link given in
// "About your work" (the form's label; "À propos de votre travail" in French). Recordings show the
// screen and slides with the learner's voice; the learner or a teammate appears on camera only
// with their own and the teacher's agreement, and testers and the audience are never filmed. Its
// rubric weighs technical quality 30, understanding 25, responsible AI 25 and creativity 20
// (a startup idea counts for more than in the course capstones that weigh it 15). Teams of up to
// three are allowed when the teacher agrees; each member hands in the team's work with a line on
// who did what. The instructions of ai_activity blocks, reflection prompts, quiz texts and project
// texts are plain text (the player renders no Markdown there; project texts keep their line
// breaks), and rich_text bodies carry no Markdown headings. No video: no curated id fits planning
// or pitching, and new ids cannot be verified. French typography uses \u00a0 escapes, as in the
// other course files. No personal data: every idea, comment, tester and figure is invented.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m5: SeedModulePart = {
  module: {
    id: 'm5',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Startup capstone',
          description:
            'Plan your AI startup on one page, build and test a prototype of its riskiest part, and pitch it with evidence, risks and a responsible-AI plan.',
        },
        fr: {
          title: 'Projet final de startup',
          description:
            'Planifie ta startup d’IA sur une page, construis et teste un prototype de sa partie la plus risquée, puis présente-la dans un pitch avec tes preuves, tes risques et un plan d’IA responsable.',
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
              title: 'Plan your AI startup',
              summary:
                'Put your startup on one page with a lean canvas, order your work by risk in a roadmap, and structure a pitch in which every claim is evidence or a labelled assumption.',
            },
            fr: {
              title: 'Planifie ta startup d’IA',
              summary:
                'Résume ta startup sur une page avec un lean canvas, ordonne ton travail selon les risques dans une feuille de route, et construis un pitch où chaque affirmation est une preuve ou une hypothèse signalée comme telle.',
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
                heading: 'Claims need evidence',
                body: "In 2003, Elizabeth Holmes, a 19-year-old university student, founded Theranos, a US company that promised to run a wide range of blood tests on a few drops of blood from a finger. Investors put hundreds of millions of dollars into it. From 2015, reporting by the *Wall Street Journal* revealed that the company's own device could not do what had been claimed and that most of its tests ran on other companies' machines; some patients had received results that the company later voided. Theranos shut down in 2018, and in 2022 its founder was convicted of defrauding investors and sentenced to more than eleven years in prison.\n\nTheranos did not use AI, but the trap is the same for every startup: a pitch is a set of claims, and users, customers and investors make decisions based on them. AI makes the trap more tempting, because the label attracts attention and a demo can look smarter than the system behind it. In 2024, the US Securities and Exchange Commission charged two investment firms with making false and misleading statements about their use of AI; both paid penalties to settle. The practice has a nickname, on the model of *greenwashing*: **AI washing**.\n\nThis module is your startup capstone. In this lesson, you plan your startup and your pitch so that every claim points to evidence or is labelled as an assumption; in the next, you build a prototype, test it with real users and pitch it.",
              },
              fr: {
                heading: 'Une affirmation demande des preuves',
                body: 'En 2003, Elizabeth Holmes, alors étudiante de 19\u00a0ans, fonde Theranos, une entreprise américaine qui promet de réaliser toute une gamme d’analyses de sang à partir de quelques gouttes prélevées au bout du doigt. Des investisseurs y placent des centaines de millions de dollars. À partir de 2015, les enquêtes du *Wall Street Journal* révèlent que l’appareil de l’entreprise ne fait pas ce qui avait été annoncé et que la plupart de ses analyses tournent sur les machines d’autres fabricants\u00a0; certains patients avaient reçu des résultats que l’entreprise a ensuite annulés. Theranos ferme en 2018 et, en 2022, sa fondatrice est reconnue coupable de fraude envers des investisseurs, puis condamnée à plus de onze ans de prison.\n\nTheranos n’utilisait pas l’IA, mais le piège est le même pour toute startup\u00a0: un pitch est une suite d’affirmations, et utilisateurs, clients et investisseurs prennent des décisions en les croyant. L’IA rend le piège plus tentant, car l’étiquette attire l’attention et une démonstration peut paraître plus intelligente que le système qui se cache derrière. En 2024, la SEC, le gendarme américain des marchés financiers, a poursuivi deux sociétés de conseil en investissement pour des déclarations fausses et trompeuses sur leur usage de l’IA\u00a0; toutes deux ont accepté de payer une amende pour clore l’affaire. Cette pratique a un surnom, sur le modèle du *greenwashing*\u00a0: l’**AI washing**.\n\nCe module est ton projet final de startup. Dans cette leçon, tu prépares ta startup et ton pitch pour que chaque affirmation renvoie à une preuve ou soit signalée comme une hypothèse\u00a0; dans la suivante, tu construis un prototype, tu le testes avec de vrais utilisateurs et tu présentes ton pitch.',
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
                heading: 'The lean canvas: your startup on one page',
                body: "A forty-page business plan is out of date the week after you write it, so startups use one page. The **Lean Canvas**, created by Ash Maurya, adapts Alexander Osterwalder's Business Model Canvas (you met his Value Proposition Canvas in *Find a problem worth solving*): four of its boxes become Problem, Solution, Key metrics and Unfair advantage, to suit a venture still searching for what works. Here are its nine boxes, in the order its author suggests filling them, with an invented startup that runs through this module: **FeedbackLens**, which helps a student council read hundreds of anonymous suggestions.\n\n| Box | What goes in | FeedbackLens (invented) |\n|---|---|---|\n| 1. Problem | The top one to three problems, and the **existing alternatives** | Sorting hundreds of free-text suggestions takes an evening, and quiet topics get lost; today, a spreadsheet, or only the first fifty are read (E: 4 of 5 council members interviewed) |\n| 2. Customer segments | Who has the problem, and the **early adopters** who need a solution most | Student councils, first those that already use an online suggestion form; the school would pay (A) |\n| 3. Unique value proposition | One clear sentence: why it is different and worth attention | Every suggestion read and every topic summarised in minutes, checked by a council member before anything is shared |\n| 4. Solution | The smallest set of features that solves the top problems | Topic groups with counts; a draft summary per group, each sentence linked to its comments; approve, edit or reject |\n| 5. Channels | How you reach your early adopters | A demo at a council meeting; the teachers who supervise councils (A) |\n| 6. Revenue streams | Who pays, how and how much | A free pilot this term, then a yearly fee per school (A: untested) |\n| 7. Cost structure | What it costs to run and to grow | Model requests, which grow with every comment; hosting; the council's time to check drafts |\n| 8. Key metrics | The few numbers that show it works | Summaries approved without major edits; days from closing the form to publishing; counter-metric: comments wrongly grouped in a spot check |\n| 9. Unfair advantage | What others cannot easily copy or buy | The team sits on a council, and two other councils have agreed to a pilot (E) |\n\nThree habits keep the canvas honest:\n\n- **Mark every note** E (evidence: say which) or A (assumption). The revenue box above is pure assumption, which is fine as long as it is marked.\n- **Separate users from customers**, as in *Business models and impact*: council members use FeedbackLens, the school would pay, and they want different things.\n- **Put the AI in the right boxes.** The model cost per user goes in the cost structure; your pricing model, and the margin it leaves per user, in the revenue streams: together they are your unit economics, from *Business models and impact*. The model is not your unfair advantage, since competitors can rent the same one. *Unfair* does not mean cheating: it is an edge others cannot simply copy or buy, such as inside knowledge of the problem, a way to reach users, or trust.\n\nThe canvas is a living document: date each version, and update it when evidence comes in.",
              },
              fr: {
                heading: 'Le lean canvas\u00a0: ta startup sur une page',
                body: 'Un plan d’affaires de quarante pages est dépassé la semaine qui suit sa rédaction\u00a0: les startups préfèrent une seule page. Le **Lean Canvas**, créé par Ash Maurya, adapte le Business Model Canvas d’Alexander Osterwalder (tu as rencontré sa carte de la proposition de valeur dans *Trouver un problème qui mérite d’être résolu*)\u00a0: quatre de ses cases deviennent Problème, Solution, Indicateurs clés et Avantage déloyal, pour convenir à une jeune entreprise qui cherche encore ce qui marche. Voici ses neuf cases, dans l’ordre où son auteur conseille de les remplir, avec une startup inventée qui t’accompagnera dans tout ce module\u00a0: **FeedbackLens**, qui aide un conseil des élèves à lire des centaines de suggestions anonymes.\n\n| Case | Ce qu’on y met | FeedbackLens (inventé) |\n|---|---|---|\n| 1. Problème | Les un à trois problèmes principaux, et les **alternatives existantes** | Trier des centaines de suggestions rédigées librement prend une soirée, et les sujets discrets se perdent\u00a0; aujourd’hui, un tableur, ou seules les cinquante premières sont lues (V\u00a0: 4 des 5 membres du conseil interrogés) |\n| 2. Segments de clientèle | Qui a le problème, et les **premiers adoptants** qui ont le plus besoin d’une solution | Les conseils des élèves, d’abord ceux qui utilisent déjà un formulaire de suggestions en ligne\u00a0; l’établissement paierait (H) |\n| 3. Proposition de valeur unique | Une phrase claire\u00a0: en quoi c’est différent et pourquoi ça mérite l’attention | Chaque suggestion lue et chaque thème résumé en quelques minutes, vérifié par un membre du conseil avant toute diffusion |\n| 4. Solution | Le plus petit ensemble de fonctionnalités qui résout les problèmes principaux | Des groupes par thème avec leurs effectifs\u00a0; un brouillon de résumé par groupe, chaque phrase reliée à ses commentaires\u00a0; approuver, modifier ou rejeter |\n| 5. Canaux | Comment tu atteins tes premiers adoptants | Une démonstration lors d’une réunion du conseil\u00a0; les enseignants qui accompagnent les conseils (H) |\n| 6. Sources de revenus | Qui paie, comment et combien | Un pilote gratuit ce trimestre, puis un abonnement annuel par établissement (H\u00a0: non testé) |\n| 7. Structure de coûts | Ce que coûtent le fonctionnement et la croissance | Les requêtes au modèle, qui augmentent avec chaque commentaire\u00a0; l’hébergement\u00a0; le temps que le conseil passe à vérifier les brouillons |\n| 8. Indicateurs clés | Les quelques chiffres qui montrent que ça marche | Les résumés approuvés sans grosse modification\u00a0; le nombre de jours entre la clôture du formulaire et la publication\u00a0; garde-fou\u00a0: les commentaires mal classés lors d’une vérification par sondage |\n| 9. Avantage déloyal | Ce que les autres ne peuvent ni copier ni acheter facilement | L’équipe siège au conseil, et deux autres conseils ont accepté un pilote (V) |\n\nTrois habitudes pour que ton canvas reste honnête\u00a0:\n\n- **Marque chaque note** V (vérifié\u00a0: dis par quelle preuve) ou H (hypothèse). La case des revenus ci-dessus n’est qu’une hypothèse, ce qui est normal tant qu’elle est signalée.\n- **Distingue utilisateurs et clients**, comme dans *Modèles économiques et impacts*\u00a0: les membres du conseil utilisent FeedbackLens, l’établissement paierait, et ils ne veulent pas la même chose.\n- **Place l’IA dans les bonnes cases.** Le coût du modèle par utilisateur va dans la structure de coûts\u00a0; ton modèle de prix, et la marge qu’il laisse par utilisateur, dans les sources de revenus\u00a0: ensemble, ils forment ton économie unitaire, vue dans *Modèles économiques et impacts*. Le modèle d’IA n’est pas ton avantage déloyal, puisque tes concurrents peuvent louer le même. *Déloyal* ne veut pas dire tricher\u00a0: c’est un atout que les autres ne peuvent pas simplement copier ou acheter, comme une connaissance du problème de l’intérieur, un moyen d’atteindre les utilisateurs, ou la confiance.\n\nLe canvas est un document vivant\u00a0: date chaque version, et mets-le à jour quand arrivent les preuves.',
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
                heading: 'A roadmap ordered by risk',
                body: 'A roadmap is not a list of features with dates. For a startup, it is the order in which you will learn what you need to know, riskiest assumption first, as in *Prototype and measure*: if it is false, nothing else matters. Each milestone answers one question, has a **done when** written before you start and an **if not** that says what you will change: narrow the job, pivot or stop.\n\n| Milestone | Question | Done when | If not |\n|---|---|---|---|\n| 1. Can a model do it? | Can a model group comments as a council member would? | On 15 invented test comments, at least 12 grouped as expected, and no comment that names a person summarised | Narrow the job: grouping only, no summaries |\n| 2. Thin slice | Does it work from end to end? | One full run: paste comments, get groups and draft summaries with their links, approve | Replace the approval screen with a paper checklist |\n| 3. Do people want it? | Do council members trust the drafts and use them? | 3 of 4 testers publish a summary in under ten minutes, and each one spots the wrong summary planted in the test | Fix the worst problem, then test again |\n| 4. Pitch ready | Can we make the case in four minutes? | Two timed rehearsals, one in front of someone outside the team; backup screenshots of the demo | Cut slides, not evidence |\n\n(An invented plan: the numbers are thresholds, not results.)\n\nFive rules:\n\n- **A thin slice before polish:** one rough path from input to output beats three beautiful screens that do not connect.\n- **A not-now list:** the features you will not build yet (accounts, a mobile app, automatic publishing). It protects your time and shows judges that you can choose.\n- **Responsible AI from milestone 1:** the check on comments that name a person is there, not added the night before the pitch; approval points, as in *Design an agent with a human in the loop*, are part of the thin slice; the planted wrong summary of milestone 3 tests automation bias.\n- **Time-box:** give each milestone a session or a date; when time runs out, cut features, never the testing.\n- **Plan the evidence:** every claim in your pitch needs a milestone that produces its evidence.',
              },
              fr: {
                heading: 'Une feuille de route ordonnée par les risques',
                body: 'Une feuille de route n’est pas une liste de fonctionnalités avec des dates. Pour une startup, c’est l’ordre dans lequel tu vas apprendre ce que tu as besoin de savoir, en commençant par l’hypothèse la plus risquée, comme dans *Prototyper et mesurer*\u00a0: si elle est fausse, le reste ne compte plus. Chaque étape répond à une question, a un critère **terminé quand** écrit avant de commencer et un **sinon** qui dit ce que tu changeras\u00a0: réduire la mission, pivoter ou arrêter.\n\n| Étape | Question | Terminé quand | Sinon |\n|---|---|---|---|\n| 1. Un modèle en est-il capable\u00a0? | Un modèle peut-il regrouper les commentaires comme le ferait un membre du conseil\u00a0? | Sur 15 commentaires de test inventés, au moins 12 bien regroupés, et aucun commentaire qui nomme une personne n’est résumé | Réduire la mission\u00a0: le regroupement seul, sans résumés |\n| 2. Tranche fine | Est-ce que tout fonctionne de bout en bout\u00a0? | Un passage complet\u00a0: coller les commentaires, obtenir les groupes et les brouillons de résumés avec leurs liens, approuver | Remplacer l’écran de validation par une liste de contrôle sur papier |\n| 3. Les gens en veulent-ils\u00a0? | Les membres du conseil font-ils confiance aux brouillons, et s’en servent-ils\u00a0? | 3 testeurs sur 4 publient un résumé en moins de dix minutes, et chacun repère le résumé faux glissé dans le test | Corriger le pire problème, puis tester à nouveau |\n| 4. Pitch prêt | Pouvons-nous convaincre en quatre minutes\u00a0? | Deux répétitions chronométrées, dont une devant quelqu’un d’extérieur à l’équipe\u00a0; des captures d’écran de secours pour la démo | Couper des diapositives, pas des preuves |\n\n(Un plan inventé\u00a0: les chiffres sont des seuils, pas des résultats.)\n\nCinq règles\u00a0:\n\n- **Une tranche fine (ou *tranche verticale*) avant la finition\u00a0:** un chemin grossier de l’entrée à la sortie vaut mieux que trois beaux écrans qui ne sont pas reliés.\n- **Une liste «\u00a0pas maintenant\u00a0»\u00a0:** les fonctionnalités que tu ne construiras pas tout de suite (comptes utilisateurs, application mobile, publication automatique). Elle protège ton temps et montre au jury que tu sais choisir.\n- **L’IA responsable dès l’étape\u00a01\u00a0:** la vérification des commentaires qui nomment une personne y figure, elle n’est pas ajoutée la veille du pitch\u00a0; les points de validation, comme dans *Conçois un agent avec un humain dans la boucle*, font partie de la tranche fine\u00a0; le résumé faux glissé à l’étape\u00a03 teste le biais d’automatisation.\n- **Limite le temps\u00a0:** donne à chaque étape une séance ou une date\u00a0; quand le temps manque, coupe des fonctionnalités, jamais les tests.\n- **Prévois les preuves\u00a0:** chaque affirmation de ton pitch a besoin d’une étape qui en produit la preuve.',
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
                heading: 'The pitch: seven parts, one argument',
                body: 'A pitch is a short argument for your startup: this problem is real, these people have it, this solution helps, here is the proof, here is what could go wrong, and here is what we need. Aim for about four minutes, then questions.\n\n| Part | Time | What it must show | Common mistake |\n|---|---|---|---|\n| 1. Problem | 30 s | One real story from your research, how often it happens and what it costs | Opening with the technology |\n| 2. Users | 20 s | Exactly who, your early adopters, and who pays | *Everyone* |\n| 3. Solution | 30 s | Your value proposition in one sentence; what the AI does and does **not** do; why it beats the best option without AI | A list of features |\n| 4. Demo | 60 s | One realistic task from start to finish, including what happens when the AI is wrong | A perfect run on a hand-picked example |\n| 5. Evidence | 40 s | What interviews and tests showed, against thresholds set in advance, with sample sizes | Vanity metrics; *80%* from five testers |\n| 6. Risks | 30 s | Your top risks for users, for the people affected and for the startup, each with what you do about it | *No risks*, or risks with no plan |\n| 7. The ask | 20 s | What you need next and what you will do with it: testers, a pilot, a mentor, access to a tool | *Support us* |\n\nPitches to investors usually add the market, the competition, the business model and the team. The first three are on your canvas (customer segments, existing alternatives, revenue streams and cost structure); be ready for questions about all four, including why your team is the right one to build it.\n\n**Every claim is evidence or a labelled assumption.** *Council members spend an evening sorting suggestions* needs your interviews behind it; *schools will pay* becomes *we think so, and here is how we will test it*. Say *4 of 5 testers*, not *80%*, and never present a number you did not observe.\n\n**Be honest about the demo.** If a teammate wrote the answers by following a rules card, say so (*in this test, a person played the model*), then show what you measured about whether a model can do the job. Passing off a simulated AI as a working one is the AI washing of the story above.\n\n**Credit and protect.** Name the AI tools that helped you, and put no names, faces or real data of your testers on your slides.',
              },
              fr: {
                heading: 'Le pitch\u00a0: sept parties, un seul argument',
                body: 'Un pitch est un court argumentaire pour ta startup\u00a0: ce problème est réel, ces personnes le rencontrent, cette solution les aide, voici la preuve, voici ce qui pourrait mal tourner, et voici ce dont nous avons besoin. Vise environ quatre minutes, suivies des questions.\n\n| Partie | Durée | Ce qu’elle doit montrer | Erreur fréquente |\n|---|---|---|---|\n| 1. Problème | 30\u00a0s | Une histoire réelle tirée de ta recherche, la fréquence du problème et ce qu’il coûte | Commencer par la technologie |\n| 2. Utilisateurs | 20\u00a0s | Qui exactement, tes premiers adoptants, et qui paie | *Tout le monde* |\n| 3. Solution | 30\u00a0s | Ta proposition de valeur en une phrase\u00a0; ce que fait l’IA et ce qu’elle ne fait **pas**\u00a0; pourquoi c’est mieux que la meilleure option sans IA | Une liste de fonctionnalités |\n| 4. Démo | 60\u00a0s | Une tâche réaliste du début à la fin, y compris ce qui se passe quand l’IA se trompe | Un passage parfait sur un exemple choisi exprès pour que tout marche |\n| 5. Preuves | 40\u00a0s | Ce qu’ont montré les entretiens et les tests, comparé aux seuils fixés à l’avance, avec la taille des échantillons | Des indicateurs de vanité\u00a0; *80\u00a0%* sur cinq testeurs |\n| 6. Risques | 30\u00a0s | Tes principaux risques pour les utilisateurs, pour les personnes concernées et pour la startup, chacun avec ce que tu fais pour le réduire | *Aucun risque*, ou des risques sans plan |\n| 7. La demande (*the ask*) | 20\u00a0s | Ce dont tu as besoin ensuite et ce que tu en feras\u00a0: des testeurs, un pilote, un mentor, l’accès à un outil | *Soutenez-nous* |\n\nLes pitchs destinés aux investisseurs ajoutent en général le marché, la concurrence, le modèle économique et l’équipe. Les trois premiers figurent sur ton canvas (segments de clientèle, alternatives existantes, sources de revenus et structure de coûts)\u00a0; prépare-toi à des questions sur les quatre, y compris sur les raisons pour lesquelles ton équipe est la mieux placée pour le construire.\n\n**Chaque affirmation est une preuve ou une hypothèse signalée.** *Les membres du conseil passent une soirée à trier les suggestions* doit s’appuyer sur tes entretiens\u00a0; *les établissements paieront* devient *nous le pensons, et voici comment nous allons le tester*. Dis *4 testeurs sur 5*, pas *80\u00a0%*, et ne présente jamais un chiffre que tu n’as pas observé.\n\n**Sois honnête sur la démo.** Si un coéquipier a écrit les réponses en suivant une carte de règles, dis-le (*dans ce test, une personne jouait le rôle du modèle*), puis montre ce que tu as mesuré pour savoir si un modèle peut faire le travail. Faire passer une IA simulée pour une IA qui fonctionne, c’est l’AI washing de l’histoire du début.\n\n**Cite et protège.** Nomme les outils d’IA qui t’ont aidé, et ne mets sur tes diapositives ni nom, ni visage, ni donnée réelle de tes testeurs.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: your startup on paper',
                body: 'Work on paper or in a document, for about twenty minutes.\n\n1. **Your idea:** start from the one-pager and the Wizard-of-Oz test of *From problem to product*; if your evidence made you pivot, start from the new direction. Work alone or in a team of up to three, as your teacher decides.\n2. **Your canvas:** fill in the nine boxes in the suggested order, a few words per box, with no names. Mark each note E (evidence: which?) or A (assumption).\n3. **Your riskiest assumption:** circle the one still to be tested. It becomes your first milestone.\n4. **Your roadmap:** three to five milestones, each with its question, its done when and its if not, then a not-now list of at least three features.\n5. **Your pitch outline:** one line for each of the seven parts and, next to each claim, its evidence or *to test*.\n6. **Your risks:** the three risks for your risks slide, each with its mitigation. If you wrote a risk register for this idea in *Risk, regulation and trust*, take its three highest scores. If not, score your top risks now as you did there: cause → event → harm, likelihood × severity from 1 to 3.\n\nKeep everything: the final project starts from it, and you will hand in an updated version.',
              },
              fr: {
                heading: 'À toi\u00a0: ta startup sur papier',
                body: 'Travaille sur papier ou dans un document, pendant une vingtaine de minutes.\n\n1. **Ton idée\u00a0:** pars de la fiche problème et du test Magicien d’Oz de *Du problème au produit*\u00a0; si tes preuves t’ont fait pivoter, pars de la nouvelle direction. Travaille seul ou en équipe de trois au plus, selon ce que décide ton enseignant.\n2. **Ton canvas\u00a0:** remplis les neuf cases dans l’ordre conseillé, quelques mots par case, sans aucun nom. Marque chaque note V (vérifié\u00a0: par quelle preuve\u00a0?) ou H (hypothèse).\n3. **Ton hypothèse la plus risquée\u00a0:** entoure celle qui reste à tester. Elle devient ta première étape.\n4. **Ta feuille de route\u00a0:** trois à cinq étapes, chacune avec sa question, son «\u00a0terminé quand\u00a0» et son «\u00a0sinon\u00a0», puis une liste «\u00a0pas maintenant\u00a0» d’au moins trois fonctionnalités.\n5. **Le plan de ton pitch\u00a0:** une ligne pour chacune des sept parties et, à côté de chaque affirmation, sa preuve ou la mention *à tester*.\n6. **Tes risques\u00a0:** les trois risques de ta diapositive des risques, chacun avec sa mesure d’atténuation. Si tu as rédigé un registre des risques pour cette idée dans *Risques, réglementation et confiance*, reprends ses trois notes les plus élevées. Sinon, note tes principaux risques maintenant comme tu l’as fait alors\u00a0: cause → événement → préjudice, probabilité × gravité de 1 à 3.\n\nGarde tout\u00a0: le projet final part de là, et tu en rendras une version mise à jour.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Paste your canvas, your roadmap and your pitch outline, with no names or personal details of the people you interviewed or tested with, and ask the AI tutor to check them against this lesson. It should point out gaps and weak spots, not fill them in: if it states a fact about your users, only your research can confirm it. Write down the two most useful remarks and what you will change.',
                starterPrompt:
                  'Check my startup plan against these rules, without rewriting it. 1) Lean canvas: are all nine boxes filled in, and is each note marked E (evidence) or A (assumption)? 2) Is my riskiest assumption clear, and is it the first milestone of my roadmap? 3) Does each milestone have a done-when threshold and an if-not? 4) Does my pitch outline cover the problem, users, solution, demo, evidence, risks and the ask, and does it say what the AI does and does not do? 5) Which claim looks like evidence but is really an assumption? Here is my plan: [paste it]',
              },
              fr: {
                instructions:
                  'Colle ton canvas, ta feuille de route et le plan de ton pitch, sans nom ni information personnelle sur les personnes que tu as interrogées ou qui ont testé ton prototype, et demande au tuteur IA de les vérifier par rapport à cette leçon. Il doit te signaler les manques et les points faibles, pas les combler à ta place\u00a0: s’il avance un fait sur tes utilisateurs, seule ta recherche peut le confirmer. Note les deux remarques les plus utiles et ce que tu vas changer.',
                starterPrompt:
                  'Vérifie mon plan de startup selon ces règles, sans le réécrire. 1) Lean canvas\u00a0: les neuf cases sont-elles remplies, et chaque note est-elle marquée V (vérifié par une preuve) ou H (hypothèse)\u00a0? 2) Mon hypothèse la plus risquée est-elle claire, et est-ce la première étape de ma feuille de route\u00a0? 3) Chaque étape a-t-elle un seuil «\u00a0terminé quand\u00a0» et un «\u00a0sinon\u00a0»\u00a0? 4) Le plan de mon pitch couvre-t-il le problème, les utilisateurs, la solution, la démo, les preuves, les risques et la demande, et dit-il ce que fait l’IA et ce qu’elle ne fait pas\u00a0? 5) Quelle affirmation ressemble à une preuve mais n’est en réalité qu’une hypothèse\u00a0? Voici mon plan\u00a0: [colle-le]',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm5-l1-b7',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding before you build: the lean canvas, the roadmap and the pitch, and the ideas from earlier modules that they rely on.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu as compris avant de construire\u00a0: le lean canvas, la feuille de route et le pitch, ainsi que les notions des modules précédents sur lesquelles ils s’appuient.',
              },
            },
            data: { quizId: 'quiz-m5' },
          },
          {
            id: 'm5-l1-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Which box of your canvas rests on the weakest evidence? What is the cheapest test you could run before your pitch to turn that assumption into evidence, and what will you do if the result goes against you?',
              },
              fr: {
                prompt:
                  'Quelle case de ton canvas repose sur les preuves les plus fragiles\u00a0? Quel est le test le moins coûteux que tu pourrais faire avant ton pitch pour transformer cette hypothèse en preuve, et que feras-tu si le résultat te donne tort\u00a0?',
              },
            },
            data: { minLength: 120 },
          },
        ],
      },
      {
        id: 'm5-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Build a prototype and pitch',
              summary:
                'Your final project: build a prototype of the riskiest part of your startup, test it with real users and an evaluation set, write a responsible-AI plan, and pitch it with evidence, risks and an ask.',
            },
            fr: {
              title: 'Construis un prototype et présente ton pitch',
              summary:
                'Ton projet final\u00a0: construis un prototype de la partie la plus risquée de ta startup, teste-le avec de vrais utilisateurs et un jeu d’évaluation, rédige un plan d’IA responsable, et présente ton pitch avec tes preuves, tes risques et ta demande.',
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
                heading: 'Your final project: from plan to pitch',
                body: "On demo day, each team has a few minutes in front of people who will ask *how do you know?* What convinces careful judges is not the number of features. It is a problem that real people have, a prototype that does one job on a realistic task, numbers the team can explain, and a clear answer to *what happens when the AI is wrong?*\n\nThis lesson is your final project, the one your certificate depends on. Starting from the plan you made in *Plan your AI startup*, you will:\n\n1. **Build** a prototype of the riskiest part of your idea.\n2. **Test** it with people from your target group and with an evaluation set written in advance, then improve it once.\n3. **Write** a one-page responsible-AI plan.\n4. **Pitch** your startup in about four minutes, with a demo, your evidence, your risks and your ask.\n\nWork alone or in a team of up to three, as your teacher decides; in a team, each member hands in the team's work with a line saying who did what. Plan for several sessions, about four to six hours in all, plus the pitch: the 90 minutes of this lesson are only the start. The detailed requirements and the assessment criteria are in the project below.",
              },
              fr: {
                heading: 'Ton projet final\u00a0: du plan au pitch',
                body: 'Le jour de la présentation, chaque équipe dispose de quelques minutes face à des gens qui demanderont *comment le savez-vous\u00a0?* Ce qui convainc un jury attentif, ce n’est pas le nombre de fonctionnalités. C’est un problème que de vraies personnes rencontrent, un prototype qui fait bien une seule chose, sur une tâche réaliste, des chiffres que l’équipe sait expliquer, et une réponse claire à la question *que se passe-t-il quand l’IA se trompe\u00a0?*\n\nCette leçon est ton projet final, celui dont dépend ton certificat. À partir du plan préparé dans *Planifie ta startup d’IA*, tu vas\u00a0:\n\n1. **Construire** un prototype de la partie la plus risquée de ton idée.\n2. **Le tester** avec des personnes de ton groupe cible et avec un jeu d’évaluation écrit à l’avance, puis l’améliorer une fois.\n3. **Rédiger** un plan d’IA responsable d’une page.\n4. **Présenter** ta startup en environ quatre minutes, avec une démo, tes preuves, tes risques et ta demande.\n\nTravaille seul ou en équipe de trois au plus, selon ce que décide ton enseignant\u00a0; en équipe, chaque membre rend le travail de l’équipe avec une ligne qui précise qui a fait quoi. Prévois plusieurs séances, environ quatre à six heures au total, plus le pitch\u00a0: les 90\u00a0minutes de cette leçon n’en sont que le début. Les consignes détaillées et les critères d’évaluation se trouvent dans le projet ci-dessous.',
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
                heading: 'Build the prototype: choose your route',
                body: "Your prototype should answer the two questions of an AI product from *Prototype and measure*: do users value the output, and can a model produce it reliably? Choose the route that your tools allow. The strongest projects often combine two, such as a Wizard-of-Oz test for value and a prompt prototype for feasibility.\n\n| Route | The question it answers | What you hand in | Watch out |\n|---|---|---|---|\n| Wizard of Oz or concierge | Do users value the output? | The rules card, the screens, the test notes | A person is smarter than your model, so results flatter it; tell testers that a person plays the AI |\n| Prompt prototype | Can a model do the job reliably? | The system prompt, the settings, the evaluation set and its scores | An approved tool and invented or public inputs only; outputs vary, so run key cases twice |\n| Grounded helper | Does it answer from your sources, with citations, and say *I don't know* when it should? | The sources (invented or public), the evaluation set with its abstentions | Only documents you are allowed to use, with no personal data |\n| Trained classifier, no code | Can a model sort your messy inputs? | The labels, the number of examples per label, the results on new examples | Invented examples of text or objects, never people |\n| Agent or workflow | Can the steps run safely? | The design sheet, the approval points, a run traced step by step | Nothing sent, deleted or paid for without a person's approval |\n| Small app with code | Does it hold together from end to end? | The code, with the key replaced by YOUR-KEY | Only a key that your teacher provides |\n\nFor the no-code classifier (a model that learns from your labelled examples to sort new inputs into the same labels), Machine Learning for Kids works without an account: choose **Try it now**, create a text or images project, add at least five examples per label, train the model, then test it with new examples on its **Learn & Test** page. A Try it now project is deleted after at least four hours and you can keep only one at a time, so keep your examples in your own file, and train and test in the same sitting. Your teacher may also approve another no-code tool, such as Teachable Machine. With any tool, type or draw your examples, or photograph objects; use a webcam or microphone only with your teacher's permission, and put no personal details on the site.\n\n**The rules of the build:**\n\n- **A thin slice first**, from input to output, before you polish anything.\n- **Write in advance** your evaluation set (at least 15 cases: normal, edge and harmless adversarial) and the threshold of your user test.\n- **Test with at least three people** from your target group, with their consent, codes instead of names, and invented data in the prototype. Find them among classmates, family or clubs, with your teacher's agreement, never strangers online, as in *Find a problem worth solving*.\n- **Iterate at least once:** change one thing at a time, rerun the same cases, and note the result before and after.\n- **Label what is simulated** everywhere: in your notes, in the demo, in the pitch.\n\nA build log fits in a few lines. Here is FeedbackLens's (invented): *v1: 11 of 15 test comments grouped as expected; a comment about both the canteen and the timetable was put in one group only; a comment that named a teacher was summarised. v2: one rule added to the prompt (flag comments that name a person, and never summarise them): still 11 of 15, and the named comment flagged. v3: a comment may now belong to two groups: 13 of 15, and the named comment still flagged.* The threshold of milestone 1 is met, so the team moves on to the thin slice.",
              },
              fr: {
                heading: 'Construis le prototype\u00a0: choisis ta voie',
                body: 'Ton prototype doit répondre aux deux questions d’un produit d’IA vues dans *Prototyper et mesurer*\u00a0: les utilisateurs accordent-ils de la valeur au résultat, et un modèle peut-il le produire de façon fiable\u00a0? Choisis la voie que permettent tes outils. Les projets les plus solides en combinent souvent deux, par exemple un test Magicien d’Oz pour la valeur et un prototype de prompt pour la faisabilité.\n\n| Voie | La question à laquelle elle répond | Ce que tu rends | Attention |\n|---|---|---|---|\n| Magicien d’Oz ou conciergerie | Les utilisateurs accordent-ils de la valeur au résultat\u00a0? | La carte de règles, les écrans, les notes de test | Une personne est plus intelligente que ton modèle, donc les résultats le flattent\u00a0; dis à tes testeurs qu’une personne joue l’IA |\n| Prototype de prompt | Un modèle fait-il le travail de façon fiable\u00a0? | Le prompt système, les réglages, le jeu d’évaluation et ses scores | Uniquement un outil approuvé et des entrées inventées ou publiques\u00a0; les sorties varient, alors lance deux fois les cas importants |\n| Assistant ancré dans des sources | Répond-il à partir de tes sources, avec des citations, et dit-il *je ne sais pas* quand il le faut\u00a0? | Les sources (inventées ou publiques), le jeu d’évaluation avec ses abstentions | Seulement des documents que tu as le droit d’utiliser, sans données personnelles |\n| Classifieur entraîné, sans code | Un modèle sait-il trier tes entrées désordonnées\u00a0? | Les étiquettes, le nombre d’exemples par étiquette, les résultats sur de nouveaux exemples | Des exemples inventés de textes ou d’objets, jamais de personnes |\n| Agent ou flux automatisé | Les étapes s’enchaînent-elles sans danger\u00a0? | La fiche de conception, les points de validation, un déroulé suivi pas à pas | Rien n’est envoyé, supprimé ou payé sans l’accord d’une personne |\n| Petite application codée | L’ensemble tient-il de bout en bout\u00a0? | Le code, avec la clé remplacée par YOUR-KEY | Uniquement une clé fournie par ton enseignant |\n\nPour le classifieur sans code (un modèle qui apprend de tes exemples étiquetés à ranger de nouvelles entrées sous les mêmes étiquettes), Machine Learning for Kids fonctionne sans compte\u00a0: choisis **Essayer maintenant** (*Try it now*), crée un projet de textes ou d’images, ajoute au moins cinq exemples par étiquette, entraîne le modèle, puis teste-le avec de nouveaux exemples sur la page **Apprendre & Tester**. Un projet créé avec «\u00a0Essayer maintenant\u00a0» est effacé au bout d’au moins quatre heures, et tu ne peux en garder qu’un à la fois\u00a0: conserve tes exemples dans ton propre fichier, et entraîne et teste pendant la même séance. Ton enseignant peut aussi approuver un autre outil sans code, comme Teachable Machine. Quel que soit l’outil, tape ou dessine tes exemples, ou photographie des objets\u00a0; n’utilise la webcam ou le micro qu’avec la permission de ton enseignant, et ne donne aucune information personnelle sur le site.\n\n**Les règles de la construction\u00a0:**\n\n- **Une tranche fine d’abord**, de l’entrée à la sortie, avant de peaufiner quoi que ce soit.\n- **Écris à l’avance** ton jeu d’évaluation (au moins 15\u00a0cas\u00a0: normaux, limites et malveillants mais inoffensifs) et le seuil de ton test utilisateur.\n- **Teste avec au moins trois personnes** de ton groupe cible, avec leur accord, des codes à la place des noms et des données inventées dans le prototype. Trouve-les parmi tes camarades, ta famille ou tes clubs, avec l’accord de ton enseignant, jamais des inconnus en ligne, comme dans *Trouver un problème qui mérite d’être résolu*.\n- **Itère au moins une fois\u00a0:** change une seule chose à la fois, relance les mêmes cas, et note le résultat avant et après.\n- **Signale partout ce qui est simulé**\u00a0: dans tes notes, dans la démo, dans le pitch.\n\nUn journal de construction tient en quelques lignes. Voici celui de FeedbackLens (inventé)\u00a0: *v1\u00a0: 11 commentaires de test sur 15 bien regroupés\u00a0; un commentaire qui parlait à la fois de la cantine et des horaires a été classé dans un seul groupe\u00a0; un commentaire qui nommait un enseignant a été résumé. v2\u00a0: une règle ajoutée au prompt (signaler les commentaires qui nomment une personne, et ne jamais les résumer)\u00a0: toujours 11 sur 15, et le commentaire nominatif est signalé. v3\u00a0: un commentaire peut désormais appartenir à deux groupes\u00a0: 13 sur 15, et le commentaire nominatif est toujours signalé.* Le seuil de l’étape\u00a01 est atteint\u00a0: l’équipe passe à la tranche fine.',
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
                heading: 'The responsible-AI plan',
                body: "Judges, users and, one day, regulators will ask what your product does to people. Answer them on one page, before the pitch, in nine parts:\n\n1. **Purpose and limits:** what it is for, and the uses it is not meant for.\n2. **People affected:** users, customers, and the people who are neither but are touched by it (for FeedbackLens, the students whose suggestions are summarised).\n3. **Top risks:** the three highest scores of your risk register, as in *Risk, regulation and trust*: cause → event → harm, likelihood × severity, a mitigation (the strongest one that works), who is responsible, a counter-metric that would show it happening, and the residual risk.\n4. **Human oversight:** which decisions a person makes, and what the AI is never allowed to do alone (as in *Design an agent with a human in the loop*).\n5. **Data and privacy:** what data you collect (the minimum), what it is used for, where it goes (the model's provider sees what you send it), how long you keep it and who can see it.\n6. **Transparency and credit:** users know they are dealing with AI; its output is shown as a draft; what your prototype simulates is said plainly; the AI tools that helped you build it are credited.\n7. **Fairness and accessibility:** you test with different kinds of users and inputs (short and long texts, different languages and writing styles), report results by group where it matters, and check that people can use it with a keyboard or a screen reader.\n8. **Security and failure plan:** keys kept off the app, requests capped; what users see and can do when the AI is wrong or unavailable, how they report a problem, and how you would switch the AI part off.\n9. **Rules that may apply:** with the map of *Risk, regulation and trust*, the level of the EU AI Act your product would sit at and why (and which feature would move it up), the personal data it processes under the GDPR or similar laws where your users live, and whether a data protection impact assessment would be needed. Write *might apply*, with your reason: the plan does not claim that the product complies; before a real launch, only expert advice could establish that.\n\n| Cause → event → harm (FeedbackLens, invented) | L | S | L × S | Mitigation | Owner | Counter-metric | Residual |\n|---|---|---|---|---|---|---|---|\n| A student names or attacks a person in a comment → it appears in a published summary → that person is hurt and trust in the council is lost | 2 | 3 | 6 | Such comments are flagged, never summarised, and passed to a teacher; the form asks students not to name anyone | The council member who approves | Such comments missed in a spot check | Low |\n| The model merges two different requests → a summary misrepresents what students wrote → the council acts on a view nobody holds | 2 | 2 | 4 | Each sentence links to its comments; a council member approves every summary | The council member who approves | Summaries corrected after publication | Low |\n| Comments go to the model's provider → a comment that gives away its author is stored outside the school → a student loses the anonymity that was promised | 2 | 2 | 4 | No names collected; only a tool the school approves, whose terms limit how long inputs are kept and exclude training on them; comments deleted from our own files at the end of term | The team's developer | Personal details found in a spot check | Medium: the provider still sees what we send |\n\nA plan that fits on one page, and that a judge can check line by line, is worth more than a long list of principles.",
              },
              fr: {
                heading: 'Le plan d’IA responsable',
                body: 'Le jury, les utilisateurs et, un jour, les autorités demanderont quels effets ton produit a sur les gens. Réponds-leur sur une page, avant le pitch, en neuf parties\u00a0:\n\n1. **Objectif et limites\u00a0:** à quoi il sert, et les usages auxquels il n’est pas destiné.\n2. **Personnes concernées\u00a0:** les utilisateurs, les clients, et celles et ceux qui ne sont ni l’un ni l’autre mais que le produit touche (pour FeedbackLens, les élèves dont les suggestions sont résumées).\n3. **Principaux risques\u00a0:** les trois notes les plus élevées de ton registre des risques, comme dans *Risques, réglementation et confiance*\u00a0: cause → événement → préjudice, probabilité × gravité, une mesure d’atténuation (la plus forte qui fonctionne), la personne responsable, un indicateur garde-fou qui montrerait que le risque se produit, et le risque résiduel.\n4. **Contrôle humain\u00a0:** quelles décisions prend une personne, et ce que l’IA n’a jamais le droit de faire seule (comme dans *Conçois un agent avec un humain dans la boucle*).\n5. **Données et vie privée\u00a0:** quelles données tu collectes (le minimum), à quoi elles servent, où elles vont (le fournisseur du modèle voit ce que tu lui envoies), combien de temps tu les gardes et qui peut les voir.\n6. **Transparence et crédits\u00a0:** les utilisateurs savent qu’ils ont affaire à une IA\u00a0; ce qu’elle produit est présenté comme un brouillon\u00a0; ce que ton prototype simule est dit clairement\u00a0; les outils d’IA qui t’ont aidé à le construire sont cités.\n7. **Équité et accessibilité\u00a0:** tu testes avec différents types d’utilisateurs et d’entrées (textes courts et longs, langues et styles d’écriture variés), tu donnes les résultats par groupe quand c’est important, et tu vérifies qu’on peut l’utiliser au clavier ou avec un lecteur d’écran.\n8. **Sécurité et plan en cas d’échec\u00a0:** les clés gardées hors de l’application, les requêtes plafonnées\u00a0; ce que voient et peuvent faire les utilisateurs quand l’IA se trompe ou ne répond pas, comment ils signalent un problème, et comment tu désactiverais la partie IA.\n9. **Les règles qui peuvent s’appliquer\u00a0:** avec la carte de *Risques, réglementation et confiance*, le niveau du règlement européen sur l’IA où se situerait ton produit et pourquoi (et quelle fonction le ferait monter), les données personnelles qu’il traite au regard du RGPD ou des lois comparables des pays où vivent tes utilisateurs, et si une analyse d’impact relative à la protection des données serait nécessaire. Écris *pourrait s’appliquer*, avec ta raison\u00a0: le plan n’affirme pas que le produit est conforme\u00a0; avant un vrai lancement, seul un spécialiste pourrait l’établir.\n\n| Cause → événement → préjudice (FeedbackLens, inventé) | P | G | P × G | Mesure | Responsable | Indicateur garde-fou | Résiduel |\n|---|---|---|---|---|---|---|---|\n| Un élève nomme ou attaque une personne dans un commentaire → le commentaire apparaît dans un résumé publié → cette personne est blessée et la confiance dans le conseil se perd | 2 | 3 | 6 | Ces commentaires sont signalés, jamais résumés, et transmis à un enseignant\u00a0; le formulaire demande de ne nommer personne | Le membre du conseil qui approuve | Commentaires de ce type manqués lors d’une vérification par sondage | Faible |\n| Le modèle fusionne deux demandes différentes → un résumé déforme ce que les élèves ont écrit → le conseil agit d’après un avis que personne n’a exprimé | 2 | 2 | 4 | Chaque phrase renvoie à ses commentaires\u00a0; un membre du conseil approuve chaque résumé | Le membre du conseil qui approuve | Résumés corrigés après publication | Faible |\n| Les commentaires partent chez le fournisseur du modèle → un commentaire qui trahit son auteur est stocké hors de l’établissement → un élève perd l’anonymat promis | 2 | 2 | 4 | Aucun nom collecté\u00a0; uniquement un outil approuvé par l’établissement, dont les conditions limitent la durée de conservation des entrées et excluent leur utilisation pour entraîner des modèles\u00a0; commentaires supprimés de nos propres fichiers en fin de trimestre | Le développeur de l’équipe | Informations personnelles trouvées lors d’une vérification par sondage | Moyen\u00a0: le fournisseur voit toujours ce que nous envoyons |\n\nUn plan qui tient sur une page, et qu’un jury peut vérifier ligne par ligne, vaut mieux qu’une longue liste de principes.',
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
                heading: 'Pitch day: rehearse, demo, answer',
                body: '**Write, then cut.** Write your script part by part, following the seven parts of *Plan your AI startup*, read it aloud with a timer, and cut until it fits in four minutes. Rehearse at least twice, once in front of someone outside your team.\n\n**Slides that help.** One idea per slide, few words, large text. Every number shows its sample (*4 of 5 testers*). Simulated parts are labelled. No names, faces or real data of your testers, and a credit for every image and every kind of AI help.\n\n**A demo that cannot fail badly.** Rehearse the exact task. Keep a backup (screenshots or a short screen recording) in case the network or the tool lets you down. Show one case where the AI gets it wrong and what the user does then: it makes your evidence believable.\n\n**Questions are part of the pitch.** Prepare for the hardest ones:\n\n- Why AI? What is the best solution without it?\n- How do you know that people want it?\n- What happens when it is wrong, and who notices?\n- What data do you collect, and where does it go?\n- Who pays, and how much does each user cost you?\n- What would make you stop?\n\nWhen you do not know, say so and say how you would find out: *we have not tested that yet; our next milestone is...* Never invent a number to fill a silence.\n\n**When you are in the audience.** Ask for evidence, kindly: *what did your testers do when the summary was wrong?* Note one strength and one question for each team.\n\n**After the pitch.** Write down the questions you could not answer: they are the assumptions your startup should test next.',
              },
              fr: {
                heading: 'Le jour du pitch\u00a0: répète, montre, réponds',
                body: '**Écris, puis coupe.** Rédige ton texte partie par partie, en suivant les sept parties de *Planifie ta startup d’IA*, lis-le à voix haute avec un chronomètre, et coupe jusqu’à tenir en quatre minutes. Répète au moins deux fois, dont une devant quelqu’un d’extérieur à ton équipe.\n\n**Des diapositives qui aident.** Une idée par diapositive, peu de mots, un texte en gros caractères. Chaque chiffre indique son échantillon (*4 testeurs sur 5*). Les parties simulées sont signalées. Aucun nom, aucun visage ni aucune donnée réelle de tes testeurs, et la source de chaque image et de chaque aide de l’IA est citée.\n\n**Une démo qui ne peut pas échouer gravement.** Répète la tâche exacte. Garde une solution de secours (des captures d’écran ou un court enregistrement de l’écran) au cas où le réseau ou l’outil te lâcherait. Montre un cas où l’IA se trompe, et ce que fait alors l’utilisateur\u00a0: cela rend tes preuves crédibles.\n\n**Les questions font partie du pitch.** Prépare-toi aux plus difficiles\u00a0:\n\n- Pourquoi l’IA\u00a0? Quelle est la meilleure solution sans elle\u00a0?\n- Comment savez-vous que les gens en veulent\u00a0?\n- Que se passe-t-il quand elle se trompe, et qui s’en aperçoit\u00a0?\n- Quelles données collectez-vous, et où vont-elles\u00a0?\n- Qui paie, et combien vous coûte chaque utilisateur\u00a0?\n- Qu’est-ce qui vous ferait arrêter\u00a0?\n\nQuand tu ne sais pas, dis-le et explique comment tu le découvrirais\u00a0: *nous ne l’avons pas encore testé\u00a0; notre prochaine étape est…* N’invente jamais un chiffre pour combler un silence.\n\n**Quand tu es dans le public.** Demande des preuves, avec bienveillance\u00a0: *qu’ont fait vos testeurs quand le résumé était faux\u00a0?* Note un point fort et une question pour chaque équipe.\n\n**Après le pitch.** Note les questions auxquelles tu n’as pas su répondre\u00a0: ce sont les hypothèses que ta startup devrait tester ensuite.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l2-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Rehearse the question time with the AI tutor as a sceptical judge. Paste a short summary of your pitch (problem, users, solution, evidence, risks, ask), with no names or personal details. Answer each question as you would on stage, in two or three sentences. The tutor asks the questions; it does not write your pitch or your answers, and it does not know your users: only your evidence can speak for them. Write down the two questions you found hardest and add them to your preparation.',
                starterPrompt:
                  'Act as a sceptical judge at a demo day for student startups. Here is a summary of my pitch: [paste it]. Ask me one hard question at a time about my evidence, my use of AI, what happens when it is wrong, privacy, costs and who pays. Wait for my answer, tell me in one sentence whether it convinced you and why, then ask the next question. Do not rewrite my pitch or suggest answers.',
              },
              fr: {
                instructions:
                  'Répète le temps des questions avec le tuteur IA dans le rôle d’un membre du jury sceptique. Colle un court résumé de ton pitch (problème, utilisateurs, solution, preuves, risques, demande), sans nom ni information personnelle. Réponds à chaque question comme tu le ferais sur scène, en deux ou trois phrases. Le tuteur pose les questions\u00a0; il n’écrit ni ton pitch ni tes réponses, et il ne connaît pas tes utilisateurs\u00a0: seules tes preuves peuvent parler pour eux. Note les deux questions qui t’ont le plus mis en difficulté et ajoute-les à ta préparation.',
                starterPrompt:
                  'Joue le rôle d’un membre du jury sceptique lors d’une journée de présentation de startups lycéennes. Voici le résumé de mon pitch\u00a0: [colle-le]. Pose-moi des questions difficiles, une seule à la fois, sur mes preuves, mon usage de l’IA, ce qui se passe quand elle se trompe, la vie privée, les coûts et qui paie. Attends ma réponse, dis-moi en une phrase si elle t’a convaincu et pourquoi, puis pose la question suivante. Ne réécris pas mon pitch et ne me souffle pas de réponses.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm5-l2-b6',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Build, test and pitch your startup, then hand in your work. Your teacher has the final word on the review and may organise a demo day for the pitches.',
              },
              fr: {
                intro:
                  'Construis, teste et présente ta startup, puis envoie ton travail. C’est ton enseignant qui a le dernier mot sur l’évaluation, et il peut organiser une journée de présentation pour les pitchs.',
              },
            },
            data: { projectId: 'project-m5' },
          },
          {
            id: 'm5-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Compare your startup today with the plan you made at the start of this module. What did your users or your tests show that changed it? Which risk in your responsible-AI plan worries you most? Would you launch this product for real, and what would you need first? Explain why, or why not.',
              },
              fr: {
                prompt:
                  'Compare ta startup d’aujourd’hui avec le plan que tu as établi au début de ce module. Qu’est-ce que tes utilisateurs ou tes tests ont montré, et qu’est-ce que cela a changé dans ton plan\u00a0? Quel risque de ton plan d’IA responsable t’inquiète le plus\u00a0? Lancerais-tu ce produit pour de vrai, et de quoi aurais-tu besoin d’abord\u00a0? Explique pourquoi, ou pourquoi pas.',
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
            title: 'Check: plan your AI startup',
            instructions:
              'Seven questions on the lean canvas, the roadmap and the pitch. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: planifie ta startup d’IA',
            instructions:
              'Sept questions sur le lean canvas, la feuille de route et le pitch. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A team is marking the notes of its lean canvas as evidence (E) or assumption (A). Which note should be marked as an assumption?',
              },
              fr: {
                prompt:
                  'Une équipe marque les notes de son lean canvas comme vérifiées par une preuve (V) ou comme hypothèses (H). Quelle note doit être marquée comme une hypothèse\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: '4 of the 5 council members we interviewed sort suggestions by hand in a spreadsheet',
                  },
                  fr: {
                    text: '4 des 5 membres du conseil que nous avons interrogés trient les suggestions à la main dans un tableur',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Schools will pay a yearly fee for our product' },
                  fr: {
                    text: 'Les établissements paieront un abonnement annuel pour notre produit',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'In our Wizard-of-Oz test, 3 of 4 testers published a summary in under ten minutes',
                  },
                  fr: {
                    text: 'Dans notre test Magicien d’Oz, 3 testeurs sur 4 ont publié un résumé en moins de dix minutes',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Two other councils have agreed in writing to run a pilot' },
                  fr: { text: 'Deux autres conseils ont accepté par écrit de faire un pilote' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Nobody has paid, or even been asked to pay, so this is a belief to test, for example by asking the person who holds the budget. The other three notes report what the team observed in interviews, in a test or in writing.',
              },
              fr: {
                text: 'Personne n’a payé, ni même été sollicité pour payer\u00a0: c’est une croyance à tester, par exemple en interrogeant la personne qui tient le budget. Les trois autres notes rapportent ce que l’équipe a observé lors d’entretiens, d’un test ou par écrit.',
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
                  "A team's lean canvas lists ten features under Solution, but its Problem box says 'school is stressful' and its Customer segments box says 'students'. What should the team do next?",
              },
              fr: {
                prompt:
                  'Le lean canvas d’une équipe liste dix fonctionnalités dans la case Solution, mais sa case Problème dit «\u00a0le lycée, c’est stressant\u00a0» et sa case Segments de clientèle dit «\u00a0les élèves\u00a0». Que doit faire l’équipe maintenant\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Fill in the remaining boxes, such as revenue streams and key metrics, so that the whole canvas is complete before the team shows it to anyone',
                  },
                  fr: {
                    text: 'Remplir d’abord les autres cases, comme les sources de revenus et les indicateurs clés, pour que tout le canvas soit complet avant de le montrer à qui que ce soit',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Start building the ten features: the canvas is only a formality' },
                  fr: {
                    text: 'Commencer à construire les dix fonctionnalités\u00a0: le canvas n’est qu’une formalité',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Go back to the problem and the customers: name a specific group and its top problems, with evidence, then keep only the features that solve them',
                  },
                  fr: {
                    text: 'Revenir au problème et aux clients\u00a0: nommer un groupe précis et ses problèmes principaux, avec des preuves, puis ne garder que les fonctionnalités qui les résolvent',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: "Replace 'students' with 'everyone', to reach a bigger market" },
                  fr: {
                    text: 'Remplacer «\u00a0les élèves\u00a0» par «\u00a0tout le monde\u00a0», pour viser un marché plus grand',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The canvas is filled in from the problem and the customers first. When those boxes are vague, the solution has nothing solid to stand on: features should follow from the specific problems of specific users, backed by research.',
              },
              fr: {
                text: 'On remplit le canvas en commençant par le problème et les clients. Quand ces cases restent vagues, la solution ne repose sur rien de solide\u00a0: les fonctionnalités doivent découler des problèmes précis d’utilisateurs précis, appuyés par la recherche.',
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
                  "In a pitch, '80% of our testers preferred our app' is a better way to report that 4 of your 5 testers preferred it, because a percentage sounds more professional.",
              },
              fr: {
                prompt:
                  'Dans un pitch, «\u00a080\u00a0% de nos testeurs ont préféré notre application\u00a0» est une meilleure façon d’annoncer que 4 de tes 5 testeurs l’ont préférée, car un pourcentage fait plus professionnel.',
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
                text: 'False. With five testers, a percentage suggests a precision you do not have. Say 4 of 5 testers, and present it as a signal from a small test, not as a statistic.',
              },
              fr: {
                text: 'Faux. Avec cinq testeurs, un pourcentage laisse croire à une précision que tu n’as pas. Dis 4 testeurs sur 5, et présente-le comme le signal d’un petit test, pas comme une statistique.',
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
                  'Which of these belong in the risks part of a pitch for an AI product? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Lesquels de ces éléments ont leur place dans la partie «\u00a0risques\u00a0» du pitch d’un produit d’IA\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'The main ways the AI can be wrong, and what users see and can do when it is',
                  },
                  fr: {
                    text: 'Les principales façons dont l’IA peut se tromper, et ce que voient et peuvent faire les utilisateurs quand cela arrive',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'People who could be harmed even though they are not users' },
                  fr: {
                    text: 'Les personnes qui pourraient subir un préjudice sans être utilisatrices',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'A promise that the AI cannot make mistakes, because it uses a leading model',
                  },
                  fr: {
                    text: 'La promesse que l’IA ne peut pas se tromper, puisqu’elle utilise un modèle de pointe',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'The riskiest assumption, still untested, that could sink the startup, and how you will test it',
                  },
                  fr: {
                    text: 'L’hypothèse la plus risquée, pas encore testée, qui pourrait faire échouer la startup, et la façon dont tu vas la tester',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: "The privacy risk: personal data that could reach the model's provider or be exposed, and how you limit it",
                  },
                  fr: {
                    text: 'Le risque pour la vie privée\u00a0: les données personnelles qui pourraient partir chez le fournisseur du modèle ou être exposées, et comment tu le limites',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'All the options except the promise belong there, each with what you do about it. How the AI can be wrong and the privacy risk are risks for users; people harmed without being users are the people affected; the riskiest assumption, while untested, is a risk for the startup, since if it is false the product fails. No model is free of errors: promising otherwise is exactly the kind of claim a pitch must not make.',
              },
              fr: {
                text: 'Tous les éléments sauf la promesse y ont leur place, chacun avec ce que tu fais pour y répondre. Les façons dont l’IA peut se tromper et le risque pour la vie privée sont des risques pour les utilisateurs\u00a0; les personnes lésées sans être utilisatrices sont les personnes concernées\u00a0; l’hypothèse la plus risquée, tant qu’elle n’est pas testée, est un risque pour la startup, car si elle est fausse, le produit échoue. Aucun modèle n’est exempt d’erreurs\u00a0: promettre le contraire est justement le genre d’affirmation qu’un pitch ne doit pas faire.',
              },
            },
          },
          {
            id: 'q5',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which roadmap fits a four-week capstone best?' },
              fr: {
                prompt:
                  'Quelle feuille de route convient le mieux à un projet final de quatre semaines\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Twelve features, each with a delivery date and an owner, so that progress is easy to track week by week',
                  },
                  fr: {
                    text: 'Douze fonctionnalités, chacune avec une date de livraison et un responsable, pour suivre facilement l’avancement semaine après semaine',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Build the complete product in the first three weeks, then test it with users in the fourth',
                  },
                  fr: {
                    text: 'Construire le produit complet pendant les trois premières semaines, puis le tester avec des utilisateurs la quatrième',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'No roadmap: decide each day what feels most urgent' },
                  fr: {
                    text: 'Pas de feuille de route\u00a0: décider chaque jour de ce qui semble le plus urgent',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Milestones ordered by risk, each with a question, a done-when threshold and an if-not, plus a not-now list',
                  },
                  fr: {
                    text: 'Des étapes ordonnées selon les risques, chacune avec une question, un seuil «\u00a0terminé quand\u00a0» et un «\u00a0sinon\u00a0», plus une liste «\u00a0pas maintenant\u00a0»',
                  },
                },
              },
            ],
            correctOptionIndexes: [3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A startup roadmap orders what you need to learn, riskiest first. A threshold written in advance tells you when a milestone is done, the if-not says what you will change, and the not-now list protects your time. Testing only at the end leaves no time to act on what you learn.',
              },
              fr: {
                text: 'La feuille de route d’une startup ordonne ce que tu dois apprendre, en commençant par le plus risqué. Un seuil écrit à l’avance dit quand une étape est terminée, le «\u00a0sinon\u00a0» dit ce que tu changeras, et la liste «\u00a0pas maintenant\u00a0» protège ton temps. Tester seulement à la fin ne laisse plus le temps de tirer parti de ce que tu apprends.',
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
                  "In your user tests, a teammate wrote the AI's answers by following a rules card: a Wizard-of-Oz prototype. What should you say about it in your pitch?",
              },
              fr: {
                prompt:
                  'Pendant tes tests utilisateurs, un coéquipier a écrit les réponses de l’IA en suivant une carte de règles\u00a0: un prototype Magicien d’Oz. Que dois-tu en dire dans ton pitch\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'That a person played the model in this test, and what you measured about whether a real model can do the job',
                  },
                  fr: {
                    text: 'Qu’une personne jouait le rôle du modèle dans ce test, et ce que tu as mesuré pour savoir si un vrai modèle peut faire le travail',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Nothing: the judges only need to see the result' },
                  fr: { text: 'Rien\u00a0: le jury n’a besoin de voir que le résultat' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'That the AI is still in beta and will improve with more data, so that it sounds real without going into details',
                  },
                  fr: {
                    text: 'Que l’IA est encore en version bêta et s’améliorera avec plus de données, pour que cela paraisse réel sans entrer dans les détails',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Nothing, and skip the demo so that the question does not come up' },
                  fr: { text: 'Rien, et sauter la démo pour que la question ne se pose pas' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "A Wizard-of-Oz test is a respected way to test value, as long as you disclose it. Passing off a person's work as a working AI misleads the judges: it is the AI washing this lesson started with. Pair it with evidence of feasibility, such as an evaluation set run on a real model.",
              },
              fr: {
                text: 'Un test Magicien d’Oz est une façon reconnue de tester la valeur, à condition de le dire. Faire passer le travail d’une personne pour une IA qui fonctionne trompe le jury\u00a0: c’est l’AI washing du début de cette leçon. Associe-le à une preuve de faisabilité, comme un jeu d’évaluation lancé sur un vrai modèle.',
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
                  'On a lean canvas, which box holds the monthly cost of the requests your product sends to the model? (two words)',
              },
              fr: {
                prompt:
                  'Sur un lean canvas, dans quelle case place-t-on le coût mensuel des requêtes que ton produit envoie au modèle\u00a0? (trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'cost structure',
                'the cost structure',
                'cost structure box',
                'the cost structure box',
                'cost structures',
                'costs structure',
                'structure of costs',
                'costs',
                'the costs',
                'cost',
              ],
              fr: [
                'structure de coûts',
                'la structure de coûts',
                'structure des coûts',
                'la structure des coûts',
                'case structure de coûts',
                'la case structure de coûts',
                'la case structure des coûts',
                'structure de coût',
                'coûts',
                'coût',
              ],
            },
            explanation: {
              en: {
                text: 'The cost structure. Every model request costs money, and the total grows with the number of users and the length of what they send, so the cost of AI belongs there, next to hosting and the time people spend checking the output.',
              },
              fr: {
                text: 'La structure de coûts. Chaque requête au modèle coûte de l’argent, et le total augmente avec le nombre d’utilisateurs et la longueur de ce qu’ils envoient\u00a0: le coût de l’IA va donc là, à côté de l’hébergement et du temps que des personnes passent à vérifier les résultats.',
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
            title: 'Startup capstone: an AI product, prototyped, tested and pitched',
            brief:
              'Turn an idea into a startup: a one-page plan, a prototype of its riskiest part tested with real users, a responsible-AI plan and a pitch of about four minutes. Start from the problem you researched in "From problem to product", or from a new one that passes the same checks: specific users you can talk to, evidence that the problem is real, and an honest answer to whether AI is the right tool. Follow the two lessons of this module: plan with a lean canvas and a roadmap ordered by risk, build a thin slice, test value with at least three people from your target group and feasibility with an evaluation set written in advance, improve once, then pitch with your evidence, your risks and your ask. Find the people you interview and your testers among classmates, family or clubs, with the agreement of your teacher, never strangers online, as in "Find a problem worth solving". The AI does one clear job in your product, and people stay in charge of the decisions that matter. Work alone or in a team of up to three, as your teacher decides. Use only tools and accounts that your teacher approves, and never create your own account with an AI provider to get a key: some providers do not accept users under 18. If you use Machine Learning for Kids with Try it now, your project is deleted after at least four hours, so keep your examples in your own file, and train and test in the same sitting. Use a webcam or microphone only if your teacher allows it, and put no personal details on the site. Never write down a result you did not observe: "not tested yet" is an honest answer, and an invented number is not. Plan for several sessions, about four to six hours in all, plus the pitch, as your teacher decides.',
            requirements:
              'Hand in six things.\n\n1. Your plan: your lean canvas, with all nine boxes and each note marked E (evidence, with its source) or A (assumption), and your roadmap (milestones with a question, a done-when threshold and an if-not, and a not-now list). Hand in version 1 from the first lesson and version 2, updated after your tests, with what changed and why.\n2. Your evidence: a summary of at least three interviews or observations (codes such as P1, no names), and your user test: at least three testers from your target group (T1, T2...), the task written as a goal, the success metric, counter-metric and threshold you set before testing, the result for each tester, and an iteration log with at least one change and its result before and after.\n3. Your prototype: what it is and which route you took, what is real and what is simulated, and its prompt, rules card, sources, labels or design sheet. For the AI part, an evaluation set of at least 15 cases written before you ran them (normal, edge and harmless adversarial cases), each with the expected result, the actual result and pass or fail, and a summary against your done-when threshold. If you could not run any model, give the cases with their expected results and say that they are not tested yet. Code goes in your PDF or behind a link, with any key replaced by YOUR-KEY.\n4. Your responsible-AI plan: one page with the nine parts of the lesson, including your top three risks with their mitigations, owners, counter-metrics and residual risk, and the rules that might apply, with your reasons.\n5. Your pitch: your slides or your script (about four minutes) with the seven parts: problem, users, solution, demo, evidence, risks and the ask; a demo walkthrough of three example inputs with the outputs of your prototype, including one where it fails and what the user does then; and your answers to the three hardest questions you expect. A recording is welcome but not required.\n6. Credits: in a team, who did what; which AI tools helped you, with what, and how you checked their work; the sources of any data, images or code you did not make yourself.\n\nHow to send it (one submission has one type):\n- PDF, the simplest: your documents and your slides, in up to five PDF files.\n- Link: a shared document or folder that your teacher can open, holding everything.\n- Video: the recording of your pitch with your slides and demo; then give, in the "About your work" field, the link to a shared document that holds your written parts.\n- Image: photos of your paper pages and slides, up to five, with no names or faces; if all six parts do not fit legibly in five photos, scan your pages into PDF files and choose PDF.\n- Text: everything pasted in, with your slides described; the box takes up to 20,000 characters, so if your work is longer, use PDF or a link.\nFor a recording, prefer your screen and slides with your voice; appear on camera only if you and your teacher agree; in a team, a teammate appears or speaks only with their agreement and your teacher\'s; never film your testers, the audience or anyone else.\n\nRules: no personal data anywhere (no names, faces, voices or contact details of the people you interviewed or tested with; codes only); invented, public or anonymous data in the prototype, and text or objects as training examples, never people; testers take part voluntarily and are told what the prototype simulates; adversarial tests stay harmless; no key; every simulated part and every assumption labelled; never a number you did not observe; data, images, code and AI help credited.\n\nHow it is assessed: Technical quality (a prototype that does its one job on realistic tasks, an honest evaluation and user test, a coherent canvas and roadmap, a clear pitch on time); Understanding (you explain how your AI part works and fails, and why your plan is ordered as it is, with the ideas of the course: grounding and evaluation, agents and permissions, user research, metrics, risk and business models); Responsible use of AI (a complete responsible-AI plan, people in charge of the decisions that matter, privacy protected, simulated parts and AI help disclosed, evidence reported honestly); Creativity (a real problem, a useful and original solution, a clear value proposition and a convincing ask).',
          },
          fr: {
            title: 'Projet final de startup\u00a0: un produit d’IA prototypé, testé et présenté',
            brief:
              'Transforme une idée en startup\u00a0: un plan d’une page, un prototype de sa partie la plus risquée testé avec de vrais utilisateurs, un plan d’IA responsable et un pitch d’environ quatre minutes. Pars du problème que tu as étudié dans «\u00a0Du problème au produit\u00a0», ou d’un nouveau problème qui passe les mêmes vérifications\u00a0: des utilisateurs précis à qui tu peux parler, des preuves que le problème est réel, et une réponse honnête à la question de savoir si l’IA est le bon outil. Suis les deux leçons de ce module\u00a0: planifie avec un lean canvas et une feuille de route ordonnée par les risques, construis une tranche fine, teste la valeur avec au moins trois personnes de ton groupe cible et la faisabilité avec un jeu d’évaluation écrit à l’avance, améliore une fois, puis présente ton pitch avec tes preuves, tes risques et ta demande. Trouve les personnes à interroger et tes testeurs parmi tes camarades, ta famille ou tes clubs, avec l’accord de ton enseignant, jamais des inconnus en ligne, comme dans «\u00a0Trouver un problème qui mérite d’être résolu\u00a0». L’IA remplit une mission claire dans ton produit, et des personnes gardent la main sur les décisions importantes. Travaille seul ou en équipe de trois au plus, selon ce que décide ton enseignant. N’utilise que des outils et des comptes approuvés par ton enseignant, et ne crée jamais toi-même de compte chez un fournisseur d’IA pour obtenir une clé\u00a0: certains fournisseurs n’acceptent pas les utilisateurs de moins de 18\u00a0ans. Si tu utilises Machine Learning for Kids avec «\u00a0Essayer maintenant\u00a0» (Try it now), ton projet est effacé au bout d’au moins quatre heures\u00a0: garde tes exemples dans ton propre fichier, et entraîne et teste pendant la même séance. N’utilise la webcam ou le micro qu’avec la permission de ton enseignant, et ne donne aucune information personnelle sur le site. Ne note jamais un résultat que tu n’as pas observé\u00a0: «\u00a0pas encore testé\u00a0» est une réponse honnête, un nombre inventé ne l’est pas. Prévois plusieurs séances, environ quatre à six heures au total, plus le pitch, selon ce que décide ton enseignant.',
            requirements:
              'Rends six éléments.\n\n1. Ton plan\u00a0: ton lean canvas, avec ses neuf cases et chaque note marquée V (vérifié, avec sa preuve) ou H (hypothèse), et ta feuille de route (des étapes avec une question, un seuil «\u00a0terminé quand\u00a0» et un «\u00a0sinon\u00a0», plus une liste «\u00a0pas maintenant\u00a0»). Rends la version\u00a01 de la première leçon et la version\u00a02, mise à jour après tes tests, avec ce qui a changé et pourquoi.\n2. Tes preuves\u00a0: le résumé d’au moins trois entretiens ou observations (des codes comme P1, aucun nom), et ton test utilisateur\u00a0: au moins trois testeurs de ton groupe cible (T1, T2…), la tâche formulée comme un but, l’indicateur de réussite, l’indicateur garde-fou et le seuil fixés avant le test, le résultat de chaque testeur, et un journal d’itérations avec au moins un changement et son résultat avant et après.\n3. Ton prototype\u00a0: ce que c’est et la voie choisie, ce qui est réel et ce qui est simulé, et son prompt, sa carte de règles, ses sources, ses étiquettes ou sa fiche de conception. Pour la partie IA, un jeu d’évaluation d’au moins 15\u00a0cas écrits avant de les lancer (cas normaux, cas limites et cas malveillants mais inoffensifs), chacun avec le résultat attendu, le résultat obtenu et la mention réussi ou échoué, et un bilan comparé à ton seuil «\u00a0terminé quand\u00a0». Si tu n’as pu faire tourner aucun modèle, donne les cas avec leurs résultats attendus et indique qu’ils ne sont pas encore testés. Le code va dans ton PDF ou derrière un lien, avec toute clé remplacée par YOUR-KEY.\n4. Ton plan d’IA responsable\u00a0: une page avec les neuf parties de la leçon, dont tes trois principaux risques avec leurs mesures, leurs responsables, leurs indicateurs garde-fous et leur risque résiduel, et les règles qui pourraient s’appliquer, avec tes raisons.\n5. Ton pitch\u00a0: tes diapositives ou ton texte (environ quatre minutes) avec les sept parties\u00a0: problème, utilisateurs, solution, démo, preuves, risques et demande\u00a0; une démonstration écrite de trois exemples d’entrées avec les sorties de ton prototype, dont un où il échoue et ce que fait alors l’utilisateur\u00a0; et tes réponses aux trois questions les plus difficiles que tu attends. Un enregistrement est bienvenu, mais pas obligatoire.\n6. Les crédits\u00a0: en équipe, qui a fait quoi\u00a0; quels outils d’IA t’ont aidé, pour quoi, et comment tu as vérifié leur travail\u00a0; les sources de toute donnée, image ou code que tu n’as pas produits toi-même.\n\nPour l’envoyer (un envoi n’a qu’un seul type)\u00a0:\n- PDF, le plus simple\u00a0: tes documents et tes diapositives, en cinq fichiers PDF au plus.\n- Lien\u00a0: un document ou un dossier partagé que ton enseignant peut ouvrir, qui contient tout.\n- Vidéo\u00a0: l’enregistrement de ton pitch avec tes diapositives et ta démo\u00a0; donne alors, dans «\u00a0À propos de votre travail\u00a0», le lien vers un document partagé qui contient tes parties écrites.\n- Image\u00a0: des photos de tes pages papier et de tes diapositives, cinq au plus, sans nom ni visage\u00a0; si les six éléments ne tiennent pas lisiblement en cinq photos, scanne tes pages en PDF et choisis PDF.\n- Texte\u00a0: tout, collé dans le champ, avec tes diapositives décrites\u00a0; le champ accepte jusqu’à 20\u00a0000\u00a0caractères\u00a0: au-delà, utilise un PDF ou un lien.\nPour un enregistrement, préfère ton écran et tes diapositives avec ta voix\u00a0; n’apparais à l’image que si ton enseignant et toi êtes d’accord\u00a0; en équipe, un coéquipier n’apparaît ou ne parle qu’avec son accord et celui de ton enseignant\u00a0; ne filme jamais tes testeurs, le public ni personne d’autre.\n\nRègles\u00a0: aucune donnée personnelle nulle part (ni nom, ni visage, ni voix, ni coordonnées des personnes interrogées ou testées\u00a0; uniquement des codes)\u00a0; des données inventées, publiques ou anonymes dans le prototype, et des textes ou des objets comme exemples d’entraînement, jamais des personnes\u00a0; des testeurs volontaires, informés de ce que le prototype simule\u00a0; des cas malveillants qui restent inoffensifs\u00a0; aucune clé\u00a0; chaque partie simulée et chaque hypothèse signalée\u00a0; jamais un chiffre que tu n’as pas observé\u00a0; les sources des données, des images, du code et de l’aide de l’IA citées.\n\nCritères d’évaluation\u00a0: Qualité technique (un prototype qui remplit sa mission sur des tâches réalistes, une évaluation et un test utilisateur honnêtes, un canvas et une feuille de route cohérents, un pitch clair et dans les temps)\u00a0; Compréhension (tu expliques comment ta partie IA fonctionne et échoue, et pourquoi ton plan est ordonné ainsi, avec les notions du cours\u00a0: ancrage et évaluation, agents et permissions, recherche utilisateur, indicateurs, risques et modèles économiques)\u00a0; Usage responsable de l’IA (un plan d’IA responsable complet, des personnes aux commandes des décisions importantes, la vie privée protégée, les parties simulées et l’aide de l’IA signalées, des preuves présentées honnêtement)\u00a0; Créativité (un vrai problème, une solution utile et originale, une proposition de valeur claire et une demande convaincante).',
          },
        },
        allowedSubmissionTypes: ['text', 'link', 'pdf', 'video', 'image'],
        rubric: [
          { key: 'technicalQuality', weight: 30 },
          { key: 'understanding', weight: 25 },
          { key: 'responsibleAi', weight: 25 },
          { key: 'creativity', weight: 20 },
        ],
        xpReward: 500,
        requiredForCertificate: true,
      },
    },
  ],
};
