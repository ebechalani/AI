// Module m4 of "From AI User to AI Developer" (ages 15-18): computer vision. It comes after m2
// (build with models) and before m5 (language models and chatbots) and m3 (ship it responsibly,
// with the capstone, which stays last). It builds on the no-code Teachable Machine route of
// m2-l1, which warns that a model trained in front of one background can learn the background
// instead of the object; on the data leakage of m1-l2; on the perceptron weights of the m1-l1
// video; and it points forward to the group-by-group audit of m3-l1.
// m4-l1: images as arrays of numbers (grayscale, RGB channels), features (hand-made in classic
// computer vision, learned by a CNN), convolution filters (multiply and add, feature maps),
// ReLU, max pooling, what deeper layers respond to (Zeiler and Fergus, 2014), the texture bias of
// ImageNet-trained networks (Geirhos and colleagues, 2019), transfer learning and data
// augmentation (label-preserving, training set only). The Python code activity, to trace by
// hand: a 3x3 vertical-edge filter on a 5x5 image with a bright bottom-right square gives the
// feature map [[10, 10, 0], [20, 20, 0], [30, 30, 0]]; the horizontal filter the learner writes,
// [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], gives [[10, 20, 30], [10, 20, 30], [0, 0, 0]]; with the
// colours swapped, the vertical filter gives the negatives, which relu turns into zeros. Then a
// check_my_work tutor activity on those numbers. No video block: the one curated computer-vision
// video (Code.org, 2hXG8v8p0KM, in AI Robotics Foundations) is pitched at ages 10-14 and repeats
// the lesson at a lower level, and this course covers its 'watch' stage in m1 to m3.
// m4-l2: spurious correlations and shortcut learning (the wolf-and-husky classifier that Ribeiro,
// Singh and Guestrin trained badly on purpose in 2016; the "tank story", told as a probable
// legend, as the worksheet itself does; the chest X-ray study of Zech and colleagues, 2018), why
// a test set split from the same collection cannot catch a shortcut, counterexamples, dataset
// fixes, and adversarial examples (Goodfellow and colleagues, 2014) as a different way to fool a
// model. Then the Machine Learning for Kids activity Fooled (Trompé; worksheet-fooled.pdf;
// images; Scratch 3; Try it now, no accounts), a paper version for schools that block the site
// (a "lazy model" that keeps the first feature that sorts the training cards: colour before the
// fix, the fruit's top after it; 4 mistakes out of 6 test cards, then none), the hand-in
// project-m4 (assignment: screenshots, the shortcut and its evidence, the dataset fix) and the
// module quiz quiz-m4. m4-l2 has no tutor activity: its 50 minutes go mostly to the worksheet,
// which its teacher's notes estimate at 45 minutes.
// The worksheet is CC BY-NC-SA 4.0: it is linked, never copied or translated, and the steps below
// are our own framing that defers to it for the clicks. The worksheet logs in with a class
// account; the site says Try it now offers every feature, so learners skip the log-in steps. Its
// English teacher's notes list no API keys (the older French notes still mention Watson keys).
// The worksheet drags photos from a web image search: here, photos of fruit only (no people,
// hands, names or text), from a search the teacher approves, or the webcam on real fruit with
// the teacher's permission. Learners keep the worksheet's project name (fooled) and labels
// (apple, tomato) so that its Scratch template matches. A Try it now project lasts a few hours
// and only one can exist at a time, so the hand-in happens in the same lesson. Other lessons are
// named, not numbered, in the text, because the release places this module third.

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
          title: 'Computer vision',
          description:
            'How machines turn pixels into predictions, why image models learn shortcuts, and how to train an image classifier and then break it on purpose.',
        },
        fr: {
          title: 'Vision par ordinateur',
          description:
            'Comment les machines transforment des pixels en prédictions, pourquoi les modèles d’images apprennent des raccourcis, et comment entraîner un classifieur d’images puis le mettre en défaut exprès.',
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
              title: 'How machines see',
              summary:
                'Images as grids of numbers, filters that find edges, pooling and deep layers, and the two tricks behind small image classifiers: transfer learning and data augmentation.',
            },
            fr: {
              title: 'Comment les machines voient',
              summary:
                'Les images comme grilles de nombres, les filtres qui détectent les bords, le pooling et les couches profondes, et les deux astuces des petits classifieurs d’images\u00a0: l’apprentissage par transfert et l’augmentation de données.',
            },
          },
          estimatedMinutes: 35,
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
                heading: 'Six million numbers and one word',
                body: "Type *dog* into the search bar of your phone's photo gallery and your dog photos appear, although you never labelled a single one. Yet the camera never stored the word *dog*, only numbers: a 1920 × 1080 photo has about two million pixels, each described by three numbers, for red, green and blue. That is more than **six million numbers**, and between them and the word *dog* sits a model.\n\nThis module opens that black box: how an image classifier turns pixels into a prediction, layer by layer, and why that gives it a surprising weakness. It learns whatever clue separates its training labels, which is not always the clue you had in mind. If you tried the no-code route of *Build your first classifier*, you may have met it already: a model trained in front of one background that fails in front of another. In the next lesson, you will cause that failure on purpose, then fix it.",
              },
              fr: {
                heading: 'Six millions de nombres et un seul mot',
                body: 'Tape *chien* dans la barre de recherche de la galerie photo de ton téléphone\u00a0: tes photos de chiens apparaissent, alors que tu n’en as étiqueté aucune. Pourtant, l’appareil n’a jamais enregistré le mot *chien*, seulement des nombres\u00a0: une photo de 1920\u00a0×\u00a01080 compte environ deux millions de pixels, chacun décrit par trois nombres, pour le rouge, le vert et le bleu. Cela fait plus de **six millions de nombres**, et entre eux et le mot *chien*, il y a un modèle.\n\nCe module ouvre cette boîte noire\u00a0: comment un classifieur d’images transforme des pixels en prédiction, couche après couche, et pourquoi cela lui donne une faiblesse surprenante. Il apprend n’importe quel indice qui sépare ses étiquettes d’entraînement, et ce n’est pas toujours celui que tu avais en tête. Si tu as essayé la voie sans code de *Construis ton premier classifieur*, tu l’as peut-être déjà rencontrée\u00a0: un modèle entraîné devant un certain fond qui échoue devant un autre. Dans la prochaine leçon, tu vas provoquer cet échec exprès, puis le corriger.',
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
                heading: 'Pixels, channels and features',
                body: 'To a computer, an image is an **array** of numbers. A **grayscale** image is a grid with one number per pixel, usually from 0 (black) to 255 (white). A **colour** image has three **channels**, red, green and blue: three grids stacked on top of each other. A model that takes 224 × 224 colour images, a common size, reads 150,528 numbers per image.\n\nCould rules on those raw numbers work, such as *"if the pixel at (120, 85) is brown, it is a dog"*? No. Move the dog ten pixels, dim the light or step back, and almost every number changes, although the picture still shows the same dog. What stays stable are **features**: patterns in the numbers, such as edges, corners, textures, colours and shapes.\n\n| Approach | Who designs the features? |\n|---|---|\n| **Classic computer vision** | Engineers write detectors by hand (edges, corners, colour histograms...), then train a classifier, such as a decision tree, on those measurements. |\n| **Deep learning** | A **convolutional neural network** (CNN) learns its own features from labelled examples, from raw pixels all the way to the label. |\n\nDeep learning took over in 2012, when a CNN now known as AlexNet won the ImageNet image-recognition competition by a wide margin.',
              },
              fr: {
                heading: 'Pixels, canaux et caractéristiques',
                body: 'Pour un ordinateur, une image est un **tableau** de nombres. Une image en **niveaux de gris** est une grille avec un nombre par pixel, en général de 0 (noir) à 255 (blanc). Une image en **couleur** a trois **canaux**, rouge, vert et bleu\u00a0: trois grilles empilées. Un modèle qui reçoit des images en couleur de 224\u00a0×\u00a0224 pixels, une taille courante, lit 150\u00a0528 nombres par image.\n\nDes règles sur ces nombres bruts pourraient-elles marcher, du genre *«\u00a0si le pixel situé en (120\u00a0; 85) est marron, c’est un chien\u00a0»*\u00a0? Non. Décale le chien de dix pixels, baisse la lumière ou recule d’un pas\u00a0: presque tous les nombres changent, alors que l’image montre toujours le même chien. Ce qui reste stable, ce sont des **caractéristiques** (*features*)\u00a0: des motifs dans les nombres, comme des bords, des coins, des textures, des couleurs et des formes.\n\n| Approche | Qui conçoit les caractéristiques\u00a0? |\n|---|---|\n| **Vision par ordinateur classique** | Des ingénieurs écrivent des détecteurs à la main (bords, coins, histogrammes de couleurs…), puis entraînent un classifieur, comme un arbre de décision, sur ces mesures. |\n| **Apprentissage profond** | Un **réseau de neurones convolutif** (CNN, pour *convolutional neural network*) apprend lui-même ses caractéristiques à partir d’exemples étiquetés, des pixels bruts jusqu’à l’étiquette. |\n\nL’apprentissage profond s’est imposé en 2012, quand un CNN connu aujourd’hui sous le nom d’AlexNet a remporté le concours de reconnaissance d’images ImageNet avec une large avance.',
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
                heading: 'Convolution, pooling and layers',
                body: "A **filter** (or **kernel**) is a small grid of numbers, often 3 × 3, that slides over the image one position at a time. At each position, the nine pixels under it are multiplied by the nine numbers of the filter and the results are added up. The grid of results is a **feature map**: it shows where the filter's pattern appears. In deep learning, this operation is called a **convolution** (strictly, since the filter is not flipped, mathematicians would call it a cross-correlation).\n\nTake the 3 × 3 filter whose three rows are all `[-1, 0, 1]`. Over a uniform area, its left and right columns cancel out and the result is 0. Where the image goes from dark on the left to bright on the right, the result is large and positive, so this is a **vertical-edge detector**. From bright to dark, the result is negative.\n\n- **ReLU** then turns negative values into 0, so each map only says where its pattern is present.\n- **Max pooling** keeps the largest value of every 2 × 2 window: `[[1, 5, 0, 0], [3, 2, 0, 8], [0, 0, 4, 1], [6, 0, 2, 2]]` becomes `[[5, 8], [6, 4]]`. The network keeps *whether* a pattern is there and *roughly where*, with four times fewer numbers.\n- **Layers** are stacked: the maps of one layer are the input of the next. Visualisations of trained networks, such as a well-known 2014 study by Matthew Zeiler and Rob Fergus, show early layers reacting to edges and blobs of colour, middle layers to textures and simple shapes, and deep layers to object parts such as eyes or wheels. A final layer gives one probability per label.\n\nNobody writes the numbers of these filters: they start random, and training nudges them to make fewer mistakes, like the perceptron's weights in the video of *From rules to learning*. The network keeps whatever features best separate its labels, which are not always the ones a person would use. In 2019, Robert Geirhos and colleagues showed that networks trained on ImageNet rely more on **texture** than on shape: shown the outline of a cat filled with elephant skin, they tend to answer *elephant*.",
              },
              fr: {
                heading: 'Convolution, pooling et couches',
                body: 'Un **filtre** (ou **noyau**, *kernel*) est une petite grille de nombres, souvent de 3\u00a0×\u00a03, que l’on fait glisser sur l’image, une position après l’autre. À chaque position, les neuf pixels situés dessous sont multipliés par les neuf nombres du filtre, puis les résultats sont additionnés. La grille de ces résultats est une **carte de caractéristiques** (*feature map*)\u00a0: elle montre où le motif du filtre apparaît. En apprentissage profond, cette opération s’appelle une **convolution** (au sens strict, comme le filtre n’est pas retourné, les mathématiciens parlent de corrélation croisée).\n\nPrenons le filtre de 3\u00a0×\u00a03 dont les trois lignes valent `[-1, 0, 1]`. Sur une zone uniforme, ses colonnes de gauche et de droite s’annulent et le résultat vaut 0. Là où l’image passe du sombre à gauche au clair à droite, le résultat est grand et positif\u00a0: c’est un **détecteur de bords verticaux**. Du clair vers le sombre, le résultat est négatif.\n\n- La fonction **ReLU** remplace ensuite les valeurs négatives par 0\u00a0: chaque carte dit seulement où son motif est présent.\n- Le **max pooling** garde la plus grande valeur de chaque fenêtre de 2\u00a0×\u00a02\u00a0: `[[1, 5, 0, 0], [3, 2, 0, 8], [0, 0, 4, 1], [6, 0, 2, 2]]` devient `[[5, 8], [6, 4]]`. Le réseau retient *si* un motif est présent et *à peu près où*, avec quatre fois moins de nombres.\n- Les **couches** s’empilent\u00a0: les cartes d’une couche servent d’entrée à la suivante. Les visualisations de réseaux entraînés, comme une étude célèbre de Matthew Zeiler et Rob Fergus en 2014, montrent que les premières couches réagissent aux bords et aux taches de couleur, les couches intermédiaires aux textures et aux formes simples, et les couches profondes à des parties d’objets, comme des yeux ou des roues. Une dernière couche donne une probabilité par étiquette.\n\nPersonne n’écrit les nombres de ces filtres\u00a0: ils partent de valeurs aléatoires, et l’entraînement les ajuste pour faire moins d’erreurs, comme les poids du perceptron dans la vidéo de *Des règles à l’apprentissage*. Le réseau garde les caractéristiques qui séparent le mieux ses étiquettes, et ce ne sont pas toujours celles qu’utiliserait une personne. En 2019, Robert Geirhos et ses collègues ont montré que des réseaux entraînés sur ImageNet s’appuient davantage sur la **texture** que sur la forme\u00a0: devant la silhouette d’un chat remplie de peau d’éléphant, ils ont tendance à répondre *éléphant*.',
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
                heading: 'Two tricks: transfer learning and data augmentation',
                body: 'Training a CNN from scratch takes a huge labelled dataset: the ImageNet competition of 2012 used more than a million labelled training photos in 1,000 categories (the full ImageNet holds over 14 million). Two tricks make small projects possible.\n\n**Transfer learning.** Take a network already trained on a large dataset, keep its layers, which already detect edges, textures and parts, and train only a small new classifier, the last layer or two, on your own labels. Fifty photos per class can then be enough. Teachable Machine relies on this. The catch: your model inherits the blind spots of the original network and the biases of its data.\n\n**Data augmentation.** Create extra training examples by transforming yours: flip them, crop them, rotate them slightly, change the brightness or the colours, add a little blur. The model learns that those changes do not matter. Two rules:\n\n1. **Keep the label true.** Flipping a cat is fine; flipping a road sign with an arrow changes its meaning, and rotating a handwritten *6* by 180° makes a *9*.\n2. **Augment the training set only.** Test on real, untouched examples, and never let copies of one photo land on both sides of the split: that would be the data leakage of *Training, testing and overfitting*, in disguise.\n\nAugmentation also tells the model what to ignore: if colour should not count, random colour changes during training stop it from being a reliable clue, which will matter in the next lesson.',
              },
              fr: {
                heading:
                  'Deux astuces\u00a0: l’apprentissage par transfert et l’augmentation de données',
                body: 'Entraîner un CNN à partir de zéro demande un énorme jeu de données étiquetées\u00a0: le concours ImageNet de 2012 utilisait plus d’un million de photos d’entraînement étiquetées, réparties en 1\u00a0000 catégories (ImageNet complet en compte plus de 14 millions). Deux astuces rendent les petits projets possibles.\n\n**L’apprentissage par transfert** (*transfer learning*). On prend un réseau déjà entraîné sur un grand jeu de données, on garde ses couches, qui détectent déjà les bords, les textures et les parties d’objets, et on n’entraîne qu’un petit classifieur ajouté par-dessus, la ou les dernières couches, sur ses propres étiquettes. Cinquante photos par classe peuvent alors suffire. Teachable Machine repose sur ce principe. Le revers de la médaille\u00a0: ton modèle hérite des angles morts du réseau d’origine et des biais de ses données.\n\n**L’augmentation de données** (*data augmentation*). On fabrique des exemples d’entraînement supplémentaires en transformant les siens\u00a0: les retourner en miroir, les recadrer, les faire légèrement pivoter, changer la luminosité ou les couleurs, ajouter un peu de flou. Le modèle apprend que ces changements ne comptent pas. Deux règles\u00a0:\n\n1. **L’étiquette doit rester juste.** Retourner un chat en miroir ne pose aucun problème\u00a0; retourner en miroir un panneau routier avec une flèche change son sens, et faire pivoter un *6* manuscrit de 180° donne un *9*.\n2. **N’augmente que le jeu d’entraînement.** Teste sur des exemples réels, non modifiés, et ne laisse jamais de copies d’une même photo se retrouver des deux côtés de la séparation\u00a0: ce serait la fuite de données d’*Entraînement, test et surapprentissage*, déguisée.\n\nL’augmentation indique aussi au modèle ce qu’il doit ignorer\u00a0: si la couleur ne doit pas compter, des changements de couleur aléatoires pendant l’entraînement l’empêchent d’être un indice fiable, ce qui comptera dans la prochaine leçon.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Be a convolutional layer, by hand. The program applies a vertical-edge filter to a 5 × 5 grayscale image with a bright square in its bottom-right corner (0 is black and 10 is white, to keep the arithmetic easy). Your code is saved, not run, so trace it yourself:\n\n1. Work out the top-left value of the feature map: write its nine multiplications in a comment.\n2. Work out the whole 3 × 3 map that the loop prints. Where are the largest values, and why is the right-hand column 0?\n3. Complete horizontal_edges so that it reacts to dark above and bright below, and predict its feature map in a comment.\n4. Swap the colours: a dark square on a bright background. What would the vertical filter give, and what would relu leave of it? What does that tell you about the number of filters a network needs?\n5. In a real CNN, who chooses the nine numbers of each filter, and how?',
                hint: 'The top-left window covers rows 0 to 2 and columns 0 to 2, and only one of its nine pixels is bright: which number of the filter sits on it? For the horizontal filter, turn the vertical one a quarter of a turn: which row should be negative?',
              },
              fr: {
                instructions:
                  'Joue le rôle d’une couche de convolution, à la main. Le programme applique un filtre de bords verticaux à une image de 5\u00a0×\u00a05 en niveaux de gris, avec un carré clair dans le coin inférieur droit (0 pour le noir et 10 pour le blanc, pour garder des calculs simples). Ton code est enregistré, pas exécuté\u00a0: suis-le toi-même. Dans le code, les noms sont en anglais\u00a0: vertical_edges est le filtre de bords verticaux, horizontal_edges celui de bords horizontaux, et feature_map la carte de caractéristiques.\n\n1. Calcule la valeur en haut à gauche de la carte de caractéristiques\u00a0: écris ses neuf multiplications dans un commentaire.\n2. Calcule toute la carte de 3\u00a0×\u00a03 qu’affiche la boucle. Où se trouvent les plus grandes valeurs, et pourquoi la colonne de droite vaut-elle 0\u00a0?\n3. Complète horizontal_edges pour qu’il réagisse au sombre en haut et au clair en bas, et prédis sa carte dans un commentaire.\n4. Inverse les couleurs\u00a0: un carré sombre sur un fond clair. Que donnerait le filtre vertical, et que laisserait relu\u00a0? Qu’est-ce que cela t’apprend sur le nombre de filtres dont un réseau a besoin\u00a0?\n5. Dans un vrai CNN, qui choisit les neuf nombres de chaque filtre, et comment\u00a0?',
                hint: 'La fenêtre en haut à gauche couvre les lignes 0 à 2 et les colonnes 0 à 2, et un seul de ses neuf pixels est clair\u00a0: quel nombre du filtre se trouve dessus\u00a0? Pour le filtre horizontal, tourne le filtre vertical d’un quart de tour\u00a0: quelle ligne doit être négative\u00a0?',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# A 5x5 grayscale image: 0 = black, 10 = white (real photos use 0 to 255).',
                '# A bright square fills the bottom-right corner.',
                'image = [',
                '    [0, 0, 0, 0, 0],',
                '    [0, 0, 0, 0, 0],',
                '    [0, 0, 10, 10, 10],',
                '    [0, 0, 10, 10, 10],',
                '    [0, 0, 10, 10, 10],',
                ']',
                '',
                '# Reacts to vertical edges: dark on the left, bright on the right.',
                'vertical_edges = [',
                '    [-1, 0, 1],',
                '    [-1, 0, 1],',
                '    [-1, 0, 1],',
                ']',
                '',
                '# TODO: make it react to horizontal edges: dark above, bright below.',
                'horizontal_edges = [',
                '    [0, 0, 0],',
                '    [0, 0, 0],',
                '    [0, 0, 0],',
                ']',
                '',
                '',
                'def convolve(img, kernel):',
                '    """Slide a square kernel over a square image, one pixel at a time, with no padding."""',
                '    k = len(kernel)',
                '    out_size = len(img) - k + 1  # a 5x5 image and a 3x3 kernel give a 3x3 feature map',
                '    feature_map = []',
                '    for row in range(out_size):',
                '        out_row = []',
                '        for col in range(out_size):',
                '            total = 0',
                '            for i in range(k):',
                '                for j in range(k):',
                '                    total += img[row + i][col + j] * kernel[i][j]',
                '            out_row.append(total)',
                '        feature_map.append(out_row)',
                '    return feature_map',
                '',
                '',
                'def relu(feature_map):',
                '    """Keep the positive values and turn the negative ones into 0."""',
                '    return [[max(0, value) for value in row] for row in feature_map]',
                '',
                '',
                'for row in relu(convolve(image, vertical_edges)):',
                '    print(row)',
                '',
                '# 1. Top-left value, multiplication by multiplication:',
                '# 2. What the loop prints, and why the right-hand column is 0:',
                '# 3. TODO: print the feature map of horizontal_edges and predict it here:',
                '# 4. A dark square on a bright background:',
                '# 5. Who chooses the numbers of a filter, and how?',
              ),
            },
          },
          {
            id: 'm4-l1-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Once you have traced the code, ask the AI tutor to check your numbers. It should point to the first wrong value and give you a hint, not the full answer.',
                starterPrompt:
                  'Check my work without giving me the answers. I applied 3x3 filters (a step of one pixel, no padding) to this 5x5 grayscale image: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 10, 10, 10], [0, 0, 10, 10, 10], [0, 0, 10, 10, 10]]. With the vertical-edge filter [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], my feature map is [paste it]. My horizontal-edge filter is [paste it], and its feature map is [paste it]. If a value is wrong, tell me which one and give me a hint.',
              },
              fr: {
                instructions:
                  'Une fois le code suivi à la main, demande au tuteur IA de vérifier tes nombres. Il doit te montrer la première valeur fausse et te donner un indice, pas la réponse complète.',
                starterPrompt:
                  'Vérifie mon travail sans me donner les réponses. J’ai appliqué des filtres de 3x3 (avec un pas d’un pixel et sans marge) à cette image de 5x5 en niveaux de gris\u00a0: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 10, 10, 10], [0, 0, 10, 10, 10], [0, 0, 10, 10, 10]]. Avec le filtre de bords verticaux [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], ma carte de caractéristiques est [colle-la]. Mon filtre de bords horizontaux est [colle-le], et sa carte est [colle-la]. Si une valeur est fausse, dis-moi laquelle et donne-moi un indice.',
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
                  'Explain to a friend who has never coded how a CNN goes from the pixels of a photo to a label, using the words filter, feature map and layer. Then name one clue a network could rely on that a person would not.',
              },
              fr: {
                prompt:
                  'Explique à un ami qui n’a jamais programmé comment un CNN passe des pixels d’une photo à une étiquette, en utilisant les mots filtre, carte de caractéristiques et couche. Cite ensuite un indice sur lequel un réseau pourrait s’appuyer alors qu’une personne ne le ferait pas.',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Train an image classifier, then fool it',
              summary:
                'Why image models learn shortcuts, why a test set split from the same photos cannot catch them, and how to fix the dataset. Then, on purpose, train a fruit classifier that learns the wrong clue, and repair it.',
            },
            fr: {
              title: 'Entraîne un classifieur d’images, puis trompe-le',
              summary:
                'Pourquoi les modèles d’images apprennent des raccourcis, pourquoi un jeu de test tiré des mêmes photos ne peut pas les repérer, et comment corriger le jeu de données. Puis entraîne exprès un classifieur de fruits qui apprend le mauvais indice, et répare-le.',
            },
          },
          estimatedMinutes: 50,
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
                heading: 'Right answers for the wrong reasons',
                body: "In 2016, the researchers Marco Tulio Ribeiro, Sameer Singh and Carlos Guestrin trained a bad image classifier **on purpose**. It had to tell wolves from huskies, and they picked the training photos so that every wolf stood in snow and no husky did. The model got most of its test photos right, then called a husky in the snow a *wolf*. A tool that shows which parts of an image a decision depends on made the reason plain: the model was looking at the snow, not at the animal.\n\nA much older tale, repeated in AI classes for decades, says that an army's tank detector had really learned the weather: by bad luck, its tank photos had all been shot under grey skies. Nobody has found a record of it, so take it as a legend. The trap it describes is real, though, and today you will set it yourself: you will train a model that learns the wrong clue, catch it in the act, then fix it.",
              },
              fr: {
                heading: 'De bonnes réponses pour de mauvaises raisons',
                body: 'En 2016, les chercheurs Marco Tulio Ribeiro, Sameer Singh et Carlos Guestrin ont entraîné **exprès** un mauvais classifieur d’images. Il devait distinguer les loups des huskies, et ils avaient choisi les photos d’entraînement de sorte que chaque loup soit dans la neige et qu’aucun husky n’y soit. Le modèle a bien classé la plupart de ses photos de test, puis il a pris un husky dans la neige pour un *loup*. Un outil qui montre de quelles parties de l’image dépend une décision a révélé la raison\u00a0: le modèle regardait la neige, pas l’animal.\n\nUne histoire bien plus ancienne, répétée en cours d’IA depuis des décennies, raconte qu’un détecteur de chars militaire avait en réalité appris la météo\u00a0: par malchance, toutes ses photos de chars avaient été prises sous un ciel gris. Personne n’en a retrouvé de trace\u00a0: prends-la comme une légende. Le piège qu’elle décrit est pourtant bien réel, et aujourd’hui tu vas le tendre toi-même\u00a0: tu vas entraîner un modèle qui apprend le mauvais indice, le prendre sur le fait, puis le corriger.',
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
                heading: 'Shortcuts, test sets that differ, and better datasets',
                body: 'A **spurious correlation** is a clue that goes with a label in the training data, because of how the data was collected, but not in the world: snow with wolves, cloudy skies with tanks. **Shortcut learning** is a model relying on such a clue. The model is not cheating: training only rewards fewer mistakes on the training examples, the model cannot know which clue you *meant*, and easy clues (a colour, a background, the lighting, the image quality, a text label in a corner) are often picked up first.\n\n| Task | Intended clue | Shortcut |\n|---|---|---|\n| Wolf or husky (2016, on purpose) | The animal | Snow |\n| Pneumonia on chest X-rays (Zech and colleagues, 2018) | The lungs | Signs of which hospital took the X-ray, in hospitals with different pneumonia rates; the models were often less accurate at a hospital outside their training data |\n| Apple or tomato (this lesson) | Shape, stalk, leaves | Colour |\n\n**Why the test set must differ.** Split one photo collection at random and the test photos share the shortcut, so a shortcut model scores just as well on them: the score hides the mistake. This is not the overfitting of *Training, testing and overfitting*: an overfitted model does well on its training data and badly on a random test split, while a shortcut model does well on both and fails only when the clue and the label part ways. To catch a shortcut, test on data from another source, place, camera or time, and on **counterexamples**, in which the suspected clue points the wrong way: red apples, green tomatoes, a husky in the snow. Then study the errors, not only the score: what they have in common is your suspect. Splitting results by condition is also the method of the group-by-group audit you will run in *Bias audits and model cards*, where the groups are people.\n\n**How to fix the dataset.**\n\n1. **Break the correlation:** every clue that is not the answer must appear in every label (both colours, every background, every kind of lighting).\n2. **Balance it,** with varied sources and augmentations that make the false clue useless.\n3. **Test again** on the same counterexamples, kept out of training, and write down what you did not test.\n\nAnother way to fool a model is an attack. In 2014, Ian Goodfellow and colleagues added carefully computed noise, too faint for people to notice, to a photo of a panda, and a network answered *gibbon* with very high confidence. Such **adversarial examples** are deliberate, while a shortcut is a flaw in the data. Both show that a model does not see the way you do.',
              },
              fr: {
                heading: 'Raccourcis, jeux de test différents et meilleurs jeux de données',
                body: 'Une **corrélation fallacieuse** (*spurious correlation*) est un indice qui accompagne une étiquette dans les données d’entraînement, à cause de la façon dont elles ont été collectées, mais pas dans le monde réel\u00a0: la neige avec les loups, le ciel couvert avec les chars. L’**apprentissage par raccourci** (*shortcut learning*), c’est le fait, pour un modèle, de s’appuyer sur un tel indice. Le modèle ne triche pas\u00a0: l’entraînement récompense seulement le fait de faire moins d’erreurs sur les exemples d’entraînement, le modèle ne peut pas savoir quel indice tu *voulais*, et les indices faciles (une couleur, un fond, l’éclairage, la qualité de l’image, un texte dans un coin) sont souvent repérés en premier.\n\n| Tâche | Indice voulu | Raccourci |\n|---|---|---|\n| Loup ou husky (2016, exprès) | L’animal | La neige |\n| Pneumonie sur des radios du thorax (Zech et ses collègues, 2018) | Les poumons | Des signes de l’hôpital qui avait fait la radio, dans des hôpitaux aux taux de pneumonie différents\u00a0; les modèles étaient souvent moins fiables dans un hôpital absent de leurs données d’entraînement |\n| Pomme ou tomate (cette leçon) | La forme, la queue, les feuilles | La couleur |\n\n**Pourquoi le jeu de test doit être différent.** Sépare au hasard une même collection de photos\u00a0: les photos de test partagent le raccourci, et un modèle à raccourci obtient un aussi bon score sur elles. Le score cache l’erreur. Ce n’est pas le surapprentissage d’*Entraînement, test et surapprentissage*\u00a0: un modèle en surapprentissage réussit sur ses données d’entraînement et échoue sur un jeu de test tiré au hasard, alors qu’un modèle à raccourci réussit sur les deux et n’échoue que lorsque l’indice et l’étiquette se séparent. Pour repérer un raccourci, teste sur des données venant d’une autre source, d’un autre lieu, d’un autre appareil ou d’un autre moment, et sur des **contre-exemples**, où l’indice suspect mène à la mauvaise réponse\u00a0: des pommes rouges, des tomates vertes, un husky dans la neige. Étudie ensuite les erreurs, pas seulement le score\u00a0: leur point commun est ton suspect. Découper les résultats par condition, c’est aussi la méthode de l’audit groupe par groupe que tu mèneras dans *Audits de biais et fiches de modèle*, où les groupes sont des personnes.\n\n**Comment corriger le jeu de données.**\n\n1. **Casse la corrélation\u00a0:** chaque indice qui n’est pas la réponse doit apparaître dans chaque étiquette (les deux couleurs, tous les fonds, tous les éclairages).\n2. **Équilibre-le,** avec des sources variées et des augmentations qui rendent le faux indice inutile.\n3. **Teste à nouveau** avec les mêmes contre-exemples, gardés hors de l’entraînement, et note ce que tu n’as pas testé.\n\nOn peut aussi tromper un modèle par une attaque. En 2014, Ian Goodfellow et ses collègues ont ajouté à la photo d’un panda un bruit calculé avec soin, trop faible pour qu’on le remarque, et un réseau a répondu *gibbon*, avec une très grande confiance. Ces **exemples contradictoires** (*adversarial examples*) sont délibérés, alors qu’un raccourci est un défaut des données. Les deux montrent qu’un modèle ne voit pas comme toi.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b3',
            type: 'ml_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Fooled: a fruit classifier that learns the wrong clue',
                instructions:
                  "**Goal:** train a model to tell apples from tomatoes on a training set that is biased on purpose (every apple green, every tomato red), let a Scratch test reveal what it really learned, then fix the dataset and test again. The big idea: a model learns whatever separates its training labels.\n\n**Your photos:** fruit only, with no people, hands, names or text in them, from an image search your teacher approves. If searching is blocked, your teacher may let you use the webcam on real fruit, with nobody in the frame.\n\n1. Open Machine Learning for Kids with the button below and choose **Try it now**. Skip the worksheet's log-in steps.\n2. Create a project named *fooled* that recognises **images**, with the worksheet's two labels, *apple* and *tomato*, so that its Scratch template matches.\n3. Make the mistake on purpose: in **Train**, add at least **ten green apples** to *apple* and at least **ten red tomatoes** to *tomato*. Write down which clue you expect the model to learn.\n4. In **Learn & Test**, train the model. It can take a few minutes.\n5. In **Make**, open Scratch 3, then the worksheet's *Fooled* template from the **Project templates** menu. Follow the official worksheet (PDF) to connect your model and run the test. Note the number of mistakes and which photos were sorted wrongly, then save the Scratch project to your computer. Before you change anything, take a screenshot of your training set and one of the test run with its mistake count.\n6. Fix the dataset: add red apples and green tomatoes until each label has about as many fruits of each colour. Do not add any photo you saw in the Scratch test: it must stay out of training. Then train again and run the same test again.\n7. Take the same two screenshots after the fix.",
                bringBack:
                  'For the project below: your screenshots (both training sets, both test runs), the clue you think the first model relied on and the errors that support it, and the change you made to the dataset with its result.',
                hint: 'Drag and drop only works between two windows of the same browser. A photo will not drop? Try another one. Try it now keeps one project at a time: delete any project left from an earlier lesson once its work is handed in. Short of time? The first training and its test run are the heart of the hand-in.',
              },
              fr: {
                title: 'Trompé\u00a0: un classifieur de fruits qui apprend le mauvais indice',
                instructions:
                  '**Objectif\u00a0:** entraîner un modèle à distinguer les pommes des tomates avec un jeu d’entraînement biaisé exprès (toutes les pommes vertes, toutes les tomates rouges), laisser un test dans Scratch révéler ce qu’il a vraiment appris, puis corriger le jeu de données et tester à nouveau. La grande idée\u00a0: un modèle apprend n’importe quel indice qui sépare ses étiquettes d’entraînement.\n\n**Tes photos\u00a0:** des photos de fruits uniquement (sans personne, ni main, ni nom, ni texte), trouvées avec une recherche d’images approuvée par ton enseignant. Si la recherche est bloquée, ton enseignant peut t’autoriser à utiliser la webcam sur de vrais fruits, sans personne dans le champ.\n\n1. Ouvre Machine Learning for Kids avec le bouton ci-dessous et choisis **Essayer maintenant** (*Try it now*). Saute les étapes de connexion de la fiche.\n2. Crée un projet nommé *fooled* qui reconnaît des **images**, avec les deux étiquettes de la fiche, *apple* (pomme) et *tomato* (tomate), pour que le gabarit Scratch de la fiche corresponde.\n3. Fais l’erreur exprès\u00a0: dans **Entraîner** (*Train*), ajoute au moins **dix pommes vertes** à *apple* et au moins **dix tomates rouges** à *tomato*. Note l’indice que le modèle va apprendre selon toi.\n4. Dans **Apprendre & Tester** (*Learn & Test*), entraîne le modèle. Cela peut prendre quelques minutes.\n5. Dans **Faire** (*Make*), ouvre Scratch 3, puis le gabarit *Fooled* de la fiche dans le menu **Modèles de projets** (*Project templates*). Suis la fiche officielle (PDF) pour brancher ton modèle et lancer le test. Note le nombre d’erreurs et les photos mal classées, puis enregistre le projet Scratch sur ton ordinateur. Avant de modifier quoi que ce soit, fais une capture d’écran de ton jeu d’entraînement et une du test avec son nombre d’erreurs.\n6. Corrige le jeu de données\u00a0: ajoute des pommes rouges et des tomates vertes jusqu’à ce que chaque étiquette compte à peu près autant de fruits de chaque couleur. N’ajoute aucune photo vue dans le test Scratch\u00a0: elle doit rester hors de l’entraînement. Entraîne ensuite à nouveau et relance le même test.\n7. Fais les deux mêmes captures après la correction.',
                bringBack:
                  'Pour le projet ci-dessous\u00a0: tes captures d’écran (les deux jeux d’entraînement, les deux tests), l’indice sur lequel le premier modèle s’est appuyé selon toi et les erreurs qui le montrent, et la modification apportée au jeu de données avec son résultat.',
                hint: 'Le glisser-déposer ne fonctionne qu’entre deux fenêtres du même navigateur. Une photo refuse de se déposer\u00a0? Essaies-en une autre. «\u00a0Essayer maintenant\u00a0» ne garde qu’un projet à la fois\u00a0: supprime celui d’une leçon précédente, une fois son travail rendu. Pas assez de temps\u00a0? Le premier entraînement et son test sont le cœur de ton travail à rendre.',
              },
            },
            data: {
              url: 'https://machinelearningforkids.co.uk/#!/login',
              worksheetUrl:
                'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/worksheet-fooled.pdf',
              projectType: 'images',
              codeTool: 'scratch',
              access: 'try_it_now',
            },
          },
          {
            id: 'm4-l2-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'No website? Run the experiment on paper',
                body: 'Site blocked at your school? Run the same experiment with cards and a partner.\n\n1. Make **8 training cards**: 4 green apples and 4 red tomatoes. On each one, draw or write four features: colour; top (a short brown stalk for an apple, a green star of small leaves for a tomato); size (small, medium or large); background (plate, table or grass). Give both labels the same mix of sizes and backgrounds, and write the label on the back.\n2. Your partner is a lazy model: it checks the features in a fixed order (colour, size, background, top) and keeps the **first** one that sorts every training card correctly. Which rule does it keep?\n3. Make **6 new test cards** with the same four features and the label on the back: 2 red apples, 2 green tomatoes, 1 green apple and 1 red tomato (a stalk on every apple, leaves on every tomato). Run the model and count its mistakes.\n4. Fix the deck: recolour 2 apples red and 2 tomatoes green. Which rule does the model keep now? Run the same test again.\n5. Record both runs in a table: card, true label, prediction, right or wrong.\n\nReal networks do not check features one by one, but they too tend to grab the simplest clue that separates their labels. For the project, type your table or photograph your cards, with only the cards in the picture.',
              },
              fr: {
                heading: 'Pas de site\u00a0? Fais l’expérience sur papier',
                body: 'Le site est bloqué dans ton établissement\u00a0? Fais la même expérience avec des cartes et un partenaire.\n\n1. Fabrique **8 cartes d’entraînement**\u00a0: 4 pommes vertes et 4 tomates rouges. Sur chacune, dessine ou écris quatre caractéristiques\u00a0: la couleur\u00a0; le haut du fruit (une petite queue brune pour une pomme, une étoile de petites feuilles vertes pour une tomate)\u00a0; la taille (petite, moyenne ou grande)\u00a0; le fond (assiette, table ou herbe). Donne aux deux étiquettes le même mélange de tailles et de fonds, et écris l’étiquette au dos.\n2. Ton partenaire joue un modèle paresseux\u00a0: il examine les caractéristiques dans un ordre fixe (couleur, taille, fond, haut du fruit) et garde la **première** qui classe correctement toutes les cartes d’entraînement. Quelle règle garde-t-il\u00a0?\n3. Fabrique **6 nouvelles cartes de test**, avec les quatre mêmes caractéristiques et l’étiquette au dos\u00a0: 2 pommes rouges, 2 tomates vertes, 1 pomme verte et 1 tomate rouge (une queue sur chaque pomme, des feuilles sur chaque tomate). Fais tourner le modèle et compte ses erreurs.\n4. Corrige le paquet\u00a0: colorie 2 pommes en rouge et 2 tomates en vert. Quelle règle le modèle garde-t-il maintenant\u00a0? Refais le même test.\n5. Note les deux essais dans un tableau\u00a0: carte, vraie étiquette, prédiction, juste ou faux.\n\nLes vrais réseaux n’examinent pas les caractéristiques une par une, mais eux aussi ont tendance à saisir l’indice le plus simple qui sépare leurs étiquettes. Pour le projet, tape ton tableau au clavier ou photographie tes cartes, sans rien d’autre dans le cadre.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b5',
            type: 'project',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Hand in your shortcut report here: your screenshots, the shortcut and the evidence for it, and your dataset fix. Take your screenshots before you close the site; you can type parts 2 to 4 and take the quiz afterwards. Your teacher has the final word on the review.',
              },
              fr: {
                intro:
                  'Rends ici ton rapport sur le raccourci\u00a0: tes captures d’écran, le raccourci et les preuves qui l’appuient, et ta correction du jeu de données. Fais tes captures avant de fermer le site\u00a0; tu peux taper les parties 2 à 4 et faire le quiz ensuite. C’est ton enseignant qui a le dernier mot sur l’évaluation.',
              },
            },
            data: { projectId: 'project-m4' },
          },
          {
            id: 'm4-l2-b6',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about how image models see, why they take shortcuts and how to catch them.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur la façon dont voient les modèles d’images, sur les raccourcis qu’ils prennent et sur la manière de les repérer.',
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
                  "Think of an image model that makes decisions about people or their safety: a skin-condition app, a car's pedestrian detector, a camera that checks that workers wear helmets... Name one shortcut it could learn from its training photos, who would be harmed if it did, and the test that would reveal it.",
              },
              fr: {
                prompt:
                  'Pense à un modèle d’images qui prend des décisions sur des personnes ou sur leur sécurité\u00a0: une appli qui examine la peau, le détecteur de piétons d’une voiture, une caméra qui vérifie que des ouvriers portent un casque… Cite un raccourci qu’il pourrait apprendre de ses photos d’entraînement, qui en subirait les conséquences, et le test qui le révélerait.',
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
            title: 'Check: computer vision',
            instructions:
              'Seven questions on how image models see, the shortcuts they learn and how to catch them. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: vision par ordinateur',
            instructions:
              'Sept questions sur la façon dont voient les modèles d’images, les raccourcis qu’ils apprennent et la manière de les repérer. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'The vertical-edge filter [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] is placed on a 3 × 3 patch of an image in which every pixel has the value 7. What value does it give?',
              },
              fr: {
                prompt:
                  'Le filtre de bords verticaux [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] est placé sur une zone de 3\u00a0×\u00a03 pixels d’une image où chaque pixel vaut 7. Quelle valeur donne-t-il\u00a0?',
              },
            },
            options: [
              { id: 'a', translations: { en: { text: '63' }, fr: { text: '63' } } },
              { id: 'b', translations: { en: { text: '0' }, fr: { text: '0' } } },
              { id: 'c', translations: { en: { text: '21' }, fr: { text: '21' } } },
              { id: 'd', translations: { en: { text: '-7' }, fr: { text: '-7' } } },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Each row gives -7 + 0 + 7 = 0, so the total is 0. A uniform patch contains no edge, which is why an edge filter stays silent there. 63 is the sum of the pixels, not the output of the filter.',
              },
              fr: {
                text: 'Chaque ligne donne -7 + 0 + 7 = 0, donc le total vaut 0. Une zone uniforme ne contient aucun bord\u00a0: c’est pourquoi un filtre de bords y reste muet. 63 est la somme des pixels, pas la sortie du filtre.',
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
                  'A layer applies 2 × 2 max pooling to the feature map [[0, 4, 1, 3], [2, 2, 0, 8], [5, 0, 0, 2], [3, 0, 6, 0]]. What comes out?',
              },
              fr: {
                prompt:
                  'Une couche applique un max pooling de 2\u00a0×\u00a02 à la carte de caractéristiques [[0, 4, 1, 3], [2, 2, 0, 8], [5, 0, 0, 2], [3, 0, 6, 0]]. Qu’obtient-on\u00a0?',
              },
            },
            options: [
              { id: 'a', translations: { en: { text: '[[8]]' }, fr: { text: '[[8]]' } } },
              {
                id: 'b',
                translations: {
                  en: { text: '[[2, 3], [2, 2]]' },
                  fr: { text: '[[2, 3], [2, 2]]' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: '[[4, 8], [5, 6]]' },
                  fr: { text: '[[4, 8], [5, 6]]' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'The same 4 × 4 map, with its negative values set to 0' },
                  fr: {
                    text: 'La même carte de 4\u00a0×\u00a04, avec ses valeurs négatives remplacées par 0',
                  },
                },
              },
            ],
            correctOptionIndexes: [2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Max pooling keeps the largest value of each 2 × 2 window: 4, 8, 5 and 6. The map shrinks to 2 × 2 but still says where each pattern was strongest. [[2, 3], [2, 2]] are the averages (average pooling), and setting negative values to 0 is ReLU.',
              },
              fr: {
                text: 'Le max pooling garde la plus grande valeur de chaque fenêtre de 2\u00a0×\u00a02\u00a0: 4, 8, 5 et 6. La carte passe à 2\u00a0×\u00a02 mais indique toujours où chaque motif était le plus fort. [[2, 3], [2, 2]] sont les moyennes (average pooling), et remplacer les valeurs négatives par 0, c’est la fonction ReLU.',
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
                  'Teachable Machine can train a usable image classifier from about fifty photos per class in a few seconds. What makes this possible?',
              },
              fr: {
                prompt:
                  'Teachable Machine peut entraîner un classifieur d’images utilisable avec une cinquantaine de photos par classe, en quelques secondes. Qu’est-ce qui rend cela possible\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'It reuses a network already trained on a large photo collection and trains only a small new classifier on top for your classes',
                  },
                  fr: {
                    text: 'Il réutilise un réseau déjà entraîné sur une grande collection de photos et n’entraîne qu’un petit classifieur ajouté par-dessus pour tes classes',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'It copies similar photos from the internet and adds them to yours' },
                  fr: {
                    text: 'Il copie des photos semblables sur Internet et les ajoute aux tiennes',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Fifty photos per class are always enough to train a convolutional network from scratch',
                  },
                  fr: {
                    text: 'Cinquante photos par classe suffisent toujours pour entraîner un réseau convolutif à partir de zéro',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'It does not learn anything: it compares your photos pixel by pixel',
                  },
                  fr: { text: 'Il n’apprend rien\u00a0: il compare tes photos pixel par pixel' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'This is transfer learning: the reused layers already detect edges, textures and parts, so only the new final layers have to learn your labels. The new model also inherits the blind spots of the original network.',
              },
              fr: {
                text: 'C’est l’apprentissage par transfert\u00a0: les couches réutilisées détectent déjà les bords, les textures et les parties d’objets, si bien que seules les nouvelles couches finales doivent apprendre tes étiquettes. Le nouveau modèle hérite aussi des angles morts du réseau d’origine.',
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
                  'A team trains a classifier of handwritten digits and adds augmented copies of its training images. Which augmentation is a mistake?',
              },
              fr: {
                prompt:
                  'Une équipe entraîne un classifieur de chiffres manuscrits et ajoute des copies transformées de ses images d’entraînement. Quelle transformation est une erreur\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Shifting each digit by a few pixels' },
                  fr: { text: 'Décaler chaque chiffre de quelques pixels' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Rotating each digit by 180°' },
                  fr: { text: 'Faire pivoter chaque chiffre de 180°' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Making the ink slightly lighter or darker' },
                  fr: { text: 'Rendre l’encre légèrement plus claire ou plus foncée' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Rotating each digit by up to 10°' },
                  fr: { text: 'Faire pivoter chaque chiffre de 10° au plus' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'An augmentation must keep the label true. Turned upside down, a 6 looks like a 9 and a 9 like a 6, so those copies would teach the model wrong labels. Small shifts, small rotations and changes of brightness leave the digit the same.',
              },
              fr: {
                text: 'Une transformation ne doit pas rendre l’étiquette fausse. Pivoté de 180°, un 6 ressemble à un 9 et un 9 à un 6\u00a0: ces copies apprendraient donc de fausses étiquettes au modèle. De petits décalages, de petites rotations et des changements de luminosité laissent le chiffre identique.',
              },
            },
          },
          {
            id: 'q5',
            type: 'true_false',
            points: 1,
            translations: {
              en: {
                prompt:
                  'A model scores 98% on a test set of photos picked at random from the same collection as its training photos. This proves that it has learned the object and not a shortcut.',
              },
              fr: {
                prompt:
                  'Un modèle obtient 98\u00a0% sur un jeu de test composé de photos tirées au hasard de la même collection que ses photos d’entraînement. Cela prouve qu’il a appris l’objet et non un raccourci.',
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
                text: 'False. Photos from the same collection share its accidents: the same backgrounds, lighting and colours. A shortcut model scores just as well on them. Only data that differs, and counterexamples in which the suspected clue points the wrong way, can reveal a shortcut.',
              },
              fr: {
                text: 'Faux. Des photos de la même collection en partagent les particularités\u00a0: mêmes fonds, même éclairage, mêmes couleurs. Un modèle à raccourci obtient un aussi bon score sur elles. Seules des données différentes, et des contre-exemples où l’indice suspect mène à la mauvaise réponse, peuvent révéler un raccourci.',
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
                  'Your apple-or-tomato model was trained on green apples and red tomatoes only, and it calls every red apple a tomato. Which steps help you fix it and check the fix? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Ton modèle «\u00a0pomme ou tomate\u00a0» a été entraîné uniquement sur des pommes vertes et des tomates rouges, et il prend chaque pomme rouge pour une tomate. Quelles étapes t’aident à le corriger et à vérifier la correction\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'Adding red apples to the apple label and green tomatoes to the tomato label',
                  },
                  fr: {
                    text: 'Ajouter des pommes rouges à l’étiquette «\u00a0apple\u00a0» et des tomates vertes à l’étiquette «\u00a0tomato\u00a0»',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Adding many more photos of green apples and red tomatoes' },
                  fr: {
                    text: 'Ajouter beaucoup plus de photos de pommes vertes et de tomates rouges',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Giving both labels about as many fruits of each colour' },
                  fr: {
                    text: 'Donner aux deux étiquettes à peu près autant de fruits de chaque couleur',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'Keeping some red apples and green tomatoes out of training, to test the new model',
                  },
                  fr: {
                    text: 'Garder des pommes rouges et des tomates vertes hors de l’entraînement, pour tester le nouveau modèle',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: 'Removing every photo in which the fruit is red' },
                  fr: { text: 'Retirer toutes les photos où le fruit est rouge' },
                },
              },
              {
                id: 'f',
                translations: {
                  en: { text: 'Training for longer on the same photos' },
                  fr: { text: 'Entraîner plus longtemps sur les mêmes photos' },
                },
              },
            ],
            correctOptionIndexes: [0, 2, 3],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'To break the shortcut, colour must stop separating the labels: both colours in both labels, in similar numbers. Counterexamples kept out of training then show whether the fix worked. More photos of the same kind, or longer training on them, only reinforces the shortcut, and removing the red fruit leaves no tomatoes at all.',
              },
              fr: {
                text: 'Pour casser le raccourci, la couleur doit cesser de séparer les étiquettes\u00a0: les deux couleurs dans les deux étiquettes, en nombres proches. Des contre-exemples gardés hors de l’entraînement montrent ensuite si la correction a marché. Ajouter d’autres photos du même genre, ou entraîner plus longtemps sur elles, ne fait que renforcer le raccourci, et retirer les fruits rouges ne laisse plus aucune tomate.',
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
                  'What is it called when a model relies on a clue that happens to go with the label in its training data, such as snow behind wolves, instead of the real thing? (one to three words)',
              },
              fr: {
                prompt:
                  'Comment appelle-t-on le fait qu’un modèle s’appuie sur un indice qui accompagne par hasard l’étiquette dans ses données d’entraînement, comme la neige derrière les loups, au lieu de ce qui compte vraiment\u00a0? (en un à trois mots, en français ou en anglais)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'shortcut learning',
                'learning shortcuts',
                'learning a shortcut',
                'taking a shortcut',
                'shortcut',
                'shortcuts',
                'a shortcut',
                'spurious correlations',
                'spurious correlation',
                'a spurious correlation',
              ],
              // Ten per language at most. French learners are also graded against the English
              // list, so English answers need no French entry. The apostrophe is spelt both
              // ways because grading does not fold ’ into '.
              fr: [
                'apprentissage par raccourci',
                'l’apprentissage par raccourci',
                "l'apprentissage par raccourci",
                'apprentissage par raccourcis',
                'raccourci',
                'un raccourci',
                'raccourcis',
                'corrélation fallacieuse',
                'corrélation trompeuse',
                'fausse corrélation',
              ],
            },
            explanation: {
              en: {
                text: 'Shortcut learning, based on a spurious correlation: a clue that goes with the label in the training data but not in the world. The model is right for the wrong reason until the clue and the label part ways.',
              },
              fr: {
                text: 'L’apprentissage par raccourci (shortcut learning), fondé sur une corrélation fallacieuse\u00a0: un indice qui accompagne l’étiquette dans les données d’entraînement, mais pas dans le monde réel. Le modèle a raison pour de mauvaises raisons, jusqu’au jour où l’indice et l’étiquette se séparent.',
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
            title: 'Fooled: the shortcut report',
            brief:
              'Train an apple-or-tomato classifier on a dataset that is biased on purpose (every apple green, every tomato red), show which shortcut it learned and the evidence for it, then fix the dataset and test again. Write it up like a developer investigating a failure: a claim, the evidence, a fix and its result. Use photos of fruit only, with no people, names or text in them. If the website does not work at your school, do the paper version of the lesson instead and report on your cards.',
            requirements:
              'Hand in four things:\n1. Screenshots: your first training set and the Scratch test with its mistake count, then the same after your fix (for the paper version, a photo of your cards and your results table, or the table typed out).\n2. The shortcut and the evidence, in three to five sentences: which clue the first model relied on, which test photos it got wrong and what they have in common, and why this evidence points to that clue rather than another one, such as the background or the size. If the first model made few or no mistakes, say so honestly, list what it got right, and suggest which clue (for example the leaves or the stalk) let it resist the shortcut.\n3. Your dataset fix: what you changed in each label (how many fruits of each colour) and the mistake count after the fix. If you could not run the second test, say so and explain what you expect: never write down a result you did not observe.\n4. What is left: one shortcut that could still hide in your new dataset (for example, every tomato photographed on a white plate) and the counterexample test that would reveal it, plus one sentence on why a test set taken from your own training photos would not have caught the first shortcut.\nYou can type parts 2 to 4. Check that your screenshots and photos show no names, faces, hands or other personal details.\nHow it is assessed: Understanding (shortcut learning and test-set design, explained with your own evidence); Technical quality (a trained model, before-and-after results, a precise fix); Responsible use of AI (fruit-only photos, honest results, the limits of your fix stated); Creativity (well-chosen counterexamples and a sharp final test).',
          },
          fr: {
            title: 'Trompé\u00a0: le rapport sur le raccourci',
            brief:
              'Entraîne un classifieur pomme ou tomate sur un jeu de données biaisé exprès (toutes les pommes vertes, toutes les tomates rouges), montre quel raccourci il a appris et les preuves qui l’appuient, puis corrige le jeu de données et teste à nouveau. Rédige ton rapport comme un développeur qui enquête sur une panne\u00a0: une affirmation, des preuves, une correction et son résultat. N’utilise que des photos de fruits, sans personne, ni nom, ni texte. Si le site ne fonctionne pas dans ton établissement, fais plutôt la version sur papier de la leçon et présente les résultats de tes cartes.',
            requirements:
              'Rends quatre choses\u00a0:\n1. Des captures d’écran\u00a0: ton premier jeu d’entraînement et le test dans Scratch avec son nombre d’erreurs, puis la même chose après ta correction (pour la version sur papier, une photo de tes cartes et de ton tableau de résultats, ou le tableau tapé au clavier).\n2. Le raccourci et les preuves, en trois à cinq phrases\u00a0: sur quel indice le premier modèle s’est appuyé, quelles photos de test il a mal classées et ce qu’elles ont en commun, et pourquoi ces preuves désignent cet indice plutôt qu’un autre, comme le fond ou la taille. Si le premier modèle a fait peu d’erreurs ou aucune, dis-le honnêtement, indique ce qu’il a bien classé et propose l’indice (par exemple les feuilles ou la queue) qui lui a permis de résister au raccourci.\n3. Ta correction du jeu de données\u00a0: ce que tu as changé dans chaque étiquette (combien de fruits de chaque couleur) et le nombre d’erreurs après la correction. Si tu n’as pas pu faire le second test, dis-le et explique ce à quoi tu t’attends\u00a0: ne note jamais un résultat que tu n’as pas observé.\n4. Ce qui reste\u00a0: un raccourci qui pourrait encore se cacher dans ton nouveau jeu de données (par exemple, toutes les tomates photographiées sur une assiette blanche) et le test avec des contre-exemples qui le révélerait, plus une phrase qui explique pourquoi un jeu de test tiré de tes propres photos d’entraînement n’aurait pas repéré le premier raccourci.\nTu peux taper les parties 2 à 4 au clavier. Vérifie qu’on ne voit sur tes captures et tes photos ni nom, ni visage, ni main, ni aucune autre information personnelle.\nCritères d’évaluation\u00a0: Compréhension (l’apprentissage par raccourci et la conception du jeu de test, expliqués avec tes propres preuves)\u00a0; Qualité technique (un modèle entraîné, des résultats avant et après, une correction précise)\u00a0; Usage responsable de l’IA (des photos de fruits uniquement, des résultats honnêtes, les limites de ta correction indiquées)\u00a0; Créativité (des contre-exemples bien choisis et un test final pertinent).',
          },
        },
        allowedSubmissionTypes: ['text', 'image', 'pdf'],
        rubric: [
          { key: 'understanding', weight: 40 },
          { key: 'technicalQuality', weight: 30 },
          { key: 'responsibleAi', weight: 20 },
          { key: 'creativity', weight: 10 },
        ],
        xpReward: 150,
        requiredForCertificate: false,
      },
    },
  ],
};
