// Module m3 of "AI Engineering with Python" (ages 14-16): language and vision. It comes after m2
// (machine learning basics) and before m4 (APIs and automation) and m5 (the engineering
// challenge). It builds on the roof weather station club of m1 and m2 (here it builds an open-day
// mascot and sorts the lost-property box), on the cleaning rules of "Working with data", on the
// sealed test set, the baseline and the cost of mistakes of "Classification, regression and
// evaluation", and on the key rules of "Predict outcomes with Python" (the Titanic model).
// m3-l1: a text classification pipeline (collect and label, train, clean, classify, decide, act
// and log), a bag of words and its limits (word order, negation), what the model learns from its
// examples and its language, the confidence (the model's own score, not the chance of being
// right; a label is always chosen), a threshold and its trade-off reported as two numbers
// (answered, right among them), honest tests on new sentences. The worked table has ten invented
// messages: threshold 0 answers 10 with 6 right, 70 answers 6 with 5 right (1, 2, 4, 6, 7, 10),
// 80 answers 4, all right. No curated video in the course files is about text, so the watch
// stage is a trace of a toy word-score model (50 + 10 x |total|, at most 95; a total of 0 gives
// kind at 50): "Thanks, you are so helpful!" kind 95, "Not bad at all." mean 80 (confidently
// wrong), "I don't like your jokes." kind 60, not sure at 70. The French version uses French
// words and sentences with the same numbers (merci, mal, pas; "Tes blagues, je les aime moyen.").
// Then the Machine Learning for Kids activity Make me happy, Python version
// (worksheet-makemehappy-python.pdf, beginner, text, "Adapted by Dhiresh Nathwani", last updated
// 9 May 2020; teacher's notes teachersnotes-makemehappy.pdf and teachersnotes-makemehappy-fr.pdf,
// written for the Scratch version: 45 minutes, "set boundaries for what language is
// appropriate"). The worksheet logs in, but the Make page offers Python for every text project
// (supportedMakes in projects.service.js at taxinomitis f360de1) and session users get text
// credentials, so access is try_it_now and step 1 says to skip the login (and the worksheet's
// pictures step: the template prints). The Python page (pythontext.html) puts the project key in
// the URL its classify function calls with requests, returns the top match with class_name and an
// integer confidence, and also offers code that adds training examples with the same key; before
// a model exists, the API answers with random labels at equal confidence (chooseLabelsAtRandom in
// scratchx/classify.ts), hence the hint about 50%. Label names come back with underscores
// (kind_things, as the worksheet's own code compares). The worksheet's code uses raw_input
// (Python 2), hence the hint. Key rules as in m2: the ML4K page and the learner's notebook only,
// YOUR-KEY in anything brought back, never pasted into RoboHolic, deleting the project deletes its
// key. The worksheet asks for the cruellest messages a learner can think of; this lesson asks for
// mild ones addressed to an invented mascot only, following the teacher's notes. Text projects ask
// for the language of the examples (French is offered). The tutor activity is give_example (the
// learner writes their own tests afterwards). The template (code_activity, stage build) is our own
// code around the lines the learner pastes from the site; while KEY is YOUR-KEY a stand-in answers
// with four rows of the lesson's table. As given it prints the four rows with decisions
// kind_things, mean_things, kind_things, kind_things and "threshold 70: answered 0 of 4, right 0";
// with TODO 2 and 4 done, the decisions of rows 2 and 4 become not_sure and the last line reads
// "answered 2 of 4, right 1" (at THRESHOLD = 0: "answered 4 of 4, right 1"); checked with Python
// 3, as are the toy-model traces. Hand-in project-m3 (assignment, 150 XP, not needed for the
// certificate): code, text or image; a code submission carries no attachments, so the table and
// the failure go in "About your work". A reflection ends the lesson.
// m3-l2: Machine Learning for Kids, Mobilenet (worksheet-mobilenet.pdf, beginner, Scratch 3, last
// updated 25 November 2024, no teacher's notes, no French version). The learner trains nothing:
// the worksheet opens Scratch and its mobilenet project template, which uses the site's imagenet
// extension, so url /#!/pretrained (the ready-trained models page, no login) and projectType
// 'pretrained'; access try_it_now is stored but not shown. Facts taken from the site's code at
// taxinomitis f360de1: the extension loads MobileNet v3 small (TF Hub/Kaggle
// mobilenet-v3/TfJs/small-100-224-classification), feeds it 224 x 224 images and its "recognise
// image (label)" block returns the top label only (argMax), with no confidence; its label list
// (1,001 entries with "background") was checked for every example in the lesson: it holds 118 dog
// breeds, tabby, Persian cat, Siamese cat, Granny Smith, ballpoint, fountain pen, quill, water
// bottle, backpack, umbrella, pencil box, mountain bike and bicycle-built-for-two, and no dog, cat,
// apple, pencil, ruler, scissors, calculator or bicycle. The site's pretrained page says the model
// "won't recognize cartoons or drawings very well". ML4K's image projects train new layers on top
// of MobileNet in the browser (imagetraining.service.js), which the lesson gives as the example of
// transfer learning. ImageNet facts are kept to what is well established (the 1,000-category
// challenge set of more than 1.2 million photos, labels from the WordNet English word database,
// photos found by web search and labelled by paid online workers, the 2019 removal of many
// person categories after offensive labels were exposed, research showing weaker results on
// everyday objects from lower-income homes and some regions, given without figures). Tests use
// the template's scenes and the learner's own drawings, never people or a webcam (a photo of
// objects only with the teacher's agreement). The watch stage reuses the Code.org How AI Works
// video on computer vision (2hXG8v8p0KM), already curated in ai-robotics-foundations m2-l1, with
// our own caption and summary written from that course's. The brief asks for a project block in
// every lesson with an ML4K activity, so the hand-in is a second project, project-m3-2
// (assignment, 150 XP, not needed for the certificate; text or image). Then the module quiz
// quiz-m3 (both lessons) and a reflection.
// The worksheets are CC BY-NC-SA 4.0: they are linked, never copied or translated, and the numbered
// steps are our own framing that defers to the PDFs for the clicks. French learners get the
// English PDFs; the French site's labels are Essayer maintenant, Entraîner, Apprendre & Tester,
// Faire and Python, and Scratch's Project templates menu is Modèles de projets. Instructions and
// hints of code_activity, ai_activity and ml_activity blocks (bringBack and hint), reflection
// prompts, quiz texts and project texts are plain text, as in m1 and m2. Other modules are named,
// not numbered, in the text. No personal data: every message, object and drawing is invented.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

/** Starter code, one array entry per line, with a final newline. */
function lines(...rows: string[]): string {
  return `${rows.join('\n')}\n`;
}

export const m3: SeedModulePart = {
  module: {
    id: 'm3',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Language and vision',
          description:
            'Train a text classifier on sentences you invent and call it from Python with a confidence threshold, then test a ready-trained image model, MobileNet, and find out what it cannot see.',
        },
        fr: {
          title: 'Langage et vision',
          description:
            'Entraîne un classifieur de texte sur des phrases que tu inventes et appelle-le depuis Python avec un seuil de confiance, puis teste un modèle d’images déjà entraîné, MobileNet, et découvre ce qu’il ne sait pas voir.',
        },
      },
    },
    lessons: [
      // --- m3-l1: Classify text from Python --------------------------------------------------
      {
        id: 'm3-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Classify text from Python',
              summary:
                'Train a model to tell kind messages from mean ones with Machine Learning for Kids, call it from your own Python program, choose a confidence threshold and test it honestly on new sentences.',
            },
            fr: {
              title: 'Classer du texte depuis Python',
              summary:
                'Entraîne un modèle à distinguer les messages gentils des messages méchants avec Machine Learning for Kids, appelle-le depuis ton propre programme Python, choisis un seuil de confiance et teste-le honnêtement sur de nouvelles phrases.',
            },
          },
          estimatedMinutes: 50,
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
                heading: 'A mascot that reads your messages',
                body: 'The school club that built the roof weather station has a new project for the open day: a mascot on the screen in the school hall. Visitors type a message on a tablet, and the mascot smiles at kind messages and looks sad at mean ones. The first version uses two lists of words: *great*, *thanks* and *cool* make it smile; *bad*, *boring* and *worst* make it sad.\n\nOn the morning of the test, three messages break it:\n\n- *Not bad at all, little robot!* The mascot looks sad: it saw *bad*.\n- *Great, you crashed again. Brilliant.* It smiles: it saw *great*.\n- *What time does the open day end?* It has to pick a face, although the message is neither kind nor mean.\n\nReal language is full of negation, sarcasm, slang, typos and messages about something else entirely. Writing rules for all of them is hopeless. So in this lesson you will **train a text classifier** on examples you invent, **call it from your own Python program**, and decide what the program should do when the model is not sure. It is the classification of *Machine learning basics*, with sentences as the input.\n\nPlan your 50 minutes: about 10 to read, 25 to train the model and run it from Python, and 15 for your hand-in and your reflection.',
              },
              fr: {
                heading: 'Une mascotte qui lit tes messages',
                body: 'Le club du lycée qui a installé la station météo sur le toit a un nouveau projet pour la journée portes ouvertes\u00a0: une mascotte sur l’écran du hall. Les visiteurs tapent un message sur une tablette, et la mascotte sourit aux messages gentils et prend un air triste devant les messages méchants. La première version utilise deux listes de mots\u00a0: *génial*, *merci* et *cool* la font sourire\u00a0; *mal*, *ennuyeux* et *pire* la rendent triste.\n\nLe matin du test, trois messages la mettent en échec\u00a0:\n\n- *Pas mal du tout, petit robot\u00a0!* La mascotte prend un air triste\u00a0: elle a vu *mal*.\n- *Génial, tu as encore planté. Bravo.* Elle sourit\u00a0: elle a vu *génial*.\n- *À quelle heure finit la journée portes ouvertes\u00a0?* Elle doit choisir un visage, alors que le message n’est ni gentil ni méchant.\n\nLe langage réel est plein de négations, d’ironie, d’argot, de fautes de frappe et de messages qui parlent de tout autre chose. Écrire des règles pour tous ces cas est sans espoir. Dans cette leçon, tu vas donc **entraîner un classifieur de texte** sur des exemples que tu inventes, **l’appeler depuis ton propre programme Python**, et décider de ce que doit faire le programme quand le modèle n’est pas sûr de lui. C’est la classification du module *Les bases de l’apprentissage automatique*, avec des phrases en entrée.\n\nOrganise tes 50\u00a0minutes\u00a0: environ 10 pour lire, 25 pour entraîner le modèle et l’utiliser depuis Python, et 15 pour ton rendu et ta réflexion.',
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
                heading: 'From a sentence to a decision: the pipeline',
                body: "A text classifier never works alone. It sits in the middle of a **pipeline**, a chain of steps in which the output of each step is the input of the next:\n\n| Step | What happens | Who does it |\n|---|---|---|\n| 1. Collect and label | Write example messages and give each one a label: *kind* or *mean* | You |\n| 2. Train | Turn the labelled examples into a model | Machine Learning for Kids |\n| 3. Clean the input | Remove extra spaces, refuse an empty message, shorten a very long one | Your Python code |\n| 4. Classify | Send the message to the model and get back a label and a confidence | The model, called from your code |\n| 5. Decide | Act on the label only if the confidence is high enough | Your Python code |\n| 6. Act and log | Show a face, and record each message and decision for testing | Your Python code |\n\nOnly step 4 is machine learning. The rest is ordinary engineering, and that is often where systems break: the cleaning rules of *Working with data* apply to text too, and `\"   \"` (three spaces) is not a message.\n\n**How can a model read?** A model computes with numbers, so the text must first become numbers. The simplest way, a **bag of words**, counts the words of a message and forgets their order:\n\n```python\nmessage = \"not bad at all\"\nwords = message.split()   # ['not', 'bad', 'at', 'all']\n```\n\nTo a bag of words, *the dog chased the cat* and *the cat chased the dog* are the same message. Modern text models also capture pairs of words, word order and the fact that *great* and *brilliant* are used in similar ways. Machine Learning for Kids trains its model on its servers from your examples, and your program calls it over the internet. Whatever the method, the model learns only the patterns of **your examples**, in **their language**: put *thanks* in every kind example and it may decide that *No thanks, you are useless* is kind; train it in English and test it in French, and it will guess. That is why the site asks for the language of a text project.\n\n**Calling it from Python.** The project's **Make** page, then **Python**, shows a short code sample. Its `classify` function sends your text to the site with the `requests` library and returns the best label with its **confidence**, from 0 to 100. Label names come back with underscores: *kind things* becomes `kind_things`. The next module, *APIs and automation*, goes much further with calls like this one.\n\n**The key.** The sample contains your project's **API key**, a secret: anyone who has it can use your model and even add training examples to your project. As with your Titanic model, it stays in the Machine Learning for Kids page and your own notebook only; in anything you bring back, it becomes `YOUR-KEY`; it is never pasted into RoboHolic, not even into the tutor. Better, your program reads it from an environment variable, as this lesson's template does. If it ends up somewhere by mistake, delete the project on Machine Learning for Kids, which deletes its key too, and tell your teacher.",
              },
              fr: {
                heading: 'D’une phrase à une décision\u00a0: le pipeline',
                body: "Un classifieur de texte ne travaille jamais seul. Il se trouve au milieu d’un **pipeline** (une chaîne de traitement)\u00a0: une suite d’étapes où la sortie de chaque étape est l’entrée de la suivante.\n\n| Étape | Ce qui se passe | Qui s’en charge |\n|---|---|---|\n| 1. Collecter et étiqueter | Écrire des messages d’exemple et donner une étiquette à chacun\u00a0: *gentil* ou *méchant* | Toi |\n| 2. Entraîner | Transformer les exemples étiquetés en modèle | Machine Learning for Kids |\n| 3. Nettoyer l’entrée | Retirer les espaces en trop, refuser un message vide, raccourcir un message très long | Ton code Python |\n| 4. Classer | Envoyer le message au modèle et recevoir une étiquette et une confiance | Le modèle, appelé par ton code |\n| 5. Décider | N’agir selon l’étiquette que si la confiance est assez élevée | Ton code Python |\n| 6. Agir et garder une trace | Afficher un visage, et noter chaque message et chaque décision pour les tests | Ton code Python |\n\nSeule l’étape 4 relève de l’apprentissage automatique. Le reste, c’est de l’ingénierie ordinaire, et c’est souvent là que les systèmes cassent\u00a0: les règles de nettoyage de la leçon *Travailler avec des données* valent aussi pour le texte, et `\"   \"` (trois espaces) n’est pas un message.\n\n**Comment un modèle peut-il lire\u00a0?** Un modèle calcule avec des nombres\u00a0: le texte doit donc d’abord devenir des nombres. La méthode la plus simple, le **sac de mots** (*bag of words*), compte les mots d’un message et oublie leur ordre (words = mots)\u00a0:\n\n```python\nmessage = \"pas mal du tout\"\nwords = message.split()   # ['pas', 'mal', 'du', 'tout']\n```\n\nPour un sac de mots, *le chien poursuit le chat* et *le chat poursuit le chien* sont le même message. Les modèles de texte modernes tiennent aussi compte des paires de mots, de l’ordre des mots et du fait que *génial* et *formidable* s’emploient de façon semblable. Machine Learning for Kids entraîne son modèle sur ses serveurs à partir de tes exemples, et ton programme l’appelle par Internet. Quelle que soit la méthode, le modèle n’apprend que les régularités de **tes exemples**, dans **leur langue**\u00a0: mets *merci* dans tous tes exemples gentils, et il risque de trouver gentil *Non merci, tu ne sers à rien*\u00a0; entraîne-le en anglais et teste-le en français, et il devinera au hasard. C’est pourquoi le site demande la langue d’un projet de texte.\n\n**L’appel depuis Python.** La page **Faire** (*Make*) du projet, puis **Python**, montre un court exemple de code. Sa fonction `classify` envoie ton texte au site grâce à la bibliothèque `requests` et renvoie la meilleure étiquette avec sa **confiance**, de 0 à 100. Les noms d’étiquettes reviennent avec des tirets bas\u00a0: *kind things* devient `kind_things`. Le module suivant, consacré aux API et à l’automatisation, ira beaucoup plus loin avec ce genre d’appel.\n\n**La clé.** L’exemple contient la **clé d’API** de ton projet, un secret\u00a0: quiconque la possède peut utiliser ton modèle, et même ajouter des exemples d’entraînement à ton projet. Comme pour ton modèle du Titanic, elle reste uniquement dans la page de Machine Learning for Kids et dans ton propre notebook\u00a0; dans tout ce que tu rapportes, elle devient `YOUR-KEY`\u00a0; elle n’est jamais collée dans RoboHolic, pas même dans le tuteur. Mieux, ton programme la lit depuis une variable d’environnement, comme le fait le gabarit de cette leçon. Si elle s’est retrouvée quelque part par erreur, supprime le projet sur Machine Learning for Kids, ce qui supprime aussi sa clé, et préviens ton enseignant.",
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
                heading: 'Confidence, thresholds and honest tests',
                body: '**What the confidence means.** With its label, the model gives a confidence, such as `kind_things` at 74. It is the model\'s own score: how strongly the message matches the patterns of that label rather than the other one. It is **not** the chance that the label is right. A model can be 90% sure and wrong, especially on a message unlike all of its examples. And it always picks one of its labels: with only *kind* and *mean*, the question *What time does the open day end?* still gets one of the two.\n\n**A threshold turns a score into a decision.** Your program can refuse to act when the model is not sure enough:\n\n```python\nif confidence < THRESHOLD:\n    decision = "not_sure"   # the mascot shows a puzzled face\nelse:\n    decision = label\n```\n\nHere are ten new test messages, written before training, with the label a model gave and its confidence:\n\n| # | Message | Expected | Model | Confidence |\n|---|---|---|---|---|\n| 1 | Thanks for showing me the library! | kind | kind | 93 |\n| 2 | You are the worst robot ever. | mean | mean | 88 |\n| 3 | Not bad at all, little robot. | kind | mean | 64 |\n| 4 | Great, you crashed again. Brilliant. | mean | kind | 74 |\n| 5 | ur so cool | kind | kind | 58 |\n| 6 | Your jokes are slow and boring. | mean | mean | 81 |\n| 7 | Your screen is so bright and cheerful. | kind | kind | 77 |\n| 8 | What time does the open day end? | neither | kind | 52 |\n| 9 | I don\'t really like your voice. | mean | kind | 55 |\n| 10 | You made my day! | kind | kind | 90 |\n\n- **Threshold 0**, the program always answers: 10 answered, 6 right (1, 2, 5, 6, 7 and 10).\n- **Threshold 70**: 6 answered (1, 2, 4, 6, 7 and 10), 5 of them right. The 4 *not sure* avoid three mistakes (3, 8 and 9) but lose one right answer (5), and the sarcastic message 4 still gets through, at 74.\n- **Threshold 80**: only 4 answered (1, 2, 6 and 10), all right; the other 6 are *not sure*.\n\nThere is no perfect threshold, only a choice. A higher one means fewer wrong answers acted on, and more *not sure*. So report two numbers, not one: **how many messages the program answers**, and **how many of those it gets right**. The right balance depends on what each mistake costs: a mascot that frowns at a kind visitor is awkward, while a filter that hid a real call for help would be serious. That is why real moderation systems send uncertain cases to a person.\n\n**Honest tests.** The rules of *Classification, regression and evaluation* still hold:\n\n- Test with **new** messages only, never with training examples, and write each one with the label you expect **before** you look at any result. Keep *neither* for a message that fits no label.\n- Include the hard cases: negation (*not bad*), sarcasm, slang, a typo, an emoji, a very short message, a long one and one about something else.\n- When a test fails, explain it. You may then add training examples, but never the failed message itself: once it is a training example, it can no longer test anything. After retraining, rerun the same tests to compare, then check with a few new ones.',
              },
              fr: {
                heading: 'Confiance, seuils et tests honnêtes',
                body: '**Ce que veut dire la confiance.** Avec son étiquette, le modèle donne une confiance, par exemple `kind_things` à 74. C’est le score du modèle lui-même\u00a0: à quel point le message correspond aux régularités de cette étiquette plutôt qu’à celles de l’autre. Ce n’est **pas** la probabilité que l’étiquette soit juste. Un modèle peut être sûr à 90\u00a0% et se tromper, surtout sur un message qui ne ressemble à aucun de ses exemples. Et il choisit toujours l’une de ses étiquettes\u00a0: avec seulement *gentil* et *méchant*, la question *À quelle heure finit la journée portes ouvertes\u00a0?* reçoit quand même l’une des deux.\n\n**Un seuil transforme un score en décision.** Ton programme peut refuser d’agir quand le modèle n’est pas assez sûr (THRESHOLD = seuil, decision = décision, not_sure = pas sûr)\u00a0:\n\n```python\nif confidence < THRESHOLD:\n    decision = "not_sure"   # la mascotte prend un air perplexe\nelse:\n    decision = label\n```\n\nVoici dix nouveaux messages de test, écrits avant l’entraînement, avec l’étiquette donnée par un modèle et sa confiance (gentil = kind_things, méchant = mean_things, aucune = neither\u00a0: aucune étiquette ne convient)\u00a0:\n\n| N° | Message | Attendu | Modèle | Confiance |\n|---|---|---|---|---|\n| 1 | Merci de m’avoir montré la bibliothèque\u00a0! | gentil | gentil | 93 |\n| 2 | Tu es le pire robot du monde. | méchant | méchant | 88 |\n| 3 | Pas mal du tout, petit robot. | gentil | méchant | 64 |\n| 4 | Génial, tu as encore planté. Bravo. | méchant | gentil | 74 |\n| 5 | t trop cool | gentil | gentil | 58 |\n| 6 | Tes blagues sont lentes et ennuyeuses. | méchant | méchant | 81 |\n| 7 | Ton écran est si lumineux et si joyeux. | gentil | gentil | 77 |\n| 8 | À quelle heure finit la journée portes ouvertes\u00a0? | aucune | gentil | 52 |\n| 9 | J’aime pas trop ta voix. | méchant | gentil | 55 |\n| 10 | Tu as illuminé ma journée\u00a0! | gentil | gentil | 90 |\n\n- **Seuil 0**, le programme répond toujours\u00a0: 10\u00a0réponses, dont 6 justes (1, 2, 5, 6, 7 et 10).\n- **Seuil 70**\u00a0: 6\u00a0réponses (1, 2, 4, 6, 7 et 10), dont 5 justes. Les 4 *pas sûr* évitent trois erreurs (3, 8 et 9) mais font perdre une bonne réponse (5), et le message ironique 4 passe quand même, à 74.\n- **Seuil 80**\u00a0: seulement 4\u00a0réponses (1, 2, 6 et 10), toutes justes\u00a0; les 6 autres messages reçoivent *pas sûr*.\n\nIl n’existe pas de seuil parfait, seulement un choix. Un seuil plus haut, c’est moins de mauvaises réponses suivies d’effet, et plus de *pas sûr*. Donne donc deux nombres, pas un seul\u00a0: **à combien de messages le programme répond**, et **combien de ces réponses sont justes**. Le bon équilibre dépend du coût de chaque erreur\u00a0: une mascotte qui fait la grimace devant un visiteur gentil, c’est gênant\u00a0; un filtre qui cacherait un vrai appel à l’aide, ce serait grave. C’est pourquoi les vrais systèmes de modération transmettent les cas incertains à une personne.\n\n**Des tests honnêtes.** Les règles de la leçon *Classification, régression et évaluation* restent valables\u00a0:\n\n- Teste uniquement avec de **nouveaux** messages, jamais avec des exemples d’entraînement, et écris chacun avec l’étiquette que tu attends **avant** de regarder le moindre résultat. Garde *aucune* pour un message auquel aucune étiquette ne convient.\n- Inclus les cas difficiles\u00a0: une négation (*pas mal*), de l’ironie, de l’argot, une faute de frappe, un emoji, un message très court, un long, et un qui parle d’autre chose.\n- Quand un test échoue, explique pourquoi. Tu peux ensuite ajouter des exemples d’entraînement, mais jamais le message raté lui-même\u00a0: une fois devenu exemple d’entraînement, il ne peut plus rien tester. Après un nouvel entraînement, repasse les mêmes tests pour comparer, puis vérifie avec quelques nouveaux messages.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b4',
            type: RICH,
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Watch a toy model read three messages',
                body: "Real text models are far more complex, but you can watch the idea at work in a toy one. Imagine that training gave each word a score: positive for kind, negative for mean. A word it never saw scores 0.\n\n| Word | Score | Word | Score |\n|---|---|---|---|\n| thanks | +3 | bad | −2 |\n| great | +2 | boring | −2 |\n| cool | +2 | worst | −3 |\n| helpful | +2 | slow | −1 |\n| like | +1 | not | −1 |\n\nThe toy model cleans the message (lower case, no punctuation), splits it into words and adds up their scores. A total above 0 gives *kind*, below 0 *mean*, and the confidence is 50 + 10 × the size of the total, at most 95. A total of exactly 0 must still give a label: *kind*, at 50.\n\n| Message | Words with a score | Total | Label | Confidence | At threshold 70 |\n|---|---|---|---|---|---|\n| Thanks, you are so helpful! | thanks +3, helpful +2 | +5 | kind | 95 (the maximum) | kind |\n| Not bad at all. | not −1, bad −2 | −3 | mean | 80 | mean (wrong!) |\n| I don't like your jokes. | like +1 | +1 | kind | 60 | not sure |\n\nThree things to notice:\n\n- The second message is **confidently wrong**. Two negative words make a strong total, yet together they mean something kind: a bag of words cannot see that *not* changes *bad*. A score for the pair *not bad*, as some real models have, would fix this one.\n- In the third, *don't* has no score, so *like* wins. The threshold catches it: 60 is below 70, so the program says *not sure* instead of smiling.\n- The confidence formula is the toy's own. A real model computes its confidence in its own way, but the lesson is the same: a high number is not a guarantee.\n\nKeep this toy model in mind: it is your fallback if the website cannot be reached.",
              },
              fr: {
                heading: 'Regarde un modèle jouet lire trois messages',
                body: 'Les vrais modèles de texte sont bien plus complexes, mais tu peux voir l’idée à l’œuvre dans un modèle jouet. Imagine que l’entraînement a donné un score à chaque mot\u00a0: positif pour gentil, négatif pour méchant. Un mot jamais vu vaut 0.\n\n| Mot | Score | Mot | Score |\n|---|---|---|---|\n| merci | +3 | mal | −2 |\n| génial | +2 | ennuyeux | −2 |\n| cool | +2 | pire | −3 |\n| utile | +2 | lent | −1 |\n| aime | +1 | pas | −1 |\n\nLe modèle jouet nettoie le message (minuscules, sans ponctuation), le découpe en mots et additionne leurs scores. Un total supérieur à 0 donne *gentil*, inférieur à 0 *méchant*, et la confiance vaut 50 + 10 × la taille du total, au maximum 95. Un total d’exactement 0 doit quand même donner une étiquette\u00a0: *gentil*, à 50.\n\n| Message | Mots qui ont un score | Total | Étiquette | Confiance | Au seuil 70 |\n|---|---|---|---|---|---|\n| Merci, tu es vraiment utile\u00a0! | merci +3, utile +2 | +5 | gentil | 95 (le maximum) | gentil |\n| Pas mal du tout. | pas −1, mal −2 | −3 | méchant | 80 | méchant (faux\u00a0!) |\n| Tes blagues, je les aime moyen. | aime +1 | +1 | gentil | 60 | pas sûr |\n\nTrois choses à remarquer\u00a0:\n\n- Le deuxième message est **faux avec assurance**. Deux mots négatifs donnent un total élevé, alors qu’ensemble ils veulent dire quelque chose de gentil\u00a0: un sac de mots ne voit pas que *pas* change le sens de *mal*. Un score pour la paire *pas mal*, comme en ont certains vrais modèles, réglerait ce cas.\n- Dans le troisième, *moyen* n’a pas de score, donc *aime* l’emporte. Le seuil le rattrape\u00a0: 60 est inférieur à 70, et le programme dit *pas sûr* au lieu de sourire.\n- La formule de la confiance est propre au jouet. Un vrai modèle calcule sa confiance à sa façon, mais la leçon est la même\u00a0: un nombre élevé n’est pas une garantie.\n\nGarde ce modèle jouet en tête\u00a0: c’est ta solution de secours si le site est inaccessible.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b5',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Make me happy, in Python: a text classifier you call from code',
                instructions:
                  "**Your goal:** train a model to recognise kind and mean messages, call it from your own Python program, and test it on new sentences at two thresholds. The big idea: the model is one step of a pipeline, and you decide what the program does with its confidence.\n\n**Rules for your examples:** every message is invented and speaks to an invented mascot, never to or about a real person: no names of classmates, teachers or famous people, nothing about anyone's looks, family, religion or background, no swear words. Keep the mean ones mild, like a grumpy cartoon character: *Your jokes are boring.*\n\n1. Open Machine Learning for Kids and choose **Try it now**. For the click-by-click steps, follow the official worksheet (PDF), but skip its login step: you need no account. Skip its pictures step too: your program will print its reaction.\n2. Create a project called *make me happy* that recognises **text**, in the language of your messages.\n3. In **Train**, add the worksheet's two labels, *kind things* and *mean things*, and at least **10 examples of your own** for each: about as many on both sides, short and long, said in different ways.\n4. Before you train, write your **test table**: 10 new messages that are not among your examples, each with the label you expect (or *neither*), including the hard cases of this lesson.\n5. On **Learn & Test**, train the model (it can take a few minutes), then try one message to check that it works.\n6. Open **Make**, then **Python**. With the worksheet, set up Python in an environment your teacher approves, with the requests library that the page mentions, and copy the code sample into your own notebook. The key stays there.\n7. Organise your program like the template further down, run your 10 tests at threshold 0 and at a threshold you choose, and note the label, the confidence and the decision of each.\n8. Choose one failure and explain it. Before you bring anything back, replace your key with `YOUR-KEY` everywhere.",
                bringBack:
                  'Your Python program with the key replaced by YOUR-KEY, your table of 10 test messages (message, expected label, label given, confidence, decision at your threshold), the number answered and the number right at both thresholds, and one failure explained. All of it goes into the project below.',
                hint: 'Every message gets 50% and the labels look random? The model has not finished training: wait, then check on Learn & Test. An error about raw_input? The worksheet was written for an older Python: in Python 3, use input. An error about a missing module? Install the requests library first; your teacher can help. The model gets almost everything wrong? Check the language of the project, add more varied examples to both labels, train again and rerun the same tests. Try it now keeps one project at a time: delete any project left from an earlier lesson once its work is handed in.',
              },
              fr: {
                title:
                  'Rends-moi heureux, en Python\u00a0: un classifieur de texte appelé depuis ton code',
                instructions:
                  '**Ton but\u00a0:** entraîner un modèle à reconnaître les messages gentils et méchants, l’appeler depuis ton propre programme Python, et le tester sur de nouvelles phrases avec deux seuils. La grande idée\u00a0: le modèle n’est qu’une étape d’un pipeline, et c’est toi qui décides ce que le programme fait de sa confiance.\n\n**Règles pour tes exemples\u00a0:** chaque message est inventé et s’adresse à une mascotte inventée, jamais à une personne réelle ni à son sujet\u00a0: aucun nom de camarade, d’enseignant ou de célébrité, rien sur l’apparence, la famille, la religion ou les origines de qui que ce soit, aucune grossièreté. Garde des messages méchants légers, dignes d’un personnage de dessin animé grognon\u00a0: *Tes blagues sont nulles.*\n\n1. Ouvre Machine Learning for Kids et choisis **Essayer maintenant** (*Try it now*). Pour le détail des clics, suis la fiche officielle (PDF), mais saute son étape de connexion\u00a0: tu n’as pas besoin de compte. Saute aussi son étape des images\u00a0: ton programme affichera sa réaction sous forme de texte.\n2. Crée un projet appelé *make me happy* qui reconnaît du **texte**, dans la langue de tes messages (*French* pour le français).\n3. Dans **Entraîner** (*Train*), ajoute les deux étiquettes de la fiche, *kind things* (choses gentilles) et *mean things* (choses méchantes), et au moins **10\u00a0exemples de ton invention** pour chacune\u00a0: à peu près autant des deux côtés, courts et longs, formulés de façons différentes.\n4. Avant l’entraînement, écris ton **tableau de test**\u00a0: 10 nouveaux messages qui ne figurent pas parmi tes exemples, chacun avec l’étiquette que tu attends (ou *aucune*), dont les cas difficiles de cette leçon.\n5. Sur **Apprendre & Tester** (*Learn & Test*), entraîne le modèle (cela peut prendre quelques minutes), puis essaie un message pour vérifier qu’il fonctionne.\n6. Ouvre **Faire** (*Make*), puis **Python**. Avec la fiche, prépare Python dans un environnement approuvé par ton enseignant, avec la bibliothèque requests qu’indique la page, puis copie l’exemple de code dans ton propre notebook. La clé reste là.\n7. Organise ton programme comme le gabarit plus bas, lance tes 10\u00a0tests au seuil 0 puis au seuil de ton choix, et note l’étiquette, la confiance et la décision de chacun.\n8. Choisis un échec et explique-le. Avant de rapporter quoi que ce soit, remplace partout ta clé par `YOUR-KEY`.',
                bringBack:
                  'Ton programme Python avec la clé remplacée par YOUR-KEY, ton tableau des 10\u00a0messages de test (message, étiquette attendue, étiquette donnée, confiance, décision à ton seuil), le nombre de réponses et de réponses justes aux deux seuils, et un échec expliqué. Tout cela va dans le projet ci-dessous.',
                hint: 'Tous les messages obtiennent 50\u00a0% et les étiquettes semblent tirées au hasard\u00a0? Le modèle n’a pas fini son entraînement\u00a0: attends, puis vérifie sur Apprendre & Tester. Une erreur à propos de raw_input\u00a0? La fiche a été écrite pour une ancienne version de Python\u00a0: en Python 3, on utilise input. Une erreur à propos d’un module manquant\u00a0? Installe d’abord la bibliothèque requests\u00a0; ton enseignant peut t’aider. Le modèle se trompe presque tout le temps\u00a0? Vérifie la langue du projet, ajoute des exemples plus variés aux deux étiquettes, entraîne-le de nouveau et repasse les mêmes tests. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: supprime celui d’une leçon précédente, une fois son travail rendu.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy-python.pdf',
              projectType: 'text',
              codeTool: 'python',
              access: 'try_it_now',
            },
          },
          {
            id: 'm3-l1-b6',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No Python, or no website? Two fallbacks',
                body: '**If Python will not run** but the website works, type each test message into the test box of the **Learn & Test** page and note the label and the confidence it shows. Add each message, in lower case, with those results to the STAND_IN table of the template below, trace the template by hand at threshold 0 and at your threshold, and say so in your hand-in.\n\n**If the website is blocked**, use the toy model of *Watch a toy model read three messages* as your trained model:\n\n1. Write 10 test messages to the mascot, following the rules for examples, each with the label you expect: *kind*, *mean* or *neither*. Include a negation, a sarcastic message, slang, a typo, an emoji and one message about something else.\n2. For each, write the words that have a score, the total, the label and the confidence, exactly as the toy model computes them.\n3. Count the messages answered and the right ones at threshold 0 and at threshold 70.\n4. Explain one failure, and propose one change to the word scores, or one new word pair with its own score, that would fix it. Which other message might your change break?\n\nIn your hand-in, your table and your answers replace the Python program.',
              },
              fr: {
                heading: 'Pas de Python, ou pas de site\u00a0? Deux solutions de secours',
                body: '**Si Python ne fonctionne pas** mais que le site s’ouvre, tape chaque message de test dans la case de test de la page **Apprendre & Tester** et note l’étiquette et la confiance affichées. Ajoute chaque message, en minuscules, avec ces résultats à la table STAND_IN (le remplaçant) du gabarit ci-dessous, suis le gabarit à la main au seuil 0 et à ton seuil, et précise-le dans ton rendu.\n\n**Si le site est bloqué**, utilise le modèle jouet de *Regarde un modèle jouet lire trois messages* comme modèle entraîné\u00a0:\n\n1. Écris 10\u00a0messages de test pour la mascotte, en respectant les règles des exemples, chacun avec l’étiquette que tu attends\u00a0: *gentil*, *méchant* ou *aucune*. Inclus une négation, un message ironique, de l’argot, une faute de frappe, un emoji et un message qui parle d’autre chose.\n2. Pour chacun, écris les mots qui ont un score, le total, l’étiquette et la confiance, exactement comme les calcule le modèle jouet.\n3. Compte les réponses et les réponses justes au seuil 0 et au seuil 70.\n4. Explique un échec, et propose une modification des scores des mots, ou une nouvelle paire de mots avec son propre score, qui le corrigerait. Quel autre message ta modification risquerait-elle de casser\u00a0?\n\nDans ton rendu, ton tableau et tes réponses remplacent le programme Python.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l1-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Ask the AI tutor for examples of the kinds of messages that trick text classifiers: one example of each kind, with one sentence on why it is hard. Use them to check that your test table covers every kind, then write your own test messages: do not copy the tutor's. Keep personal details, real names and your key out of the chat.",
                starterPrompt:
                  'I am testing a text classifier that labels messages to a school mascot as kind_things or mean_things. Give me one example each of a message with a negation, sarcasm, slang, a typo, an emoji, and one about something else, with one sentence on what makes each one hard for the model. Keep every example polite enough for school, with no real names.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA des exemples des types de messages qui piègent les classifieurs de texte\u00a0: un exemple par type, avec une phrase qui explique pourquoi il est difficile. Sers-t’en pour vérifier que ton tableau de test couvre tous les types, puis écris tes propres messages de test\u00a0: ne recopie pas ceux du tuteur. Ne mets ni information personnelle, ni vrai nom, ni ta clé dans la conversation.',
                starterPrompt:
                  'Je teste un classifieur de texte qui étiquette les messages adressés à la mascotte d’un lycée en kind_things (gentil) ou mean_things (méchant). Donne-moi un exemple de message pour chaque cas\u00a0: une négation, de l’ironie, de l’argot, une faute de frappe, un emoji, et un message qui parle d’autre chose, avec une phrase sur ce qui rend chacun difficile pour le modèle. Garde des exemples assez polis pour l’école, sans aucun vrai nom.',
              },
            },
            data: { tutorMode: 'give_example', labToolId: null },
          },
          {
            id: 'm3-l1-b8',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  "Organise your program like this template, in your own notebook. It is saved here, not run, and it must never contain your real key. First, trace it here: as it stands, the key is YOUR-KEY, so a stand-in answers with four results of the lesson's table. What does the program print, and why does it never say not_sure, although THRESHOLD is 70?\n\nIn your own copy:\n\n1. TODO 1: below the if line of classify, paste the lines of your project's Python page that send the text to the site, make them use KEY instead of the key written in them, and return the label and the confidence of the best match.\n2. TODO 2: finish decide, so that a confidence below the threshold gives not_sure. Trace the four stand-in tests again with THRESHOLD = 70: which decisions change?\n3. TODO 3: replace the template's tests with your own 10 test messages and their expected labels.\n4. TODO 4: count the messages the program answered, and the right ones among them. Run it with THRESHOLD = 0 and with your threshold, and copy both tables into your hand-in.\n5. TODO 5: in a comment, explain one failure: what in the message fooled the model, which examples might fix it, and why you would then need new test messages.\n6. Before you hand it in, search your code for your key: only YOUR-KEY may appear.",
                hint: 'The site\'s sample returns a dictionary for the best match: its label is under "class_name" and its confidence under "confidence", so return those two values. For TODO 4, a decision counts as answered when it is not not_sure, and as right when it is also equal to the expected label: a message expected as neither can never be right. The stand-in knows only the four messages of the template; any other message gets kind_things at 50.',
              },
              fr: {
                instructions:
                  'Organise ton programme comme ce gabarit, dans ton propre notebook. Il est enregistré ici, pas exécuté, et il ne doit jamais contenir ta vraie clé. Dans le code, les noms sont en anglais\u00a0: clean = nettoyer, classify = classer, decide = décider, label = étiquette, confidence = confiance, THRESHOLD = seuil, STAND_IN = remplaçant, expected = attendu, answered = réponses, right = justes, not_sure = pas sûr, neither = aucune. Les quatre messages de test du gabarit, en anglais, viennent du tableau de la leçon\u00a0: «\u00a0You made my day!\u00a0» (Tu as illuminé ma journée\u00a0!), «\u00a0Not bad at all, little robot.\u00a0» (Pas mal du tout, petit robot.), «\u00a0Great, you crashed again. Brilliant.\u00a0» (Génial, tu as encore planté. Bravo.) et «\u00a0What time does the open day end?\u00a0» (À quelle heure finit la journée portes ouvertes\u00a0?). Commence par le suivre ici\u00a0: tel quel, la clé vaut YOUR-KEY, donc un remplaçant répond avec quatre résultats du tableau de la leçon. Qu’affiche le programme, et pourquoi ne dit-il jamais not_sure, alors que THRESHOLD vaut 70\u00a0?\n\nDans ta propre copie\u00a0:\n\n1. TODO\u00a01\u00a0: sous la ligne if de classify, colle les lignes de la page Python de ton projet qui envoient le texte au site, fais-leur utiliser KEY au lieu de la clé écrite dedans, et renvoie l’étiquette et la confiance de la meilleure réponse.\n2. TODO\u00a02\u00a0: termine decide, pour qu’une confiance inférieure au seuil donne not_sure. Suis de nouveau les quatre tests du remplaçant avec THRESHOLD = 70\u00a0: quelles décisions changent\u00a0?\n3. TODO\u00a03\u00a0: remplace les tests du gabarit par tes 10\u00a0messages de test et leurs étiquettes attendues.\n4. TODO\u00a04\u00a0: compte les messages auxquels le programme a répondu, et ceux qui sont justes parmi eux. Exécute-le avec THRESHOLD = 0 puis avec ton seuil, et copie les deux tableaux dans ton rendu.\n5. TODO\u00a05\u00a0: dans un commentaire, explique un échec\u00a0: ce qui, dans le message, a trompé le modèle, quels exemples pourraient corriger cela, et pourquoi il te faudrait alors de nouveaux messages de test.\n6. Avant de rendre ton travail, cherche ta clé dans ton code\u00a0: seul YOUR-KEY doit apparaître.',
                hint: 'L’exemple du site renvoie un dictionnaire pour la meilleure réponse\u00a0: son étiquette se trouve sous "class_name" et sa confiance sous "confidence"\u00a0; renvoie ces deux valeurs. Pour le TODO\u00a04, une décision compte comme une réponse quand elle n’est pas not_sure, et comme juste quand elle est en plus égale à l’étiquette attendue\u00a0: un message attendu neither ne peut donc jamais être juste. Le remplaçant ne connaît que les quatre messages du gabarit\u00a0; tout autre message reçoit kind_things à 50.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# make_me_happy.py: test YOUR text model from Python with messages you invent.',
                '# Saved here, not run: copy it into your own notebook. NEVER write your key here.',
                '# Enregistré ici, pas exécuté : copie-le dans ton notebook. N’y écris JAMAIS ta clé.',
                'import os',
                '',
                '# In your own notebook only: set the environment variable ML4K_KEY, or write your key in',
                '# place of YOUR-KEY there. Put YOUR-KEY back before you share anything.',
                'KEY = os.environ.get("ML4K_KEY", "YOUR-KEY")',
                '',
                'THRESHOLD = 70  # below this confidence (0 to 100), the mascot is not sure / pas sûre',
                '',
                "# Until TODO 1, a stand-in answers with four results of the lesson's table.",
                'STAND_IN = {',
                '    "you made my day!": ("kind_things", 90),',
                '    "not bad at all, little robot.": ("mean_things", 64),',
                '    "great, you crashed again. brilliant.": ("kind_things", 74),',
                '    "what time does the open day end?": ("kind_things", 52),',
                '}',
                '',
                '',
                'def clean(text):',
                '    """Step 3 of the pipeline: one space between words, none at the ends."""',
                '    return " ".join(text.split())',
                '',
                '',
                'def classify(text):',
                '    """Step 4: return the best label and its confidence, from 0 to 100."""',
                '    if KEY == "YOUR-KEY":  # no key here: the stand-in answers / pas de clé ici',
                '        return STAND_IN.get(text.lower(), ("kind_things", 50))',
                "    # TODO 1: paste the lines of your project's Python page here, using KEY, and return",
                '    # the label (class_name) and the confidence of the best match.',
                '    return None, 0',
                '',
                '',
                'def decide(label, confidence, threshold):',
                '    """Step 5: act on the label only when the model is sure enough."""',
                '    # TODO 2: below the threshold, return "not_sure". / Sous le seuil, renvoie "not_sure".',
                '    return label',
                '',
                '',
                '# TODO 3: your own 10 test messages, NEW ones only, each with the label you expect;',
                '# "neither" means that no label fits. Invented messages only: no real names.',
                'TESTS = [',
                '    ("You made my day!", "kind_things"),',
                '    ("Not bad at all, little robot.", "kind_things"),',
                '    ("Great, you crashed again. Brilliant.", "mean_things"),',
                '    ("What time does the open day end?", "neither"),',
                ']',
                '',
                'answered = 0',
                'right = 0',
                'print("| message | expected | label | confidence | decision |")',
                'print("|---|---|---|---|---|")',
                'for message, expected in TESTS:',
                '    text = clean(message)',
                '    if text == "":',
                '        continue  # an empty message never reaches the model / jamais envoyé au modèle',
                '    label, confidence = classify(text)',
                '    decision = decide(label, confidence, THRESHOLD)',
                '    print(f"| {text} | {expected} | {label} | {confidence}% | {decision} |")',
                '    # TODO 4: count the answered messages (decision is not "not_sure"),',
                '    # and the right ones among them (decision == expected).',
                '',
                'print(f"threshold {THRESHOLD}: answered {answered} of {len(TESTS)}, right {right}")',
                '',
                '# TODO 5: one failure, explained / un échec, expliqué :',
              ),
            },
          },
          {
            id: 'm3-l1-b9',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your text classifier: the program with the key replaced by YOUR-KEY, your test table at two thresholds and one failure, explained.',
              },
              fr: {
                intro:
                  'Rends ton classifieur de texte\u00a0: le programme avec la clé remplacée par YOUR-KEY, ton tableau de test à deux seuils et un échec, expliqué.',
              },
            },
            data: { projectId: 'project-m3' },
          },
          {
            id: 'm3-l1-b10',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your mascot will greet visitors at the open day. Which threshold would you choose, and what should the mascot do when it is not sure? Justify your choice with one result from your own tests, and say what a wrong answer would cost.',
              },
              fr: {
                prompt:
                  'Ta mascotte va accueillir les visiteurs de la journée portes ouvertes. Quel seuil choisirais-tu, et que devrait faire la mascotte quand elle n’est pas sûre\u00a0? Justifie ton choix avec un résultat de tes propres tests, et dis ce que coûterait une mauvaise réponse.',
              },
            },
            data: { minLength: 80 },
          },
        ],
      },

      // --- m3-l2: Computer vision with ready-trained models ----------------------------------
      {
        id: 'm3-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Computer vision with ready-trained models',
              summary:
                'Test MobileNet, a model already trained on more than a million photos, in Scratch: discover transfer learning, the labels a model knows, why its answers can look sure when they are not, and the gaps in its training data.',
            },
            fr: {
              title: 'La vision par ordinateur avec des modèles déjà entraînés',
              summary:
                'Teste dans Scratch MobileNet, un modèle déjà entraîné sur plus d’un million de photos\u00a0: découvre l’apprentissage par transfert, les étiquettes que connaît un modèle, pourquoi ses réponses peuvent paraître sûres sans l’être, et les lacunes de ses données d’entraînement.',
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
                heading: 'A thousand objects, ready in seconds',
                body: "Every year, the school's lost-property box fills up: water bottles, umbrellas, backpacks, pencil cases, odd running shoes. The club has an idea: photograph each object, let an AI model name it, and publish a list so that owners can find their things.\n\nTraining its own image model would mean collecting and labelling thousands of photos of each kind of object. In the last lesson, you trained a model on examples you wrote yourself. This time, someone else has done the training: **MobileNet** is a model that learned from more than a million labelled photos and recognises a thousand kinds of objects and animals. It downloads into your browser in seconds.\n\nThat sounds perfect. But which thousand objects? Learned from which photos? And what does it do with an object it has never learned? In this lesson, you are MobileNet's tester. You will test **objects and drawings only**: no photos of yourself or anyone else, and no webcam.\n\nPlan your 45 minutes: about 15 to read and watch, 15 to test the model, and 15 for your hand-in, the quiz and your reflection.",
              },
              fr: {
                heading: 'Mille objets, prêts en quelques secondes',
                body: 'Chaque année, la caisse des objets trouvés du lycée se remplit\u00a0: gourdes, parapluies, sacs à dos, trousses, chaussures de sport dépareillées. Le club a une idée\u00a0: photographier chaque objet, laisser un modèle d’IA lui donner un nom, et publier une liste pour que les propriétaires retrouvent leurs affaires.\n\nEntraîner son propre modèle d’images demanderait de rassembler et d’étiqueter des milliers de photos de chaque type d’objet. Dans la leçon précédente, tu as entraîné un modèle sur des exemples que tu avais écrits toi-même. Cette fois, quelqu’un d’autre s’est chargé de l’entraînement\u00a0: **MobileNet** est un modèle qui a appris à partir de plus d’un million de photos étiquetées et qui reconnaît mille sortes d’objets et d’animaux. Il se télécharge dans ton navigateur en quelques secondes.\n\nCela paraît parfait. Mais quels sont ces mille objets\u00a0? Appris sur quelles photos\u00a0? Et que fait-il d’un objet qu’il n’a jamais appris\u00a0? Dans cette leçon, tu es le testeur ou la testeuse de MobileNet. Tu testeras **uniquement des objets et des dessins**\u00a0: aucune photo de toi ni de qui que ce soit, et pas de webcam.\n\nOrganise tes 45\u00a0minutes\u00a0: environ 15 pour lire et regarder la vidéo, 15 pour tester le modèle, et 15 pour ton rendu, le quiz et ta réflexion.',
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
                heading: 'Pre-trained models and transfer learning',
                body: '**An image is a grid of numbers.** Each pixel is three numbers, for its red, green and blue, from 0 to 255. MobileNet looks at images of 224 × 224 pixels: 150,528 numbers for every picture, and its job is to turn them into one word.\n\n**Trained once, used by many.** Training a good vision model from nothing takes a huge labelled dataset and a lot of computing power. So researchers train a model once and share it: a **pre-trained** model, also called ready-trained. MobileNet is a family of image models designed by researchers at Google to be small and fast enough to run on a phone. The version that Machine Learning for Kids uses, MobileNet v3 small, was trained on the photos of the **ImageNet** challenge: more than 1.2 million labelled photos in 1,000 categories, such as *goldfish*, *pizza* and *toilet tissue*.\n\n**What is inside.** A vision model works in layers, as the video shows. The first layers react to simple things such as edges and patches of colour; the middle ones to textures and shapes, such as fur, stripes or a wheel; the last ones combine those into whole objects. At the very end, the model gives a score to every one of its labels, and the label with the highest score is its answer. Classifiers usually turn these scores into confidences that add up to 100% over all their labels, like the confidence of your text model. The Scratch block you will use shows only the winning label, without its confidence: a desperate guess looks exactly like a sure answer.\n\n**Transfer learning.** The early layers have learned features that are useful for almost any photo. **Transfer learning** keeps them and trains only a new last part on your own examples. That is how a tool can learn to tell three kinds of recycling apart from a few dozen photos of each: the hard part was learned from a million other photos. The image projects of Machine Learning for Kids work this way: they start from MobileNet and train new layers on your examples, in your browser.\n\n| | Train from nothing | Use a pre-trained model as it is | Transfer learning |\n|---|---|---|---|\n| Examples you need | Many thousands per label | None | A few dozen per label |\n| Labels | Your own | Only its labels | Your own |\n| Ready | After a long training | In seconds | After a short training |\n| Watch out for | Cost and time | Labels and gaps that are not yours | The gaps it inherits from the pre-trained model |\n\n**Read the label before you trust it.** The makers of a model can publish a **model card**, a short document that says what the model was trained on, how well it does and what it should not be used for. The official worksheet takes you to the model card of MobileNet: it is worth a look.',
              },
              fr: {
                heading: 'Modèles préentraînés et apprentissage par transfert',
                body: '**Une image est une grille de nombres.** Chaque pixel correspond à trois nombres, pour son rouge, son vert et son bleu, de 0 à 255. MobileNet regarde des images de 224 × 224\u00a0pixels\u00a0: 150\u00a0528\u00a0nombres pour chaque image, et son travail consiste à les transformer en un seul mot.\n\n**Entraîné une fois, utilisé par beaucoup.** Entraîner un bon modèle de vision à partir de rien demande un énorme jeu de données étiquetées et beaucoup de puissance de calcul. Les chercheurs entraînent donc un modèle une fois et le partagent\u00a0: c’est un modèle **préentraîné** (ou déjà entraîné). MobileNet est une famille de modèles d’images conçus par des chercheurs de Google pour être assez petits et rapides pour fonctionner sur un téléphone. La version qu’utilise Machine Learning for Kids, MobileNet v3 small, a été entraînée sur les photos du défi **ImageNet**\u00a0: plus de 1,2 million de photos étiquetées en 1\u00a0000\u00a0catégories, comme *goldfish* (poisson rouge), *pizza* et *toilet tissue* (papier toilette).\n\n**Ce qu’il y a dedans.** Un modèle de vision fonctionne par couches, comme le montre la vidéo. Les premières couches réagissent à des éléments simples comme des bords et des taches de couleur\u00a0; celles du milieu à des textures et à des formes, comme de la fourrure, des rayures ou une roue\u00a0; les dernières les combinent en objets entiers. Tout au bout, le modèle donne un score à chacune de ses étiquettes, et l’étiquette au score le plus élevé est sa réponse. Les classifieurs transforment en général ces scores en confiances dont la somme fait 100\u00a0% sur l’ensemble de leurs étiquettes, comme la confiance de ton modèle de texte. Le bloc Scratch que tu vas utiliser n’affiche que l’étiquette gagnante, sans sa confiance\u00a0: une réponse au hasard ressemble donc exactement à une réponse sûre.\n\n**L’apprentissage par transfert.** Les premières couches ont appris des éléments utiles pour presque n’importe quelle photo. L’**apprentissage par transfert** (*transfer learning*) les garde et n’entraîne qu’une nouvelle partie finale sur tes propres exemples. C’est ainsi qu’un outil peut apprendre à distinguer trois sortes de déchets recyclables à partir de quelques dizaines de photos de chacune\u00a0: le plus difficile a été appris sur un million d’autres photos. Les projets d’images de Machine Learning for Kids fonctionnent ainsi\u00a0: ils partent de MobileNet et entraînent de nouvelles couches sur tes exemples, dans ton navigateur.\n\n| | Entraîner à partir de rien | Utiliser un modèle préentraîné tel quel | Apprentissage par transfert |\n|---|---|---|---|\n| Exemples nécessaires | Plusieurs milliers par étiquette | Aucun | Quelques dizaines par étiquette |\n| Étiquettes | Les tiennes | Seulement les siennes | Les tiennes |\n| Prêt | Après un long entraînement | En quelques secondes | Après un court entraînement |\n| Point de vigilance | Le coût et le temps | Des étiquettes et des lacunes qui ne sont pas les tiennes | Les lacunes héritées du modèle préentraîné |\n\n**Lis l’étiquette avant de faire confiance.** Les créateurs d’un modèle peuvent publier une **fiche de modèle** (*model card*), un court document qui indique sur quoi le modèle a été entraîné, ses performances et les usages à éviter. La fiche d’activité officielle t’emmène vers la fiche de modèle de MobileNet\u00a0: elle vaut le coup d’œil.',
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
                heading: 'What MobileNet knows, and where it is blind',
                body: "**Only its own labels.** MobileNet can only answer with one of its 1,000 labels. Show it something that is not in its list and it will not say *I don't know*: it names the label that fits best, and in Scratch that answer looks just as sure as a right one. The list, in English, holds some surprises:\n\n| In the list | Not in the list |\n|---|---|\n| More than 100 dog breeds, such as *Chihuahua*, *beagle* and *standard poodle* | *dog* |\n| *tabby*, *Persian cat*, *Siamese cat* | *cat* |\n| *Granny Smith*, a kind of green apple | *apple* |\n| *ballpoint*, *fountain pen*, *quill* | *pencil* |\n| *water bottle*, *backpack*, *umbrella*, *pencil box* | *ruler*, *scissors*, *calculator* |\n| *mountain bike*, *bicycle-built-for-two* | *bicycle* |\n\nSo mark each test **right**, **close** (a near label, such as the wrong dog breed) or **wrong** (a mug called *umbrella*). Some wrong answers cannot be helped: a pencil can never be right, because *pencil* is not one of its labels. Some labels are also old-fashioned or very specific, because the list was taken from an English word database built long before the photos were collected.\n\n**Photos, not drawings.** MobileNet learned from photographs, and the site itself warns that it does not recognise cartoons and drawings well. A drawing has clean outlines, flat colours and no texture: numbers very different from those of a photo of the same object. When a kind of image is missing from the training data, that is a **gap**, and the model's answers there are guesses.\n\n**Whose world is in the photos?** ImageNet's photos were found by searching the web for the words of each label, then labelled by paid online workers. So the dataset shows the objects, homes and places that were common in web photos at the time, far more than others. Researchers have found that object recognisers trained on photos like these can work less well on everyday objects photographed in lower-income homes and in some regions of the world, where a cooking pot or a bar of soap does not look like the web photos. That is **bias**: not a model that wants anything, but a training set that shows some of the world far more than the rest. A model built on top of it by transfer learning can inherit the same gaps.\n\n**Why never people.** Image datasets collected from the web raise hard questions about people: nobody asked them for their consent, and labels can be offensive. In 2019, after researchers and artists exposed offensive labels in ImageNet's categories of people, its team removed many of those categories. Today you test objects and drawings only: a model that names objects was neither built nor tested to say anything about people.",
              },
              fr: {
                heading: 'Ce que MobileNet connaît, et là où il est aveugle',
                body: '**Seulement ses propres étiquettes.** MobileNet ne peut répondre qu’avec l’une de ses 1\u00a0000\u00a0étiquettes. Montre-lui quelque chose qui n’est pas dans sa liste, et il ne dira pas *je ne sais pas*\u00a0: il donne l’étiquette qui correspond le mieux, et dans Scratch, cette réponse a l’air tout aussi sûre qu’une bonne réponse. La liste, en anglais, réserve quelques surprises\u00a0:\n\n| Dans la liste | Absent de la liste |\n|---|---|\n| Plus de 100\u00a0races de chiens, comme *Chihuahua*, *beagle* et *standard poodle* (caniche) | *dog* (chien) |\n| *tabby* (chat tigré), *Persian cat* (persan), *Siamese cat* (siamois) | *cat* (chat) |\n| *Granny Smith*, une variété de pomme verte | *apple* (pomme) |\n| *ballpoint* (stylo à bille), *fountain pen* (stylo plume), *quill* (plume d’oie) | *pencil* (crayon) |\n| *water bottle* (gourde), *backpack* (sac à dos), *umbrella* (parapluie), *pencil box* (trousse) | *ruler* (règle), *scissors* (ciseaux), *calculator* (calculatrice) |\n| *mountain bike* (VTT), *bicycle-built-for-two* (tandem) | *bicycle* (vélo) |\n\nNote donc chaque test **juste**, **proche** (une étiquette voisine, comme la mauvaise race de chien) ou **faux** (une tasse appelée *umbrella*). Certaines erreurs sont inévitables\u00a0: un crayon ne peut jamais être reconnu, puisque *pencil* ne fait pas partie de ses étiquettes. Certaines étiquettes sont aussi vieillies ou très précises, car la liste a été tirée d’une base de mots anglais construite bien avant que les photos ne soient rassemblées.\n\n**Des photos, pas des dessins.** MobileNet a appris à partir de photographies, et le site lui-même prévient qu’il reconnaît mal les dessins animés et les dessins. Un dessin a des contours nets, des couleurs unies et aucune texture\u00a0: des nombres très différents de ceux d’une photo du même objet. Quand un type d’image manque dans les données d’entraînement, c’est une **lacune**, et les réponses du modèle y sont des devinettes.\n\n**Quel monde montrent les photos\u00a0?** Les photos d’ImageNet ont été trouvées en cherchant sur le Web les mots de chaque étiquette, puis étiquetées par des travailleurs payés en ligne. Le jeu de données montre donc les objets, les logements et les lieux fréquents dans les photos du Web de l’époque, bien plus que les autres. Des chercheurs ont constaté que des systèmes de reconnaissance d’objets entraînés sur ce genre de photos peuvent moins bien fonctionner sur des objets du quotidien photographiés dans des foyers à faibles revenus et dans certaines régions du monde, où une casserole ou un savon ne ressemble pas aux photos du Web. C’est cela, un **biais**\u00a0: pas un modèle qui voudrait quelque chose, mais un jeu d’entraînement qui montre une partie du monde bien plus que le reste. Un modèle construit par-dessus grâce à l’apprentissage par transfert peut hériter des mêmes lacunes.\n\n**Pourquoi jamais de personnes.** Les jeux de données d’images rassemblés sur le Web posent des questions difficiles au sujet des personnes\u00a0: personne ne leur a demandé leur accord, et les étiquettes peuvent être blessantes. En 2019, après que des chercheurs et des artistes ont révélé des étiquettes offensantes dans les catégories de personnes d’ImageNet, son équipe a supprimé une grande partie de ces catégories. Aujourd’hui, tu testes uniquement des objets et des dessins\u00a0: un modèle qui nomme des objets n’a été ni conçu ni testé pour dire quoi que ce soit sur des personnes.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b4',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: how computer vision works',
                caption:
                  "From Code.org's How AI Works series (about 6 minutes): how a computer learns to recognise what is in an image. As you watch, spot the layers, and ask yourself what MobileNet's training photos must have contained.",
                transcript:
                  'In short: to a computer, an image is only a grid of numbers. A computer vision model learns to recognise what is in an image from many labelled examples. It works in layers: the first react to simple features such as edges and patches of colour, the next combine them into shapes and parts, and the last combine those into whole objects to make a prediction. The video shows why this is harder than it sounds, for example when a computer has to tell a chihuahua from a muffin. Engineers who build self-driving cars and farming robots explain how computer vision helps their machines find their way and recognise what is around them. Keep in mind for this lesson: the model does not understand the image; it matches patterns of numbers learned from its training examples, so it can be wrong when the world looks different from those examples, as a drawing does from a photo.',
              },
              fr: {
                title: 'Regarde\u00a0: comment fonctionne la vision par ordinateur',
                caption:
                  'Une vidéo de la série How AI Works de Code.org (environ 6\u00a0minutes, en anglais)\u00a0: comment un ordinateur apprend à reconnaître ce que contient une image. Pendant la vidéo, repère les couches, et demande-toi ce que devaient contenir les photos d’entraînement de MobileNet.',
                transcript:
                  'En bref\u00a0: pour un ordinateur, une image n’est qu’une grille de nombres. Un modèle de vision par ordinateur apprend à reconnaître ce que contient une image à partir de nombreux exemples étiquetés. Il fonctionne par couches\u00a0: les premières réagissent à des éléments simples comme des bords ou des taches de couleur, les suivantes les assemblent en formes et en parties, et les dernières les combinent en objets entiers pour faire une prédiction. La vidéo montre pourquoi c’est plus difficile qu’il n’y paraît, par exemple quand un ordinateur doit distinguer un chihuahua d’un muffin. Des ingénieurs qui fabriquent des voitures autonomes et des robots agricoles expliquent comment la vision par ordinateur aide leurs machines à trouver leur chemin et à reconnaître ce qui les entoure. À retenir pour cette leçon\u00a0: le modèle ne comprend pas l’image\u00a0; il repère des régularités dans des nombres, apprises à partir de ses exemples d’entraînement, et il peut donc se tromper quand le monde ne ressemble pas à ces exemples, comme un dessin ne ressemble pas à une photo.',
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
            id: 'm3-l2-b5',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Mobilenet: test a model trained by someone else',
                instructions:
                  "**Your goal:** test a ready-trained image model in Scratch, find what it recognises well, what it gets close and what it cannot know, and explain one gap in its training data. You train nothing today: your job is to be its tester.\n\n**Rules for your tests:** the template's scenes and your own drawings of objects only. No photos of yourself, classmates or anyone else, no faces, no webcam. A photo of objects only if your teacher agrees, with no people, no names and nothing that shows where you live.\n\n1. Open Machine Learning for Kids: the button below takes you to its ready-trained models, with no login. For the click-by-click steps, follow the official worksheet (PDF): open Scratch and load the **mobilenet** project template. It is large, so give it a moment.\n2. Read the code of the test sprite and predict what it will do before you run it.\n3. Before each test, write down the object and the label you expect. Then test at least **six objects** in the template's scenes, one at a time.\n4. Change the box: the same object in a tight box, then in a loose one, then two objects in the same box. Note what changes.\n5. Look through the model's list of labels, as the worksheet shows. Find three objects from your school bag or your kitchen that are in the list, and three that are not.\n6. In Scratch's paint editor, draw two objects that **are** in the list, as a new backdrop, and test them. Compare with the photos.\n7. Mark each result *right*, *close* or *wrong*, and take a screenshot of one test, with no names or faces in it.",
                bringBack:
                  'Your table of at least 8 tests (object or drawing, label expected, label given, right, close or wrong), the three objects that are in the list and the three that are not, and one gap in the training data, explained. Add a screenshot of one test with no names or faces. All of it goes into the project below.',
                hint: 'The template takes a while to load: wait until the model is ready before you test. Every answer looks odd? Make the box fit the object more tightly, and test one object at a time. Your drawing gets a strange label? That is a result, not a mistake on your part: note it. The tab is slow or crashes? Close your other tabs, or use a computer with more memory.',
              },
              fr: {
                title: 'Mobilenet\u00a0: teste un modèle entraîné par d’autres',
                instructions:
                  '**Ton but\u00a0:** tester un modèle d’images déjà entraîné dans Scratch, trouver ce qu’il reconnaît bien, ce qu’il reconnaît à peu près et ce qu’il ne peut pas savoir, et expliquer une lacune de ses données d’entraînement. Aujourd’hui, tu n’entraînes rien\u00a0: ton rôle, c’est de le tester.\n\n**Règles pour tes tests\u00a0:** uniquement les scènes du projet et tes propres dessins d’objets. Aucune photo de toi, de tes camarades ou de qui que ce soit, aucun visage, pas de webcam. Une photo d’objets seulement si ton enseignant est d’accord, sans personne, sans nom et sans rien qui montre où tu vis.\n\n1. Ouvre Machine Learning for Kids\u00a0: le bouton ci-dessous t’amène à ses modèles déjà entraînés, sans connexion. Pour le détail des clics, suis la fiche officielle (PDF)\u00a0: ouvre Scratch et charge le projet de départ **mobilenet** (menu *Modèles de projets*, *Project templates*). Il est lourd\u00a0: laisse-lui un moment.\n2. Lis le code du sprite (lutin) de test et prédis ce qu’il va faire avant de le lancer.\n3. Avant chaque test, note l’objet et l’étiquette que tu attends. Teste ensuite au moins **six objets** dans les scènes du projet, un à la fois.\n4. Change le cadre\u00a0: le même objet dans un cadre serré, puis dans un cadre large, puis deux objets dans le même cadre. Note ce qui change.\n5. Parcours la liste des étiquettes du modèle, comme le montre la fiche. Trouve trois objets de ton sac ou de ta cuisine qui y figurent, et trois qui n’y figurent pas.\n6. Dans l’éditeur de dessin de Scratch, dessine deux objets qui **figurent** dans la liste, comme nouvel arrière-plan, et teste-les. Compare avec les photos.\n7. Note chaque résultat *juste*, *proche* ou *faux*, et fais une capture d’écran d’un test, sans nom ni visage.',
                bringBack:
                  'Ton tableau d’au moins 8\u00a0tests (objet ou dessin, étiquette attendue, étiquette donnée, juste, proche ou faux), les trois objets qui figurent dans la liste et les trois qui n’y figurent pas, et une lacune des données d’entraînement, expliquée. Ajoute une capture d’écran d’un test, sans nom ni visage. Tout cela va dans le projet ci-dessous.',
                hint: 'Le projet met du temps à se charger\u00a0: attends que le modèle soit prêt avant de tester. Toutes les réponses semblent bizarres\u00a0? Ajuste le cadre au plus près de l’objet, et teste un seul objet à la fois. Ton dessin reçoit une étiquette étrange\u00a0? C’est un résultat, pas une erreur de ta part\u00a0: note-le. L’onglet est lent ou plante\u00a0? Ferme tes autres onglets, ou utilise un ordinateur avec plus de mémoire.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/pretrained',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-mobilenet.pdf',
              projectType: 'pretrained',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm3-l2-b6',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Be a model with only 12 labels',
                body: 'If the website does not open, play the same test on paper with a partner. The **model** may only answer with one of these 12 labels, even when nothing fits, just as MobileNet must answer with one of its 1,000:\n\n*water bottle, coffee mug, backpack, umbrella, ballpoint, notebook, laptop, banana, orange, soccer ball, running shoe, wall clock*\n\n1. The **tester** gathers 8 things to show: 4 real objects that have a label in the list, 2 that do not (a pencil, a ruler), and 2 drawings of objects in the list. Before each test, the tester writes down the expected label.\n2. The model looks for three seconds and answers with one label from the list.\n3. Fill in the table of the activity: object or drawing, expected label, label given, right, close or wrong.\n4. Swap roles, with a new list of 12 labels chosen by the new tester.\n\nWhich objects could never be right? What would the model need in order to learn them, and how many photos might that take? Unlike MobileNet, you recognise drawings easily: why? Hand in your table and your answers.',
              },
              fr: {
                heading: 'Pas de site\u00a0? Joue un modèle qui n’a que 12\u00a0étiquettes',
                body: 'Si le site ne s’ouvre pas, joue le même test sur papier avec un camarade. Le **modèle** n’a le droit de répondre qu’avec l’une de ces 12\u00a0étiquettes, même quand aucune ne convient, exactement comme MobileNet doit répondre avec l’une de ses 1\u00a0000\u00a0:\n\n*gourde, tasse, sac à dos, parapluie, stylo à bille, cahier, ordinateur portable, banane, orange, ballon de foot, chaussure de sport, horloge*\n\n1. Le **testeur** rassemble 8\u00a0choses à montrer\u00a0: 4 vrais objets qui ont une étiquette dans la liste, 2 qui n’en ont pas (un crayon, une règle) et 2\u00a0dessins d’objets de la liste. Avant chaque test, il note l’étiquette attendue.\n2. Le modèle regarde pendant trois secondes et répond avec une étiquette de la liste.\n3. Remplis le tableau de l’activité\u00a0: objet ou dessin, étiquette attendue, étiquette donnée, juste, proche ou faux.\n4. Échangez les rôles, avec une nouvelle liste de 12\u00a0étiquettes choisie par le nouveau testeur.\n\nQuels objets ne pourraient jamais être reconnus\u00a0? De quoi le modèle aurait-il besoin pour les apprendre, et combien de photos cela pourrait-il demander\u00a0? Contrairement à MobileNet, tu reconnais facilement les dessins\u00a0: pourquoi\u00a0? Rends ton tableau et tes réponses.',
              },
            },
            data: {},
          },
          {
            id: 'm3-l2-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor to explain transfer learning with an everyday comparison. Then explain in your own words one surprising result from your tests, and let the tutor tell you what you got right and what you missed. The thinking in your hand-in stays yours. Never share or describe photos of people, and keep personal details out of the chat.',
                starterPrompt:
                  'Explain transfer learning to me with an everyday comparison, in five sentences at most. Then I will explain in my own words why MobileNet, a model trained on photos, gave a strange answer for my drawing of [object], and you tell me what I got right and what I missed.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA de t’expliquer l’apprentissage par transfert avec une comparaison de la vie courante. Explique ensuite avec tes propres mots un résultat surprenant de tes tests, et laisse le tuteur te dire ce que tu as bien compris et ce qui t’a échappé. La réflexion de ton rendu reste la tienne. Ne partage et ne décris jamais de photos de personnes, et ne mets aucune information personnelle dans la conversation.',
                starterPrompt:
                  'Explique-moi l’apprentissage par transfert avec une comparaison de la vie courante, en cinq phrases au maximum. Ensuite, je t’expliquerai avec mes propres mots pourquoi MobileNet, un modèle entraîné sur des photos, a donné une réponse étrange pour mon dessin de [objet], et tu me diras ce que j’ai bien compris et ce qui m’a échappé.',
              },
            },
            data: { tutorMode: 'explain', labToolId: null },
          },
          {
            id: 'm3-l2-b8',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your tests of MobileNet: your table, the labels it knows and does not know, and one gap in its training data, explained.',
              },
              fr: {
                intro:
                  'Rends tes tests de MobileNet\u00a0: ton tableau, les étiquettes qu’il connaît et celles qu’il ne connaît pas, et une lacune de ses données d’entraînement, expliquée.',
              },
            },
            data: { projectId: 'project-m3-2' },
          },
          {
            id: 'm3-l2-b9',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about text pipelines, confidence and thresholds, honest tests and ready-trained image models.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur les pipelines de texte, la confiance et les seuils, les tests honnêtes et les modèles d’images déjà entraînés.',
              },
            },
            data: { quizId: 'quiz-m3' },
          },
          {
            id: 'm3-l2-b10',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your school wants to use MobileNet, as it is, to sort its lost-property box. Using your own tests, give one way it would help and two ways it could fail. Would transfer learning on photos of the real box fix those failures? What would still need a person?',
              },
              fr: {
                prompt:
                  'Ton lycée veut utiliser MobileNet tel quel pour trier sa caisse des objets trouvés. À partir de tes propres tests, donne une façon dont il aiderait et deux façons dont il pourrait échouer. Un apprentissage par transfert sur des photos de la vraie caisse corrigerait-il ces échecs\u00a0? Qu’est-ce qui demanderait encore une personne\u00a0?',
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
      id: 'quiz-m3',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: language and vision',
            instructions:
              'Seven questions on text pipelines, confidence and thresholds, honest tests and ready-trained image models. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: langage et vision',
            instructions:
              'Sept questions sur les pipelines de texte, la confiance et les seuils, les tests honnêtes et les modèles d’images déjà entraînés. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A visitor sends the mascot a message made of three spaces and nothing else. In a well-built pipeline, what should happen?',
              },
              fr: {
                prompt:
                  'Un visiteur envoie à la mascotte un message composé de trois espaces et de rien d’autre. Dans un pipeline bien construit, que doit-il se passer\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The model labels it, probably as mean_things' },
                  fr: { text: 'Le modèle l’étiquette, sans doute en mean_things' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The cleaning step of your code turns it into an empty message, which is never sent to the model',
                  },
                  fr: {
                    text: 'L’étape de nettoyage de ton code le transforme en message vide, qui n’est jamais envoyé au modèle',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The threshold deals with it, because its confidence will be low' },
                  fr: { text: 'Le seuil s’en occupe, car sa confiance sera faible' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Nothing special: every message must reach the model' },
                  fr: { text: 'Rien de spécial\u00a0: chaque message doit parvenir au modèle' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "Cleaning the input is your code's job, before the model is called: three spaces are not a message. The model would still return one of its labels, with some confidence, and you cannot count on a threshold to catch it. Catching such cases is part of engineering the pipeline.",
              },
              fr: {
                text: 'Nettoyer l’entrée, c’est le travail de ton code, avant l’appel au modèle\u00a0: trois espaces ne font pas un message. Le modèle renverrait quand même l’une de ses étiquettes, avec une certaine confiance, et tu ne peux pas compter sur un seuil pour l’arrêter. Repérer ce genre de cas fait partie de la construction du pipeline.',
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
                  'A text model gives these confidences for six test messages: 91, 66, 74, 59, 88 and 70. Your program says not_sure when the confidence is below the threshold, and the threshold is 70. How many of the six messages does it answer? (a number)',
              },
              fr: {
                prompt:
                  'Un modèle de texte donne ces confiances pour six messages de test\u00a0: 91, 66, 74, 59, 88 et 70. Ton programme dit not_sure quand la confiance est inférieure au seuil, et le seuil vaut 70. À combien des six messages répond-il\u00a0? (un nombre)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: ['4', 'four', '4 messages', 'four messages'],
              fr: ['4', 'quatre', '4\u00a0messages', 'quatre messages'],
            },
            explanation: {
              en: {
                text: '91, 74, 88 and 70 are not below 70, so the program answers those 4 messages; 66 and 59 get not_sure. A confidence equal to the threshold is not below it, so 70 is answered.',
              },
              fr: {
                text: '91, 74, 88 et 70 ne sont pas inférieurs à 70\u00a0: le programme répond donc à ces 4\u00a0messages\u00a0; 66 et 59 reçoivent not_sure. Une confiance égale au seuil ne lui est pas inférieure\u00a0: 70 obtient donc une réponse.',
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
                  'If your model labels a message mean_things with a confidence of 90, it is right on 90% of messages like this one.',
              },
              fr: {
                prompt:
                  'Si ton modèle étiquette un message mean_things avec une confiance de 90, il a raison pour 90\u00a0% des messages de ce genre.',
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
                text: "False. The confidence is the model's own score, not a measured accuracy. A model can be very sure and wrong, as the toy model was on Not bad at all. Only tests on new messages tell you how often it is right.",
              },
              fr: {
                text: 'Faux. La confiance est le score du modèle lui-même, pas une exactitude mesurée. Un modèle peut être très sûr de lui et se tromper, comme le modèle jouet sur Pas mal du tout. Seuls des tests sur de nouveaux messages te disent à quelle fréquence il a raison.',
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
                  'You are writing the test table for your text classifier. Which of these are good practice? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Tu écris le tableau de test de ton classifieur de texte. Lesquelles de ces pratiques sont bonnes\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Write the test messages and their expected labels before you look at any result',
                  },
                  fr: {
                    text: 'Écrire les messages de test et leurs étiquettes attendues avant de regarder le moindre résultat',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Reuse some training examples, since you already know their labels' },
                  fr: {
                    text: 'Réutiliser quelques exemples d’entraînement, puisque tu connais déjà leurs étiquettes',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Include a negation, a sarcastic message and one about something else',
                  },
                  fr: {
                    text: 'Inclure une négation, un message ironique et un message qui parle d’autre chose',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'After a failure, add that exact message to the training examples and keep it in the test table',
                  },
                  fr: {
                    text: 'Après un échec, ajouter ce message exact aux exemples d’entraînement et le garder dans le tableau de test',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Report how many messages were answered and how many of those were right',
                  },
                  fr: {
                    text: 'Indiquer à combien de messages le programme a répondu et combien de ces réponses étaient justes',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A test only counts if the model has never seen the message: training examples, or a failed test added to them, make the score too kind. Writing the expected labels first keeps you honest, hard cases show what the model relies on, and two numbers show the effect of the threshold.',
              },
              fr: {
                text: 'Un test ne compte que si le modèle n’a jamais vu le message\u00a0: des exemples d’entraînement, ou un test raté qu’on y a ajouté, rendent le score trop flatteur. Écrire d’abord les étiquettes attendues garantit ton honnêteté, les cas difficiles montrent sur quoi s’appuie le modèle, et deux nombres montrent l’effet du seuil.',
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
                  'You notice that your real project key is visible in a screenshot you have already shared with a classmate. What is the best thing to do?',
              },
              fr: {
                prompt:
                  'Tu remarques que la vraie clé de ton projet est visible sur une capture d’écran que tu as déjà partagée avec un camarade. Que vaut-il mieux faire\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Nothing: a project key only works on your own computer' },
                  fr: {
                    text: 'Rien\u00a0: une clé de projet ne fonctionne que sur ton ordinateur',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Delete the project on Machine Learning for Kids, which deletes its key, and tell your teacher',
                  },
                  fr: {
                    text: 'Supprimer le projet sur Machine Learning for Kids, ce qui supprime sa clé, et prévenir ton enseignant',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Ask your classmate to promise not to use it' },
                  fr: { text: 'Demander à ton camarade de promettre de ne pas s’en servir' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Rename your two labels, so that the key no longer matches' },
                  fr: { text: 'Renommer tes deux étiquettes, pour que la clé ne corresponde plus' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Anyone who has the key can use your model from anywhere, and even add training examples to your project. A promise does not take the key back, and renaming labels does not change it. Deleting the project deletes its key, and your teacher can help you start again.',
              },
              fr: {
                text: 'Quiconque possède la clé peut utiliser ton modèle de n’importe où, et même ajouter des exemples d’entraînement à ton projet. Une promesse ne reprend pas la clé, et renommer les étiquettes ne la change pas. Supprimer le projet supprime sa clé, et ton enseignant peut t’aider à recommencer.',
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
                  'A club has 40 photos of each of its 3 kinds of recycling. Why does transfer learning from MobileNet make sense for its sorting model?',
              },
              fr: {
                prompt:
                  'Un club possède 40\u00a0photos de chacune de ses 3\u00a0sortes de déchets recyclables. Pourquoi l’apprentissage par transfert à partir de MobileNet est-il une bonne idée pour son modèle de tri\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'MobileNet already knows the three kinds of recycling of the club' },
                  fr: { text: 'MobileNet connaît déjà les trois sortes de déchets du club' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: "Its early layers already learned general features, such as edges, textures and shapes, from more than a million photos, so only a new last part needs training on the club's photos",
                  },
                  fr: {
                    text: 'Ses premières couches ont déjà appris des éléments généraux, comme les bords, les textures et les formes, sur plus d’un million de photos\u00a0: seule une nouvelle partie finale doit être entraînée sur les photos du club',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Transfer learning needs no examples at all' },
                  fr: { text: 'L’apprentissage par transfert ne demande aucun exemple' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Transfer learning removes the gaps and biases of the pre-trained model',
                  },
                  fr: {
                    text: 'L’apprentissage par transfert supprime les lacunes et les biais du modèle préentraîné',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Transfer learning reuses what the pre-trained model learned about images in general and trains only a small new part on your labels, which is why a few dozen photos per label can be enough. It still needs your examples, and it can inherit the gaps of the model it starts from.',
              },
              fr: {
                text: 'L’apprentissage par transfert réutilise ce que le modèle préentraîné a appris sur les images en général et n’entraîne qu’une petite partie nouvelle sur tes étiquettes\u00a0: c’est pourquoi quelques dizaines de photos par étiquette peuvent suffire. Il lui faut quand même tes exemples, et il peut hériter des lacunes du modèle dont il part.',
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
                  'MobileNet names your test photos of a water bottle and a backpack correctly, but gives odd answers for your drawing of a water bottle and for a photo of a pencil. What do the two failures have in common?',
              },
              fr: {
                prompt:
                  'MobileNet nomme correctement tes photos de test d’une gourde et d’un sac à dos, mais donne des réponses étranges pour ton dessin d’une gourde et pour une photo de crayon. Qu’ont en commun ces deux échecs\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Both are bugs in the Scratch template' },
                  fr: { text: 'Ce sont deux bugs du projet Scratch' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Both come from its training: it learned from photos, not drawings, and pencil is not one of its 1,000 labels',
                  },
                  fr: {
                    text: 'Les deux viennent de son entraînement\u00a0: il a appris sur des photos, pas sur des dessins, et pencil ne fait pas partie de ses 1\u00a0000\u00a0étiquettes',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Both mean that the model needs a faster computer' },
                  fr: {
                    text: 'Les deux signifient que le modèle a besoin d’un ordinateur plus rapide',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Both would disappear if Scratch showed the confidence' },
                  fr: { text: 'Les deux disparaîtraient si Scratch affichait la confiance' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A model knows only what its training data showed it. Drawings are a gap in its training photos, and an object that is not among its labels can never be named: the model still answers with the label that fits best. Seeing a confidence might warn you, but it would not make the answer right.',
              },
              fr: {
                text: 'Un modèle ne connaît que ce que lui ont montré ses données d’entraînement. Les dessins sont une lacune de ses photos d’entraînement, et un objet absent de ses étiquettes ne peut jamais être nommé\u00a0: le modèle répond quand même avec l’étiquette qui correspond le mieux. Voir une confiance pourrait t’alerter, mais elle ne rendrait pas la réponse juste.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m3',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'My text classifier in Python',
            brief:
              'Train a model to recognise kind and mean messages with the Make me happy project of Machine Learning for Kids, call it from your own Python program, and test it honestly on new messages at two confidence thresholds. Use Try it now (no account), follow the official Make me happy (Python) worksheet for the clicks and the template of the lesson for the structure, and hand in your work in the same lesson: a Try it now project is deleted after a few hours. Every message, in training and in tests, is invented and addressed to an invented mascot: no real people, no names, nothing hurtful. Your project key is a secret: it stays in the Machine Learning for Kids page and your own notebook, and it is replaced with YOUR-KEY in everything you hand in.',
            requirements:
              'Hand in three things. 1) Your Python program: the template of the lesson with your classify function, your decide function and your test messages, and your key replaced by YOUR-KEY. Search your code for the key before you send it; if it was sent by mistake, delete the project on Machine Learning for Kids and tell your teacher. 2) Your test table: at least 10 new messages that were not training examples, each with the label you expected (kind_things, mean_things or neither), the label given, its confidence and the decision at your threshold. Include at least one negation, one sarcastic message, one with slang or a typo, and one about something else. Add two lines with the number of messages answered and the number right among them, one at threshold 0 and one at your threshold, and one sentence on why you chose your threshold. 3) One failure, explained in three to five sentences: what in the message fooled the model, which training examples might fix it, and why the failed message could then no longer be a test. How to send it: choose Code and paste your program, then write the table and the failure in "About your work"; or send everything as Text. If you did the paper version, you can send a photo of your table as an Image (no names or faces in it), with the explanation in "About your work". If Python would not run, hand in the template with the results of the Learn & Test page; if the website was blocked, hand in the paper version with the toy model. How it is assessed: Understanding (the pipeline, what a confidence does and does not mean, and the effect of the threshold); Technical quality (a clean, working program and an honest, complete test table); Responsible use of AI (no key, invented and harmless messages, failures reported honestly); Creativity (hard test cases well chosen to reveal what the model relies on).',
          },
          fr: {
            title: 'Mon classifieur de texte en Python',
            brief:
              'Entraîne un modèle à reconnaître les messages gentils et méchants avec le projet Rends-moi heureux (Make me happy) de Machine Learning for Kids, appelle-le depuis ton propre programme Python, et teste-le honnêtement sur de nouveaux messages avec deux seuils de confiance. Utilise «\u00a0Essayer maintenant\u00a0» (Try it now, sans compte), suis la fiche officielle Make me happy (version Python) pour les clics et le gabarit de la leçon pour la structure, et rends ton travail pendant la même leçon\u00a0: un projet «\u00a0Essayer maintenant\u00a0» est effacé au bout de quelques heures. Chaque message, à l’entraînement comme en test, est inventé et s’adresse à une mascotte inventée\u00a0: aucune personne réelle, aucun nom, rien de blessant. La clé de ton projet est un secret\u00a0: elle reste dans la page de Machine Learning for Kids et dans ton propre notebook, et elle est remplacée par YOUR-KEY dans tout ce que tu rends.',
            requirements:
              'Rends trois choses. 1) Ton programme Python\u00a0: le gabarit de la leçon avec ta fonction classify, ta fonction decide et tes messages de test, et ta clé remplacée par YOUR-KEY. Cherche la clé dans ton code avant de l’envoyer\u00a0; si elle a été envoyée par erreur, supprime le projet sur Machine Learning for Kids et préviens ton enseignant. 2) Ton tableau de test\u00a0: au moins 10 nouveaux messages qui n’étaient pas des exemples d’entraînement, chacun avec l’étiquette que tu attendais (kind_things, mean_things ou neither), l’étiquette donnée, sa confiance et la décision à ton seuil. Inclus au moins une négation, un message ironique, un message avec de l’argot ou une faute de frappe, et un message qui parle d’autre chose. Ajoute deux lignes avec le nombre de réponses et le nombre de réponses justes, l’une au seuil 0 et l’autre à ton seuil, et une phrase qui explique le choix de ton seuil. 3) Un échec, expliqué en trois à cinq phrases\u00a0: ce qui, dans le message, a trompé le modèle, quels exemples d’entraînement pourraient corriger cela, et pourquoi le message raté ne pourrait alors plus servir de test. Pour l’envoyer\u00a0: choisis Code et colle ton programme, puis écris le tableau et l’échec dans «\u00a0À propos de votre travail\u00a0»\u00a0; ou envoie tout sous forme de texte. Si tu as fait la version sur papier, tu peux envoyer une photo de ton tableau sous forme d’image (sans nom ni visage), avec l’explication dans «\u00a0À propos de votre travail\u00a0». Si Python ne fonctionnait pas, rends le gabarit rempli avec les résultats de la page Apprendre & Tester\u00a0; si le site était bloqué, rends la version sur papier avec le modèle jouet. Critères d’évaluation\u00a0: Compréhension (le pipeline, ce que signifie ou non une confiance, et l’effet du seuil)\u00a0; Qualité technique (un programme propre qui fonctionne, et un tableau de test honnête et complet)\u00a0; Usage responsable de l’IA (aucune clé, des messages inventés et inoffensifs, des échecs rapportés honnêtement)\u00a0; Créativité (des cas de test difficiles bien choisis pour révéler sur quoi s’appuie le modèle).',
          },
        },
        allowedSubmissionTypes: ['code', 'text', 'image'],
        rubric: [
          { key: 'understanding', weight: 30 },
          { key: 'technicalQuality', weight: 30 },
          { key: 'responsibleAi', weight: 30 },
          { key: 'creativity', weight: 10 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
    {
      id: 'project-m3-2',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Testing a ready-trained image model',
            brief:
              'Test MobileNet, an image model trained by others on more than a million photos, with the mobilenet project template of Machine Learning for Kids, and find out what it recognises, what it gets close and what it cannot know. Follow the official Mobilenet worksheet for the clicks. You train nothing and need no account. Test objects and drawings only: no photos of people, no faces, no webcam.',
            requirements:
              'Hand in three things. 1) Your test table: at least 8 tests, including at least 5 objects in the template\'s scenes, one object in a tight box and in a loose one, and 2 drawings of your own of objects that are in the list. For each test: what you tested, the label you expected (written before the test), the label given, and right, close or wrong. 2) Three everyday objects that are in the list of labels and three that are not, with one sentence on what the model might answer for one of the missing ones. 3) One gap in the training data, explained in three to five sentences: what the model got wrong, what was missing from its training photos, and what training data, or transfer learning, could fix it. How to send it: send everything as Text, or send a photo of your table or a screenshot of one test (no names or faces) as an Image, with the rest in "About your work". If the website was blocked, hand in the paper version: your list of 12 labels, your table and your answers. How it is assessed: Understanding (pre-trained models, the labels a model knows, why its answers can look sure, and gaps in training data); Technical quality (a clear, complete table with expectations written before each test); Responsible use of AI (objects and drawings only, and a fair description of the model\'s limits); Creativity (tests well chosen to find where the model fails).',
          },
          fr: {
            title: 'Tester un modèle d’images déjà entraîné',
            brief:
              'Teste MobileNet, un modèle d’images entraîné par d’autres sur plus d’un million de photos, avec le projet de départ mobilenet de Machine Learning for Kids, et découvre ce qu’il reconnaît, ce qu’il reconnaît à peu près et ce qu’il ne peut pas savoir. Suis la fiche officielle Mobilenet pour les clics. Tu n’entraînes rien et tu n’as besoin d’aucun compte. Teste uniquement des objets et des dessins\u00a0: aucune photo de personne, aucun visage, pas de webcam.',
            requirements:
              'Rends trois choses. 1) Ton tableau de test\u00a0: au moins 8\u00a0tests, dont au moins 5\u00a0objets dans les scènes du projet, un objet dans un cadre serré et dans un cadre large, et 2\u00a0dessins de ta main d’objets qui figurent dans la liste. Pour chaque test\u00a0: ce que tu as testé, l’étiquette que tu attendais (écrite avant le test), l’étiquette donnée, et juste, proche ou faux. 2) Trois objets du quotidien qui figurent dans la liste des étiquettes et trois qui n’y figurent pas, avec une phrase sur ce que le modèle pourrait répondre pour l’un des objets absents. 3) Une lacune des données d’entraînement, expliquée en trois à cinq phrases\u00a0: ce sur quoi le modèle s’est trompé, ce qui manquait dans ses photos d’entraînement, et quelles données d’entraînement, ou quel apprentissage par transfert, pourraient corriger cela. Pour l’envoyer\u00a0: envoie tout sous forme de texte, ou envoie une photo de ton tableau ou une capture d’écran d’un test (sans nom ni visage) sous forme d’image, avec le reste dans «\u00a0À propos de votre travail\u00a0». Si le site était bloqué, rends la version sur papier\u00a0: ta liste de 12\u00a0étiquettes, ton tableau et tes réponses. Critères d’évaluation\u00a0: Compréhension (les modèles préentraînés, les étiquettes que connaît un modèle, pourquoi ses réponses peuvent paraître sûres, et les lacunes des données d’entraînement)\u00a0; Qualité technique (un tableau clair et complet, avec les attentes écrites avant chaque test)\u00a0; Usage responsable de l’IA (uniquement des objets et des dessins, et une description juste des limites du modèle)\u00a0; Créativité (des tests bien choisis pour trouver là où le modèle échoue).',
          },
        },
        allowedSubmissionTypes: ['text', 'image'],
        rubric: [
          { key: 'understanding', weight: 40 },
          { key: 'technicalQuality', weight: 20 },
          { key: 'responsibleAi', weight: 25 },
          { key: 'creativity', weight: 15 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
