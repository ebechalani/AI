// Module m1 of "From Idea to AI Product" (ages 16-18): advanced generative AI. It opens the course
// and the ai-innovator pathway, so it refers back to nothing; later modules are m2 (AI agents and
// automation), m3 (from problem to product), m4 (responsible AI, business and society) and m5
// (the startup capstone, whose final project is required for the certificate).
// m1-l1: tokens and tokenizers (vocabularies of tens of thousands to a few hundred thousand
// tokens; about four characters per token is a common rule of thumb for English; many other
// languages need more), next-token prediction, the transformer (Google researchers, 2017) and
// attention, pre-training (self-supervised, base model, knowledge cutoff), instruction tuning,
// preference tuning (RLHF; the 2022 InstructGPT result: people preferred a 1.3-billion-parameter
// tuned model to the 175-billion-parameter GPT-3; sycophancy), the human choices behind the data
// (copyright argued in courts, contract raters), the context window (no memory of its own; the
// "lost in the middle" finding), greedy decoding, sampling, temperature and top-p, and the limits
// that follow. The temperature table uses the scores 2, 1 and 0 (softmax, checked with Python 3:
// T=0.5 gives 86.7/11.7/1.6 %, T=1 66.5/24.5/9.0 %, T=2 50.6/30.7/18.6 %; top-p 0.9 at T=1 keeps
// mat and floor, 91 % together). The other probabilities of that block are labelled as made up.
// The video reuses the Code.org "How AI Works" video on chatbots and large language models
// (X-AWdfSFCHQ, curated in build-with-generative-ai m1-l1 and from-ai-user-to-ai-developer
// m5-l1) as a quick overview; its summary repeats only what those summaries state. The code
// activity is a word-level bigram model to trace by hand (checked with Python 3): the first print
// gives robot 1/3, book 1/6, code 1/3, cat 1/6; generate("the", 6) gives "the robot reads the
// robot reads the"; generate("cat", 4) gives "cat reads the robot reads", a sentence that is in
// none of the training sentences; with the learner's apply_temperature, T=0.5 gives 0.4, 0.1,
// 0.4, 0.1 and T=2 about 0.29, 0.21, 0.29, 0.21. Then an explain tutor activity and a reflection.
// m1-l2: the hook is Mata v. Avianca (S.D.N.Y., 2023): six decisions cited in a brief did not
// exist, one lawyer had asked ChatGPT whether they were real, and the judge fined the lawyers and
// their firm. Hallucinations (forms, causes, what does and does not help; the argument that
// training and tests reward a confident guess over "I don't know"), RAG (named in a 2020 paper by
// Patrick Lewis and colleagues at Facebook AI Research and partner universities: chunks, a keyword
// or embedding index, top-k retrieval, the augmented prompt, generation, checks), citations that
// can be checked, a failure table, and an evaluation set (cases, key facts, sources, abstention,
// three scores, rerun the same set, automatic checks against human judges). Then the optional
// Machine Learning for Kids activity RAG-time (worksheet-ragtime.pdf, last updated 29 August 2025;
// "generate text", Scratch 3; no teacher's notes and no French version exist), its paper version
// (closed book, then open book with source cards, for schools that block the site and computers
// that cannot run the model), and a build-stage code activity that scores an evaluation set by
// hand (checked with Python 3: cases 1 and 5 print WRONG, 3 out of 5 correct; case 1 is a false
// negative of the substring check, "2 years" against "two years"; an "I don't know" answer would
// also pass case 2, because "no" is inside "know"; the learner's citations_ok fails case 5 only,
// which cites S5, a chunk that does not exist). The module quiz quiz-m1 covers both lessons.
// m1-l2 has no video, no tutor activity and no project: the outline asks for none, its 50 minutes
// go to the activities (the curated IBM Technology video on hallucinations, cfqtFvWOfg0 in
// ai-essentials-for-educators m1-l2, would fit if the lesson is ever lengthened), and what
// learners bring back from RAG-time or the paper version goes into the build activity (two new
// test cases) and the reflection.
// RAG-time access: the worksheet logs in with a class account, but the site says Try it now
// offers every feature, and its source (IBM/taxinomitis: newproject.html and
// languagemodel.controller.js) lets a Try it now user create a "generating text" project, which
// is always stored in the browser, never in the cloud. So access is try_it_now and step 2 skips
// the log-in steps. The model is downloaded into the browser (about 270 MB to 1.5 GB for most of
// the sizes offered) and needs WebGPU, hence the hint. The site keeps one initial-context document
// at a time (adding a text or a Wikipedia page replaces the previous one), hence the two passes
// of round 2. The worksheet's own examples (a story its author wrote, UK charts and politics) are
// replaced by an invented text and a public Wikipedia page on a recent public topic; no personal
// details, no school documents. The worksheet is CC BY-NC-SA 4.0: it is linked, never copied or
// translated, and the steps are our own framing, which defers to it for the clicks. The site's
// French interface leaves its language-model pages in English; its Try it now button is
// "Essayer maintenant". Rich_text bodies carry no Markdown headings, and ai_activity instructions
// are plain text (the player does not render Markdown there).

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m1: SeedModulePart = {
  module: {
    id: 'm1',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Advanced generative AI',
          description:
            'How large language models are built and tuned, why they make things up, and how retrieval and evaluation make them more reliable.',
        },
        fr: {
          title: 'IA générative avancée',
          description:
            'Comment les grands modèles de langage sont construits et ajustés, pourquoi ils inventent, et comment la récupération de documents et l’évaluation les rendent plus fiables.',
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
              title: 'How large language models are built',
              summary:
                'Tokens, next-token prediction, pre-training, instruction and preference tuning, context windows, sampling and temperature: what is inside the model your product will rely on, and where its limits come from.',
            },
            fr: {
              title: 'Comment sont construits les grands modèles de langage',
              summary:
                'Tokens, prédiction du token suivant, pré-entraînement, ajustement par instructions et par préférences, fenêtre de contexte, échantillonnage et température\u00a0: ce que contient le modèle sur lequel reposera ton produit, et d’où viennent ses limites.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'Before you build on it, open it up',
                body: "Type *The capital of France is* into a chatbot and it answers *Paris*. Ask it twice for a slogan for a recycling campaign and you get two different slogans. If it cannot search the web, ask it about this morning's news: it may say that it does not know, or describe events that never happened.\n\nThese are not random quirks. Each one comes from a decision made while the model was built: what it was trained to do, which text it learned from, how it picks each word.\n\nMost AI products today are built on a **large language model** (LLM) made by someone else. Before you put one between your product and its users, learn the recipe (not the mathematics of every layer): it explains what the model does well, where it fails, and which failures your product must be designed around.",
              },
              fr: {
                heading: 'Avant de construire dessus, ouvre la boîte',
                body: 'Tape *La capitale de la France est* dans un chatbot\u00a0: il répond *Paris*. Demande-lui deux fois un slogan pour une campagne de recyclage\u00a0: tu obtiens deux slogans différents. S’il ne peut pas faire de recherche sur le Web, interroge-le sur l’actualité de ce matin\u00a0: il dira peut-être qu’il ne sait pas, ou décrira des événements qui n’ont jamais eu lieu.\n\nCe ne sont pas des caprices du hasard. Chacun de ces comportements découle d’un choix fait pendant la construction du modèle\u00a0: ce qu’on l’a entraîné à faire, les textes dont il a appris, la façon dont il choisit chaque mot.\n\nLa plupart des produits d’IA d’aujourd’hui reposent sur un **grand modèle de langage** (LLM, pour *large language model*) conçu par quelqu’un d’autre. Avant d’en placer un entre ton produit et ses utilisateurs, apprends la recette (pas les mathématiques de chaque couche)\u00a0: elle explique ce que le modèle fait bien, là où il échoue, et quels échecs ton produit devra contourner dès sa conception.',
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
                heading: 'Tokens and next-token prediction',
                body: "**Tokens.** A language model reads neither letters nor whole words. A **tokenizer** cuts the text into **tokens**: a frequent word is often one token, a rarer word is split into pieces, and spaces and punctuation belong to tokens too. A model has a fixed vocabulary, usually tens of thousands to a few hundred thousand tokens, and each token becomes a number. For English, a common rule of thumb is about four characters per token; many other languages need more tokens for the same sentence, so they cost more to process. And because the model sees pieces of words, counting the letters of a word can be surprisingly hard for it.\n\n**Next-token prediction.** Given a sequence of tokens, an LLM gives a **probability** to every token of its vocabulary for what comes next. To write, the system picks one token, adds it to the text and asks again, until it produces a stop token or reaches a length limit. Every paragraph a chatbot writes is built this way.\n\n| Text so far | Possible next tokens (made-up probabilities) |\n|---|---|\n| *The cat sat on the* | mat 41%, floor 17%, sofa 9%... |\n| *The capital of France is* | Paris 93%, a 2%... |\n\n**Inside the model.** The probabilities come from a neural network, today almost always a **transformer**, an architecture published by Google researchers in 2017. Its key mechanism, **attention**, lets each token take every other token into account, so that *bank* can mean the side of a river or a place for money depending on the words around it. The network's behaviour is set by its **parameters**, often billions of numbers that nobody writes by hand: training adjusts them.",
              },
              fr: {
                heading: 'Les tokens et la prédiction du token suivant',
                body: '**Les tokens.** Un modèle de langage ne lit ni des lettres ni des mots entiers. Un **tokeniseur** découpe le texte en **tokens** (ou jetons)\u00a0: un mot fréquent forme souvent un seul token, un mot plus rare est coupé en morceaux, et les espaces et la ponctuation font aussi partie des tokens. Un modèle possède un vocabulaire fixe, en général de quelques dizaines de milliers à quelques centaines de milliers de tokens, et chaque token devient un nombre. Pour l’anglais, une règle approximative courante compte environ quatre caractères par token\u00a0; beaucoup d’autres langues ont besoin de plus de tokens pour une même phrase, et leur traitement coûte donc plus cher. Et comme le modèle voit des morceaux de mots, compter les lettres d’un mot peut se révéler étonnamment difficile pour lui.\n\n**La prédiction du token suivant.** À partir d’une suite de tokens, un LLM attribue une **probabilité** à chaque token de son vocabulaire pour ce qui vient ensuite. Pour écrire, le système choisit un token, l’ajoute au texte et recommence, jusqu’à produire un token de fin ou atteindre une limite de longueur. Chaque paragraphe qu’écrit un chatbot est construit ainsi.\n\n| Texte jusqu’ici | Tokens suivants possibles (probabilités inventées) |\n|---|---|\n| *Le chat s’est assis sur le* | tapis 41\u00a0%, sol 17\u00a0%, canapé 9\u00a0%… |\n| *La capitale de la France est* | Paris 93\u00a0%, une 2\u00a0%… |\n\n**À l’intérieur du modèle.** Ces probabilités sont calculées par un réseau de neurones, aujourd’hui presque toujours un **transformeur** (*transformer*), une architecture publiée par des chercheurs de Google en 2017. Son mécanisme clé, l’**attention**, permet à chaque token de tenir compte de tous les autres\u00a0: ainsi, *avocat* peut désigner un fruit ou un métier selon les mots qui l’entourent. Le comportement du réseau dépend de ses **paramètres**, souvent des milliards de nombres que personne n’écrit à la main\u00a0: c’est l’entraînement qui les ajuste.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'From text predictor to assistant: three stages of training',
                body: '**1. Pre-training.** Starting from random parameters, the model reads an enormous collection of text (web pages, books, articles, code) and predicts the next token, again and again; after each guess, its parameters are nudged so that the right token becomes a little more likely. Nobody labels anything, because the text supplies its own answers: this is **self-supervised** learning. For a large model it takes weeks or months on thousands of specialised chips. The resulting **base model** has absorbed grammar, facts, styles and patterns of reasoning, along with the errors, stereotypes and gaps of its data. It has a **knowledge cutoff**: it knows nothing that happened after its data was collected. And it continues text rather than answering: given *What is the capital of France?*, it may carry on with more quiz questions.\n\n**2. Instruction tuning.** Further training on a much smaller set of example conversations, each an instruction and a good answer written or checked by people, teaches the form of being helpful: answer, follow the instruction, keep to the length, refuse some requests.\n\n**3. Preference tuning.** People compare two answers to the same prompt and choose the better one, and training pushes the model towards the answers people prefer, with **reinforcement learning from human feedback** (RLHF) or newer methods. In 2022, OpenAI researchers reported that people preferred the answers of a 1.3-billion-parameter model tuned this way to those of the untuned GPT-3, which has 175 billion parameters.\n\n| Stage | What it gives | What it does not give |\n|---|---|---|\n| Pre-training | Language, broad knowledge, patterns | Up-to-date facts, a way to check them |\n| Instruction tuning | The habit of answering and following instructions | Truth: a confident tone is learned too |\n| Preference tuning | Answers people rate higher: clearer, more polite, safer | Accuracy: it can reward answers that only sound agreeable |\n\nResearch has indeed found that preference-tuned models can drift towards telling people what they want to hear, a tendency called **sycophancy**. Every stage also rests on human choices: which text to collect (whether copyrighted text may be used for training is being argued in courts and debated by lawmakers), who writes and rates the examples (often contract workers, whose pay and working conditions journalists have questioned), and what counts as a *better* answer.',
              },
              fr: {
                heading: 'Du prédicteur de texte à l’assistant\u00a0: trois étapes d’entraînement',
                body: '**1. Le pré-entraînement.** Parti de paramètres aléatoires, le modèle lit une énorme collection de textes (pages web, livres, articles, code) et prédit le token suivant, encore et encore\u00a0; après chaque essai, ses paramètres sont légèrement corrigés pour que le bon token devienne un peu plus probable. Personne n’étiquette rien, car le texte fournit lui-même ses réponses\u00a0: c’est l’apprentissage **auto-supervisé**. Pour un grand modèle, cela prend des semaines, voire des mois, sur des milliers de puces spécialisées. Le **modèle de base** obtenu a absorbé la grammaire, des connaissances, des styles et des schémas de raisonnement, mais aussi les erreurs, les stéréotypes et les lacunes de ses données. Il a une **date limite de connaissances** (*knowledge cutoff*)\u00a0: il ne sait rien de ce qui s’est passé après la collecte de ses données. Et il prolonge du texte au lieu de répondre\u00a0: face à *Quelle est la capitale de la France\u00a0?*, il risque d’enchaîner sur d’autres questions de quiz.\n\n**2. L’ajustement par instructions** (*instruction tuning*). Un entraînement supplémentaire sur un ensemble bien plus petit d’exemples de conversations, chacun composé d’une consigne et d’une bonne réponse rédigées ou vérifiées par des personnes, lui apprend la forme d’une aide utile\u00a0: répondre, suivre la consigne, respecter la longueur, refuser certaines demandes.\n\n**3. L’ajustement par préférences** (*preference tuning*). Des personnes comparent deux réponses au même prompt et choisissent la meilleure, et l’entraînement oriente le modèle vers les réponses préférées, par **apprentissage par renforcement à partir de retours humains** (RLHF, pour *reinforcement learning from human feedback*) ou par des méthodes plus récentes. En 2022, des chercheurs d’OpenAI ont indiqué que des personnes préféraient les réponses d’un modèle de 1,3\u00a0milliard de paramètres ajusté ainsi à celles de GPT-3, non ajusté, qui compte 175\u00a0milliards de paramètres.\n\n| Étape | Ce qu’elle apporte | Ce qu’elle n’apporte pas |\n|---|---|---|\n| Pré-entraînement | La langue, des connaissances générales, des régularités | Des faits à jour, un moyen de les vérifier |\n| Ajustement par instructions | L’habitude de répondre et de suivre des consignes | La vérité\u00a0: le ton assuré s’apprend aussi |\n| Ajustement par préférences | Des réponses mieux notées\u00a0: plus claires, plus polies, plus sûres | L’exactitude\u00a0: il peut récompenser des réponses qui semblent seulement agréables |\n\nDes recherches ont d’ailleurs montré que les modèles ajustés par préférences peuvent glisser vers ce que les gens ont envie d’entendre, une tendance appelée **complaisance** (*sycophancy*). Chaque étape repose aussi sur des choix humains\u00a0: quels textes collecter (la possibilité d’entraîner un modèle sur des textes protégés par le droit d’auteur est débattue devant les tribunaux et par les législateurs), qui rédige et note les exemples (souvent des travailleurs sous contrat, dont des journalistes ont mis en cause la rémunération et les conditions de travail), et ce qui compte comme une *meilleure* réponse.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l1-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Context windows, sampling, temperature and the limits that follow',
                body: "**The context window.** A model takes only a limited number of tokens into account at once: its **context window**, from a few thousand tokens for older or smaller models to hundreds of thousands, or more, for some recent ones. The system's instructions, the conversation, any documents the app adds and the answer being written must all fit inside. The parameters do not change while you chat, so the model has **no memory of its own**: an app's memory feature stores notes and puts them back into the context, and a conversation that grows too long must be cut or summarised. Long is not the same as well read: research has found that models use information at the start and end of a long context better than information in the middle.\n\n**Sampling and temperature.** The network gives each candidate token a score, and the scores become probabilities. Always taking the top token (**greedy** decoding) gives repetitive text, so most systems **sample**: they draw a token at random, following the probabilities. **Temperature** divides the scores first. With scores of 2, 1 and 0 for *mat*, *floor* and *moon*:\n\n| Temperature | mat | floor | moon |\n|---|---|---|---|\n| 0.5 (sharper) | about 87% | 12% | 2% |\n| 1 | about 67% | 24% | 9% |\n| 2 (flatter) | about 51% | 31% | 19% |\n\nA low temperature gives more predictable, repeatable output; a high one, more varied and surprising output. **Top-p** keeps only the most likely tokens whose probabilities add up to *p*: at temperature 1 with *p* = 0.9, *mat* and *floor* (91% together) stay in the draw and *moon* is never picked. Neither setting makes an answer true.\n\n**The limits that follow from the recipe.**\n\n- **Fluent is not true:** trained to produce likely text, not checked facts, it can be confidently wrong (the subject of the next lesson).\n- **Frozen knowledge** after the cutoff, unless your app supplies recent documents.\n- **Variable answers:** the same prompt gives different outputs, and a small rewording can change the result.\n- **Inherited bias** from the data and from the people who rated answers.\n- **Weak at exactness:** letter counts, arithmetic, word-for-word quotations; hand those jobs to code or tools.\n- **Your users' words travel:** prompts are processed, and may be stored, on the provider's servers, so design your product not to need personal data.",
              },
              fr: {
                heading:
                  'Fenêtre de contexte, échantillonnage, température et limites qui en découlent',
                body: '**La fenêtre de contexte.** Un modèle ne prend en compte qu’un nombre limité de tokens à la fois\u00a0: sa **fenêtre de contexte**, de quelques milliers de tokens pour des modèles anciens ou petits à des centaines de milliers, voire davantage, pour certains modèles récents. Les instructions du système, la conversation, les documents ajoutés par l’application et la réponse en cours doivent tous y tenir. Les paramètres ne changent pas pendant que tu discutes\u00a0: le modèle n’a donc **pas de mémoire propre**. La fonction «\u00a0mémoire\u00a0» d’une application enregistre des notes et les replace dans le contexte, et une conversation trop longue doit être coupée ou résumée. Long ne veut pas dire bien lu\u00a0: des recherches ont montré que les modèles exploitent mieux les informations placées au début et à la fin d’un long contexte que celles du milieu.\n\n**Échantillonnage et température.** Le réseau donne un score à chaque token candidat, puis ces scores deviennent des probabilités. Prendre toujours le token le plus probable (décodage **glouton**, *greedy*) donne un texte répétitif\u00a0: la plupart des systèmes **échantillonnent** donc, en tirant un token au hasard selon les probabilités. La **température** divise d’abord les scores. Avec des scores de 2, 1 et 0 pour *tapis*, *sol* et *lune*\u00a0:\n\n| Température | tapis | sol | lune |\n|---|---|---|---|\n| 0,5 (plus tranchée) | environ 87\u00a0% | 12\u00a0% | 2\u00a0% |\n| 1 | environ 67\u00a0% | 24\u00a0% | 9\u00a0% |\n| 2 (plus aplatie) | environ 51\u00a0% | 31\u00a0% | 19\u00a0% |\n\nUne température basse donne une sortie plus prévisible et reproductible\u00a0; une température élevée, une sortie plus variée et plus surprenante. Le **top-p** ne garde que les tokens les plus probables dont les probabilités atteignent ensemble *p*\u00a0: à la température 1 avec *p* = 0,9, *tapis* et *sol* (91\u00a0% à eux deux) restent dans le tirage, et *lune* n’est jamais choisi. Aucun de ces réglages ne rend une réponse vraie.\n\n**Les limites qui découlent de la recette.**\n\n- **Fluide ne veut pas dire vrai\u00a0:** entraîné à produire du texte probable, pas des faits vérifiés, il peut se tromper avec assurance (c’est le sujet de la prochaine leçon).\n- **Des connaissances figées** après la date limite, sauf si ton application lui fournit des documents récents.\n- **Des réponses variables\u00a0:** le même prompt donne des sorties différentes, et une petite reformulation peut changer le résultat.\n- **Des biais hérités** des données et des personnes qui ont noté les réponses.\n- **Peu fiable pour l’exactitude\u00a0:** compter des lettres, calculer, citer mot pour mot\u00a0; confie ces tâches à du code ou à des outils.\n- **Les mots de tes utilisateurs voyagent\u00a0:** les prompts sont traités, et parfois conservés, sur les serveurs du fournisseur\u00a0; conçois ton produit pour qu’il n’ait pas besoin de données personnelles.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l1-b5',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: how chatbots and large language models work',
                caption:
                  "A quick overview from Code.org's How AI Works series. Its first example predicts letters from a text's statistics: compare it with the toy model you will trace next.",
                transcript:
                  'In short: chatbots are built on large language models, which are statistics used on a gigantic scale. The video starts small: by analysing a text, a computer can work out how likely each letter is to follow another, and use that to predict new text. Longer sequences, such as whole words and sentences, give more context and far more convincing predictions. Trained on an enormous amount of text with very powerful computers, a model writes fluent answers, but every answer is built from probabilities, so it can contain mistakes. Whether this counts as real intelligence is still debated. In the words of this lesson: the letter example is next-token prediction with a tiny context, and the enormous amount of text is pre-training.',
              },
              fr: {
                title:
                  'Regarde\u00a0: comment fonctionnent les chatbots et les grands modèles de langage',
                caption:
                  'Un rapide tour d’horizon tiré de la série How AI Works de Code.org (vidéo en anglais). Son premier exemple prédit des lettres à partir des statistiques d’un texte\u00a0: compare-le avec le modèle miniature que tu vas suivre à la main.',
                transcript:
                  'En bref\u00a0: les chatbots reposent sur de grands modèles de langage, c’est-à-dire des statistiques appliquées à une échelle gigantesque. La vidéo part d’un petit exemple\u00a0: en analysant un texte, un ordinateur peut calculer la probabilité qu’une lettre en suive une autre, et s’en servir pour prédire un nouveau texte. Des suites plus longues, comme des mots entiers et des phrases, apportent plus de contexte et des prédictions bien plus convaincantes. Entraîné sur une quantité énorme de textes avec des ordinateurs très puissants, un modèle écrit des réponses fluides, mais chaque réponse est construite à partir de probabilités\u00a0: elle peut donc contenir des erreurs. La question de savoir s’il s’agit d’une véritable intelligence fait encore débat. Dans les mots de cette leçon\u00a0: l’exemple des lettres, c’est la prédiction du token suivant avec un tout petit contexte, et la quantité énorme de textes, c’est le pré-entraînement.',
              },
            },
            data: {
              source: 'youtube',
              videoId: 'X-AWdfSFCHQ',
              fileId: null,
              durationSeconds: null,
            },
          },
          {
            id: 'm1-l1-b6',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Build a language model by hand: a tiny one that has read three sentences. One word is one token; it counts which token follows which (its pre-training) and writes by always picking the most likely next token. Your code is saved, not run, so trace it yourself:\n\n1. Write in a comment what the first print line shows. Which counts give *robot* a probability of 1/3?\n2. Trace generate("the", 6). Why does it go round in a loop? Give two reasons: one about how it picks each token, one about how much text it looks at.\n3. Trace generate("cat", 4). Its sentence is in none of the training sentences. Is it true? What does that tell you about fluent text?\n4. Complete apply_temperature: each probability p becomes p ** (1 / temperature), then each result is divided by their total. Work out the probabilities after *the* at temperature 0.5 and at temperature 2.\n5. In a comment, name one thing this toy shares with a real LLM and three things a real LLM does differently.',
                hint: 'For step 2, at each step look only at the last token of output and read its line in counts. When two tokens tie, max keeps the one that was counted first. For step 4 at temperature 0.5, squaring 1/3 and 1/6 gives 1/9 and 1/36: add the four results, then divide each one by the total.',
              },
              fr: {
                instructions:
                  'Construis un modèle de langage à la main\u00a0: un modèle minuscule qui a lu trois phrases. Un mot vaut un token\u00a0; il compte quel token suit quel autre (son pré-entraînement) et écrit en choisissant toujours le token suivant le plus probable. Dans le code, les noms sont en anglais\u00a0: counts compte les tokens suivants, generate écrit un texte, apply_temperature applique une température. Ton code est enregistré, pas exécuté\u00a0: suis-le toi-même.\n\n1. Écris dans un commentaire ce qu’affiche la première ligne print. Quels comptages donnent à *robot* une probabilité de 1/3\u00a0?\n2. Suis generate("the", 6). Pourquoi tourne-t-elle en boucle\u00a0? Donne deux raisons\u00a0: l’une sur la façon dont elle choisit chaque token, l’autre sur la quantité de texte qu’elle regarde.\n3. Suis generate("cat", 4). Sa phrase ne figure dans aucune des phrases d’entraînement. Est-elle vraie\u00a0? Qu’est-ce que cela t’apprend sur un texte fluide\u00a0?\n4. Complète apply_temperature\u00a0: chaque probabilité p devient p ** (1 / temperature), puis chaque résultat est divisé par leur total. Calcule les probabilités après *the* à la température 0,5 et à la température 2.\n5. Dans un commentaire, cite un point commun entre ce modèle miniature et un vrai LLM, et trois choses qu’un vrai LLM fait autrement.',
                hint: 'Pour l’étape\u00a02, regarde à chaque tour uniquement le dernier token de output et lis sa ligne dans counts. En cas d’égalité, max garde le token compté en premier. Pour l’étape\u00a04 à la température 0,5, élever 1/3 et 1/6 au carré donne 1/9 et 1/36\u00a0: additionne les quatre résultats, puis divise chacun par le total.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# A tiny language model that has read three sentences: its whole pre-training data.',
                'corpus = "the robot reads the book . the robot writes the code . the cat reads the code ."',
                'tokens = corpus.split()  # one token per word; real tokenizers cut words into pieces',
                '',
                '# Pre-training, toy version: count which token follows which.',
                'counts = {}',
                'for current, following in zip(tokens, tokens[1:]):',
                '    followers = counts.setdefault(current, {})',
                '    followers[following] = followers.get(following, 0) + 1',
                '',
                '',
                'def next_token_probabilities(token):',
                '    followers = counts.get(token, {})',
                '    total = sum(followers.values())',
                '    return {candidate: n / total for candidate, n in followers.items()}',
                '',
                '',
                'def apply_temperature(probabilities, temperature):',
                '    # TODO: raise each probability to the power 1 / temperature,',
                '    # then divide each result by their total, so that they add up to 1.',
                '    return probabilities',
                '',
                '',
                'def generate(start, length):',
                '    """Greedy decoding: always pick the most likely next token."""',
                '    output = [start]',
                '    for _ in range(length):',
                '        probabilities = next_token_probabilities(output[-1])  # looks at 1 token only',
                '        if not probabilities:',
                '            break',
                '        best = max(probabilities, key=probabilities.get)  # a tie: the one counted first',
                '        output.append(best)',
                '    return " ".join(output)',
                '',
                '',
                'print(next_token_probabilities("the"))',
                'print(generate("the", 6))',
                'print(generate("cat", 4))',
                '',
                '# My trace / Ma trace:',
              ),
            },
          },
          {
            id: 'm1-l1-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to explain the three stages of training with an analogy of your choice. Then check its answer against this lesson: does it say which stage gives the model its knowledge and which ones shape its behaviour? Does it suggest that tuning makes a model truthful? Keep personal details out of your messages.',
                starterPrompt:
                  'Explain the difference between pre-training, instruction tuning and preference tuning of a large language model, with an analogy. Which stage gives the model its knowledge, and which stages change how it behaves?',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de t’expliquer les trois étapes d’entraînement avec une analogie de ton choix. Compare ensuite sa réponse avec cette leçon\u00a0: dit-il quelle étape donne au modèle ses connaissances, et lesquelles façonnent son comportement\u00a0? Laisse-t-il entendre que l’ajustement rend un modèle fiable sur les faits\u00a0? Ne mets aucune information personnelle dans tes messages.',
                starterPrompt:
                  'Explique-moi la différence entre le pré-entraînement, l’ajustement par instructions et l’ajustement par préférences d’un grand modèle de langage, avec une analogie. Quelle étape donne au modèle ses connaissances, et quelles étapes changent son comportement\u00a0?',
              },
            },
            data: { tutorMode: 'explain', labToolId: null },
          },
          {
            id: 'm1-l1-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Imagine a product you could build on a language model, such as a revision coach or a help desk for a school club. Choose two ideas from this lesson (the knowledge cutoff, preference tuning, the context window, temperature, tokens...) and explain how each one could cause a problem for its users, and what you could do about it.',
              },
              fr: {
                prompt:
                  'Imagine un produit que tu pourrais construire sur un modèle de langage, comme un coach de révision ou un guichet d’aide pour un club du lycée. Choisis deux notions de cette leçon (la date limite de connaissances, l’ajustement par préférences, la fenêtre de contexte, la température, les tokens…) et explique comment chacune pourrait poser problème à ses utilisateurs, et ce que tu pourrais faire pour y remédier.',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
      {
        id: 'm1-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Grounding, retrieval and evaluation',
              summary:
                'Why language models make things up, how retrieval-augmented generation grounds answers in sources with citations you can check, and how to build a small evaluation set that measures whether it works.',
            },
            fr: {
              title: 'Ancrage, récupération et évaluation',
              summary:
                'Pourquoi les modèles de langage inventent, comment la génération augmentée par récupération ancre les réponses dans des sources avec des citations vérifiables, et comment construire un petit jeu d’évaluation qui mesure si cela fonctionne.',
            },
          },
          estimatedMinutes: 50,
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
                heading: 'Six court decisions that never existed',
                body: "In 2023, in a New York case known as *Mata v. Avianca*, the lawyers of a passenger suing an airline filed a brief that cited earlier court decisions. Six of them did not exist: their names, quotations and references had been generated by ChatGPT. One of the lawyers explained that he had even asked the chatbot whether the cases were real, and it had said they were. The judge fined the lawyers and their firm.\n\nThe chatbot was not lying: it has no idea what is true. It produced text that looks like a likely answer, and a list of court decisions has a very recognisable look. If your product answers real people's questions (about a club's rules, a shop's returns policy, a medicine leaflet), this is the failure to design against. This lesson gives you two tools: **ground** the answers in sources given to the model, and **measure** how often it gets things right before anyone relies on it.",
              },
              fr: {
                heading: 'Six décisions de justice qui n’ont jamais existé',
                body: 'En 2023, dans une affaire new-yorkaise connue sous le nom de *Mata v. Avianca*, les avocats d’un passager qui poursuivait une compagnie aérienne ont déposé un mémoire citant des décisions de justice antérieures. Six d’entre elles n’existaient pas\u00a0: leurs noms, leurs citations et leurs références avaient été générés par ChatGPT. L’un des avocats a expliqué qu’il avait même demandé au chatbot si ces affaires étaient réelles, et que celui-ci avait répondu oui. Le juge a condamné les avocats et leur cabinet à une amende.\n\nLe chatbot ne mentait pas\u00a0: il n’a aucune idée de ce qui est vrai. Il a produit un texte qui ressemble à une réponse probable, et une liste de décisions de justice a une allure très reconnaissable. Si ton produit répond aux questions de vraies personnes (sur le règlement d’un club, la politique de retour d’un magasin, la notice d’un médicament), c’est contre cet échec qu’il faut le concevoir. Cette leçon te donne deux outils\u00a0: **ancrer** les réponses dans des sources fournies au modèle, et **mesurer** à quelle fréquence il a juste avant que quiconque ne s’y fie.',
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
                heading: 'Why models make things up',
                body: "A **hallucination** is an output that is fluent and confident but false, or not supported by the sources the model was given:\n\n- **Invented facts:** a wrong date or figure, an event that never happened.\n- **Invented sources:** references, quotations or links that look real, as in *Mata v. Avianca*.\n- **Unfaithful answers:** a summary that contradicts its own document.\n- **Accepted false premises:** asked *Why was the Eiffel Tower moved to Lyon?*, a model may explain the move.\n\n**Why it happens.** As *How large language models are built* showed, the model is trained to produce *likely* text, not to check it, and nothing inside it marks a sentence as known or guessed. Rare facts, recent facts and anything after the cutoff are where guesses fill the gaps. Researchers have also argued that common ways of training and testing models reward a confident guess more than an honest *I don't know*. And since each token follows from the ones before it, an early mistake tends to be continued.\n\n**Not enough on its own:** a lower temperature (the same wrong answer, every time), asking the model whether it is sure (it can confirm its own invention, as it did in court), a firmer prompt. **What helps:** put the right information in the context and tell the model to use only that (**grounding**); allow *I don't know*; hand exact jobs to tools; keep a person in the loop when the stakes are high; and test before you ship.",
              },
              fr: {
                heading: 'Pourquoi les modèles inventent',
                body: 'Une **hallucination** est une sortie fluide et assurée, mais fausse, ou non étayée par les sources fournies au modèle\u00a0:\n\n- **Des faits inventés\u00a0:** une date ou un chiffre faux, un événement qui n’a jamais eu lieu.\n- **Des sources inventées\u00a0:** des références, des citations ou des liens qui ont l’air réels, comme dans *Mata v. Avianca*.\n- **Des réponses infidèles\u00a0:** un résumé qui contredit son propre document.\n- **Des fausses prémisses acceptées\u00a0:** à la question *Pourquoi la tour Eiffel a-t-elle été déplacée à Lyon\u00a0?*, un modèle risque d’expliquer le déménagement.\n\n**Pourquoi cela arrive.** Comme l’a montré *Comment sont construits les grands modèles de langage*, le modèle est entraîné à produire un texte *probable*, pas à le vérifier, et rien en lui ne marque une phrase comme sue ou devinée. Les faits rares, les faits récents et tout ce qui suit la date limite sont les endroits où les suppositions comblent les trous. Des chercheurs ont aussi soutenu que les façons courantes d’entraîner et de tester les modèles récompensent davantage une supposition assurée qu’un honnête *je ne sais pas*. Et comme chaque token découle des précédents, une erreur commise tôt a tendance à être prolongée.\n\n**Insuffisant à soi seul\u00a0:** une température plus basse (la même réponse fausse, à chaque fois), demander au modèle s’il est sûr de lui (il peut confirmer sa propre invention, comme devant le tribunal), un prompt plus ferme. **Ce qui aide\u00a0:** placer la bonne information dans le contexte et demander au modèle de n’utiliser qu’elle (l’**ancrage**, *grounding*)\u00a0; autoriser le *je ne sais pas*\u00a0; confier les tâches exactes à des outils\u00a0; garder une personne dans la boucle quand les enjeux sont importants\u00a0; et tester avant de publier.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Retrieval-augmented generation: retrieve, then generate with sources',
                body: "**Retrieval-augmented generation** (RAG), named in a 2020 paper by Patrick Lewis and colleagues at Facebook AI Research and partner universities, adds a search step before generation: the app finds relevant text and puts it in the context window.\n\n1. **Prepare:** split the documents (a FAQ, a handbook) into **chunks** of a few sentences, each with an id: S1, S2...\n2. **Index** the chunks by keywords or with **embeddings**, lists of numbers computed so that texts with similar meanings get similar numbers: *How much does it cost?* can then find a chunk about *the price*.\n3. **Retrieve** the few chunks most similar to the question (the *top k*, often three to five).\n4. **Augment** the prompt: instructions, the chunks with their ids, then the question. For example: *Answer only from the sources below, cite each source you use like [S2], and say that you do not know if they do not contain the answer.*\n5. **Generate**, then **check** before you show the answer.\n\n**Citations you can check.** Your app can verify that every cited id was among the chunks retrieved (citing S7 when only S1 to S4 were given is an invention), show the cited text beside the answer, and link to the original document. Spot-check that each chunk really supports its sentence.\n\n| Step | What can still go wrong |\n|---|---|\n| Documents | Wrong or outdated: last year's prices |\n| Retrieval | The right chunk is missed: the question says *refund*, the text says *money back* |\n| Generation | The model ignores its sources or adds its own guesses |\n| Security and privacy | A retrieved page says *ignore your rules*; a private document reaches a public bot |\n\nRAG can make answers more current, more specific and easier to check. It does not make them certain: that is why you measure.",
              },
              fr: {
                heading:
                  'La génération augmentée par récupération\u00a0: retrouver, puis générer avec des sources',
                body: 'La **génération augmentée par récupération** (RAG, pour *retrieval-augmented generation*), nommée dans un article de 2020 de Patrick Lewis et de ses collègues de Facebook AI Research et d’universités partenaires, ajoute une étape de recherche avant la génération\u00a0: l’application trouve des textes pertinents et les place dans la fenêtre de contexte.\n\n1. **Préparer\u00a0:** découpe les documents (une FAQ, un règlement) en **passages** (*chunks*) de quelques phrases, chacun avec un identifiant\u00a0: S1, S2…\n2. **Indexer** les passages par mots-clés ou grâce à des **plongements** (*embeddings*), des listes de nombres calculées pour que des textes de sens proche obtiennent des nombres proches\u00a0: *Combien ça coûte\u00a0?* peut alors retrouver un passage sur *le prix*.\n3. **Récupérer** les quelques passages les plus proches de la question (les *k premiers*, *top k*, souvent trois à cinq).\n4. **Augmenter** le prompt\u00a0: les instructions, les passages avec leurs identifiants, puis la question. Par exemple\u00a0: *Réponds uniquement à partir des sources ci-dessous, cite chaque source utilisée comme [S2], et dis que tu ne sais pas si elles ne contiennent pas la réponse.*\n5. **Générer**, puis **vérifier** avant d’afficher la réponse.\n\n**Des citations vérifiables.** Ton application peut vérifier que chaque identifiant cité fait partie des passages récupérés (citer S7 alors que seuls S1 à S4 ont été fournis, c’est une invention), afficher le texte cité à côté de la réponse et renvoyer au document d’origine. Vérifie par sondage que chaque passage étaye vraiment sa phrase.\n\n| Étape | Ce qui peut encore mal tourner |\n|---|---|\n| Documents | Faux ou périmés\u00a0: les prix de l’an dernier |\n| Récupération | Le bon passage est manqué\u00a0: la question dit *remboursement*, le texte dit *argent rendu* |\n| Génération | Le modèle ignore ses sources ou ajoute ses propres suppositions |\n| Sécurité et vie privée | Une page récupérée dit *ignore tes règles*\u00a0; un document privé atterrit dans un bot public |\n\nLe RAG peut rendre les réponses plus actuelles, plus précises et plus faciles à vérifier. Il ne les rend pas certaines\u00a0: c’est pourquoi on mesure.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Measure it: a small evaluation set',
                body: "*It worked when I tried it* is not evidence: answers vary from run to run, and a change that fixes one question can break another. Keep an **evaluation set**: fixed test cases, written **before** testing.\n\n1. **Write 10 to 30 cases:** questions the documents answer, some that need two chunks, some they cannot answer (the right answer is *I don't know*), false premises, and a few harmless adversarial inputs.\n2. **For each case, note** the key facts a correct answer must contain, the supporting source, and whether the system should abstain.\n3. **Choose your scores:** **correct** (the key facts, nothing false), **grounded** (every claim backed by a cited source, every cited id real), **abstained when it should** (and only then).\n4. **Run and score** every case, more than once if the temperature is above zero, and report rates: *8 of 10 correct, 9 of 10 grounded, 2 of 2 abstentions*.\n5. **Change one thing, rerun the same set** and compare. Never tune on it: treat it like a sealed test set.\n\n**Who scores?** Automatic checks (a key fact found in the answer, a cited id in the list) are fast, but they miss correct answers phrased differently and pass wrong ones that contain the right words. A second model can act as a judge only once its scores have been compared with human scores on a sample. In a small project, you are the judge: read every answer.",
              },
              fr: {
                heading: 'Mesure-le\u00a0: un petit jeu d’évaluation',
                body: '*Ça a marché quand j’ai essayé* n’est pas une preuve\u00a0: les réponses varient d’une exécution à l’autre, et un changement qui règle une question peut en casser une autre. Tiens un **jeu d’évaluation**\u00a0: des cas de test fixes, écrits **avant** les tests.\n\n1. **Écris 10 à 30 cas\u00a0:** des questions auxquelles les documents répondent, certaines qui demandent deux passages, d’autres auxquelles ils ne répondent pas (la bonne réponse est *je ne sais pas*), des fausses prémisses et quelques entrées malveillantes mais inoffensives.\n2. **Pour chaque cas, note** les faits clés que doit contenir une réponse juste, la source qui les étaye, et si le système doit s’abstenir.\n3. **Choisis tes scores\u00a0:** **juste** (les faits clés, rien de faux), **ancrée** (chaque affirmation étayée par une source citée, chaque identifiant cité réel), **abstention à bon escient** (et seulement dans ce cas).\n4. **Exécute et note** chaque cas, plusieurs fois si la température est supérieure à zéro, et présente des taux\u00a0: *8 sur 10 justes, 9 sur 10 ancrées, 2 abstentions sur 2*.\n5. **Change une seule chose, relance le même jeu** et compare. Ne fais jamais tes réglages dessus\u00a0: traite-le comme un jeu de test sous enveloppe scellée.\n\n**Qui note\u00a0?** Les vérifications automatiques (un fait clé trouvé dans la réponse, un identifiant cité présent dans la liste) sont rapides, mais elles ratent des réponses justes formulées autrement et laissent passer des réponses fausses qui contiennent les bons mots. Un second modèle ne peut servir de juge qu’une fois ses notes comparées à des notes humaines sur un échantillon. Dans un petit projet, c’est toi le juge\u00a0: lis chaque réponse.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b5',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'RAG-time: a small language model, before and after retrieval',
                instructions:
                  "**Goal:** ask a small language model questions it cannot answer, then put the right text in its context and ask again. The big idea: retrieve, then generate, and here **you** are the retriever. This activity is optional; the paper version below teaches the same idea.\n\n**Your texts:** a text you invent (the FAQ of an imaginary product, five to ten lines) and a public Wikipedia page on a recent public topic, such as a space mission. No personal details, no school documents.\n\n1. First, write six questions with their expected answers: one of general knowledge, two on your invented text, two on your recent topic, and one that none of your texts answers.\n2. Open Machine Learning for Kids with the button below and choose **Try it now**. Skip the worksheet's log-in steps.\n3. Create a project named *RAG-time* that generates text, and set up a small model with no initial context, as the official worksheet (PDF) shows. Ask your teacher which model size your computer can handle.\n4. Round 1: ask the six questions and record each answer as correct, wrong, invented or *I don't know*.\n5. Round 2: following the worksheet for the clicks, set your invented text as the initial context and ask the six questions again; then replace it with a trimmed part of your Wikipedia page and ask them once more. Keep the same settings, and record every answer.\n6. If time allows, build the worksheet's Scratch project, which fetches the live page each time it runs.\n7. Copy your results table, then delete the project.",
                bringBack:
                  'For the evaluation code and the reflection below: your six questions and expected answers, your results table for the three passes, and one answer the model invented.',
                hint: 'The model runs in your browser and needs a feature called WebGPU, which some computers lack; its download can weigh several hundred megabytes. If it will not load, try a smaller model or do the paper version. Answers vary from run to run: if one surprises you, ask again and note both. Try it now keeps one project at a time, so delete any older one first. If generated text is inappropriate, tell your teacher.',
              },
              fr: {
                title: 'RAG-time\u00a0: un petit modèle de langage, avant et après la récupération',
                instructions:
                  '**Objectif\u00a0:** poser à un petit modèle de langage des questions auxquelles il ne peut pas répondre, puis placer le bon texte dans son contexte et les lui reposer. La grande idée\u00a0: retrouver, puis générer, et ici, c’est **toi** qui fais la récupération. Cette activité est facultative\u00a0; la version sur papier ci-dessous enseigne la même idée.\n\n**Tes textes\u00a0:** un texte que tu inventes (la FAQ d’un produit imaginaire, en cinq à dix lignes) et une page Wikipédia publique sur un sujet public récent, comme une mission spatiale. Aucune information personnelle, aucun document du lycée.\n\n1. D’abord, écris six questions avec leurs réponses attendues\u00a0: une de culture générale, deux sur ton texte inventé, deux sur ton sujet récent, et une à laquelle aucun de tes textes ne répond.\n2. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*). Saute les étapes de connexion de la fiche.\n3. Crée un projet nommé *RAG-time* qui génère du texte, et configure un petit modèle sans contexte initial (*initial context*), comme le montre la fiche officielle (PDF). Demande à ton enseignant quelle taille de modèle ton ordinateur peut supporter.\n4. Premier tour\u00a0: pose les six questions et note chaque réponse comme juste, fausse, inventée ou *je ne sais pas*.\n5. Second tour\u00a0: en suivant la fiche pour les clics, place ton texte inventé comme contexte initial et repose les six questions\u00a0; remplace-le ensuite par une partie raccourcie de ta page Wikipédia et repose-les encore une fois. Garde les mêmes réglages, et note chaque réponse.\n6. Si le temps le permet, réalise le projet Scratch de la fiche, qui va chercher la page à jour à chaque exécution.\n7. Recopie ton tableau de résultats, puis supprime le projet.',
                bringBack:
                  'Pour le code d’évaluation et la réflexion ci-dessous\u00a0: tes six questions et leurs réponses attendues, ton tableau de résultats pour les trois passages, et une réponse inventée par le modèle.',
                hint: 'Le modèle tourne dans ton navigateur et a besoin d’une fonction appelée WebGPU, dont certains ordinateurs sont dépourvus\u00a0; son téléchargement peut peser plusieurs centaines de mégaoctets. S’il refuse de se charger, essaie un modèle plus petit ou fais la version sur papier. Les réponses varient d’une exécution à l’autre\u00a0: si l’une d’elles te surprend, repose la question et note les deux réponses. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: supprime d’abord tout projet plus ancien. Si un texte généré est inapproprié, préviens ton enseignant.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-ragtime.pdf',
              projectType: 'language',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm1-l2-b6',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Closed book, then open book',
                body: "Site blocked, or a computer that cannot run the model? Run the same experiment with a partner.\n\n1. On six cards, write six numbered sentences, S1 to S6, about something you invent: the FAQ of an imaginary product, the rules of a made-up sport. Hide them from your partner.\n2. Before testing, write six questions with their expected answers and sources: four answered by one card, one that needs two cards, and one answered by none (expected answer: *I don't know*).\n3. **Closed book:** your partner answers the six questions without the cards and must always answer, even with a guess, like a model with no sources.\n4. **Open book:** for each question, hand over only the one or two cards that seem most relevant (you are the retriever). Your partner answers from those cards only, cites them (*[S3]*) and may say *I don't know*.\n5. Score both rounds in a table (correct, grounded, abstained when it should), then find one retrieval failure: where did you hand over the wrong card, and why?\n\nKeep the table: two of its questions become test cases in the code below.",
              },
              fr: {
                heading: 'Pas de site\u00a0? Livre fermé, puis livre ouvert',
                body: 'Le site est bloqué, ou ton ordinateur ne peut pas faire tourner le modèle\u00a0? Fais la même expérience avec un partenaire.\n\n1. Sur six cartes, écris six phrases numérotées, de S1 à S6, sur quelque chose que tu inventes\u00a0: la FAQ d’un produit imaginaire, les règles d’un sport inventé. Cache-les à ton partenaire.\n2. Avant les tests, écris six questions avec leurs réponses attendues et leurs sources\u00a0: quatre trouvent leur réponse sur une carte, une a besoin de deux cartes, et une ne la trouve sur aucune (réponse attendue\u00a0: *je ne sais pas*).\n3. **Livre fermé\u00a0:** ton partenaire répond aux six questions sans les cartes et doit toujours répondre, quitte à deviner, comme un modèle sans sources.\n4. **Livre ouvert\u00a0:** pour chaque question, ne donne que la ou les deux cartes qui semblent les plus pertinentes (c’est toi qui fais la récupération). Ton partenaire répond uniquement à partir de ces cartes, les cite (*[S3]*) et peut dire *je ne sais pas*.\n5. Note les deux tours dans un tableau (juste, ancrée, abstention à bon escient), puis trouve une erreur de récupération\u00a0: où as-tu donné la mauvaise carte, et pourquoi\u00a0?\n\nGarde le tableau\u00a0: deux de ses questions deviendront des cas de test dans le code ci-dessous.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b7',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Score an evaluation set like a developer. The code holds the FAQ of *Lumo*, an invented solar bike light, five test cases for its help bot, and the answers of the bot's RAG version, written for this exercise and not by a real model. Your code is saved, not run, so trace it by hand:\n\n1. Write what the loop prints for each case, and the final score.\n2. Read the answers yourself, with the FAQ. Which verdict of the scorer is wrong, and how would you fix the check?\n3. Case 2 passes, but its check is fragile: which wrong answer would also pass it?\n4. Complete citations_ok, print its result for each case, and name the failure it catches.\n5. Add two cases from your RAG-time table or your paper rounds.\n6. In a comment, write the three rates you would report, and why the set must stay the same when you change the prompt.",
                hint: 'In Python, in looks for a piece of text anywhere inside another, so "no" is found inside "know" and inside "not". For step 2, compare the key fact of case 1 with the words of answer 1. For step 4, a cited id that is not a key of FAQ points to a chunk that was never given.',
              },
              fr: {
                instructions:
                  'Note les réponses d’un jeu d’évaluation comme un développeur. Le code contient la FAQ de *Lumo*, un éclairage de vélo solaire inventé, cinq cas de test pour son bot d’aide et les réponses de la version RAG du bot, écrits pour cet exercice et non par un vrai modèle. Dans le code, tout est en anglais\u00a0: eval_set est le jeu d’évaluation, key_fact le fait clé, should_abstain indique si le bot doit s’abstenir, et «\u00a0I don’t know\u00a0» signifie «\u00a0je ne sais pas\u00a0». Ton code est enregistré, pas exécuté\u00a0: suis-le à la main.\n\n1. Écris ce qu’affiche la boucle pour chaque cas, et le score final.\n2. Lis toi-même les réponses, avec la FAQ. Quel verdict du programme de notation est faux, et comment corrigerais-tu la vérification\u00a0?\n3. Le cas\u00a02 est réussi, mais sa vérification est fragile\u00a0: quelle réponse fausse la passerait aussi\u00a0?\n4. Complète citations_ok, affiche son résultat pour chaque cas, et nomme l’échec qu’elle détecte.\n5. Ajoute deux cas tirés de ton tableau RAG-time ou de tes tours sur papier (tu peux écrire les questions en français).\n6. Dans un commentaire, écris les trois taux que tu présenterais, et explique pourquoi le jeu doit rester le même quand tu modifies le prompt.',
                hint: 'En Python, in cherche un morceau de texte n’importe où dans un autre\u00a0: "no" se trouve donc dans "know" et dans "not". Pour l’étape\u00a02, compare le fait clé du cas\u00a01 avec les mots de la réponse\u00a01. Pour l’étape\u00a04, un identifiant cité qui n’est pas une clé de FAQ désigne un passage qui n’a jamais été fourni.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# The help bot of Lumo, an invented solar bike light, may cite these FAQ chunks.',
                'FAQ = {',
                '    "S1": "Three hours of direct sun give about 10 hours of light.",',
                '    "S2": "Lumo resists rain, but it must never be put under water.",',
                '    "S3": "The warranty lasts 2 years and covers the battery.",',
                '    "S4": "Lumo is sold only on its own website.",',
                '}',
                '',
                '# The evaluation set, written BEFORE testing:',
                '# (question, key fact a correct answer must contain, supporting chunk, should it abstain?)',
                'eval_set = [',
                '    ("How long is the warranty?", "2 years", "S3", False),',
                '    ("Can I use the light under water?", "no", "S2", False),',
                '    ("How many hours of light after 3 hours of sun?", "10 hours", "S1", False),',
                '    ("Does it work with a phone app?", None, None, True),  # not in the FAQ',
                '    ("Why did Lumo win the 2025 design prize?", None, None, True),  # false premise',
                ']',
                '',
                '# The answers of the RAG version of the bot. Written for this exercise, not by a real model.',
                'answers = [',
                '    {"text": "The warranty lasts two years. [S3]", "cited": ["S3"]},',
                '    {"text": "No: it resists rain, but it must not go under water. [S2]", "cited": ["S2"]},',
                '    {"text": "About 10 hours of light. [S1]", "cited": ["S1"]},',
                '    {"text": "I don\'t know: the FAQ does not mention an app.", "cited": []},',
                '    {"text": "It won for its clever solar design. [S5]", "cited": ["S5"]},',
                ']',
                '',
                '',
                'def abstained(answer):',
                '    return "i don\'t know" in answer["text"].lower()',
                '',
                '',
                'def is_correct(case, answer):',
                '    _, key_fact, _, should_abstain = case',
                '    if should_abstain:',
                '        return abstained(answer)',
                '    return key_fact in answer["text"].lower()',
                '',
                '',
                'def citations_ok(case, answer):',
                '    # TODO: return False if a cited id is not a key of FAQ, or if the case has a',
                '    # supporting chunk that the answer does not cite; otherwise return True.',
                '    return True',
                '',
                '',
                'correct = 0',
                'for case, answer in zip(eval_set, answers):',
                '    if is_correct(case, answer):',
                '        correct += 1',
                '        print(case[0], "-> correct")',
                '    else:',
                '        print(case[0], "-> WRONG")',
                'print(correct, "out of", len(eval_set), "correct")',
                '',
                '# My trace, my fixes and my two new cases / Ma trace, mes corrections et mes deux cas :',
              ),
            },
          },
          {
            id: 'm1-l2-b8',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding of the whole module: how language models are built, why they make things up, retrieval and evaluation.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu as compris de tout le module\u00a0: la construction des modèles de langage, les raisons de leurs inventions, la récupération et l’évaluation.',
              },
            },
            data: { quizId: 'quiz-m1' },
          },
          {
            id: 'm1-l2-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of a question-answering product you could build in this course, such as a help bot for a club or a revision assistant based on your own notes. Which documents would it retrieve from, which three cases would you put first in its evaluation set, and what should it do when its sources do not contain the answer? If you did RAG-time or the paper version, use one of your results.',
              },
              fr: {
                prompt:
                  'Pense à un produit de questions-réponses que tu pourrais construire dans ce cours, comme un bot d’aide pour un club ou un assistant de révision fondé sur tes propres notes. Dans quels documents irait-il chercher, quels trois cas mettrais-tu en premier dans son jeu d’évaluation, et que devrait-il faire quand ses sources ne contiennent pas la réponse\u00a0? Si tu as fait RAG-time ou la version sur papier, appuie-toi sur l’un de tes résultats.',
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
      id: 'quiz-m1',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: advanced generative AI',
            instructions:
              'Seven questions on how language models are built, why they make things up, retrieval and evaluation. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: IA générative avancée',
            instructions:
              'Sept questions sur la construction des modèles de langage, les raisons de leurs inventions, la récupération et l’évaluation. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A team notices that its chatbot writes fluent essays but often miscounts the letters in long words. What is the most likely reason?',
              },
              fr: {
                prompt:
                  'Une équipe remarque que son chatbot écrit des dissertations fluides mais compte souvent mal les lettres des mots longs. Quelle est la raison la plus probable\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The model reads tokens, often pieces of words, not single letters' },
                  fr: {
                    text: 'Le modèle lit des tokens, souvent des morceaux de mots, et non des lettres une à une',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Its temperature is set too low' },
                  fr: { text: 'Sa température est réglée trop bas' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Its knowledge cutoff is too old' },
                  fr: { text: 'Sa date limite de connaissances est trop ancienne' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'A long word does not fit in its context window' },
                  fr: { text: 'Un mot long ne tient pas dans sa fenêtre de contexte' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The tokenizer turns text into tokens that are often whole words or chunks of words, so the model never sees the letters one by one. Exact jobs such as counting are better handed to ordinary code.',
              },
              fr: {
                text: 'Le tokeniseur transforme le texte en tokens qui sont souvent des mots entiers ou des morceaux de mots\u00a0: le modèle ne voit donc jamais les lettres une à une. Les tâches exactes comme compter sont mieux confiées à du code ordinaire.',
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
                  'At temperature 1, a model gives its next tokens these probabilities: mat 67%, floor 24%, moon 9%. What happens if the temperature is lowered to 0.5?',
              },
              fr: {
                prompt:
                  'À la température 1, un modèle donne ces probabilités aux tokens suivants\u00a0: tapis 67\u00a0%, sol 24\u00a0%, lune 9\u00a0%. Que se passe-t-il si l’on abaisse la température à 0,5\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The three tokens become equally likely' },
                  fr: { text: 'Les trois tokens deviennent également probables' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'mat becomes even more likely, and moon becomes rarer' },
                  fr: { text: 'tapis devient encore plus probable, et lune devient plus rare' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'moon becomes the most likely token' },
                  fr: { text: 'lune devient le token le plus probable' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Whatever token is picked, the answer becomes more likely to be true',
                  },
                  fr: {
                    text: 'Quel que soit le token choisi, la réponse a plus de chances d’être vraie',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A temperature below 1 sharpens the distribution: here mat rises to about 87% and moon falls to about 2%. The output becomes more predictable, not more true.',
              },
              fr: {
                text: 'Une température inférieure à 1 rend la distribution plus tranchée\u00a0: ici, tapis monte à environ 87\u00a0% et lune descend à environ 2\u00a0%. La sortie devient plus prévisible, pas plus vraie.',
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
                  'Which statements about how a chat assistant is built are true? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Quelles affirmations sur la construction d’un assistant conversationnel sont vraies\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Pre-training teaches the model to predict the next token over a huge collection of text',
                  },
                  fr: {
                    text: 'Le pré-entraînement apprend au modèle à prédire le token suivant sur une immense collection de textes',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Pre-training needs people to label every sentence' },
                  fr: {
                    text: 'Le pré-entraînement demande que des personnes étiquettent chaque phrase',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Instruction tuning uses example conversations to teach the model to follow instructions',
                  },
                  fr: {
                    text: 'L’ajustement par instructions utilise des exemples de conversations pour apprendre au modèle à suivre des consignes',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: "Preference tuning trains the model on people's choices between two answers",
                  },
                  fr: {
                    text: 'L’ajustement par préférences entraîne le modèle à partir des choix de personnes entre deux réponses',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: "Preference tuning guarantees that the model's answers are true" },
                  fr: {
                    text: 'L’ajustement par préférences garantit que les réponses du modèle sont vraies',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Pre-training is self-supervised: the text supplies its own answers, so nobody labels it. Instruction tuning and preference tuning then shape how the model behaves. Preference tuning rewards the answers people rate higher, which can include answers that only sound right.',
              },
              fr: {
                text: 'Le pré-entraînement est auto-supervisé\u00a0: le texte fournit ses propres réponses, donc personne ne l’étiquette. L’ajustement par instructions et l’ajustement par préférences façonnent ensuite le comportement du modèle. L’ajustement par préférences récompense les réponses que les gens notent mieux, y compris celles qui ont seulement l’air justes.',
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
                  'During a conversation, a language model updates its parameters with what you tell it, so it will remember you in your next conversation.',
              },
              fr: {
                prompt:
                  'Pendant une conversation, un modèle de langage met à jour ses paramètres avec ce que tu lui dis\u00a0: il se souviendra donc de toi lors de ta prochaine conversation.',
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
                text: 'False. The parameters do not change while you chat: the model only uses what is in its context window. An app that seems to remember you stores notes and puts them back into the context. Conversations may be used to train a future version, but only in a later training run.',
              },
              fr: {
                text: 'Faux. Les paramètres ne changent pas pendant que tu discutes\u00a0: le modèle n’utilise que ce qui se trouve dans sa fenêtre de contexte. Une application qui semble se souvenir de toi enregistre des notes et les replace dans le contexte. Des conversations peuvent servir à entraîner une version future, mais seulement lors d’un entraînement ultérieur.',
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
                  'For one question, a RAG help bot retrieved the chunks S1 to S4. Its answer cites [S2] and [S7]. What should the app do?',
              },
              fr: {
                prompt:
                  'Pour une question, un bot d’aide RAG a récupéré les passages S1 à S4. Sa réponse cite [S2] et [S7]. Que doit faire l’application\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Show the answer: two citations make it more trustworthy' },
                  fr: { text: 'Afficher la réponse\u00a0: deux citations la rendent plus fiable' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Treat [S7] as an invented citation: hold back or flag the answer, and add the case to the evaluation set',
                  },
                  fr: {
                    text: 'Traiter [S7] comme une citation inventée\u00a0: retenir ou signaler la réponse, et ajouter le cas au jeu d’évaluation',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Raise the temperature and ask again' },
                  fr: { text: 'Augmenter la température et reposer la question' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Delete S2 from the documents' },
                  fr: { text: 'Supprimer S2 des documents' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'S7 was never given to the model, so the citation is invented, and so may be the claim attached to it. Checking cited ids against the retrieved chunks is a cheap automatic test, and the case belongs in your evaluation set.',
              },
              fr: {
                text: 'S7 n’a jamais été fourni au modèle\u00a0: la citation est donc inventée, et l’affirmation qui s’y rattache l’est peut-être aussi. Comparer les identifiants cités aux passages récupérés est un test automatique peu coûteux, et ce cas a sa place dans ton jeu d’évaluation.',
              },
            },
          },
          {
            id: 'q6',
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  "You are writing the evaluation set of a RAG bot that answers questions about a school club's rules. Which cases should it include? Choose all the right answers.",
              },
              fr: {
                prompt:
                  'Tu écris le jeu d’évaluation d’un bot RAG qui répond aux questions sur le règlement d’un club du lycée. Quels cas doit-il contenir\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Questions that the rules answer, with the expected key facts written in advance',
                  },
                  fr: {
                    text: 'Des questions auxquelles le règlement répond, avec les faits clés attendus écrits à l’avance',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'A question that the rules do not answer, for which the right answer is "I don\'t know"',
                  },
                  fr: {
                    text: 'Une question à laquelle le règlement ne répond pas, pour laquelle la bonne réponse est «\u00a0je ne sais pas\u00a0»',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'A question with a false premise, about a rule that does not exist' },
                  fr: {
                    text: 'Une question fondée sur une fausse prémisse, à propos d’une règle qui n’existe pas',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Only questions that you have already seen the bot answer well' },
                  fr: {
                    text: 'Uniquement des questions auxquelles tu as déjà vu le bot bien répondre',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: "Questions whose expected answers you write after reading the bot's output",
                  },
                  fr: {
                    text: 'Des questions dont tu écris les réponses attendues après avoir lu la sortie du bot',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A useful evaluation set is written before testing and covers the cases in which the bot should answer, abstain or correct the question. Picking easy questions, or writing the expected answers after seeing the output, measures nothing.',
              },
              fr: {
                text: 'Un jeu d’évaluation utile est écrit avant les tests et couvre les cas où le bot doit répondre, s’abstenir ou corriger la question. Choisir des questions faciles, ou écrire les réponses attendues après avoir vu la sortie, ne mesure rien.',
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
                  'What do we call an output of a language model that is fluent and confident but false, or not supported by its sources? (one word)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on une sortie d’un modèle de langage fluide et assurée, mais fausse ou non étayée par ses sources\u00a0? (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'hallucination',
                'a hallucination',
                'an hallucination',
                'hallucinations',
                'hallucinating',
                'confabulation',
                'a confabulation',
              ],
              fr: [
                'hallucination',
                'une hallucination',
                'l’hallucination',
                "l'hallucination",
                'hallucinations',
                'des hallucinations',
                'les hallucinations',
                'confabulation',
                'une confabulation',
              ],
            },
            explanation: {
              en: {
                text: 'A hallucination. Some researchers prefer the word confabulation. Grounding answers in retrieved sources, checking citations and measuring with an evaluation set reduce the problem, but none of them removes it completely.',
              },
              fr: {
                text: 'Une hallucination. Certains chercheurs préfèrent le mot confabulation. Ancrer les réponses dans des sources récupérées, vérifier les citations et mesurer avec un jeu d’évaluation réduisent le problème, mais aucune de ces méthodes ne le supprime complètement.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
