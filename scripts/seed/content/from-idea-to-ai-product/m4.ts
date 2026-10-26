// Module m4 of "From Idea to AI Product" (ages 16-18): responsible AI, business and society. It
// comes after m1 (advanced generative AI), m2 (AI agents and automation) and m3 (from problem to
// product), and before m5 (the startup capstone, whose final project is required for the
// certificate). It refers back without teaching again: confident wrong answers, citations, the
// evaluation set, "your users' words travel" and the invented Lumo help bot (m1), prompt
// injection, the OWASP list, excessive agency, automation bias, human oversight and the growing
// context of an agent loop (m2), and the learner's problem and users (m3, by module only, since
// m3 is written separately). m2-l2 promised the EU AI Act for this module.
// m4-l1: the hook is the 2020 A-level grades in England as widely reported: exams cancelled by
// COVID-19, Ofqual's statistical model adjusted teachers' estimated grades and rankings to each
// school's past results, almost 40% of grades came out lower than the teachers' estimates (Ofqual
// figures as reported by the BBC and others, 13 August 2020), teachers' estimates counted for more
// in small classes (more common in private schools), protests, and on 17 August the government
// announced that students would get their teacher's estimate if it was higher. Nothing else
// (appeals, Scotland, names) is claimed. Then risk thinking (likelihood and severity, people
// before technology, seven families of harm, cause -> event -> harm, a 1-3 by 1-3 score, the
// mitigation ladder remove / less likely / less harmful / detect / inform, residual risk, the
// risk register); the EU AI Act at a general level (adopted 2024; applies to systems sold or used
// in the EU wherever the company is based; the bans have applied since 2 February 2025, other
// dates are left out on purpose because changes to the timetable were under discussion; the four
// levels, with prohibited practices and high-risk uses from Article 5 and Annex III, including the
// education and employment entries; the main high-risk duties; general-purpose model providers;
// "whoever offers an AI system under their own name is its provider"); the GDPR (applied since
// 2018; personal data; the seven principles of Article 5 with their official names; the rights,
// Article 22 stated with "some exceptions"; special categories; children; the DPIA of Article 35;
// "many other countries have similar laws", none named). Both are labelled "a map, not legal
// advice". Transparency, accessibility (the WHO's "about one person in six" with a significant
// disability; WCAG's four principles, perceivable / operable / understandable / robust, French
// "perceptible, utilisable, compréhensible, robuste" as in the W3C translation; the European
// Accessibility Act applying since June 2025, examples from its scope) and security (OWASP Top 10
// for LLM applications, 2025 list: sensitive information disclosure, improper output handling,
// unbounded consumption; basics; an incident plan). The try stage is a risk register on paper for
// one of three invented products (QuizCraft: transparency level, arguably more if it steered
// learning; Shortlist: high risk, recruitment; ExamWatch: high risk, monitoring students during
// tests, and banned if it inferred emotions, which step 5 hints at), with a worked row for the
// Lumo help bot of m1-l2. Then a check_my_work tutor activity and a reflection.
// m4-l2: the hook is Sam Altman's post of January 2025 that OpenAI was losing money on ChatGPT
// Pro subscriptions ($200 a month, launched in December 2024) because people used them much more
// than expected. Then variable and fixed costs, unit economics and gross margin with invented
// prices (EUR 1 and EUR 4 per million input and output tokens: a request of 2,000 + 500 tokens
// costs EUR 0.004; 300 requests EUR 1.20; 3,000 requests EUR 12), cost levers, API against
// open-weight models; six pricing models and what makes a product hard to copy (GDPR data
// portability "in many cases"); jobs and skills (the IMF's January 2024 estimate that almost 40%
// of jobs worldwide are exposed to AI; Brynjolfsson, Li and Raymond, "Generative AI at Work",
// NBER 2023: 5,179 support agents at one firm, +14% issues resolved per hour on average, +34% for
// novice and low-skilled agents, little effect for the most experienced), the planet (the IEA's
// "Energy and AI", April 2025: data centres about 1.5% of world electricity in 2024, demand to
// more than double by 2030, AI the main driver; Luccioni, Jernite and Strubell, "Power Hungry
// Processing", 2023, Hugging Face and Carnegie Mellon: image generation the most energy-intensive
// task tested; no per-request figure is given), and misuse (dual use; Arup's confirmation in May
// 2024 of the Hong Kong deepfake video-call fraud of about US$25 million; misuse cases). The try
// stage is a Python unit-economics activity to trace by hand (checked with Python 3): the loop
// prints "light costs 0.4 margin 4.6", "typical costs 1.2 margin 3.8", "heavy costs 12.0 margin
// -7.0"; for the 100 users of MIX, cost EUR 126, revenue EUR 500, gross margin 74.8%, the 5 heavy
// users 60 of 126 (about 48%) of the model cost; with capped = min(requests, CAP), a heavy user
// costs 4.0 with margin 1.0, totals EUR 86 and 82.8%; usage_price at 1 cent a request charges 1,
// 3 and 30 euros (margins 0.6, 1.8 and 18; mix revenue EUR 315, margin 60%). Quiz q5 follows from
// the same prices (1,000 requests cost EUR 4). Then the module quiz quiz-m4 (seven questions on
// both lessons) and a reflection.
// No Machine Learning for Kids activity: the outline gives none, and no 45-minute slot is left
// for one (Tourist Info, which teaches training bias by building a biased app, would be the
// closest fit if the module is ever lengthened). Hence no project block and no project; the
// course's project is the m5 capstone. No video: no curated id fits regulation or business models
// (Crash Course AI #18 on algorithmic bias, gV0_raKR2UQ in from-ai-user-to-ai-developer m3-l1, is
// only a partial fit for m4-l1). The instructions and hints of code_activity and ai_activity
// blocks, reflection prompts and quiz texts are plain text (the player renders no Markdown there),
// and rich_text bodies carry no Markdown headings. Every product, price and user mix is invented.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m4: SeedModulePart = {
  module: {
    id: 'm4',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Responsible AI, business and society',
          description:
            'Risks, regulation and trust, then how AI products make money and what they change for people, work and the planet.',
        },
        fr: {
          title: 'IA responsable, économie et société',
          description:
            'Les risques, la réglementation et la confiance, puis la façon dont les produits d’IA gagnent de l’argent et ce qu’ils changent pour les personnes, le travail et la planète.',
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
              title: 'Risk, regulation and trust',
              summary:
                'Who could be harmed by an AI product and how, what the EU AI Act and data-protection law expect, and how transparency, accessibility and security earn trust; then a risk register for an invented product.',
            },
            fr: {
              title: 'Risques, réglementation et confiance',
              summary:
                'Qui un produit d’IA pourrait léser et comment, ce qu’attendent le règlement européen sur l’IA et le droit de la protection des données, et comment la transparence, l’accessibilité et la sécurité gagnent la confiance\u00a0; puis un registre des risques pour un produit inventé.',
            },
          },
          estimatedMinutes: 45,
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
                heading: 'The algorithm that graded a whole year group',
                body: "In the summer of 2020, the COVID-19 pandemic cancelled exams in England. To award A-level grades, which decide university places, the exams regulator, Ofqual, used a statistical model: teachers estimated a grade for each student and ranked their class, and the model adjusted those estimates so that each school's results looked like its results in previous years.\n\nOn results day, almost 40% of grades were lower than the teachers' estimates. A strong student at a school with weak past results could be marked down because of students who had sat the exams there in earlier years, while in small classes, more common in private schools, the teachers' estimates counted for more. After protests, the government announced within days that everyone would receive their teacher's estimate if it was higher.\n\nThe model was not even machine learning, and in one sense it worked: national results looked like those of other years. But it was designed to keep the national picture steady, not to get each student's grade right, and individual students paid for its errors. Once trust was lost, no explanation could win it back.\n\nThis lesson gives you three tools to ask the question first, *who could be harmed, and how?*, before your users answer it for you: risk thinking, the main rules for AI products, and the design habits that earn trust.",
              },
              fr: {
                heading: 'L’algorithme qui a noté toute une promotion',
                body: 'À l’été 2020, la pandémie de COVID-19 a fait annuler les examens en Angleterre. Pour attribuer les notes des A-levels, l’équivalent anglais du baccalauréat, qui décident des places à l’université, l’autorité de régulation des examens, l’Ofqual, a utilisé un modèle statistique\u00a0: les enseignants estimaient une note pour chaque élève et classaient leur groupe, puis le modèle ajustait ces estimations pour que les résultats de chaque établissement ressemblent à ceux de ses années précédentes.\n\nLe jour des résultats, près de 40\u00a0% des notes étaient inférieures aux estimations des enseignants. Un excellent élève d’un lycée aux résultats passés médiocres pouvait voir sa note abaissée à cause d’élèves qui y avaient passé l’examen les années précédentes, alors que dans les petits groupes, plus fréquents dans les établissements privés, les estimations des enseignants comptaient davantage. Après des manifestations, le gouvernement a annoncé en quelques jours que chacun recevrait l’estimation de son enseignant si elle était plus élevée.\n\nCe modèle ne relevait même pas de l’apprentissage automatique et, d’un certain point de vue, il fonctionnait\u00a0: les résultats nationaux ressemblaient à ceux des autres années. Mais il avait été conçu pour garder un tableau national stable, pas pour attribuer à chaque élève la bonne note, et ce sont des élèves, un par un, qui ont payé ses erreurs. Une fois la confiance perdue, aucune explication n’a pu la regagner.\n\nCette leçon te donne trois outils pour poser la question en premier, *qui pourrait être lésé, et comment\u00a0?*, avant que tes utilisateurs n’y répondent à ta place\u00a0: penser en termes de risques, connaître les grandes règles qui s’appliquent aux produits d’IA, et adopter les réflexes de conception qui gagnent la confiance.',
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
                heading: 'Risk thinking: who could be harmed, and how?',
                body: 'A **risk** is something that could go wrong and harm someone. For each one, ask two questions: how **likely** is it, and how **severe** would the harm be? A typo in a quiz is likely and harmless; a wrong dose in a medicine leaflet is rare and grave. Both deserve a line in your list, not the same attention.\n\n**Start from people, not from the technology.** List everyone the product touches: its **users**; **people affected who never use it**, such as the applicant ranked by a CV screener or the person in a photo that someone uploads; **groups it may serve worse**, such as speakers of other languages or accents, disabled people, or anyone rare in the data; and **society and the planet** (the subject of the next lesson).\n\n**Then look for harms family by family**, so that you do not miss a whole one:\n\n| Family | In an AI product |\n|---|---|\n| Errors | A confident wrong answer (module 1); an honest student flagged as cheating |\n| Unfair treatment | Worse results for one group, as with the 2020 grades |\n| Privacy | Personal data sent to a provider, kept too long or leaked |\n| Security | An injected instruction that makes an agent leak data (module 2) |\n| Misuse | The product used to harass, cheat or deceive |\n| Over-reliance | People stop checking: automation bias (module 2) |\n| Exclusion | A voice-only interface that some people cannot use |\n\n**Write each risk as cause → event → harm.** Writing *bias* does not describe a risk anyone can act on. *Because the training CVs come mostly from one country, the screener ranks applicants with foreign degrees lower, so qualified people miss interviews* does.\n\n**Score, then act.** Rate likelihood and severity from 1 (low) to 3 (high) and multiply them: a 6 or a 9 comes first. For each serious risk, choose a **mitigation**, from the strongest to the weakest: **remove** the feature that causes it; make it **less likely** (better data, tests, limits); make it **less harmful** (a person reviews before anything is final, an easy appeal, an undo); **detect** it (monitoring, a report button); or **inform** people of what remains, the weakest on its own. What is left is the **residual risk**: write down who accepts it, and why. All of this goes in a **risk register**, a table you revisit whenever the product changes.',
              },
              fr: {
                heading:
                  'Penser en termes de risques\u00a0: qui pourrait être lésé, et comment\u00a0?',
                body: 'Un **risque**, c’est quelque chose qui pourrait mal tourner et causer du tort à quelqu’un. Pour chacun, pose deux questions\u00a0: est-il **probable**, et quelle serait la **gravité** du préjudice\u00a0? Une faute de frappe dans un quiz est probable et sans conséquence\u00a0; une erreur de dose dans une notice de médicament est rare et grave. Les deux méritent une ligne dans ta liste, pas la même attention.\n\n**Pars des personnes, pas de la technologie.** Fais la liste de tous ceux que le produit touche\u00a0: ses **utilisateurs**\u00a0; les **personnes concernées qui ne l’utilisent jamais**, comme le candidat classé par un outil de tri de CV ou la personne qui figure sur une photo que quelqu’un téléverse\u00a0; les **groupes qu’il risque de moins bien servir**, comme les locuteurs d’autres langues ou d’autres accents, les personnes en situation de handicap ou tous ceux qui sont rares dans les données\u00a0; enfin **la société et la planète** (le sujet de la prochaine leçon).\n\n**Cherche ensuite les préjudices famille par famille**, pour n’en oublier aucune\u00a0:\n\n| Famille | Dans un produit d’IA |\n|---|---|\n| Erreurs | Une réponse fausse donnée avec assurance (module\u00a01)\u00a0; un élève honnête signalé comme tricheur |\n| Traitement injuste | De moins bons résultats pour un groupe, comme avec les notes de 2020 |\n| Vie privée | Des données personnelles envoyées à un fournisseur, conservées trop longtemps ou divulguées |\n| Sécurité | Une instruction injectée qui pousse un agent à divulguer des données (module\u00a02) |\n| Détournement | Le produit utilisé pour harceler, tricher ou tromper |\n| Dépendance excessive | On ne vérifie plus\u00a0: le biais d’automatisation (module\u00a02) |\n| Exclusion | Une interface uniquement vocale que certaines personnes ne peuvent pas utiliser |\n\n**Écris chaque risque sous la forme cause → événement → préjudice.** Écrire *biais* ne décrit pas un risque sur lequel on peut agir. *Comme les CV d’entraînement viennent surtout d’un seul pays, l’outil de tri classe moins bien les candidats aux diplômes étrangers, si bien que des personnes compétentes ne sont pas convoquées en entretien*, si.\n\n**Note, puis agis.** Évalue la probabilité et la gravité de 1 (faible) à 3 (forte), puis multiplie-les\u00a0: un 6 ou un 9 passe en premier. Pour chaque risque sérieux, choisis une **mesure d’atténuation**, de la plus forte à la plus faible\u00a0: **supprimer** la fonction qui le cause\u00a0; le rendre **moins probable** (de meilleures données, des tests, des limites)\u00a0; le rendre **moins grave** (une personne vérifie avant toute décision définitive, un recours facile, une annulation possible)\u00a0; le **détecter** (une surveillance, un bouton de signalement)\u00a0; ou **informer** les gens de ce qui subsiste, la plus faible à elle seule. Ce qui reste, c’est le **risque résiduel**\u00a0: note qui l’accepte, et pourquoi. Tout cela figure dans un **registre des risques**, un tableau que tu reprends chaque fois que le produit change.',
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
                heading: 'The rules: the EU AI Act and data protection',
                body: "Laws turn part of this thinking into obligations. Here is the general picture of two European laws that many AI products meet: a map, not legal advice. Before a real launch, check the official texts or ask an expert.\n\n**The EU AI Act**, adopted in 2024, applies to AI systems sold or used in the European Union, even when the company is based elsewhere. Its rules come in stages: the bans have applied since February 2025, and most other obligations follow over the next few years. Its approach is **risk-based**: the greater the possible harm, the stricter the rules. It is often summed up in four levels:\n\n| Level | Examples | What it means |\n|---|---|---|\n| **Unacceptable** | Social scoring; harmful manipulation; exploiting people's age or disability; recognising emotions at work or at school (except for medical or safety reasons); scraping faces from the internet for recognition databases | Banned |\n| **High risk** | AI that decides admission to a school, evaluates what students have learned, watches them during tests, screens CVs or scores credit; safety components of products such as medical devices | Strict duties before and after launch |\n| **Transparency** | Chatbots; generated images, audio and video; deepfakes | Tell people they are dealing with AI; mark or label generated content |\n| **Minimal** | Spam filters, AI in video games | No new duties |\n\nA high-risk system needs, among other things, risk management for its whole life, good-quality data, documentation, logs, **human oversight** (as in *Design an agent with a human in the loop*), and accuracy, robustness and security, all checked before it goes on sale. Providers of general-purpose models, like the LLMs of module 1, have duties of their own, but building on their model does not hand your duties to them: whoever offers an AI system under their own name is its **provider**.\n\n**Data protection.** The EU's **General Data Protection Regulation** (GDPR), applied since 2018, protects **personal data**: any information about a person who can be identified, directly or indirectly. Its principles make a good design checklist:\n\n- **Lawfulness, fairness and transparency:** a legal basis for each use, and plain words about what you collect and why.\n- **Purpose limitation:** data collected for revision is not reused for advertising.\n- **Data minimisation:** collect only what the feature needs.\n- **Accuracy** and **storage limitation:** correct mistakes, and delete data once it is no longer needed.\n- **Integrity and confidentiality**, and **accountability:** keep data secure, and be able to show that you follow all of this.\n\nPeople have rights: to see their data, correct it, have it erased and, with some exceptions, not to be subject to a decision taken solely by automated means that significantly affects them. Health, religious or biometric data get extra protection, and children's data needs particular care. If your product sends messages to a model provider, know where they go, how long they are kept and whether they are used for training: your users' words travel (module 1). Processing likely to be high risk needs a **data protection impact assessment** before it starts. Many other countries have similar laws: check those of the places where your users live.",
              },
              fr: {
                heading:
                  'Les règles\u00a0: le règlement européen sur l’IA et la protection des données',
                body: 'La loi transforme une partie de cette réflexion en obligations. Voici les grandes lignes de deux textes européens que rencontrent de nombreux produits d’IA\u00a0: une carte, pas un avis juridique. Avant un vrai lancement, consulte les textes officiels ou demande l’avis d’un spécialiste.\n\n**Le règlement européen sur l’IA** (*AI Act*), adopté en 2024, s’applique aux systèmes d’IA vendus ou utilisés dans l’Union européenne, même quand l’entreprise est installée ailleurs. Ses règles entrent en application par étapes\u00a0: les interdictions s’appliquent depuis février 2025, et la plupart des autres obligations s’échelonnent sur les années qui viennent. Son approche est **fondée sur les risques**\u00a0: plus le préjudice possible est grand, plus les règles sont strictes. On la résume souvent en quatre niveaux\u00a0:\n\n| Niveau | Exemples | Ce que cela implique |\n|---|---|---|\n| **Inacceptable** | La notation sociale\u00a0; la manipulation préjudiciable\u00a0; l’exploitation de l’âge ou du handicap des personnes\u00a0; la reconnaissance des émotions au travail ou à l’école (sauf pour des raisons médicales ou de sécurité)\u00a0; la collecte de visages sur Internet pour des bases de reconnaissance faciale | Interdit |\n| **Haut risque** | Une IA qui décide de l’admission dans un établissement, évalue les acquis des élèves, les surveille pendant les examens, trie des CV ou évalue la solvabilité\u00a0; les composants de sécurité de produits comme les dispositifs médicaux | Des obligations strictes avant et après la mise sur le marché |\n| **Transparence** | Les chatbots\u00a0; les images, sons et vidéos générés\u00a0; les deepfakes | Dire aux gens qu’ils ont affaire à une IA\u00a0; marquer ou signaler les contenus générés |\n| **Minimal** | Les filtres antispam, l’IA dans les jeux vidéo | Pas de nouvelle obligation |\n\nUn système à haut risque exige notamment une gestion des risques sur toute sa durée de vie, des données de qualité, une documentation, des journaux, un **contrôle humain** (comme dans *Conçois un agent avec un humain dans la boucle*), ainsi que de l’exactitude, de la robustesse et de la sécurité, le tout vérifié avant la mise en vente. Les fournisseurs de modèles à usage général, comme les LLM du module\u00a01, ont leurs propres obligations, mais construire sur leur modèle ne leur transfère pas les tiennes\u00a0: celui qui propose un système d’IA sous son propre nom en est le **fournisseur**.\n\n**La protection des données.** Le **règlement général sur la protection des données** (RGPD) de l’Union européenne, appliqué depuis 2018, protège les **données personnelles**\u00a0: toute information concernant une personne identifiable, directement ou indirectement. Ses principes forment une bonne liste de contrôle pour la conception\u00a0:\n\n- **Licéité, loyauté et transparence\u00a0:** une base légale pour chaque usage, et des mots simples pour dire ce que tu collectes et pourquoi.\n- **Limitation des finalités\u00a0:** des données collectées pour réviser ne sont pas réutilisées pour la publicité.\n- **Minimisation des données\u00a0:** ne collecte que ce dont la fonction a besoin.\n- **Exactitude** et **limitation de la conservation\u00a0:** corrige les erreurs, et supprime les données dès qu’elles ne sont plus nécessaires.\n- **Intégrité et confidentialité**, et **responsabilité\u00a0:** protège les données, et sois capable de prouver que tu respectes tout cela.\n\nLes personnes ont des droits\u00a0: consulter leurs données, les rectifier, les faire effacer et, sauf exceptions, ne pas faire l’objet d’une décision fondée exclusivement sur un traitement automatisé qui les affecte de manière importante. Les données de santé, religieuses ou biométriques sont davantage protégées, et les données des enfants exigent une attention particulière. Si ton produit envoie des messages à un fournisseur de modèle, sache où ils vont, combien de temps ils sont conservés et s’ils servent à l’entraînement\u00a0: les mots de tes utilisateurs voyagent (module\u00a01). Un traitement susceptible d’engendrer un risque élevé exige une **analyse d’impact relative à la protection des données** (AIPD) avant de commencer. Beaucoup d’autres pays ont des lois comparables\u00a0: vérifie celles des pays où vivent tes utilisateurs.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Earning trust: transparency, accessibility and security',
                body: "Obeying the law is the floor, not the ceiling. People trust a product that is honest about what it is, works for them, and keeps their data and accounts safe.\n\n**Transparency.**\n\n- Say that it is AI, from the start, and label what it generates.\n- Say what it is for and what it cannot do, in plain words, next to the feature: *Answers come from the club handbook and can be wrong: check the cited page.*\n- Show sources that users can check, as in *Grounding, retrieval and evaluation*.\n- For any decision about a person, give the main reasons, a route to a human and a simple way to appeal.\n- Publish what you tested, the results and the known limits. Never present the product as a person.\n\n**Accessibility.** The World Health Organization estimates that about one person in six lives with a significant disability. The W3C's **Web Content Accessibility Guidelines** (WCAG) rest on four principles: content must be **perceivable** (text alternatives for images, captions for audio and video), **operable** (everything works with a keyboard), **understandable** (plain language, clear error messages) and **robust** (it works with screen readers and other assistive technologies). In the EU, the European Accessibility Act has required many digital products and services, such as online shops, e-books and banking apps, to be accessible since June 2025. AI brings its own traps, such as a voice interface that misunderstands some accents or ways of speaking, and its own help, such as describing images or simplifying a text: test both with the people concerned.\n\n**Security.** Think like an attacker: *how could someone misuse, fool or overload this?* Besides prompt injection and excessive agency (module 2), the OWASP list for LLM applications warns about leaks of sensitive information (another user's data or your system prompt in an answer), output used without checks (model text run as code or shown as a web page) and unbounded consumption (someone runs up your bill with thousands of requests). The basics: keep API keys on your server, never in the app; let each user reach only their own data; treat model output as untrusted; cap requests per user; log without more personal data than you need; and plan the bad day: who is warned, how the feature is switched off, how users are told.\n\nTrust takes months to build and one incident to lose. Each row of your risk register is a promise about how you will keep it.",
              },
              fr: {
                heading: 'Gagner la confiance\u00a0: transparence, accessibilité et sécurité',
                body: 'Respecter la loi, c’est le minimum, pas l’objectif. On fait confiance à un produit honnête sur ce qu’il est, qui fonctionne pour nous et qui protège nos données et nos comptes.\n\n**La transparence.**\n\n- Dis que c’est une IA, dès le début, et signale ce qu’elle génère.\n- Dis à quoi elle sert et ce qu’elle ne sait pas faire, avec des mots simples, à côté de la fonction\u00a0: *Les réponses viennent du règlement du club et peuvent être fausses\u00a0: vérifie la page citée.*\n- Montre des sources que les utilisateurs peuvent vérifier, comme dans *Ancrage, récupération et évaluation*.\n- Pour toute décision qui concerne une personne, donne les principales raisons, un moyen de joindre un humain et une façon simple de contester.\n- Publie ce que tu as testé, les résultats et les limites connues. Ne présente jamais le produit comme une personne.\n\n**L’accessibilité.** L’Organisation mondiale de la santé estime qu’environ une personne sur six vit avec un handicap important. Les **Règles pour l’accessibilité des contenus Web** (WCAG) du W3C reposent sur quatre principes\u00a0: un contenu doit être **perceptible** (des textes de remplacement pour les images, des sous-titres pour l’audio et la vidéo), **utilisable** (tout fonctionne au clavier), **compréhensible** (une langue simple, des messages d’erreur clairs) et **robuste** (il fonctionne avec les lecteurs d’écran et les autres technologies d’assistance). Dans l’Union européenne, l’acte européen sur l’accessibilité impose depuis juin 2025 à de nombreux produits et services numériques, comme les boutiques en ligne, les livres numériques et les applications bancaires, d’être accessibles. L’IA apporte ses propres pièges, comme une interface vocale qui comprend mal certains accents ou certaines façons de parler, et sa propre aide, comme décrire des images ou simplifier un texte\u00a0: teste les deux avec les personnes concernées.\n\n**La sécurité.** Pense comme un attaquant\u00a0: *comment quelqu’un pourrait-il détourner, tromper ou surcharger ce produit\u00a0?* En plus de l’injection de prompt et de l’autonomie excessive (module\u00a02), la liste de l’OWASP pour les applications de LLM met en garde contre la divulgation d’informations sensibles (les données d’un autre utilisateur ou ton prompt système dans une réponse), les sorties utilisées sans vérification (un texte du modèle exécuté comme du code ou affiché comme une page web) et la consommation illimitée (quelqu’un fait exploser ta facture avec des milliers de requêtes). Les bases\u00a0: garde les clés d’API sur ton serveur, jamais dans l’application\u00a0; ne laisse chaque utilisateur accéder qu’à ses propres données\u00a0; traite les sorties du modèle comme non fiables\u00a0; plafonne les requêtes par utilisateur\u00a0; tiens des journaux sans plus de données personnelles que nécessaire\u00a0; et prépare le jour où tout va mal\u00a0: qui est prévenu, comment couper la fonction, comment informer les utilisateurs.\n\nLa confiance met des mois à se construire et un seul incident à se perdre. Chaque ligne de ton registre des risques est une promesse sur la façon dont tu la garderas.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Write a risk register',
                body: "Choose one of these invented products, or the product idea you worked on in module 3 (with no personal data):\n\n- **QuizCraft** turns a student's own class notes into revision quizzes, with a chatbot that explains wrong answers.\n- **Shortlist** reads the CVs sent to a chain of shops for summer jobs and ranks the applicants for the manager.\n- **ExamWatch** watches students through their webcam during online tests and flags anyone who seems to be cheating.\n\nOn paper or in your notebook:\n\n1. Describe the product in two sentences: who uses it, who is affected without using it (including any group it might serve worse), and what it produces or decides.\n2. Find at least six risks from at least four families of the table above, each written as cause → event → harm.\n3. Score each one: likelihood (L) and severity (S) from 1 to 3, then L × S. Sort the rows.\n4. For your three highest scores, write a mitigation, who is responsible for it, how you will check that it works, and the residual risk.\n5. Place the product on the AI Act's four levels and justify your choice in one sentence. Could a feature you might add later, such as guessing how nervous a student feels, turn it into a banned practice?\n6. Write the two-line notice that users see before they start: what the product is, what it does with their data, and its main limit.\n\nUse these columns. The first row shows the idea with the help bot of module 1:\n\n| # | Cause → event → harm | Who | L | S | L × S | Mitigation | Owner | How we check | Residual |\n|---|---|---|---|---|---|---|---|---|---|\n| 1 | A question is not in the FAQ of *Lumo* → its help bot invents a warranty term → a customer relies on it and loses money | Customers | 2 | 2 | 4 | Answer only from cited sources, allow *I don't know*, link to the warranty page | Developer | The evaluation set, rerun after every change | Low |\n\nKeep your register: you can build on it when you plan your startup in module 5.",
              },
              fr: {
                heading: 'Rédige un registre des risques',
                body: 'Choisis l’un de ces produits inventés, ou l’idée de produit sur laquelle tu as travaillé au module\u00a03 (sans données personnelles)\u00a0:\n\n- **QuizCraft** transforme les notes de cours d’un élève en quiz de révision, avec un chatbot qui explique les mauvaises réponses.\n- **Shortlist** lit les CV envoyés à une chaîne de magasins pour des emplois d’été et classe les candidats pour le responsable.\n- **ExamWatch** surveille les élèves par leur webcam pendant les examens en ligne et signale ceux qui semblent tricher.\n\nSur papier ou dans ton cahier\u00a0:\n\n1. Décris le produit en deux phrases\u00a0: qui l’utilise, qui est concerné sans l’utiliser (y compris tout groupe qu’il pourrait moins bien servir), et ce qu’il produit ou décide.\n2. Trouve au moins six risques dans au moins quatre familles du tableau ci-dessus, chacun écrit sous la forme cause → événement → préjudice.\n3. Note chacun\u00a0: probabilité (P) et gravité (G) de 1 à 3, puis P × G. Trie les lignes.\n4. Pour tes trois notes les plus élevées, écris une mesure d’atténuation, qui en est responsable, comment tu vérifieras qu’elle fonctionne, et le risque résiduel.\n5. Place le produit sur les quatre niveaux du règlement européen sur l’IA et justifie ton choix en une phrase. Une fonction que tu pourrais ajouter plus tard, comme deviner le degré de nervosité d’un élève, en ferait-elle une pratique interdite\u00a0?\n6. Écris l’avis de deux lignes que les utilisateurs voient avant de commencer\u00a0: ce qu’est le produit, ce qu’il fait de leurs données, et sa principale limite.\n\nUtilise ces colonnes. La première ligne montre l’idée avec le bot d’aide du module\u00a01\u00a0:\n\n| n° | Cause → événement → préjudice | Qui | P | G | P × G | Mesure | Responsable | Comment on vérifie | Résiduel |\n|---|---|---|---|---|---|---|---|---|---|\n| 1 | Une question ne figure pas dans la FAQ de *Lumo* → son bot d’aide invente une condition de garantie → un client s’y fie et perd de l’argent | Clients | 2 | 2 | 4 | Répondre uniquement à partir de sources citées, autoriser le *je ne sais pas*, renvoyer à la page de la garantie | Développeur | Le jeu d’évaluation, relancé après chaque modification | Faible |\n\nGarde ton registre\u00a0: tu pourras t’en servir quand tu planifieras ta start-up au module\u00a05.',
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
                  'Type the three highest-scoring rows of your register and your AI Act level (no names or personal details), and ask the AI tutor to review them: does each risk name a cause, an event and a harm, who or what have you missed, and which mitigation is too vague to check? It should ask you questions, not write rows for you. You decide which remarks to accept.',
                starterPrompt:
                  'Here are the top three rows of the risk register for my AI product, [describe it in one sentence]: [cause, event and harm, scores, mitigation, how we check]. I placed it at the [level] level of the EU AI Act because [reason]. Review this like a risk assessor and ask me questions: is each risk specific, who or what have I missed, and which mitigation is too vague to check? Do not rewrite my rows.',
              },
              fr: {
                instructions:
                  'Tape les trois lignes les mieux notées de ton registre et ton niveau dans le règlement européen sur l’IA (sans noms ni informations personnelles), et demande au tuteur IA de les relire\u00a0: chaque risque nomme-t-il une cause, un événement et un préjudice, qui ou quoi as-tu oublié, et quelle mesure est trop vague pour être vérifiée\u00a0? Il doit te poser des questions, pas écrire des lignes à ta place. C’est toi qui décides quelles remarques retenir.',
                starterPrompt:
                  'Voici les trois premières lignes du registre des risques de mon produit d’IA, [décris-le en une phrase]\u00a0: [cause, événement et préjudice, notes, mesure, comment on vérifie]. Je l’ai placé au niveau [niveau] du règlement européen sur l’IA parce que [raison]. Relis cela comme un évaluateur de risques et pose-moi des questions\u00a0: chaque risque est-il précis, qui ou quoi ai-je oublié, et quelle mesure est trop vague pour être vérifiée\u00a0? Ne réécris pas mes lignes.',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm4-l1-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Look at the riskiest row of your register. Why does it come first, and who would be harmed if your mitigation failed? Which residual risk would you accept and tell users about, and which one would make you change or drop a feature? Finally, name one thing your product would do to earn the trust of someone it affects who never uses it.',
              },
              fr: {
                prompt:
                  'Regarde la ligne la plus risquée de ton registre. Pourquoi arrive-t-elle en tête, et qui serait lésé si ta mesure échouait\u00a0? Quel risque résiduel accepterais-tu en le signalant aux utilisateurs, et lequel te ferait modifier ou abandonner une fonction\u00a0? Enfin, cite une chose que ferait ton produit pour gagner la confiance d’une personne qu’il concerne sans qu’elle l’utilise jamais.',
              },
            },
            data: { minLength: 120 },
          },
        ],
      },
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Business models and impact',
              summary:
                'What an AI product costs to run, how it can charge, what makes it hard to copy, and what it changes for jobs and skills, for the planet and in the hands of people who would misuse it.',
            },
            fr: {
              title: 'Modèles économiques et impacts',
              summary:
                'Ce que coûte le fonctionnement d’un produit d’IA, comment le faire payer, ce qui le rend difficile à copier, et ce qu’il change pour l’emploi et les compétences, pour la planète et entre les mains de ceux qui voudraient le détourner.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'Losing money at $200 a month',
                body: "In December 2024, OpenAI launched ChatGPT Pro, a subscription at $200 a month. A few weeks later, in January 2025, its chief executive, Sam Altman, wrote on social media that the company was losing money on those subscriptions: people were using them much more than expected.\n\nFor most software, one more user costs almost nothing: the code is written once, and copying it is free. An AI product is different. Every answer runs a large model on expensive chips, and a user who sends ten times as many requests costs about ten times as much. A flat price that looks generous can lose money on the heaviest users.\n\nCosts are only the first of the questions a product team must answer. How will it charge, and who will pay? Why could a competitor not copy it next week? And what will it change beyond its own accounts: for people's jobs and skills, for the planet, and in the hands of someone who wants to cause harm?",
              },
              fr: {
                heading: 'Perdre de l’argent à 200\u00a0dollars par mois',
                body: 'En décembre 2024, OpenAI a lancé ChatGPT Pro, un abonnement à 200\u00a0dollars par mois. Quelques semaines plus tard, en janvier 2025, son directeur général, Sam Altman, a écrit sur les réseaux sociaux que l’entreprise perdait de l’argent sur ces abonnements\u00a0: les gens s’en servaient beaucoup plus que prévu.\n\nPour la plupart des logiciels, un utilisateur de plus ne coûte presque rien\u00a0: le code est écrit une fois, et le copier est gratuit. Un produit d’IA est différent. Chaque réponse fait tourner un grand modèle sur des puces coûteuses, et un utilisateur qui envoie dix fois plus de requêtes coûte à peu près dix fois plus cher. Un prix forfaitaire qui paraît généreux peut faire perdre de l’argent sur les plus gros utilisateurs.\n\nLes coûts ne sont que la première des questions auxquelles une équipe produit doit répondre. Comment faire payer, et qui paiera\u00a0? Pourquoi un concurrent ne pourrait-il pas copier le produit la semaine suivante\u00a0? Et que changera-t-il au-delà de ses propres comptes\u00a0: pour l’emploi et les compétences, pour la planète, et entre les mains de quelqu’un qui veut nuire\u00a0?',
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
                heading: 'What an AI product costs to run',
                body: "**Variable costs** grow with every request:\n\n- **Tokens.** Providers charge per million tokens, with one price for **input** (everything sent: instructions, documents, the conversation) and another for **output** (what the model writes); output usually costs more. Remember module 2: an agent rereads its whole, growing context at every step.\n- **Model size.** A larger model costs more per token than a smaller one, and a model that reasons before it answers writes extra output tokens that you pay for.\n- **Everything around the model:** retrieval and storage for RAG, moderation, logs, payment fees.\n\n**Fixed costs** do not depend on usage: building and testing the product, evaluation, security, support, compliance work such as your risk register, and the salaries behind all of it.\n\n**Unit economics** brings it all down to one user. For a subscription:\n\n- cost per user per month = requests × (input tokens × input price + output tokens × output price)\n- **gross margin** = (revenue − variable costs) ÷ revenue\n\nWith invented prices of €1 per million input tokens and €4 per million output tokens, a request with 2,000 input tokens and 500 output tokens costs €0.002 + €0.002 = €0.004. A typical user who sends 300 requests a month costs €1.20; a heavy user who sends 3,000 costs €12, more than a €5 subscription brings in.\n\n**Levers that cut costs without hurting users:** send easy requests to a smaller model and keep the large one for hard cases (**routing**); reuse answers and long prompts that repeat (**caching**); shorten instructions and retrieved text; cap the length of answers; set fair-use limits per user; run jobs that can wait in batches. Check every lever with your evaluation set (module 1): a cheaper wrong answer is not a saving.\n\n**Rent or run?** Calling a provider's model through an **API** needs no hardware and costs per use, but your users' data leaves your servers. Running an **open-weight** model, whose parameters are published, gives you more control over the data, but you pay for the chips and the people who run them, busy or idle.",
              },
              fr: {
                heading: 'Ce que coûte le fonctionnement d’un produit d’IA',
                body: 'Les **coûts variables** augmentent à chaque requête\u00a0:\n\n- **Les tokens.** Les fournisseurs facturent au million de tokens, avec un prix pour l’**entrée** (tout ce qui est envoyé\u00a0: instructions, documents, conversation) et un autre pour la **sortie** (ce qu’écrit le modèle)\u00a0; la sortie coûte en général plus cher. Souviens-toi du module\u00a02\u00a0: un agent relit tout son contexte, qui grossit, à chaque étape.\n- **La taille du modèle.** Un grand modèle coûte plus cher par token qu’un petit, et un modèle qui raisonne avant de répondre écrit des tokens de sortie supplémentaires, que tu paies.\n- **Tout ce qui entoure le modèle\u00a0:** la recherche et le stockage pour le RAG, la modération, les journaux, les frais de paiement.\n\nLes **coûts fixes** ne dépendent pas de l’usage\u00a0: construire et tester le produit, l’évaluation, la sécurité, l’assistance, le travail de mise en conformité comme ton registre des risques, et les salaires derrière tout cela.\n\nL’**économie unitaire** (*unit economics*) ramène tout cela à un seul utilisateur. Pour un abonnement\u00a0:\n\n- coût par utilisateur et par mois = requêtes × (tokens d’entrée × prix d’entrée + tokens de sortie × prix de sortie)\n- **marge brute** = (recettes − coûts variables) ÷ recettes\n\nAvec des prix inventés de 1\u00a0€ par million de tokens d’entrée et de 4\u00a0€ par million de tokens de sortie, une requête de 2\u00a0000\u00a0tokens d’entrée et 500\u00a0tokens de sortie coûte 0,002\u00a0€ + 0,002\u00a0€ = 0,004\u00a0€. Un utilisateur type qui envoie 300\u00a0requêtes par mois coûte 1,20\u00a0€\u00a0; un gros utilisateur qui en envoie 3\u00a0000 coûte 12\u00a0€, plus que ce que rapporte un abonnement à 5\u00a0€.\n\n**Les leviers qui réduisent les coûts sans nuire aux utilisateurs\u00a0:** envoie les requêtes faciles à un petit modèle et garde le grand pour les cas difficiles (le **routage**)\u00a0; réutilise les réponses et les longs prompts qui se répètent (la **mise en cache**)\u00a0; raccourcis les instructions et les textes récupérés\u00a0; limite la longueur des réponses\u00a0; fixe des limites d’usage raisonnable par utilisateur\u00a0; traite par lots les tâches qui peuvent attendre. Vérifie chaque levier avec ton jeu d’évaluation (module\u00a01)\u00a0: une réponse moins chère mais fausse n’est pas une économie.\n\n**Louer ou faire tourner soi-même\u00a0?** Appeler le modèle d’un fournisseur par une **API** ne demande aucun matériel et se paie à l’usage, mais les données de tes utilisateurs quittent tes serveurs. Faire tourner un modèle **à poids ouverts** (*open-weight*), dont les paramètres sont publiés, te donne plus de contrôle sur les données, mais tu paies les puces et les personnes qui les font fonctionner, qu’elles servent ou non.',
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
                heading: 'Pricing, and what makes a product hard to copy',
                body: "**Who pays, and how?** The user is not always the customer: a school can pay for an app its students use, and advertisers pay for a free app's audience.\n\n| Model | How it works | Watch out for |\n|---|---|---|\n| **Freemium** | Free with limits; a paid plan unlocks more | Free users cost tokens too: set the limits from your unit economics |\n| **Subscription** | A fixed price per month | Heavy users, as in the hook: fair-use limits |\n| **Usage-based** | Pay per request, per credit or per token | Bills that customers find hard to predict |\n| **Per seat** | An organisation pays for each user, often per year | The buyer is not the user; long sales |\n| **Per outcome** | Pay per resolved request or finished document | Agreeing on what counts as an outcome |\n| **Advertising** | Free for users, paid by advertisers | Pressure to collect data and capture attention; strict rules for minors |\n\n**What makes a product hard to copy?** If your product is a good prompt on top of a popular model, anyone can rebuild it in a weekend, including the model's provider, which can add your feature to its own app. The model is rarely your advantage: your competitors can rent the same one. Lasting advantages come from elsewhere:\n\n- **Deep knowledge of one problem and its users** (module 3), which shows in a hundred small choices.\n- **A place in the workflow:** the product fits into tools people already use every day.\n- **Data and evaluations nobody else has:** examples and test sets collected lawfully and with consent, and feedback from real use that improves quality over time.\n- **Distribution:** a way to reach users, such as partnerships with schools or clubs.\n- **Trust:** a record on safety, privacy and accessibility, slow to earn, as the previous lesson showed.\n\nSwitching costs also keep customers, but trapping them is not a strategy to be proud of, and in many cases the GDPR gives people the right to take their data with them.",
              },
              fr: {
                heading: 'Fixer un prix, et ce qui rend un produit difficile à copier',
                body: '**Qui paie, et comment\u00a0?** L’utilisateur n’est pas toujours le client\u00a0: un établissement peut payer une application qu’utilisent ses élèves, et des annonceurs paient pour l’audience d’une application gratuite.\n\n| Modèle | Comment ça marche | Points de vigilance |\n|---|---|---|\n| **Freemium** | Gratuit avec des limites\u00a0; une offre payante en débloque davantage | Les utilisateurs gratuits coûtent aussi des tokens\u00a0: fixe les limites d’après ton économie unitaire |\n| **Abonnement** | Un prix fixe par mois | Les gros utilisateurs, comme dans l’accroche\u00a0: des limites d’usage raisonnable |\n| **Paiement à l’usage** | Paiement par requête, par crédit ou par token | Des factures difficiles à prévoir pour le client |\n| **Par utilisateur** (*per seat*) | Une organisation paie pour chaque utilisateur, souvent à l’année | L’acheteur n’est pas l’utilisateur\u00a0; des ventes longues |\n| **Au résultat** | Paiement par demande résolue ou par document terminé | Se mettre d’accord sur ce qui compte comme un résultat |\n| **Publicité** | Gratuit pour les utilisateurs, payé par les annonceurs | La tentation de collecter des données et de capter l’attention\u00a0; des règles strictes pour les mineurs |\n\n**Qu’est-ce qui rend un produit difficile à copier\u00a0?** Si ton produit est un bon prompt posé sur un modèle connu, n’importe qui peut le reconstruire en un week-end, y compris le fournisseur du modèle, qui peut ajouter ta fonction à sa propre application. Le modèle est rarement ton avantage\u00a0: tes concurrents peuvent louer le même. Les avantages durables viennent d’ailleurs\u00a0:\n\n- **Une connaissance approfondie d’un problème et de ses utilisateurs** (module\u00a03), qui se voit dans une centaine de petits choix.\n- **Une place dans le travail quotidien\u00a0:** le produit s’intègre aux outils que les gens utilisent déjà tous les jours.\n- **Des données et des évaluations que personne d’autre n’a\u00a0:** des exemples et des jeux de test collectés légalement et avec consentement, et les retours d’un usage réel, qui améliorent la qualité avec le temps.\n- **La distribution\u00a0:** un moyen d’atteindre les utilisateurs, comme des partenariats avec des établissements ou des clubs.\n- **La confiance\u00a0:** une réputation en matière de sécurité, de vie privée et d’accessibilité, longue à gagner, comme l’a montré la leçon précédente.\n\nLe coût d’un changement de fournisseur retient aussi les clients, mais les piéger n’est pas une stratégie dont on peut être fier, et dans bien des cas le RGPD donne aux personnes le droit d’emporter leurs données.',
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
                heading: 'What it changes: work, the planet and misuse',
                body: "**Jobs and skills.** AI usually changes **tasks** before it changes whole jobs: some tasks are automated, others assisted, and new ones appear, such as checking outputs and writing evaluation sets. In 2024, the International Monetary Fund estimated that almost 40% of jobs worldwide are exposed to AI, which can mean help as much as replacement. We are only starting to measure what really happens. In one well-known study of thousands of customer-support agents at one company, first published in 2023 by Erik Brynjolfsson, Danielle Li and Lindsey Raymond, an AI assistant raised the number of issues resolved per hour by about 14% on average, and by about 34% for novice and less-skilled agents, with little effect on the most experienced. Others worry about the other side: if beginners hand their first tasks to AI, how do they become experts? As a product maker, the choice is yours: help people rather than replace their judgement, help users learn (let them try before the AI answers), involve the workers affected, and say honestly what your product automates.\n\n**The planet.** Models run in data centres that use electricity, often water for cooling, and chips whose manufacture takes metals and energy. The International Energy Agency estimated that data centres used about 1.5% of the world's electricity in 2024, and expects their demand to more than double by 2030, with AI as the main driver. The footprint of one request depends on the model's size, the length of the answer, the hardware, and where and when the electricity is produced, and few companies publish measured figures. Bigger models and longer outputs use more, and a 2023 study by researchers at Hugging Face and Carnegie Mellon University found that generating images used far more energy than the text tasks they tested. The cost levers of this lesson are also green levers: the right-sized model, caching, short answers, and generating only what someone asked for.\n\n**Misuse.** Most capabilities are **dual-use**. Voice cloning reads audiobooks, and imitates a relative's voice in a scam; image generation illustrates stories, and makes deepfakes; text generation writes help pages, and phishing emails by the thousand. In 2024, the engineering firm Arup confirmed that an employee in Hong Kong had transferred about 25 million US dollars to fraudsters after a video call in which the \"colleagues\" were deepfakes. For each feature, write a **misuse case**: who would want to abuse it, how, and what it would cost them. Then design against it: refuse the riskiest uses (no voice cloning without proof of consent), add friction where harm is easy (limits, verification), label generated content, offer a report button and act on reports, and add these rows to your risk register.",
              },
              fr: {
                heading: 'Ce que cela change\u00a0: le travail, la planète et les détournements',
                body: '**L’emploi et les compétences.** L’IA transforme le plus souvent des **tâches** avant de transformer des métiers entiers\u00a0: certaines tâches sont automatisées, d’autres assistées, et de nouvelles apparaissent, comme vérifier les sorties ou rédiger des jeux d’évaluation. En 2024, le Fonds monétaire international a estimé que près de 40\u00a0% des emplois dans le monde sont exposés à l’IA, ce qui peut signifier une aide autant qu’un remplacement. On commence seulement à mesurer ce qui se passe réellement. Dans une étude connue portant sur des milliers d’agents du service client d’une entreprise, publiée pour la première fois en 2023 par Erik Brynjolfsson, Danielle Li et Lindsey Raymond, un assistant d’IA a augmenté le nombre de demandes résolues par heure d’environ 14\u00a0% en moyenne, et d’environ 34\u00a0% pour les agents débutants et les moins qualifiés, avec peu d’effet sur les plus expérimentés. D’autres s’inquiètent de l’envers du décor\u00a0: si les débutants confient leurs premières tâches à l’IA, comment deviendront-ils experts\u00a0? Comme concepteur de produit, c’est toi qui choisis\u00a0: aider les gens plutôt que remplacer leur jugement, aider les utilisateurs à apprendre (les laisser essayer avant que l’IA ne réponde), associer les travailleurs concernés, et dire honnêtement ce que ton produit automatise.\n\n**La planète.** Les modèles tournent dans des centres de données qui consomment de l’électricité, souvent de l’eau pour le refroidissement, et des puces dont la fabrication demande des métaux et de l’énergie. L’Agence internationale de l’énergie a estimé que les centres de données ont utilisé environ 1,5\u00a0% de l’électricité mondiale en 2024, et prévoit que leur demande fera plus que doubler d’ici 2030, l’IA en étant le principal moteur. L’empreinte d’une requête dépend de la taille du modèle, de la longueur de la réponse, du matériel, ainsi que du lieu et du moment où l’électricité est produite, et peu d’entreprises publient des chiffres mesurés. Les grands modèles et les réponses longues consomment davantage, et une étude de 2023 menée par des chercheurs de Hugging Face et de l’université Carnegie Mellon a montré que générer des images consommait bien plus d’énergie que les tâches sur du texte qu’ils avaient testées. Les leviers de coût de cette leçon sont aussi des leviers écologiques\u00a0: le modèle de la bonne taille, la mise en cache, des réponses courtes, et ne générer que ce que quelqu’un a demandé.\n\n**Les détournements.** La plupart des capacités sont à **double usage**. Le clonage de voix lit des livres audio, et imite la voix d’un proche dans une arnaque\u00a0; la génération d’images illustre des histoires, et fabrique des deepfakes\u00a0; la génération de texte rédige des pages d’aide, et des courriels d’hameçonnage par milliers. En 2024, le cabinet d’ingénierie Arup a confirmé qu’un employé de Hong Kong avait transféré environ 25\u00a0millions de dollars américains à des escrocs après un appel vidéo où les «\u00a0collègues\u00a0» étaient des deepfakes. Pour chaque fonction, écris un **cas de détournement** (*misuse case*)\u00a0: qui voudrait en abuser, comment, et ce que cela lui coûterait. Puis conçois le produit pour y résister\u00a0: refuse les usages les plus risqués (pas de clonage de voix sans preuve du consentement), ajoute de la friction là où nuire est facile (des limites, des vérifications), signale les contenus générés, propose un bouton de signalement et donne suite aux signalements, et ajoute ces lignes à ton registre des risques.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Work out the unit economics of an invented AI revision coach. Every price and number in the code is invented for this exercise: real prices differ between providers and change often. Your code is saved, not run, so trace it by hand (a calculator is fine):\n\n1. Write the three lines that the loop prints. Which kind of user loses money, and how does a flat subscription hide it?\n2. Complete the last TODO: the model cost and the revenue of the 100 users of MIX, then the gross margin as a percentage. What share of the model cost do the 5 heavy users cause?\n3. Complete capped: the subscription now includes at most CAP requests a month. Trace the loop and your totals again. What does a heavy user cost now, and what should the app tell them when they reach the cap?\n4. Complete usage_price (1 cent per request) and work out what each kind of user would pay. Which pricing would a student on a budget prefer, and which one makes every user profitable?\n5. In a comment, name two costs that this code leaves out, and one impact of the heavy users that is not counted in euros.',
                hint: 'Work in euros: 2,000 tokens at 1 euro per million cost 2,000 / 1,000,000 x 1 = 0.002 euros. For step 2, multiply the cost of each kind of user by its number in MIX before you add them up, and remember that every user pays the subscription. For step 3, min(requests, CAP) is enough.',
              },
              fr: {
                instructions:
                  'Calcule l’économie unitaire d’un coach de révision IA inventé. Tous les prix et tous les nombres du code sont inventés pour cet exercice\u00a0: les vrais prix varient d’un fournisseur à l’autre et changent souvent. Dans le code, les noms sont en anglais\u00a0: light, typical et heavy désignent les petits utilisateurs, les utilisateurs types et les gros utilisateurs, cost le coût, margin la marge, MIX la répartition de 100 utilisateurs, capped applique le plafond CAP et usage_price calcule un prix à l’usage. Ton code est enregistré, pas exécuté\u00a0: suis-le à la main (la calculatrice est autorisée).\n\n1. Écris les trois lignes qu’affiche la boucle. Quel type d’utilisateur fait perdre de l’argent, et comment un abonnement forfaitaire le cache-t-il\u00a0?\n2. Complète le dernier TODO\u00a0: le coût du modèle et les recettes des 100 utilisateurs de MIX, puis la marge brute en pourcentage. Quelle part du coût du modèle les 5 gros utilisateurs causent-ils\u00a0?\n3. Complète capped\u00a0: l’abonnement comprend désormais au plus CAP requêtes par mois. Suis de nouveau la boucle et tes totaux. Combien coûte maintenant un gros utilisateur, et que doit lui dire l’application quand il atteint le plafond\u00a0?\n4. Complète usage_price (1 centime par requête) et calcule ce que paierait chaque type d’utilisateur. Quelle tarification un élève au budget serré préférerait-il, et laquelle rend chaque utilisateur rentable\u00a0?\n5. Dans un commentaire, cite deux coûts que ce code oublie, et un impact des gros utilisateurs qui ne se compte pas en euros.',
                hint: 'Travaille en euros\u00a0: 2\u00a0000\u00a0tokens à 1\u00a0euro le million coûtent 2\u00a0000 / 1\u00a0000\u00a0000 x 1 = 0,002\u00a0euro. Pour l’étape\u00a02, multiplie le coût de chaque type d’utilisateur par son effectif dans MIX avant d’additionner, et n’oublie pas que chaque utilisateur paie l’abonnement. Pour l’étape\u00a03, min(requests, CAP) suffit.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# Unit economics of an invented AI revision coach. Every price and number is invented',
                '# for this exercise: real prices differ between providers and change often.',
                '',
                'PRICE_IN = 1.00  # euros per million input tokens',
                'PRICE_OUT = 4.00  # euros per million output tokens',
                'SUBSCRIPTION = 5.00  # euros per user per month',
                'CAP = 1_000  # requests a month included in the subscription (step 3)',
                '',
                '# Kind of user: (requests a month, input tokens per request, output tokens per request)',
                'USERS = {',
                '    "light": (100, 2_000, 500),',
                '    "typical": (300, 2_000, 500),',
                '    "heavy": (3_000, 2_000, 500),',
                '}',
                'MIX = {"light": 60, "typical": 35, "heavy": 5}  # how many of each, out of 100 users',
                '',
                '',
                'def model_cost(requests, tokens_in, tokens_out):',
                '    """What one user\'s requests cost in a month, in euros."""',
                '    cost_in = requests * tokens_in / 1_000_000 * PRICE_IN',
                '    cost_out = requests * tokens_out / 1_000_000 * PRICE_OUT',
                '    return cost_in + cost_out',
                '',
                '',
                'def capped(requests):',
                '    # TODO (step 3): return the number of requests served within the fair-use cap.',
                '    return requests',
                '',
                '',
                'def usage_price(requests):',
                '    # TODO (step 4): 1 cent (0.01 euros) per request, instead of the subscription.',
                '    return SUBSCRIPTION',
                '',
                '',
                'for kind, (requests, tokens_in, tokens_out) in USERS.items():',
                '    cost = model_cost(capped(requests), tokens_in, tokens_out)',
                '    margin = SUBSCRIPTION - cost',
                '    print(kind, "costs", round(cost, 2), "margin", round(margin, 2))',
                '',
                '# TODO (step 2): for the 100 users of MIX, add up the model cost and the revenue,',
                '# then print the gross margin, (revenue - cost) / revenue, as a percentage.',
                'total_cost = 0',
                'total_revenue = 0',
                '',
                '# My trace and answers / Ma trace et mes réponses :',
              ),
            },
          },
          {
            id: 'm4-l2-b6',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding of the whole module: risk, regulation and trust, costs and pricing, and what AI products change.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu as compris de tout le module\u00a0: les risques, la réglementation et la confiance, les coûts et les prix, et ce que changent les produits d’IA.',
              },
            },
            data: { quizId: 'quiz-m4' },
          },
          {
            id: 'm4-l2-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Take your product idea from module 3, or one of the invented products of the previous lesson. How would it make money, and who would pay: its users or someone else? Estimate what one heavy user would cost, and say how your pricing would cope. Then choose one impact (on jobs and skills, on the planet, or through misuse) and describe one design choice you would make because of it.',
              },
              fr: {
                prompt:
                  'Reprends ton idée de produit du module\u00a03, ou l’un des produits inventés de la leçon précédente. Comment gagnerait-il de l’argent, et qui paierait\u00a0: ses utilisateurs ou quelqu’un d’autre\u00a0? Estime ce que coûterait un gros utilisateur, et explique comment ta tarification y ferait face. Choisis ensuite un impact (sur l’emploi et les compétences, sur la planète ou par un détournement) et décris un choix de conception que tu ferais à cause de lui.',
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
      id: 'quiz-m4',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: responsible AI, business and society',
            instructions:
              'Seven questions on risk, regulation and trust, costs and pricing, and what AI products change. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: IA responsable, économie et société',
            instructions:
              'Sept questions sur les risques, la réglementation et la confiance, les coûts et les prix, et ce que changent les produits d’IA. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A start-up based outside the EU sells employers in France a program that reads job applications and ranks the candidates. Under the risk-based approach of the EU AI Act, how is this system most likely classified?',
              },
              fr: {
                prompt:
                  'Une start-up installée hors de l’Union européenne vend à des employeurs français un logiciel qui lit les candidatures et classe les candidats. Selon l’approche fondée sur les risques du règlement européen sur l’IA, comment ce système est-il le plus probablement classé\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Banned: AI may not be used in hiring' },
                  fr: { text: 'Interdit\u00a0: l’IA ne peut pas servir au recrutement' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'High risk: it must meet strict duties such as risk management, data quality, logs and human oversight',
                  },
                  fr: {
                    text: 'À haut risque\u00a0: il doit respecter des obligations strictes, comme la gestion des risques, la qualité des données, les journaux et le contrôle humain',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Transparency only: it just has to say that it is AI' },
                  fr: {
                    text: 'Transparence seulement\u00a0: il lui suffit de dire que c’est une IA',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Not covered, because the company is based outside the EU' },
                  fr: {
                    text: 'Non concerné, car l’entreprise est installée hors de l’Union européenne',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Screening and ranking job applicants is one of the high-risk uses that the AI Act lists, so the system must meet strict duties before and after it goes on sale. The Act covers AI systems sold or used in the EU, wherever the company is based.',
              },
              fr: {
                text: 'Le tri et le classement des candidats à un emploi font partie des usages à haut risque que liste le règlement\u00a0: le système doit donc respecter des obligations strictes avant et après sa mise sur le marché. Le règlement couvre les systèmes d’IA vendus ou utilisés dans l’Union européenne, où que l’entreprise soit installée.',
              },
            },
          },
          {
            id: 'q2',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  "A revision app needs only a student's year group to choose the right quizzes, but its sign-up form also asks for their full name, home address and date of birth. Which data-protection principle of the GDPR does this break?",
              },
              fr: {
                prompt:
                  'Une application de révision n’a besoin que du niveau de classe d’un élève pour choisir les bons quiz, mais son formulaire d’inscription demande aussi son nom complet, son adresse et sa date de naissance. Quel principe de protection des données du RGPD enfreint-elle\u00a0?',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'data minimisation',
                'data minimization',
                'minimisation',
                'minimization',
                'the data minimisation principle',
                'principle of data minimisation',
                'data minimisation principle',
                'data minimization principle',
                'minimisation of data',
                'minimising data',
              ],
              fr: [
                'minimisation des données',
                'la minimisation des données',
                'minimisation',
                'la minimisation',
                'principe de minimisation des données',
                'le principe de minimisation des données',
                'principe de minimisation',
                'minimisation de données',
                'minimiser les données',
                'data minimisation',
              ],
            },
            explanation: {
              en: {
                text: 'Data minimisation: collect only the personal data that a feature needs. Data you never collect cannot leak, be misused or need deleting later.',
              },
              fr: {
                text: 'La minimisation des données\u00a0: ne collecter que les données personnelles dont une fonction a besoin. Une donnée jamais collectée ne peut ni fuiter, ni être détournée, ni devoir être effacée plus tard.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt: 'Which line of a risk register is written so that a team can act on it?',
              },
              fr: {
                prompt:
                  'Quelle ligne d’un registre des risques est rédigée de façon qu’une équipe puisse agir\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Bias.' },
                  fr: { text: 'Biais.' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The AI might make mistakes.' },
                  fr: { text: 'L’IA pourrait se tromper.' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Some users may not like the product.' },
                  fr: { text: 'Certains utilisateurs pourraient ne pas aimer le produit.' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Because the voice assistant was tested mostly with one accent, it misunderstands other accents more often, so those users cannot book appointments.',
                  },
                  fr: {
                    text: 'Comme l’assistant vocal a surtout été testé avec un seul accent, il comprend moins bien les autres accents, si bien que ces utilisateurs ne peuvent pas prendre rendez-vous.',
                  },
                },
              },
            ],
            correctOptionIndexes: [3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A useful risk names a cause, an event and a harm, and so the people affected. The team can then choose a mitigation (test with more accents, offer a typed option, let a person take over) and check whether it works.',
              },
              fr: {
                text: 'Un risque utile nomme une cause, un événement et un préjudice, et donc les personnes concernées. L’équipe peut alors choisir une mesure (tester avec plus d’accents, proposer une option écrite, laisser une personne prendre le relais) et vérifier qu’elle fonctionne.',
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
                  "Your product uses another company's language model through an API, so the risks to your users are that company's responsibility, not yours.",
              },
              fr: {
                prompt:
                  'Ton produit utilise le modèle de langage d’une autre entreprise par une API\u00a0: les risques pour tes utilisateurs relèvent donc de la responsabilité de cette entreprise, pas de la tienne.',
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
                text: 'False. Under the AI Act, whoever offers an AI system under their own name is its provider, with the duties that go with it, and you remain responsible for the personal data your product collects and sends. You chose the model, the prompts, the data and the features: the risk register is yours.',
              },
              fr: {
                text: 'Faux. Au sens du règlement européen sur l’IA, celui qui propose un système d’IA sous son propre nom en est le fournisseur, avec les obligations qui vont avec, et tu restes responsable des données personnelles que ton produit collecte et envoie. C’est toi qui as choisi le modèle, les prompts, les données et les fonctions\u00a0: le registre des risques est le tien.',
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
                  'With invented prices of €1 per million input tokens and €4 per million output tokens, each request of a user sends 2,000 input tokens and gets back 500 output tokens. The user makes 1,000 requests a month. What does this user cost in model fees each month?',
              },
              fr: {
                prompt:
                  'Avec des prix inventés de 1\u00a0€ par million de tokens d’entrée et de 4\u00a0€ par million de tokens de sortie, chaque requête d’un utilisateur envoie 2\u00a0000\u00a0tokens d’entrée et reçoit 500\u00a0tokens de sortie. L’utilisateur fait 1\u00a0000\u00a0requêtes par mois. Combien coûte-t-il chaque mois en frais de modèle\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: '€1' },
                  fr: { text: '1\u00a0€' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: '€2.50' },
                  fr: { text: '2,50\u00a0€' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: '€4' },
                  fr: { text: '4\u00a0€' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '€40' },
                  fr: { text: '40\u00a0€' },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: '1,000 × 2,000 = 2 million input tokens, so €2; 1,000 × 500 = 0.5 million output tokens at €4 per million, so €2. Total: €4 a month. With a €5 subscription, this user leaves only €1 to pay for everything else.',
              },
              fr: {
                text: '1\u00a0000 × 2\u00a0000 = 2\u00a0millions de tokens d’entrée, soit 2\u00a0€\u00a0; 1\u00a0000 × 500 = 0,5\u00a0million de tokens de sortie à 4\u00a0€ le million, soit 2\u00a0€. Total\u00a0: 4\u00a0€ par mois. Avec un abonnement à 5\u00a0€, cet utilisateur ne laisse que 1\u00a0€ pour payer tout le reste.',
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
                  "A start-up's homework helper is a well-written prompt on top of a popular model's API. Which of these would make it hardest for a competitor to copy?",
              },
              fr: {
                prompt:
                  'L’aide aux devoirs d’une start-up est un prompt bien écrit posé sur l’API d’un modèle connu. Laquelle de ces options la rendrait la plus difficile à copier pour un concurrent\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Fitting it into the tools that one group of students and teachers already use, improving it with test sets and feedback collected with consent, and building a record of trust',
                  },
                  fr: {
                    text: 'L’intégrer aux outils qu’un groupe d’élèves et d’enseignants utilise déjà, l’améliorer grâce à des jeux de test et à des retours collectés avec consentement, et se bâtir une réputation de confiance',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Keeping the prompt secret' },
                  fr: { text: 'Garder le prompt secret' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Switching to the largest model available' },
                  fr: { text: 'Passer au plus grand modèle disponible' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Setting a lower price than every competitor' },
                  fr: { text: 'Fixer un prix plus bas que tous les concurrents' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A prompt can be rebuilt or even extracted, competitors can rent the same model, and a price can be matched. Deep knowledge of users, a place in their workflow, data and evaluations nobody else has, and trust all take time to build: that is what makes them hard to copy.',
              },
              fr: {
                text: 'Un prompt peut être reconstruit, voire extrait, les concurrents peuvent louer le même modèle, et un prix peut être égalé. Une connaissance approfondie des utilisateurs, une place dans leur travail quotidien, des données et des évaluations que personne d’autre n’a, et la confiance demandent du temps\u00a0: c’est ce qui les rend difficiles à copier.',
              },
            },
          },
          {
            id: 'q7',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'Your app turns text descriptions into images. Which choices reduce its environmental footprint or its risk of misuse? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Ton application transforme des descriptions en images. Quels choix réduisent son empreinte environnementale ou son risque de détournement\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Generate one image by default, and more only when the user asks' },
                  fr: {
                    text: 'Générer une seule image par défaut, et davantage seulement si l’utilisateur le demande',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Generate four high-resolution images for every prompt, so that users always have a choice',
                  },
                  fr: {
                    text: 'Générer quatre images en haute résolution pour chaque prompt, pour que les utilisateurs aient toujours le choix',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Refuse to edit uploaded photos of real people' },
                  fr: {
                    text: 'Refuser de modifier les photos de personnes réelles qui sont téléversées',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Add a visible label to every generated image' },
                  fr: { text: 'Ajouter une mention visible sur chaque image générée' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Remove every limit on requests, so that the most active users never wait',
                  },
                  fr: {
                    text: 'Supprimer toute limite de requêtes, pour que les utilisateurs les plus actifs n’attendent jamais',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Generating only what people ask for saves energy, and images are among the most energy-hungry outputs. Refusing to edit photos of real people and labelling generated images make deepfakes harder. Limits per user curb both abuse and runaway costs, so removing them makes things worse.',
              },
              fr: {
                text: 'Ne générer que ce que les gens demandent économise de l’énergie, et les images font partie des sorties les plus gourmandes. Refuser de modifier des photos de personnes réelles et signaler les images générées rend les deepfakes plus difficiles. Les limites par utilisateur freinent à la fois les abus et l’envolée des coûts\u00a0: les supprimer aggrave les choses.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
