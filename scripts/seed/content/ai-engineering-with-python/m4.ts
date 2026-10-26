// Module m4 of "AI Engineering with Python" (ages 14-16): APIs and automation. It comes after m1
// (Python for AI), m2 (machine learning basics) and m3 (language and vision), and before m5 (the
// engineering challenge, whose final project is required for the certificate). It refers back to
// "Working with data" (m1-l2: the CSV input stage), "Predict outcomes with Python" (m2-l2: the
// Titanic model's key kept out of every hand-in) and "Classify text from Python" (m3-l1: the
// mascot's classifier called with requests, its key, its pipeline and its threshold, below
// which the mascot looked puzzled). m4 does not teach those again: m4-l1 opens the HTTP call
// that m3-l1 announced for this module, and notes that this service gives its confidence from 0
// to 1 where Machine Learning for Kids gives 0 to 100; m4-l2 automates the pipeline idea (an
// overnight run on hundreds of comments) and sends what falls below the threshold to a person.
// The last reflection points ahead to m5. Other modules are named, not numbered, in the text.
// One invented story runs through both lessons: the club of the roof weather station collects
// 300 anonymous comments after the school science fair and sorts them by topic (food, timing,
// activities, other) with a text-classification service. Every comment, address and number is
// invented: example.com is a reserved domain, and the phone numbers are zeros.
// m4-l1: HTTP requests (method, URL, headers, JSON body), responses and status codes (which
// ones to fix and which to retry), JSON and the requests library; the key in an environment
// variable (never in code, screenshots or chats, the tutor and RoboHolic included; revoke a leaked
// key; no provider account of one's own, as many providers require users to be 18 or over, the
// rule of from-ai-user-to-ai-developer m2-l2), rate limits and Retry-After, timeouts, retries with
// exponential backoff and jitter, costs and quotas, and the privacy of what is sent. The watch
// stage reuses IBM Technology's "What is a REST API?" (lsMQRaeKNDk), already curated in
// from-ai-user-to-ai-developer m2-l2, with our own caption and summary written from that course's
// curated summary. The Python code activity (try) is a client for a placeholder endpoint
// (api.example.com), not run. Checked with Python 3.13 and requests 2.34, the service replaced by
// mocks: scenario A (503, 429, then 200 with food 0.91) prints "attempt 1: HTTP 503, waiting 1
// s" and "attempt 2: HTTP 429, waiting 2 s", 3 requests, 3 s of waiting, then the main part prints
// "food 0.91"; B (401) raises ServiceError after 1 request and no wait; C (no network) prints
// three lines, waits 1 + 2 + 4 = 7 s and raises ServiceError after 4 requests; with no key set,
// ServiceError before any request. As given, {"label": "Food!", ...} and a confidence of 1.7 are
// returned unchecked and an answer with no label crashes on KeyError: 'label'; with TODO 1 done,
// all three raise ServiceError; with TODO 2 done, a 429 with Retry-After: 30 waits 30 s. The
// quota question uses invented figures (300 comments, 500 requests a day: 1,200 in the worst
// case). Then a challenge_me tutor activity on failed requests and a reflection.
// m4-l2: a pipeline of five stages (input, clean, model, output, review), one function per stage,
// the model passed in as a parameter so that tests use fakes; tests with assert and pytest (normal
// cases, edge cases, fixed bugs; a test with no assert proves nothing), logging (levels; ids and
// counts, never keys or comment text), idempotency (one result per comment id, already-done
// comments skipped, counts computed from the results), a human in the loop (below the threshold,
// a person decides and their label survives reruns; a queue too long to read carefully calls for
// a better model, not faster reading; the queue read as data, e.g. comments in another language;
// spot checks of the rest).
// No curated video fits this lesson, so it has no watch block (m4-l1 has the module's). The try
// stage is on paper: a log of six comments to read (c106 at exactly 0.70 sent to review; an old
// log line with a comment's text and an unmasked phone number) and four tests to design. A
// check_my_work tutor activity (not in the outline: added so that the lesson has its ask_ai
// stage), then the Python code activity with tests to complete (build), checked with Python 3.13
// and pytest 9.1: run as given, it logs "INFO c1: food (0.92), auto", "INFO c2: empty, skipped",
// "INFO c3: other (0.40), review", "INFO c4: other (0.40), review" and "INFO 4 comments in, 3
// results", then prints {'waiting for review': 2, 'food': 1} and {'waiting for review': 1,
// 'food': 1, 'timing': 1}; its 11 tests pass (the 5 TODO tests are empty). Written as the lesson
// expects, TODO 1, 3 and 4 pass (TODO 4 fails if the "if cid in results" skip is removed),
// TODO 2 (route(0.70) == "auto") fails on purpose, because route
// uses > while the comment of THRESHOLD says "below", and TODO 5 ("Call 06 00 00 00 00") fails
// on purpose, because split() makes five two-digit words: no rule catches every personal detail.
// clean also turns a date such as 2026-11-14 into [number] (a question of step 5). Then the module
// quiz quiz-m4 (seven questions on both lessons) and a reflection.
// No Machine Learning for Kids activity in this module (the outline gives none), hence no
// project block and no project. The instructions and hints of code_activity and ai_activity
// blocks, reflection prompts and quiz texts are plain text (the player renders no Markdown
// there), so they use no backticks, as in m1 and m2. French typography uses \u00a0 escapes, as
// in the other course files.

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
          title: 'APIs and automation',
          description:
            'Call AI services from your code safely: requests, keys, limits, errors, costs and privacy. Then build and test a small automated pipeline that leaves the uncertain decisions to a person.',
        },
        fr: {
          title: 'API et automatisation',
          description:
            'Appelle des services d’IA depuis ton code en toute sécurité\u00a0: requêtes, clés, limites, erreurs, coûts et vie privée. Construis et teste ensuite un petit pipeline automatisé qui laisse les décisions incertaines à une personne.',
        },
      },
    },
    lessons: [
      // --- m4-l1: Calling AI services safely ------------------------------------------------------
      {
        id: 'm4-l1',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Calling AI services safely',
              summary:
                'How a program talks to an AI service: HTTP requests, JSON and status codes, keys kept in environment variables, rate limits, retries with backoff, costs and the privacy of what you send.',
            },
            fr: {
              title: 'Appeler des services d’IA en toute sécurité',
              summary:
                'Comment un programme dialogue avec un service d’IA\u00a0: requêtes HTTP, JSON et codes d’état, clés rangées dans des variables d’environnement, limites de débit, nouvelles tentatives avec attente, coûts et confidentialité de ce que tu envoies.',
            },
          },
          estimatedMinutes: 40,
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
                heading: 'Three hundred comments and a quick script',
                body: "After the school science fair, where the club showed its roof weather station, visitors left **300 short comments** on an anonymous online form (all invented for this module). Sorting them by topic by hand, *food*, *timing*, *activities* or *other*, would take an evening. An AI service that classifies text, like the model behind the mascot of *Classify text from Python*, could do it in a minute. So on Friday afternoon, one member writes a quick script:\n\n- the service's key is pasted into the code, and the code goes into the club's shared folder;\n- a loop sends the 300 comments, one request each, and uses whatever comes back;\n- the comments are sent exactly as they were typed.\n\nAt comment 61, the service answers *429 Too Many Requests* and the script crashes. Nobody knows which comments were done. Then someone notices that two comments contain a phone number, now sent to a company's servers, and that anyone who opens the shared folder can read the key and use it.\n\nNone of these problems comes from the model. They all come from the code **around** the call. In *Classify text from Python*, a few lines copied from Machine Learning for Kids made that call for you. This lesson opens the box: what a request to an AI service contains, and how engineers make it safe, reliable and affordable.",
              },
              fr: {
                heading: 'Trois cents commentaires et un script vite fait',
                body: 'Après l’exposition scientifique du lycée, où le club présentait sa station météo du toit, les visiteurs ont laissé **300\u00a0courts commentaires** dans un formulaire en ligne anonyme (tous inventés pour ce module). Les trier à la main par thème, *nourriture*, *horaires*, *activités* ou *autre*, prendrait une soirée. Un service d’IA qui classe des textes, comme le modèle de la mascotte de la leçon *Classer du texte depuis Python*, le ferait en une minute. Le vendredi après-midi, un membre du club écrit donc un script vite fait\u00a0:\n\n- la clé du service est collée dans le code, et le code part dans le dossier partagé du club\u00a0;\n- une boucle envoie les 300\u00a0commentaires, une requête pour chacun, et utilise tout ce qui revient\u00a0;\n- les commentaires sont envoyés tels qu’ils ont été tapés.\n\nAu 61e\u00a0commentaire, le service répond *429 Too Many Requests* (trop de requêtes) et le script plante. Personne ne sait quels commentaires ont été traités. Puis quelqu’un remarque que deux commentaires contiennent un numéro de téléphone, désormais envoyé aux serveurs d’une entreprise, et que n’importe qui peut ouvrir le dossier partagé, lire la clé et s’en servir.\n\nAucun de ces problèmes ne vient du modèle. Ils viennent tous du code **autour** de l’appel. Dans la leçon *Classer du texte depuis Python*, quelques lignes copiées depuis Machine Learning for Kids faisaient cet appel à ta place. Cette leçon ouvre la boîte\u00a0: ce que contient une requête à un service d’IA, et comment les ingénieurs la rendent sûre, fiable et abordable.',
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
                heading: 'Inside a call: HTTP requests and JSON',
                body: 'An **API** (application programming interface) lets one program use another. Most AI services are **web APIs**: your code talks to them over **HTTP**, the protocol your browser uses to load pages. Each exchange is a **request** followed by a **response**.\n\n| Part of the request | In the club\'s script | What it is for |\n|---|---|---|\n| **Method** | `POST` | What you want: `GET` asks for something, `POST` sends data to be processed |\n| **URL**, the endpoint | `https://api.example.com/v1/classify` | Where the service is |\n| **Headers** | `Authorization: Bearer YOUR-KEY` | Extra information, such as who you are: the key |\n| **Body** | `{"text": "The sandwich stand ran out before noon."}` | The data to process |\n\nThe response has a **status code**, headers of its own and a body:\n\n```\nHTTP 200\n{"label": "food", "confidence": 0.91}\n```\n\nThe body is **JSON** (JavaScript Object Notation), the text format of almost every web API. It looks like a Python dictionary, with small differences: strings always take double quotes, and JSON writes `true`, `false` and `null` where Python writes `True`, `False` and `None`. With **requests**, a widely used Python library, `requests.post(url, json=body)` turns your dictionary into JSON, and `response.json()` turns the answer back into a dictionary. Each service documents its own fields and scales: this one gives its confidence from 0 to 1, where Machine Learning for Kids gave it from 0 to 100.\n\nRead the **status code** before anything else:\n\n| Code | Meaning | What your program should do |\n|---|---|---|\n| 200 | OK | Read the body, then check it |\n| 400 | Bad request: the request itself is wrong | Fix the code: sending it again changes nothing |\n| 401, 403 | Missing or wrong key; not allowed | Stop, and check the key and your access |\n| 404 | Nothing at this URL | Check the endpoint |\n| 429 | Too many requests | Wait, then try again |\n| 500, 502, 503, 504 | A problem on the service\'s side | Wait, then try again |\n\nThe rule of thumb: a code in the **400s** means that *your* request is the problem, except 429, which only means *not so fast*. A code in the **500s**, a 429 or no answer at all may work if you try again later. And a 200 only means that an answer arrived, not that it is right: check it before you use it.',
              },
              fr: {
                heading: 'Dans un appel\u00a0: requêtes HTTP et JSON',
                body: 'Une **API** (interface de programmation d’application) permet à un programme d’en utiliser un autre. La plupart des services d’IA sont des **API web**\u00a0: ton code dialogue avec eux grâce à **HTTP**, le protocole qu’utilise ton navigateur pour charger les pages. Chaque échange est une **requête** suivie d’une **réponse**.\n\n| Partie de la requête | Dans le script du club | À quoi elle sert |\n|---|---|---|\n| **Méthode** | `POST` | Ce que tu veux\u00a0: `GET` demande quelque chose, `POST` envoie des données à traiter |\n| **URL**, le point d’accès (*endpoint*) | `https://api.example.com/v1/classify` | Où se trouve le service |\n| **En-têtes** (*headers*) | `Authorization: Bearer YOUR-KEY` | Des informations en plus, comme ton identité\u00a0: la clé |\n| **Corps** (*body*) | `{"text": "The sandwich stand ran out before noon."}` | Les données à traiter (ici\u00a0: «\u00a0le stand de sandwichs a été dévalisé avant midi\u00a0») |\n\nLa réponse comporte un **code d’état**, ses propres en-têtes et un corps (label = étiquette, food = nourriture, confidence = confiance)\u00a0:\n\n```\nHTTP 200\n{"label": "food", "confidence": 0.91}\n```\n\nLe corps est écrit en **JSON** (*JavaScript Object Notation*), le format texte de presque toutes les API web. Il ressemble à un dictionnaire Python, à quelques détails près\u00a0: les chaînes sont toujours entre guillemets doubles, et JSON écrit `true`, `false` et `null` là où Python écrit `True`, `False` et `None`. Avec **requests**, une bibliothèque Python très répandue, `requests.post(url, json=body)` transforme ton dictionnaire en JSON, et `response.json()` retransforme la réponse en dictionnaire. Chaque service documente ses propres champs et ses propres échelles\u00a0: celui-ci donne sa confiance de 0 à 1, alors que Machine Learning for Kids la donnait de 0 à 100.\n\nLis le **code d’état** avant toute chose\u00a0:\n\n| Code | Signification | Ce que doit faire ton programme |\n|---|---|---|\n| 200 | OK | Lire le corps, puis le vérifier |\n| 400 | Requête incorrecte\u00a0: c’est la requête elle-même qui pose problème | Corriger le code\u00a0: la renvoyer ne change rien |\n| 401, 403 | Clé absente ou fausse\u00a0; accès refusé | S’arrêter, et vérifier la clé et tes droits d’accès |\n| 404 | Rien à cette URL | Vérifier le point d’accès |\n| 429 | Trop de requêtes | Attendre, puis réessayer |\n| 500, 502, 503, 504 | Un problème du côté du service | Attendre, puis réessayer |\n\nLa règle générale\u00a0: un code de la famille **400** signifie que c’est *ta* requête qui pose problème, sauf le 429, qui veut seulement dire *pas si vite*. Un code de la famille **500**, un 429 ou une absence totale de réponse peuvent se régler si tu réessaies plus tard. Et un 200 signifie seulement qu’une réponse est arrivée, pas qu’elle est juste\u00a0: vérifie-la avant de t’en servir.',
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
                heading: 'Five things to get right around every call',
                body: '**1. Keep the key secret.** An API key identifies an account, and that account pays for every request made with the key. Anyone who has it can use it, at the owner\'s expense.\n\n- Your program reads the key from an **environment variable**, a value set outside the code: `os.environ.get("CLASSIFIER_API_KEY")`. You set it in the terminal, in your notebook\'s secrets settings or in a local file that is never shared.\n- Never write a key in code, in a screenshot, in a shared document or in a chat, the AI tutor and RoboHolic included. In anything you hand in, write `YOUR-KEY` instead, as you did with your Titanic model.\n- Call a paid service from your own program or from a server, never from the code of a web page, which any visitor can read.\n- If a key leaks, tell your teacher at once: it must be revoked (cancelled) and replaced.\n- Do not create your own account with an AI provider to get a key: many providers require you to be 18 or older. Use only a key or a tool that your teacher or school provides.\n\n**2. Respect the limits.** A service caps the number of requests an account may send per minute or per day: its **rate limit**. Beyond it, the answer is 429, sometimes with a `Retry-After` header that says how many seconds to wait.\n\n**3. Expect failures, and retry with care.** Networks drop and servers get overloaded. A robust client:\n\n- always sets a **timeout**, so that it never waits forever;\n- retries only what may work later (429, the 500s, no answer), never a 400 or a 401;\n- waits longer after each failure, 1 second, then 2, then 4: this **exponential backoff** gives the service time to recover instead of flooding it. Many clients also add a little randomness to each wait, called **jitter**, so that thousands of programs do not all retry at the same moment;\n- stops after a fixed number of attempts and hands the item to a person.\n\n**4. Count the cost.** Many AI services charge per request or per amount of text, or allow a fixed number of requests per day. Every retry is one more request. Try your script on 5 comments before 300, count the requests it sends, and set a spending limit when the service offers one.\n\n**5. Send as little as possible.** What you send leaves your control: the provider receives it, may keep it in its logs and, depending on its terms, may use it to improve its models. Send only what the task needs (the comment, not the rest of the form), remove names and contact details first, never send photos of people, health information or grades, and use only services that your school has approved.',
              },
              fr: {
                heading: 'Cinq points à soigner autour de chaque appel',
                body: '**1. Garde la clé secrète.** Une clé d’API identifie un compte, et ce compte paie chaque requête faite avec elle. Quiconque la possède peut s’en servir, aux frais de son propriétaire.\n\n- Ton programme lit la clé dans une **variable d’environnement**, une valeur définie en dehors du code\u00a0: `os.environ.get("CLASSIFIER_API_KEY")`. Tu la définis dans le terminal, dans les réglages de secrets de ton notebook ou dans un fichier local qui n’est jamais partagé.\n- N’écris jamais une clé dans du code, sur une capture d’écran, dans un document partagé ou dans une conversation, tuteur IA et RoboHolic compris. Dans tout ce que tu rends, écris `YOUR-KEY` à la place, comme pour ton modèle du Titanic.\n- Appelle un service payant depuis ton propre programme ou depuis un serveur, jamais depuis le code d’une page web, que n’importe quel visiteur peut lire.\n- Si une clé a fuité, préviens tout de suite ton enseignant\u00a0: il faut la révoquer (l’annuler) et la remplacer.\n- Ne crée pas toi-même de compte chez un fournisseur d’IA pour obtenir une clé\u00a0: beaucoup de fournisseurs exigent d’avoir au moins 18\u00a0ans. N’utilise que la clé ou l’outil que ton enseignant ou ton établissement te fournit.\n\n**2. Respecte les limites.** Un service plafonne le nombre de requêtes qu’un compte peut envoyer par minute ou par jour\u00a0: c’est sa **limite de débit** (*rate limit*). Au-delà, il répond 429, parfois avec un en-tête `Retry-After` qui indique combien de secondes attendre.\n\n**3. Attends-toi aux pannes, et réessaie avec prudence.** Les réseaux coupent et les serveurs saturent. Un client robuste\u00a0:\n\n- fixe toujours un **délai d’attente maximal** (*timeout*), pour ne jamais attendre indéfiniment\u00a0;\n- ne réessaie que ce qui peut marcher plus tard (le 429, la famille 500, l’absence de réponse), jamais un 400 ni un 401\u00a0;\n- attend plus longtemps après chaque échec, 1\u00a0seconde, puis 2, puis 4\u00a0: cette **attente exponentielle** (*exponential backoff*) laisse au service le temps de se rétablir au lieu de l’inonder de requêtes. Beaucoup de clients ajoutent aussi un peu de hasard à chaque attente (le *jitter*), pour que des milliers de programmes ne réessaient pas tous au même instant\u00a0;\n- s’arrête après un nombre fixe de tentatives et confie l’élément à une personne.\n\n**4. Compte ce que cela coûte.** Beaucoup de services d’IA facturent à la requête ou à la quantité de texte, ou autorisent un nombre fixe de requêtes par jour. Chaque nouvelle tentative est une requête de plus. Essaie ton script sur 5\u00a0commentaires avant d’en traiter 300, compte les requêtes qu’il envoie, et fixe un plafond de dépenses quand le service le propose.\n\n**5. Envoie le moins possible.** Ce que tu envoies t’échappe\u00a0: le fournisseur le reçoit, peut le conserver dans ses journaux et, selon ses conditions d’utilisation, s’en servir pour améliorer ses modèles. N’envoie que ce dont la tâche a besoin (le commentaire, pas le reste du formulaire), retire d’abord les noms et les coordonnées, n’envoie jamais de photos de personnes, d’informations de santé ni de notes, et n’utilise que des services approuvés par ton établissement.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l1-b4',
            type: 'video',
            stage: 'watch',
            defaultLocale: 'en',
            translations: {
              en: {
                title: 'Watch: What is a REST API? (IBM Technology)',
                caption:
                  'IBM Technology explains the style of web API that most AI services follow. As you watch, spot the method, the URL, the status code and the JSON of this lesson.',
                transcript:
                  'In short: an API lets one program use the services of another through a clearly defined interface, and REST is the most common style of web API. A client sends an HTTP request to a URL that names a resource, with a method that says what it wants: GET to read, POST to create, PUT to update and DELETE to remove. The server answers with a status code and data, usually in JSON. Every request carries everything the server needs to handle it, so the server does not have to remember earlier requests. For this lesson: calling an AI service usually means sending a POST request with a JSON body and a key in a header, then checking the status code before reading the JSON that comes back.',
              },
              fr: {
                title: 'Regarde\u00a0: qu’est-ce qu’une API REST\u00a0? (IBM Technology)',
                caption:
                  'IBM Technology explique le style d’API web que suivent la plupart des services d’IA (vidéo en anglais). Pendant la vidéo, repère la méthode, l’URL, le code d’état et le JSON de cette leçon.',
                transcript:
                  'En bref\u00a0: une API permet à un programme d’utiliser les services d’un autre grâce à une interface clairement définie, et REST est le style d’API web le plus courant. Un client envoie une requête HTTP à une URL qui désigne une ressource, avec une méthode qui dit ce qu’il veut\u00a0: GET pour lire, POST pour créer, PUT pour modifier et DELETE pour supprimer. Le serveur répond par un code d’état et des données, le plus souvent en JSON. Chaque requête contient tout ce dont le serveur a besoin pour la traiter\u00a0: il n’a donc pas à se souvenir des requêtes précédentes. Pour cette leçon\u00a0: appeler un service d’IA revient en général à envoyer une requête POST avec un corps en JSON et une clé dans un en-tête, puis à vérifier le code d’état avant de lire le JSON qui revient.',
              },
            },
            data: {
              source: 'youtube',
              videoId: 'lsMQRaeKNDk',
              fileId: null,
              durationSeconds: null,
            },
          },
          {
            id: 'm4-l1-b5',
            type: 'code_activity',
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Read this client like an engineer. It sends one comment to a text-classification service and returns its label and its confidence. The URL, the field names and the topics are placeholders, so your code is saved, not run: trace it by hand, and never write a real key in it.\n\n1. Find the lines that keep the key out of the code, the one that stops the program from waiting forever, and the one that limits the number of tries.\n2. Scenario A: the service answers 503, then 429, then 200 with {"label": "food", "confidence": 0.91}. Write what the program prints. How many requests were sent, and how many seconds did it wait in total?\n3. Scenario B: the key is wrong, so the service answers 401. Scenario C: the network is down for every attempt. For each one: how many requests, how many seconds of waiting, and how does it end? Why is it right not to try again in scenario B?\n4. TODO 1: the service sometimes sends a strange answer, such as {"label": "Food!", "confidence": 0.91}, {"label": "timing", "confidence": 1.7} or {"confidence": 0.5}. Work out what the code does with each one. Then write a check: the label must be one of TOPICS and the confidence a number from 0 to 1; otherwise, raise a ServiceError.\n5. The club has 300 comments, and its plan allows 500 requests a day (invented figures). How many requests can the script send in the worst case? Suggest two changes that would keep it under the limit.\n6. Challenge, TODO 2: after a 429, wait the number of seconds given in the Retry-After header, if the service sent one.',
                hint: 'In scenario A, the loop prints a line only before it waits, so it prints two lines; then the main part prints the result. answer["label"] crashes with a KeyError when the field "label" is missing, while answer.get("label") gives None instead. TOPICS is a list, so label in TOPICS is enough to check the label. For TODO 2, response.headers.get("Retry-After") gives the value as text, or None.',
              },
              fr: {
                instructions:
                  'Lis ce client comme un ingénieur. Il envoie un commentaire à un service de classification de textes et renvoie son étiquette et sa confiance. L’URL, les noms des champs et les thèmes sont fictifs\u00a0: ton code est donc enregistré, pas exécuté. Suis-le à la main, et n’y écris jamais de vraie clé. Dans le code, les noms sont en anglais\u00a0: comment = commentaire, label = étiquette, confidence = confiance, attempt = tentative, delay = attente, reason = raison, answer = réponse, key = clé, TOPICS = thèmes (food = nourriture, timing = horaires, activities = activités, other = autre).\n\n1. Repère les lignes qui gardent la clé hors du code, celle qui empêche le programme d’attendre indéfiniment, et celle qui limite le nombre d’essais.\n2. Scénario A\u00a0: le service répond 503, puis 429, puis 200 avec {"label": "food", "confidence": 0.91}. Écris ce qu’affiche le programme. Combien de requêtes ont été envoyées, et combien de secondes a-t-il attendu au total\u00a0?\n3. Scénario B\u00a0: la clé est fausse, et le service répond 401. Scénario C\u00a0: le réseau est coupé à chaque tentative. Pour chacun\u00a0: combien de requêtes, combien de secondes d’attente, et comment cela se termine-t-il\u00a0? Pourquoi a-t-on raison de ne pas réessayer dans le scénario B\u00a0?\n4. TODO\u00a01\u00a0: le service renvoie parfois une réponse étrange, comme {"label": "Food!", "confidence": 0.91}, {"label": "timing", "confidence": 1.7} ou {"confidence": 0.5}. Détermine ce que le code fait de chacune. Écris ensuite une vérification\u00a0: l’étiquette doit faire partie de TOPICS et la confiance être un nombre compris entre 0 et 1\u00a0; sinon, déclenche une ServiceError.\n5. Le club a 300\u00a0commentaires, et son abonnement autorise 500\u00a0requêtes par jour (des chiffres inventés). Combien de requêtes le script peut-il envoyer dans le pire des cas\u00a0? Propose deux changements qui le maintiendraient sous la limite.\n6. Défi, TODO\u00a02\u00a0: après un 429, attends le nombre de secondes indiqué dans l’en-tête Retry-After, si le service en a envoyé un.',
                hint: 'Dans le scénario A, la boucle n’affiche une ligne qu’avant d’attendre\u00a0: elle en affiche donc deux, puis la partie principale affiche le résultat. answer["label"] plante avec une KeyError quand le champ "label" manque, alors que answer.get("label") donne None à la place. TOPICS est une liste\u00a0: label in TOPICS suffit à vérifier l’étiquette. Pour le TODO\u00a02, response.headers.get("Retry-After") donne la valeur sous forme de texte, ou None.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                '# classifier_client.py: asks a text-classification service for the topic of one comment.',
                '# The URL, the field names and the topics are placeholders: every real service documents its',
                '# own. NEVER write a real key here. / L’URL, les champs et les thèmes sont fictifs. N’écris',
                '# JAMAIS de vraie clé ici.',
                'import os',
                'import time',
                '',
                'import requests',
                '',
                'API_URL = "https://api.example.com/v1/classify"  # a placeholder: there is no real service here',
                'TOPICS = ["food", "timing", "activities", "other"]',
                'MAX_ATTEMPTS = 4',
                "RETRY_LATER = [429, 500, 502, 503, 504]  # too many requests, or a problem on the server's side",
                '',
                '',
                'class ServiceError(Exception):',
                '    """The service gave no usable answer: a person will sort this comment."""',
                '',
                '',
                'def get_key():',
                '    """Read the key from an environment variable: it is never written in the code."""',
                '    key = os.environ.get("CLASSIFIER_API_KEY")',
                '    if not key:',
                '        raise ServiceError("No key: set the environment variable CLASSIFIER_API_KEY first.")',
                '    return key',
                '',
                '',
                'def classify(comment):',
                '    """Ask the service for the topic of one comment. Return (label, confidence)."""',
                '    headers = {"Authorization": "Bearer " + get_key()}',
                '    for attempt in range(1, MAX_ATTEMPTS + 1):',
                '        try:',
                '            response = requests.post(API_URL, headers=headers, json={"text": comment}, timeout=10)',
                '            status = response.status_code',
                '        except requests.exceptions.RequestException:  # no network, or 10 s of silence',
                '            status = None',
                '',
                '        if status == 200:',
                '            answer = response.json()  # the JSON body, as a Python dictionary',
                '            # TODO 1: check the answer before you trust it. / Vérifie la réponse.',
                '            return answer["label"], answer["confidence"]',
                '',
                '        if status is not None and status not in RETRY_LATER:',
                '            # 400 bad request, 401 missing or wrong key, 403 not allowed: retrying will not help.',
                '            raise ServiceError(f"Refused with HTTP {status}.")',
                '',
                '        if attempt < MAX_ATTEMPTS:',
                '            delay = 2 ** (attempt - 1)  # exponential backoff: 1, 2, then 4 seconds',
                '            # TODO 2 (challenge): after a 429, wait Retry-After seconds instead, if it was sent.',
                '            reason = "no answer" if status is None else f"HTTP {status}"',
                '            print(f"attempt {attempt}: {reason}, waiting {delay} s")',
                '            time.sleep(delay)',
                '',
                '    raise ServiceError(f"No usable answer after {MAX_ATTEMPTS} attempts.")',
                '',
                '',
                'if __name__ == "__main__":  # only when this file is run itself, not when it is imported',
                '    label, confidence = classify("The sandwich stand ran out before noon.")',
                '    print(label, confidence)',
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
                  'Practise the decision that a good client makes every time a request fails. Ask the AI tutor to describe, one at a time, requests that went wrong (a status code, a message, a situation), and say for each one: retry after a wait, fix something first, or stop and hand the item to a person. The tutor is an AI tool too, so apply this lesson: no keys and no personal details in your messages.',
                starterPrompt:
                  'Challenge me on API errors. Describe a request to an AI service that went wrong (a status code or a missing answer, and the situation), and I will say whether my program should retry after a wait, fix something first, or stop. Wait for my answer before you explain, then give me the next one.',
              },
              fr: {
                instructions:
                  'Entraîne-toi à la décision qu’un bon client doit prendre chaque fois qu’une requête échoue. Demande au tuteur IA de te décrire, une par une, des requêtes qui ont mal tourné (un code d’état, un message, une situation), et dis pour chacune\u00a0: réessayer après une attente, corriger quelque chose d’abord, ou s’arrêter et confier l’élément à une personne. Le tuteur est lui aussi un outil d’IA\u00a0: applique cette leçon, et ne mets ni clé ni information personnelle dans tes messages.',
                starterPrompt:
                  'Mets-moi au défi sur les erreurs d’API. Décris-moi une requête à un service d’IA qui a mal tourné (un code d’état ou une absence de réponse, et la situation), et je te dirai si mon programme doit réessayer après une attente, corriger quelque chose d’abord, ou s’arrêter. Attends ma réponse avant d’expliquer, puis passe au cas suivant.',
              },
            },
            data: { tutorMode: 'challenge_me', labToolId: null },
          },
          {
            id: 'm4-l1-b7',
            type: 'reflection',
            stage: 'reflect',
            defaultLocale: 'en',
            translations: {
              en: {
                prompt:
                  'Your school wants to add an AI service to a tool that students use, such as a homework planner. Write three questions you would ask before the first request is sent (about the key, the data sent, the cost and the limits, or what happens when the service fails). Which one matters most to you, and why?',
              },
              fr: {
                prompt:
                  'Ton établissement veut ajouter un service d’IA à un outil utilisé par les élèves, comme un agenda de devoirs. Écris trois questions que tu poserais avant l’envoi de la première requête (sur la clé, les données envoyées, le coût et les limites, ou ce qui se passe quand le service tombe en panne). Laquelle compte le plus pour toi, et pourquoi\u00a0?',
              },
            },
            data: { minLength: 100 },
          },
        ],
      },

      // --- m4-l2: Automate and test a pipeline ----------------------------------------------------
      {
        id: 'm4-l2',
        input: {
          defaultLocale: 'en',
          translations: {
            en: {
              title: 'Automate and test a pipeline',
              summary:
                'Turn the client into an automated pipeline (input, clean, model, output, review), test each step with assert, log what happens, make reruns safe and leave the uncertain decisions to a person.',
            },
            fr: {
              title: 'Automatiser et tester un pipeline',
              summary:
                'Transforme le client en pipeline automatisé (entrée, nettoyage, modèle, sortie, relecture), teste chaque étape avec assert, journalise ce qui se passe, rends les relances sans danger et laisse les décisions incertaines à une personne.',
            },
          },
          estimatedMinutes: 45,
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
                heading: 'The run that counted twice',
                body: "The club fixed its client, wrapped it in a script and left it running on Friday evening to sort the 300 comments. On Monday morning:\n\n- the script had stopped at comment 212, which contained nothing but spaces;\n- someone had restarted it from the beginning, and the script had **added** its new counts to the totals it had already saved: the first 211 comments were counted twice;\n- every comment that was not written in English had come back as *other*, with a low confidence. Nobody had read them, so the summary for the organisers left out a whole group of visitors.\n\nA handful of well-chosen test comments, and a look at the results, would have caught each of these problems before Friday. **Automation repeats your mistakes faster than you ever could.** That is why engineers build automated work as a **pipeline** of small steps, **test** each step before they trust it, make sure that a rerun is **safe**, keep a **log** of what happened, and leave the uncertain decisions to a **person**. In this lesson, you will do all five with the club's comments.",
              },
              fr: {
                heading: 'Le traitement qui comptait double',
                body: 'Le club a corrigé son client, l’a intégré à un script et l’a laissé tourner le vendredi soir pour trier les 300\u00a0commentaires. Le lundi matin\u00a0:\n\n- le script s’était arrêté au 212e\u00a0commentaire, qui ne contenait que des espaces\u00a0;\n- quelqu’un l’avait relancé depuis le début, et le script avait **ajouté** ses nouveaux comptes aux totaux déjà enregistrés\u00a0: les 211\u00a0premiers commentaires avaient été comptés deux fois\u00a0;\n- tous les commentaires qui n’étaient pas écrits en anglais étaient revenus classés *other* (autre), avec une confiance faible. Personne ne les avait lus, si bien que le bilan remis aux organisateurs oubliait tout un groupe de visiteurs.\n\nUne poignée de commentaires de test bien choisis, et un coup d’œil aux résultats, auraient suffi à repérer chacun de ces problèmes avant vendredi. **L’automatisation répète tes erreurs bien plus vite que tu ne le ferais toi-même.** C’est pourquoi les ingénieurs organisent un travail automatisé en **pipeline**, une chaîne de petites étapes\u00a0: ils **testent** chaque étape avant de s’y fier, s’assurent qu’une relance est **sans danger**, tiennent un **journal** de ce qui s’est passé et laissent les décisions incertaines à une **personne**. Dans cette leçon, tu vas faire ces cinq choses avec les commentaires du club.',
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
                heading: 'A pipeline: five small steps',
                body: "You met the idea in *Classify text from Python*: a **pipeline** is a chain of steps in which the output of each step is the input of the next. The mascot's pipeline handled one message while a visitor waited; this one must run on its own, overnight, on hundreds of comments. It has five stages:\n\n| Stage | In the club's pipeline | What can go wrong |\n|---|---|---|\n| **1. Input** | Read the form's CSV file, as in *Working with data*: an id and a comment per row | A missing or empty comment, the same file read twice |\n| **2. Clean** | Remove extra spaces, skip empty comments, hide email addresses and phone numbers | A personal detail that slips through, a rule that hides too much |\n| **3. Model** | Send each clean comment to the client of the last lesson, which returns a label and a confidence | Errors, limits, strange answers, a model that works worse for some comments |\n| **4. Output** | Keep one result per comment, and count the labels for the organisers | Counts added twice, results lost when the script stops |\n| **5. Review** | A person reads the comments the model is unsure about, and a few of the others | Nobody looking, or so much to read that people stop reading carefully |\n\nThree design rules make a pipeline easy to test and to repair:\n\n- **One function per step**, with a clear input and output, such as `clean(text)` or `route(confidence)`. You can test each one on its own, and change one without breaking the others.\n- **Pass the model in as a parameter.** `run_pipeline(comments, classify, results)` does not care whether `classify` is the real service or a **fake**: a stand-in function that always gives the same answers. The tests use fakes, so they need no network, no key and no money, and they give the same result every time.\n- **Treat the model's answer as a suggestion.** When the confidence is below a **threshold**, or when the service gave no usable answer, the comment goes to a **review queue** and a person decides. This is called keeping a **human in the loop**.",
              },
              fr: {
                heading: 'Un pipeline\u00a0: cinq petites étapes',
                body: 'Tu as rencontré l’idée dans la leçon *Classer du texte depuis Python*\u00a0: un **pipeline** (une chaîne de traitement) est une suite d’étapes dans laquelle la sortie de chaque étape devient l’entrée de la suivante. Celui de la mascotte traitait un message pendant qu’un visiteur attendait\u00a0; celui-ci doit tourner seul, la nuit, sur des centaines de commentaires. Il compte cinq étapes\u00a0:\n\n| Étape | Dans le pipeline du club | Ce qui peut mal tourner |\n|---|---|---|\n| **1. Entrée** | Lire le fichier CSV du formulaire, comme dans la leçon *Travailler avec des données*\u00a0: un identifiant et un commentaire par ligne | Un commentaire manquant ou vide, le même fichier lu deux fois |\n| **2. Nettoyage** | Supprimer les espaces en trop, ignorer les commentaires vides, masquer les adresses e-mail et les numéros de téléphone | Une donnée personnelle qui passe entre les mailles, une règle qui masque trop |\n| **3. Modèle** | Envoyer chaque commentaire nettoyé au client de la leçon précédente, qui renvoie une étiquette et une confiance | Des erreurs, des limites, des réponses étranges, un modèle qui marche moins bien pour certains commentaires |\n| **4. Sortie** | Garder un résultat par commentaire, et compter les étiquettes pour les organisateurs | Des comptes ajoutés deux fois, des résultats perdus quand le script s’arrête |\n| **5. Relecture** | Une personne lit les commentaires dont le modèle n’est pas sûr, et quelques autres | Personne ne regarde, ou il y a tant à lire qu’on finit par lire sans attention |\n\nTrois règles de conception rendent un pipeline facile à tester et à réparer\u00a0:\n\n- **Une fonction par étape**, avec une entrée et une sortie claires, comme `clean(text)` (nettoyer) ou `route(confidence)` (aiguiller). Tu peux tester chacune séparément, et en modifier une sans casser les autres.\n- **Passe le modèle en paramètre.** Pour `run_pipeline(comments, classify, results)`, peu importe que `classify` soit le vrai service ou un **faux** (*fake*)\u00a0: une fonction de remplacement qui donne toujours les mêmes réponses. Les tests utilisent des faux\u00a0: ils n’ont besoin ni de réseau, ni de clé, ni d’argent, et donnent le même résultat à chaque fois.\n- **Traite la réponse du modèle comme une suggestion.** Quand la confiance est inférieure à un **seuil**, ou quand le service n’a donné aucune réponse utilisable, le commentaire part dans une **file de relecture** et une personne décide. C’est ce qu’on appelle garder un **humain dans la boucle** (*human in the loop*).',
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
                heading: 'Tests, logs, safe reruns and a person in charge',
                body: '**Tests.** A test runs a piece of code on an input whose right answer you already know, and checks the result with `assert`:\n\n```python\ndef test_clean_hides_an_email():\n    assert clean("Write to fan@example.com") == "Write to [email]"\n```\n\nIf the condition is true, nothing happens. If it is false, Python stops with an `AssertionError`. **pytest**, a widely used test tool, calls every function whose name starts with `test_` and lists the ones that fail. Good tests are small, one behaviour each, and they cover normal cases, **edge cases** (an empty comment, a confidence exactly at the threshold) and every bug you have fixed, so that it cannot come back unnoticed. A test with no `assert` always passes, and proves nothing.\n\n**Logs.** Python\'s `logging` module records what the pipeline did, with a level: `INFO` for normal steps, `WARNING` for a problem it handled, `ERROR` for one it could not. Log counts, ids, decisions and errors, such as `INFO c3: other (0.40), review`. Never log keys, and leave the text of comments out of the log: logs are kept, copied and read by many people, so the text stays in the results, where the reviewer needs it.\n\n**Safe reruns.** An automated job will be stopped and started again, so each step should be **idempotent**: running it twice gives the same result as running it once. The club\'s pipeline keeps one result per comment id, skips the comments that already have one, and computes its counts from those results instead of adding them to old totals. A rerun sends no new request and cannot erase a person\'s decision.\n\n**A person in charge.** In *Classify text from Python*, a message below the threshold made the mascot look puzzled; here, a comment below it goes to a person, whose label replaces the model\'s and survives every rerun. If the queue grows too long to read carefully, improve the model or rethink the threshold: do not read faster. Look at the review queue as data, too: if the model is unsure about most of the comments written in one language, it works worse for the people who write in it, and the summary must say so. Finally, have a person **spot-check** a few comments that the model sorted on its own: a confident model can still be wrong.',
              },
              fr: {
                heading: 'Tests, journaux, relances sans danger et une personne aux commandes',
                body: '**Les tests.** Un test exécute un morceau de code sur une entrée dont tu connais déjà la bonne réponse, et vérifie le résultat avec `assert`\u00a0:\n\n```python\ndef test_clean_hides_an_email():\n    assert clean("Write to fan@example.com") == "Write to [email]"\n```\n\nSi la condition est vraie, il ne se passe rien. Si elle est fausse, Python s’arrête sur une `AssertionError`. **pytest**, un outil de test très répandu, appelle chaque fonction dont le nom commence par `test_` et liste celles qui échouent. De bons tests sont petits, un comportement chacun, et couvrent les cas normaux, les **cas limites** (un commentaire vide, une confiance pile au seuil) et chaque bug que tu as corrigé, pour qu’il ne puisse pas revenir sans que personne le remarque. Un test sans `assert` réussit toujours, et ne prouve rien.\n\n**Les journaux.** Le module `logging` de Python enregistre ce qu’a fait le pipeline, avec un niveau\u00a0: `INFO` pour les étapes normales, `WARNING` pour un problème qu’il a su gérer, `ERROR` pour un problème qu’il n’a pas pu régler. Note dans le journal des comptes, des identifiants, des décisions et des erreurs, comme `INFO c3: other (0.40), review`. N’y note jamais de clé, et laisse le texte des commentaires hors du journal\u00a0: les journaux sont conservés, copiés et lus par beaucoup de monde, alors le texte reste dans les résultats, là où la personne qui relit en a besoin.\n\n**Des relances sans danger.** Un traitement automatisé finira par être arrêté puis relancé\u00a0: chaque étape doit donc être **idempotente**, c’est-à-dire que l’exécuter deux fois donne le même résultat que l’exécuter une fois. Le pipeline du club garde un résultat par identifiant de commentaire, ignore les commentaires qui en ont déjà un, et calcule ses comptes à partir de ces résultats au lieu de les ajouter à d’anciens totaux. Une relance n’envoie aucune nouvelle requête et ne peut pas effacer la décision d’une personne.\n\n**Une personne aux commandes.** Dans la leçon *Classer du texte depuis Python*, un message sous le seuil donnait à la mascotte un air perplexe\u00a0; ici, un commentaire sous le seuil part chez une personne, dont l’étiquette remplace celle du modèle et résiste à chaque relance. Si la file devient trop longue pour être lue avec attention, améliore le modèle ou revois le seuil\u00a0: ne lis pas plus vite. Regarde aussi la file de relecture comme des données\u00a0: si le modèle doute de la plupart des commentaires écrits dans une même langue, il fonctionne moins bien pour les personnes qui écrivent dans cette langue, et le bilan doit le dire. Enfin, fais **contrôler au hasard** par une personne quelques commentaires que le modèle a classés seul\u00a0: un modèle sûr de lui peut quand même se tromper.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b4',
            type: RICH,
            stage: 'try',
            defaultLocale: 'en',
            translations: {
              en: {
                heading: 'Read the log, then write tests on paper',
                body: 'Here is the log of a run on six new comments, with the real service:\n\n```\nINFO c101: food (0.95), auto\nWARNING c102: no answer from the service, sent to review\nINFO c103: activities (0.66), review\nINFO c104: empty, skipped\nINFO c105: timing (0.81), auto\nINFO c106: other (0.70), review\nINFO 6 comments in, 5 results\n```\n\nIn the code, the threshold comes with this comment: *below 0.70, a person reads the comment*. On paper or in your notes:\n\n1. Which comments must a person read, and why each one?\n2. Is c106 in the right place? What does that tell you about the code?\n3. Which comment would you spot-check, and why?\n4. An older version of the pipeline wrote this line in its log: `INFO c107: "Call me on 06 00 00 00 00" -> other (0.52)`. Find at least two problems.\n5. Write four tests as a table, *input → expected output*: two for `clean` (a normal case and an edge case) and two for `route` (one of them exactly at the threshold).\n\nKeep your table: you will turn it into code in the activity below.',
              },
              fr: {
                heading: 'Lis le journal, puis écris des tests sur papier',
                body: 'Voici le journal d’un traitement de six nouveaux commentaires avec le vrai service (food = nourriture, activities = activités, timing = horaires, other = autre, empty, skipped = vide, ignoré, no answer from the service, sent to review = pas de réponse du service, envoyé en relecture)\u00a0:\n\n```\nINFO c101: food (0.95), auto\nWARNING c102: no answer from the service, sent to review\nINFO c103: activities (0.66), review\nINFO c104: empty, skipped\nINFO c105: timing (0.81), auto\nINFO c106: other (0.70), review\nINFO 6 comments in, 5 results\n```\n\nDans le code, le seuil est accompagné de ce commentaire\u00a0: *en dessous de 0,70, une personne relit le commentaire*. Sur papier ou dans tes notes\u00a0:\n\n1. Quels commentaires une personne doit-elle relire, et pourquoi chacun\u00a0?\n2. c106 est-il au bon endroit\u00a0? Qu’est-ce que cela t’apprend sur le code\u00a0?\n3. Quel commentaire ferais-tu contrôler au hasard, et pourquoi\u00a0?\n4. Une ancienne version du pipeline écrivait cette ligne dans son journal\u00a0: `INFO c107: "Call me on 06 00 00 00 00" -> other (0.52)` («\u00a0appelle-moi au…\u00a0»). Trouve au moins deux problèmes.\n5. Écris quatre tests sous forme de tableau, *entrée → sortie attendue*\u00a0: deux pour `clean` (un cas normal et un cas limite) et deux pour `route` (dont un pile au seuil).\n\nGarde ton tableau\u00a0: tu le transformeras en code dans l’activité ci-dessous.',
              },
            },
            data: {},
          },
          {
            id: 'm4-l2-b5',
            type: 'ai_activity',
            stage: 'ask_ai',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Paste the four tests of your table (with no personal data in them) and ask the AI tutor to check them. It should tell you whether each expected output is right and which important kind of case is still missing, not write new tests for you.',
                starterPrompt:
                  'Check my work without writing tests for me. My pipeline has clean(text), which removes extra spaces and replaces email addresses and long numbers, and route(confidence), which should return "review" below a threshold of 0.70 and "auto" otherwise. My four tests (input -> expected output): [paste them]. Is each expected output right? Which important kind of case is missing?',
              },
              fr: {
                instructions:
                  'Colle les quatre tests de ton tableau (sans aucune donnée personnelle) et demande au tuteur IA de les vérifier. Il doit te dire si chaque sortie attendue est juste et quel type de cas important manque encore, pas écrire de nouveaux tests à ta place.',
                starterPrompt:
                  'Vérifie mon travail sans écrire de tests à ma place. Mon pipeline contient clean(text), qui supprime les espaces en trop et remplace les adresses e-mail et les longs nombres, et route(confidence), qui doit renvoyer "review" en dessous d’un seuil de 0.70 et "auto" sinon. Mes quatre tests (entrée -> sortie attendue)\u00a0: [colle-les]. Chaque sortie attendue est-elle juste\u00a0? Quel type de cas important manque-t-il\u00a0?',
              },
            },
            data: { tutorMode: 'check_my_work', labToolId: null },
          },
          {
            id: 'm4-l2-b6',
            type: 'code_activity',
            stage: 'build',
            defaultLocale: 'en',
            translations: {
              en: {
                instructions:
                  'Turn your table into code. Here is the club\'s pipeline with its tests. It is saved, not run, so trace it by hand; the fake classifiers stand in for the service of the last lesson, so the tests need no network and no key.\n\n1. Trace the main part at the bottom: write the log lines and the two summaries it prints.\n2. The six tests already written all pass. Check one of them by hand, line by line.\n3. TODO 1: test that an empty comment gives no result. TODO 2: test route with a confidence of exactly 0.70, as the comment of THRESHOLD describes it. Does the code pass your test? Fix the code or the comment, and say which one you chose, and why.\n4. TODO 3: run the pipeline twice with the same results dictionary, and check that the summary has not changed. TODO 4: after record_review(results, "c4", "timing"), run the pipeline again and check that the person\'s label is still there. What would go wrong without the line if cid in results?\n5. TODO 5: test clean on "Call 06 00 00 00 00". Does the test pass? Improve clean, or explain why no rule catches every personal detail and what else the club should do. And what does clean do to a date such as 2026-11-14?\n6. Add the tests of your paper table that are not here yet.\n7. If an AI tool helped you with a test, say so in a comment.\n\nIf your school gives you a Python environment with pytest, run python -m pytest pipeline.py there and compare the result with your trace.',
                hint: 'pytest runs the test functions; the main part only runs the pipeline. For TODO 2: 0.70 > 0.70 is False. For TODO 3, save summarise(results) in a variable between the two runs. For TODO 5, split() turns 06 00 00 00 00 into five words of two digits each, and 2026-11-14 is a single word with eight digits.',
              },
              fr: {
                instructions:
                  'Transforme ton tableau en code. Voici le pipeline du club avec ses tests. Il est enregistré, pas exécuté\u00a0: suis-le à la main. Les faux classifieurs remplacent le service de la leçon précédente, si bien que les tests n’ont besoin ni de réseau ni de clé. Dans le code, les noms sont en anglais\u00a0: clean = nettoyer, route = aiguiller, review = relecture, results = résultats, record_review = enregistrer la relecture, summarise = résumer, waiting for review = en attente de relecture, checked = vérifié, fake_classify = faux classifieur, broken_classify = classifieur en panne, words = mots, cleaned = nettoyé.\n\n1. Suis la partie principale, tout en bas\u00a0: écris les lignes du journal et les deux bilans qu’elle affiche.\n2. Les six tests déjà écrits réussissent tous. Vérifie-en un à la main, ligne par ligne.\n3. TODO\u00a01\u00a0: teste qu’un commentaire vide ne donne aucun résultat. TODO\u00a02\u00a0: teste route avec une confiance d’exactement 0.70, comme la décrit le commentaire de THRESHOLD (le seuil). Le code réussit-il ton test\u00a0? Corrige le code ou le commentaire, et dis lequel tu as choisi, et pourquoi.\n4. TODO\u00a03\u00a0: exécute le pipeline deux fois avec le même dictionnaire results, et vérifie que le bilan n’a pas changé. TODO\u00a04\u00a0: après record_review(results, "c4", "timing"), relance le pipeline et vérifie que l’étiquette donnée par la personne est toujours là. Que se passerait-il sans la ligne if cid in results\u00a0?\n5. TODO\u00a05\u00a0: teste clean sur "Call 06 00 00 00 00" («\u00a0appelle le 06…\u00a0»). Le test réussit-il\u00a0? Améliore clean, ou explique pourquoi aucune règle ne repère toutes les données personnelles, et ce que le club devrait faire d’autre. Et que fait clean d’une date comme 2026-11-14\u00a0?\n6. Ajoute les tests de ton tableau papier qui ne figurent pas encore ici.\n7. Si un outil d’IA t’a aidé à écrire un test, indique-le dans un commentaire.\n\nSi ton établissement te donne accès à un environnement Python avec pytest, lance python -m pytest pipeline.py dans cet environnement et compare le résultat avec ta trace.',
                hint: 'pytest exécute les fonctions de test\u00a0; la partie principale ne fait que lancer le pipeline. Pour le TODO\u00a02\u00a0: 0.70 > 0.70 vaut False. Pour le TODO\u00a03, range summarise(results) dans une variable entre les deux exécutions. Pour le TODO\u00a05, split() découpe 06 00 00 00 00 en cinq mots de deux chiffres chacun, et 2026-11-14 forme un seul mot de huit chiffres.',
              },
            },
            data: {
              language: 'python',
              starterCode: lines(
                '# Saved, not run: trace it by hand. / Enregistré, pas exécuté : suis-le à la main.',
                "# pipeline.py: the club's comment pipeline, input -> clean -> model -> route -> output, with a",
                '# person for what the model is unsure about. / Une personne relit ce dont le modèle doute.',
                'import logging',
                '',
                '# Show every log line of level INFO or above, as "LEVEL message".',
                'logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")',
                'log = logging.getLogger("pipeline")  # log.info("%s: ...", cid) fills each %s in for you',
                '',
                'THRESHOLD = 0.70  # below this confidence, a person reads the comment / une personne relit',
                '',
                '',
                'class ServiceError(Exception):',
                '    """Raised by classify when the service gives no usable answer, as in lesson 1."""',
                '',
                '',
                "# Stage 1, input: the real pipeline reads the form's CSV file with csv.DictReader, as in",
                '# "Working with data". In this file, a dictionary {comment id: text} stands in for it.',
                '',
                '',
                'def clean(text):',
                '    """Stage 2: tidy one comment and hide contact details. An empty comment gives ""."""',
                '    words = []',
                '    for word in text.split():  # split() also drops the extra spaces',
                '        if "@" in word:',
                '            words.append("[email]")',
                '        elif sum(ch.isdigit() for ch in word) >= 6:  # 6 digits or more in one word',
                '            words.append("[number]")',
                '        else:',
                '            words.append(word)',
                '    return " ".join(words)',
                '',
                '',
                'def route(confidence):',
                '    """Stage 4: "auto" if the model is sure enough, "review" if a person must check."""',
                '    if confidence > THRESHOLD:',
                '        return "auto"',
                '    return "review"',
                '',
                '',
                'def run_pipeline(comments, classify, results):',
                '    """Stages 2 to 4 for every comment that has no result yet. classify is a function',
                '    text -> (label, confidence): the real service of lesson 1, or a fake in the tests."""',
                '    for cid, text in comments.items():',
                '        if cid in results:',
                "            continue  # already done: no new request, and a person's decision is kept",
                '        cleaned = clean(text)',
                '        if cleaned == "":',
                '            log.info("%s: empty, skipped", cid)',
                '            continue',
                '        try:',
                '            label, confidence = classify(cleaned)  # stage 3, the model',
                '        except ServiceError:',
                '            log.warning("%s: no answer from the service, sent to review", cid)',
                '            results[cid] = {"text": cleaned, "label": None, "decision": "review"}',
                '            continue',
                '        decision = route(confidence)',
                '        log.info("%s: %s (%.2f), %s", cid, label, confidence, decision)',
                '        results[cid] = {"text": cleaned, "label": label, "decision": decision}',
                '    log.info("%d comments in, %d results", len(comments), len(results))',
                '    return results',
                '',
                '',
                'def record_review(results, cid, label):',
                '    """Stage 5: a person has read the comment, and their label replaces the model\'s."""',
                '    results[cid]["label"] = label',
                '    results[cid]["decision"] = "checked"',
                '',
                '',
                'def summarise(results):',
                '    """Output: count each label, and the comments still waiting for a person."""',
                '    counts = {"waiting for review": 0}',
                '    for result in results.values():',
                '        if result["decision"] == "review":',
                '            counts["waiting for review"] += 1',
                '        else:',
                '            counts[result["label"]] = counts.get(result["label"], 0) + 1',
                '    return counts',
                '',
                '',
                '# --- Tests, with fake classifiers: no network, no key, no cost, the same answer every time.',
                '# pytest calls every function whose name starts with test_ (python -m pytest pipeline.py).',
                '',
                'EXAMPLE_COMMENTS = {  # invented comments, as the form gives them / commentaires inventés',
                '    "c1": "The food stand ran out before noon",',
                '    "c2": "   ",',
                '    "c3": "Loved the robot show! Write to fan@example.com",',
                '    "c4": "Long queue at the entrance",',
                '}',
                '',
                '',
                'def fake_classify(text):',
                '    """A stand-in for the service: sure about food, unsure about everything else."""',
                '    if "food" in text.lower():',
                '        return "food", 0.92',
                '    return "other", 0.40',
                '',
                '',
                'def broken_classify(text):',
                '    """A stand-in for a service that is down."""',
                '    raise ServiceError("no answer")',
                '',
                '',
                'def test_clean_tidies_spaces():',
                '    assert clean("  Great   show!  ") == "Great show!"',
                '',
                '',
                'def test_clean_hides_an_email():',
                '    assert clean("Write to fan@example.com") == "Write to [email]"',
                '',
                '',
                'def test_clean_hides_a_long_number():',
                '    assert clean("Call 0600000000 now") == "Call [number] now"',
                '',
                '',
                'def test_unsure_goes_to_review():',
                '    assert route(0.40) == "review"',
                '',
                '',
                'def test_service_down_goes_to_review():',
                '    results = run_pipeline({"c9": "Nice robots"}, broken_classify, {})',
                '    assert results["c9"]["decision"] == "review"',
                '',
                '',
                'def test_example_run():',
                '    results = run_pipeline(EXAMPLE_COMMENTS, fake_classify, {})',
                '    assert summarise(results) == {"waiting for review": 2, "food": 1}',
                '',
                '',
                'def test_empty_comment_is_skipped():',
                '    pass  # TODO 1: an empty comment gives no result. / À compléter.',
                '',
                '',
                'def test_route_at_the_threshold():',
                '    pass  # TODO 2: route(0.70), as the comment of THRESHOLD says.',
                '',
                '',
                'def test_running_twice_changes_nothing():',
                '    pass  # TODO 3: two runs, the same results dictionary, the same summary.',
                '',
                '',
                'def test_a_person_has_the_last_word():',
                "    pass  # TODO 4: a person's label survives a rerun.",
                '',
                '',
                'def test_clean_hides_a_spaced_number():',
                '    pass  # TODO 5: "Call 06 00 00 00 00"',
                '',
                '',
                'if __name__ == "__main__":',
                '    # With the real service: from classifier_client import classify, then pass classify.',
                '    results = run_pipeline(EXAMPLE_COMMENTS, fake_classify, {})',
                '    print(summarise(results))  # 1.',
                '    record_review(results, "c4", "timing")',
                '    print(summarise(results))  # 2.',
              ),
            },
          },
          {
            id: 'm4-l2-b7',
            type: 'quiz',
            stage: 'check',
            defaultLocale: 'en',
            translations: {
              en: {
                intro:
                  'Check what you know about calling AI services safely, and about pipelines, tests and human checks.',
              },
              fr: {
                intro:
                  'Vérifie ce que tu sais sur l’appel sécurisé des services d’IA, et sur les pipelines, les tests et les vérifications humaines.',
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
                  "In the club's pipeline, which decisions should always stay with a person, and why? Then think ahead to the engineering challenge of the next module: which step of an AI system you might build would need a human check, and what would that person look at?",
              },
              fr: {
                prompt:
                  'Dans le pipeline du club, quelles décisions doivent toujours revenir à une personne, et pourquoi\u00a0? Pense ensuite au défi d’ingénierie du prochain module\u00a0: quelle étape d’un système d’IA que tu pourrais construire aurait besoin d’une vérification humaine, et que regarderait cette personne\u00a0?',
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
            title: 'Check: APIs and automation',
            instructions:
              'Seven questions on calling AI services safely, and on pipelines, tests and human checks. You need 70% to pass, and you can try again.',
          },
          fr: {
            title: 'Quiz\u00a0: API et automatisation',
            instructions:
              'Sept questions sur l’appel sécurisé des services d’IA, et sur les pipelines, les tests et les vérifications humaines. Il faut 70\u00a0% pour réussir, et tu peux réessayer.',
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
            type: 'multiple_answer',
            points: 2,
            translations: {
              en: {
                prompt:
                  'A request to an AI service fails. In which of these cases is it worth trying again after a wait? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Une requête à un service d’IA échoue. Dans lesquels de ces cas vaut-il la peine de réessayer après une attente\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: '429 Too Many Requests' },
                  fr: { text: '429 Too Many Requests (trop de requêtes)' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: '503 Service Unavailable' },
                  fr: { text: '503 Service Unavailable (service indisponible)' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'No answer before the timeout' },
                  fr: { text: 'Aucune réponse avant la fin du délai d’attente (timeout)' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '401 Unauthorized: the key is missing or wrong' },
                  fr: { text: '401 Unauthorized\u00a0: la clé est absente ou fausse' },
                },
              },
              {
                id: 'e',
                translations: {
                  en: { text: '400 Bad Request: the request itself is malformed' },
                  fr: { text: '400 Bad Request\u00a0: la requête elle-même est mal formée' },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A 429, a 503 and a timeout are temporary: the same request may work a little later, so wait (longer each time) and try again a limited number of times. A 401 or a 400 means that your request is the problem: sending it again gives the same answer, so stop, fix the key or the code, and tell a person.',
              },
              fr: {
                text: 'Un 429, un 503 et un dépassement du délai d’attente sont temporaires\u00a0: la même requête peut marcher un peu plus tard, donc attends (de plus en plus longtemps) et réessaie un nombre limité de fois. Un 401 ou un 400 signifie que c’est ta requête qui pose problème\u00a0: la renvoyer donne la même réponse. Arrête-toi, corrige la clé ou le code, et préviens une personne.',
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
                  'A client waits 1 second after a failed attempt and doubles the wait after each new failure. It makes at most 4 attempts, and the service is down for all of them. How many requests does it send, and how long does it wait in total?',
              },
              fr: {
                prompt:
                  'Un client attend 1\u00a0seconde après une tentative ratée et double l’attente après chaque nouvel échec. Il fait au plus 4\u00a0tentatives, et le service est en panne pour toutes. Combien de requêtes envoie-t-il, et combien de temps attend-il au total\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: '4 requests and 7 seconds of waiting' },
                  fr: { text: '4\u00a0requêtes et 7\u00a0secondes d’attente' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: '4 requests and 15 seconds of waiting' },
                  fr: { text: '4\u00a0requêtes et 15\u00a0secondes d’attente' },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: '3 requests and 3 seconds of waiting' },
                  fr: { text: '3\u00a0requêtes et 3\u00a0secondes d’attente' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: '8 requests and 4 seconds of waiting' },
                  fr: { text: '8\u00a0requêtes et 4\u00a0secondes d’attente' },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'It sends 4 requests and waits only between them: 1 + 2 + 4 = 7 seconds. There is no wait after the last attempt, since there is nothing left to try: the client gives up and hands the item to a person. 15 seconds would add a fourth wait of 8 seconds.',
              },
              fr: {
                text: 'Il envoie 4\u00a0requêtes et n’attend qu’entre elles\u00a0: 1 + 2 + 4 = 7\u00a0secondes. Il n’attend pas après la dernière tentative, puisqu’il n’y a plus rien à essayer\u00a0: le client abandonne et confie l’élément à une personne. 15\u00a0secondes ajouteraient une quatrième attente de 8\u00a0secondes.',
              },
            },
          },
          {
            id: 'q3',
            type: 'short_answer',
            points: 1,
            translations: {
              en: {
                prompt:
                  'Your program must never contain its API key. Where should it read the key from instead: a value that is set outside the code? (two words)',
              },
              fr: {
                prompt:
                  'Ton programme ne doit jamais contenir sa clé d’API. Où doit-il la lire à la place, sous la forme d’une valeur définie en dehors du code\u00a0? (en quelques mots)',
              },
            },
            options: [],
            correctOptionIndexes: [],
            acceptedAnswers: {
              en: [
                'environment variable',
                'an environment variable',
                'the environment variable',
                'environment variables',
                'in an environment variable',
                'env variable',
                'env var',
                'an env var',
                'os.environ',
                'the environment',
              ],
              fr: [
                "variable d'environnement",
                'variable d’environnement',
                "une variable d'environnement",
                'une variable d’environnement',
                "dans une variable d'environnement",
                "variables d'environnement",
                'variables d’environnement',
                "les variables d'environnement",
                'os.environ',
                "l'environnement",
              ],
            },
            explanation: {
              en: {
                text: "An environment variable: a value set outside the program (in the terminal, in the notebook's secrets settings or in a local file that is never shared), which the code reads with os.environ. The key never appears in the code, so it cannot leak with it.",
              },
              fr: {
                text: 'Une variable d’environnement\u00a0: une valeur définie en dehors du programme (dans le terminal, dans les réglages de secrets du notebook ou dans un fichier local jamais partagé), que le code lit avec os.environ. La clé n’apparaît jamais dans le code\u00a0: elle ne peut donc pas fuiter avec lui.',
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
                  'The club sends the comments of its form to an outside AI service. Which of these choices protect the people who wrote them? Choose all the right answers.',
              },
              fr: {
                prompt:
                  'Le club envoie les commentaires de son formulaire à un service d’IA extérieur. Lesquels de ces choix protègent les personnes qui les ont écrits\u00a0? Choisis toutes les bonnes réponses.',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Hiding email addresses and phone numbers before anything is sent' },
                  fr: {
                    text: 'Masquer les adresses e-mail et les numéros de téléphone avant tout envoi',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Sending only the comment, not the other fields of the form' },
                  fr: {
                    text: 'N’envoyer que le commentaire, pas les autres champs du formulaire',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'Writing comment ids in the log, never the text of the comments' },
                  fr: {
                    text: 'Écrire dans le journal les identifiants des commentaires, jamais leur texte',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Sending the whole form, so that the model has more context' },
                  fr: {
                    text: 'Envoyer tout le formulaire, pour que le modèle ait plus de contexte',
                  },
                },
              },
              {
                id: 'e',
                translations: {
                  en: {
                    text: 'Using any free service found online, since the comments are anonymous',
                  },
                  fr: {
                    text: 'Utiliser n’importe quel service gratuit trouvé en ligne, puisque les commentaires sont anonymes',
                  },
                },
              },
            ],
            correctOptionIndexes: [0, 1, 2],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'Send the minimum, remove contact details first and keep the text of comments out of logs. An anonymous form does not make the comments anonymous: people still write names and numbers in them, and the provider may keep what it receives. Use only a service that your school has approved.',
              },
              fr: {
                text: 'Envoie le minimum, retire d’abord les coordonnées et garde le texte des commentaires hors des journaux. Un formulaire anonyme ne rend pas les commentaires anonymes\u00a0: les gens y écrivent quand même des noms et des numéros, et le fournisseur peut conserver ce qu’il reçoit. N’utilise qu’un service approuvé par ton établissement.',
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
                  'A pipeline step is idempotent when running it twice by accident gives the same result as running it once.',
              },
              fr: {
                prompt:
                  'Une étape d’un pipeline est idempotente quand l’exécuter deux fois par erreur donne le même résultat que l’exécuter une fois.',
              },
            },
            options: [
              { id: 'true', translations: { en: { text: 'True' }, fr: { text: 'Vrai' } } },
              { id: 'false', translations: { en: { text: 'False' }, fr: { text: 'Faux' } } },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "True. Automated jobs get stopped and restarted, so every step must survive a rerun. The club's pipeline keeps one result per comment id and skips the comments that already have one; adding new counts to old totals, as the first script did, is not idempotent.",
              },
              fr: {
                text: 'Vrai. Les traitements automatisés sont arrêtés et relancés\u00a0: chaque étape doit donc supporter une relance. Le pipeline du club garde un résultat par identifiant de commentaire et ignore ceux qui en ont déjà un\u00a0; ajouter de nouveaux comptes à d’anciens totaux, comme le faisait le premier script, n’est pas idempotent.',
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
                  'The pipeline says THRESHOLD = 0.70, with a comment that says: below this confidence, a person reads the comment. Your new test, assert route(0.70) == "auto", fails with an AssertionError. What is the best next step?',
              },
              fr: {
                prompt:
                  'Le pipeline indique THRESHOLD = 0.70, avec un commentaire qui dit\u00a0: en dessous de cette confiance, une personne relit le commentaire. Ton nouveau test, assert route(0.70) == "auto", échoue sur une AssertionError. Quelle est la meilleure suite\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: { text: 'Delete the test, since all the other tests pass' },
                  fr: { text: 'Supprimer le test, puisque tous les autres réussissent' },
                },
              },
              {
                id: 'b',
                translations: {
                  en: {
                    text: 'The code and its comment disagree: decide which behaviour is right, fix the other one, and keep the test',
                  },
                  fr: {
                    text: 'Le code et son commentaire se contredisent\u00a0: décider quel comportement est le bon, corriger l’autre et garder le test',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: {
                    text: 'Change the expected value until the test passes, without changing anything else',
                  },
                  fr: {
                    text: 'Modifier la valeur attendue jusqu’à ce que le test réussisse, sans rien changer d’autre',
                  },
                },
              },
              {
                id: 'd',
                translations: {
                  en: { text: 'Run the test again: a failing test often passes the second time' },
                  fr: {
                    text: 'Relancer le test\u00a0: un test qui échoue réussit souvent la deuxième fois',
                  },
                },
              },
            ],
            correctOptionIndexes: [1],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: 'A failing test is information: here, the code sends 0.70 to review, while its own comment says that only confidences below 0.70 go there. Decide which behaviour you want, make the code and the comment agree, and keep the test so that the question stays settled. Deleting the test or bending it until it passes hides the problem.',
              },
              fr: {
                text: 'Un test qui échoue t’apprend quelque chose\u00a0: ici, le code envoie 0,70 en relecture, alors que son propre commentaire dit que seules les confiances inférieures à 0,70 y vont. Décide du comportement voulu, mets le code et le commentaire d’accord, et garde le test pour que la question reste réglée. Supprimer le test ou le tordre jusqu’à ce qu’il réussisse cache le problème.',
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
                  'The model sorts 300 comments. Which design keeps a human in the loop sensibly?',
              },
              fr: {
                prompt:
                  'Le modèle trie 300\u00a0commentaires. Quelle organisation garde judicieusement un humain dans la boucle\u00a0?',
              },
            },
            options: [
              {
                id: 'a',
                translations: {
                  en: {
                    text: 'A person reads every comment below the threshold or with no usable answer, and spot-checks a few of the others',
                  },
                  fr: {
                    text: 'Une personne lit chaque commentaire sous le seuil ou sans réponse utilisable, et en contrôle quelques autres au hasard',
                  },
                },
              },
              {
                id: 'b',
                translations: {
                  en: { text: 'Nobody reads anything: the model scored well in testing' },
                  fr: {
                    text: 'Personne ne lit rien\u00a0: le modèle a obtenu de bons scores aux tests',
                  },
                },
              },
              {
                id: 'c',
                translations: {
                  en: { text: 'The model is asked to check its own answers' },
                  fr: { text: 'On demande au modèle de vérifier ses propres réponses' },
                },
              },
              {
                id: 'd',
                translations: {
                  en: {
                    text: 'A person reads only the comments the model is most confident about',
                  },
                  fr: {
                    text: 'Une personne ne lit que les commentaires dont le modèle est le plus sûr',
                  },
                },
              },
            ],
            correctOptionIndexes: [0],
            acceptedAnswers: {},
            explanation: {
              en: {
                text: "The person's time goes where the model is weakest: low confidence and failures. Spot checks of the rest catch confident mistakes, and the review queue shows whether the model works worse for some comments, such as those written in another language. A model cannot reliably judge its own answers.",
              },
              fr: {
                text: 'Le temps de la personne va là où le modèle est le plus faible\u00a0: les confiances basses et les échecs. Les contrôles au hasard sur le reste repèrent les erreurs commises avec assurance, et la file de relecture montre si le modèle fonctionne moins bien pour certains commentaires, comme ceux écrits dans une autre langue. Un modèle ne peut pas juger de façon fiable ses propres réponses.',
              },
            },
          },
        ],
      },
    },
  ],

  projects: [],
};
