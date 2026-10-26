// Module m4 of "Build with Generative AI" (ages 11-14): data, the fuel of AI. It comes after m2
// (prompting) and before m5 (assistants, games and media) and m3 (the creator's code and the
// creator project, which stays last). It builds on m1-l1 (training data, feedback from people
// that teaches a chatbot to follow instructions) and on the "typical choices" point of m1-l2.
// m4-l1: where datasets come from (the web, people who label, sensors and apps), the data
// workers behind the labels, consent, copyright and opt-outs, and how one-sided data makes a
// one-sided model, with an audit of an invented games-chat dataset (a Markdown table with
// unbalanced labels, a sarcastic message labelled friendly, rows copied without consent and a
// row with a name and a class), a challenge_me tutor activity and a check block with the audit's
// key points, after the tutor so that the stages stay in order (as m3-l1's scenario answers do).
// m4-l2: from rules to labelled examples (supervised learning, sentiment classification,
// confidence), why sarcasm, slang, dialects and mixed languages fool a text model (negation is
// met in the opening examples and in the tests), and why that matters for moderation tools
// (false alarms that fall on one dialect, misses, human review and appeals). Then the Machine
// Learning for Kids activity Make me happy (Rends-moi heureux; worksheet-makemehappy.pdf; text;
// Scratch 3; Try it now, no accounts), a paper word-tally version for schools that block the
// site, the hand-in project-m4 (assignment: a screenshot, six test messages with label and
// confidence, one surprising result explained) and the module quiz quiz-m4. A submission has a
// single type and Text sends no attachments, so the requirements say to choose Image and type
// the table in "About your work" (Text only for a paper version with no photo), and Image is
// listed first because the form opens on the first type. m4-l2 has no tutor activity: its 40 minutes go to the
// worksheet, whose teacher's notes estimate 45 (the lesson's tutor panel, where enabled, still helps).
// The worksheet is CC BY-NC-SA 4.0: it is linked, never copied or translated, and the steps
// below are our own framing that defers to it for the clicks. The worksheet asks for the
// cruellest insults a learner can think of; this lesson deliberately asks for mild unkind
// messages addressed to an invented character only, never about real people, and step 4 tells
// learners to skip the worksheet's request at that point. The Scratch drawing is capped at five
// minutes in step 3, since the teacher's notes warn it eats the training time, and step 3 starts
// the worksheet at its Make step (« Faire » in the French interface): its first steps log in and
// create a cloud project, which Try it now replaces. Learners keep the
// worksheet's two label names so that its Scratch steps match. Text projects ask for the
// language of the examples (French is offered), so French learners train in French. A Try it
// now project lasts a few hours and only one can exist at a time, so the hand-in happens in the
// same lesson and the hint says to delete an earlier lesson's project first. The easy and
// Python versions of the worksheet are not used (the Python one needs a project API key).
// Other modules are named, not numbered, in the text ("the creator's code at the end of the
// course"), because the release places this module third. No video block: the one curated
// training-data video (Code.org, x2mRoFNm22g) already serves m3-l1 of this course, and the
// course covers its 'watch' stage in m1.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m4: SeedModulePart = {
  module: {
    id: 'm4',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Data: the fuel of AI',
          description:
            'Where training data comes from, who labels it, consent and copyright, and how data shapes what a model gets right and wrong. Then train a model of your own to spot kindness, and test where it gets confused.',
        },
        fr: {
          title: 'Les données, carburant de l’IA',
          description:
            'D’où viennent les données d’entraînement, qui les étiquette, le consentement et le droit d’auteur, et comment les données influencent ce qu’un modèle réussit et rate. Puis entraîne ton propre modèle à repérer la gentillesse, et teste les cas où il se trompe.',
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
              title: 'Where training data comes from',
              summary:
                'The web, people who label and sensors: where datasets come from, consent and copyright, and how one-sided data makes one-sided AI. With a dataset audit.',
            },
            fr: {
              title: 'D’où viennent les données d’entraînement\u00a0?',
              summary:
                'Le web, les personnes qui étiquettent et les capteurs\u00a0: d’où viennent les jeux de données, le consentement et le droit d’auteur, et pourquoi des données déséquilibrées donnent une IA déséquilibrée. Avec un audit de jeu de données.',
            },
          },
          estimatedMinutes: 25,
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
                heading: 'Who taught the AI?',
                body: 'Every AI in this course learned from data: the text generator you met at the start of the course analysed an enormous amount of text, and image generators studied hundreds of millions of captioned pictures.\n\nWhere did it all come from? Websites, books and forums. People paid to sort, tag and rate things. Cameras, microphones and sensors. Maybe even people like you: a public review, a forum post, a photo with a caption.\n\nDid anyone ask them? Is the data fair to everyone? Does it contain mistakes? The answers shape everything a model gets right and wrong, because **a model can only learn what is in its data**.',
              },
              fr: {
                heading: 'Qui a tout appris à l’IA\u00a0?',
                body: 'Toutes les IA de ce cours ont appris à partir de données\u00a0: le générateur de texte découvert au début du cours a analysé une quantité énorme de textes, et les générateurs d’images ont étudié des centaines de millions d’images légendées.\n\nD’où viennent toutes ces données\u00a0? De sites web, de livres et de forums. De personnes payées pour trier, étiqueter et noter des contenus. De caméras, de micros et de capteurs. Et peut-être de gens comme toi\u00a0: un avis publié en ligne, un message sur un forum, une photo avec une légende.\n\nQuelqu’un leur a-t-il demandé leur avis\u00a0? Ces données sont-elles équitables pour tout le monde\u00a0? Contiennent-elles des erreurs\u00a0? Les réponses influencent tout ce qu’un modèle réussit et rate, car **un modèle ne peut apprendre que ce qui se trouve dans ses données**.',
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
                heading: 'Three sources of data, and the people behind them',
                body: 'A **dataset** is a collection of examples used to train a model. Most training data comes from three places:\n\n| Source | Examples | Watch out for |\n|---|---|---|\n| **The web** | Web pages, forums, public posts and captioned pictures, copied by programs called **web crawlers** | Work copied without asking; mistakes and stereotypes copied along with the rest |\n| **People who label** | Tagging photos ("cat", "bike"), drawing boxes around cars, rating a chatbot\'s answers | Rushed or unsure labellers make mistakes |\n| **Sensors and apps** | Car cameras, voice assistant microphones, step counters, clicks and likes | Personal data, sometimes collected without people noticing |\n\n**Labelling is a huge job.** The feedback from people that teaches a chatbot to follow instructions is labelling too. Much of it is done by data workers around the world, often paid per small task. Some have reported very low pay, and some have had to look at upsetting content so that a model learns to avoid it.\n\n**A label is a decision**, and people do not always agree: is *"Nice try"* kind or mocking? Careful teams write clear labelling rules and ask several people to label the same example.',
              },
              fr: {
                heading: 'Trois sources de données, et les personnes qui sont derrière',
                body: 'Un **jeu de données** (*dataset*) est une collection d’exemples qui sert à entraîner un modèle. La plupart des données d’entraînement viennent de trois sources\u00a0:\n\n| Source | Exemples | Points de vigilance |\n|---|---|---|\n| **Le web** | Pages web, forums, publications publiques et images légendées, copiés par des programmes appelés **robots d’indexation** (*crawlers*) | Des œuvres copiées sans autorisation\u00a0; des erreurs et des stéréotypes copiés avec le reste |\n| **Des personnes qui étiquettent** | Indiquer ce que montre une photo («\u00a0chat\u00a0», «\u00a0vélo\u00a0»), entourer les voitures d’un cadre, noter les réponses d’un chatbot | Une personne pressée ou hésitante peut se tromper |\n| **Des capteurs et des applis** | Caméras de voitures, micros d’assistants vocaux, podomètres, clics et «\u00a0j’aime\u00a0» | Des données personnelles, parfois collectées sans que les gens s’en rendent compte |\n\n**Étiqueter, c’est un travail immense.** Les retours de personnes qui apprennent à un chatbot à suivre les instructions, c’est aussi de l’étiquetage. Une grande partie de ce travail est faite par des «\u00a0travailleurs du clic\u00a0», partout dans le monde, souvent payés à la tâche pour de toutes petites missions. Certains ont dénoncé une rémunération très faible, et d’autres ont dû regarder des contenus choquants pour que le modèle apprenne à les éviter.\n\n**Une étiquette est une décision**, et les gens ne sont pas toujours d’accord\u00a0: *«\u00a0Bien essayé\u00a0»*, est-ce gentil ou moqueur\u00a0? Les équipes sérieuses rédigent des règles d’étiquetage claires et demandent à plusieurs personnes d’étiqueter le même exemple.',
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
                heading: 'Consent, copyright and gaps',
                body: '**Consent: did they agree?** *Public* is not the same as *permitted*: most people who posted a photo, a review or a drawing online never imagined it would become training data. Privacy laws such as the GDPR in the European Union give people rights over their personal data, and careful dataset builders remove names, faces and addresses.\n\n**Copyright: whose work is it?** Books, songs, photos and artworks usually belong to the people who made them. Whether AI companies may train on them without asking is being argued in courts and parliaments in several countries; some companies now pay for licences or let creators refuse (an **opt-out**). More on this, from the creator\'s side, in the creator\'s code at the end of the course.\n\n**Gaps and bias: who is missing?** One-sided data makes a one-sided model:\n\n- **Unbalanced labels.** With 90 kind messages and 10 unkind ones, "kind" becomes a safe guess for almost everything.\n- **Missing people.** A voice assistant trained mostly on adult voices from one region can misunderstand children or other accents.\n- **Missing situations, old data.** A photo app trained on daytime pictures may fail at night, and a dataset does not update itself when slang changes.\n- **Wrong labels.** Label sarcasm "kind" and the model learns that sarcasm is kind.\n\nFirst question to ask about any AI: **what was it trained on, and who or what is missing?**',
              },
              fr: {
                heading: 'Consentement, droit d’auteur et lacunes',
                body: '**Le consentement\u00a0: étaient-ils d’accord\u00a0?** *Public* ne veut pas dire *autorisé*\u00a0: la plupart des personnes qui ont publié une photo, un avis ou un dessin en ligne n’imaginaient pas que leur publication deviendrait des données d’entraînement. Des lois sur la vie privée, comme le RGPD dans l’Union européenne, donnent aux personnes des droits sur leurs données personnelles, et les équipes sérieuses retirent de leurs jeux de données les noms, les visages et les adresses.\n\n**Le droit d’auteur\u00a0: à qui appartient l’œuvre\u00a0?** Les livres, les chansons, les photos et les œuvres d’art appartiennent en général à celles et ceux qui les ont créés. Les entreprises d’IA peuvent-elles s’en servir pour l’entraînement sans demander\u00a0? La question est débattue devant les tribunaux et dans les parlements de plusieurs pays\u00a0; certaines entreprises paient désormais des licences ou permettent aux créateurs de refuser (on parle d’**opposition**, ou *opt-out*). Tu retrouveras ce sujet, du point de vue du créateur, dans le code du créateur à la fin du cours.\n\n**Les lacunes et les biais\u00a0: qui manque\u00a0?** Des données déséquilibrées donnent un modèle déséquilibré\u00a0:\n\n- **Des étiquettes déséquilibrées.** Avec 90 messages gentils et 10 méchants, «\u00a0gentil\u00a0» devient une réponse sans risque pour presque tout.\n- **Des personnes absentes.** Un assistant vocal entraîné surtout avec des voix d’adultes d’une seule région peut mal comprendre les enfants ou d’autres accents.\n- **Des situations absentes, des données périmées.** Une appli photo entraînée sur des images prises de jour peut échouer la nuit, et un jeu de données ne se met pas à jour tout seul quand l’argot change.\n- **Des étiquettes fausses.** Étiquette le sarcasme «\u00a0gentil\u00a0», et le modèle apprend que le sarcasme est gentil.\n\nLa première question à poser sur n’importe quelle IA\u00a0: **sur quoi a-t-elle été entraînée, et qui ou quoi manque\u00a0?**',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: audit a dataset',
                body: 'A games website wants a tool that sorts chat messages into **friendly** and **unfriendly**, so that a human moderator can check the unfriendly ones. Audit the start of its training data.\n\n| # | Message | Label | Where it came from |\n|---|---|---|---|\n| 1 | Great game, well played! | friendly | written by the team |\n| 2 | Nice move, you\'re really good at this | friendly | written by the team |\n| 3 | Thanks for the match, see you next round | friendly | written by the team |\n| 4 | Amazing teamwork today! | friendly | written by the team |\n| 5 | Well played, everyone | friendly | written by the team |\n| 6 | You are so bad at this game | unfriendly | written by the team |\n| 7 | Oh brilliant, you lost us the match again | friendly | copied from comments under a video, without asking |\n| 8 | GG Sam from 7B, see you at school tomorrow! | friendly | copied from a player\'s chat, without asking |\n\n1. **Count.** How many examples per label? What will the model tend to guess?\n2. **Check the labels.** Which message has the wrong label, and why might a labeller have missed it?\n3. **Look for gaps.** Which kinds of messages that real players send are missing? Find at least three.\n4. **Check consent and privacy.** Which rows should not be in the dataset as they are, and why?\n5. **Fix it.** Write three rules for the team, such as *"About as many unfriendly examples as friendly ones"*, and two new rows that fill a gap.\n\nKeep your audit: in the next lesson you will build a dataset of your own and avoid these traps.',
              },
              fr: {
                heading: 'À toi\u00a0: audite un jeu de données',
                body: 'Un site de jeux en ligne veut un outil qui trie les messages envoyés pendant les parties en **sympa** et **pas sympa**, pour qu’un modérateur humain vérifie les messages pas sympa. Audite le début de ses données d’entraînement.\n\n| N° | Message | Étiquette | Provenance |\n|---|---|---|---|\n| 1 | Super partie, bien joué\u00a0! | sympa | écrit par l’équipe |\n| 2 | Joli coup, t’es vraiment fort | sympa | écrit par l’équipe |\n| 3 | Merci pour la partie, à la prochaine | sympa | écrit par l’équipe |\n| 4 | Super travail d’équipe aujourd’hui\u00a0! | sympa | écrit par l’équipe |\n| 5 | Bien joué, tout le monde | sympa | écrit par l’équipe |\n| 6 | T’es vraiment nul à ce jeu | pas sympa | écrit par l’équipe |\n| 7 | Bravo, génial, tu nous as encore fait perdre | sympa | copié dans les commentaires d’une vidéo, sans demander |\n| 8 | GG Sam de 5e B, à demain au collège\u00a0! | sympa | copié dans la discussion d’un joueur, sans demander |\n\n1. **Compte.** Combien d’exemples par étiquette\u00a0? Qu’est-ce que le modèle aura tendance à répondre\u00a0?\n2. **Vérifie les étiquettes.** Quel message a une mauvaise étiquette, et pourquoi la personne qui l’a étiqueté a-t-elle pu se tromper\u00a0?\n3. **Cherche les lacunes.** Quels types de messages, envoyés par de vrais joueurs, manquent dans ce jeu de données\u00a0? Trouves-en au moins trois.\n4. **Vérifie le consentement et la vie privée.** Quelles lignes ne devraient pas figurer telles quelles dans le jeu de données, et pourquoi\u00a0?\n5. **Corrige.** Écris trois règles pour l’équipe, par exemple *«\u00a0À peu près autant d’exemples pas sympa que d’exemples sympa\u00a0»*, et deux nouvelles lignes qui comblent une lacune.\n\nGarde ton audit\u00a0: dans la prochaine leçon, tu vas construire ton propre jeu de données et éviter ces pièges.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor for a data-detective challenge: an invented AI tool and its training data, with one hidden problem. Find it, explain what the tool would get wrong because of it and suggest a fix. Then ask for a harder one.',
                starterPrompt:
                  'Give me a data-detective challenge: an invented AI tool and the dataset it was trained on, with one hidden problem (a gap, unbalanced or wrong labels, or a consent or copyright issue). Do not give me the answer: I will find the problem and suggest a fix, then tell me how I did.',
              },
              fr: {
                instructions:
                  'Demande au tuteur IA un défi de détective des données\u00a0: un outil d’IA inventé et ses données d’entraînement, avec un problème caché. Trouve-le, explique ce que l’outil raterait à cause de lui et propose une solution. Ensuite, demande un défi plus difficile.',
                starterPrompt:
                  'Lance-moi un défi de détective des données\u00a0: un outil d’IA inventé et le jeu de données sur lequel il a été entraîné, avec un problème caché (une lacune, des étiquettes déséquilibrées ou fausses, ou un souci de consentement ou de droit d’auteur). Ne me donne pas la réponse\u00a0: je vais trouver le problème et proposer une solution, puis tu me diras si j’ai réussi.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm4-l1-b6',
            type: RICH,
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Check your audit',
                body: 'Finished the audit above? Compare with these points.\n\n1. **Count.** Seven friendly, one unfriendly: the model will tend to guess *friendly* for almost everything.\n2. **Labels.** Row 7 is sarcastic: positive words, unkind meaning. A hurried labeller sees *brilliant* and picks *friendly*.\n3. **Gaps.** For example: slang, emojis, spelling mistakes, other languages, long messages, players of different ages, and messages about the game rather than a player (*This level is impossible!*).\n4. **Consent and privacy.** Rows 7 and 8 were copied without asking, so they should come out: the team can write its own messages like them instead. Row 8 also gives a name, a class and where the player will be tomorrow.\n5. **Fixes.** Your rules and new rows are your own: they work if each one fixes a real problem you found.',
              },
              fr: {
                heading: 'Vérifie ton audit',
                body: 'Tu as terminé l’audit plus haut\u00a0? Compare avec ces points.\n\n1. **Compte.** Sept messages sympa, un seul pas sympa\u00a0: le modèle aura tendance à répondre *sympa* pour presque tout.\n2. **Étiquettes.** Le message\u00a07 est sarcastique\u00a0: des mots positifs, un sens qui ne l’est pas. Une personne pressée voit *génial* et choisit *sympa*.\n3. **Lacunes.** Par exemple\u00a0: l’argot, les emojis, les fautes d’orthographe, les autres langues, les messages longs, les joueurs de différents âges, et les messages sur le jeu plutôt que sur un joueur (*Ce niveau est impossible\u00a0!*).\n4. **Consentement et vie privée.** Les lignes\u00a07 et\u00a08 ont été copiées sans demander\u00a0: il faut les retirer, et l’équipe peut écrire elle-même des messages du même genre. La ligne\u00a08 donne en plus un prénom, une classe et l’endroit où sera le joueur le lendemain.\n5. **Corrections.** Tes règles et tes nouvelles lignes t’appartiennent\u00a0: elles sont bonnes si chacune corrige un vrai problème que tu as trouvé.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Think of an AI tool you use or know: a voice assistant, a translation app, a photo filter, a video recommender... Whose voices, languages or situations might be missing from its training data, and what could go wrong for those people?',
              },
              fr: {
                prompt:
                  'Pense à un outil d’IA que tu utilises ou que tu connais\u00a0: un assistant vocal, une appli de traduction, un filtre photo, des recommandations de vidéos… Quelles voix, quelles langues ou quelles situations pourraient manquer dans ses données d’entraînement, et qu’est-ce qui pourrait mal se passer pour les personnes concernées\u00a0?',
              },
            },
            data: { minLength: 80 },
          },
        ],
      },
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Teach a computer to spot kindness',
              summary:
                'Train a model that sorts kind and unkind messages, connect it to a Scratch character, and find out why sarcasm, slang and dialects fool it, and why that matters for moderation.',
            },
            fr: {
              title: 'Apprends à un ordinateur à repérer la gentillesse',
              summary:
                'Entraîne un modèle qui trie les messages gentils et pas gentils, relie-le à un personnage Scratch, et découvre pourquoi le sarcasme, l’argot et les dialectes le piègent, et pourquoi c’est important pour la modération.',
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
                heading: 'Kind, unkind or... it depends?',
                body: "Is each of these messages to a game character kind or unkind?\n\n1. *You're the best robot ever!*\n2. *Oh great, you dropped it again. Brilliant.*\n3. *That jump was sick!*\n4. *You're not bad at all.*\n\nEasy for you. The first is kind. The second is **sarcastic**: positive words, unkind meaning. The third is **slang**: here, *sick* means amazing. The fourth contains *bad*, but *not* turns it into a compliment. For a computer, each one is a puzzle.\n\nIn this lesson you will train a model to tell kind messages from unkind ones, connect it to a Scratch character that smiles or looks sad, then test it like a scientist to find where it gets confused.",
              },
              fr: {
                heading: 'Gentil, pas gentil… ou ça dépend\u00a0?',
                body: 'Chacun de ces messages adressés à un personnage de jeu est-il gentil ou pas gentil\u00a0?\n\n1. *T’es le meilleur robot du monde\u00a0!*\n2. *Oh génial, tu l’as encore fait tomber. Bravo.*\n3. *Ce saut, il déchire\u00a0!*\n4. *T’es pas mauvais du tout.*\n\nFacile pour toi. Le premier est gentil. Le deuxième est **sarcastique**\u00a0: des mots positifs, un sens qui ne l’est pas. Le troisième est de l’**argot**\u00a0: ici, *il déchire* veut dire «\u00a0il est génial\u00a0». Le quatrième contient *mauvais*, mais *pas* en fait un compliment. Pour un ordinateur, chacun est une énigme.\n\nDans cette leçon, tu vas entraîner un modèle à distinguer les messages gentils des messages pas gentils, le relier à un personnage Scratch qui sourit ou prend un air triste, puis le tester comme un scientifique pour trouver où il se trompe.',
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
                heading: 'From rules to examples',
                body: '**The rules way.** You could give the character rules: *if the message contains "best", smile; if it contains "bad", look sad.* But message 4 contains *bad*, so the character would look sad, and no list of rules can cover every message people send.\n\n**The examples way.** Instead, you give the computer **labelled examples**: messages sorted into groups called **labels**, such as *kind* and *unkind*. During **training**, the model looks for patterns that tell the groups apart, such as which words tend to come with each label. Learning from examples that come with the right answer is **supervised learning**; sorting text by the feeling it expresses is **sentiment classification**.\n\nGive the trained model a new message and it answers with a label and a **confidence** score from 0 to 100: how strongly the message matches what it learned for that label. That is not a promise: a model can be 90% confident and wrong.\n\nUnlike the generators earlier in the course, a classifier **sorts**; it creates nothing new. But it too can only learn what is in its examples.',
              },
              fr: {
                heading: 'Des règles aux exemples',
                body: '**Avec des règles.** Tu pourrais donner des règles au personnage\u00a0: *si le message contient «\u00a0meilleur\u00a0», sourire\u00a0; s’il contient «\u00a0mauvais\u00a0», prendre un air triste.* Mais le message\u00a04 contient *mauvais*, donc le personnage deviendrait triste, et aucune liste de règles ne peut prévoir tous les messages.\n\n**Avec des exemples.** À la place, tu donnes à l’ordinateur des **exemples étiquetés**\u00a0: des messages triés en groupes appelés **étiquettes** (*labels*), par exemple *gentil* et *pas gentil*. Pendant l’**entraînement**, le modèle cherche des régularités qui distinguent les groupes, comme les mots qui accompagnent souvent chaque étiquette. Apprendre à partir d’exemples accompagnés de la bonne réponse, c’est l’**apprentissage supervisé**\u00a0; trier des textes selon le sentiment qu’ils expriment, c’est la **classification de sentiments**.\n\nDonne un nouveau message au modèle entraîné\u00a0: il répond par une étiquette et un score de **confiance** entre 0 et 100, qui indique à quel point le message correspond à ce qu’il a appris pour cette étiquette. Ce n’est pas une garantie\u00a0: un modèle peut être sûr à 90\u00a0% et se tromper.\n\nContrairement aux générateurs vus plus tôt dans le cours, un classifieur **trie**\u00a0; il ne crée rien. Mais lui aussi ne peut apprendre que ce qui se trouve dans ses exemples.',
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
                heading: 'Why sarcasm, slang and dialects fool it',
                body: 'People read a message with much more than its words: a tone of voice, a face, what just happened. A text model only has the words and the patterns from its examples, so some messages fool it:\n\n| Tricky message | Why it is hard |\n|---|---|\n| **Sarcasm**: *Oh great, you broke it again.* | Positive words, unkind meaning: the model sees *great* |\n| **Slang**: *That trick was sick!* | A word that sounds bad is used as praise |\n| **Dialects and mixed languages** | A regional way of speaking, or French, English and Arabic in one message, may match none of its patterns |\n\n**Why it matters: moderation tools.** Many games, apps and websites use classifiers like yours, trained on far more data, to spot hurtful messages: there are too many for people to read. They make the same kinds of mistakes:\n\n- a **false alarm** hides a friendly message. Researchers have found tools that flagged messages written in some dialects as offensive more often than others: a whole group of people treated unfairly;\n- a **miss** lets a hurtful message through, for example an insult hidden behind sarcasm or odd spelling.\n\nThat is why good moderation adds human moderators, lets people appeal and keeps improving the training data, with examples labelled by people who know how each community talks. If a message online ever hurts you or someone else, report it and tell a trusted adult.',
              },
              fr: {
                heading: 'Pourquoi le sarcasme, l’argot et les dialectes le piègent',
                body: 'Pour comprendre un message, les gens utilisent bien plus que ses mots\u00a0: un ton de voix, un visage, ce qui vient de se passer. Un modèle de texte n’a que les mots et les régularités de ses exemples\u00a0: certains messages le piègent donc.\n\n| Message piège | Pourquoi c’est difficile |\n|---|---|\n| **Sarcasme**\u00a0: *Oh génial, tu l’as encore cassé.* | Des mots positifs, un sens pas gentil\u00a0: le modèle voit *génial* |\n| **Argot**\u00a0: *Ce saut, il déchire\u00a0!* | Un mot qui a l’air négatif sert de compliment |\n| **Dialectes et mélanges de langues** | Une façon de parler régionale, ou du français, de l’anglais et de l’arabe dans le même message, peut ne correspondre à aucune de ses régularités |\n\n**Pourquoi c’est important\u00a0: les outils de modération.** Beaucoup de jeux, d’applis et de sites utilisent des classifieurs comme le tien, entraînés sur bien plus de données, pour repérer les messages blessants\u00a0: il y en a trop pour que des personnes les lisent. Ils font le même genre d’erreurs\u00a0:\n\n- une **fausse alerte** masque un message amical. Des chercheurs ont découvert des outils qui signalaient comme insultants les messages écrits dans certains dialectes plus souvent que les autres\u00a0: tout un groupe de personnes traité injustement\u00a0;\n- un **raté** laisse passer un message blessant, par exemple une insulte cachée derrière du sarcasme ou une orthographe bizarre.\n\nUne bonne modération ajoute donc des modérateurs humains, permet de contester une décision et améliore sans cesse les données d’entraînement, avec des exemples étiquetés par des personnes qui connaissent la façon de parler de chaque communauté. Si un jour un message en ligne te blesse, ou blesse quelqu’un d’autre, signale-le et parles-en à un adulte de confiance.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b4',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Make me happy: kind words, happy face',
                instructions:
                  "**Goal:** teach a model the difference between kind and unkind messages, then let it decide whether a Scratch character you design smiles or looks sad. The big idea: a computer can learn from examples to recognise the feeling in a message, and its mistakes show what its examples were missing.\n\n**Rules for your examples:** every message speaks to your invented character, never to or about a real person: no names of classmates, teachers or famous people, nothing about anyone's looks, family, religion or background. Keep the unkind ones mild, like a grumpy cartoon character: *Your jokes are boring.*\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**: no account, no name.\n2. Create a project called *Make me happy* that recognises **text**, in the language of your messages.\n3. Invent your character (a robot, an alien, a cat...) with a made-up name. Open your project and follow the official worksheet (PDF) from the step where you click **Make** to open Scratch: skip the steps before it (logging in, creating a project), as Try it now did those. Draw a simple face (five minutes at most: the training and the tests matter more) and give your character a few rules first. Try a message your rules did not expect.\n4. In **Train**, add the worksheet's two labels, so that its Scratch steps match. Type at least **eight examples of your own** for each label, about the same number for both: short and long ones, said in different ways. Here the worksheet asks for the nastiest insults you can invent: skip that and keep yours mild, as in the rules above.\n5. In **Learn & Test**, train the model, then test it with **six new messages**: two easy ones, one sarcastic, one with slang, one with *not* and one of your choice. Note the label and the confidence of each.\n6. Back in Scratch, follow the worksheet to swap your rules for your model, and test your character again.\n7. Take a screenshot of your character reacting or of your test results.",
                bringBack:
                  'For the project below: a screenshot, a table of your six test messages with the label and the confidence of each, and one surprising result explained.',
                hint: 'Low confidence or many mistakes? Add more varied examples to both labels, keeping the numbers close, and train again. Short of time? Do the training and the six tests first: they are the heart of your hand-in. Try it now keeps one project at a time: delete any project left from an earlier lesson once its work is handed in.',
              },
              fr: {
                title: 'Rends-moi heureux\u00a0: mots gentils, visage souriant',
                instructions:
                  '**Objectif\u00a0:** apprendre à un modèle à distinguer les messages gentils des messages pas gentils, puis le laisser décider si un personnage Scratch que tu dessines sourit ou prend un air triste. La grande idée\u00a0: un ordinateur peut apprendre, à partir d’exemples, à reconnaître le sentiment exprimé par un message, et ses erreurs montrent ce qui manquait dans ses exemples.\n\n**Règles pour tes exemples\u00a0:** chaque message s’adresse à ton personnage inventé et ne vise ni ne mentionne aucune personne réelle\u00a0: aucun nom de camarade, d’enseignant ou de célébrité, rien sur l’apparence, la famille, la religion ou les origines de qui que ce soit. Tes messages pas gentils doivent rester légers, comme ceux d’un personnage de dessin animé grognon\u00a0: *Tes blagues sont nulles.*\n\n1. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*)\u00a0: pas de compte, pas de nom.\n2. Crée un projet appelé *Rends-moi heureux* qui reconnaît du **texte**, dans la langue de tes messages (*French* pour le français).\n3. Invente ton personnage (un robot, un extraterrestre, un chat…) avec un nom imaginaire. Ouvre ton projet et suis la fiche officielle (PDF) à partir de l’étape où tu cliques sur **Faire** (*Make*) pour ouvrir Scratch\u00a0: saute les étapes d’avant (connexion, création du projet), «\u00a0Essayer maintenant\u00a0» s’en est chargé. Dessine un visage simple (cinq minutes au plus\u00a0: l’entraînement et les tests comptent davantage) et donne d’abord quelques règles à ton personnage. Essaie un message que tes règles n’avaient pas prévu.\n4. Dans **Entraîner** (*Train*), ajoute les deux étiquettes de la fiche, pour que ses étapes Scratch correspondent. Écris au moins **huit exemples de ton invention** pour chacune\u00a0: à peu près autant des deux côtés, courts et longs, formulés de façons différentes. Ici, la fiche demande les pires insultes possibles\u00a0: ne la suis pas sur ce point et garde des exemples légers, comme dans les règles plus haut.\n5. Dans **Apprendre & Tester** (*Learn & Test*), entraîne le modèle, puis teste-le avec **six nouveaux messages**\u00a0: deux faciles, un sarcastique, un en argot, un avec une négation (*pas*) et un de ton choix. Note l’étiquette et la confiance de chacun.\n6. De retour dans Scratch, suis la fiche pour remplacer tes règles par ton modèle, puis teste à nouveau ton personnage.\n7. Fais une capture d’écran de ton personnage en train de réagir ou de tes résultats de test.',
                bringBack:
                  'Pour le projet ci-dessous\u00a0: une capture d’écran, un tableau de tes six messages de test avec l’étiquette et la confiance de chacun, et un résultat surprenant expliqué.',
                hint: 'Confiance faible ou beaucoup d’erreurs\u00a0? Ajoute des exemples plus variés aux deux étiquettes, en gardant des nombres proches, et entraîne à nouveau le modèle. Pas assez de temps\u00a0? Fais d’abord l’entraînement et les six tests\u00a0: c’est le cœur de ton travail à rendre. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: supprime celui d’une leçon précédente, une fois son travail rendu.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-makemehappy.pdf',
              projectType: 'text',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm4-l2-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Be the model on paper',
                body: 'Site blocked at your school? Try the same idea on paper with a partner.\n\n1. On cards, write **six kind** and **six mildly unkind** messages to your invented character, with the label on the back.\n2. Your partner plays the computer and tallies how many times each word appears on kind cards and on unkind cards, skipping tiny words such as *the* or *a* but keeping *not*.\n3. Write **six new test messages**, including one sarcastic, one with slang and one with *not*. For each, the computer adds up the kind and unkind points of its words. The bigger total wins, and confidence = winning points ÷ all points × 100: 6 kind points and 2 unkind points give *kind, 75%*. No points, or a tie? The answer is *not sure*.\n4. Record each test: message, label, confidence, right or wrong.\n5. Swap roles. Which message fooled the tally? Which example would have helped?\n\nReal models are far more advanced, but they too learn from word patterns in their examples. For the project, type your table or photograph your cards (no names or faces).',
              },
              fr: {
                heading: 'Pas de site\u00a0? Joue le modèle sur papier',
                body: 'Site bloqué dans ton école\u00a0? Fais la même activité sur papier avec un camarade.\n\n1. Sur des cartes, écris **six messages gentils** et **six messages pas gentils, mais légers**, adressés à ton personnage inventé, avec l’étiquette au dos.\n2. Ton camarade joue l’ordinateur et compte combien de fois chaque mot apparaît sur les cartes «\u00a0gentil\u00a0» et sur les cartes «\u00a0pas gentil\u00a0», sans les tout petits mots comme *le* ou *un*, mais en gardant *pas*.\n3. Écris **six nouveaux messages de test**, dont un sarcastique, un en argot et un avec *pas*. Pour chacun, l’ordinateur additionne les points «\u00a0gentil\u00a0» et «\u00a0pas gentil\u00a0» de ses mots. Le plus grand total gagne, et la confiance = points gagnants ÷ total des points × 100\u00a0: 6 points «\u00a0gentil\u00a0» et 2 points «\u00a0pas gentil\u00a0» donnent *gentil, 75\u00a0%*. Aucun point, ou égalité\u00a0? La réponse est *pas sûr*.\n4. Note chaque test\u00a0: message, étiquette, confiance, juste ou faux.\n5. Échangez les rôles. Quel message a piégé le comptage\u00a0? Quel exemple aurait aidé\u00a0?\n\nLes vrais modèles sont bien plus perfectionnés, mais eux aussi apprennent à partir des régularités des mots de leurs exemples. Pour le projet, tape ton tableau ou photographie tes cartes (sans nom ni visage).',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b6',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your test report here, during this lesson: a Try it now project does not last. Read the requirements first, and check that your screenshot shows no names or personal details.',
              },
              fr: {
                intro:
                  'Rends ton rapport de test ici, pendant cette leçon\u00a0: un projet «\u00a0Essayer maintenant\u00a0» ne dure pas. Lis d’abord les consignes, et vérifie que ta capture d’écran ne montre ni nom ni information personnelle.',
              },
            },
            data: { projectId: 'project-m4' },
          },
          {
            id: 'm4-l2-b7',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about training data, labels and teaching a computer to recognise feelings in text.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur les données d’entraînement, les étiquettes et la façon d’apprendre à un ordinateur à reconnaître les sentiments dans un texte.',
              },
            },
            data: { quizId: 'quiz-m4' },
          },
          {
            id: 'm4-l2-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Many apps let an automatic tool decide which messages to hide. After testing your own model, would you let a tool like it moderate a chat for people your age on its own? Explain, using one result from your tests and one idea about training data.',
              },
              fr: {
                prompt:
                  'Beaucoup d’applis laissent un outil automatique décider quels messages masquer. Après avoir testé ton propre modèle, laisserais-tu un outil de ce genre modérer seul une discussion entre jeunes de ton âge\u00a0? Explique ta réponse à l’aide d’un résultat de tes tests et d’une idée sur les données d’entraînement.',
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
      id: 'quiz-m4',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Data: the fuel of AI',
            instructions:
              'Seven questions about training data, labels and sentiment classification. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Les données, carburant de l’IA',
            instructions:
              'Sept questions sur les données d’entraînement, les étiquettes et la classification de sentiments. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'A plant-identifying app was trained only on photos taken in summer, in sunny gardens in one country. What is the most likely result?',
              },
              fr: {
                prompt:
                  'Une appli qui reconnaît les plantes a été entraînée uniquement avec des photos prises en été, dans des jardins ensoleillés d’un seul pays. Quel est le résultat le plus probable\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'It works equally well everywhere, because it has seen so many photos',
                  },
                  fr: {
                    text: 'Elle fonctionne aussi bien partout, puisqu’elle a vu énormément de photos',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'It makes more mistakes on photos taken in the shade, in winter, or of plants from other regions',
                  },
                  fr: {
                    text: 'Elle se trompe plus souvent sur des photos prises à l’ombre, en hiver, ou de plantes d’autres régions',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It refuses every photo taken on a cloudy day' },
                  fr: {
                    text: 'Elle refuse toutes les photos prises par temps nuageux',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'It learns new plants on its own, without any new data' },
                  fr: {
                    text: 'Elle apprend toute seule de nouvelles plantes, sans nouvelles données',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A model learns what is in its data. Shade, winter and plants from other regions were missing from its training photos, so that is where it is most likely to go wrong.',
              },
              fr: {
                text: 'Un modèle apprend ce qui se trouve dans ses données. L’ombre, l’hiver et les plantes d’autres régions manquaient dans ses photos d’entraînement\u00a0: c’est là qu’il risque le plus de se tromper.',
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
                  'If a photo or a text is publicly visible online, the person who made it has agreed to it being used to train AI.',
              },
              fr: {
                prompt:
                  'Si une photo ou un texte est visible publiquement en ligne, la personne qui l’a créé a accepté qu’il serve à entraîner une IA.',
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
                text: "False. Public is not the same as permitted. Most people never imagined their posts would become training data, and whether companies may use people's work without asking is still being argued in several countries.",
              },
              fr: {
                text: 'Faux. Public ne veut pas dire autorisé. La plupart des gens n’imaginaient pas que leurs publications deviendraient des données d’entraînement, et le droit des entreprises à utiliser le travail des autres sans demander fait encore débat dans plusieurs pays.',
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
                  'You are building a dataset of kind and unkind messages for your character. Which choices make it better? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Tu construis un jeu de données de messages gentils et pas gentils pour ton personnage. Quels choix l’améliorent\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'About the same number of examples for each label' },
                  fr: { text: 'À peu près le même nombre d’exemples pour chaque étiquette' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Short and long messages, written in different ways' },
                  fr: { text: 'Des messages courts et longs, formulés de façons différentes' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Asking a second person to check your labels' },
                  fr: { text: 'Demander à une deuxième personne de vérifier tes étiquettes' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Adding the names of real classmates to make it realistic' },
                  fr: { text: 'Ajouter les noms de vrais camarades pour faire plus réaliste' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Copying comments from a video site without asking' },
                  fr: { text: 'Copier des commentaires d’un site de vidéos sans demander' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "Balance, variety and checked labels make a better dataset. Real names put people's privacy at risk, and copying other people's comments without asking ignores their consent.",
              },
              fr: {
                text: 'L’équilibre, la variété et des étiquettes vérifiées donnent un meilleur jeu de données. Les vrais noms portent atteinte à la vie privée, et copier les commentaires des autres sans demander ne respecte pas leur consentement.',
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
                  'Your model labels "Oh brilliant, you broke it again" as kind, with 80% confidence. What is the best explanation?',
              },
              fr: {
                prompt:
                  'Ton modèle classe «\u00a0Oh génial, tu l’as encore cassé\u00a0» comme gentil, avec une confiance de 80\u00a0%. Quelle est la meilleure explication\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Words like "brilliant" appeared in its kind examples, and it cannot hear the sarcastic tone',
                  },
                  fr: {
                    text: 'Des mots comme «\u00a0génial\u00a0» figuraient dans ses exemples gentils, et il ne perçoit pas le ton sarcastique',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The model decided to be polite' },
                  fr: { text: 'Le modèle a décidé d’être poli' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The model has a sense of humour' },
                  fr: { text: 'Le modèle a le sens de l’humour' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '80% confidence proves that the message is kind' },
                  fr: { text: 'Une confiance de 80\u00a0% prouve que le message est gentil' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A text model only sees the words and the patterns it learned. Sarcasm uses positive words with a negative meaning, so it often fools the model, however confident it looks.',
              },
              fr: {
                text: 'Un modèle de texte ne voit que les mots et les régularités qu’il a apprises. Le sarcasme utilise des mots positifs avec un sens négatif\u00a0: il piège souvent le modèle, même quand celui-ci a l’air sûr de lui.',
              },
            },
          },
          {
            id: 'q5',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'What do we call machine learning from examples that come with the right answer, such as messages labelled kind or unkind? (two words)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on l’apprentissage automatique à partir d’exemples accompagnés de la bonne réponse, comme des messages étiquetés gentil ou pas gentil\u00a0? (deux mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'supervised learning',
                'supervised',
                'supervised machine learning',
                'supervised training',
                'supervised ml',
                'supervised-learning',
                'supervized learning',
                'supervise learning',
              ],
              fr: [
                'apprentissage supervisé',
                'l’apprentissage supervisé',
                "l'apprentissage supervisé",
                'un apprentissage supervisé',
                'supervisé',
                'apprentissage supervisée',
                'apprentissage automatique supervisé',
                'apprentissage machine supervisé',
                'entraînement supervisé',
                'supervised learning',
              ],
            },
            explanation: {
              en: {
                text: 'Supervised learning: the right answers (the labels) supervise the training. That is how your kindness model learned.',
              },
              fr: {
                text: 'L’apprentissage supervisé\u00a0: les bonnes réponses (les étiquettes) guident l’entraînement. C’est ainsi que ton modèle de gentillesse a appris.',
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
                  'A moderation tool trained mostly on messages in standard English keeps hiding friendly messages written in a regional dialect. What is the best response?',
              },
              fr: {
                prompt:
                  'Un outil de modération entraîné surtout sur des messages en français standard masque sans cesse des messages amicaux écrits dans un parler régional. Quelle est la meilleure réaction\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Trust the tool: it is confident, so the messages must be rude' },
                  fr: {
                    text: 'Faire confiance à l’outil\u00a0: il est sûr de lui, donc les messages doivent être insultants',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Ban the dialect from the chat' },
                  fr: { text: 'Interdire ce parler régional dans la discussion' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Add varied examples labelled by people who know the dialect, and let human moderators review hidden messages and appeals',
                  },
                  fr: {
                    text: 'Ajouter des exemples variés, étiquetés par des personnes qui connaissent ce parler, et faire vérifier les messages masqués et les contestations par des modérateurs humains',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Switch off every rule against hurtful messages' },
                  fr: { text: 'Supprimer toutes les règles contre les messages blessants' },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'False alarms that always fall on the same group are unfair. Better data, labelled by people who know how that group talks, human review and a way to appeal are how good moderation fixes them.',
              },
              fr: {
                text: 'Des fausses alertes qui tombent toujours sur le même groupe sont injustes. De meilleures données, étiquetées par des personnes qui connaissent la façon de parler de ce groupe, une vérification humaine et un moyen de contester\u00a0: c’est ainsi qu’une bonne modération les corrige.',
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
                  'Your model says that a message is unkind, with 95% confidence. What does that tell you?',
              },
              fr: {
                prompt:
                  'Ton modèle indique qu’un message n’est pas gentil, avec une confiance de 95\u00a0%. Qu’est-ce que cela t’apprend\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The message is certainly unkind: 95% is almost proof' },
                  fr: {
                    text: 'Il est certain que le message n’est pas gentil\u00a0: 95\u00a0%, c’est presque une preuve',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The message strongly matches the patterns the model learned for unkind, but the model can still be wrong',
                  },
                  fr: {
                    text: 'Le message correspond fortement aux régularités que le modèle a apprises pour «\u00a0pas gentil\u00a0», mais le modèle peut quand même se tromper',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: '95% of people would find the message unkind' },
                  fr: { text: '95\u00a0% des gens trouveraient ce message pas gentil' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The model asked a human to check the message' },
                  fr: { text: 'Le modèle a fait vérifier le message par un humain' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Confidence measures how closely a message matches what the model learned from its examples, not what people think. If the examples had gaps, a model can be very confident and wrong.',
              },
              fr: {
                text: 'La confiance mesure à quel point un message correspond à ce que le modèle a appris de ses exemples, pas ce que pensent les gens. Si les exemples avaient des lacunes, un modèle peut être très sûr de lui et se tromper.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [
    {
      id: 'project-m4',
      input: {
        kind: 'assignment',
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Make me happy: my kindness model test report',
            brief:
              'Train your own model to recognise kind and unkind messages sent to an invented character, connect it to your character in Scratch, then test it like a scientist. Your report shows how the model behaves with messages it has never seen, tricky ones included, and explains one result that surprised you. Every message speaks to your invented character only, never about a real person, and the unkind ones stay mild. If the website does not work at your school, do the paper version of the lesson instead and report on your word tally.',
            requirements:
              'Hand in three things:\n1. A screenshot of your character reacting in Scratch or of your tests in Learn & Test (for the paper version, a photo of your cards and tally, or your tally typed out).\n2. A table of your six test messages, none of them used in training: the message, the label the model gave, its confidence and whether it was right. Include at least one sarcastic message, one with slang and one with "not".\n3. One surprising result explained in three to five sentences: what you expected, what the model answered and why you think it answered that way, using what you know about its training examples. End with one change to your examples that could fix it.\nHow to send it: choose Image, attach your screenshot (or the photo of your cards), and type parts 2 and 3 in "About your work". Paper version with no photo: choose Text and type everything. Check that your screenshot or photo shows no names, faces or other personal details.\nHow it is assessed: Understanding (your explanation uses the training examples and patterns); Technical quality (a trained model, or a complete word tally for the paper version, and a complete, careful table); Responsible use of AI (an invented character, mild examples, no personal details); Creativity (your character and well-chosen tricky messages).',
          },
          fr: {
            title: 'Rends-moi heureux\u00a0: le rapport de test de mon modèle de gentillesse',
            brief:
              'Entraîne ton propre modèle à reconnaître les messages gentils et pas gentils adressés à un personnage inventé, relie-le à ton personnage dans Scratch, puis teste-le comme un scientifique. Ton rapport montre comment le modèle réagit à des messages qu’il n’a jamais vus, y compris des messages pièges, et explique un résultat qui t’a surpris. Chaque message s’adresse uniquement à ton personnage inventé, jamais à une personne réelle, et les messages pas gentils restent légers. Si le site ne fonctionne pas dans ton école, fais plutôt la version sur papier de la leçon et présente les résultats de ton comptage de mots.',
            requirements:
              'Rends trois choses\u00a0:\n1. Une capture d’écran de ton personnage qui réagit dans Scratch ou de tes tests dans «\u00a0Apprendre & Tester\u00a0» (Learn & Test)\u00a0; pour la version sur papier, une photo de tes cartes et de ton comptage, ou ton comptage tapé au clavier.\n2. Un tableau de tes six messages de test, dont aucun n’a servi à l’entraînement\u00a0: le message, l’étiquette donnée par le modèle, sa confiance, et si la réponse était juste. Inclus au moins un message sarcastique, un en argot et un avec une négation.\n3. Un résultat surprenant expliqué en trois à cinq phrases\u00a0: ce que tu attendais, ce que le modèle a répondu, et pourquoi il a répondu ainsi selon toi, à l’aide de ce que tu sais de ses exemples d’entraînement. Termine par une modification de tes exemples qui pourrait corriger le problème.\nComment l’envoyer\u00a0: choisis «\u00a0Image\u00a0», ajoute ta capture d’écran (ou la photo de tes cartes) et tape les parties 2 et 3 dans «\u00a0À propos de votre travail\u00a0». Version papier sans photo\u00a0: choisis «\u00a0Texte\u00a0» et tape tout. Vérifie qu’on ne voit sur ta capture ou ta photo ni nom, ni visage, ni aucune autre information personnelle.\nCritères d’évaluation\u00a0: Compréhension (ton explication s’appuie sur les exemples d’entraînement et les régularités)\u00a0; Qualité technique (un modèle entraîné, ou un comptage de mots complet pour la version papier, et un tableau complet et soigné)\u00a0; Usage responsable de l’IA (personnage inventé, exemples légers, aucune information personnelle)\u00a0; Créativité (ton personnage et des messages pièges bien choisis).',
          },
        },
        allowedSubmissionTypes: ['image', 'text'],
        rubric: [
          { key: 'understanding', weight: 40 },
          { key: 'technicalQuality', weight: 30 },
          { key: 'responsibleAi', weight: 15 },
          { key: 'creativity', weight: 15 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
