// Module m3 of "From Idea to AI Product" (ages 16-18): from problem to product. It comes after m1
// (advanced generative AI) and m2 (AI agents and automation), and before m4 (responsible AI,
// business and society) and m5 (the startup capstone, whose final project is required for the
// certificate). It refers back by name, without teaching them again, to "How large language
// models are built" (m1-l1: confidently wrong, variable answers, cost, prompts sent to a
// provider), "Grounding, retrieval and evaluation" (m1-l2: a grounded bot with citations, the
// evaluation set and its scores), "What an AI agent is" (m2-l1: a workflow fixed in code is often
// enough) and "Design an agent with a human in the loop" (m2-l2: automation bias). It points
// ahead to the next module for risks and regulation and to the capstone for the startup idea.
// Other modules are named, not numbered, in the text.
// m3-l1: an invented hook (a sports club's chatbot nobody used; the real problem was late
// cancellations, which a message from the coach solves without AI). User research: a specific
// target group, beyond one's friends; interviews, observation and traces; ask about the past, not
// the future (the three rules of Rob Fitzpatrick's book The Mom Test, paraphrased); weak and
// better questions; evidence against compliments and promises; research ethics for minors
// (consent, codes not names, nothing recorded without permission, classmates, family or clubs
// with the teacher's agreement, never strangers online); affinity mapping. Then jobs, pains and
// gains (Theodore Levitt's quarter-inch drill, "often quoted"; Clayton Christensen's jobs to be
// done; the Value Proposition Canvas of Alexander Osterwalder and colleagues), a problem-statement
// template with three examples to judge, and the value-proposition template of Geoffrey Moore's
// Crossing the Chasm, whose example (PartCheck, an invented shared parts list) contains no AI on
// purpose. "When not to use AI": five questions, where AI earns its place, hybrids, five tasks
// with a better tool, warning signs. The try stage is a one-pager on paper (eight parts, one
// interview in the lesson and two more before the next one), whose riskiest assumption m3-l2
// tests. Then a challenge_me tutor activity (the outline's) and a reflection.
// m3-l2: the hook is the IBM "listening typewriter" study (Gould, Conti and Hovanyecz,
// Communications of the ACM, 1983), described only in general terms: dictation to a simulated
// system, a hidden typist typing what participants said. The name Wizard of Oz is explained by
// the 1939 film. Then a table of prototypes (paper, clickable mock-up, Wizard of Oz, concierge,
// prompt prototype), the MVP and build-measure-learn in the sense of Eric Ries's The Lean Startup,
// the Zappos story as Ries tells it (Nick Swinmurn photographed shoes in local shops and bought
// the pair when an order came in), the two questions of an AI product (is the output valuable; can
// a model produce it reliably), and an honest wizard (a rules card that imitates the model;
// testers told before or right after). Metrics: model quality, task success, value; vanity metrics
// against actionable metrics (Ries's terms), counter-metrics, a threshold set in advance,
// Goodhart's law in Marilyn Strathern's usual wording. User tests: realistic tasks written as
// goals, thinking aloud, roles, staying quiet, Jakob Nielsen's argument for small rounds of about
// five testers (stated generally, no percentage), "4 of 5 is a signal, not a statistic", test
// ethics, what to watch when the AI is wrong, an iteration log, and persevere, pivot or stop.
// Every number in an example or a table (200 sign-ups, 1,500 messages, 3 of 5 members, 5,000
// downloads...) is invented and labelled as such where it could pass for data. The build stage is
// a Wizard-of-Oz test on paper in groups of three (alone: a family member at home), with the
// measurement plan written before building. Then the module quiz quiz-m3 (seven questions on both
// lessons) and a reflection. m3-l2 has no tutor activity: the outline asks for none, and its 45
// minutes go to the build activity and the quiz.
// No Machine Learning for Kids activity: the outline gives none, and no worksheet of the catalogue
// teaches user research or prototyping (a Try it now classifier could prototype the AI part of
// some ideas, but not of every learner's own, and it would take the time the user tests need).
// Hence no project block and no project; the course's project is the m5 capstone. No video
// either: no curated id fits product discovery or prototyping, and new ids cannot be verified,
// so the module has no watch stage. The instructions of ai_activity blocks, reflection prompts
// and quiz texts are plain text (the player renders no Markdown there), and rich_text bodies
// carry no Markdown headings. French typography uses \u00a0 escapes, as in the other course
// files.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m3: SeedModulePart = {
  module: {
    id: 'm3',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'From problem to product',
          description:
            'Find a problem worth solving through user research, decide honestly whether AI is the right tool, then prototype quickly, test with real users and measure what matters.',
        },
        fr: {
          title: 'Du problème au produit',
          description:
            'Trouve un problème qui mérite d’être résolu grâce à la recherche utilisateur, décide honnêtement si l’IA est le bon outil, puis prototype vite, teste avec de vrais utilisateurs et mesure ce qui compte.',
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
              title: 'Find a problem worth solving',
              summary:
                'Learn from the people you want to help: interviews that produce evidence, a problem statement with no solution hidden in it, a value proposition, and an honest test of whether AI is the right tool.',
            },
            fr: {
              title: 'Trouver un problème qui mérite d’être résolu',
              summary:
                'Apprends des personnes que tu veux aider\u00a0: des entretiens qui apportent des preuves, un énoncé du problème sans solution cachée dedans, une proposition de valeur, et un examen honnête pour savoir si l’IA est le bon outil.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'A chatbot nobody needed',
                body: "Picture three students who spend a month of evenings building an AI assistant for their sports club. Members can ask it, in their own words, when the next training session is. It copes with typos, answers in two languages, even makes jokes. In launch week, almost nobody uses it.\n\nWhen the team finally asks members why, the answers are humbling. The timetable was already pinned in the club's group chat. What members really complained about was sessions cancelled at the last minute, with the news reaching them after they had crossed town. A message from the coach as soon as a session is cancelled would have helped more than any chatbot, and it needs no AI.\n\nThe story is invented; the mistake is real and common: starting from a solution (*let's build something with AI*) instead of from a problem that people actually have. This lesson covers what comes before any prompt or model: learning from the people you want to help, stating their problem precisely, saying what value you would bring, and deciding honestly whether AI is the right tool.",
              },
              fr: {
                heading: 'Un chatbot dont personne n’avait besoin',
                body: 'Imagine trois élèves qui passent un mois de soirées à construire un assistant d’IA pour leur club de sport. Les membres peuvent lui demander, avec leurs propres mots, quand a lieu le prochain entraînement. Il comprend les fautes de frappe, répond en deux langues, fait même des blagues. La semaine du lancement, presque personne ne s’en sert.\n\nQuand l’équipe finit par demander pourquoi aux membres, les réponses sont une leçon d’humilité. Le planning était déjà épinglé dans le groupe de discussion du club. Ce dont les membres se plaignaient vraiment, c’étaient les séances annulées à la dernière minute, une nouvelle qui leur parvenait alors qu’ils avaient déjà traversé la ville. Un message de l’entraîneur dès qu’une séance est annulée aurait été plus utile que n’importe quel chatbot, et il ne demande aucune IA.\n\nCette histoire est inventée\u00a0; l’erreur, elle, est réelle et courante\u00a0: partir d’une solution (*construisons quelque chose avec l’IA*) au lieu d’un problème que des gens rencontrent vraiment. Cette leçon porte sur ce qui vient avant tout prompt et tout modèle\u00a0: apprendre des personnes que tu veux aider, énoncer leur problème avec précision, dire quelle valeur tu leur apporterais, et décider honnêtement si l’IA est le bon outil.',
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
                heading: 'Learn from people, not from your idea',
                body: "**Choose who you are helping:** a specific group you can reach (*students preparing for written exams in their final two years*, not *everyone*). Then look beyond your friends: interview only people like you, and you learn only about people like you. Include people who do the task differently, use apps less, or have needs you do not have.\n\n**Three ways to learn:** **interviews**, one-to-one, for 10 to 20 minutes; **observation**, watching someone plan their revision or run a club's sign-ups (people often do something different from what they say they do); and **traces**: the workarounds people have built, such as a shared spreadsheet or phone reminders, and their reviews of products they already use.\n\n**Ask about the past, not the future.** People are kind, and an opinion about a product that does not exist costs nothing: *Would you use it?* nearly always gets a polite yes. Rob Fitzpatrick's book *The Mom Test* sums up the remedy: talk about their life, not your idea; ask about specific things that happened, not opinions about the future; listen more than you talk.\n\n| Weak question | Why it misleads | Better question |\n|---|---|---|\n| *Would you use an AI revision planner?* | Invites a polite yes about the future | *Tell me about the last time you prepared for a test. What did you do first?* |\n| *Don't you hate making flashcards?* | Leading: it suggests the answer | *Which part of revising took you the most time last week?* |\n| *How much would you pay for it?* | A guess about a product they have never seen | *What have you already tried? What was wrong with it?* |\n\n**Listen for evidence:** a specific recent story, a workaround they built themselves, time or money already spent, strong feelings. Compliments (*Cool idea!*) and promises (*I'd definitely use it*) are not evidence.\n\n**Respect the people you interview.** Say why you are asking, get their consent, and let them skip a question or stop. Record nothing without permission, note codes (P1, P2...) instead of names, and leave out sensitive details you do not need. In this course, interview classmates, family or members of your clubs, with your teacher's agreement, and never strangers online.\n\n**Make sense of your notes:** write each observation on its own note, then group the notes into themes (**affinity mapping**). A problem worth pursuing comes up again and again, costs people something (time, stress, money) and is one they already try to solve, badly.",
              },
              fr: {
                heading: 'Apprends des gens, pas de ton idée',
                body: '**Choisis qui tu aides\u00a0:** un groupe précis que tu peux rencontrer (*les élèves de première et de terminale qui préparent des épreuves écrites*, pas *tout le monde*). Regarde ensuite au-delà de tes amis\u00a0: si tu n’interroges que des gens qui te ressemblent, tu n’apprends que sur des gens qui te ressemblent. Inclus des personnes qui font la tâche autrement, utilisent moins les applications ou ont des besoins que tu n’as pas.\n\n**Trois façons d’apprendre\u00a0:** les **entretiens**, en tête-à-tête, de 10 à 20\u00a0minutes\u00a0; l’**observation**, en regardant quelqu’un organiser ses révisions ou gérer les inscriptions d’un club (les gens font souvent autre chose que ce qu’ils disent faire)\u00a0; et les **traces**\u00a0: les solutions de contournement que les gens ont bricolées, comme un tableur partagé ou des rappels sur le téléphone, et leurs avis sur les produits qu’ils utilisent déjà.\n\n**Interroge sur le passé, pas sur l’avenir.** Les gens sont gentils, et donner son avis sur un produit qui n’existe pas ne coûte rien\u00a0: *Tu l’utiliserais\u00a0?* obtient presque toujours un oui poli. Le livre de Rob Fitzpatrick *The Mom Test* résume le remède\u00a0: parle de leur vie, pas de ton idée\u00a0; interroge sur des faits précis qui se sont produits, pas sur des opinions à propos de l’avenir\u00a0; écoute plus que tu ne parles.\n\n| Question faible | Pourquoi elle trompe | Meilleure question |\n|---|---|---|\n| *Tu utiliserais un planificateur de révisions avec IA\u00a0?* | Elle invite à un oui poli sur l’avenir | *Raconte-moi la dernière fois que tu as préparé un contrôle. Qu’as-tu fait en premier\u00a0?* |\n| *Tu ne trouves pas pénible de faire des fiches\u00a0?* | Elle oriente\u00a0: elle souffle la réponse | *Quelle partie de tes révisions t’a pris le plus de temps la semaine dernière\u00a0?* |\n| *Combien paierais-tu pour ça\u00a0?* | Une supposition sur un produit jamais vu | *Qu’as-tu déjà essayé\u00a0? Qu’est-ce qui n’allait pas\u00a0?* |\n\n**Guette les preuves\u00a0:** une histoire précise et récente, une solution de contournement bricolée par la personne elle-même, du temps ou de l’argent déjà dépensé, des émotions fortes. Les compliments (*Super idée\u00a0!*) et les promesses (*Je l’utiliserais, c’est sûr*) ne sont pas des preuves.\n\n**Respecte les personnes que tu interroges.** Dis pourquoi tu poses ces questions, demande leur accord, et laisse-les sauter une question ou s’arrêter. N’enregistre rien sans permission, note des codes (P1, P2…) au lieu des noms, et laisse de côté les informations sensibles dont tu n’as pas besoin. Dans ce cours, interroge des camarades, des membres de ta famille ou de tes clubs, avec l’accord de ton enseignant, et jamais des inconnus en ligne.\n\n**Donne du sens à tes notes\u00a0:** écris chaque observation sur une note séparée, puis regroupe les notes par thèmes (le **regroupement par affinités**, *affinity mapping*). Un problème qui vaut la peine revient sans cesse, coûte quelque chose aux gens (du temps, du stress, de l’argent) et ils essaient déjà de le résoudre, mal.',
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
                heading: 'From notes to a problem statement and a value proposition',
                body: "**Jobs, pains and gains.** The marketing professor Theodore Levitt is often quoted as saying that people do not want a quarter-inch drill: they want a quarter-inch hole. Clayton Christensen's idea of **jobs to be done** builds on this: people *hire* a product to get a job done. The **Value Proposition Canvas**, created by Alexander Osterwalder and his colleagues, sets a user's jobs, **pains** and **gains** beside what a product offers, and starts with the user's side.\n\n**The problem statement** names the users, their need and your evidence, and contains no solution:\n\n> *[Users] need a way to [job] because [what you learned]. Today they [workaround], which [costs them time, stress, errors...].*\n\n| Statement | Verdict |\n|---|---|\n| *Students need an AI chatbot for the robotics club.* | A solution in disguise, with no evidence |\n| *Education should use more AI.* | Too vague to act on |\n| *Robotics club members need to know which parts are in stock before a build session: three of the five members we interviewed had seen a planned build fail for lack of a part (invented figures). Today they ask in the group chat, where answers are slow and often wrong.* | Specific, evidenced, solution-free |\n\n**The value proposition** says what you offer, to whom, and why it beats what they do today. A widely used template comes from Geoffrey Moore's book *Crossing the Chasm*:\n\n> *For [target users] who [need], [product] is a [category] that [key benefit]. Unlike [current alternative], it [main difference].*\n\nFor example: *For robotics club members who plan build sessions, PartCheck is a shared parts list that shows in seconds whether a part is in the cupboard. Unlike the group chat, it is always up to date, because parts are logged when they are taken.*\n\nThis proposition contains no AI. The value is the benefit to the user, not the technology: AI belongs in a value proposition only when it changes what the user gets. Check your statement: is it **specific** (who, when), **evidenced**, **important** (frequent or painful), **solution-free**, and **small** enough to test within a few weeks?",
              },
              fr: {
                heading: 'Des notes à l’énoncé du problème et à la proposition de valeur',
                body: '**Tâches, irritants et gains.** On prête souvent au professeur de marketing Theodore Levitt cette formule\u00a0: les gens ne veulent pas une mèche d’un quart de pouce, ils veulent un trou d’un quart de pouce. L’idée des **tâches à accomplir** (*jobs to be done*) de Clayton Christensen la prolonge\u00a0: les gens «\u00a0embauchent\u00a0» un produit pour accomplir une tâche. La **carte de la proposition de valeur** (*Value Proposition Canvas*), créée par Alexander Osterwalder et ses collègues, place les tâches, les **irritants** et les **gains** d’un utilisateur en face de ce que propose un produit, en commençant par le côté de l’utilisateur.\n\n**L’énoncé du problème** nomme les utilisateurs, leur besoin et tes preuves, et ne contient aucune solution\u00a0:\n\n> *[Des utilisateurs] ont besoin de [tâche] parce que [ce que tu as appris]. Aujourd’hui, ils [solution de contournement], ce qui [leur coûte du temps, du stress, des erreurs…].*\n\n| Énoncé | Verdict |\n|---|---|\n| *Les élèves ont besoin d’un chatbot d’IA pour le club de robotique.* | Une solution déguisée, sans aucune preuve |\n| *L’éducation devrait utiliser davantage l’IA.* | Trop vague pour agir |\n| *Les membres du club de robotique ont besoin de savoir quelles pièces sont disponibles avant une séance de montage\u00a0: trois des cinq membres interrogés ont vu un montage prévu échouer faute d’une pièce (chiffres inventés). Aujourd’hui, ils demandent dans le groupe de discussion, où les réponses sont lentes et souvent fausses.* | Précis, étayé, sans solution |\n\n**La proposition de valeur** dit ce que tu offres, à qui, et pourquoi c’est mieux que ce que les gens font aujourd’hui. Un gabarit très répandu vient du livre de Geoffrey Moore *Crossing the Chasm*\u00a0:\n\n> *Pour [utilisateurs cibles] qui [besoin], [produit] est [catégorie] qui [bénéfice principal]. Contrairement à [l’alternative actuelle], [différence principale].*\n\nPar exemple\u00a0: *Pour les membres du club de robotique qui préparent des séances de montage, PartCheck est une liste de pièces partagée qui montre en quelques secondes si une pièce est dans l’armoire. Contrairement au groupe de discussion, elle est toujours à jour, car chaque pièce est notée quand on la prend.*\n\nCette proposition ne contient pas d’IA. La valeur, c’est le bénéfice pour l’utilisateur, pas la technologie\u00a0: l’IA n’a sa place dans une proposition de valeur que si elle change ce que l’utilisateur obtient. Vérifie ton énoncé\u00a0: est-il **précis** (qui, quand), **étayé**, **important** (fréquent ou pénible), **sans solution**, et assez **modeste** pour être testé en quelques semaines\u00a0?',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'When not to use AI',
                body: "AI is a means, not a value proposition. Remember *How large language models are built*: a model can be confidently wrong, its answers vary, every request costs money and time, and what users type goes to a provider. Before choosing AI, ask five questions:\n\n1. **Can you write the rule down?** Then ordinary code, a form or a spreadsheet will be cheaper and more reliable.\n2. **Must the answer be exact and identical every time** (prices, deadlines, eligibility)? Calculate it or look it up; AI can at most phrase the result.\n3. **Could a mistake harm someone's health, safety, money or future?** Then a person decides, and AI assists at most.\n4. **Are the examples or sources the AI would need missing?** Collect them first, or do without AI.\n5. **Do people need a person** (care, conflict, a judgement call)? Keep the person, and give them better tools.\n\nAI earns its place with **messy inputs** that rules cannot cover (free text written in a thousand ways, images, speech) and with **language work** (summarising, classifying, drafting), provided that an occasional mistake can be noticed and fixed. The best design is often a hybrid: code for the exact part, AI for the fuzzy part, a person for the decisions that matter.\n\n| Task | Better tool |\n|---|---|\n| Tell members that tonight's session is cancelled | A message or a notification: no AI |\n| Work out each student's share of a trip's cost | A spreadsheet formula: it must be exact |\n| Sort 300 anonymous open-day comments by topic | A text classifier or a language model, with spot checks |\n| Answer questions about a 40-page club handbook | A contents page and a search box first; a grounded bot with citations if people still get lost |\n| Choose who gets a place on an exchange programme | People, with published criteria: AI must not decide alone |\n\n**Warning signs:** *with AI* is the only new thing in the pitch; the AI could be replaced by a drop-down menu; the demo works only on the three examples you chose; the product would make important decisions about people on its own (the next module looks at these risks and at the rules around them). The same goes for agents: as *What an AI agent is* showed, a workflow fixed in code is often enough.",
              },
              fr: {
                heading: 'Quand ne pas utiliser l’IA',
                body: 'L’IA est un moyen, pas une proposition de valeur. Souviens-toi de *Comment sont construits les grands modèles de langage*\u00a0: un modèle peut se tromper avec assurance, ses réponses varient, chaque requête coûte de l’argent et du temps, et ce que tapent les utilisateurs part chez un fournisseur. Avant de choisir l’IA, pose-toi cinq questions\u00a0:\n\n1. **Peux-tu écrire la règle\u00a0?** Alors du code ordinaire, un formulaire ou un tableur sera moins cher et plus fiable.\n2. **La réponse doit-elle être exacte et identique à chaque fois** (prix, dates limites, conditions d’accès)\u00a0? Calcule-la ou va la chercher\u00a0; l’IA peut tout au plus formuler le résultat.\n3. **Une erreur pourrait-elle nuire à la santé, à la sécurité, à l’argent ou à l’avenir de quelqu’un\u00a0?** Alors une personne décide, et l’IA aide, tout au plus.\n4. **Manque-t-il les exemples ou les sources dont l’IA aurait besoin\u00a0?** Rassemble-les d’abord, ou fais sans IA.\n5. **Les gens ont-ils besoin d’une personne** (attention, conflit, jugement délicat)\u00a0? Garde la personne, et donne-lui de meilleurs outils.\n\nL’IA se rend utile face à des **entrées désordonnées** que des règles ne peuvent pas couvrir (du texte libre écrit de mille façons, des images, de la parole) et pour le **travail sur la langue** (résumer, classer, rédiger un brouillon), à condition qu’une erreur occasionnelle puisse être repérée et corrigée. La meilleure conception est souvent hybride\u00a0: du code pour la partie exacte, l’IA pour la partie floue, une personne pour les décisions importantes.\n\n| Tâche | Meilleur outil |\n|---|---|\n| Prévenir les membres que la séance de ce soir est annulée | Un message ou une notification\u00a0: pas d’IA |\n| Calculer la part de chaque élève dans le coût d’une sortie | Une formule de tableur\u00a0: il faut un résultat exact |\n| Classer par thème 300 commentaires anonymes d’une journée portes ouvertes | Un classifieur de texte ou un modèle de langage, avec des vérifications par sondage |\n| Répondre aux questions sur le règlement de 40\u00a0pages d’un club | D’abord une table des matières et une barre de recherche\u00a0; un bot ancré avec citations si les gens s’y perdent encore |\n| Choisir qui obtient une place dans un programme d’échange | Des personnes, avec des critères publiés\u00a0: l’IA ne doit pas décider seule |\n\n**Signaux d’alerte\u00a0:** *avec l’IA* est la seule nouveauté du pitch\u00a0; l’IA pourrait être remplacée par un menu déroulant\u00a0; la démo ne marche que sur les trois exemples que tu as choisis\u00a0; le produit prendrait seul des décisions importantes sur des personnes (le module suivant examine ces risques et les règles qui les encadrent). Il en va de même pour les agents\u00a0: comme l’a montré *Ce qu’est un agent d’IA*, un flux de travail fixé dans le code suffit souvent.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: your problem one-pager',
                body: 'Fill in this one-pager on paper or in a document. Choose an area you know from the inside (your school, a club, a hobby, a family routine), with users you can talk to.\n\n1. **Users:** one line describing the group. No names.\n2. **Interview plan:** four open questions about the past (*Tell me about the last time...*). Interview at least one person now, a classmate from another group, and two more before the next lesson.\n3. **Notes:** for each person (P1, P2, P3), one specific story, their workaround, and what it costs them.\n4. **Themes:** the two pains that came up most, each rated from 1 to 5 for how often it happens and how much it hurts.\n5. **Problem statement:** use the template. No solution in it.\n6. **Value proposition:** use the template. Can you write it without the word AI?\n7. **AI fit:** answer the five questions of *When not to use AI*. Write the best solution without AI, then what AI would add, if anything: which part of the job, and what happens when it is wrong.\n8. **Riskiest assumption:** the belief that would sink the idea if it were false (*members will log every part they take*).\n\nKeep your one-pager: *Prototype and measure* starts from its riskiest assumption, and it may become the idea of your startup capstone.',
              },
              fr: {
                heading: 'À toi\u00a0: ta fiche problème d’une page',
                body: 'Remplis cette fiche sur papier ou dans un document. Choisis un domaine que tu connais de l’intérieur (ton lycée, un club, un loisir, une habitude familiale), avec des utilisateurs à qui tu peux parler.\n\n1. **Utilisateurs\u00a0:** une ligne qui décrit le groupe. Aucun nom.\n2. **Plan d’entretien\u00a0:** quatre questions ouvertes sur le passé (*Raconte-moi la dernière fois que…*). Interroge au moins une personne maintenant, un camarade d’un autre groupe, et deux autres avant la prochaine leçon.\n3. **Notes\u00a0:** pour chaque personne (P1, P2, P3), une histoire précise, sa solution de contournement, et ce qu’elle lui coûte.\n4. **Thèmes\u00a0:** les deux irritants qui reviennent le plus, chacun noté de 1 à 5 pour sa fréquence et pour sa gravité.\n5. **Énoncé du problème\u00a0:** utilise le gabarit. Aucune solution dedans.\n6. **Proposition de valeur\u00a0:** utilise le gabarit. Peux-tu l’écrire sans le mot IA\u00a0?\n7. **L’IA est-elle adaptée\u00a0?** Réponds aux cinq questions de *Quand ne pas utiliser l’IA*. Écris la meilleure solution sans IA, puis ce que l’IA ajouterait, s’il y a lieu\u00a0: quelle partie du travail, et ce qui se passe quand elle se trompe.\n8. **Hypothèse la plus risquée\u00a0:** la croyance qui ferait couler l’idée si elle était fausse (*les membres noteront chaque pièce qu’ils prennent*).\n\nGarde ta fiche\u00a0: *Prototyper et mesurer* part de son hypothèse la plus risquée, et elle pourrait devenir l’idée de ton projet de startup de fin de cours.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to play a sceptical mentor who tests your one-pager. Paste your problem statement and value proposition, without names or personal details of the people you interviewed. Answer one question at a time. The tutor challenges your thinking; it does not do your research for you, so if it proposes a solution, bring it back to your evidence. Write down the question you found hardest: it shows where you need more evidence.',
                starterPrompt:
                  'Act as a sceptical startup mentor. My problem statement: [paste it]. My value proposition: [paste it]. Challenge me with one hard question at a time: is the problem real and frequent, what is my evidence, who exactly are my users, and would a solution without AI work as well? Wait for my answer before you ask the next question, and do not suggest a solution.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de jouer un mentor sceptique qui met ta fiche à l’épreuve. Colle ton énoncé du problème et ta proposition de valeur, sans nom ni information personnelle sur les personnes que tu as interrogées. Réponds à une question à la fois. Le tuteur met ta réflexion au défi, il ne fait pas ta recherche à ta place\u00a0: s’il propose une solution, ramène-le à tes preuves. Note la question qui t’a le plus gêné\u00a0: elle montre où il te manque des preuves.',
                starterPrompt:
                  'Joue le rôle d’un mentor de startup sceptique. Mon énoncé du problème\u00a0: [colle-le]. Ma proposition de valeur\u00a0: [colle-la]. Mets-moi au défi avec une question difficile à la fois\u00a0: le problème est-il réel et fréquent, quelles sont mes preuves, qui sont exactement mes utilisateurs, et une solution sans IA marcherait-elle aussi bien\u00a0? Attends ma réponse avant de poser la question suivante, et ne me propose pas de solution.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm3-l1-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'What did your first interview teach you that you did not expect, and did it change your problem statement? (If you could not interview anyone yet, which assumption worries you most?) Then argue for or against using AI for this problem: name the best alternative without AI, and say what a mistake would cost your users.',
              },
              fr: {
                prompt:
                  'Qu’est-ce que ton premier entretien t’a appris que tu n’attendais pas, et cela a-t-il changé ton énoncé du problème\u00a0? (Si tu n’as encore pu interroger personne, quelle hypothèse t’inquiète le plus\u00a0?) Défends ensuite, ou critique, le recours à l’IA pour ce problème\u00a0: nomme la meilleure solution sans IA, et dis ce qu’une erreur coûterait à tes utilisateurs.',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
      {
        id: 'm3-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Prototype and measure',
              summary:
                'Test before you build: paper, Wizard-of-Oz, concierge and prompt prototypes, the MVP, success metrics that guide decisions (and vanity metrics that do not), user tests and iteration.',
            },
            fr: {
              title: 'Prototyper et mesurer',
              summary:
                'Teste avant de construire\u00a0: prototypes papier, Magicien d’Oz, conciergerie et prototypes de prompt, le MVP, des indicateurs de réussite qui guident les décisions (et des indicateurs de vanité qui n’en guident aucune), les tests utilisateurs et les itérations.',
            },
          },
          estimatedMinutes: 45,
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
                heading: 'A typewriter that listened, with a person inside',
                body: 'In the early 1980s, researchers at IBM wanted to find out how useful a *listening typewriter* would be: a computer that types the letters people dictate. Speech recognition was far from good enough to build one, so they simulated it. Participants spoke and watched their words appear on a screen while, out of sight, a skilled typist typed what they heard. The researchers could study how people dictated, corrected and composed their letters, and what a real system would need, long before such a system could be built.\n\nThe trick is now called a **Wizard of Oz** prototype, after the wizard of the 1939 film, who turns out to be an ordinary man working the machinery from behind a curtain. It sums up this lesson: before you spend weeks building, find the cheapest way to learn whether your idea works for real people, and decide in advance what *works* means. You will start from the riskiest assumption on the one-pager you wrote in *Find a problem worth solving*.',
              },
              fr: {
                heading: 'Une machine à écrire qui écoutait, avec quelqu’un dedans',
                body: 'Au début des années 1980, des chercheurs d’IBM voulaient savoir quelle serait l’utilité d’une *machine à écrire qui écoute*\u00a0: un ordinateur qui tape les lettres qu’on lui dicte. La reconnaissance vocale était loin d’être assez au point pour en construire une\u00a0: ils l’ont donc simulée. Les participants parlaient et voyaient leurs mots apparaître à l’écran, tandis que, hors de leur vue, une personne experte en dactylographie tapait ce qu’elle entendait. Les chercheurs ont pu étudier comment les gens dictaient, corrigeaient et rédigeaient leurs lettres, et ce dont un vrai système aurait besoin, bien avant qu’un tel système puisse être construit.\n\nCette astuce s’appelle aujourd’hui un prototype **Magicien d’Oz** (*Wizard of Oz*), d’après le magicien du film de 1939, qui se révèle être un homme ordinaire actionnant la machinerie derrière un rideau. Elle résume cette leçon\u00a0: avant de passer des semaines à construire, trouve le moyen le moins coûteux d’apprendre si ton idée fonctionne pour de vraies personnes, et décide à l’avance ce que *fonctionner* veut dire. Tu partiras de l’hypothèse la plus risquée de la fiche que tu as rédigée dans *Trouver un problème qui mérite d’être résolu*.',
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
                heading: 'Prototypes, from paper to MVP',
                body: "A **prototype** lets someone experience your idea before it exists. Each kind answers a different question: pick the cheapest one that answers yours.\n\n| Prototype | What it is | What it tests | Watch out |\n|---|---|---|---|\n| Paper | Screens sketched on paper; a teammate swaps them as the tester taps | Is the flow clear? Do people see what it is for? | Says nothing about the quality of the AI's output |\n| Clickable mock-up | Linked slides or design-tool screens | Navigation, wording, first impressions | Looks finished, so testers criticise less |\n| Wizard of Oz | A realistic interface; a hidden person writes the AI's answers | Are the answers worth having? What do users ask? | A person is smarter than your model will be |\n| Concierge | You deliver the service by hand, openly | Do people use the result and come back for it? | Does not scale, and does not need to yet |\n| Prompt prototype | A fixed prompt tried in an AI tool on realistic inputs | Can a model do the job? How often does it fail? | Invented or public inputs only |\n\n**The MVP.** In the sense popularised by Eric Ries's book *The Lean Startup*, a **minimum viable product** is the version that lets you start learning from real users with the least effort, in a loop: **build** the smallest thing, **measure** what people do, **learn**, then decide. A classic example is Zappos: to find out whether people would buy shoes online, its founder, Nick Swinmurn, posted photos of shoes from local shops on a website and, when an order came in, bought the pair and shipped it himself. Minimum does not mean sloppy: an MVP does its one job properly.\n\n**Two questions for an AI product.** *Would users value the output?* A Wizard-of-Oz or concierge test answers this without any model. *Can a model produce that output reliably?* A prompt prototype scored with an evaluation set, as in *Grounding, retrieval and evaluation*, answers that. You need both yeses; test the cheaper question first.\n\n**Run a fair and honest wizard.** Give the wizard a rules card that imitates the future model: answer only from the source cards provided, say *I don't know* otherwise, keep answers short. Tell testers, before or straight after the session, that a person wrote the answers. With real users, passing a person off as a machine, or a machine as a person, misleads them about who reads their words.",
              },
              fr: {
                heading: 'Les prototypes, du papier au MVP',
                body: 'Un **prototype** permet à quelqu’un de faire l’expérience de ton idée avant qu’elle n’existe. Chaque type répond à une question différente\u00a0: choisis le moins coûteux qui réponde à la tienne.\n\n| Prototype | Ce que c’est | Ce qu’il teste | Attention |\n|---|---|---|---|\n| Papier | Des écrans dessinés sur papier\u00a0; un coéquipier les change quand le testeur «\u00a0touche\u00a0» l’écran | Le parcours est-il clair\u00a0? Comprend-on à quoi ça sert\u00a0? | Ne dit rien de la qualité des réponses de l’IA |\n| Maquette cliquable | Des diapositives reliées entre elles ou des écrans d’un outil de conception | La navigation, les mots, la première impression | A l’air fini\u00a0: les testeurs critiquent moins |\n| Magicien d’Oz | Une interface réaliste\u00a0; une personne cachée écrit les réponses de l’IA | Les réponses valent-elles la peine\u00a0? Que demandent les utilisateurs\u00a0? | Une personne est plus intelligente que ne le sera ton modèle |\n| Conciergerie | Tu rends le service à la main, ouvertement | Les gens utilisent-ils le résultat, et reviennent-ils\u00a0? | Ne passe pas à l’échelle, et n’en a pas encore besoin |\n| Prototype de prompt | Un prompt fixe essayé dans un outil d’IA sur des entrées réalistes | Un modèle sait-il faire le travail\u00a0? À quelle fréquence échoue-t-il\u00a0? | Uniquement des entrées inventées ou publiques |\n\n**Le MVP.** Au sens popularisé par le livre d’Eric Ries *The Lean Startup*, un **produit minimum viable** (MVP, pour *minimum viable product*) est la version qui permet de commencer à apprendre de vrais utilisateurs avec le moins d’effort possible, dans une boucle\u00a0: **construire** la plus petite chose possible, **mesurer** ce que font les gens, **apprendre**, puis décider. Un exemple classique est Zappos\u00a0: pour savoir si les gens achèteraient des chaussures en ligne, son fondateur, Nick Swinmurn, a publié sur un site les photos de chaussures de magasins voisins et, quand une commande arrivait, il achetait la paire et l’expédiait lui-même. Minimum ne veut pas dire bâclé\u00a0: un MVP remplit correctement son unique mission.\n\n**Deux questions pour un produit d’IA.** *Les utilisateurs accorderaient-ils de la valeur à la sortie\u00a0?* Un test Magicien d’Oz ou de conciergerie y répond sans aucun modèle. *Un modèle peut-il produire cette sortie de façon fiable\u00a0?* Un prototype de prompt noté avec un jeu d’évaluation, comme dans *Ancrage, récupération et évaluation*, y répond. Il te faut deux oui\u00a0; teste d’abord la question la moins coûteuse.\n\n**Un magicien loyal et honnête.** Donne au magicien une carte de règles qui imite le futur modèle\u00a0: répondre uniquement à partir des cartes sources fournies, dire *je ne sais pas* sinon, faire des réponses courtes. Dis aux testeurs, avant la séance ou juste après, qu’une personne a écrit les réponses. Avec de vrais utilisateurs, faire passer une personne pour une machine, ou une machine pour une personne, les trompe sur qui lit leurs mots.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Success metrics and vanity metrics',
                body: "Decide what success means **before** you test, and write it down: otherwise any result will look like success. An AI product is measured at three levels:\n\n1. **Model quality:** is the output right? These are the scores of your evaluation set from *Grounding, retrieval and evaluation*.\n2. **Task success:** can users do what they came for? The share of testers who complete the task without help, the time it takes, the errors, and how often they must correct the AI's output.\n3. **Value:** does it change what people do? They come back the following week (**retention**), choose it over their old workaround, or would be very disappointed if it disappeared.\n\n**Vanity metrics** go up and feel good but tell you nothing about what to do next: total sign-ups, page views, downloads, likes, applause after a demo. Even the number of messages sent to a chatbot can be a bad sign: users may be rephrasing because it did not understand them. An **actionable metric** is tied to your value proposition, is a rate rather than a running total, and compares versions or groups, so it could tell you to change course.\n\n| Vanity | Actionable instead |\n|---|---|\n| 200 people signed up | Of last week's new users, how many came back this week? |\n| 1,500 messages sent | 4 of 5 testers found their answer without help |\n| The demo got applause | 3 of 5 testers used it instead of the group chat for a week |\n\n(Invented figures.)\n\n**Guardrails.** Add a **counter-metric** that must not get worse: wrong answers shown, wrong answers *not noticed*, complaints, cost per user, time spent checking the AI. A study bot that keeps students chatting longer is not better if they learn less.\n\n**Set the threshold in advance.** *If at least 4 of 5 testers complete the task in under two minutes, and nobody accepts a wrong answer without noticing, we build version 2; otherwise we fix the flow first.* And remember **Goodhart's law**, usually summed up as *when a measure becomes a target, it ceases to be a good measure*: once a team chases a number, check that it still means what you wanted to measure.",
              },
              fr: {
                heading: 'Indicateurs de réussite et indicateurs de vanité',
                body: 'Décide ce que réussir veut dire **avant** de tester, et écris-le\u00a0: sinon, n’importe quel résultat aura l’air d’une réussite. Un produit d’IA se mesure à trois niveaux\u00a0:\n\n1. **La qualité du modèle\u00a0:** la sortie est-elle juste\u00a0? Ce sont les scores de ton jeu d’évaluation, vu dans *Ancrage, récupération et évaluation*.\n2. **La réussite de la tâche\u00a0:** les utilisateurs arrivent-ils à faire ce pour quoi ils sont venus\u00a0? La part des testeurs qui terminent la tâche sans aide, le temps nécessaire, les erreurs, et la fréquence à laquelle ils doivent corriger la sortie de l’IA.\n3. **La valeur\u00a0:** le produit change-t-il ce que font les gens\u00a0? Ils reviennent la semaine suivante (la **rétention**), le préfèrent à leur ancienne solution de contournement, ou seraient très déçus s’il disparaissait.\n\nLes **indicateurs de vanité** (*vanity metrics*) montent et font plaisir, mais ne disent rien de ce qu’il faut faire ensuite\u00a0: le total des inscriptions, des pages vues, des téléchargements, des «\u00a0j’aime\u00a0», les applaudissements après une démonstration. Même le nombre de messages envoyés à un chatbot peut être mauvais signe\u00a0: les utilisateurs reformulent peut-être parce qu’il ne les a pas compris. Un **indicateur actionnable** est lié à ta proposition de valeur, c’est un taux plutôt qu’un total qui s’accumule, et il compare des versions ou des groupes\u00a0: il pourrait donc te pousser à changer de cap.\n\n| Vanité | Actionnable à la place |\n|---|---|\n| 200 inscrits | Parmi les nouveaux utilisateurs de la semaine dernière, combien sont revenus cette semaine\u00a0? |\n| 1\u00a0500 messages envoyés | 4 testeurs sur 5 ont trouvé leur réponse sans aide |\n| La démo a été applaudie | 3 testeurs sur 5 l’ont utilisé à la place du groupe de discussion pendant une semaine |\n\n(Chiffres inventés.)\n\n**Des garde-fous.** Ajoute un **indicateur garde-fou** qui ne doit pas se dégrader\u00a0: les réponses fausses affichées, les réponses fausses *non repérées*, les plaintes, le coût par utilisateur, le temps passé à vérifier l’IA. Un bot de révision qui fait discuter les élèves plus longtemps n’est pas meilleur s’ils apprennent moins.\n\n**Fixe le seuil à l’avance.** *Si au moins 4 testeurs sur 5 terminent la tâche en moins de deux minutes, et si personne n’accepte une réponse fausse sans s’en apercevoir, nous construisons la version 2\u00a0; sinon, nous corrigeons d’abord le parcours.* Et souviens-toi de la **loi de Goodhart**, souvent résumée ainsi\u00a0: *lorsqu’une mesure devient un objectif, elle cesse d’être une bonne mesure*. Dès qu’une équipe court après un chiffre, vérifie qu’il veut encore dire ce que tu voulais mesurer.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'User tests and iteration',
                body: "**Plan a round.**\n\n- **Testers:** three to five people from your target group, not your teammates.\n- **A realistic task, written as a goal:** *You want to know whether the 3D printer is free on Thursday. Find out.* Not *Click on Calendar*.\n- **Think aloud:** ask testers to say what they look at, expect and wonder.\n- **Roles:** a facilitator who gives the task, a note-taker, and for a Wizard of Oz, the wizard.\n- **Stay quiet:** do not help, explain or defend. If a tester asks *What should I do?*, reply *What would you do if I were not here?* Where people get stuck is your data. If someone is truly blocked, help them, and count the task as not completed.\n- **Measure** your metrics, then ask two or three open questions.\n\nThe usability expert Jakob Nielsen has long argued that small rounds of about five testers reveal most of a design's problems, and that several small rounds beat one big one. With five testers, *4 of 5* is a signal, not a statistic: use it to find problems and compare versions, not to announce percentages.\n\n**Test ethically.** Taking part is voluntary and testers can stop at any time; tell them you are testing the product, not them. Note codes (T1, T2...), put invented data in the prototype, never theirs, and take no photos or recordings without their permission and your teacher's agreement.\n\n**Watch the AI moments:** what users type (unexpected questions become new cases for your evaluation set); whether they notice when the AI is wrong, and can recover (edit, undo, ask a person); and whether they accept a confident wrong answer, the **automation bias** you met in *Design an agent with a human in the loop*.\n\n**Iterate.** After each round, list the problems, rank them by how often and how badly they hit, fix the worst one or two, and test again with new testers. Keep a log:\n\n| Version | What changed | Result | Decision |\n|---|---|---|---|\n| v1 | Paper flow, wizard answers | 2 of 5 completed the task | Simplify the start screen |\n| v2 | A single question box | 4 of 5 completed; 1 accepted a wrong answer | Show the source under each answer |\n\nAfter a few rounds, the evidence points to one of three decisions: **persevere** and keep improving; **pivot**, keeping what you learned but changing the users, the problem or the solution; or **stop**, a good result when it costs you days rather than months.",
              },
              fr: {
                heading: 'Tests utilisateurs et itérations',
                body: '**Prépare une série de tests.**\n\n- **Les testeurs\u00a0:** trois à cinq personnes de ton groupe cible, pas tes coéquipiers.\n- **Une tâche réaliste, formulée comme un but\u00a0:** *Tu veux savoir si l’imprimante 3D est libre jeudi. Renseigne-toi.* Et non *Clique sur Calendrier*.\n- **Penser à voix haute\u00a0:** demande aux testeurs de dire ce qu’ils regardent, ce qu’ils attendent et ce qu’ils se demandent.\n- **Les rôles\u00a0:** un animateur qui donne la tâche, un preneur de notes et, pour un Magicien d’Oz, le magicien.\n- **Garde le silence\u00a0:** n’aide pas, n’explique pas, ne te justifie pas. Si un testeur demande *Qu’est-ce que je dois faire\u00a0?*, réponds *Que ferais-tu si je n’étais pas là\u00a0?* Les endroits où les gens bloquent sont tes données. Si quelqu’un est vraiment bloqué, aide-le, et compte la tâche comme non réussie.\n- **Mesure** tes indicateurs, puis pose deux ou trois questions ouvertes.\n\nLe spécialiste de l’ergonomie Jakob Nielsen soutient depuis longtemps que de petites séries d’environ cinq testeurs révèlent la plupart des problèmes d’une interface, et que plusieurs petites séries valent mieux qu’une grande. Avec cinq testeurs, *4 sur 5* est un signal, pas une statistique\u00a0: sers-t’en pour trouver des problèmes et comparer des versions, pas pour annoncer des pourcentages.\n\n**Teste de façon éthique.** La participation est volontaire et les testeurs peuvent s’arrêter à tout moment\u00a0; dis-leur que tu testes le produit, pas eux. Note des codes (T1, T2…), mets des données inventées dans le prototype, jamais les leurs, et ne prends ni photo ni enregistrement sans leur permission et l’accord de ton enseignant.\n\n**Observe les moments d’IA\u00a0:** ce que tapent les utilisateurs (les questions inattendues deviennent de nouveaux cas pour ton jeu d’évaluation)\u00a0; s’ils remarquent quand l’IA se trompe, et s’ils peuvent s’en sortir (modifier, annuler, demander à une personne)\u00a0; et s’ils acceptent une réponse fausse dite avec assurance\u00a0: c’est le **biais d’automatisation**, déjà rencontré dans *Conçois un agent avec un humain dans la boucle*.\n\n**Itère.** Après chaque série, liste les problèmes, classe-les selon leur fréquence et leur gravité, corrige le pire ou les deux pires, et teste à nouveau avec de nouveaux testeurs. Tiens un journal\u00a0:\n\n| Version | Ce qui a changé | Résultat | Décision |\n|---|---|---|---|\n| v1 | Parcours papier, réponses du magicien | 2 sur 5 ont terminé la tâche | Simplifier l’écran d’accueil |\n| v2 | Une seule zone de question | 4 sur 5 ont terminé\u00a0; 1 a accepté une réponse fausse | Afficher la source sous chaque réponse |\n\nAprès quelques séries, les preuves mènent à l’une de trois décisions\u00a0: **persévérer** et continuer à améliorer\u00a0; **pivoter**, en gardant ce que tu as appris mais en changeant d’utilisateurs, de problème ou de solution\u00a0; ou **arrêter**, un bon résultat quand il te coûte des jours plutôt que des mois.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b5',
            type: RICH,
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Build it: a Wizard-of-Oz test in 20 minutes',
                body: "Work in threes, from your one-pager. If you are on your own, play the wizard yourself, with a family member as your tester at home.\n\n1. **Question:** which riskiest assumption are you testing today?\n2. **Plan, before building:** one success metric, one counter-metric, a threshold, and one vanity metric you promise to ignore.\n3. **Build (8 minutes):** sketch three or four paper screens: start, input, answer, and what the user sees when the answer is wrong. Write the wizard's rules card: what it may use (five invented source cards, for example), when it says *I don't know*, how long an answer may be. Invented data only.\n4. **Task:** write one realistic task as a goal.\n5. **Test:** run the session with two testers from another group: facilitator, note-taker, wizard. The wizard answers on sticky notes, following the rules card only.\n6. **Debrief:** tell each tester that a person wrote the answers, and thank them.\n7. **Record:** for each tester (T1, T2), task completed or not, time, hesitations, wrong answers noticed or not, one quote.\n8. **Decide:** compare with your threshold, then write version 2's single change in an iteration log.",
              },
              fr: {
                heading: 'À toi de construire\u00a0: un test Magicien d’Oz en 20\u00a0minutes',
                body: 'Travaille à trois, à partir de ta fiche problème. Si tu es seul, joue toi-même le magicien, avec un membre de ta famille comme testeur, à la maison.\n\n1. **La question\u00a0:** quelle hypothèse la plus risquée testes-tu aujourd’hui\u00a0?\n2. **Le plan, avant de construire\u00a0:** un indicateur de réussite, un indicateur garde-fou, un seuil, et un indicateur de vanité que tu promets d’ignorer.\n3. **Construire (8\u00a0minutes)\u00a0:** dessine trois ou quatre écrans sur papier\u00a0: l’accueil, la saisie, la réponse, et ce que voit l’utilisateur quand la réponse est fausse. Rédige la carte de règles du magicien\u00a0: ce qu’il peut utiliser (par exemple cinq cartes sources inventées), quand il dit *je ne sais pas*, quelle longueur peut avoir une réponse. Uniquement des données inventées.\n4. **La tâche\u00a0:** écris une tâche réaliste, formulée comme un but.\n5. **Le test\u00a0:** fais passer la séance à deux testeurs d’un autre groupe\u00a0: un animateur, un preneur de notes, un magicien. Le magicien répond sur des notes autocollantes, en suivant uniquement la carte de règles.\n6. **Le débriefing\u00a0:** dis à chaque testeur qu’une personne a écrit les réponses, et remercie-le.\n7. **Les résultats\u00a0:** pour chaque testeur (T1, T2), tâche réussie ou non, temps, hésitations, réponses fausses repérées ou non, une citation.\n8. **La décision\u00a0:** compare avec ton seuil, puis écris dans un journal d’itérations le seul changement de la version\u00a02.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b6',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding of the whole module: user research, problem statements and value propositions, when not to use AI, prototypes, metrics and user tests.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu as compris de tout le module\u00a0: la recherche utilisateur, l’énoncé du problème et la proposition de valeur, les cas où l’IA n’est pas le bon outil, les prototypes, les indicateurs et les tests utilisateurs.',
              },
            },
            data: { quizId: 'quiz-m3' },
          },
          {
            id: 'm3-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Look back at your Wizard-of-Oz test, or at your plan if you could not run it. Did the result reach the threshold you set in advance? What surprised you most, and what single change will version 2 make? Name one number you will deliberately ignore, and explain why it would mislead you.',
              },
              fr: {
                prompt:
                  'Repense à ton test Magicien d’Oz, ou à ton plan si tu n’as pas pu le faire passer. Le résultat a-t-il atteint le seuil que tu avais fixé à l’avance\u00a0? Qu’est-ce qui t’a le plus surpris, et quel changement unique apportera la version\u00a02\u00a0? Nomme un chiffre que tu ignoreras volontairement, et explique pourquoi il t’induirait en erreur.',
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
      id: 'quiz-m3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: from problem to product',
            instructions:
              'Seven questions on user research, problem statements, when not to use AI, prototypes, metrics and user tests. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: du problème au produit',
            instructions:
              'Sept questions sur la recherche utilisateur, l’énoncé du problème, les cas où l’IA n’est pas le bon outil, les prototypes, les indicateurs et les tests utilisateurs. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'You are interviewing a student about revision. Which question is most likely to give you real evidence about their problem?',
              },
              fr: {
                prompt:
                  'Tu interroges un élève sur ses révisions. Quelle question a le plus de chances de t’apporter de vraies preuves sur son problème\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Would you use an app that plans your revision with AI?' },
                  fr: {
                    text: 'Tu utiliserais une application qui planifie tes révisions avec l’IA\u00a0?',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Tell me about the last time you prepared for a test: what did you do, step by step?',
                  },
                  fr: {
                    text: 'Raconte-moi la dernière fois que tu as préparé un contrôle\u00a0: qu’as-tu fait, étape par étape\u00a0?',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: "Don't you think revision planners are too complicated?" },
                  fr: {
                    text: 'Tu ne trouves pas que les planificateurs de révisions sont trop compliqués\u00a0?',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'How much would you pay for a better revision planner?' },
                  fr: {
                    text: 'Combien paierais-tu pour un meilleur planificateur de révisions\u00a0?',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A question about a specific past event gets facts: what the person really did, their workarounds and where it hurt. Questions about a future product invite polite yeses and guesses, and a leading question suggests its own answer.',
              },
              fr: {
                text: 'Une question sur un fait précis et passé apporte des faits\u00a0: ce que la personne a réellement fait, ses solutions de contournement et ce qui l’a gênée. Les questions sur un produit futur attirent des oui polis et des suppositions, et une question orientée souffle sa propre réponse.',
              },
            },
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: { prompt: 'Which of these is the best problem statement?' },
              fr: { prompt: 'Lequel de ces énoncés du problème est le meilleur\u00a0?' },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Club members need an AI chatbot that answers their questions.' },
                  fr: {
                    text: 'Les membres du club ont besoin d’un chatbot d’IA qui répond à leurs questions.',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Schools should use more artificial intelligence.' },
                  fr: {
                    text: 'Les établissements scolaires devraient utiliser davantage l’intelligence artificielle.',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Club members need to hear about cancelled sessions before they leave home: four of the six members we interviewed had made a wasted trip this term. Today the news reaches them through a group chat that few check in the evening.',
                  },
                  fr: {
                    text: 'Les membres du club ont besoin d’apprendre qu’une séance est annulée avant de quitter la maison\u00a0: quatre des six membres interrogés ont fait un trajet pour rien ce trimestre. Aujourd’hui, la nouvelle passe par un groupe de discussion que peu consultent le soir.',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Our app will use a large language model to send smart notifications.',
                  },
                  fr: {
                    text: 'Notre application utilisera un grand modèle de langage pour envoyer des notifications intelligentes.',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A good problem statement names the users and their need, gives evidence from research and describes the current workaround, without a solution. Options a and d are solutions in disguise, and b is too vague to act on.',
              },
              fr: {
                text: 'Un bon énoncé du problème nomme les utilisateurs et leur besoin, apporte des preuves issues de la recherche et décrit la solution de contournement actuelle, sans proposer de solution. Les options a et d sont des solutions déguisées, et b est trop vague pour agir.',
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
                  'For which of these tasks is AI probably NOT the right tool on its own? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Pour lesquelles de ces tâches l’IA n’est-elle probablement PAS le bon outil à elle seule\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: "Working out each student's share of the cost of a school trip" },
                  fr: {
                    text: 'Calculer la part de chaque élève dans le coût d’une sortie scolaire',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Sorting hundreds of anonymous free-text comments by topic, with spot checks by a person',
                  },
                  fr: {
                    text: 'Classer par thème des centaines de commentaires anonymes rédigés librement, avec des vérifications par sondage faites par une personne',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Deciding on its own which students get a place on an exchange programme',
                  },
                  fr: {
                    text: 'Décider seule quels élèves obtiennent une place dans un programme d’échange',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Reminding members that the club meets every Tuesday at 5 pm' },
                  fr: {
                    text: 'Rappeler aux membres que le club se réunit tous les mardis à 17\u00a0h',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Suggesting draft replies to questions written in many different ways, which a person then reviews',
                  },
                  fr: {
                    text: 'Proposer des brouillons de réponses à des questions formulées de mille façons, qu’une personne relit ensuite',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "A cost share must be exact, a weekly reminder follows a fixed rule, and a decision about a person's future needs people and clear criteria. Messy free text, with a person checking, is where AI can earn its place.",
              },
              fr: {
                text: 'Une part de coût doit être exacte, un rappel hebdomadaire suit une règle fixe, et une décision sur l’avenir d’une personne demande des personnes et des critères clairs. Le texte libre et désordonné, avec une personne qui vérifie, est le terrain où l’IA peut se rendre utile.',
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
                  'A team wants to know whether students would find AI feedback on their essay plans useful, before building anything. Which test answers that question most cheaply?',
              },
              fr: {
                prompt:
                  'Une équipe veut savoir si des élèves trouveraient utiles des commentaires d’IA sur leurs plans de dissertation, avant de construire quoi que ce soit. Quel test répond à cette question au moindre coût\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Tune a language model on essay plans, then ask students what they think',
                  },
                  fr: {
                    text: 'Ajuster un modèle de langage sur des plans de dissertation, puis demander leur avis aux élèves',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'A Wizard-of-Oz test: a teammate writes the feedback behind a realistic interface, following rules that imitate the future model',
                  },
                  fr: {
                    text: 'Un test Magicien d’Oz\u00a0: un membre de l’équipe rédige les commentaires derrière une interface réaliste, en suivant des règles qui imitent le futur modèle',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: "A paper prototype of the app's menus" },
                  fr: { text: 'Un prototype papier des menus de l’application' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'An advertising campaign, counting how many students sign up' },
                  fr: {
                    text: 'Une campagne publicitaire, en comptant le nombre d’élèves qui s’inscrivent',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The question is whether the output is valuable, and a hidden person can produce that output today. A paper prototype tests the flow, not the value of the feedback; sign-ups are a vanity metric; building a model first is the most expensive way to find out.',
              },
              fr: {
                text: 'La question est de savoir si la sortie a de la valeur, et une personne cachée peut produire cette sortie dès aujourd’hui. Un prototype papier teste le parcours, pas la valeur des commentaires\u00a0; les inscriptions sont un indicateur de vanité\u00a0; construire d’abord un modèle est la façon la plus coûteuse de le découvrir.',
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
                  'A team is testing a help bot whose value proposition is that club members find the answer to a question about the rules quickly, without asking a person. Which of these numbers help them decide what to do next? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Une équipe teste un bot d’aide dont la proposition de valeur est que les membres d’un club trouvent vite la réponse à une question sur le règlement, sans rien demander à personne. Lesquels de ces chiffres l’aident à décider de la suite\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: '4 of 5 testers found the answer to their task in under two minutes, without help',
                  },
                  fr: {
                    text: '4 testeurs sur 5 ont trouvé la réponse à leur tâche en moins de deux minutes, sans aide',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The demo video has 300 views' },
                  fr: { text: 'La vidéo de démonstration a 300 vues' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: '2 of 5 testers accepted a wrong answer without noticing' },
                  fr: {
                    text: '2 testeurs sur 5 ont accepté une réponse fausse sans s’en apercevoir',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Testers sent 120 messages in total' },
                  fr: { text: 'Les testeurs ont envoyé 120 messages au total' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Of the 10 members who tried it last week, 6 used it again this week',
                  },
                  fr: {
                    text: 'Sur les 10 membres qui l’ont essayé la semaine dernière, 6 l’ont réutilisé cette semaine',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Task success, a counter-metric on unnoticed wrong answers and a retention rate are tied to the value proposition and can change a decision. Views and a total count of messages only grow; many messages may even mean that the bot did not understand.',
              },
              fr: {
                text: 'La réussite de la tâche, un indicateur garde-fou sur les réponses fausses non repérées et un taux de rétention sont liés à la proposition de valeur et peuvent changer une décision. Les vues et le nombre total de messages ne font que grimper\u00a0; beaucoup de messages peuvent même signifier que le bot n’a pas compris.',
              },
            },
          },
          {
            id: 'q6',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'During a user test, when a tester hesitates, the facilitator should explain how the screen works, so that the test can go on.',
              },
              fr: {
                prompt:
                  'Pendant un test utilisateur, quand un testeur hésite, l’animateur doit lui expliquer comment fonctionne l’écran, pour que le test puisse continuer.',
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
                text: 'False. Hesitations are exactly what the test is meant to reveal: note them, and ask what the tester would do if you were not there. Help only someone who is truly blocked, and then count the task as not completed.',
              },
              fr: {
                text: 'Faux. Les hésitations sont précisément ce que le test cherche à révéler\u00a0: note-les, et demande à la personne ce qu’elle ferait si tu n’étais pas là. N’aide que quelqu’un de vraiment bloqué, et compte alors la tâche comme non réussie.',
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
                  'A founder proudly reports 5,000 downloads but cannot say whether anyone has used the app twice. What do we call a number like this, which grows and looks impressive but guides no decision? (two words)',
              },
              fr: {
                prompt:
                  'Une fondatrice annonce fièrement 5\u00a0000 téléchargements, mais ne sait pas si quelqu’un a utilisé l’application deux fois. Comment appelle-t-on un chiffre de ce genre, qui grimpe et impressionne mais ne guide aucune décision\u00a0? (trois mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'vanity metric',
                'a vanity metric',
                'vanity metrics',
                'vanity number',
                'a vanity number',
                'vanity',
              ],
              fr: [
                'indicateur de vanité',
                'un indicateur de vanité',
                'indicateurs de vanité',
                'métrique de vanité',
                'une métrique de vanité',
                'métriques de vanité',
                'indicateur de vanite',
                'metrique de vanite',
                'vanity metric',
                'vanity metrics',
              ],
            },
            explanation: {
              en: {
                text: 'A vanity metric. Total downloads, sign-ups or views only go up, so they cannot tell you whether the product creates value. An actionable metric, such as the share of new users who come back the following week, can.',
              },
              fr: {
                text: 'Un indicateur de vanité (on dit aussi métrique de vanité). Le total des téléchargements, des inscriptions ou des vues ne fait que monter\u00a0: il ne peut pas dire si le produit crée de la valeur. Un indicateur actionnable, comme la part des nouveaux utilisateurs qui reviennent la semaine suivante, le peut.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
