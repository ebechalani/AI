// Module m1 of "AI Engineering with Python" (ages 14-16): Python for AI. It opens the course and
// the ai-engineer pathway, so it refers back to nothing; it ends where m2 (machine learning
// basics) starts, with a clean table whose columns become features and a label. Later modules:
// m3 language and vision, m4 APIs and automation, m5 the engineering challenge (the final
// project, required for the certificate).
// m1-l1: values and types (int, float, str, bool, None), variables, = and ==, /, // and %,
// conversions, f-strings; lists (indexes from 0, -1, len, append, in), dictionaries (keys, .get
// with a default, .items), for loops and the accumulator, if/elif/else, functions (parameters,
// return versus print, None); reading a traceback from the bottom up, with a table of eight
// common errors (the example traceback is the real Python 3.13 one, with its ~~~^~~~ line).
// The watch stage is a worked trace table: no curated video in the course files is about Python.
// Then two Python code activities to trace by hand. "Be the interpreter" prints 18.521.0, 3,
// [18.5, 21.0, 20.5], <class 'str'> <class 'float'>, 20.0, C, unknown, 20.5, then stops on
// IndexError: list index out of range; with "19.0" appended, the line marked # 5 gives 19.75.
// The build activity (count_labels, most_common, share on 8 drawing labels) gives {'cat': 4,
// 'dog': 2, 'bird': 2}, cat and "50% of the drawings are cats" once completed; its starter
// prints {}, None and 0%. A hint-mode tutor activity sits between the two.
// m1-l2: tables as rows (examples) and columns, CSV, csv.DictReader with open(newline="",
// encoding="utf-8") (newline="" as the csv documentation recommends), every value a string and an
// empty cell "", why not split on commas; the four usual problems (missing values, duplicates,
// units and formats, typos and inconsistent labels), three rules (never edit the raw file, count
// what you change, do not delete what you dislike) and why it matters for AI (fake classes,
// duplicates on both sides of a train/test split, mixed units, dropped rows that belong to one
// group); count, min, max, range, mean, median, shown on another invented week (8.0, 9.5, 12.0,
// 10.0 and 14.5: mean 10.8, median 10.0) so that the paper task keeps its answers. One invented
// dataset runs through the lesson: a week of a school roof weather station, 8 rows with a
// duplicate, a missing temperature (row 4, rain "no"), 54.5 F (12.5 C), a unit "c", a label
// " Yes" and a label "?" (row 8, 13.0 C). A spreadsheet AVERAGE of its seven numbers gives 17.5
// (their median is 11.0). The rows a model predicting rain from the temperature can use (a
// temperature and a yes/no label) are 9.5, 11.0, 12.5, 10.5 and 13.0 C: mean 11.3, median 11.0,
// rain yes 3 and no 2. For the week's temperature alone, row 8 counts too (6 values, mean
// 69.5 / 6 = 11.58, median 11.75), and row 4 is still a dry day (3 rainy, 3 dry, 1 with no
// label): what you keep depends on the purpose, which the paper task asks and the build activity
// answers. The blocks: a paper cleaning task (try), a check_my_work tutor activity (not in the
// outline: added so that the lesson has its ask_ai stage), the Python code activity (build: as
// given it prints 8 rows read, the first row, 6 clean rows, min 9.5 max 54.5 and mean 18.58; with
// TODO 1 and 2 done, 5 clean rows, max 13.0 and mean 11.3; the learner pastes count_labels from
// m1-l1 above TODO 4), the module quiz quiz-m1 and a reflection. Its data sits in a string read
// through io.StringIO, so that the program runs later without a file. In the instructions, "the
// line marked # 5" is the line with the comment "# 5.", not the fifth line of the code.
// Every output above was checked by running the code, and a solution of each TODO, with Python
// 3.13. The instructions and hints of code_activity and ai_activity blocks, reflection prompts
// and quiz prompts are plain text (the player renders no Markdown there, and quiz prompts lose
// leading spaces), so they use no backticks and no indented code. No Machine Learning for Kids
// activity in this module (the outline gives none), hence no project block. No personal data:
// every dataset is invented (plants, drawing labels, weather readings).

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
          title: 'Python for AI',
          description:
            'The Python you need for data and AI: values, lists, dictionaries, loops and functions, then reading, cleaning and summarising a table of data.',
        },
        fr: {
          title: 'Python pour l’IA',
          description:
            'Le Python dont tu as besoin pour les données et l’IA\u00a0: valeurs, listes, dictionnaires, boucles et fonctions, puis lire, nettoyer et résumer un tableau de données.',
        },
      },
    },
    lessons: [
      // --- m1-l1: Python essentials for data -----------------------------------------------------
      {
        id: 'm1-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Python essentials for data',
              summary:
                'The Python an AI engineer uses every day: values and types, variables, lists, dictionaries, loops and functions, and how to read an error message.',
            },
            fr: {
              title: 'L’essentiel de Python pour les données',
              summary:
                'Le Python qu’un ingénieur en IA utilise tous les jours\u00a0: valeurs et types, variables, listes, dictionnaires, boucles et fonctions, et la lecture d’un message d’erreur.',
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
                heading: 'Before any model, there is a program',
                body: 'Every AI system you will build in this course starts the same way: a program loads data, checks it, fixes it and hands it to a model. The model gets the attention, but much of an AI engineer\'s work happens in that ordinary code. Here, that code is **Python**, the main language of the most widely used machine-learning libraries, such as scikit-learn and PyTorch.\n\nStart with a puzzle. What do these two lines print?\n\n```python\nprint(7 / 2)\nprint("7" + "2")\n```\n\nThe first prints `3.5`. The second prints `72`: the quotes make `"7"` and `"2"` pieces of **text**, and `+` joins texts instead of adding numbers. Same symbols, different **types**, different results, and no error to warn you. Data files are full of values like these, so this module starts with the Python you need to handle them.\n\n**Code in this course** is written and saved in the lesson, not run: you trace it by hand, line by line, as the computer would. You can run it later in a Python environment your teacher approves, such as Jupyter.',
              },
              fr: {
                heading: 'Avant tout modèle, il y a un programme',
                body: 'Tous les systèmes d’IA que tu construiras dans ce cours commencent de la même façon\u00a0: un programme charge des données, les vérifie, les corrige et les transmet à un modèle. C’est le modèle qui attire l’attention, mais une grande partie du travail d’un ingénieur en IA se fait dans ce code ordinaire. Ici, ce code s’écrit en **Python**, le langage principal des bibliothèques d’apprentissage automatique les plus répandues, comme scikit-learn et PyTorch.\n\nCommence par une énigme. Qu’affichent ces deux lignes\u00a0?\n\n```python\nprint(7 / 2)\nprint("7" + "2")\n```\n\nLa première affiche `3.5` (Python écrit les nombres décimaux avec un point). La seconde affiche `72`\u00a0: les guillemets font de `"7"` et de `"2"` des morceaux de **texte**, et `+` colle les textes au lieu d’additionner des nombres. Mêmes symboles, **types** différents, résultats différents, et aucune erreur pour te prévenir. Les fichiers de données sont remplis de valeurs de ce genre\u00a0: ce module commence donc par le Python dont tu as besoin pour les manipuler.\n\n**Le code de ce cours** est écrit et enregistré dans la leçon, pas exécuté\u00a0: tu le suis à la main, ligne par ligne, comme le ferait l’ordinateur. Tu pourras l’exécuter plus tard dans un environnement Python approuvé par ton enseignant, comme Jupyter.',
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
                heading: 'Values, types and variables',
                body: 'A **value** is one piece of data, and its **type** decides what you can do with it. Four types cover most data files:\n\n| Type | Examples | Typical use |\n|---|---|---|\n| `int` (whole number) | `14`, `0`, `-3` | Counts, scores |\n| `float` (decimal number) | `3.5`, `19.0` | Measurements, averages |\n| `str` (string: text) | `"cat"`, `"14"`, `""` | Labels, categories, raw text |\n| `bool` (Boolean) | `True`, `False` | Yes or no |\n\n`None` means *no value at all*; you will meet it as a missing value.\n\nA **variable** is a name for a value, and `=` gives it one. It is not the equals sign of maths: `score = score + 3` means *score becomes its old value plus 3*.\n\n- `==` **compares** two values and gives `True` or `False`; so do `!=` (not equal), `<`, `<=`, `>` and `>=`.\n- `/` always gives a float (`6 / 2` is `3.0`), `//` divides and rounds down (`7 // 2` is `3`), `%` gives the remainder (`7 % 2` is `1`).\n- `int("42")`, `float("3.5")` and `str(42)` convert between types; `type(x)` gives the type of `x`. `int("seven")` fails: that text is not a number.\n- A value read from a text file is a **string**, even when it looks like a number. Converting it is your job.\n- An **f-string** puts values into text: `f"Mean: {m:.1f}"` shows `m` with one decimal.',
              },
              fr: {
                heading: 'Valeurs, types et variables',
                body: 'Une **valeur** est une donnée, et son **type** décide de ce que tu peux en faire. Quatre types suffisent pour la plupart des fichiers de données\u00a0:\n\n| Type | Exemples | Usage courant |\n|---|---|---|\n| `int` (nombre entier) | `14`, `0`, `-3` | Comptages, scores |\n| `float` (nombre décimal, ou flottant) | `3.5`, `19.0` | Mesures, moyennes |\n| `str` (chaîne de caractères\u00a0: du texte) | `"cat"`, `"14"`, `""` | Étiquettes, catégories, texte brut |\n| `bool` (booléen) | `True`, `False` | Oui ou non |\n\n`None` signifie *aucune valeur*\u00a0; tu le croiseras sous la forme d’une valeur manquante.\n\nUne **variable** est un nom donné à une valeur, et `=` lui en attribue une. Ce n’est pas le signe égal des maths\u00a0: `score = score + 3` veut dire *score prend son ancienne valeur plus 3*.\n\n- `==` **compare** deux valeurs et donne `True` (vrai) ou `False` (faux)\u00a0; de même pour `!=` (différent de), `<`, `<=`, `>` et `>=`.\n- `/` donne toujours un flottant (`6 / 2` vaut `3.0`), `//` divise en arrondissant vers le bas (`7 // 2` vaut `3`), `%` donne le reste (`7 % 2` vaut `1`).\n- `int("42")`, `float("3.5")` et `str(42)` convertissent d’un type à l’autre\u00a0; `type(x)` donne le type de `x`. `int("seven")` échoue\u00a0: ce texte n’est pas un nombre.\n- Une valeur lue dans un fichier texte est une **chaîne**, même quand elle ressemble à un nombre. La convertir, c’est ton travail.\n- Une **f-string** insère des valeurs dans un texte\u00a0: `f"Mean: {m:.1f}"` affiche `m` avec une décimale.',
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
                heading: 'Lists, dictionaries, loops and functions',
                body: 'A **list** keeps values in order: `temps = [18.5, 21.0, 20.5]`.\n\n- Positions, called **indexes**, start at **0**: `temps[0]` is `18.5`, `temps[2]` is `20.5` and `temps[-1]` is always the last item.\n- `len(temps)` counts the items and `temps.append(19.0)` adds one at the end; `sum`, `min` and `max` work on lists of numbers. `"cat" in labels` is `True` if the list `labels` contains `"cat"`.\n\nA **dictionary** links **keys** to **values**, which makes it a natural way to describe one example, one row of data:\n\n```python\nplant = {"species": "basil", "height_cm": 12.5, "watered": True}\n```\n\n- `plant["height_cm"]` is `12.5`; `plant["height_cm"] = 13.0` changes it, and the same line with a new key adds a pair.\n- A missing key raises a `KeyError`, but `plant.get("colour", "unknown")` returns `"unknown"` instead.\n- `for key, value in plant.items():` goes through every pair.\n\nA **for loop** runs its block, the indented lines below it, once per item. In Python, indentation is part of the code: the lines of a block must be indented the same way (by convention, 4 spaces).\n\n```python\ntotal = 0\nfor t in temps:\n    total = total + t\naverage = total / len(temps)   # 60.0 / 3 = 20.0\n```\n\nThis **accumulator** (start at 0, add each item) is everywhere in data code. Inside a loop, `if`, `elif` (else if) and `else` decide what happens to each item.\n\nA **function** names a piece of code so that you can reuse it:\n\n```python\ndef mean(values):\n    """Return the average of a list of numbers."""\n    return sum(values) / len(values)\n```\n\n`values` is a **parameter**: it takes whatever you pass in the call, as in `mean(temps)`. `return` sends the result back to the code that called the function, while `print` only shows it on the screen. A function with no `return` gives back `None`, a classic cause of `None` where you expected a number.',
              },
              fr: {
                heading: 'Listes, dictionnaires, boucles et fonctions',
                body: 'Une **liste** range des valeurs dans l’ordre\u00a0: `temps = [18.5, 21.0, 20.5]` (des températures).\n\n- Les positions, appelées **indices**, commencent à **0**\u00a0: `temps[0]` vaut `18.5`, `temps[2]` vaut `20.5`, et `temps[-1]` est toujours le dernier élément.\n- `len(temps)` compte les éléments et `temps.append(19.0)` en ajoute un à la fin\u00a0; `sum`, `min` et `max` fonctionnent sur des listes de nombres. `"cat" in labels` vaut `True` si la liste `labels` contient `"cat"`.\n\nUn **dictionnaire** associe des **clés** à des **valeurs**\u00a0: c’est une façon naturelle de décrire un exemple, une ligne de données. Comme dans la plupart des programmes, les noms sont en anglais (plant = plante, species = espèce, basil = basilic, height_cm = hauteur en cm, watered = arrosée)\u00a0:\n\n```python\nplant = {"species": "basil", "height_cm": 12.5, "watered": True}\n```\n\n- `plant["height_cm"]` vaut `12.5`\u00a0; `plant["height_cm"] = 13.0` modifie cette valeur, et la même ligne avec une nouvelle clé ajoute une paire.\n- Une clé absente déclenche une erreur `KeyError`, alors que `plant.get("colour", "unknown")` renvoie `"unknown"` (inconnu) à la place.\n- `for key, value in plant.items():` parcourt toutes les paires.\n\nUne **boucle for** exécute son bloc, les lignes en retrait juste en dessous, une fois par élément. En Python, l’indentation fait partie du code\u00a0: les lignes d’un bloc doivent avoir le même retrait (par convention, 4\u00a0espaces).\n\n```python\ntotal = 0\nfor t in temps:\n    total = total + t\naverage = total / len(temps)   # 60.0 / 3 = 20.0\n```\n\nCet **accumulateur** (partir de 0, ajouter chaque élément) est partout dans le code qui traite des données. Dans une boucle, `if` (si), `elif` (sinon si) et `else` (sinon) décident du sort de chaque élément.\n\nUne **fonction** donne un nom à un morceau de code pour pouvoir le réutiliser\u00a0:\n\n```python\ndef mean(values):\n    """Renvoie la moyenne des nombres de la liste."""\n    return sum(values) / len(values)\n```\n\n`values` est un **paramètre**\u00a0: il prend la valeur que tu transmets lors de l’appel, comme dans `mean(temps)`. `return` renvoie le résultat au code qui a appelé la fonction, alors que `print` se contente de l’afficher à l’écran. Une fonction sans `return` renvoie `None`\u00a0: c’est une cause classique de `None` là où tu attendais un nombre.',
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
                heading: 'Read an error message from the bottom up',
                body: 'Errors are normal, even for professionals. When Python stops on one, it prints a **traceback**. Read it **from the bottom up**:\n\n```\nTraceback (most recent call last):\n  File "weather.py", line 4, in <module>\n    print("Average: " + average)\n          ~~~~~~~~~~~~^~~~~~~~~\nTypeError: can only concatenate str (not "float") to str\n```\n\n1. The **last line** names the error and explains it: `+` cannot join a string and a float.\n2. Above it, Python shows **where**: the file, the line number, the line itself and, in recent versions, the part that failed.\n3. Fix the cause: `print(f"Average: {average}")`.\n\n| Error | Usual cause | Example |\n|---|---|---|\n| `SyntaxError` | Python cannot read the line: a missing `:`, bracket or quote | `for t in temps` |\n| `IndentationError` | A block with no indentation, or with inconsistent indentation | A loop with no indented line |\n| `NameError` | A name that does not exist: a typo (names are case-sensitive) or a variable used before it is created | `Temps[0]` |\n| `TypeError` | An operation on the wrong type | `"7" + 2` |\n| `ValueError` | The right type, but a value that cannot be used | `int("seven")` |\n| `IndexError` | A position that is not in the list | `temps[3]` in a list of 3 |\n| `KeyError` | A key that is not in the dictionary | `plant["colour"]` |\n| `ZeroDivisionError` | A division by zero | `mean([])` |\n\nThe worst bugs print no error at all: `"7" + "2"` happily gives `"72"`. To catch them, test your code on small examples whose answer you already know.',
              },
              fr: {
                heading: 'Lis un message d’erreur en partant du bas',
                body: 'Les erreurs sont normales, même pour les professionnels. Quand Python s’arrête sur l’une d’elles, il affiche une **trace d’appels** (*traceback*). Lis-la **en partant du bas**\u00a0:\n\n```\nTraceback (most recent call last):\n  File "weather.py", line 4, in <module>\n    print("Average: " + average)\n          ~~~~~~~~~~~~^~~~~~~~~\nTypeError: can only concatenate str (not "float") to str\n```\n\n1. La **dernière ligne** nomme l’erreur et l’explique\u00a0: `+` ne peut pas coller une chaîne et un flottant (on ne peut concaténer une chaîne qu’avec une autre chaîne).\n2. Au-dessus, Python indique **où**\u00a0: le fichier, le numéro de ligne, la ligne elle-même et, dans les versions récentes, la partie qui a échoué.\n3. Corrige la cause\u00a0: `print(f"Average: {average}")`.\n\n| Erreur | Cause habituelle | Exemple |\n|---|---|---|\n| `SyntaxError` | Python n’arrive pas à lire la ligne\u00a0: il manque les deux-points `:`, une parenthèse ou un guillemet | `for t in temps` |\n| `IndentationError` | Un bloc sans retrait, ou avec un retrait incohérent | Une boucle sans ligne en retrait |\n| `NameError` | Un nom qui n’existe pas\u00a0: une faute de frappe (Python distingue majuscules et minuscules) ou une variable utilisée avant d’être créée | `Temps[0]` |\n| `TypeError` | Une opération sur le mauvais type | `"7" + 2` |\n| `ValueError` | Le bon type, mais une valeur inutilisable | `int("seven")` |\n| `IndexError` | Une position qui n’est pas dans la liste | `temps[3]` dans une liste de 3\u00a0éléments |\n| `KeyError` | Une clé absente du dictionnaire | `plant["colour"]` |\n| `ZeroDivisionError` | Une division par zéro | `mean([])` |\n\nLes bugs les plus graves n’affichent aucune erreur\u00a0: `"7" + "2"` donne tranquillement `"72"`. Pour les attraper, teste ton code sur de petits exemples dont tu connais déjà la réponse.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l1-b5',
            type: RICH,
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Watch the computer work: a trace, line by line',
                body: 'Programmers check code without running it by **tracing** it: they play the computer, line by line, and keep a table of the variables. Here is the trace of a program that counts the plants taller than 10 cm:\n\n```python\nheights = [12.5, 9.0, 14.5]\ntall = 0\nfor h in heights:\n    if h > 10:\n        tall = tall + 1\nprint(tall, "of", len(heights), "plants are taller than 10 cm")\n```\n\n| Step | What runs | `h` | `h > 10` | `tall` |\n|---|---|---|---|---|\n| 1 | `tall = 0` | – | – | 0 |\n| 2 | Loop, 1st turn | 12.5 | `True` | 1 |\n| 3 | Loop, 2nd turn | 9.0 | `False` | 1 |\n| 4 | Loop, 3rd turn | 14.5 | `True` | 2 |\n| 5 | `print(...)` | – | – | Prints `2 of 3 plants are taller than 10 cm` |\n\nThree habits make a trace reliable:\n\n- Write a variable\'s new value **each time** a line changes it.\n- In a loop, use **one row per turn**, and check the condition at every turn.\n- When a program gives a wrong answer, the **first row that differs** from what you expected is where the bug is.',
              },
              fr: {
                heading: 'Regarde l’ordinateur travailler\u00a0: une trace, ligne par ligne',
                body: 'Les programmeurs vérifient du code sans l’exécuter en le **déroulant à la main**\u00a0: ils jouent le rôle de l’ordinateur, ligne par ligne, et tiennent un tableau des variables. C’est ce qu’on appelle une **trace**. Voici celle d’un programme qui compte les plantes de plus de 10\u00a0cm (heights = hauteurs, tall = grande)\u00a0:\n\n```python\nheights = [12.5, 9.0, 14.5]\ntall = 0\nfor h in heights:\n    if h > 10:\n        tall = tall + 1\nprint(tall, "of", len(heights), "plants are taller than 10 cm")\n```\n\n| Étape | Ce qui s’exécute | `h` | `h > 10` | `tall` |\n|---|---|---|---|---|\n| 1 | `tall = 0` | – | – | 0 |\n| 2 | Boucle, 1er\u00a0tour | 12.5 | `True` | 1 |\n| 3 | Boucle, 2e\u00a0tour | 9.0 | `False` | 1 |\n| 4 | Boucle, 3e\u00a0tour | 14.5 | `True` | 2 |\n| 5 | `print(...)` | – | – | Affiche `2 of 3 plants are taller than 10 cm` («\u00a02 plantes sur 3 mesurent plus de 10\u00a0cm\u00a0») |\n\nTrois habitudes rendent une trace fiable\u00a0:\n\n- Note la nouvelle valeur d’une variable **chaque fois** qu’une ligne la modifie.\n- Dans une boucle, fais **une ligne par tour**, et vérifie la condition à chaque tour.\n- Quand un programme donne une réponse fausse, la **première ligne qui diffère** de ce que tu attendais est celle où se cache le bug.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l1-b6',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Be the interpreter. A weather station sends three readings, as text. Your code is saved, not run: trace it by hand.\n\n1. After each numbered comment, write what that line prints. The line marked # 9 stops the program: write the last line of its traceback.\n2. Why does the line marked # 1 not print 39.5? Write a line that prints the sum of the first two readings as a number.\n3. Change the line marked # 9 so that it prints the last temperature without an error, however many readings the list holds.\n4. A fourth reading arrives: "19.0". Write the line that adds it to temps as a number, then predict what the line marked # 5 would print.',
                hint: 'Before each line, ask yourself what the type of each value is: quotes mean a string, and + joins strings instead of adding them. Indexes start at 0, so a list of three items has the indexes 0, 1 and 2.',
              },
              fr: {
                instructions:
                  'Joue le rôle de l’interpréteur Python. Une station météo envoie trois mesures, sous forme de texte. Dans le code, les noms sont en anglais\u00a0: readings = mesures, temps = températures, place = emplacement, roof = toit, unit = unité, height = hauteur, unknown = inconnu. Ton code est enregistré, pas exécuté\u00a0: suis-le à la main.\n\n1. Après chaque commentaire numéroté, écris ce qu’affiche la ligne. La ligne marquée #\u00a09 arrête le programme\u00a0: écris la dernière ligne de sa trace d’appels.\n2. Pourquoi la ligne marquée #\u00a01 n’affiche-t-elle pas 39.5\u00a0? Écris une ligne qui affiche la somme des deux premières mesures sous forme de nombre.\n3. Modifie la ligne marquée #\u00a09 pour qu’elle affiche la dernière température sans erreur, quel que soit le nombre de mesures de la liste.\n4. Une quatrième mesure arrive\u00a0: "19.0". Écris la ligne qui l’ajoute à temps sous forme de nombre, puis prédis ce qu’afficherait la ligne marquée #\u00a05.',
                hint: 'Avant chaque ligne, demande-toi quel est le type de chaque valeur\u00a0: des guillemets signalent une chaîne, et + colle les chaînes au lieu de les additionner. Les indices commencent à 0\u00a0: une liste de trois éléments a donc les indices 0, 1 et 2.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# Three readings from a weather station, as they come out of a file: text, for now.',
                'readings = ["18.5", "21.0", "20.5"]',
                '',
                'print(readings[0] + readings[1])  # 1.',
                'print(len(readings))  # 2.',
                '',
                'temps = []',
                'for r in readings:',
                '    temps.append(float(r))',
                'print(temps)  # 3.',
                'print(type(readings[0]), type(temps[0]))  # 4.',
                'print(sum(temps) / len(temps))  # 5.',
                '',
                'station = {"place": "roof", "unit": "C", "temps": temps}',
                'print(station["unit"])  # 6.',
                'print(station.get("height", "unknown"))  # 7.',
                'print(station["temps"][-1])  # 8.',
                'print(temps[3])  # 9. Careful! / Attention !',
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
                  'Stuck on the next activity? Ask the AI tutor for a hint, not for the code. Say what you tried and what you expect: a good hint points you to a line or asks you a question. Keep personal details out of your messages.',
                starterPrompt:
                  'I am writing a Python function count_labels(labels) that turns a list such as ["cat", "dog", "cat"] into a dictionary of counts: {"cat": 2, "dog": 1}. My idea so far: [describe it]. Give me a hint for the next step, without writing the function for me.',
              },
              fr: {
                instructions:
                  'Tu bloques sur l’activité suivante\u00a0? Demande un indice au tuteur IA, pas le code. Dis-lui ce que tu as essayé et ce que tu attends\u00a0: un bon indice te montre une ligne ou te pose une question. Ne mets aucune information personnelle dans tes messages.',
                starterPrompt:
                  'J’écris une fonction Python count_labels(labels) qui transforme une liste comme ["cat", "dog", "cat"] en un dictionnaire des effectifs\u00a0: {"cat": 2, "dog": 1}. Mon idée pour l’instant\u00a0: [décris-la]. Donne-moi un indice pour l’étape suivante, sans écrire la fonction à ma place.',
              },
            },
            data: { tutorMode: 'hint', labToolId: null },
          },
          {
            id: 'm1-l1-b8',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Your turn to write code. A club labelled 8 drawings to train an image classifier later. Complete the three functions marked TODO, then trace your own code by hand (it is saved, not run):\n\n1. count_labels: add 1 to the count of each label. A new label starts at 0: counts.get(label, 0) helps.\n2. most_common: return the label with the largest count. If two labels tie, which one does your code return?\n3. share: the count of a label divided by the total number of examples (0.5 for half of them).\n4. Write what the lines marked # 1, # 2 and # 3 print with your code.\n5. Edge cases: what do share(counts, "fish") and share(count_labels([]), "cat") give? If one of them crashes, change your code and explain your choice in a comment.\n6. Is this dataset balanced? What might a model trained on it learn to prefer?',
                hint: 'For most_common, go through counts.items(), which gives (label, count) pairs, and keep the best pair seen so far in two variables. For share, sum(counts.values()) is the total number of examples.',
              },
              fr: {
                instructions:
                  'À toi d’écrire du code. Un club a étiqueté 8\u00a0dessins pour entraîner plus tard un classifieur d’images. Dans le code\u00a0: labels = étiquettes, cat = chat, dog = chien, bird = oiseau, counts = effectifs, most_common = la plus fréquente, share = part. Complète les trois fonctions marquées TODO, puis suis ton propre code à la main (il est enregistré, pas exécuté)\u00a0:\n\n1. count_labels\u00a0: ajoute 1 à l’effectif de chaque étiquette. Une nouvelle étiquette part de 0\u00a0: counts.get(label, 0) t’y aidera.\n2. most_common\u00a0: renvoie l’étiquette qui a le plus grand effectif. Si deux étiquettes sont à égalité, laquelle ton code renvoie-t-il\u00a0?\n3. share\u00a0: l’effectif d’une étiquette divisé par le nombre total d’exemples (0.5 pour la moitié d’entre eux).\n4. Écris ce qu’affichent, avec ton code, les lignes marquées #\u00a01, #\u00a02 et #\u00a03.\n5. Cas limites\u00a0: que donnent share(counts, "fish") (fish = poisson) et share(count_labels([]), "cat")\u00a0? Si l’un des deux plante, modifie ton code et explique ton choix dans un commentaire.\n6. Ce jeu de données est-il équilibré\u00a0? Qu’est-ce qu’un modèle entraîné dessus risquerait d’apprendre à privilégier\u00a0?',
                hint: 'Pour most_common, parcours counts.items(), qui donne des paires (étiquette, effectif), et garde dans deux variables la meilleure paire vue jusque-là. Pour share, sum(counts.values()) donne le nombre total d’exemples.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# The labels a club gave to 8 drawings, to train an image classifier later.',
                'labels = ["cat", "dog", "cat", "bird", "cat", "dog", "cat", "bird"]',
                '',
                '',
                'def count_labels(labels):',
                '    """Return a dictionary: each label -> how many times it appears."""',
                '    counts = {}',
                '    for label in labels:',
                '        pass  # TODO 1: add 1 to the count of this label. / Ajoute 1 à son effectif.',
                '    return counts',
                '',
                '',
                'def most_common(counts):',
                '    """Return the label with the largest count."""',
                '    # TODO 2 / À compléter',
                '    return None',
                '',
                '',
                'def share(counts, label):',
                '    """Return the share of the examples (between 0 and 1) that have this label."""',
                '    # TODO 3 / À compléter',
                '    return 0.0',
                '',
                '',
                'counts = count_labels(labels)',
                'print(counts)  # 1.',
                'print(most_common(counts))  # 2.',
                '# :.0% shows a share as a percentage: 0.5 becomes 50%. / 0.5 devient 50%.',
                'print(f"{share(counts, \'cat\'):.0%} of the drawings are cats")  # 3.',
                '',
                '# Edge cases / Cas limites :',
                '# Balanced? / Équilibré ?',
              ),
            },
          },
          {
            id: 'm1-l1-b9',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Which Python idea from this lesson was the least obvious to you: indexes that start at 0, = and ==, return and print, or strings that look like numbers? Describe a bug it could cause in a program that prepares data for an AI model, and how you would catch it.',
              },
              fr: {
                prompt:
                  'Quelle notion de Python de cette leçon t’a paru la moins évidente\u00a0: les indices qui commencent à 0, = et ==, return et print, ou les chaînes qui ressemblent à des nombres\u00a0? Décris un bug qu’elle pourrait provoquer dans un programme qui prépare des données pour un modèle d’IA, et comment tu le repérerais.',
              },
            },
            data: { minLength: 80 },
          },
        ],
      },

      // --- m1-l2: Working with data --------------------------------------------------------------
      {
        id: 'm1-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Working with data',
              summary:
                "Tables as rows and columns, reading a CSV file with Python's csv module, cleaning missing values, duplicates, units and typos, and summarising the result with simple statistics.",
            },
            fr: {
              title: 'Travailler avec des données',
              summary:
                'Les tableaux en lignes et en colonnes, la lecture d’un fichier CSV avec le module csv de Python, le nettoyage des valeurs manquantes, des doublons, des unités et des fautes de frappe, et le résumé du résultat par quelques statistiques simples.',
            },
          },
          estimatedMinutes: 45,
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
                heading: 'The warm week that never happened',
                body: 'A school club keeps a small weather station on the roof, and its readings go into a file every day. At the end of the first week of March, someone opens the file in a spreadsheet and asks for the average temperature: **17.5 °C**. Nobody remembers a warm week.\n\nA look at the file clears up the mystery. One reading was sent twice. One day has no temperature. After a reset, the station logged one day in degrees **Fahrenheit**. The rain column says `no`, `No`, `" Yes"` (with a space) and `?`. The spreadsheet averaged whatever numbers it found, and nothing warned anyone.\n\nA model trained on that file to predict rain would learn from the same mistakes, and its answers would look just as confident. On real projects, getting data into shape often takes longer than training the model. In this lesson you will read, clean and summarise a table with Python, and find out what that week really looked like.',
              },
              fr: {
                heading: 'La semaine douce qui n’a jamais existé',
                body: 'Un club du lycée a installé une petite station météo sur le toit, et ses mesures sont enregistrées chaque jour dans un fichier. À la fin de la première semaine de mars, quelqu’un ouvre le fichier dans un tableur et demande la température moyenne\u00a0: **17,5\u00a0°C**. Personne ne se souvient d’une semaine aussi douce.\n\nUn coup d’œil au fichier éclaircit le mystère. Une mesure a été envoyée deux fois. Un jour n’a pas de température. Après une réinitialisation, la station a enregistré une journée en degrés **Fahrenheit**. La colonne de la pluie contient `no`, `No`, `" Yes"` (avec un espace) et `?`. Le tableur a fait la moyenne de tous les nombres qu’il a trouvés, et rien n’a prévenu personne.\n\nUn modèle entraîné sur ce fichier pour prédire la pluie apprendrait à partir des mêmes erreurs, et ses réponses auraient l’air tout aussi sûres d’elles. Dans les vrais projets, mettre les données en forme prend souvent plus de temps qu’entraîner le modèle. Dans cette leçon, tu vas lire, nettoyer et résumer un tableau avec Python, et découvrir à quoi cette semaine a vraiment ressemblé.',
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
                heading: 'Tables, CSV files and the csv module',
                body: 'Most data for machine learning arrives as a **table**: each **row** is one example (a day, a plant, a message) and each **column** one property of it. From the next module on, most columns become **features**, and one column is often the **label** to predict.\n\nThe simplest file format for a table is **CSV** (comma-separated values): plain text, one row per line, values separated by commas, and usually a first line, the **header**, that names the columns:\n\n```\ndate,temp,unit,rain\n2026-03-02,9.5,C,no\n2026-03-03,11.0,C,yes\n```\n\nPython\'s built-in **csv module** reads it for you. `csv.DictReader` turns each line into a dictionary whose keys come from the header:\n\n```python\nimport csv\n\nwith open("weather.csv", newline="", encoding="utf-8") as f:\n    rows = list(csv.DictReader(f))\n\nprint(rows[0]["temp"])   # 9.5, but as the string "9.5"\n```\n\n- `with open(...) as f:` opens the file and closes it at the end of the block; `newline=""` is what the csv documentation recommends.\n- `rows` is a **list of dictionaries**, the two structures of the last lesson together: `rows[0]` is the first data row (the header is not a row) and `len(rows)` the number of examples.\n- **Every value is a string**, even `9.5`. You convert it with `float()` or `int()`, and that is exactly where dirty data makes a program fail: `float("")` raises a `ValueError`.\n- An empty cell gives the empty string `""`, not `None` and not 0.\n- Why not split each line on its commas yourself? Because a value can contain a comma inside quotes, such as `"Paris, France"`. The csv module handles that; a hand-made split does not.\n\nLibraries such as **pandas** load a whole table in one line of code, and the same traps hide in the data.',
              },
              fr: {
                heading: 'Tableaux, fichiers CSV et module csv',
                body: 'La plupart des données utilisées en apprentissage automatique arrivent sous forme de **tableau**\u00a0: chaque **ligne** est un exemple (un jour, une plante, un message) et chaque **colonne** une propriété de cet exemple. Dès le prochain module, la plupart des colonnes deviendront des **caractéristiques** (*features*), et une autre colonne sera souvent l’**étiquette** à prédire.\n\nLe format de fichier le plus simple pour un tableau est le **CSV** (*comma-separated values*, valeurs séparées par des virgules)\u00a0: du texte brut, une ligne du tableau par ligne de texte, des valeurs séparées par des virgules, et en général une première ligne, l’**en-tête**, qui nomme les colonnes (temp = température, unit = unité, rain = pluie)\u00a0:\n\n```\ndate,temp,unit,rain\n2026-03-02,9.5,C,no\n2026-03-03,11.0,C,yes\n```\n\nLe **module csv**, fourni avec Python, le lit à ta place. `csv.DictReader` transforme chaque ligne en un dictionnaire dont les clés viennent de l’en-tête\u00a0:\n\n```python\nimport csv\n\nwith open("weather.csv", newline="", encoding="utf-8") as f:\n    rows = list(csv.DictReader(f))\n\nprint(rows[0]["temp"])   # 9.5, mais sous forme de chaîne : "9.5"\n```\n\n- `with open(...) as f:` ouvre le fichier et le referme à la fin du bloc\u00a0; `newline=""` est le réglage que recommande la documentation du module csv.\n- `rows` est une **liste de dictionnaires**, les deux structures de la leçon précédente réunies\u00a0: `rows[0]` est la première ligne de données (l’en-tête ne compte pas) et `len(rows)` le nombre d’exemples.\n- **Chaque valeur est une chaîne**, même `9.5`. Tu la convertis avec `float()` ou `int()`, et c’est justement là que des données sales font planter un programme\u00a0: `float("")` déclenche une `ValueError`.\n- Une case vide donne la chaîne vide `""`, ni `None` ni 0.\n- Pourquoi ne pas découper toi-même chaque ligne à ses virgules\u00a0? Parce qu’une valeur peut contenir une virgule entre guillemets, comme `"Paris, France"`. Le module csv gère ce cas\u00a0; un découpage fait à la main, non.\n\nDes bibliothèques comme **pandas** chargent un tableau entier en une seule ligne de code, et les mêmes pièges se cachent dans les données.',
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
                heading: 'Cleaning: the four usual suspects',
                body: 'Before anything else, a data engineer looks for four kinds of problems:\n\n| Problem | What it looks like | What you can do |\n|---|---|---|\n| **Missing values** | An empty cell, `NA`, `?`, or a suspicious 0 or -999 | Drop the row, replace the missing value with a sensible one (such as the median) or mark it as missing; never pretend it is 0 |\n| **Duplicates** | The same row twice, sent twice by a sensor or a form | Keep one copy. Two *different* rows for the same day are a conflict: find out which is right |\n| **Units and formats** | 54.5 °F next to 12.5 °C; 1.2 m next to 120 cm; dates written 03/04 or 2026-04-03 | Convert to one unit and one format, and put the unit in the column name (`temp_c`) |\n| **Typos and inconsistent labels** | `yes`, `Yes`, `" yes"` and `y` | Strip spaces, use one case, map variants to one label; check the list of distinct values |\n\nThree rules keep cleaning honest:\n\n1. **Never edit the raw file.** Write code that produces a clean copy, so that anyone can see and repeat what you changed.\n2. **Count what you change.** "1 duplicate removed, 1 row with no temperature dropped" belongs in your notes. Drop half of the data and the rest may no longer represent the real world.\n3. **Do not delete what you do not like.** An extreme value can be an error (54.5 °C in March) or a real event (a heatwave). Check first. And a row that is unusable for one question can still be good for another.\n\n**Why it matters for AI.** A model learns whatever is in the table. To a model, `Yes` and `yes` are two different classes. A duplicate counts twice, and one copy can end up among the examples the model learns from while the other is kept aside to test it, which makes the model look better than it is. Mixed units teach a pattern that does not exist. And if the incomplete rows come mostly from one group of people or one place, dropping them can quietly make the model work worse for that group. Garbage in, garbage out.',
              },
              fr: {
                heading: 'Nettoyer\u00a0: les quatre suspects habituels',
                body: 'Avant toute chose, un ingénieur des données cherche quatre sortes de problèmes\u00a0:\n\n| Problème | À quoi il ressemble | Que faire |\n|---|---|---|\n| **Valeurs manquantes** | Une case vide, `NA`, `?`, ou un 0 ou un -999 suspects | Supprimer la ligne, remplacer la valeur manquante par une valeur raisonnable (comme la médiane) ou la marquer comme manquante\u00a0; ne jamais faire comme si c’était 0 |\n| **Doublons** | La même ligne deux fois, envoyée deux fois par un capteur ou un formulaire | N’en garder qu’un exemplaire. Deux lignes *différentes* pour le même jour, c’est un conflit\u00a0: chercher laquelle est juste |\n| **Unités et formats** | 54,5\u00a0°F à côté de 12,5\u00a0°C\u00a0; 1,2\u00a0m à côté de 120\u00a0cm\u00a0; des dates écrites 03/04 ou 2026-04-03 | Tout convertir dans une seule unité et un seul format, et indiquer l’unité dans le nom de la colonne (`temp_c`) |\n| **Fautes de frappe et étiquettes incohérentes** | `yes`, `Yes`, `" yes"` et `y` | Retirer les espaces, choisir une seule casse, ramener les variantes à une seule étiquette\u00a0; vérifier la liste des valeurs distinctes |\n\nTrois règles rendent le nettoyage honnête\u00a0:\n\n1. **Ne modifie jamais le fichier brut.** Écris du code qui produit une copie propre, pour que chacun puisse voir et refaire ce que tu as changé.\n2. **Compte ce que tu changes.** «\u00a01\u00a0doublon supprimé, 1\u00a0ligne sans température retirée\u00a0» a sa place dans tes notes. Supprime la moitié des données, et ce qui reste ne représentera peut-être plus le monde réel.\n3. **Ne supprime pas ce qui te dérange.** Une valeur extrême peut être une erreur (54,5\u00a0°C en mars) ou un vrai événement (une canicule). Vérifie d’abord. Et une ligne inutilisable pour une question peut rester valable pour une autre.\n\n**Pourquoi c’est essentiel pour l’IA.** Un modèle apprend tout ce que contient le tableau. Pour lui, `Yes` et `yes` sont deux classes différentes. Un doublon compte deux fois, et un exemplaire peut se retrouver parmi les exemples d’entraînement pendant que l’autre est mis de côté pour le tester\u00a0: le modèle paraît alors meilleur qu’il ne l’est. Des unités mélangées lui apprennent une régularité qui n’existe pas. Et si les lignes incomplètes viennent surtout d’un même groupe de personnes ou d’un même lieu, les supprimer peut, sans que personne ne s’en aperçoive, rendre le modèle moins fiable pour ce groupe. Des données médiocres en entrée donnent des résultats médiocres en sortie (*garbage in, garbage out*).',
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
                heading: 'Summarise before you model',
                body: "Once the data is clean, a few numbers give you a quick picture of it. Take the clean temperatures of another week from the same station: 8.0, 9.5, 12.0, 10.0 and 14.5 °C.\n\n| Statistic | How | Result |\n|---|---|---|\n| Count | `len(temps)` | 5 |\n| Minimum and maximum | `min(temps)`, `max(temps)` | 8.0 and 14.5 |\n| Range | max − min | 6.5 |\n| Mean | `sum(temps) / len(temps)` | 54.0 / 5 = 10.8 |\n| Median (the middle value) | Sort, then take the middle | 8.0, 9.5, **10.0**, 12.0, 14.5 → 10.0 |\n| Counts of a label | Your `count_labels` function | That week, yes: 1 and no: 4 |\n\nThe **mean** uses every value, so one wrong value can drag it a long way. The **median** only depends on the middle value (or the two middle values) of the sorted list, so an extreme value at one end barely moves it. The spreadsheet of the introduction averaged the seven numbers it found, the duplicate and the 54.5 included: 122.5 / 7 = 17.5, while their median is 11.0. When the mean and the median are far apart, look for an outlier or an error.\n\nWith an even number of values, the median is the mean of the two middle ones. Python's standard `statistics` module also has `statistics.mean()` and `statistics.median()`.",
              },
              fr: {
                heading: 'Résume avant de modéliser',
                body: 'Une fois les données propres, quelques nombres suffisent à en dresser le portrait. Prenons les températures propres d’une autre semaine de la même station\u00a0: 8,0\u00a0; 9,5\u00a0; 12,0\u00a0; 10,0 et 14,5\u00a0°C.\n\n| Statistique | Comment | Résultat |\n|---|---|---|\n| Effectif | `len(temps)` | 5 |\n| Minimum et maximum | `min(temps)`, `max(temps)` | 8,0 et 14,5 |\n| Étendue | max − min | 6,5 |\n| Moyenne | `sum(temps) / len(temps)` | 54,0 / 5 = 10,8 |\n| Médiane (la valeur du milieu) | Trier, puis prendre celle du milieu | 8,0\u00a0; 9,5\u00a0; **10,0**\u00a0; 12,0\u00a0; 14,5 → 10,0 |\n| Effectifs d’une étiquette | Ta fonction `count_labels` | Cette semaine-là, yes\u00a0: 1 et no\u00a0: 4 |\n\nLa **moyenne** utilise toutes les valeurs\u00a0: une seule valeur fausse peut l’entraîner très loin. La **médiane** ne dépend que de la valeur du milieu (ou des deux valeurs du milieu) de la liste triée\u00a0: une valeur extrême, à un bout, la fait à peine bouger. Le tableur de l’introduction a fait la moyenne des sept nombres qu’il a trouvés, doublon et 54,5 compris\u00a0: 122,5 / 7 = 17,5, alors que leur médiane vaut 11,0. Quand la moyenne et la médiane sont très éloignées, cherche une valeur aberrante ou une erreur.\n\nAvec un nombre pair de valeurs, la médiane est la moyenne des deux valeurs du milieu. Le module standard `statistics` de Python fournit aussi `statistics.mean()` et `statistics.median()`.',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b5',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Clean it on paper first',
                body: 'Engineers decide their cleaning rules before they write any code, and the rules depend on what the data is for. Here is the station\'s file for the week:\n\n| Row | date | temp | unit | rain |\n|---|---|---|---|---|\n| 1 | 2026-03-02 | 9.5 | C | no |\n| 2 | 2026-03-03 | 11.0 | C | yes |\n| 3 | 2026-03-03 | 11.0 | C | yes |\n| 4 | 2026-03-04 | | C | no |\n| 5 | 2026-03-05 | 54.5 | F | No |\n| 6 | 2026-03-06 | 10.5 | c | ␣Yes |\n| 7 | 2026-03-07 | 13.0 | C | yes |\n| 8 | 2026-03-08 | 13.0 | C | ? |\n\n(␣ marks a space at the start of the value. Fahrenheit to Celsius: °C = (°F − 32) × 5 / 9.)\n\nYour first goal is a table for a model that predicts rain from the temperature. On paper or in your notes:\n\n1. For each row, decide: **keep**, **fix** (how?) or **drop** (why?). Write your rules as short sentences, such as *"a row identical to an earlier one is dropped"*.\n2. Keep the rows that this model can use: a usable temperature **and** a yes/no label. Count them, then work out by hand the minimum, maximum, mean and median of their temperatures, in °C, and the number of rainy and dry days among them.\n3. Row 8 has a valid temperature but no rain label, so the rain model cannot use it. Would you also drop it to compute the average temperature of the week? Work out that average both ways. And row 4 has no temperature: do you keep it to count the week\'s rainy and dry days?',
              },
              fr: {
                heading: 'Nettoie d’abord sur papier',
                body: 'Les ingénieurs fixent leurs règles de nettoyage avant d’écrire la moindre ligne de code, et ces règles dépendent de l’usage prévu des données. Voici le fichier de la station pour la semaine\u00a0:\n\n| Ligne | date | temp | unit | rain |\n|---|---|---|---|---|\n| 1 | 2026-03-02 | 9.5 | C | no |\n| 2 | 2026-03-03 | 11.0 | C | yes |\n| 3 | 2026-03-03 | 11.0 | C | yes |\n| 4 | 2026-03-04 | | C | no |\n| 5 | 2026-03-05 | 54.5 | F | No |\n| 6 | 2026-03-06 | 10.5 | c | ␣Yes |\n| 7 | 2026-03-07 | 13.0 | C | yes |\n| 8 | 2026-03-08 | 13.0 | C | ? |\n\n(␣ marque un espace au début de la valeur. Dans le fichier, les nombres s’écrivent avec un point, et yes = oui, no = non. Des degrés Fahrenheit aux degrés Celsius\u00a0: °C = (°F − 32) × 5 / 9.)\n\nTon premier objectif\u00a0: un tableau pour un modèle qui prédit la pluie à partir de la température. Sur papier ou dans tes notes\u00a0:\n\n1. Pour chaque ligne, décide\u00a0: **garder**, **corriger** (comment\u00a0?) ou **supprimer** (pourquoi\u00a0?). Écris tes règles sous forme de phrases courtes, comme *«\u00a0une ligne identique à une ligne précédente est supprimée\u00a0»*.\n2. Garde les lignes que ce modèle peut utiliser\u00a0: une température exploitable **et** une étiquette yes ou no. Compte-les, puis calcule à la main le minimum, le maximum, la moyenne et la médiane de leurs températures, en °C, ainsi que le nombre de jours de pluie et de jours secs parmi elles.\n3. La ligne\u00a08 a une température valide, mais pas d’étiquette de pluie\u00a0: le modèle de pluie ne peut donc pas s’en servir. La supprimerais-tu aussi pour calculer la température moyenne de la semaine\u00a0? Calcule cette moyenne dans les deux cas. Et la ligne\u00a04 n’a pas de température\u00a0: la gardes-tu pour compter les jours de pluie et les jours secs de la semaine\u00a0?',
              },
            },
            data: {},
          },
          {
            id: 'm1-l2-b6',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Paste your cleaning rules and your results (no personal data) and ask the AI tutor to check them. It should tell you which rows or numbers to look at again, not give you the answers.',
                starterPrompt:
                  'Check my work without giving me the answers. A weather file has 8 rows: [paste the table]. My cleaning rules: [paste them]. For a model that predicts rain from the temperature, I keep [number] rows, with a mean of [number] °C and a median of [number] °C. If a rule or a number is wrong, tell me which one and give me a hint.',
              },
              fr: {
                instructions:
                  'Colle tes règles de nettoyage et tes résultats (sans données personnelles) et demande au tuteur IA de les vérifier. Il doit t’indiquer quelles lignes ou quels nombres revoir, pas te donner les réponses.',
                starterPrompt:
                  'Vérifie mon travail sans me donner les réponses. Un fichier météo contient 8\u00a0lignes\u00a0: [colle le tableau]. Mes règles de nettoyage\u00a0: [colle-les]. Pour un modèle qui prédit la pluie à partir de la température, je garde [nombre] lignes, avec une moyenne de [nombre]\u00a0°C et une médiane de [nombre]\u00a0°C. Si une règle ou un nombre est faux, dis-moi lequel et donne-moi un indice.',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm1-l2-b7',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Now turn your rules into code. The program reads the week\'s file with the csv module and keeps the rows that a model predicting rain from the temperature can use. It is saved, not run: trace it by hand.\n\n1. Write what the lines marked # 1 to # 5 print, with the program as it is now. Which of them show that something is still wrong?\n2. TODO 1: convert the Fahrenheit temperatures to °C. TODO 2: skip a row whose rain label is neither "yes" nor "no". Trace the lines marked # 3 to # 5 again: do they match your results on paper for the rain model?\n3. TODO 3: write median(values) and print the median of temps. Test it on a list whose median you know, such as [3, 1, 2].\n4. Copy your count_labels function from the last lesson into this program, above TODO 4: without it, the program stops with a NameError. Then TODO 4: count the rain labels of the clean rows with it.\n5. Compare with your answer to step 3 of the paper task. For the week\'s average temperature alone, row 8 is valid: with it, there are 6 values, a mean of 69.5 / 6 ≈ 11.6 °C and a median of 11.75 °C. And row 4 is still a dry day when you count the week\'s weather: 3 rainy days, 3 dry days and 1 day with no label. The rows you keep depend on the question you ask.\n6. In a comment, write the cleaning report: how many rows were read, dropped (and why), fixed (and how) and kept.\n\nIf your school gives you a Python environment, such as Jupyter, run the program there and compare its output with your trace.',
                hint: 'Before TODO 1, the mean still includes 54.5, a Fahrenheit value. For the median: sorted(values) gives a sorted copy, and with an odd number n of values the middle one is at index n // 2. What should happen when n is even?',
              },
              fr: {
                instructions:
                  'Transforme maintenant tes règles en code. Le programme lit le fichier de la semaine avec le module csv et garde les lignes qu’un modèle qui prédit la pluie à partir de la température peut utiliser. Dans le code\u00a0: rows = lignes, clean = nettoyer, cleaned = lignes nettoyées, seen = lignes déjà vues, temp_c = température en °C. Il est enregistré, pas exécuté\u00a0: suis-le à la main.\n\n1. Écris ce qu’affichent les lignes marquées #\u00a01 à #\u00a05, avec le programme tel qu’il est. Lesquelles montrent que quelque chose ne va pas encore\u00a0?\n2. TODO\u00a01\u00a0: convertis en °C les températures en Fahrenheit. TODO\u00a02\u00a0: ignore une ligne dont l’étiquette de pluie n’est ni "yes" ni "no". Suis de nouveau les lignes marquées #\u00a03 à #\u00a05\u00a0: correspondent-elles à tes résultats sur papier pour le modèle de pluie\u00a0?\n3. TODO\u00a03\u00a0: écris median(values) et affiche la médiane de temps. Teste-la sur une liste dont tu connais la médiane, comme [3, 1, 2].\n4. Copie ta fonction count_labels de la leçon précédente dans ce programme, au-dessus du TODO\u00a04\u00a0: sans elle, le programme s’arrête sur une erreur NameError. Puis fais le TODO\u00a04\u00a0: compte avec elle les étiquettes de pluie des lignes propres.\n5. Compare avec ta réponse à l’étape\u00a03 de la tâche sur papier. Pour calculer seulement la température moyenne de la semaine, la ligne\u00a08 est valide\u00a0: avec elle, on a 6\u00a0valeurs, une moyenne de 69,5 / 6 ≈ 11,6\u00a0°C et une médiane de 11,75\u00a0°C. Et la ligne\u00a04 reste un jour sec quand on compte la météo de la semaine\u00a0: 3\u00a0jours de pluie, 3\u00a0jours secs et 1\u00a0jour sans étiquette. Les lignes que tu gardes dépendent de la question que tu poses.\n6. Dans un commentaire, rédige le rapport de nettoyage\u00a0: combien de lignes ont été lues, supprimées (et pourquoi), corrigées (et comment) et gardées.\n\nSi ton établissement te donne accès à un environnement Python, comme Jupyter, exécute-y le programme et compare sa sortie avec ta trace.',
                hint: 'Avant le TODO\u00a01, la moyenne inclut encore 54.5, une valeur en Fahrenheit. Pour la médiane\u00a0: sorted(values) renvoie une copie triée, et avec un nombre impair n de valeurs, celle du milieu se trouve à l’indice n // 2. Que faut-il faire quand n est pair\u00a0?',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                'import csv',
                'import io',
                '',
                '# The file weather.csv, written here so that the program works without the file.',
                '# / Le fichier weather.csv, recopié ici pour que le programme fonctionne sans lui.',
                'DATA = """date,temp,unit,rain',
                '2026-03-02,9.5,C,no',
                '2026-03-03,11.0,C,yes',
                '2026-03-03,11.0,C,yes',
                '2026-03-04,,C,no',
                '2026-03-05,54.5,F,No',
                '2026-03-06,10.5,c, Yes',
                '2026-03-07,13.0,C,yes',
                '2026-03-08,13.0,C,?',
                '"""',
                '',
                '# io.StringIO makes the text behave like an open file.',
                '# With the real file: with open("weather.csv", newline="", encoding="utf-8") as f:',
                'rows = list(csv.DictReader(io.StringIO(DATA)))',
                'print(len(rows), "rows read")  # 1.',
                'print(rows[0])  # 2.',
                '',
                '',
                'def clean(rows):',
                '    """Return the rows a rain model can use: no duplicates, a temperature in °C, a yes/no label."""',
                '    cleaned = []',
                '    seen = []',
                '    for row in rows:',
                '        if row in seen:  # exactly the same row again: a duplicate / un doublon',
                '            continue  # skip to the next row / passe à la ligne suivante',
                '        seen.append(row)',
                '        if row["temp"].strip() == "":  # a missing value / une valeur manquante',
                '            continue',
                '        temp = float(row["temp"])',
                '        unit = row["unit"].strip().upper()',
                '        # TODO 1: if unit is "F", convert temp to °C: (temp - 32) * 5 / 9',
                '        rain = row["rain"].strip().lower()',
                '        # TODO 2: if rain is neither "yes" nor "no", skip the row',
                '        cleaned.append({"date": row["date"], "temp_c": temp, "rain": rain})',
                '    return cleaned',
                '',
                '',
                'clean_rows = clean(rows)',
                'print(len(clean_rows), "clean rows")  # 3.',
                '',
                'temps = []',
                'for row in clean_rows:',
                '    temps.append(row["temp_c"])',
                'print("min:", min(temps), "max:", max(temps))  # 4.',
                'print("mean:", round(sum(temps) / len(temps), 2))  # 5.',
                '',
                '# TODO 3: write median(values) and print the median of temps. / Écris median(values).',
                '',
                '# Paste your count_labels function (last lesson) here. / Colle ici ta fonction count_labels.',
                '# TODO 4: count the rain labels of clean_rows with count_labels. / Compte les étiquettes de pluie.',
                '# Cleaning report / Rapport de nettoyage :',
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
                  'Check what you know about Python, data files and cleaning before you move on to machine learning.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur Python, les fichiers de données et le nettoyage avant de passer à l’apprentissage automatique.',
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
                  'Think of a dataset that could be used to train an AI model at your school or in your town, with anonymous data only, such as canteen food waste or bus delays. Which cleaning problem would you expect to find in it, and how could that problem make the model wrong or unfair?',
              },
              fr: {
                prompt:
                  'Pense à un jeu de données qui pourrait servir à entraîner un modèle d’IA dans ton établissement ou dans ta ville, avec des données anonymes uniquement, comme le gaspillage à la cantine ou les retards de bus. Quel problème de nettoyage t’attendrais-tu à y trouver, et comment ce problème pourrait-il faire se tromper le modèle ou le rendre injuste\u00a0?',
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
      id: 'quiz-m1',
      input: {
        defaultLocale: 'en',
        translations: {
          en: {
            title: 'Check: Python for AI',
            instructions:
              'Seven questions on Python, data files and cleaning. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: Python pour l’IA',
            instructions:
              'Sept questions sur Python, les fichiers de données et le nettoyage. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
                  'What does this program print?\n\nreadings = ["4", "5"]\nprint(readings[0] + readings[1])',
              },
              fr: {
                prompt:
                  'Qu’affiche ce programme\u00a0?\n\nreadings = ["4", "5"]\nprint(readings[0] + readings[1])',
              },
            },
            options: [
              { id: 'a', translations: { en: { text: '9' }, fr: { text: '9' } } },
              { id: 'b', translations: { en: { text: '45' }, fr: { text: '45' } } },
              { id: 'c', translations: { en: { text: '9.0' }, fr: { text: '9.0' } } },
              {
                id: 'd',
                translations: {
                  en: { text: 'Nothing: it raises a TypeError' },
                  fr: { text: 'Rien\u00a0: il déclenche une erreur TypeError' },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The quotes make both values strings, and + joins strings: "4" + "5" is "45". To add them as numbers, convert them first: float(readings[0]) + float(readings[1]) gives 9.0.',
              },
              fr: {
                text: 'Les guillemets font des deux valeurs des chaînes, et + colle les chaînes\u00a0: "4" + "5" donne "45". Pour les additionner comme des nombres, convertis-les d’abord\u00a0: float(readings[0]) + float(readings[1]) donne 9.0.',
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
                  'This program stops with an error.\n\ntemps = [18.5, 21.0, 20.5]\nprint(temps[3])\n\nWhich error is it, and why?',
              },
              fr: {
                prompt:
                  'Ce programme s’arrête sur une erreur.\n\ntemps = [18.5, 21.0, 20.5]\nprint(temps[3])\n\nDe quelle erreur s’agit-il, et pourquoi\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'IndexError: the indexes of a list of three items are 0, 1 and 2' },
                  fr: {
                    text: 'IndexError\u00a0: les indices d’une liste de trois éléments sont 0, 1 et 2',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'KeyError: the list has no key 3' },
                  fr: { text: 'KeyError\u00a0: la liste n’a pas de clé 3' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'TypeError: 3 is an int and the list holds floats' },
                  fr: {
                    text: 'TypeError\u00a0: 3 est un int alors que la liste contient des float',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'SyntaxError: square brackets are only for dictionaries' },
                  fr: { text: 'SyntaxError\u00a0: les crochets sont réservés aux dictionnaires' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Indexes start at 0, so temps[3] asks for a fourth item that does not exist: IndexError: list index out of range. temps[2] or temps[-1] gives the last one, 20.5.',
              },
              fr: {
                text: 'Les indices commencent à 0\u00a0: temps[3] demande donc un quatrième élément qui n’existe pas (IndexError: list index out of range, l’indice est hors de la liste). temps[2] ou temps[-1] donne le dernier, 20.5.',
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
                  'A function that ends with print(result) instead of return result gives the result back to the code that called it, so total = my_function(data) stores that result in total.',
              },
              fr: {
                prompt:
                  'Une fonction qui se termine par print(result) au lieu de return result renvoie le résultat au code qui l’a appelée\u00a0: total = my_function(data) range donc ce résultat dans total.',
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
                text: 'False. print only shows the result on the screen. The function reaches its end without a return, so it gives back None, and total is None: a classic bug.',
              },
              fr: {
                text: 'Faux. print se contente d’afficher le résultat à l’écran. La fonction arrive à sa fin sans return\u00a0: elle renvoie donc None, et total vaut None. C’est un bug classique.',
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
                  'The rain column of a CSV file contains these values: yes, Yes, " yes", no and n/a. Which cleaning steps make sense? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'La colonne rain (pluie) d’un fichier CSV contient ces valeurs\u00a0: yes, Yes, " yes", no et n/a. Quelles étapes de nettoyage sont judicieuses\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Remove the spaces at the start and end of each value' },
                  fr: { text: 'Retirer les espaces au début et à la fin de chaque valeur' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Put every value in lower case' },
                  fr: { text: 'Mettre toutes les valeurs en minuscules' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Treat n/a as a missing value, not as a third kind of weather' },
                  fr: {
                    text: 'Traiter n/a comme une valeur manquante, et non comme un troisième type de météo',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Replace n/a with "no", since it most likely did not rain' },
                  fr: { text: 'Remplacer n/a par "no", puisqu’il n’a sans doute pas plu' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Leave the values as they are: the model will work out that they mean the same thing',
                  },
                  fr: {
                    text: 'Laisser les valeurs telles quelles\u00a0: le modèle comprendra qu’elles veulent dire la même chose',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Stripping the spaces and using one case turn yes, Yes and " yes" into a single label. n/a is missing information: replacing it with "no" invents data. And a model never works out that two different strings mean the same thing: to it, they are two different classes.',
              },
              fr: {
                text: 'Retirer les espaces et choisir une seule casse transforment yes, Yes et " yes" en une seule étiquette. n/a est une information manquante\u00a0: la remplacer par "no", c’est inventer des données. Et un modèle ne devine jamais que deux chaînes différentes veulent dire la même chose\u00a0: pour lui, ce sont deux classes différentes.',
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
                  'Five clean temperatures are 9.5, 10.5, 11.0, 12.5 and 13.0 °C: their mean is 11.3 and their median 11.0. A wrong reading of 54.5 (in Fahrenheit, by mistake) is added to them. What happens?',
              },
              fr: {
                prompt:
                  'Cinq températures propres valent 9,5\u00a0; 10,5\u00a0; 11,0\u00a0; 12,5 et 13,0\u00a0°C\u00a0: leur moyenne est 11,3 et leur médiane 11,0. On leur ajoute par erreur une mesure de 54,5 (en Fahrenheit). Que se passe-t-il\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'The mean jumps to 18.5; the median only moves to 11.75' },
                  fr: {
                    text: 'La moyenne bondit à 18,5\u00a0; la médiane passe seulement à 11,75',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'The median jumps to 18.5; the mean only moves to 11.75' },
                  fr: {
                    text: 'La médiane bondit à 18,5\u00a0; la moyenne passe seulement à 11,75',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Both rise to about 18' },
                  fr: { text: 'Les deux montent à environ 18' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Neither changes, because 54.5 is only one value out of six' },
                  fr: { text: 'Aucune ne change, car 54,5 n’est qu’une valeur sur six' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'The mean uses every value: (56.5 + 54.5) / 6 = 18.5. The median only looks at the middle of the sorted list: (11.0 + 12.5) / 2 = 11.75. A big gap between the mean and the median is a sign to look for an outlier or an error.',
              },
              fr: {
                text: 'La moyenne utilise toutes les valeurs\u00a0: (56,5 + 54,5) / 6 = 18,5. La médiane ne regarde que le milieu de la liste triée\u00a0: (11,0 + 12,5) / 2 = 11,75. Un grand écart entre la moyenne et la médiane invite à chercher une valeur aberrante ou une erreur.',
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
                  'A dataset of labelled examples contains the same row twice. Why is that a problem for a machine-learning model?',
              },
              fr: {
                prompt:
                  'Un jeu de données d’exemples étiquetés contient deux fois la même ligne. Pourquoi est-ce un problème pour un modèle d’apprentissage automatique\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'The example counts twice, and one copy can be used to train the model while the other is used to test it, so the test score looks better than it should',
                  },
                  fr: {
                    text: 'L’exemple compte deux fois, et un exemplaire peut servir à entraîner le modèle pendant que l’autre sert à le tester\u00a0: le résultat du test paraît alors meilleur qu’il ne devrait l’être',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Python cannot read a CSV file that contains the same line twice' },
                  fr: {
                    text: 'Python ne peut pas lire un fichier CSV qui contient deux fois la même ligne',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'It is not a problem: more rows always give a better model' },
                  fr: {
                    text: 'Ce n’est pas un problème\u00a0: davantage de lignes donnent toujours un meilleur modèle',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'The csv module removes duplicates automatically, so it cannot happen',
                  },
                  fr: {
                    text: 'Le module csv supprime automatiquement les doublons, donc cela ne peut pas arriver',
                  },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A duplicate gives one example more weight than the others, and if one copy is used for training and the other for testing, the model is tested on an example it has already seen. The csv module reads every line as it is: removing duplicates is your job.',
              },
              fr: {
                text: 'Un doublon donne plus de poids à un exemple qu’aux autres, et si un exemplaire sert à l’entraînement et l’autre au test, le modèle est testé sur un exemple qu’il a déjà vu. Le module csv lit chaque ligne telle qu’elle est\u00a0: supprimer les doublons, c’est ton travail.',
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
                  'With the csv module, every value read from a file has the same Python type, even 9.5 or 42. Which type? (its Python name, or its name in words)',
              },
              fr: {
                prompt:
                  'Avec le module csv, chaque valeur lue dans un fichier a le même type Python, même 9.5 ou 42. Lequel\u00a0? (son nom en Python, ou en toutes lettres)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'str',
                'string',
                'a string',
                'strings',
                'string type',
                'the string type',
                'str type',
                'type str',
                'str (string)',
                'text',
              ],
              fr: [
                'str',
                'le type str',
                'chaîne',
                'une chaîne',
                'chaînes',
                'chaîne de caractères',
                'chaîne de caractère',
                'une chaîne de caractères',
                'des chaînes de caractères',
                'texte',
              ],
            },
            explanation: {
              en: {
                text: 'str, a string. The csv module does not guess types: "9.5" stays text until you convert it with float(), and that is where dirty values such as "" make your program fail.',
              },
              fr: {
                text: 'str, une chaîne de caractères. Le module csv ne devine pas les types\u00a0: "9.5" reste du texte jusqu’à ce que tu le convertisses avec float(), et c’est là que des valeurs sales comme "" font planter ton programme.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
