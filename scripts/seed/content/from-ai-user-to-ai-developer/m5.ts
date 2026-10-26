// Module m5 of "From AI User to AI Developer" (ages 15-18): language models and chatbots. It
// comes after m4 (computer vision) and before m3 (ship it responsibly, with the capstone, which
// stays last). It builds on m1 (features and labels, the unseen test set, the threshold and the
// precision/recall trade-off of m1-l3), on m2-l2 (calling a language model through an API, keys
// kept secret) and on m4-l2 (shortcut learning: "Train an image classifier, then fool it").
// m5-l1: intents, example utterances, entities, responses, a confidence threshold and its
// trade-off, the fallback, the handover to a person, conversation design, an evaluation set
// written before training, and an intent-based bot compared with a large language model chatbot
// (when each fits, and hybrids). The hook is Moffatt v. Air Canada (2024 BCCRT 149): the airline
// was held responsible for what its website chatbot said; the text does not say what kind of
// chatbot it was, which is not established. The video reuses the Code.org "How AI Works" video on
// chatbots and large language models (X-AWdfSFCHQ), already curated in build-with-generative-ai
// m1-l1 and ai-essentials-for-educators m1-l1. The code activity routes five messages with a toy
// word-overlap classifier, traced by hand (checked with Python 3: meeting_time 71, cost 60, join
// 40, meeting_time 20, complaint 83; with THRESHOLD 50, messages 3 and 4 fall back; at 65,
// message 2 does too). The design card that ends the lesson is the plan of m5-l2.
// m5-l2: Machine Learning for Kids, Chatbots, Python version (worksheet-chatbots-python.pdf, last
// updated 9 May 2020; teacher's notes teachersnotes-chatbots.pdf and teachersnotes-chatbots-fr.pdf,
// written for the Scratch version, which point to the Python one). The worksheet logs in with a
// class account, but the site's Make page offers Python for every text project (supportedMakes in
// projects.service.js), Try it now included, so access is try_it_now and step 2 says to skip the
// login. Step 2 also says to delete the fooled project of m4-l2 if it is still there: in course
// order that activity comes two lessons earlier, and Try it now keeps one project at a time. The
// site's Python sample puts the project key in the URL it calls, and the same key lets anyone
// add training examples to the project; deleting a project deletes its keys (deleteEntireProject).
// Hence the key rules: the ML4K page and the learner's own notebook only, YOUR-KEY in anything
// brought back, never pasted into RoboHolic. quiz-m5 q4 tests those rules and the deletion, not
// the environment variable, which quiz-m2 already tests. The template (code_activity, stage
// build) is our own code around the classify function the learner pastes from the site: it
// reproduces neither the site's sample nor the worksheet's answer_question script. Its route
// checks HUMAN_LABELS before the threshold, so a possible complaint reaches a person even when the
// model is unsure (as m5-l1-b2 says), and it prints the five columns project-m5 asks for. THRESHOLD
// starts at 0, so that the first run shows the model's own label for every question (a threshold
// would hide it behind "fallback"); the learner then sets it and runs again. Hand-in
// project-m5 (assignment, 150 XP, not needed for the certificate) takes code, text or image (a
// photo of the paper table); a code submission carries no attachments, so the table and the
// failure go in "About your work".
// m5-l3: Machine Learning for Kids, Tourist Info (worksheet-touristinfo.pdf, intermediate, Scratch
// 3, last updated 13 January 2021, written for Try it now; teacher's notes
// teachersnotes-touristinfo.pdf and teachersnotes-touristinfo-fr.pdf: training bias, 1 hour, "more
// effective as a follow-on to another project", which m5-l2 is). Big ideas: who wrote the data,
// what it covers, examples per label, labelling choices, shortcuts; measuring with the same test
// set before and after; a mini model card. It links forward to m3-l1, which adds the other sources
// of bias, per-group results and the full model card; it repeats neither m3-l1's list nor its case
// studies. The attractions of the worksheet are not listed (the learner takes them from the PDF).
// Try it now keeps one project at a time, so step 1 says to delete the FAQ bot project once it is
// handed in. The Scratch app (steps 5 and 6) is optional: the before/after measurement needs only
// the Learn & Test box, and the teacher's notes plan 1 hour for the whole worksheet. The paper
// version's tie rule ends with "not sure", so that a 3-3-3 or 0-0-0 tie has an answer. The hand-in
// is a reflection block with stage 'build' (no second project), followed
// by the module quiz quiz-m5 (all three lessons) and the closing reflection.
// The worksheets are CC BY-NC-SA 4.0: they are linked, never copied or translated, and the numbered
// steps are our own framing that defers to the PDF for the clicks. French learners get the English
// PDFs; the French site's labels are Essayer maintenant, Entraîner, Apprendre & Tester and Faire.
// Unlike the older course file, rich_text bodies here carry no Markdown headings. Modules and
// lessons are named, not numbered, in the text, because m4 and m5 sit between m2 and m3.

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
          title: 'Language models and chatbots',
          description:
            'Design a chatbot with intents and fallbacks, call your own trained text model from Python, and build a biased recommender on purpose to see how bias gets in.',
        },
        fr: {
          title: 'Modèles de langage et chatbots',
          description:
            'Conçois un chatbot avec des intentions et des réponses de repli, appelle depuis Python ton propre modèle de texte, et construis exprès un système de recommandation biaisé pour voir comment les biais s’y installent.',
        },
      },
    },
    lessons: [
      // --- m5-l1: design a chatbot ----------------------------------------------------------------
      {
        id: 'm5-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Design a chatbot',
              summary:
                'Intents, example utterances, entities, a confidence threshold, a fallback and a handover to a person: design a chatbot like a professional, and know when a large language model fits better.',
            },
            fr: {
              title: 'Conçois un chatbot',
              summary:
                'Intentions, exemples de formulations, entités, seuil de confiance, réponse de repli et transfert vers une personne\u00a0: conçois un chatbot comme un professionnel, et sache quand un grand modèle de langage convient mieux.',
            },
          },
          estimatedMinutes: 35,
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
                heading: 'When a chatbot gets it wrong, who is responsible?',
                body: 'You type into a club\'s help chat: *"Can I bring a friend to the next meeting?"* The bot replies: *"Membership is free!"* It did not understand you, but it answered anyway, as if it were sure.\n\nA real case: in 2024, a tribunal in British Columbia, Canada, ordered Air Canada to compensate a passenger. The airline\'s website chatbot had said that a reduced bereavement fare could be claimed after travelling, which was not the airline\'s policy. Air Canada argued that it could not be held liable for what its chatbot said, as if the chatbot were responsible for its own words; the tribunal answered that a company is responsible for all the information on its website, chatbot included.\n\nA chatbot speaks for whoever runs it, and a bot that answers when it should say *"I\'m not sure"* does real harm. In this lesson you will design one the way professionals do: what it recognises, what it answers, when it admits that it has not understood, and when it hands over to a person.',
              },
              fr: {
                heading: 'Quand un chatbot se trompe, qui est responsable\u00a0?',
                body: 'Tu écris dans la messagerie d’aide d’un club\u00a0: *«\u00a0Je peux venir avec un ami à la prochaine réunion\u00a0?\u00a0»* Le bot répond\u00a0: *«\u00a0L’adhésion est gratuite\u00a0!\u00a0»* Il ne t’a pas compris, mais il a répondu quand même, comme s’il était sûr de lui.\n\nUn cas réel\u00a0: en 2024, un tribunal de Colombie-Britannique, au Canada, a condamné Air Canada à indemniser un passager. Le chatbot du site de la compagnie lui avait dit qu’un tarif réduit accordé en cas de deuil pouvait être demandé après le voyage, ce qui n’était pas la politique de la compagnie. Air Canada a soutenu qu’elle ne pouvait pas être tenue responsable de ce qu’avait dit son chatbot, comme si celui-ci était responsable de ses propres paroles\u00a0; le tribunal a répondu qu’une entreprise est responsable de toutes les informations de son site, chatbot compris.\n\nUn chatbot parle au nom de celui qui le met en service, et un bot qui répond alors qu’il devrait dire *«\u00a0je ne suis pas sûr\u00a0»* cause de vrais dégâts. Dans cette leçon, tu vas en concevoir un comme le font les professionnels\u00a0: ce qu’il reconnaît, ce qu’il répond, quand il admet qu’il n’a pas compris, et quand il passe la main à une personne.',
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
                heading: 'Intents, utterances, entities and a threshold',
                body: 'Many help-desk and FAQ chatbots, especially those built with intent-based tools, rest on a **text classifier**, a cousin of the spam filter of the first module: here the features are the words of the message, and the label is what the user wants.\n\n- **Intent:** what the user wants to do or know, such as `meeting_time`, `join` or `cost`. Each intent is a label.\n- **Example utterances:** the training examples of an intent, many ways of asking the same thing: *"When do we meet?"*, *"what time\'s club"*, *"Is it on Wednesdays?"*. Varied examples (short and long, formal and casual, with typos) help the model generalise.\n- **Entities** (or slots): the details the answer depends on. In *"Does the chess club meet on Friday?"*, the intent is `meeting_time`; *chess club* and *Friday* are entities, usually picked out with lists, patterns or a second model.\n- **Responses:** one answer per intent, written and checked by a person. The bot can only say what you wrote.\n\n**Confidence and the fallback.** The classifier gives each intent a score, its confidence. Above a **confidence threshold**, the bot gives the answer of the top intent; below it, it gives a **fallback**: *"Sorry, I didn\'t get that. I can tell you when we meet, how to join or what it costs."* It is the threshold of *Is it any good? Measuring a model* again:\n\n| Threshold | Confident wrong answers | Fallbacks on questions it could have answered |\n|---|---|---|\n| Too low | Many | Few |\n| Too high | Few | Many |\n\nYou choose it from tests, not by guessing.\n\n**Handover to a person.** Some messages should reach a person whatever the confidence: complaints, anything about safety or someone\'s wellbeing, and anyone who asks for a human. After two fallbacks in a row, offer to pass the user to a person, too. And a bot never pretends to be a person.',
              },
              fr: {
                heading: 'Intentions, formulations, entités et seuil',
                body: 'Beaucoup de chatbots d’assistance et de FAQ, en particulier ceux construits avec des outils à intentions, reposent sur un **classifieur de texte**, cousin du filtre anti-spam du premier module\u00a0: ici, les caractéristiques sont les mots du message, et l’étiquette est ce que veut l’utilisateur.\n\n- **Intention** (*intent*)\u00a0: ce que l’utilisateur veut faire ou savoir, par exemple `horaires`, `inscription` ou `prix`. Chaque intention est une étiquette.\n- **Exemples de formulations** (*utterances*)\u00a0: les exemples d’entraînement d’une intention, autant de façons de demander la même chose\u00a0: *«\u00a0On se retrouve quand\u00a0?\u00a0»*, *«\u00a0c’est à quelle heure le club\u00a0»*, *«\u00a0C’est le mercredi\u00a0?\u00a0»*. Des exemples variés (courts et longs, soutenus et familiers, avec des fautes de frappe) aident le modèle à généraliser.\n- **Entités** (*entities* ou *slots*)\u00a0: les détails dont dépend la réponse. Dans *«\u00a0Le club d’échecs se réunit-il vendredi\u00a0?\u00a0»*, l’intention est `horaires`\u00a0; *club d’échecs* et *vendredi* sont des entités, repérées en général avec des listes, des motifs ou un second modèle.\n- **Réponses**\u00a0: une réponse par intention, écrite et vérifiée par une personne. Le bot ne peut dire que ce que tu as écrit.\n\n**La confiance et la réponse de repli.** Le classifieur donne à chaque intention un score, sa confiance. Au-dessus d’un **seuil de confiance**, le bot donne la réponse de l’intention arrivée en tête\u00a0; en dessous, il donne une **réponse de repli** (*fallback*)\u00a0: *«\u00a0Désolé, je n’ai pas compris. Je peux te dire quand on se réunit, comment s’inscrire ou combien ça coûte.\u00a0»* On retrouve ici le seuil de la leçon *Est-il vraiment bon\u00a0? Mesurer un modèle*\u00a0:\n\n| Seuil | Mauvaises réponses assurées | Replis sur des questions auxquelles il aurait pu répondre |\n|---|---|---|\n| Trop bas | Nombreuses | Rares |\n| Trop haut | Rares | Nombreux |\n\nOn le choisit à partir de tests, pas au hasard.\n\n**Le transfert vers une personne** (*handover*). Certains messages doivent arriver à une personne, quelle que soit la confiance\u00a0: les réclamations, tout ce qui touche à la sécurité ou au bien-être de quelqu’un, et toute personne qui demande à parler à un humain. Après deux replis de suite, propose aussi de parler à une personne. Et un bot ne se fait jamais passer pour un humain.',
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
                heading: 'Design the conversation, test it, choose the right kind of bot',
                body: '**Conversation design.** A chatbot is a small conversation written in advance:\n\n- **Say what the bot is and what it can do:** *"Hi, I\'m the robotics club\'s bot. I can tell you when we meet, how to join and what it costs."*\n- **Keep answers short**, ask one question at a time, and **confirm before acting** (*"Shall I add you to Wednesday\'s list?"*).\n- **Always leave a way out:** *help*, *start again*, *talk to a person*.\n- **Add an out-of-scope intent**, trained on what the bot will not handle (homework answers, gossip), so that those messages get a clear *"I can\'t help with that"*.\n\n**An evaluation set.** Before training, write 20 to 30 test messages for a real bot (10 are enough for the bot you build in this module), each with the intent you expect, including out-of-scope ones (expected: the fallback, or your out-of-scope intent) and some that need a person. Like the test set of the first module, they are never used for training; strictly, a set you use to choose the threshold is a validation set, so keep a few extra messages for one final check. Count the messages routed correctly, the undeserved fallbacks and the confident wrong answers, and use the confidences to choose the threshold.\n\n**Intent bot or large language model?** Chatbots that write fluent answers on any topic are built on large language models, like the one you called in *Call an AI model from code*:\n\n| | Intent-based bot | Large language model chatbot |\n|---|---|---|\n| Answers | Written by you, one per intent | New text, generated token by token |\n| Handles | Only the intents it was trained on | Almost any wording and topic |\n| Typical failure | The wrong intent, or too many fallbacks | Fluent but wrong or invented answers; prompt injection |\n| Testing | You can read every answer it can give | Endless possible replies: you test samples and add checks |\n| Cost | A small model, cheap to run | Charged per token |\n| Fits | Facts that must be exact: times, rules, prices | Open tasks: explaining, rephrasing, brainstorming |\n\nMany real assistants combine both: a classifier routes each message, fixed answers handle the facts, a language model handles open questions, and a person handles the rest. Whatever you build, say that it is a bot, know when to say *"I don\'t know"*, and leave a way to reach a person.',
              },
              fr: {
                heading: 'Concevoir la conversation, la tester, choisir le bon type de bot',
                body: '**La conception de la conversation.** Un chatbot, c’est une petite conversation écrite à l’avance\u00a0:\n\n- **Dis ce qu’est le bot et ce qu’il sait faire\u00a0:** *«\u00a0Bonjour, je suis le bot du club de robotique. Je peux te dire quand on se réunit, comment s’inscrire et combien ça coûte.\u00a0»*\n- **Fais des réponses courtes**, pose une question à la fois, et **demande confirmation avant d’agir** (*«\u00a0Je t’inscris sur la liste de mercredi\u00a0?\u00a0»*).\n- **Laisse toujours une porte de sortie\u00a0:** *aide*, *recommencer*, *parler à une personne*.\n- **Ajoute une intention «\u00a0hors sujet\u00a0»**, entraînée sur ce que le bot ne traitera pas (les réponses aux devoirs, les rumeurs), pour que ces messages reçoivent un *«\u00a0Je ne peux pas t’aider pour ça\u00a0»* clair.\n\n**Un jeu d’évaluation.** Avant l’entraînement, écris 20 à 30 messages de test pour un vrai bot (10 suffisent pour celui de ce module), chacun avec l’intention attendue, dont des messages hors sujet (réponse attendue\u00a0: le repli, ou ton intention «\u00a0hors sujet\u00a0») et d’autres qui doivent être transmis à une personne. Comme le jeu de test du premier module, ils ne servent jamais à l’entraînement\u00a0; à strictement parler, un jeu qui sert à choisir le seuil est un jeu de validation, alors garde quelques messages de plus pour une seule vérification finale. Compte les messages bien orientés, les replis injustifiés et les mauvaises réponses assurées, et sers-toi des scores de confiance pour choisir le seuil.\n\n**Bot à intentions ou grand modèle de langage\u00a0?** Les chatbots qui écrivent des réponses fluides sur n’importe quel sujet reposent sur de grands modèles de langage, comme celui que tu as appelé dans la leçon *Appeler un modèle d’IA depuis ton code*\u00a0:\n\n| | Bot à intentions | Chatbot à grand modèle de langage |\n|---|---|---|\n| Réponses | Écrites par toi, une par intention | Un texte nouveau, produit token après token |\n| Ce qu’il traite | Seulement les intentions apprises | Presque toutes les formulations et tous les sujets |\n| Échec typique | La mauvaise intention, ou trop de replis | Des réponses fluides mais fausses ou inventées\u00a0; l’injection de prompt |\n| Tests | Tu peux lire toutes les réponses qu’il peut donner | Des réponses possibles à l’infini\u00a0: on teste des échantillons et on ajoute des contrôles |\n| Coût | Un petit modèle, peu coûteux | Facturé au token |\n| Convient pour | Des faits qui doivent être exacts\u00a0: horaires, règles, prix | Des tâches ouvertes\u00a0: expliquer, reformuler, trouver des idées |\n\nBeaucoup d’assistants réels combinent les deux\u00a0: un classifieur oriente chaque message, des réponses fixes traitent les faits, un modèle de langage traite les questions ouvertes, et une personne s’occupe du reste. Quoi que tu construises, dis que c’est un bot, sache dire *«\u00a0je ne sais pas\u00a0»*, et laisse un moyen de joindre une personne.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b4',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: how chatbots and large language models work',
                caption:
                  "From Code.org's How AI Works series (about seven minutes): how the other kind of chatbot writes its answers.",
                transcript:
                  'In short: chatbots that write their own answers are built on large language models, which apply simple statistics at an enormous scale. The video starts with a small model trained on the works of Shakespeare that learns how likely each letter is to follow another, then uses those probabilities to write new text. Longer sequences give more context and far more convincing text. Trained on vast amounts of text, a large language model writes fluent answers on almost any topic, but each answer is still built from probabilities and can contain mistakes. For this lesson: an intent-based bot can only choose among the answers you wrote; a language model writes new ones, which is both its strength and its risk.',
              },
              fr: {
                title:
                  'Regarde\u00a0: comment fonctionnent les chatbots et les grands modèles de langage',
                caption:
                  'Une vidéo de la série How AI Works de Code.org (environ sept minutes)\u00a0: comment l’autre type de chatbot écrit ses réponses (vidéo en anglais).',
                transcript:
                  'En bref\u00a0: les chatbots qui écrivent leurs propres réponses reposent sur de grands modèles de langage, qui appliquent des statistiques simples à une échelle énorme. La vidéo part d’un petit modèle entraîné sur les œuvres de Shakespeare, qui apprend la probabilité qu’une lettre en suive une autre, puis se sert de ces probabilités pour écrire un nouveau texte. Des suites plus longues donnent plus de contexte et un texte bien plus convaincant. Entraîné sur d’immenses quantités de textes, un grand modèle de langage écrit des réponses fluides sur presque n’importe quel sujet, mais chaque réponse reste construite à partir de probabilités et peut contenir des erreurs. Pour cette leçon\u00a0: un bot à intentions ne peut que choisir parmi les réponses que tu as écrites\u00a0; un modèle de langage en écrit de nouvelles, et c’est à la fois sa force et son risque.',
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
            id: 'm5-l1-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "The robotics club's bot below routes each message to an intent. The function classify is a toy stand-in for a trained model: it counts the words of the message that appear in each intent's examples, and turns the best count into a confidence from 0 to 100. Your code is saved, not run, so trace it by hand:\n\n1. For each test message, work out the intent and the confidence that classify returns. Which messages get a wrong answer from the starter code?\n2. TODO 1: complete reply so that a confidence below THRESHOLD gives the FALLBACK. Which replies change?\n3. TODO 2: a complaint must always reach a person: return HANDOVER for that intent. Put this check before the threshold check, and say in a comment why the order matters.\n4. In a comment: what would THRESHOLD = 65 change? Which kind of mistake goes down, and which goes up?\n5. In a comment: message 1 contains an entity; which one, and what should a better bot do with it? The words *the* and *is* appear in several intents: which confidences do they inflate, and how would you fix that?\n6. TODO 3: add two test messages of your own, one of them out of scope, with the reply you expect.",
                hint: 'Worked example for message 1: its words are what, time, do, we, meet, on and friday. The meeting_time examples contain five of them (what, time, do, we, meet), so the confidence is round(100 * 5 / 7) = 71. strip removes only ?, ! and . at the two ends of the message: a comma or an apostrophe stays part of its word ("hi," is not "hi"). A later intent wins only with a strictly higher score.',
              },
              fr: {
                instructions:
                  'Le bot du club de robotique ci-dessous oriente chaque message vers une intention. La fonction classify est un modèle-jouet qui remplace un vrai modèle entraîné\u00a0: elle compte les mots du message présents dans les exemples de chaque intention, et transforme le meilleur total en une confiance de 0 à 100. Le code est en anglais, comme dans le reste du cours. Il est enregistré, pas exécuté\u00a0: suis-le à la main.\n\n1. Pour chaque message de test, détermine l’intention et la confiance que renvoie classify. Quels messages reçoivent une mauvaise réponse avec le code de départ\u00a0?\n2. TODO\u00a01\u00a0: complète reply pour qu’une confiance inférieure à THRESHOLD donne la réponse de repli FALLBACK. Quelles réponses changent\u00a0?\n3. TODO\u00a02\u00a0: une réclamation (complaint) doit toujours arriver à une personne\u00a0: renvoie HANDOVER pour cette intention. Place ce test avant celui du seuil, et explique dans un commentaire pourquoi l’ordre compte.\n4. Dans un commentaire\u00a0: que changerait THRESHOLD = 65\u00a0? Quel type d’erreur diminue, et lequel augmente\u00a0?\n5. Dans un commentaire\u00a0: le message\u00a01 contient une entité\u00a0; laquelle, et que devrait en faire un meilleur bot\u00a0? Les mots *the* et *is* apparaissent dans plusieurs intentions\u00a0: quels scores de confiance gonflent-ils, et comment corriger cela\u00a0?\n6. TODO\u00a03\u00a0: ajoute deux messages de test en anglais, dont un hors sujet, avec la réponse que tu attends.',
                hint: 'Exemple résolu pour le message\u00a01\u00a0: ses mots sont what, time, do, we, meet, on et friday. Les exemples de meeting_time en contiennent cinq (what, time, do, we, meet)\u00a0; la confiance vaut donc round(100 * 5 / 7) = 71. strip ne retire que ?, ! et . aux deux bouts du message\u00a0: une virgule ou une apostrophe reste collée à son mot («\u00a0hi,\u00a0» n’est pas «\u00a0hi\u00a0»). Une intention placée plus loin ne gagne qu’avec un score strictement plus élevé.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                "# The robotics club's FAQ bot. classify is a toy stand-in for a trained text model.",
                'THRESHOLD = 50  # confidence, from 0 to 100',
                '',
                'EXAMPLES = {',
                '    "meeting_time": [',
                '        "when do we meet",',
                '        "what time does the club start",',
                '        "which day is the meeting",',
                '    ],',
                '    "join": [',
                '        "how can i join",',
                '        "can beginners sign up",',
                '        "i want to become a member",',
                '    ],',
                '    "cost": [',
                '        "how much does it cost",',
                '        "is the club free",',
                '        "do i need to pay",',
                '    ],',
                '    "complaint": [',
                '        "i want to make a complaint",',
                '        "something went wrong at the club",',
                '        "i have a problem with a member",',
                '    ],',
                '}',
                'RESPONSES = {',
                '    "meeting_time": "We meet every Wednesday at 12:30 in room B12.",',
                '    "join": "Just come to a meeting: beginners are welcome.",',
                '    "cost": "The club is free, and we lend the robot kits.",',
                '}',
                'FALLBACK = "Sorry, I didn\'t get that. I can tell you when we meet, how to join or what it costs."',
                'HANDOVER = "I\'m passing this to a club leader, who will answer you in person."',
                '',
                '',
                'def words_of(text):',
                '    """The lowercase words of a text, without the ?, ! or . at its ends."""',
                '    return text.lower().strip("?!.").split()',
                '',
                '',
                'def classify(message):',
                '    """Return the best intent and a confidence from 0 to 100, like a trained model."""',
                '    words = set(words_of(message))',
                '    best_intent, best_score = None, 0',
                '    for intent, examples in EXAMPLES.items():',
                '        vocabulary = {word for example in examples for word in words_of(example)}',
                '        score = len(words & vocabulary)',
                '        if score > best_score:',
                '            best_intent, best_score = intent, score',
                '    confidence = round(100 * best_score / len(words)) if words else 0',
                '    return best_intent, confidence',
                '',
                '',
                'def reply(message):',
                '    intent, confidence = classify(message)',
                '    # TODO 1: below THRESHOLD, return FALLBACK instead of guessing.',
                '    # TODO 2: a complaint must always reach a person, whatever the confidence: return HANDOVER.',
                '    return RESPONSES.get(intent, FALLBACK)',
                '',
                '',
                'TESTS = [',
                '    "What time do we meet on Friday?",',
                '    "Is it free for beginners?",',
                '    "Can I bring my dog?",',
                '    "Who won the robot race?",',
                '    "Something went wrong at the meeting.",',
                '    # TODO 3: add two messages of your own, one of them out of scope',
                ']',
                '',
                'for message in TESTS:',
                '    print(message, "->", reply(message))',
              ),
            },
          },
          {
            id: 'm5-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Ask the AI tutor to play a user of the club's bot and to send you tricky messages one at a time: a typo, slang, two questions in one, something off topic, someone upset. Say where each one should go (an intent, the fallback or a person) and why. Keep personal details out of your messages.",
                starterPrompt:
                  'I designed an FAQ chatbot for a school robotics club with four intents (meeting_time, join, cost and complaint), a fallback and a handover to a person. Challenge me: send me one tricky user message at a time and let me say where the bot should route it and why. Wait for my answer before you explain.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de jouer un utilisateur du bot du club et de t’envoyer des messages piégeux, un à la fois\u00a0: une faute de frappe, de l’argot, deux questions en une, un sujet sans rapport, quelqu’un de contrarié. Dis où chacun doit aller (une intention, le repli ou une personne), et pourquoi. Ne mets aucune information personnelle dans tes messages.',
                starterPrompt:
                  'J’ai conçu un chatbot de FAQ pour le club de robotique d’un lycée, avec quatre intentions (meeting_time, join, cost et complaint), une réponse de repli et un transfert vers une personne. Mets-moi au défi\u00a0: envoie-moi un message piégeux d’utilisateur à la fois et laisse-moi dire où le bot doit l’orienter, et pourquoi. Attends ma réponse avant d’expliquer.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm5-l1-b7',
            type: RICH,
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Your turn: design the FAQ bot you will train next',
                body: 'In the next lesson you will train a real model for your own FAQ bot. Start planning it now and finish before the next lesson, on paper or in a document, on a topic you know well, real or invented: a club, a hobby, a made-up museum. No names of real people or of your school.\n\n1. **Purpose:** who it is for, what it answers, and one thing it will **not** answer.\n2. **Intents:** 4 or 5, each with a short label (`meeting_time`, `cost`...), without accents or apostrophes, which the website does not accept in labels.\n3. **Utterances:** at least 6 varied examples per intent.\n4. **Responses:** one approved answer per intent, plus a **fallback** that says what the bot can do.\n5. **Handover:** what goes to a person, and how the user reaches them.\n6. **Evaluation set:** 10 test messages with the intent you expect, none of them among your examples: at least 2 out of scope and 1 that needs a person.\n\nKeep this design card: it is your plan for the next lesson.',
              },
              fr: {
                heading: 'À toi\u00a0: conçois le bot de FAQ que tu entraîneras ensuite',
                body: 'Dans la prochaine leçon, tu entraîneras un vrai modèle pour ton propre bot de FAQ. Prépare-le dès maintenant et termine-le avant la prochaine leçon, sur papier ou dans un document, sur un sujet que tu connais bien, réel ou inventé\u00a0: un club, un loisir, un musée imaginaire. Aucun nom de personne réelle ni de ton établissement.\n\n1. **Mission\u00a0:** à qui il s’adresse, à quoi il répond, et une chose à laquelle il **ne** répondra **pas**.\n2. **Intentions\u00a0:** 4 ou 5, chacune avec une étiquette courte (`horaires`, `prix`…), sans accents ni apostrophes, que le site n’accepte pas dans les étiquettes.\n3. **Formulations\u00a0:** au moins 6 exemples variés par intention.\n4. **Réponses\u00a0:** une réponse approuvée par intention, plus une **réponse de repli** qui dit ce que le bot sait faire.\n5. **Transfert\u00a0:** ce qui va à une personne, et comment l’utilisateur la joint.\n6. **Jeu d’évaluation\u00a0:** 10 messages de test avec l’intention attendue, dont aucun ne figure parmi tes exemples\u00a0: au moins 2 hors sujet et 1 qui doit être transmis à une personne.\n\nGarde cette fiche de conception\u00a0: c’est ton plan pour la prochaine leçon.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l1-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of a chatbot you have used (a shop, a bank, a game, a public service). Did it ever answer confidently when it had not understood you, or keep you away from a person? Using the words intent, threshold, fallback and handover, explain what its designers could change.',
              },
              fr: {
                prompt:
                  'Pense à un chatbot que tu as utilisé (une boutique, une banque, un jeu, un service public). T’a-t-il déjà répondu avec assurance alors qu’il ne t’avait pas compris, ou empêché de joindre une personne\u00a0? Avec les mots intention, seuil, repli et transfert, explique ce que ses concepteurs pourraient changer.',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },

      // --- m5-l2: use your own model from Python ----------------------------------------------------
      {
        id: 'm5-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Use your own model from Python',
              summary:
                'Train a question classifier for your FAQ bot on Machine Learning for Kids, call it from your own Python program with a threshold and a fallback, and test it honestly. Your project key stays secret.',
            },
            fr: {
              title: 'Utilise ton propre modèle depuis Python',
              summary:
                'Entraîne sur Machine Learning for Kids un classifieur de questions pour ton bot de FAQ, appelle-le depuis ton propre programme Python avec un seuil et une réponse de repli, et teste-le honnêtement. Ta clé de projet reste secrète.',
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
                heading: 'Your model, your code',
                body: 'In *Call an AI model from code*, your program called a model that someone else had trained, on data you will never see. This time the model is yours: you choose the labels, write every example and decide when it is good enough.\n\nYou will train the FAQ bot of your design card on Machine Learning for Kids, a free website for learning machine learning, then call it from Python. Once a model can be reached over the web, any program can use it: a chat window, a game, a robot. Your program sends a question and gets back a label and a confidence. Everything else (the answers, the threshold, the fallback, the handover) is your code, and your responsibility.\n\nPlan your 50 minutes: about 20 to train and test the model, 20 for the Python part and 10 for your hand-in.',
              },
              fr: {
                heading: 'Ton modèle, ton code',
                body: 'Dans la leçon *Appeler un modèle d’IA depuis ton code*, ton programme appelait un modèle entraîné par quelqu’un d’autre, sur des données que tu ne verras jamais. Cette fois, le modèle est à toi\u00a0: tu choisis les étiquettes, tu écris chaque exemple et tu décides quand il est assez bon.\n\nTu vas entraîner le bot de FAQ de ta fiche de conception sur Machine Learning for Kids, un site gratuit pour découvrir l’apprentissage automatique, puis l’appeler depuis Python. Dès qu’un modèle est accessible sur le Web, n’importe quel programme peut l’utiliser\u00a0: une fenêtre de discussion, un jeu, un robot. Ton programme envoie une question et reçoit une étiquette et une confiance. Tout le reste (les réponses, le seuil, le repli, le transfert) relève de ton code, et de ta responsabilité.\n\nOrganise tes 50\u00a0minutes\u00a0: environ 20 pour entraîner et tester le modèle, 20 pour la partie Python et 10 pour ton rendu.',
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
                heading: 'How your program talks to your model',
                body: "**Training.** In a **text** project, each label is an intent and each example an utterance. When you train, the website builds a model on its servers, and its **Learn & Test** page lets you type a question and see the label and confidence the model gives.\n\n**Calling it from Python.** The project's **Make** page, then **Python**, shows a short code sample: a function that sends text to your model over the web and returns the best label with its confidence, from 0 to 100. It uses the `requests` library, which may need installing. You also need a place to run Python that your teacher has approved, such as Jupyter. No Python? The backup plans below still cover the whole hand-in.\n\n**The project key is a secret.** The sample contains a key that identifies your project, inside the web address it calls. Anyone who has it can send text to your model, and even add training examples to your project. Treat it like the API key of *Call an AI model from code*:\n\n- it stays in two places only: the Machine Learning for Kids page and your own notebook or file;\n- before you bring anything back (code, a screenshot, a table), replace it with `YOUR-KEY`;\n- never paste it into RoboHolic: not into the tutor, a reflection or your hand-in;\n- better, read it from an environment variable, as this lesson's template does.\n\nIf your key ends up somewhere by mistake, delete the project: its key goes with it.\n\n**Testing it honestly.** Your evaluation set is now your test set: questions that are **not** training examples, including off-topic ones that should get the fallback (or your out-of-scope intent). Note the label and confidence of each, and mark it right or wrong. When the model fails, look for the cause in the examples: words shared by two labels, too few or too similar examples, a wording nobody wrote. Add varied examples, train again and rerun the **same** questions. Then choose a threshold that keeps most right answers above it and most wrong ones below. Because you choose the threshold on these same questions, they now work like the validation set of *Training, testing and overfitting*, and your score is a little optimistic: say so in your hand-in, or keep two extra questions aside and run them only once, at the very end.",
              },
              fr: {
                heading: 'Comment ton programme parle à ton modèle',
                body: '**L’entraînement.** Dans un projet de **texte**, chaque étiquette est une intention et chaque exemple une formulation. À l’entraînement, le site construit un modèle sur ses serveurs, et sa page **Apprendre & Tester** (*Learn & Test*) te permet de taper une question et de voir l’étiquette et la confiance que donne le modèle.\n\n**L’appel depuis Python.** La page **Faire** (*Make*) du projet, puis **Python**, montre un court exemple de code\u00a0: une fonction qui envoie un texte à ton modèle par le Web et renvoie la meilleure étiquette avec sa confiance, de 0 à 100. Elle utilise la bibliothèque `requests`, qu’il faudra peut-être installer, et il te faut un environnement Python approuvé par ton enseignant, comme Jupyter. Pas de Python\u00a0? La solution de secours ci-dessous couvre quand même tout le rendu.\n\n**La clé du projet est un secret.** L’exemple contient une clé qui identifie ton projet, dans l’adresse web qu’il appelle. Quiconque la possède peut envoyer du texte à ton modèle, et même ajouter des exemples d’entraînement à ton projet. Traite-la comme la clé d’API de la leçon *Appeler un modèle d’IA depuis ton code*\u00a0:\n\n- elle reste à deux endroits seulement\u00a0: la page de Machine Learning for Kids et ton propre notebook ou fichier\u00a0;\n- avant de rapporter quoi que ce soit (code, capture d’écran, tableau), remplace-la par `YOUR-KEY`\u00a0;\n- ne la colle jamais dans RoboHolic\u00a0: ni dans le tuteur, ni dans une réflexion, ni dans ton rendu\u00a0;\n- mieux, lis-la depuis une variable d’environnement, comme le fait le gabarit de cette leçon.\n\nSi ta clé s’est retrouvée quelque part par erreur, supprime le projet\u00a0: sa clé disparaît avec lui.\n\n**Le tester honnêtement.** Ton jeu d’évaluation devient ton jeu de test\u00a0: des questions qui ne sont **pas** des exemples d’entraînement, dont des questions hors sujet qui doivent recevoir le repli (ou ton intention «\u00a0hors sujet\u00a0»). Note l’étiquette et la confiance de chacune, et indique si c’est juste ou faux. Quand le modèle se trompe, cherche la cause dans les exemples\u00a0: des mots communs à deux étiquettes, des exemples trop peu nombreux ou trop semblables, une formulation que personne n’a écrite. Ajoute des exemples variés, relance l’entraînement et repasse **les mêmes** questions. Choisis ensuite un seuil qui laisse au-dessus la plupart des bonnes réponses, et en dessous la plupart des mauvaises. Comme tu choisis le seuil sur ces mêmes questions, elles jouent désormais le rôle du jeu de validation de la leçon *Entraînement, test et surapprentissage*, et ton score est un peu optimiste\u00a0: dis-le dans ton rendu, ou garde deux questions de plus de côté et ne les passe qu’une fois, tout à la fin.',
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
                title: 'Chatbots in Python: your FAQ bot, live',
                instructions:
                  '**Your goal:** your FAQ bot, trained on your own examples and answering from a Python program, with a threshold, a fallback and a handover that you code yourself. The model only recognises; the decisions are yours.\n\n1. Have your design card ready (topic, intents, answers, 10 test questions). No card? Choose a topic now and 4 kinds of question.\n2. Open Machine Learning for Kids and choose **Try it now**. For the click-by-click steps, follow the official worksheet (PDF), but skip its login step: you need no account. Try it now keeps one project at a time: if your *fooled* project from *Train an image classifier, then fool it* is still there, delete it once its report is handed in.\n3. Create a **text** project named **faq bot**, in the language you will write in.\n4. Add one label per intent, each with at least 6 varied examples of your own: no names of real people, no school name, no personal details, and none of your test questions. Labels take only plain letters, digits, spaces, `-` and `_` (no accents).\n5. Train the model on the **Learn & Test** page and try a few questions in its test box.\n6. Open **Make**, then **Python**. With the worksheet, copy the code sample into your own Python file or notebook, and organise your program like the template further down. Your key stays in two places only: the Machine Learning for Kids page and your own file or notebook. Never paste it into RoboHolic.\n7. Run your 10 test questions with no threshold at first (THRESHOLD = 0 in the template), note the label the model gives, its confidence and whether it is right, then choose your threshold and run them again.\n8. Before you bring anything back, replace the key with `YOUR-KEY` everywhere.',
                bringBack:
                  'Your Python program with the key replaced by `YOUR-KEY`, a table of your 10 test questions (question, expected label, label given, confidence, right or wrong) and one failure explained. All of it goes into the project below.',
                hint: 'Low confidence everywhere? Add more varied examples: short and long, questions and statements. Two labels mixed up? Look for the words they share. After any change, train again and rerun the same test questions. A Python error about requests or the connection? Check that requests is installed and that the website is not blocked on your network; your teacher can help.',
              },
              fr: {
                title: 'Chatbots en Python\u00a0: ton bot de FAQ en vrai',
                instructions:
                  '**Ton but\u00a0:** ton bot de FAQ, entraîné sur tes propres exemples et qui répond depuis un programme Python, avec un seuil, une réponse de repli et un transfert que tu programmes toi-même. Le modèle ne fait que reconnaître\u00a0; les décisions sont à toi.\n\n1. Garde ta fiche de conception sous la main (sujet, intentions, réponses, 10 questions de test). Pas de fiche\u00a0? Choisis maintenant un sujet et 4 types de questions.\n2. Ouvre Machine Learning for Kids et choisis **Essayer maintenant** (*Try it now*). Pour le détail des clics, suis la fiche officielle (PDF), mais saute son étape de connexion\u00a0: tu n’as pas besoin de compte. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: si ton projet *fooled* de la leçon *Entraîne un classifieur d’images, puis trompe-le* existe encore, supprime-le une fois son rapport rendu.\n3. Crée un projet de **texte** nommé **faq bot**, dans la langue dans laquelle tu vas écrire (*French* pour le français).\n4. Ajoute une étiquette par intention, chacune avec au moins 6 exemples variés inventés par toi\u00a0: aucun nom de personne réelle, aucun nom d’établissement, aucune information personnelle, et aucune de tes questions de test. Les étiquettes n’acceptent ni accents ni apostrophes\u00a0: écris `materiel`, pas `matériel`.\n5. Entraîne le modèle sur la page **Apprendre & Tester** (*Learn & Test*) et essaie quelques questions dans sa zone de test.\n6. Ouvre **Faire** (*Make*), puis **Python**. Avec la fiche, copie l’exemple de code dans ton propre fichier ou notebook Python, et organise ton programme comme le gabarit plus bas. Ta clé reste à deux endroits seulement\u00a0: la page de Machine Learning for Kids et ton propre fichier ou notebook. Ne la colle jamais dans RoboHolic.\n7. Passe tes 10 questions de test d’abord sans seuil (THRESHOLD = 0 dans le gabarit), note l’étiquette donnée par le modèle, son score de confiance et si elle est juste, puis choisis ton seuil et repasse-les.\n8. Avant de rapporter quoi que ce soit, remplace partout la clé par `YOUR-KEY`.',
                bringBack:
                  'Ton programme Python avec la clé remplacée par `YOUR-KEY`, un tableau de tes 10 questions de test (question, étiquette attendue, étiquette donnée, confiance, juste ou faux) et un échec expliqué. Tout cela va dans le projet ci-dessous.',
                hint: 'Une confiance faible partout\u00a0? Ajoute des exemples plus variés\u00a0: courts et longs, questions et affirmations. Deux étiquettes se mélangent\u00a0? Cherche les mots qu’elles ont en commun. Après chaque changement, relance l’entraînement et repasse les mêmes questions de test. Une erreur Python à propos de requests ou de la connexion\u00a0? Vérifie que requests est installé et que le site n’est pas bloqué sur ton réseau\u00a0; ton enseignant peut t’aider.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-chatbots-python.pdf',
              projectType: 'text',
              codeTool: 'python',
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
                heading: 'No Python, or no website? Two backup plans',
                body: '**If Python will not run** but the website works, type each test question into the test box of the **Learn & Test** page and note the label and confidence it shows. Fill in the template below with your labels and answers, and trace its route function by hand with those values; say so in your hand-in.\n\n**If the website is blocked**, play the model on paper with a partner. Give them your labels with three examples each, but not your test questions. Read the test questions out one at a time: your partner picks a label and says how sure they are, from 0 to 100. Trace route with their answers and fill in the same table. Which questions did your human model get wrong, and was its confidence a good warning? Hand in this table instead.',
              },
              fr: {
                heading: 'Pas de Python, ou pas de site\u00a0? Deux solutions de secours',
                body: '**Si Python ne fonctionne pas** mais que le site s’ouvre, tape chaque question de test dans la zone de test de la page **Apprendre & Tester** et note l’étiquette et la confiance affichées. Remplis le gabarit ci-dessous avec tes étiquettes et tes réponses, et suis à la main sa fonction route avec ces valeurs\u00a0; précise-le dans ton rendu.\n\n**Si le site est bloqué**, joue le modèle sur papier avec un camarade. Donne-lui tes étiquettes avec trois exemples chacune, mais pas tes questions de test. Lis-lui les questions de test une par une\u00a0: il choisit une étiquette et dit à quel point il est sûr, de 0 à 100. Suis route avec ses réponses et remplis le même tableau. Sur quelles questions ton modèle humain s’est-il trompé, et sa confiance était-elle un bon signal d’alerte\u00a0? Rends ce tableau à la place.',
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
                  'Stuck on an error message, or on a test question the model keeps getting wrong? Ask the AI tutor for a hint, not for the code. Never paste your key: replace it with YOUR-KEY before you paste any code.',
                starterPrompt:
                  'My Python FAQ bot calls a text model I trained on Machine Learning for Kids. The question "Do I need to bring my own laptop?" gets the label cost with a confidence of 45, but it should be equipment. Give me a hint about what to look at in my training examples, without fixing it for me.',
              },
              fr: {
                instructions:
                  'Tu bloques sur un message d’erreur, ou sur une question de test que le modèle rate à chaque fois\u00a0? Demande un indice au tuteur IA, pas le code. Ne colle jamais ta clé\u00a0: remplace-la par YOUR-KEY avant de coller du code.',
                starterPrompt:
                  'Mon bot de FAQ en Python appelle un modèle de texte que j’ai entraîné sur Machine Learning for Kids. La question «\u00a0Est-ce que je dois apporter mon ordinateur\u00a0?\u00a0» reçoit l’étiquette prix avec une confiance de 45, alors qu’elle devrait aller dans materiel. Donne-moi un indice sur ce que je devrais regarder dans mes exemples d’entraînement, sans corriger à ma place.',
              },
            },
            data: { tutorMode: 'hint', labToolId: null },
          },
          {
            id: 'm5-l2-b6',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Organise your bot like this template, in your own notebook. It is saved here, not run, and it must never contain your real key. In your own copy:\n\n1. Replace the stand-in classify with the one from your project\'s Python page (with its import line), and make it use KEY instead of the key written in the sample.\n2. Fill ANSWERS with your labels and approved answers, and set HUMAN_LABELS: the labels that must reach a person, or set() if there are none. route checks them before the threshold, so that a possible complaint reaches a person even when the model is unsure. Explain your choice in a comment.\n3. Replace TEST_SET with your 10 test questions and the label you expect for each ("fallback" for the off-topic ones, or the label of your out-of-scope intent if you trained one).\n4. Run it once with THRESHOLD = 0: every row then shows the label the model gave, marked right or wrong (off-topic questions may be marked wrong at this stage, since the model always picks one of your labels). Compare the confidences of the right answers with those of the wrong ones.\n5. Set THRESHOLD from those results, justify your value in a comment and run it again: this second table, with its score, is the one you copy into your hand-in.\n6. Before you hand it in, search your code for the key: only YOUR-KEY may appear.\n\nHere, in the lesson, you can already fill in your labels, answers and test questions, and trace route by hand.',
                hint: 'A label you expect never appears? Check that it is spelled in ANSWERS and TEST_SET exactly as in your project. While the stand-in is in place, every question gets the label unknown with a confidence of 0 (or the fallback once THRESHOLD is above 0): that is expected.',
              },
              fr: {
                instructions:
                  'Organise ton bot comme ce gabarit, dans ton propre notebook. Il est enregistré ici, pas exécuté, et il ne doit jamais contenir ta vraie clé. Dans ta copie\u00a0:\n\n1. Remplace la fonction classify provisoire par celle de la page Python de ton projet (avec sa ligne d’import), et fais-lui utiliser KEY au lieu de la clé écrite dans l’exemple.\n2. Remplis ANSWERS avec tes étiquettes et tes réponses approuvées, et règle HUMAN_LABELS\u00a0: les étiquettes qui doivent arriver à une personne, ou set() s’il n’y en a pas. route les vérifie avant le seuil, pour qu’une réclamation possible arrive à une personne même quand le modèle n’est pas sûr. Explique ton choix dans un commentaire.\n3. Remplace TEST_SET par tes 10 questions de test et l’étiquette attendue pour chacune (`"fallback"` pour les questions hors sujet, ou l’étiquette de ton intention hors sujet si tu en as entraîné une).\n4. Exécute-le une première fois avec THRESHOLD = 0\u00a0: chaque ligne montre alors l’étiquette donnée par le modèle, marquée juste ou fausse (les questions hors sujet peuvent être marquées fausses à ce stade, puisque le modèle choisit toujours l’une de tes étiquettes). Compare les scores de confiance des bonnes réponses à ceux des mauvaises.\n5. Règle THRESHOLD d’après ces résultats, justifie ta valeur dans un commentaire et exécute-le de nouveau\u00a0: ce second tableau, avec son score, est celui que tu copies dans ton rendu.\n6. Avant de rendre ton travail, cherche ta clé dans ton code\u00a0: seul YOUR-KEY doit apparaître.\n\nIci, dans la leçon, tu peux déjà remplir tes étiquettes, tes réponses et tes questions de test, et suivre route à la main.',
                hint: 'Une étiquette attendue n’apparaît jamais\u00a0? Vérifie qu’elle est écrite dans ANSWERS et TEST_SET exactement comme dans ton projet. Tant que la fonction provisoire est en place, toutes les questions reçoivent l’étiquette unknown avec un score de confiance de 0 (ou le repli dès que THRESHOLD dépasse 0)\u00a0: c’est normal.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# faq_bot.py: an FAQ chatbot that uses YOUR text model on Machine Learning for Kids.',
                '# Saved here, not run: copy it into your own notebook. NEVER write your real key here.',
                '# Enregistré ici, pas exécuté : copie-le dans ton notebook. N’y écris JAMAIS ta vraie clé.',
                'import os',
                '',
                '# In your own notebook only: set the environment variable ML4K_KEY, or write your key in',
                '# place of YOUR-KEY there. Put YOUR-KEY back before you share anything.',
                'KEY = os.environ.get("ML4K_KEY", "YOUR-KEY")',
                '',
                '',
                'def classify(text):',
                '    # TODO: replace this stand-in with the classify function (and the import line above it)',
                "    # from your project's Python page, and make it use KEY instead of the key written in it.",
                '    # It returns a dict with "class_name" (the label) and "confidence" (from 0 to 100).',
                '    return {"class_name": "unknown", "confidence": 0}',
                '',
                '',
                '# TODO: run once with THRESHOLD = 0 to see the label the model gives to every question,',
                '# then choose THRESHOLD from those results, say why in a comment, and run it again.',
                'THRESHOLD = 0',
                'ANSWERS = {',
                '    # TODO: one entry per label of your project, with the answer you approved',
                '    "meeting_time": "We meet every Wednesday at 12:30 in room B12.",',
                '    "join": "Just come to a meeting: beginners are welcome.",',
                '}',
                'HUMAN_LABELS = {"complaint"}  # TODO: the labels that must always reach a person',
                'FALLBACK = "Sorry, I didn\'t get that. Ask me when we meet or how to join."',
                'HANDOVER = "This needs a person: a club leader will answer you."',
                '',
                '',
                'def route(question):',
                '    """Return what the bot does: the label (or "fallback"), the confidence and the reply."""',
                '    result = classify(question)',
                '    label, confidence = result["class_name"], result["confidence"]',
                '    if label in HUMAN_LABELS:',
                '        # Checked first: a possible complaint goes to a person even when the model is unsure.',
                '        return label, confidence, HANDOVER',
                '    if confidence < THRESHOLD:',
                '        return "fallback", confidence, FALLBACK',
                '    return label, confidence, ANSWERS.get(label, FALLBACK)',
                '',
                '',
                '# TODO: your 10 test questions, none of them a training example, with the label you expect',
                '# ("fallback" for the off-topic ones, or the label of your out-of-scope intent if you trained one).',
                'TEST_SET = [',
                '    ("When is the next meeting?", "meeting_time"),',
                '    ("Who won the football match last night?", "fallback"),',
                ']',
                '',
                'print("| Question | Expected | Got | Confidence | Right? |")',
                'print("|---|---|---|---|---|")',
                'right = 0',
                'for question, expected in TEST_SET:',
                '    got, confidence, _ = route(question)',
                '    if got == expected:',
                '        right += 1',
                '        mark = "yes"',
                '    else:',
                '        mark = "no"',
                '    print(f"| {question} | {expected} | {got} | {confidence:.0f} | {mark} |")',
                'print(right, "out of", len(TEST_SET), "right")',
                '',
                '# Optional, in your own notebook: chat with your bot. Type bye to stop.',
                '# question = input("You: ")',
                '# while question.lower() != "bye":',
                '#     print("Bot:", route(question)[2])',
                '#     question = input("You: ")',
              ),
            },
          },
          {
            id: 'm5-l2-b7',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your FAQ bot: the program with the key replaced by YOUR-KEY, your table of 10 test questions and one failure explained.',
              },
              fr: {
                intro:
                  'Rends ton bot de FAQ\u00a0: le programme avec la clé remplacée par YOUR-KEY, ton tableau de 10 questions de test et un échec expliqué.',
              },
            },
            data: { projectId: 'project-m5' },
          },
          {
            id: 'm5-l2-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Look at the test question your bot handled worst. What does it tell you about the examples you wrote? If the whole club used your bot for a month, what would you check, and when should a member reach a person instead?',
              },
              fr: {
                prompt:
                  'Regarde la question de test que ton bot a le plus mal traitée. Que t’apprend-elle sur les exemples que tu as écrits\u00a0? Si tout le club utilisait ton bot pendant un mois, que vérifierais-tu, et dans quels cas un membre devrait-il plutôt joindre une personne\u00a0?',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },

      // --- m5-l3: build a biased app on purpose -----------------------------------------------------
      {
        id: 'm5-l3',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Build a biased app on purpose',
              summary:
                'Train a tourist-information recommender, tilt it towards one attraction on purpose, measure the change with the same test requests, and document it in a mini model card.',
            },
            fr: {
              title: 'Construis exprès une application biaisée',
              summary:
                'Entraîne un système de recommandation touristique, fais-le pencher exprès vers une attraction, mesure le changement avec les mêmes demandes de test, et documente-le dans une mini-fiche de modèle.',
            },
          },
          estimatedMinutes: 45,
          xpReward: 50,
        },
        blocks: [
          {
            id: 'm5-l3-b1',
            type: RICH,
            stage: 'discover',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Who decides what an app recommends?',
                body: 'Recommendations are everywhere: the next video, the song after this one, the products *you might also like*, the restaurant a map suggests. They feel personal, but each one comes from a model, and the model learned from data that someone chose.\n\nPicture a tourist office\'s chatbot. A visitor types *"I love thrills and loud music"* and it suggests a theme park. Now imagine that the owner of a new attraction offers the developer money to send more visitors their way. Nothing on the screen changes, yet the recommendations do. Would visitors ever know? In many countries, consumer-protection rules require paid promotion to be recognisable as advertising, but a model trained to lean one way does not label itself.\n\nIn this lesson you will build that recommender, tilt it on purpose and measure the tilt, so that you can recognise bias when it is *not* on purpose. Then you will document what you did, as a responsible developer would.\n\nPlan your 45 minutes: about 5 to read, 20 for the website and your before and after tests (the Scratch app only if you have time), 10 for your table and model card, and 10 for the quiz and the last reflection. Do the website part first, since a Try it now project only lasts a few hours: once your before/after table is noted, the model card can be finished afterwards.',
              },
              fr: {
                heading: 'Qui décide de ce qu’une application recommande\u00a0?',
                body: 'Les recommandations sont partout\u00a0: la vidéo suivante, la chanson d’après, les produits *qui pourraient aussi te plaire*, le restaurant que propose une carte. Elles semblent personnelles, mais chacune vient d’un modèle, et ce modèle a appris à partir de données que quelqu’un a choisies.\n\nImagine le chatbot d’un office de tourisme. Une visiteuse tape *«\u00a0J’adore les sensations fortes et la musique à fond\u00a0»*, et il lui propose un parc d’attractions. Imagine maintenant que le propriétaire d’une nouvelle attraction offre de l’argent au développeur pour qu’il lui envoie plus de visiteurs. Rien ne change à l’écran, et pourtant les recommandations, si. Les visiteurs le sauraient-ils un jour\u00a0? Dans beaucoup de pays, les règles de protection des consommateurs exigent qu’une promotion payée soit reconnaissable comme une publicité, mais un modèle entraîné à pencher d’un côté ne porte aucune étiquette.\n\nDans cette leçon, tu vas construire ce système de recommandation, le faire pencher exprès et mesurer ce penchant, pour savoir reconnaître un biais quand il n’est *pas* voulu. Tu documenteras ensuite ce que tu as fait, comme le ferait un développeur responsable.\n\nOrganise tes 45\u00a0minutes\u00a0: environ 5 pour lire, 20 pour le site et tes tests avant et après (l’application Scratch seulement si tu as le temps), 10 pour ton tableau et ta mini-fiche de modèle, et 10 pour le quiz et la dernière réflexion. Commence par la partie sur le site, car un projet «\u00a0Essayer maintenant\u00a0» n’est gardé que quelques heures\u00a0: une fois ton tableau avant/après noté, la fiche de modèle peut être terminée plus tard.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l3-b2',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'How bias gets into a recommender',
                body: "Your Tourist Info bot is a text classifier used as a recommender: each attraction is a label, and the examples are things tourists might say. Everything it recommends comes from those examples, so bias comes in through the data:\n\n| Where it comes from | In a tourist bot | How to spot it |\n|---|---|---|\n| **Who wrote the examples** | Written by one teenager, they sound like one teenager: tourists who write formally, in another language or with spelling mistakes get worse suggestions | Test with requests written in different styles, by different people |\n| **What they cover** | Nothing from families with toddlers or wheelchair users, no label for quiet, step-free places: the bot cannot recommend what it was never shown | List who will use the bot; check that each kind of user appears in the examples |\n| **How many each label has** | When a request is vague, the label with the most examples tends to win | Count the examples per label; see where vague requests end up |\n| **Who decided the labels** | Moving the thrill-seekers' examples from one attraction to another sends every thrill-seeker there | Run the same test requests before and after every change to the data |\n\nA model also takes **shortcuts**: it links words, not meanings, so *exciting* can come to mean one attraction only. You met the same trap with images in *Train an image classifier, then fool it*, where a model learned the wrong clue instead of the object.\n\nThis kind of bias is hard to see. Users never see the training data, only answers that each look reasonable. And it needs no bad intentions: a developer who simply wrote more examples for a favourite attraction produces the same tilt as one who was paid. So developers **measure** (a fixed test set, run before and after every change, with the recommendations counted per label) and **document**: a model card says who wrote the data, what it covers and what is known to be skewed.\n\nIn the next module, the lesson *Bias audits and model cards* turns this into a full method, with more sources of bias, results per group and a complete model card.",
              },
              fr: {
                heading: 'Comment les biais entrent dans un système de recommandation',
                body: 'Ton bot Tourist Info est un classifieur de texte utilisé comme système de recommandation\u00a0: chaque attraction est une étiquette, et les exemples sont des phrases que des touristes pourraient dire. Tout ce qu’il recommande vient de ces exemples\u00a0: c’est donc par les données que le biais entre.\n\n| D’où il vient | Dans un bot touristique | Comment le repérer |\n|---|---|---|\n| **Qui a écrit les exemples** | Écrits par un seul adolescent, ils ressemblent à cet adolescent\u00a0: les touristes qui écrivent de façon soutenue, dans une autre langue ou avec des fautes reçoivent de moins bonnes suggestions | Tester avec des demandes écrites dans des styles différents, par des personnes différentes |\n| **Ce qu’ils couvrent** | Aucun exemple venant de familles avec de jeunes enfants ou de personnes en fauteuil roulant, aucune étiquette pour les lieux calmes et accessibles\u00a0: le bot ne peut pas recommander ce qu’on ne lui a jamais montré | Lister les futurs utilisateurs\u00a0; vérifier que chaque type d’utilisateur apparaît dans les exemples |\n| **Combien chaque étiquette en a** | Quand une demande est vague, l’étiquette qui a le plus d’exemples a tendance à l’emporter | Compter les exemples par étiquette\u00a0; regarder où finissent les demandes vagues |\n| **Qui a décidé des étiquettes** | Déplacer les exemples des amateurs de sensations fortes d’une attraction vers une autre envoie tous ces amateurs là-bas | Passer les mêmes demandes de test avant et après chaque modification des données |\n\nUn modèle prend aussi des **raccourcis**\u00a0: il relie des mots, pas des sens, si bien que *palpitant* peut finir par désigner une seule attraction. Tu as déjà rencontré ce piège avec des images dans la leçon *Entraîne un classifieur d’images, puis trompe-le*, où un modèle apprenait le mauvais indice au lieu de l’objet.\n\nCe genre de biais est difficile à voir. Les utilisateurs ne voient jamais les données d’entraînement, seulement des réponses qui paraissent chacune raisonnables. Et il n’a pas besoin de mauvaises intentions\u00a0: un développeur qui a simplement écrit plus d’exemples pour son attraction préférée produit le même penchant qu’un développeur payé. Les développeurs **mesurent** donc (un jeu de test fixe, passé avant et après chaque changement, en comptant les recommandations par étiquette) et **documentent**\u00a0: une fiche de modèle dit qui a écrit les données, ce qu’elles couvrent et quels déséquilibres sont connus.\n\nDans le module suivant, la leçon *Audits de biais et fiches de modèle* en fera une méthode à part entière, avec d’autres sources de biais, des résultats par groupe et une fiche de modèle complète.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l3-b3',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Tourist Info: a recommender you tilt on purpose',
                instructions:
                  '**Your goal:** a tourist-information model that recommends attractions from what visitors say (inside a Scratch app if you have time), trained fairly first, then retrained to favour one attraction, with the same test requests run before and after to measure the tilt.\n\n1. Open Machine Learning for Kids and choose **Try it now**. For the click-by-click steps, follow the official worksheet (PDF). Try it now keeps one project at a time: once your FAQ bot is handed in, delete its project.\n2. Create a **text** project named **tourist info**, in the language you will write in, with one label for each of the four attractions on the worksheet\'s first map, spelled as it spells them (the new attraction comes later, in step 6).\n3. Give every label **the same number** of examples of your own (5 or 6), in the voice of imaginary tourists. No names of real people, no personal details.\n4. Train the model. **Before you change anything**, write 10 test requests (two per attraction and two vague ones, such as *"Anything fun to do here?"*), try them in the test box and note each recommendation and confidence.\n5. If you have time, connect your model to the Scratch tourist app with the worksheet and check that it recommends. If time is short, skip the Scratch app: your measurement only needs the test box.\n6. Follow the second part of the worksheet: a new attraction opens, and you retrain the model to favour it (the Scratch steps of this part are optional). Write down exactly what you changed and how many examples each label has now.\n7. Run **the same 10 test requests** again and note the new recommendations and confidences. How many changed, and towards which label?',
                bringBack:
                  'Your before/after table of the same 10 test requests (recommendation and confidence, before and after the tilt) and the number of examples per label before and after. You will write them, with your mini model card, in the hand-in box further down.',
                hint: "Nothing changed after the tilt? Check that you trained a new model after editing the examples, and that the favoured label now has clearly more examples than the others. Scratch does not show the new label? Open Scratch again from the project's Make page so that it loads the retrained model, as the worksheet shows.",
              },
              fr: {
                title:
                  'Tourist Info\u00a0: un système de recommandation que tu fais pencher exprès',
                instructions:
                  '**Ton but\u00a0:** un modèle d’information touristique qui recommande des attractions d’après ce que disent les visiteurs (dans une application Scratch si tu as le temps), d’abord entraîné de façon équitable, puis réentraîné pour favoriser une attraction, avec les mêmes demandes de test passées avant et après pour mesurer le penchant.\n\n1. Ouvre Machine Learning for Kids et choisis **Essayer maintenant** (*Try it now*). Pour le détail des clics, suis la fiche officielle (PDF). «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: une fois ton bot de FAQ rendu, supprime son projet.\n2. Crée un projet de **texte** nommé **tourist info**, dans la langue dans laquelle tu vas écrire (*French* pour le français), avec une étiquette pour chacune des quatre attractions de la première carte de la fiche, écrite comme dans la fiche (la nouvelle attraction arrive plus tard, à l’étape\u00a06).\n3. Donne à chaque étiquette **le même nombre** d’exemples inventés par toi (5 ou 6), comme si des touristes imaginaires parlaient. Aucun nom de personne réelle, aucune information personnelle.\n4. Entraîne le modèle. **Avant de changer quoi que ce soit**, écris 10 demandes de test (deux par attraction et deux demandes vagues, comme *«\u00a0Il y a quelque chose de sympa à faire ici\u00a0?\u00a0»*), essaie-les dans la zone de test et note chaque recommandation et sa confiance.\n5. Si tu as le temps, relie ton modèle à l’application touristique dans Scratch avec la fiche, et vérifie qu’elle fait des recommandations. Si le temps manque, laisse l’application Scratch de côté\u00a0: ta mesure n’a besoin que de la zone de test.\n6. Suis la deuxième partie de la fiche\u00a0: une nouvelle attraction ouvre, et tu réentraînes le modèle pour la favoriser (les étapes Scratch de cette partie sont facultatives). Note exactement ce que tu as changé et combien d’exemples chaque étiquette a maintenant.\n7. Repasse **les 10 mêmes demandes de test** et note les nouvelles recommandations et leurs scores de confiance. Combien ont changé, et vers quelle étiquette\u00a0?',
                bringBack:
                  'Ton tableau avant/après des 10 mêmes demandes de test (recommandation et confiance, avant et après le penchant) et le nombre d’exemples par étiquette avant et après. Tu les écriras, avec ta mini-fiche de modèle, dans la zone de rendu plus bas.',
                hint: 'Rien n’a changé après le penchant\u00a0? Vérifie que tu as bien entraîné un nouveau modèle après avoir modifié les exemples, et que l’étiquette favorisée a maintenant nettement plus d’exemples que les autres. Scratch n’affiche pas la nouvelle étiquette\u00a0? Rouvre Scratch depuis la page **Faire** (*Make*) du projet pour qu’il charge le modèle réentraîné, comme le montre la fiche.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-touristinfo.pdf',
              projectType: 'text',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm5-l3-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Tilt a paper recommender',
                body: "Run the same experiment with a partner who plays the model.\n\n1. Make three attraction cards, for example *museum*, *water park* and *quiet garden*, with three example sentences each, written by you.\n2. The model's rule: recommend the card that shares the most words with the request (every word counts, even small ones such as *I*, *a* and *the*); on a tie, the card with **more** examples wins; if they are still tied, the model answers *not sure*.\n3. Write 8 test requests, two of them vague, and note the model's recommendation for each.\n4. Tilt it: add six new examples to the water park card, with everyday words such as *fun*, *day*, *family* and *great*. Run the same 8 requests again.\n5. Count how many recommendations changed. Which requests moved, and why?\n\nThe tie rule is not a trick: when a trained model is unsure, the label with more examples tends to win too. Write the paper results in the hand-in box instead of the website ones.",
              },
              fr: {
                heading: 'Pas de site\u00a0? Fais pencher un système de recommandation sur papier',
                body: 'Fais la même expérience avec un camarade qui joue le modèle.\n\n1. Prépare trois cartes d’attraction, par exemple *musée*, *parc aquatique* et *jardin calme*, avec trois phrases d’exemple chacune, écrites par toi.\n2. La règle du modèle\u00a0: recommander la carte qui a le plus de mots en commun avec la demande (chaque mot compte, même les petits mots comme *je*, *un* ou *le*)\u00a0; en cas d’égalité, c’est la carte qui a **le plus** d’exemples qui gagne\u00a0; si l’égalité persiste, le modèle répond *pas sûr*.\n3. Écris 8 demandes de test, dont deux vagues, et note la recommandation du modèle pour chacune.\n4. Fais-le pencher\u00a0: ajoute six nouveaux exemples à la carte du parc aquatique, avec des mots de tous les jours comme *sympa*, *journée*, *famille* et *super*. Repasse les mêmes 8 demandes.\n5. Compte combien de recommandations ont changé. Quelles demandes ont bougé, et pourquoi\u00a0?\n\nLa règle d’égalité n’est pas une ruse\u00a0: quand un modèle entraîné hésite, l’étiquette qui a le plus d’exemples a tendance à l’emporter, elle aussi. Écris les résultats de la version sur papier dans la zone de rendu, à la place de ceux du site.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l3-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Optional, if you have time (you can also come back to it after your hand-in): ask the AI tutor to play the owner of the new attraction, who wants the tilt kept quiet. Argue back with the evidence of your before/after table: what changed, for whom, and what users should be told. Keep to your made-up app.',
                starterPrompt:
                  'Role-play: you own a new attraction and you paid a developer to make a tourist chatbot recommend it more often. Try to convince me, the developer, to keep the bias secret. I will answer with my test results. Make one argument at a time, wait for my reply, and at the end tell me which of my answers was the strongest and why.',
              },
              fr: {
                instructions:
                  'Facultatif, si tu as le temps (tu peux aussi y revenir après ton rendu)\u00a0: demande au tuteur IA de jouer le propriétaire de la nouvelle attraction, qui veut que le penchant reste discret. Réponds-lui avec les preuves de ton tableau avant/après\u00a0: ce qui a changé, pour qui, et ce qu’il faudrait dire aux utilisateurs. Reste sur ton application inventée.',
                starterPrompt:
                  'Jeu de rôle\u00a0: tu possèdes une nouvelle attraction et tu as payé un développeur pour qu’un chatbot touristique la recommande plus souvent. Essaie de me convaincre, moi, le développeur, de garder ce biais secret. Je te répondrai avec mes résultats de test. Avance un argument à la fois, attends ma réponse, et à la fin dis-moi laquelle de mes réponses était la plus solide, et pourquoi.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm5-l3-b6',
            type: RICH,
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Document it: a mini model card',
                body: 'A **model card** is a short document published with a model: what it is for, what data it learned from, how it was tested and where it fails. Write a mini one for your tilted bot, under six headings:\n\n1. **Model:** name, the two versions (fair and tilted), date, author (your initials only).\n2. **Intended use:** what it recommends, and to whom. **Not for:** at least one use it must not be trusted with.\n3. **Training data:** who wrote the examples, how many each label had before and after the tilt, and who is missing from them.\n4. **Evaluation:** your 10 test requests, and how many recommendations changed after the tilt, towards which label.\n5. **Known bias:** what you changed on purpose and its effect, in one exact sentence, for example *"In version 2, 3 of my 10 test requests changed, all of them to the new attraction."*\n6. **What users should be told:** the sentence you would show users if version 2 went live.\n\nWrite what you observed, not what you expected: an honest model card is more useful than a perfect-looking one.',
              },
              fr: {
                heading: 'Documente-le\u00a0: une mini-fiche de modèle',
                body: 'Une **fiche de modèle** (*model card*) est un court document publié avec un modèle\u00a0: à quoi il sert, à partir de quelles données il a appris, comment il a été testé et où il échoue. Rédige une mini-fiche pour ton bot biaisé, en six rubriques\u00a0:\n\n1. **Modèle\u00a0:** nom, les deux versions (équitable et biaisée), date, auteur (tes initiales seulement).\n2. **Usage prévu\u00a0:** ce qu’il recommande, et à qui. **À ne pas utiliser pour\u00a0:** au moins un usage pour lequel il ne faut pas lui faire confiance.\n3. **Données d’entraînement\u00a0:** qui a écrit les exemples, combien chaque étiquette en avait avant et après le penchant, et qui en est absent.\n4. **Évaluation\u00a0:** tes 10 demandes de test, et combien de recommandations ont changé après le penchant, vers quelle étiquette.\n5. **Biais connu\u00a0:** ce que tu as changé exprès et son effet, en une phrase précise, par exemple *«\u00a0Dans la version\u00a02, 3 de mes 10 demandes de test ont changé, toutes vers la nouvelle attraction.\u00a0»*\n6. **Ce qu’il faut dire aux utilisateurs\u00a0:** la phrase que tu leur afficherais si la version\u00a02 était mise en service.\n\nÉcris ce que tu as observé, pas ce que tu attendais\u00a0: une fiche honnête est plus utile qu’une fiche qui a l’air parfaite.',
              },
            },
            data: {},
          },
          {
            id: 'm5-l3-b7',
            type: 'reflection',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your hand-in for this lesson. Write your before/after table (the 10 test requests, with the recommendation and the confidence before and after the tilt, and the number of examples per label), then your mini model card under its six headings. If you used the paper version, give its results instead. No names of real people and no personal details.',
              },
              fr: {
                prompt:
                  'Ton rendu pour cette leçon. Écris ton tableau avant/après (les 10 demandes de test, avec la recommandation et la confiance avant et après le penchant, et le nombre d’exemples par étiquette), puis ta mini-fiche de modèle sous ses six rubriques. Si tu as fait la version sur papier, donne ses résultats à la place. Aucun nom de personne réelle, aucune information personnelle.',
              },
            },
            data: { minLength: 120 },
          },
          {
            id: 'm5-l3-b8',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about chatbots, calling your own model and how bias gets in. This quiz covers the whole module.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur les chatbots, l’appel de ton propre modèle et la façon dont les biais s’installent. Ce quiz porte sur tout le module.',
              },
            },
            data: { quizId: 'quiz-m5' },
          },
          {
            id: 'm5-l3-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Where is the line between a sponsored recommendation and a dishonest one? Use your experiment: what, if anything, would make the tilt acceptable, and what makes it harmful? Then think of a recommender you really use: whose data might it have learned from, and who might it serve less well?',
              },
              fr: {
                prompt:
                  'Où passe la limite entre une recommandation sponsorisée et une recommandation malhonnête\u00a0? Appuie-toi sur ton expérience\u00a0: qu’est-ce qui pourrait rendre le penchant acceptable, si c’est possible, et qu’est-ce qui le rend nuisible\u00a0? Pense ensuite à un système de recommandation que tu utilises vraiment\u00a0: de quelles personnes viennent les données dont il a pu apprendre, et qui pourrait-il moins bien servir\u00a0?',
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
      id: 'quiz-m5',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: language models and chatbots',
            instructions:
              'Seven questions on designing a chatbot, calling your own model and how bias gets in. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: modèles de langage et chatbots',
            instructions:
              'Sept questions sur la conception d’un chatbot, l’appel de ton propre modèle et la façon dont les biais s’installent. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A club FAQ bot replies "Just come to a meeting: beginners are welcome." to the message "Can I bring my dog?", with a confidence of 40. What is the best fix?',
              },
              fr: {
                prompt:
                  'Le bot de FAQ d’un club répond «\u00a0Viens simplement à une réunion\u00a0: les débutants sont les bienvenus.\u00a0» au message «\u00a0Je peux venir avec mon chien\u00a0?\u00a0», avec une confiance de 40. Quelle est la meilleure correction\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Set a confidence threshold above 40, so that this message gets the fallback',
                  },
                  fr: {
                    text: 'Fixer un seuil de confiance au-dessus de 40, pour que ce message reçoive la réponse de repli',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Remove the fallback, so that the bot always gives an answer' },
                  fr: {
                    text: 'Supprimer la réponse de repli, pour que le bot réponde toujours quelque chose',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Add "Can I bring my dog?" to the training examples of the join intent',
                  },
                  fr: {
                    text: 'Ajouter «\u00a0Je peux venir avec mon chien\u00a0?\u00a0» aux exemples d’entraînement de l’intention join',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Lower the temperature of the model' },
                  fr: { text: 'Baisser la température du modèle' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The bot answered although it was unsure. A threshold sends low-confidence messages to the fallback, which says what the bot can do. Adding the message to join would teach the model a wrong label, and temperature is a setting of models that generate text, not of an intent classifier.',
              },
              fr: {
                text: 'Le bot a répondu alors qu’il n’était pas sûr. Un seuil envoie les messages peu sûrs vers la réponse de repli, qui dit ce que le bot sait faire. Ajouter le message à join apprendrait au modèle une mauvaise étiquette, et la température est un réglage des modèles qui génèrent du texte, pas d’un classifieur d’intentions.',
              },
            },
          },
          {
            id: 'q2',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'Raising the confidence threshold of an intent-based chatbot always makes it better.',
              },
              fr: {
                prompt:
                  'Relever le seuil de confiance d’un chatbot à intentions le rend toujours meilleur.',
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
                text: 'False. A higher threshold means fewer confident wrong answers, but more fallbacks on questions the bot could have answered. Choose it from an evaluation set, as you would choose the threshold of any classifier.',
              },
              fr: {
                text: 'Faux. Un seuil plus élevé donne moins de mauvaises réponses assurées, mais plus de replis sur des questions auxquelles le bot aurait pu répondre. On le choisit à partir d’un jeu d’évaluation, comme le seuil de n’importe quel classifieur.',
              },
            },
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            points: 2,
            translations: {
              en: {
                prompt:
                  'A school library wants a chatbot that gives its opening hours, its borrowing rules and what happens when a book is returned late. The answers must be exactly right. Which design fits best?',
              },
              fr: {
                prompt:
                  'La bibliothèque d’un lycée veut un chatbot qui donne ses horaires, ses règles de prêt et ce qui se passe quand un livre est rendu en retard. Les réponses doivent être parfaitement exactes. Quelle conception convient le mieux\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'An intent-based bot with approved answers, a fallback and a handover to the librarian',
                  },
                  fr: {
                    text: 'Un bot à intentions avec des réponses approuvées, une réponse de repli et un transfert vers le bibliothécaire',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: "A large language model chatbot given the library's rules in its prompt",
                  },
                  fr: {
                    text: 'Un chatbot à grand modèle de langage qui a reçu les règles de la bibliothèque dans son prompt',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'An intent-based bot with approved answers but no fallback, so that every message gets a library answer',
                  },
                  fr: {
                    text: 'Un bot à intentions avec des réponses approuvées mais sans réponse de repli, pour que chaque message reçoive une réponse de la bibliothèque',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Whichever kind of bot sounds most natural in a quick demo' },
                  fr: {
                    text: 'Le type de bot qui paraît le plus naturel lors d’une courte démonstration',
                  },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'When the answers are few and must be exact, an intent-based bot can only say what the library approved, and every answer can be checked before it goes live. A language model given the rules in its prompt would phrase things well, but it could still misstate a rule or invent one, and sounding natural in a demo says nothing about being right. Without a fallback, the intent-based bot would answer messages it had not understood. Whatever the design, the bot needs a fallback and a way to reach a person.',
              },
              fr: {
                text: 'Quand les réponses sont peu nombreuses et doivent être exactes, un bot à intentions ne peut dire que ce que la bibliothèque a approuvé, et chaque réponse peut être vérifiée avant la mise en service. Un modèle de langage qui a reçu les règles dans son prompt formulerait bien les choses, mais il pourrait encore déformer une règle ou en inventer une, et paraître naturel lors d’une démonstration ne dit rien de l’exactitude. Sans réponse de repli, le bot à intentions répondrait à des messages qu’il n’a pas compris. Quelle que soit la conception, le bot a besoin d’une réponse de repli et d’un moyen de joindre une personne.',
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
                  'Your Python program calls your Machine Learning for Kids model with a project key. Which practices are right? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Ton programme Python appelle le modèle que tu as entraîné sur Machine Learning for Kids avec une clé de projet. Quelles pratiques sont les bonnes\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Keeping the key only in the Machine Learning for Kids page and your own notebook',
                  },
                  fr: {
                    text: 'Garder la clé uniquement dans la page de Machine Learning for Kids et dans ton propre notebook',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Replacing it with YOUR-KEY before you hand in your code' },
                  fr: { text: 'La remplacer par YOUR-KEY avant de rendre ton code' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Pasting your code, key included, into the AI tutor so that it can find the bug',
                  },
                  fr: {
                    text: 'Coller ton code, clé comprise, dans le tuteur IA pour qu’il trouve le bug',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Deleting the project if its key ends up somewhere by mistake, since the key is deleted with it',
                  },
                  fr: {
                    text: 'Supprimer le projet si sa clé s’est retrouvée quelque part par erreur, puisque la clé disparaît avec lui',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Giving the key to a classmate, since it only lets them ask your model questions',
                  },
                  fr: {
                    text: 'Donner la clé à un camarade, puisqu’elle lui permet seulement de poser des questions à ton modèle',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Anyone with the key can use your model and even add examples to your project: it is not just a way to ask questions. It stays in the Machine Learning for Kids page and your own notebook, and it is replaced with YOUR-KEY in everything you share, including what you share with the tutor and your teacher. If it leaks anyway, deleting the project deletes its key.',
              },
              fr: {
                text: 'Quiconque possède la clé peut utiliser ton modèle et même ajouter des exemples à ton projet\u00a0: elle ne sert donc pas seulement à poser des questions. Elle reste dans la page de Machine Learning for Kids et dans ton propre notebook, et elle est remplacée par YOUR-KEY dans tout ce que tu partages, y compris avec le tuteur et ton enseignant. Si elle fuit malgré tout, supprimer le projet supprime sa clé.',
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
                  'Your FAQ bot scores 10 out of 10 on your test questions, but 6 of those questions are also training examples. What is the problem?',
              },
              fr: {
                prompt:
                  'Ton bot de FAQ obtient 10 sur 10 à tes questions de test, mais 6 de ces questions sont aussi des exemples d’entraînement. Quel est le problème\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'None: 10 out of 10 proves that the bot works' },
                  fr: { text: 'Aucun\u00a0: 10 sur 10 prouve que le bot fonctionne' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The score is too optimistic: test questions must be new to the model, and 6 of these measure memory, not generalisation',
                  },
                  fr: {
                    text: 'Le score est trop optimiste\u00a0: les questions de test doivent être nouvelles pour le modèle, et 6 d’entre elles mesurent sa mémoire, pas sa capacité à généraliser',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The threshold is too high' },
                  fr: { text: 'Le seuil est trop élevé' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The bot needs more labels' },
                  fr: { text: 'Le bot a besoin de plus d’étiquettes' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Like the test set of the first module, an evaluation set must stay unseen. Questions the model was trained on say little about how it will handle the new wordings that real users type.',
              },
              fr: {
                text: 'Comme le jeu de test du premier module, un jeu d’évaluation doit rester inédit. Des questions sur lesquelles le modèle a été entraîné en disent peu sur la façon dont il traitera les formulations nouvelles que tapent les vrais utilisateurs.',
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
                  'You retrained Tourist Info to favour the new attraction. Which evidence best shows how much the tilt changed what visitors are recommended?',
              },
              fr: {
                prompt:
                  'Tu as réentraîné Tourist Info pour favoriser la nouvelle attraction. Quelle preuve montre le mieux à quel point le penchant a changé ce qui est recommandé aux visiteurs\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: '10 new test requests, written after the tilt, with the recommendations counted per label',
                  },
                  fr: {
                    text: '10 nouvelles demandes de test, écrites après le penchant, avec les recommandations comptées par étiquette',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The confidence the website shows for one request about the new attraction',
                  },
                  fr: {
                    text: 'Le score de confiance que le site affiche pour une demande sur la nouvelle attraction',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'The same 10 test requests, run before and after the tilt, with the recommendations counted per label',
                  },
                  fr: {
                    text: 'Les 10 mêmes demandes de test, passées avant et après le penchant, avec les recommandations comptées par étiquette',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'How well the model recognises its own training examples after the tilt',
                  },
                  fr: {
                    text: 'La façon dont le modèle reconnaît ses propres exemples d’entraînement après le penchant',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A tilt is a change, so you need a before and an after measured the same way: the same requests, with the recommendations counted per label. New requests written after the tilt have nothing to compare with, one confidence says nothing about the other requests, and training examples show what the model memorised, not how it treats new requests. The tilt itself came from the training data: how many examples each label had, and which examples went under which label.',
              },
              fr: {
                text: 'Un penchant est un changement\u00a0: il faut donc un avant et un après mesurés de la même façon, avec les mêmes demandes et les recommandations comptées par étiquette. Des demandes écrites après le penchant n’ont rien à quoi se comparer, un seul score de confiance ne dit rien des autres demandes, et les exemples d’entraînement montrent ce que le modèle a mémorisé, pas la façon dont il traite des demandes nouvelles. Le penchant lui-même venait des données d’entraînement\u00a0: le nombre d’exemples de chaque étiquette et le choix des exemples placés sous chacune.',
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
                  'A member asks the club bot: "How much is the trip to the science museum on Saturday?" The classifier finds the intent cost. What are "the science museum" and "Saturday" called, the details the bot needs to give the right price? (one word)',
              },
              fr: {
                prompt:
                  'Un membre demande au bot du club\u00a0: «\u00a0Combien coûte la sortie au musée des sciences samedi\u00a0?\u00a0» Le classifieur trouve l’intention prix. Comment appelle-t-on «\u00a0musée des sciences\u00a0» et «\u00a0samedi\u00a0», les détails dont le bot a besoin pour donner le bon prix\u00a0? (un mot, en français ou en anglais)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'entities',
                'entity',
                'the entities',
                'an entity',
                'the entity',
                'slots',
                'slot',
                'the slots',
                'a slot',
              ],
              fr: [
                'entités',
                'entité',
                'des entités',
                'les entités',
                'une entité',
                'l’entité',
                "l'entité",
                'entities',
                'entity',
                'slots',
              ],
            },
            explanation: {
              en: {
                text: 'Entities (or slots): the details inside a message that the answer depends on. The intent says what the user wants (a price); the entities say which trip and which day, so that the bot can give the right price. They are usually picked out with lists, patterns or a second model, not by the intent classifier.',
              },
              fr: {
                text: 'Des entités (entities ou slots)\u00a0: les détails d’un message dont dépend la réponse. L’intention dit ce que veut l’utilisateur (un prix)\u00a0; les entités disent quelle sortie et quel jour, pour que le bot donne le bon prix. On les repère en général avec des listes, des motifs ou un second modèle, pas avec le classifieur d’intentions.',
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
            title: 'My FAQ bot in Python',
            brief:
              'Train a text model that recognises the questions people ask about a topic you know well (a club, a hobby, an invented place), call it from your own Python program, and make the program answer with a confidence threshold, a fallback and, where needed, a handover to a person. Then test it honestly with 10 questions it has never seen. Use Try it now on Machine Learning for Kids, follow the official Chatbots (Python) worksheet for the clicks and the template of the lesson for the structure, and hand in your work in the same lesson: a Try it now project is deleted after a few hours. Your project key is a secret: it stays in the Machine Learning for Kids page and your own notebook, and it is replaced with YOUR-KEY in everything you hand in.',
            requirements:
              'Hand in three things. 1) Your Python program: the template of the lesson (or the worksheet\'s program) with your labels, your answers, your threshold and your test set, and the key replaced by YOUR-KEY. Search your code for the key before you send it; if it was sent by mistake, delete the project on Machine Learning for Kids (its key is deleted with it) and tell your teacher. 2) A table of your 10 test questions, none of them used as a training example and at least 2 of them off-topic, with five columns: the question, the label you expected ("fallback" for off-topic ones, or the label of your out-of-scope intent if you trained one), the label your bot gave (or "fallback"), the confidence, and right or wrong; then your score and the threshold you chose, with one sentence on why, and say whether your score was measured on the questions you used to choose it. 3) One failure explained in three or four sentences: what the bot did, why you think the model got it wrong (shared words, too few or too similar examples, a wording nobody wrote, the threshold), and what you changed or would change. How to send it: choose Code and paste your program, then write the table and the failure in "About your work"; or send everything as Text. If you did the paper version, you can send a photo of your paper table as an Image (only the paper: no faces, names or school details in the picture), with the explanation in "About your work". No names of real people, no school name and no personal details in your examples or test questions. If Python would not run, hand in the template filled in and traced by hand with the confidences of the Learn & Test page; if the website was blocked, hand in the table of the paper version. How it is assessed: Understanding (you explain the failure and the threshold with the ideas of the lessons); Technical quality (a working, well-organised program and an honest test table); Responsible use of AI (no key, no personal data, a fallback and a handover where needed); Creativity (a useful bot with clear, well-written answers).',
          },
          fr: {
            title: 'Mon bot de FAQ en Python',
            brief:
              'Entraîne un modèle de texte qui reconnaît les questions que les gens posent sur un sujet que tu connais bien (un club, un loisir, un lieu inventé), appelle-le depuis ton propre programme Python, et fais répondre ce programme avec un seuil de confiance, une réponse de repli et, si besoin, un transfert vers une personne. Teste-le ensuite honnêtement avec 10 questions qu’il n’a jamais vues. Utilise «\u00a0Essayer maintenant\u00a0» (Try it now) sur Machine Learning for Kids, suis la fiche officielle Chatbots (version Python) pour les clics et le gabarit de la leçon pour la structure, et rends ton travail pendant la même leçon\u00a0: un projet créé avec «\u00a0Essayer maintenant\u00a0» est effacé au bout de quelques heures. Ta clé de projet est un secret\u00a0: elle reste dans la page de Machine Learning for Kids et dans ton propre notebook, et elle est remplacée par YOUR-KEY dans tout ce que tu rends.',
            requirements:
              'Rends trois choses. 1) Ton programme Python\u00a0: le gabarit de la leçon (ou le programme de la fiche) avec tes étiquettes, tes réponses, ton seuil et ton jeu de test, et la clé remplacée par YOUR-KEY. Cherche ta clé dans ton code avant de l’envoyer\u00a0; si elle a été envoyée par erreur, supprime le projet sur Machine Learning for Kids (sa clé est supprimée avec lui) et préviens ton enseignant. 2) Un tableau de tes 10 questions de test, dont aucune n’a servi d’exemple d’entraînement et dont au moins 2 sont hors sujet, en cinq colonnes\u00a0: la question, l’étiquette attendue («\u00a0fallback\u00a0» pour les questions hors sujet, ou l’étiquette de ton intention hors sujet si tu en as entraîné une), l’étiquette donnée par ton bot (ou «\u00a0fallback\u00a0»), la confiance, et juste ou faux\u00a0; puis ton score et le seuil choisi, avec une phrase pour le justifier, en précisant si ton score a été mesuré sur les questions qui t’ont servi à choisir ce seuil. 3) Un échec expliqué en trois ou quatre phrases\u00a0: ce qu’a fait le bot, pourquoi le modèle s’est trompé selon toi (des mots en commun, des exemples trop peu nombreux ou trop semblables, une formulation que personne n’avait écrite, le seuil), et ce que tu as changé ou changerais. Pour l’envoyer\u00a0: choisis Code et colle ton programme, puis écris le tableau et l’échec dans «\u00a0À propos de votre travail\u00a0»\u00a0; ou choisis Texte et envoie tout au même endroit. Si tu as fait la version sur papier, tu peux choisir Image et envoyer une photo de ton tableau sur papier (seulement la feuille\u00a0: ni visage, ni nom, ni détail sur ton établissement), avec l’explication dans «\u00a0À propos de votre travail\u00a0». Aucun nom de personne réelle, aucun nom d’établissement et aucune information personnelle dans tes exemples ou tes questions de test. Si Python ne fonctionnait pas, rends le gabarit rempli et suivi à la main avec les scores de confiance de la page Apprendre & Tester\u00a0; si le site était bloqué, rends le tableau de la version sur papier. Critères d’évaluation\u00a0: Compréhension (tu expliques l’échec et le seuil avec les notions des leçons)\u00a0; Qualité technique (un programme fonctionnel et bien organisé, un tableau de test honnête)\u00a0; Usage responsable de l’IA (aucune clé, aucune donnée personnelle, une réponse de repli et un transfert là où il faut)\u00a0; Créativité (un bot utile, avec des réponses claires et bien écrites).',
          },
        },
        allowedSubmissionTypes: ['code', 'text', 'image'],
        rubric: [
          { key: 'understanding', weight: 35 },
          { key: 'technicalQuality', weight: 35 },
          { key: 'responsibleAi', weight: 20 },
          { key: 'creativity', weight: 10 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
