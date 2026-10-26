// Module m6 of "AI Essentials for Educators" (teachers of pupils aged 8 to 18): inclusive and
// creative AI. It comes after m5 (teaching machine learning hands-on) and is the last module. It
// builds on m1 (patterns and stereotypes in training data), m2-l2 (adapt the access, keep the
// objective; describe needs, never pupils), m3 (acknowledging AI help, why detectors give no
// proof), m4-l1 (personal data, approved tools, age rules, fakes of pupils as a safeguarding
// matter), m4-l2 (the poster project, generating on the class screen for younger pupils) and m5
// (models learn from examples). A teacher course has no project block: each 'build' stage is a
// reflection in which teachers plan for their own class.
// m6-l1: four supports (text-to-speech, speech-to-text and captions, simplified and levelled
// texts, translation for families) and where they fail; Universal Design for Learning (CAST's
// three principles, linked to udlguidelines.cast.org) with co-design with pupils and families;
// three risks under the lesson's principle "remove the barrier, keep the learning" (errors the
// pupil cannot see, over-reliance and exam access arrangements, sensitive data about needs never
// in a prompt). The one study cited is Koenecke et al. (PNAS, 2020): five commercial
// speech-recognition systems, average word error rate about 0.35 for Black American speakers
// against 0.19 for white American speakers ("almost twice as many errors"). No watch block: the
// module's watch stage is in m6-l2. A paper decision task (keep, change or stop), an ai_activity
// (give_example) and two reflections.
// m6-l2: generation that makes pupils think, by medium; four rules (terms of tools and outputs,
// with the US Copyright Office position on human authorship as the only legal example; no real
// people, even with consent; age rules; disclosure, with C2PA and the EU AI Act's transparency
// rules kept general); deepfakes and media literacy (the "liar's dividend" of Chesney and Citron,
// four verification habits, by age). The video reuses X994dDnmRmY (Code.org How AI Works, "Does
// AI have creativity and imagination?", curated in build-with-generative-ai m1-l2), summarised
// from that block. A go / change / stop task, an ai_activity (challenge_me), the build
// reflection, the module quiz quiz-m6 (seven questions: q1 to q3 and q7 on m6-l1, q4 to q6 on
// m6-l2) and a reflection.
// No Machine Learning for Kids activity: the outline gives this module none, and no worksheet is
// linked. Every example and situation is invented.

import type { SeedModulePart } from '../../types';

const RICH = 'rich_text' as const;

export const m6: SeedModulePart = {
  module: {
    id: 'm6',
    input: {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Inclusive and creative AI',
          description:
            'Use AI to make learning more accessible without losing sight of privacy, and use image, audio and video generation in class fairly and safely.',
        },
        fr: {
          title: 'Une IA inclusive et créative',
          description:
            'Utiliser l’IA pour rendre les apprentissages plus accessibles sans perdre de vue la protection des données, et utiliser en classe la génération d’images, de sons et de vidéos de façon équitable et sûre.',
        },
      },
    },
    lessons: [
      {
        id: 'm6-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'AI for inclusive education',
              summary:
                'Read-aloud, captions, levelled texts and translation can open a lesson to more pupils. Plan them for everyone with Universal Design for Learning, know where they fail, and keep data about needs out of every prompt.',
            },
            fr: {
              title: 'L’IA au service d’une école inclusive',
              summary:
                'Lecture à voix haute, sous-titres, textes de différents niveaux et traduction peuvent ouvrir une séance à davantage d’élèves. Prévoyez-les pour tous, sachez où ils échouent et gardez les données sur les besoins hors de tout prompt.',
            },
          },
          estimatedMinutes: 40,
          xpReward: 50,
        },
        blocks: [
          {
            id: 'm6-l1-b1',
            type: RICH,
            stage: 'discover',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Four walls in one lesson',
                body: 'Picture a lesson for pupils aged 13: a long text, a video without captions, a written report, and a letter about Friday’s trip in the language of the school.\n\nFor a pupil who finds decoding hard, the text is a wall. For a pupil who is hard of hearing, the video falls silent where it matters. For a pupil who arrived three months ago, the report is out of reach, and his parents cannot read the letter.\n\nAI tools can lower each wall in minutes. They can also build new ones: a caption that turns *meander* into *me and her*, a translated letter that changes the meaning, a support that does the learning for the pupil, a prompt that tells a company about a child’s diagnosis.\n\nThis lesson goes beyond the single adapted text of module 2: a whole lesson that more pupils can access from the start, planned with pupils and families.',
              },
              fr: {
                heading: 'Quatre murs dans une même séance',
                body: 'Imaginez une séance avec des élèves de 13 ans : un long texte, une vidéo sans sous-titres, un compte rendu écrit, et un mot sur la sortie de vendredi rédigé dans la langue de l’établissement.\n\nPour un élève qui a du mal à déchiffrer, le texte est un mur. Pour une élève malentendante, la vidéo devient muette au moment où tout se joue. Pour un élève arrivé il y a trois mois, le compte rendu est hors de portée, et ses parents ne peuvent pas lire le mot.\n\nLes outils d’IA peuvent abaisser chacun de ces murs en quelques minutes. Ils peuvent aussi en dresser de nouveaux : un sous-titre qui transforme *l’érosion des champs* en *l’érosion des chants*, une lettre traduite qui change le sens, une aide qui fait le travail d’apprentissage à la place de l’élève, un prompt qui révèle à une entreprise le diagnostic d’un enfant.\n\nCette leçon va au-delà du texte adapté du module 2 : une séance entière, accessible au plus grand nombre dès le départ, conçue avec les élèves et leurs familles.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l1-b2',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Four supports, and where they go wrong',
                body: 'Many of these tools are already on your school’s devices, often without an AI label.\n\n| Support | Who it can help | What can go wrong |\n|---|---|---|\n| **Text-to-speech** (read-aloud) | Pupils who find decoding hard or have a visual impairment, pupils learning the language | Names, subject terms, numbers and formulas misread; a voice in the wrong language |\n| **Speech-to-text** (dictation, live captions) | Pupils who are deaf or hard of hearing, pupils for whom handwriting or typing is a barrier | Subject vocabulary, names, accents, overlapping voices |\n| **Simplified and levelled texts** (module 2) | Pupils reading below the level of the text | Meaning changed, expectations lowered |\n| **Translation** | Pupils new to the language, families who read another language | Shifts in meaning and tone, weaker results in less widely used languages |\n\n- **Recognition is not equal for everyone.** Speech recognition learns from examples, like the models of module 5. A 2020 study led by Stanford researchers (Koenecke and colleagues) found that the systems of five large technology companies made almost twice as many errors for Black American speakers as for white American speakers, and speech affected by a disability is often poorly recognised. Test a tool with the voices it will serve. Captions add to support such as sign language or a teaching assistant; they do not replace it.\n- **Machine translation is for routine messages.** For consent, health, safeguarding or a meeting about a child’s needs, use a qualified interpreter or a colleague who speaks the language. For routine messages, write a short, plain original with dates and amounts in figures, and have the translation checked by someone who reads the language where you can.',
              },
              fr: {
                heading: 'Quatre aides, et là où elles se trompent',
                body: 'Beaucoup de ces outils sont déjà présents sur les appareils de votre établissement, souvent sans l’étiquette « IA ».\n\n| Aide | À qui elle peut servir | Ce qui peut mal tourner |\n|---|---|---|\n| **Synthèse vocale** (lecture à voix haute) | Élèves qui ont du mal à déchiffrer ou qui ont une déficience visuelle, élèves qui apprennent la langue | Noms propres, termes disciplinaires, nombres et formules mal lus ; une voix dans la mauvaise langue |\n| **Reconnaissance vocale** (dictée, sous-titrage en direct) | Élèves sourds ou malentendants, élèves pour qui l’écriture manuscrite ou la frappe est un obstacle | Vocabulaire disciplinaire, noms propres, accents, voix qui se chevauchent |\n| **Textes simplifiés et de différents niveaux** (module 2) | Élèves dont le niveau de lecture est inférieur à celui du texte | Sens modifié, attentes revues à la baisse |\n| **Traduction** | Élèves nouvellement arrivés, familles qui lisent une autre langue | Glissements de sens et de ton, résultats moins bons dans les langues moins répandues |\n\n- **La reconnaissance n’est pas la même pour tous.** La reconnaissance vocale apprend à partir d’exemples, comme les modèles du module 5. Une étude de 2020 menée par des chercheurs de Stanford (Koenecke et ses collègues) a montré que les systèmes de cinq grandes entreprises technologiques commettaient presque deux fois plus d’erreurs avec des locuteurs afro-américains qu’avec des locuteurs blancs américains, et une parole affectée par un handicap est souvent mal reconnue. Testez un outil avec les voix qu’il devra comprendre. Les sous-titres s’ajoutent à l’accompagnement, comme la langue des signes ou une aide humaine ; ils ne le remplacent pas.\n- **La traduction automatique, c’est pour les messages courants.** Pour tout ce qui touche au consentement, à la santé, à la protection de l’enfance ou aux besoins d’un enfant, faites appel à un interprète qualifié ou à un collègue qui parle la langue. Pour les messages courants, rédigez un original court et simple, avec les dates et les montants en chiffres, et faites vérifier la traduction par une personne qui lit la langue quand c’est possible.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l1-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Design for everyone, with the people concerned',
                body: '**Universal Design for Learning** (UDL), a framework from the US non-profit organisation CAST ([the UDL Guidelines](https://udlguidelines.cast.org), in English), starts from one idea: barriers often lie in the design of a lesson rather than in the pupil. So plan flexible options for everyone from the start, instead of adapting for a few pupils afterwards, which also avoids singling anyone out.\n\n| Principle | Options AI can help you prepare | Your check |\n|---|---|---|\n| **Engagement** (the why) | The same problem in three contexts to choose from | Stereotypes (module 1) |\n| **Representation** (the what) | Read-aloud for every text, captions on every video, a glossary | Key terms read and captioned correctly |\n| **Action and expression** (the how) | A written answer, a labelled diagram or a short recording | The same success criteria; recordings kept as your school requires |\n\nAI makes options cheap; choosing those that serve your objective is your job.\n\n**Co-design.** "Nothing about us without us", the motto of the disability-rights movement, applies to classrooms too. Show the whole class how to use the supports, let pupils choose, and ask what helped in an anonymous exit ticket. Pupils who use assistive technology every day often know it best, but nobody should have to speak for a group or reveal a need in front of others. Ask families which language and format they prefer, and explain which tools you use and what data they process. Decisions about one pupil’s support are taken with the family and specialist colleagues, never in an AI tool.',
              },
              fr: {
                heading: 'Concevoir pour tous, avec les personnes concernées',
                body: 'La **conception universelle de l’apprentissage** (CUA, en anglais *Universal Design for Learning*), un cadre élaboré par l’organisation américaine à but non lucratif CAST ([ses lignes directrices](https://udlguidelines.cast.org), en anglais), part d’une idée : les obstacles se trouvent souvent dans la conception d’une séance plutôt que chez l’élève. Mieux vaut donc prévoir dès le départ des options souples pour tous que d’adapter après coup pour quelques-uns, ce qui évite aussi de mettre un élève à part.\n\n| Principe | Options que l’IA peut vous aider à préparer | Votre vérification |\n|---|---|---|\n| **L’engagement** (le pourquoi) | Le même problème dans trois contextes au choix | Les stéréotypes (module 1) |\n| **La représentation** (le quoi) | Lecture à voix haute pour chaque texte, sous-titres pour chaque vidéo, un glossaire | Termes clés bien lus et bien sous-titrés |\n| **L’action et l’expression** (le comment) | Une réponse écrite, un schéma légendé ou un court enregistrement | Les mêmes critères de réussite ; des enregistrements conservés selon les règles de l’établissement |\n\nL’IA rend ces options peu coûteuses ; choisir celles qui servent votre objectif reste votre travail.\n\n**Concevoir avec les personnes concernées.** « Rien sur nous sans nous », la devise du mouvement pour les droits des personnes handicapées, vaut aussi pour la classe. Montrez à toute la classe comment utiliser les aides, laissez les élèves choisir et demandez-leur ce qui les a aidés dans un billet de sortie anonyme. Les élèves qui utilisent chaque jour une aide technique la connaissent souvent le mieux, mais personne ne doit avoir à parler au nom d’un groupe ni à révéler un besoin devant les autres. Demandez aux familles dans quelle langue et sous quelle forme elles préfèrent recevoir les messages, et expliquez quels outils vous utilisez et quelles données ils traitent. Les décisions sur l’accompagnement d’un élève se prennent avec sa famille et les collègues spécialisés, jamais dans un outil d’IA.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l1-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Remove the barrier, keep the learning',
                body: '**Errors the pupil cannot see.** The pupil who relies on a support is often the least able to spot its mistakes: a pupil who cannot hear the video cannot tell that a caption is wrong. Check what carries the learning (key terms, numbers, instructions) and teach pupils to flag anything odd.\n\n**Over-reliance.** A support is right when it removes a barrier on the way to the objective, and wrong when it removes the objective itself. Dictation is a fair way to show an understanding of photosynthesis, not to show spelling. Where the skill itself is the goal, plan how the support will fade, and check exam rules before a pupil comes to depend on a tool: access arrangements are set by the exam authorities, not by the class teacher.\n\n**Sensitive data.** Information about special educational needs, disability or health is among the most sensitive data a school holds, and laws such as the GDPR give health data extra protection. It never goes into a prompt: no names, no diagnoses, no extracts from a support plan, not even "a pupil with autism in my class of 12-year-olds", which can identify a child in a small school. Describe the barrier in the task instead, as in module 2. Many dictation and caption tools also process voices on the provider’s servers: use only approved tools (module 4), including for AI note-takers in meetings with families.',
              },
              fr: {
                heading: 'Lever l’obstacle, garder l’apprentissage',
                body: '**Des erreurs que l’élève ne voit pas.** L’élève qui s’appuie sur une aide est souvent le moins à même d’en repérer les erreurs : un élève qui n’entend pas la vidéo ne peut pas savoir qu’un sous-titre est faux. Vérifiez ce qui porte l’apprentissage (termes clés, nombres, consignes) et apprenez aux élèves à signaler ce qui leur semble étrange.\n\n**La dépendance.** Une aide est pertinente quand elle lève un obstacle sur le chemin de l’objectif, et inadaptée quand elle supprime l’objectif lui-même. La dictée est un moyen équitable de montrer qu’on a compris la photosynthèse, pas de montrer qu’on maîtrise l’orthographe. Quand la compétence elle-même est visée, prévoyez comment l’aide s’effacera, et vérifiez les règles des examens avant qu’un élève ne dépende d’un outil : les aménagements sont décidés par les autorités qui organisent l’examen, pas par l’enseignant de la classe.\n\n**Les données sensibles.** Les informations sur les besoins éducatifs particuliers, le handicap ou la santé comptent parmi les données les plus sensibles que détient un établissement, et des lois comme le RGPD protègent davantage les données de santé. Elles ne vont jamais dans un prompt : ni nom, ni diagnostic, ni extrait d’un plan d’accompagnement, pas même « un élève autiste dans ma classe d’élèves de 12 ans », qui peut suffire à identifier un enfant dans un petit établissement. Décrivez plutôt l’obstacle présent dans la tâche, comme au module 2. Beaucoup d’outils de dictée et de sous-titrage traitent aussi les voix sur les serveurs du fournisseur : n’utilisez que des outils autorisés (module 4), y compris pour la prise de notes par l’IA lors des réunions avec les familles.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l1-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: keep, change or stop?',
                body: 'For each situation, decide: keep it (it removes a barrier), change it (it removes part of the learning) or stop (it puts data at risk). Then compare with the comments.\n\n1. Pupils aged 14 analyse the viewpoint of a written source. Anyone may have it read aloud.\n2. Pupils aged 8 practise reading a text aloud with expression. A tool reads it for those who find it hard.\n3. A pupil learning the language receives an AI translation of a science worksheet instead of the original.\n4. A teacher pastes a pupil’s support plan, without the name, into a free chatbot to get ideas.\n5. Live captions are on for every video shown to a class of 11-year-olds.\n\n**Comments.** 1: keep. The objective is the viewpoint, not decoding. 2: change. Use the tool to model the reading, then let pupils read. 3: change. Give the translation *alongside* the original, with its key terms checked, so that she also learns them in the language of instruction. 4: stop. A plan can identify a child even without a name: describe the barriers of the task and talk to the colleagues who coordinate support. 5: keep. It is UDL in practice, once you have checked the key terms in the captions.',
              },
              fr: {
                heading: 'À vous : garder, modifier ou arrêter ?',
                body: 'Pour chaque situation, décidez : à garder (l’aide lève un obstacle), à modifier (elle supprime une partie de l’apprentissage) ou à arrêter (elle met des données en danger). Comparez ensuite avec les commentaires.\n\n1. Des élèves de 14 ans analysent le point de vue d’une source écrite. Chacun peut se la faire lire à voix haute.\n2. Des élèves de 8 ans s’entraînent à lire un texte à voix haute de façon expressive. Un outil le lit pour ceux qui ont des difficultés.\n3. Une élève qui apprend la langue reçoit une traduction par l’IA d’une fiche de sciences, à la place de l’original.\n4. Un enseignant colle dans un chatbot gratuit le plan d’accompagnement d’un élève, sans son nom, pour trouver des idées.\n5. Les sous-titres en direct sont activés pour chaque vidéo montrée à une classe d’élèves de 11 ans.\n\n**Commentaires.** 1 : à garder. L’objectif est le point de vue, pas le déchiffrage. 2 : à modifier. Utilisez l’outil pour donner un modèle de lecture, puis laissez les élèves lire. 3 : à modifier. Donnez la traduction *à côté de* l’original, avec ses termes clés vérifiés, pour que l’élève les apprenne aussi dans la langue de scolarisation. 4 : à arrêter. Un plan peut identifier un enfant même sans son nom : décrivez les obstacles de la tâche et parlez-en avec les collègues qui coordonnent l’accompagnement. 5 : à garder. C’est la CUA en pratique, une fois les termes clés vérifiés dans les sous-titres.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor for UDL options for one of your own objectives (describe the task, never a pupil), then sort them yourself: which remove a barrier, and which would remove part of the learning?',
                starterPrompt:
                  'My objective is [objective, subject, age of the pupils] and the main task is [task]. Give me one Universal Design for Learning option for engagement, one for representation and one for action and expression, and say what a teacher should check for each.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA des options de CUA pour l’un de vos propres objectifs (décrivez la tâche, jamais un élève), puis triez-les vous-même : lesquelles lèvent un obstacle, et lesquelles supprimeraient une partie de l’apprentissage ?',
                starterPrompt:
                  'Mon objectif est [objectif, discipline, âge des élèves] et la tâche principale est [tâche]. Donnez-moi une option de conception universelle de l’apprentissage pour l’engagement, une pour la représentation et une pour l’action et l’expression, et indiquez pour chacune ce qu’un enseignant devrait vérifier.',
              },
            },
            data: { tutorMode: 'give_example', labToolId: null },
          },
          {
            id: 'm6-l1-b7',
            type: 'reflection',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Choose a lesson you will teach soon. Write its objective and the main barriers in its task, then plan two or three options you will offer the whole class with AI tools (read-aloud, captions, a levelled text, a translated glossary, a choice of format). For each, say what you will check, why it removes a barrier rather than the learning, and how you will ask pupils what helped. Include no names and no information about any pupil’s needs.',
              },
              fr: {
                prompt:
                  'Choisissez une séance que vous donnerez prochainement. Notez son objectif et les principaux obstacles de sa tâche, puis prévoyez deux ou trois options que vous proposerez à toute la classe avec des outils d’IA (lecture à voix haute, sous-titres, texte d’un autre niveau, glossaire traduit, choix du format). Pour chacune, indiquez ce que vous vérifierez, pourquoi elle lève un obstacle plutôt que l’apprentissage, et comment vous demanderez aux élèves ce qui les a aidés. N’indiquez aucun nom ni aucune information sur les besoins d’un élève.',
              },
            },
            data: { minLength: 300 },
          },
          {
            id: 'm6-l1-b8',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Which AI support would you offer to your whole class first, and what would you need to find out about it (its errors, its data, its rules) before you do?',
              },
              fr: {
                prompt:
                  'Quelle aide fondée sur l’IA proposeriez-vous en premier à toute votre classe, et que devriez-vous savoir à son sujet (ses erreurs, ses données, ses règles) avant de le faire ?',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
      {
        id: 'm6-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Images, audio and video with AI in class',
              summary:
                'Uses of image, audio and video generation that make pupils think, the rules to set first (terms and licences, no real people, age rules, disclosure), and how to teach pupils to check what they see and hear.',
            },
            fr: {
              title: 'Images, sons et vidéos générés par l’IA en classe',
              summary:
                'Des usages de la génération d’images, de sons et de vidéos qui font réfléchir les élèves, les règles à fixer d’abord (conditions et licences, aucune personne réelle, âge, déclaration), et comment apprendre aux élèves à vérifier ce qu’ils voient et entendent.',
            },
          },
          estimatedMinutes: 40,
          xpReward: 50,
        },
        blocks: [
          {
            id: 'm6-l2-b1',
            type: RICH,
            stage: 'discover',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Four requests in one week',
                body: 'In one week, a teacher hears four requests.\n\n- **A pupil aged 12:** "Can I put my friend’s face on an astronaut for my poster?"\n- **A colleague:** "Let’s make a video of the head teacher announcing that school is closed tomorrow."\n- **A pupil aged 15:** "Is this video of the minister real? Everyone’s sharing it."\n- **The art department:** "Can we enter AI-generated images in the regional competition?"\n\nEach one raises a different question: consent and likeness, safeguarding, media literacy, licences and disclosure. Image, audio and video generators can make creative work more ambitious and teach pupils how media are made. This lesson covers the uses worth class time, and the rules to set before anyone presses *Generate*.',
              },
              fr: {
                heading: 'Quatre demandes en une semaine',
                body: 'En une semaine, une enseignante entend quatre demandes.\n\n- **Une élève de 12 ans :** « Je peux mettre le visage de ma copine sur un astronaute, pour mon affiche ? »\n- **Un collègue :** « Et si on faisait une vidéo du chef d’établissement qui annonce que l’école est fermée demain ? »\n- **Un élève de 15 ans :** « Elle est vraie, cette vidéo du ministre ? Tout le monde la partage. »\n- **L’équipe d’arts plastiques :** « Peut-on présenter des images générées par l’IA au concours régional ? »\n\nChacune soulève une question différente : le consentement et le droit à l’image, la protection de l’enfance, l’éducation aux médias, les licences et la déclaration de l’usage de l’IA. Les générateurs d’images, de sons et de vidéos peuvent rendre les projets créatifs plus ambitieux et apprendre aux élèves comment les médias sont fabriqués. Cette leçon présente les usages qui méritent du temps de classe, et les règles à fixer avant que quiconque ne clique sur *Générer*.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l2-b2',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Generate to learn, not just to decorate',
                body: 'In module 4, pupils compared three prompts for one poster image. The principle holds for every medium: the activities worth the time ask pupils to direct, compare, critique and improve what a tool generates.\n\n| Medium | Uses that make pupils think | Keep in mind |\n|---|---|---|\n| **Images** | Count who appears for "a scientist" or "a family" and discuss why; illustrate a story pupils wrote, then list what the image got wrong | Stereotypes (module 1), look-alikes of existing characters and works |\n| **Audio** | Sound effects for a class podcast; a synthetic voice reading the pupils’ script, compared with their own reading | Voices that imitate real people |\n| **Video** | Storyboard a short explainer by hand, then compare it with a generated clip | Stricter age rules in many tools |\n\nA generated "photo" of the past is never a historical source: it shows what a model predicts a scene looked like. Use one, if at all, to discuss how images mislead, next to real archive material.',
              },
              fr: {
                heading: 'Générer pour apprendre, pas seulement pour décorer',
                body: 'Au module 4, les élèves comparaient trois prompts pour une même image d’affiche. Le principe vaut pour tous les médias : les activités qui en valent la peine demandent aux élèves de diriger, comparer, critiquer et améliorer ce que génère un outil.\n\n| Média | Des usages qui font réfléchir les élèves | À garder en tête |\n|---|---|---|\n| **Images** | Compter qui apparaît pour « un scientifique » ou « une famille » et chercher pourquoi ; illustrer une histoire écrite par les élèves, puis lister ce que l’image a raté | Les stéréotypes (module 1), les ressemblances avec des personnages et des œuvres existants |\n| **Sons** | Des bruitages pour un podcast de classe ; une voix de synthèse qui lit le script des élèves, comparée à leur propre lecture | Les voix qui imitent des personnes réelles |\n| **Vidéos** | Réaliser à la main le storyboard d’une courte vidéo explicative, puis le comparer à un extrait généré | Des règles d’âge plus strictes dans beaucoup d’outils |\n\nUne « photo » du passé générée par l’IA n’est jamais une source historique : elle montre ce qu’un modèle prédit de l’aspect d’une scène. Si vous en utilisez une, que ce soit pour montrer comment une image peut tromper, à côté de véritables documents d’archives.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l2-b3',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Four rules before you press Generate',
                body: '**1. Read the terms of the tool and of its outputs.** Check who may use the tool, whether prompts and uploads train its models, and what you may do with its outputs. Terms vary, and many make the user responsible for not infringing other people’s rights. Copyright in generated content differs by country and is still evolving: in the United States, for example, the Copyright Office has said that material generated by AI without enough human creative input cannot be protected by copyright. For work you will publish, avoid imitating a named living artist or a protected character, and do not upload other people’s images or pupils’ work unless the rights and your school’s rules allow it.\n\n**2. No real people.** Never generate images, voices or videos of real pupils or staff, even as a joke or with their agreement, and never upload their photos or recordings. Faces and voices are personal data, a voice can be cloned from a short recording, and a fake can be copied and reused out of context. Use invented characters or the tool’s stock voices. A fake of a pupil is a safeguarding matter (module 4).\n\n**3. Check the age rule.** Image, voice and video tools often have stricter age rules than chatbots, and a generator built into an app follows that app’s rules. For younger pupils, generate on the class screen yourself.\n\n**4. Say it is AI.** Label generated media wherever it is shown ("Image generated with [tool] from the class’s prompt, then edited"), and ask pupils for an AI acknowledgement, as in module 3. Some tools add invisible watermarks or provenance data (such as the C2PA "Content Credentials" standard), and laws such as the EU AI Act set transparency rules for AI-generated content and deepfakes. But metadata can be stripped: a visible label is the clearest disclosure.',
              },
              fr: {
                heading: 'Quatre règles avant de cliquer sur Générer',
                body: '**1. Lire les conditions de l’outil et celles de ses résultats.** Vérifiez qui a le droit d’utiliser l’outil, si les prompts et les fichiers déposés servent à entraîner ses modèles, et ce que vous pouvez faire de ses résultats. Les conditions varient, et beaucoup rendent l’utilisateur responsable de ne pas porter atteinte aux droits d’autrui. Le droit d’auteur sur les contenus générés varie d’un pays à l’autre et évolue encore : aux États-Unis, par exemple, le Copyright Office (l’office fédéral du droit d’auteur) a indiqué qu’un contenu généré par l’IA sans apport créatif humain suffisant ne peut pas être protégé. Pour un travail destiné à être publié, évitez d’imiter un artiste vivant cité par son nom ou un personnage protégé, et ne déposez ni les images d’autrui ni les travaux des élèves, sauf si les droits et les règles de votre établissement le permettent.\n\n**2. Aucune personne réelle.** Ne générez jamais d’images, de voix ou de vidéos d’élèves ou de membres du personnel réels, même pour rire ou avec leur accord, et ne déposez jamais leurs photos ou leurs enregistrements. Les visages et les voix sont des données personnelles, une voix peut être clonée à partir d’un court enregistrement, et un faux peut être copié et réutilisé hors de son contexte. Utilisez des personnages inventés ou les voix fournies par l’outil. Un faux visant un élève relève de la protection de l’enfance (module 4).\n\n**3. Vérifier la règle d’âge.** Les outils d’images, de voix et de vidéos ont souvent des règles d’âge plus strictes que les chatbots, et un générateur intégré à une application suit les règles de cette application. Avec les plus jeunes, générez vous-même sur l’écran de la classe.\n\n**4. Dire que c’est de l’IA.** Signalez les médias générés partout où ils sont montrés (« Image générée avec [outil] à partir du prompt de la classe, puis retouchée »), et demandez aux élèves une déclaration d’usage de l’IA, comme au module 3. Certains outils ajoutent des filigranes invisibles ou des données de provenance (comme la norme C2PA, dite *Content Credentials*), et des lois comme le règlement européen sur l’IA (AI Act) fixent des règles de transparence pour les contenus générés par l’IA et les deepfakes. Mais les métadonnées peuvent être supprimées : une mention visible reste la déclaration la plus claire.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l2-b4',
            type: RICH,
            stage: 'learn',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Deepfakes and media literacy',
                body: 'A **deepfake** is a realistic image, audio clip or video, generated or manipulated with AI, that shows a real person saying or doing something they never said or did. Spotting glitches is no longer enough: extra fingers are disappearing as tools improve, and detectors, like the AI-writing detectors of module 3, give probabilities, not proof. And real content can now be dismissed as fake, which the legal scholars Robert Chesney and Danielle Citron call the "liar’s dividend".\n\nSo teach verification habits:\n\n1. **Pause.** A strong emotional reaction is a reason to check before sharing.\n2. **Read laterally.** Leave the content and ask who published it first, and whether reliable news outlets or fact-checkers report it.\n3. **Find the original context,** for example with a reverse image search.\n4. **Look for labels, without over-trusting them.** Their absence proves nothing.\n\nWith pupils aged 8 to 10, compare real and generated pictures of objects and landscapes that you choose. From about 11, verify a viral claim together; from about 15, analyse a deepfake case documented by reputable media. Never make a deepfake of a real person as a demonstration.',
              },
              fr: {
                heading: 'Deepfakes et éducation aux médias',
                body: 'Un **deepfake** (en français, *hypertrucage*) est une image, un extrait sonore ou une vidéo réalistes, générés ou modifiés avec l’IA, qui montrent une personne réelle en train de dire ou de faire quelque chose qu’elle n’a jamais dit ni fait. Repérer les défauts ne suffit plus : les doigts en trop disparaissent à mesure que les outils progressent, et les détecteurs, comme les détecteurs de texte généré du module 3, donnent des probabilités, pas des preuves. Et un contenu authentique peut désormais être rejeté comme faux, ce que les juristes Robert Chesney et Danielle Citron appellent le « dividende du menteur ».\n\nEnseignez donc des habitudes de vérification :\n\n1. **Faire une pause.** Une forte réaction émotionnelle est une raison de vérifier avant de partager.\n2. **Pratiquer la lecture latérale.** Quitter le contenu pour chercher qui l’a publié en premier, et si des médias fiables ou des sites de vérification des faits en parlent.\n3. **Retrouver le contexte d’origine,** par exemple grâce à une recherche d’image inversée.\n4. **Chercher des mentions, sans trop s’y fier.** Leur absence ne prouve rien.\n\nAvec des élèves de 8 à 10 ans, comparez des images réelles et générées d’objets et de paysages que vous choisissez. À partir de 11 ans environ, vérifiez ensemble une information virale ; à partir de 15 ans environ, analysez un cas de deepfake documenté par des médias reconnus. Ne fabriquez jamais le deepfake d’une personne réelle pour faire une démonstration.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l2-b5',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: how AI generates images and video',
                caption:
                  'From Code.org’s How AI Works series, like the first video of this course, with guests from the AI companies Runway and OpenAI.',
                transcript:
                  'In short: the video asks whether AI that generates images and short videos is creative. It explains two methods. In a generative adversarial network (GAN), one model generates images and a second judges whether they look real, and both improve by competing. In diffusion, a model learns to remove noise from images, then creates new ones from random noise, cleaned up step by step under the guidance of a text prompt; the same ideas power tools that turn text into video. The pictures are new, but they are built from patterns in training data made by people. Link it to this lesson: those patterns explain the stereotypes in generated images, and the people behind the training data are one reason why licences and credit matter.',
              },
              fr: {
                title: 'Regardez : comment l’IA génère des images et des vidéos',
                caption:
                  'Une vidéo de la série How AI Works de Code.org, comme la première vidéo de cette formation, avec des invités des entreprises d’IA Runway et OpenAI (vidéo en anglais).',
                transcript:
                  'En bref : la vidéo se demande si une IA qui génère des images et de courtes vidéos est créative. Elle présente deux méthodes. Dans un réseau antagoniste génératif (GAN), un modèle génère des images et un second juge si elles ont l’air réelles : les deux progressent en s’affrontant. Avec la diffusion, un modèle apprend à retirer le bruit d’images, puis en crée de nouvelles à partir d’un bruit aléatoire qu’il « nettoie » étape par étape, guidé par un prompt ; les mêmes idées font fonctionner les outils qui transforment un texte en vidéo. Les images sont nouvelles, mais elles sont construites à partir de régularités tirées de données d’entraînement créées par des humains. Faites le lien avec cette leçon : ces régularités expliquent les stéréotypes des images générées, et les personnes qui sont derrière les données d’entraînement sont l’une des raisons pour lesquelles les licences et la mention des sources comptent.',
              },
            },
            data: {
              source: 'youtube',
              videoId: 'X994dDnmRmY',
              fileId: null,
              durationSeconds: null,
            },
          },
          {
            id: 'm6-l2-b6',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Try it: go, change or stop?',
                body: 'For each request, decide: go (fine as it is), change (possible with changes) or stop. Then compare with the comments.\n\n1. Pupils aged 11 illustrate their poems with a free image app on their own phones.\n2. For the end-of-year assembly, a colleague wants to animate photos of the staff singing. Everyone has agreed.\n3. Pupils aged 15 generate twenty images of "a scientist in a laboratory" with an approved tool that allows their age, and count who appears.\n4. A pupil wants to clone his own voice to narrate his podcast.\n5. For a display on the First World War, a class generates a "photo" of a trench.\n\n**Comments.** 1: change. Check the app’s age rule and your approved tools; at this age, generate on the class screen yourself. 2: stop. No images or voices of real staff, even with consent: invented cartoon characters do the job. 3: go: a strong lesson on bias, with no personal data. 4: stop. His voice is personal data and a clone can be reused by others: he records his own voice or uses a stock voice. 5: change. Label it as AI-generated, hunt for anachronisms with the class, and display it next to real archive photographs, which are the evidence.',
              },
              fr: {
                heading: 'À vous : oui, à modifier ou non ?',
                body: 'Pour chaque demande, décidez : oui (tel quel), à modifier (possible avec des changements) ou non. Comparez ensuite avec les commentaires.\n\n1. Des élèves de 11 ans illustrent leurs poèmes avec une application gratuite de génération d’images, sur leur propre téléphone.\n2. Pour la fête de fin d’année, un collègue veut animer des photos du personnel en train de chanter. Tout le monde est d’accord.\n3. Des élèves de 15 ans génèrent vingt images d’« un scientifique dans un laboratoire » avec un outil autorisé et permis à leur âge, et comptent qui apparaît.\n4. Un élève veut cloner sa propre voix pour narrer son podcast.\n5. Pour une exposition sur la Première Guerre mondiale, une classe génère une « photo » de tranchée.\n\n**Commentaires.** 1 : à modifier. Vérifiez la règle d’âge de l’application et les outils autorisés ; à cet âge, générez vous-même les images sur l’écran de la classe. 2 : non. Aucune image ni aucune voix de membres du personnel réels, même avec leur accord : des personnages de dessin animé inventés font tout aussi bien l’affaire. 3 : oui. C’est une excellente leçon sur les biais, sans aucune donnée personnelle. 4 : non. Sa voix est une donnée personnelle et un clone peut être réutilisé par d’autres : il enregistre sa propre voix ou utilise une voix fournie par l’outil. 5 : à modifier. Indiquez qu’elle a été générée par l’IA, cherchez les anachronismes avec la classe, et exposez-la à côté de véritables photographies d’archives : ce sont elles, les documents.',
              },
            },
            data: {},
          },
          {
            id: 'm6-l2-b7',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Ask the AI tutor for a media-literacy situation, then explain how you would lead your class through checking it. Compare your answer with the four habits of this lesson before you read its feedback.',
                starterPrompt:
                  'Challenge me: describe a short situation in which a pupil aged 14 shows the class a striking video or image that may be AI-generated. Ask me how I would lead the class to check it, then tell me what I missed.',
              },
              fr: {
                instructions:
                  'Demandez au tuteur IA une situation d’éducation aux médias, puis expliquez comment vous amèneriez votre classe à la vérifier. Comparez votre réponse avec les quatre habitudes de cette leçon avant de lire son retour.',
                starterPrompt:
                  'Lancez-moi un défi : décrivez une courte situation dans laquelle un élève de 14 ans montre à la classe une vidéo ou une image frappante, peut-être générée par l’IA. Demandez-moi comment j’amènerais la classe à la vérifier, puis dites-moi ce que j’ai oublié.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm6-l2-b8',
            type: 'reflection',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Plan one image, audio or video generation activity for a class you teach: the age of the pupils and the objective, the tool and its age rule (or how you will run it on the class screen), what its terms say about prompts, uploads and outputs, your rule on real people, how pupils will critique the output rather than just collect it, and how the work will be labelled. Then get feedback on it (open the AI tutor in Check my work mode, with no personal data, or ask a colleague) and note one change you made as a result.',
              },
              fr: {
                prompt:
                  'Concevez une activité de génération d’images, de sons ou de vidéos pour l’une de vos classes : l’âge des élèves et l’objectif, l’outil et sa règle d’âge (ou la façon dont vous mènerez l’activité sur l’écran de la classe), ce que disent ses conditions sur les prompts, les fichiers déposés et les résultats, votre règle sur les personnes réelles, la façon dont les élèves critiqueront le résultat au lieu de simplement le collectionner, et la façon dont le travail sera signalé. Demandez ensuite un retour (au tuteur IA en mode « Vérifie mon travail », sans aucune donnée personnelle, ou à un collègue) et notez une modification que vous y avez apportée en conséquence.',
              },
            },
            data: { minLength: 400 },
          },
          {
            id: 'm6-l2-b9',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check your understanding of inclusive AI supports, the rules for generated media and media literacy.',
              },
              fr: {
                intro:
                  'Vérifiez votre compréhension des aides inclusives fondées sur l’IA, des règles des médias générés et de l’éducation aux médias.',
              },
            },
            data: { quizId: 'quiz-m6' },
          },
          {
            id: 'm6-l2-b10',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Which habit from this lesson do you most want your pupils to keep when they meet a striking image or video outside school, and how will you practise it with them this term?',
              },
              fr: {
                prompt:
                  'Quelle habitude de cette leçon voulez-vous le plus que vos élèves gardent lorsqu’ils rencontrent une image ou une vidéo frappante en dehors de l’école, et comment allez-vous l’exercer avec eux ce trimestre ?',
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
      id: 'quiz-m6',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: inclusive and creative AI',
            instructions: 'Seven questions. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz : une IA inclusive et créative',
            instructions: 'Sept questions. Il faut 70 % pour réussir, et vous pouvez réessayer.',
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
                  'In a class of 12-year-olds, several pupils find it hard to decode a long science text. The objective is to explain how volcanoes form. Which approach best follows Universal Design for Learning?',
              },
              fr: {
                prompt:
                  'Dans une classe d’élèves de 12 ans, plusieurs élèves ont du mal à déchiffrer un long texte de sciences. L’objectif est d’expliquer comment se forment les volcans. Quelle approche suit le mieux la conception universelle de l’apprentissage ?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Prepare a simplified version only for the pupils who have a diagnosis',
                  },
                  fr: {
                    text: 'Préparer une version simplifiée uniquement pour les élèves qui ont un diagnostic',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Offer read-aloud and a glossary of key terms to the whole class, keep the same objective, and check how the key terms are read',
                  },
                  fr: {
                    text: 'Proposer à toute la classe la lecture à voix haute et un glossaire des termes clés, garder le même objectif, et vérifier la façon dont les termes clés sont lus',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Replace the text with a video and drop the written work for everyone',
                  },
                  fr: {
                    text: 'Remplacer le texte par une vidéo et supprimer le travail écrit pour tout le monde',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Ask an AI tool to work out from their past marks which pupils need help',
                  },
                  fr: {
                    text: 'Demander à un outil d’IA de déterminer, à partir de leurs notes passées, quels élèves ont besoin d’aide',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'UDL plans options for everyone from the start, keeps the objective and avoids singling anyone out. The first option singles pupils out (and nobody needs a diagnosis to benefit from read-aloud), the third removes part of the task for everyone, and the fourth sends pupils’ marks to an AI tool.',
              },
              fr: {
                text: 'La CUA prévoit dès le départ des options pour tous, garde l’objectif et évite de mettre des élèves à part. La première option met des élèves à part (et nul besoin d’un diagnostic pour profiter de la lecture à voix haute), la troisième supprime une partie de la tâche pour tous, et la quatrième envoie les notes des élèves à un outil d’IA.',
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
                  'Once you remove the pupil’s name, you may paste the content of their support plan into a general AI tool to get ideas.',
              },
              fr: {
                prompt:
                  'Une fois le nom de l’élève retiré, vous pouvez coller le contenu de son plan d’accompagnement dans un outil d’IA généraliste pour trouver des idées.',
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
                text: 'False. Information about needs, disability and health is among the most sensitive data a school holds, and a plan can identify a child even without a name. Describe the barriers of the task in general terms instead, and work with the colleagues who coordinate support.',
              },
              fr: {
                text: 'Faux. Les informations sur les besoins, le handicap et la santé comptent parmi les données les plus sensibles d’un établissement, et un plan peut identifier un enfant même sans son nom. Décrivez plutôt en termes généraux les obstacles de la tâche, et travaillez avec les collègues qui coordonnent l’accompagnement.',
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
                  'In which situations does the AI support risk removing the learning rather than a barrier? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Dans quelles situations l’aide de l’IA risque-t-elle de supprimer l’apprentissage plutôt qu’un obstacle ? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Dictation software that corrects spelling, used in a spelling assessment',
                  },
                  fr: {
                    text: 'Un logiciel de dictée qui corrige l’orthographe, utilisé pendant une évaluation d’orthographe',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'Read-aloud of a word problem in a maths lesson whose objective is solving equations',
                  },
                  fr: {
                    text: 'La lecture à voix haute d’un énoncé de problème dans une séance de mathématiques dont l’objectif est de résoudre des équations',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'A tool that reads the text for pupils in a lesson whose objective is to practise reading aloud fluently',
                  },
                  fr: {
                    text: 'Un outil qui lit le texte à la place des élèves dans une séance dont l’objectif est de s’entraîner à lire à voix haute avec fluidité',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Captions on a video in a geography lesson' },
                  fr: { text: 'Des sous-titres sur une vidéo dans une séance de géographie' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'A tool that turns a pupil’s spoken notes into a finished paragraph, when the objective is to learn to structure a paragraph',
                  },
                  fr: {
                    text: 'Un outil qui transforme les notes orales d’un élève en paragraphe achevé, alors que l’objectif est d’apprendre à structurer un paragraphe',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 4],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A support is right when it removes a barrier on the way to the objective, and wrong when it does the very thing the lesson is meant to teach or assess. Reading a word problem aloud and captioning a video remove barriers; correcting spelling in a spelling test, reading for pupils in a fluency lesson and writing the paragraph for them remove the learning.',
              },
              fr: {
                text: 'Une aide est pertinente quand elle lève un obstacle sur le chemin de l’objectif, et inadaptée quand elle fait précisément ce que la séance doit enseigner ou évaluer. Lire un énoncé à voix haute et sous-titrer une vidéo lèvent des obstacles ; corriger l’orthographe pendant une évaluation d’orthographe, lire à la place des élèves dans une séance de fluidité et rédiger le paragraphe à leur place suppriment l’apprentissage.',
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
                  'A colleague plans an end-of-term surprise: a short video in which the head teacher, with a voice cloned by AI, announces the school party. The head teacher has agreed. What does this course recommend?',
              },
              fr: {
                prompt:
                  'Un collègue prépare une surprise pour la fin du trimestre : une courte vidéo dans laquelle le chef d’établissement, avec une voix clonée par l’IA, annonce la fête de l’école. Le chef d’établissement est d’accord. Que recommande cette formation ?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Go ahead: the head teacher has agreed' },
                  fr: { text: 'Aller de l’avant : le chef d’établissement a donné son accord' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Go ahead, as long as the video is labelled "AI-generated"' },
                  fr: {
                    text: 'Aller de l’avant, à condition que la vidéo porte la mention « générée par l’IA »',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Do not generate images or voices of real staff or pupils, even with consent: use a real recording of the head teacher or an invented character',
                  },
                  fr: {
                    text: 'Ne pas générer d’images ni de voix de membres du personnel ou d’élèves réels, même avec leur accord : utiliser un véritable enregistrement du chef d’établissement ou un personnage inventé',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Go ahead, as long as the video is only shown inside the school' },
                  fr: {
                    text: 'Aller de l’avant, à condition que la vidéo ne soit montrée qu’au sein de l’établissement',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Cloning a voice means uploading a voice sample, which is personal data, to a provider, and a fake, once made, can be copied and reused out of context. It also shows pupils exactly what the school asks them not to do. A real recording does the same job.',
              },
              fr: {
                text: 'Cloner une voix, c’est déposer chez un fournisseur un échantillon de voix, qui est une donnée personnelle, et un faux, une fois créé, peut être copié et réutilisé hors de son contexte. C’est aussi montrer aux élèves exactement ce que l’établissement leur demande de ne pas faire. Un véritable enregistrement remplit le même rôle.',
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
                  'A class of 15-year-olds wants to publish AI-generated illustrations of its short stories on the school website. Which checks are needed first? Choose all that apply.',
              },
              fr: {
                prompt:
                  'Une classe d’élèves de 15 ans veut publier sur le site de l’établissement des illustrations de ses nouvelles générées par l’IA. Quelles vérifications faut-il faire d’abord ? Choisissez toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'The tool is approved by the school and its terms allow pupils of this age',
                  },
                  fr: {
                    text: 'L’outil est autorisé par l’établissement et ses conditions acceptent des élèves de cet âge',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The tool’s terms allow this use of its outputs' },
                  fr: {
                    text: 'Les conditions de l’outil permettent cette utilisation de ses résultats',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'No image shows a real pupil, a member of staff or anyone the pupils know',
                  },
                  fr: {
                    text: 'Aucune image ne représente un élève, un membre du personnel ou une personne que les élèves connaissent',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Each illustration is labelled as AI-generated, with the pupils’ acknowledgement of how they used AI',
                  },
                  fr: {
                    text: 'Chaque illustration est signalée comme générée par l’IA, avec la déclaration des élèves sur leur usage de l’IA',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'The images look realistic enough to be mistaken for photographs',
                  },
                  fr: {
                    text: 'Les images sont assez réalistes pour être prises pour des photographies',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'These are the four rules of the lesson: an approved tool and its age rule, the terms for the use of outputs, no real people, and disclosure. Realism is not a requirement, and for illustrations of fiction it adds nothing but a risk of confusion.',
              },
              fr: {
                text: 'Ce sont les quatre règles de la leçon : un outil autorisé et sa règle d’âge, les conditions d’utilisation des résultats, aucune personne réelle, et la déclaration. Le réalisme n’est pas une exigence, et pour illustrer une fiction, il n’apporte qu’un risque de confusion.',
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
                  'A pupil shows the class a viral video in which a well-known politician makes a shocking statement. Which response builds the most useful habit?',
              },
              fr: {
                prompt:
                  'Un élève montre à la classe une vidéo virale dans laquelle une personnalité politique connue fait une déclaration choquante. Quelle réaction installe l’habitude la plus utile ?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Look for glitches such as extra fingers or odd blinking: if there are none, it is real',
                  },
                  fr: {
                    text: 'Chercher des défauts comme des doigts en trop ou des clignements étranges : s’il n’y en a pas, elle est authentique',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Run it through a deepfake detector and accept its verdict' },
                  fr: { text: 'La soumettre à un détecteur de deepfakes et accepter son verdict' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Leave the video and check the source: who published it first, whether reliable outlets report it, and what the original context was',
                  },
                  fr: {
                    text: 'Quitter la vidéo et vérifier la source : qui l’a publiée en premier, si des médias fiables en parlent, et quel était le contexte d’origine',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Treat every video of a politician as fake from now on' },
                  fr: {
                    text: 'Considérer désormais toute vidéo d’une personnalité politique comme fausse',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Glitches are disappearing and detectors give probabilities, not proof. Lateral reading and finding the original context work whatever tool was used. Treating everything as fake feeds the "liar’s dividend": it makes genuine evidence easier to deny.',
              },
              fr: {
                text: 'Les défauts disparaissent et les détecteurs donnent des probabilités, pas des preuves. La lecture latérale et la recherche du contexte d’origine fonctionnent quel que soit l’outil utilisé. Tout considérer comme faux nourrit le « dividende du menteur » : cela rend les preuves authentiques plus faciles à nier.',
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
                  'Complete the principle of the first lesson of this module: remove the ___, keep the learning. (one word)',
              },
              fr: {
                prompt:
                  'Complétez le principe de la première leçon de ce module : lever l’___, garder l’apprentissage. (un mot)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'barrier',
                'barriers',
                'the barrier',
                'the barriers',
                'obstacle',
                'obstacles',
                'the obstacle',
                'barrier to learning',
              ],
              fr: [
                'obstacle',
                'obstacles',
                'l’obstacle',
                "l'obstacle",
                'les obstacles',
                'barrière',
                'la barrière',
                'frein',
                'le frein',
              ],
            },
            explanation: {
              en: {
                text: 'Remove the barrier, keep the learning: a support should clear the way to the objective without doing the work that the objective is about.',
              },
              fr: {
                text: 'Lever l’obstacle, garder l’apprentissage : une aide doit dégager le chemin vers l’objectif sans faire le travail sur lequel porte cet objectif.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
