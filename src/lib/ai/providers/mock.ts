import 'server-only';
import type { TutorMode } from '@/types/ai';
import { TUTOR_MODES } from '@/types/ai';
import type { AiConfidence, AiReviewFlag, RubricKey } from '@/types/project';
import { GRADING_BLOCKS, GRADING_SCHEMA_NAME } from '../prompts/grading';
import { LAB_BLOCKS } from '../prompts/lab';
import { TUTOR_BLOCKS, TUTOR_REFERENCE_LABELS, TUTOR_TRANSCRIPT_LABELS } from '../prompts/tutor';
import {
  containsRedaction,
  looksLikePromptInjection,
  normalizeForMatching,
  parsePolicyHeader,
  readUntrustedBlock,
} from '../safety';
import {
  AiError,
  type AiObjectRequest,
  type AiObjectResult,
  type AiProvider,
  type AiStreamEvent,
  type AiTextRequest,
  type AiTextResult,
  type AiUsage,
} from '../types';

// The default provider: deterministic, no network, no credentials. It recognises the prompts
// of this layer by their policy header and answers with canned text in the requested language,
// so the tutor, the AI Lab and AI review can all be demonstrated. It never answers the actual
// question, and says so in every reply.

export const MOCK_MODEL = 'mock-1';

// Not `Locale`: a language added to the product later falls back to English here.
type MockLocale = 'en' | 'fr';

function toMockLocale(value: string | undefined): MockLocale {
  return value === 'fr' ? 'fr' : 'en';
}

const paragraphs = (...parts: string[]): string => parts.join('\n\n');

// French sets a no-break space before : ; ? ! and inside « ». The scripts below are written
// with plain spaces so they stay readable.
function frenchSpacing(text: string): string {
  return text.replace(/ ([:;?!»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
}

// --- Tutor --------------------------------------------------------------------------------------

interface TutorScript {
  opening: (topic: string) => string;
  body: string;
  closing: string;
}

/** `first` opens a conversation; `next` answers once the transcript holds a tutor turn. */
interface TutorModeScripts {
  first: TutorScript;
  next: TutorScript;
}

const TUTOR_SCRIPTS: Record<MockLocale, Record<TutorMode, TutorModeScripts>> = {
  en: {
    explain: {
      first: {
        opening: (topic) => `Let’s look at ${topic} step by step.`,
        body: 'An AI system learns from examples. Think of learning to recognise dogs: after seeing many pictures, you spot what dogs have in common. A model does the same with data, and it can only be as good as the examples it was given.',
        closing:
          'Quick check: in your own words, what does a model need before it can make a good guess?',
      },
      next: {
        opening: (topic) => `Let’s go one step further with ${topic}.`,
        body: 'A model does not understand things the way you do: it finds patterns in its examples. When the examples are few, or all look alike, it makes more mistakes on anything new, a bit like revising one chapter before a test on the whole book.',
        closing: 'Your turn: which examples would you add to help a model make fewer mistakes?',
      },
    },
    hint: {
      first: {
        opening: (topic) => `Here is one small hint about ${topic}.`,
        body: 'Read the task again and pick out what you are given and what you have to find. Then try only the first step, not the whole problem at once.',
        closing: 'Which first step would you try? Tell me, and I will help you with the next one.',
      },
      next: {
        opening: (topic) => `Here is a slightly bigger hint about ${topic}.`,
        body: 'Write what you already know as a short list. Then look for the one piece that is still missing: the next step usually connects two things from your list.',
        closing:
          'What is on your list so far? Show me, and we will find the missing piece together.',
      },
    },
    quiz_me: {
      first: {
        opening: (topic) => `Let’s practise ${topic}, one question at a time.`,
        body: 'Question: an AI model was trained only on photos taken in daylight. What might happen when it sees a photo taken at night, and why?',
        closing: 'Write your answer and I will tell you what I think of it.',
      },
      next: {
        opening: () => 'Thank you for your answer.',
        body: 'A strong answer explains that a model can only be as good as the examples it learned from, and that new kinds of examples make its guesses less reliable. Compare that with what you wrote: did you mention the examples?',
        closing:
          'Next question: why is it useful to test a model with examples it did not see while it was learning?',
      },
    },
    give_example: {
      first: {
        opening: (topic) => `Here is an example to go with ${topic}.`,
        body: 'A music app notices that you often skip slow songs and replay fast ones. It uses that habit to suggest new songs. That is a model learning from data: your choices are the examples, and its suggestion is a prediction.',
        closing: 'Can you think of another app that learns from what people do?',
      },
      next: {
        opening: (topic) => `Here is another example for ${topic}.`,
        body: 'A spam filter learns from thousands of messages that people marked as “spam” or “not spam”. When a new message arrives, it compares it with what it has seen and predicts which group it belongs to. It is sometimes wrong, which is why people can still correct it.',
        closing: 'In this example, what are the examples and what is the prediction?',
      },
    },
    challenge_me: {
      first: {
        opening: (topic) => `Ready for a challenge on ${topic}?`,
        body: 'Design a tiny experiment: choose something a computer could learn to sort into two groups, give three examples for each group, then describe one tricky case that could fool it.',
        closing:
          'Try it first. When you show me your attempt, I will give you feedback and a next step.',
      },
      next: {
        opening: (topic) => `Let’s build on what you have done for ${topic}.`,
        body: 'Next step: test your idea with one example that fits neither group clearly. Decide how the computer should handle it, and note which extra information would help it choose.',
        closing: 'What did you find? Tell me which case was hardest to sort, and why.',
      },
    },
    check_my_work: {
      first: {
        opening: (topic) => `Thank you for sharing your work on ${topic}.`,
        body: 'What works well: you made a real attempt, and your idea is clear enough to discuss. To improve it: check that every step follows from the one before, and add one sentence that explains why your result makes sense.',
        closing: 'Which part are you least sure about? Start there, and tell me what you change.',
      },
      next: {
        opening: () => 'Thank you for the update.',
        body: 'Now look at your work the way a reader would: could someone who was not there follow each step? Read it aloud: every place where you stop to explain is a place that needs one more sentence.',
        closing: 'Which sentence would you add, and where?',
      },
    },
  },
  fr: {
    explain: {
      first: {
        opening: (topic) => `Regardons ${topic} étape par étape.`,
        body: 'Un système d’IA apprend à partir d’exemples. C’est comme apprendre à reconnaître des chiens : après avoir vu beaucoup de photos, on repère ce que les chiens ont en commun. Un modèle fait la même chose avec des données, et il ne peut pas être meilleur que les exemples qu’on lui a donnés.',
        closing:
          'Petite vérification : avec tes propres mots, de quoi un modèle a-t-il besoin avant de pouvoir faire une bonne prédiction ?',
      },
      next: {
        opening: (topic) => `Allons un peu plus loin avec ${topic}.`,
        body: 'Un modèle ne comprend pas les choses comme toi : il repère des régularités dans ses exemples. Quand les exemples sont peu nombreux, ou qu’ils se ressemblent tous, il se trompe davantage face à la nouveauté, un peu comme si on révisait un seul chapitre avant un contrôle sur tout le livre.',
        closing:
          'À toi : quels exemples ajouterais-tu pour aider un modèle à faire moins d’erreurs ?',
      },
    },
    hint: {
      first: {
        opening: (topic) => `Voici un petit indice à propos de ${topic}.`,
        body: 'Relis la consigne et repère ce qui est donné et ce qu’il faut trouver. Essaie ensuite seulement la première étape, pas tout le problème d’un coup.',
        closing:
          'Quelle première étape veux-tu essayer ? Dis-le-moi, et je t’aiderai pour la suivante.',
      },
      next: {
        opening: (topic) => `Voici un indice un peu plus grand à propos de ${topic}.`,
        body: 'Écris ce que tu sais déjà sous forme de courte liste. Cherche ensuite l’élément qui manque encore : l’étape suivante relie souvent deux éléments de ta liste.',
        closing:
          'Qu’y a-t-il dans ta liste pour l’instant ? Montre-la-moi, et nous trouverons ensemble ce qui manque.',
      },
    },
    quiz_me: {
      first: {
        opening: (topic) => `Entraînons-nous sur ${topic}, une question à la fois.`,
        body: 'Question : un modèle d’IA a été entraîné uniquement avec des photos prises en plein jour. Que peut-il se passer quand il voit une photo prise de nuit, et pourquoi ?',
        closing: 'Écris ta réponse et je te dirai ce que j’en pense.',
      },
      next: {
        opening: () => 'Merci pour ta réponse.',
        body: 'Une bonne réponse explique qu’un modèle ne peut pas être meilleur que les exemples avec lesquels il a appris, et que des exemples d’un genre nouveau rendent ses prédictions moins fiables. Compare avec ce que tu as écrit : as-tu parlé des exemples ?',
        closing:
          'Question suivante : pourquoi est-il utile de tester un modèle avec des exemples qu’il n’a pas vus pendant son apprentissage ?',
      },
    },
    give_example: {
      first: {
        opening: (topic) => `Voici un exemple pour accompagner ${topic}.`,
        body: 'Une application de musique remarque que tu passes souvent les chansons lentes et que tu réécoutes les chansons rapides. Elle se sert de cette habitude pour te proposer de nouveaux titres. C’est un modèle qui apprend à partir de données : tes choix sont les exemples, et sa proposition est une prédiction.',
        closing: 'Connais-tu une autre application qui apprend à partir de ce que font les gens ?',
      },
      next: {
        opening: (topic) => `Voici un autre exemple pour ${topic}.`,
        body: 'Un filtre anti-spam apprend à partir de milliers de messages que des personnes ont classés comme « indésirable » ou « normal ». Quand un nouveau message arrive, il le compare à ce qu’il a déjà vu et prédit à quel groupe il appartient. Il se trompe parfois, et c’est pour cela qu’on peut encore le corriger.',
        closing: 'Dans cet exemple, quels sont les exemples et quelle est la prédiction ?',
      },
    },
    challenge_me: {
      first: {
        opening: (topic) => `Envie d’un défi sur ${topic} ?`,
        body: 'Imagine une petite expérience : choisis quelque chose qu’un ordinateur pourrait apprendre à trier en deux groupes, donne trois exemples pour chaque groupe, puis décris un cas piège qui pourrait le tromper.',
        closing:
          'Essaie d’abord. Quand tu me montreras ta tentative, je te donnerai un retour et une étape suivante.',
      },
      next: {
        opening: (topic) => `Continuons à partir de ce que tu as fait pour ${topic}.`,
        body: 'Étape suivante : teste ton idée avec un exemple qui n’entre clairement dans aucun des deux groupes. Décide comment l’ordinateur devrait le traiter, et note quelle information supplémentaire l’aiderait à choisir.',
        closing: 'Qu’as-tu trouvé ? Dis-moi quel cas a été le plus difficile à trier, et pourquoi.',
      },
    },
    check_my_work: {
      first: {
        opening: (topic) => `Merci d’avoir partagé ton travail sur ${topic}.`,
        body: 'Ce qui fonctionne bien : tu as vraiment essayé, et ton idée est assez claire pour qu’on en discute. Pour l’améliorer : vérifie que chaque étape découle de la précédente, et ajoute une phrase qui explique pourquoi ton résultat est logique.',
        closing:
          'De quelle partie es-tu le moins sûr ? Commence par là, et dis-moi ce que tu changes.',
      },
      next: {
        opening: () => 'Merci pour cette nouvelle version.',
        body: 'Regarde maintenant ton travail comme le ferait un lecteur : quelqu’un qui n’était pas là pourrait-il suivre chaque étape ? Lis-le à voix haute : chaque endroit où tu t’arrêtes pour expliquer est un endroit où il manque une phrase.',
        closing: 'Quelle phrase ajouterais-tu, et où ?',
      },
    },
  },
};

// What the policy asks for when a lesson has graded work and the learner wants the answer.
const GRADED_WORK_SCRIPT: Record<MockLocale, TutorScript> = {
  en: {
    opening: () => 'I can’t give you the answer to graded work, but I can help you find it.',
    body: 'Hint: go back to the part of the lesson that explains the main idea, and compare it with what the question asks.',
    closing: 'What do you think the answer is, and which part makes you unsure?',
  },
  fr: {
    opening: () =>
      'Je ne peux pas te donner la réponse d’un travail noté, mais je peux t’aider à la trouver.',
    body: 'Indice : retourne à la partie de la leçon qui explique l’idée principale, et compare-la avec ce que demande la question.',
    closing: 'À ton avis, quelle est la réponse, et quelle partie te fait hésiter ?',
  },
};

const TUTOR_DEMO_NOTE: Record<MockLocale, string> = {
  en: 'Demo mode: this is a sample reply, because no AI model is connected yet.',
  fr: 'Mode démonstration : ceci est une réponse d’exemple, car aucun modèle d’IA n’est encore connecté.',
};

const GENERIC_TOPIC: Record<MockLocale, string> = { en: 'this topic', fr: 'ce sujet' };

function quoteTopic(locale: MockLocale, title: string): string {
  return locale === 'fr' ? `« ${title} »` : `“${title}”`;
}

// Written for normalizeForMatching() output.
const ANSWER_REQUEST = new RegExp(
  [
    String.raw`\b(?:give|tell|show)\s+me\s+the\s+(?:\w+\s+)?(?:answers?|solution)\b`,
    String.raw`\bwhat(?:'s| is)\s+the\s+(?:\w+\s+)?answer\b`,
    String.raw`\bjust\s+(?:give\s+)?(?:me\s+)?the\s+answer\b`,
    String.raw`\bdo\s+(?:it|this|my\s+\w+)\s+for\s+me\b`,
    String.raw`\b(?:donne|dis)[- ]moi\s+la\s+(?:bonne\s+)?(?:reponse|solution)\b`,
    String.raw`\bquelle\s+est\s+la\s+(?:bonne\s+)?reponse\b`,
    String.raw`\bfais[- ]le\s+(?:pour\s+moi|a\s+ma\s+place)\b`,
  ].join('|'),
);

function referenceField(reference: string, label: string): string | null {
  const prefix = `${label}: `;
  const line = reference.split('\n').find((candidate) => candidate.startsWith(prefix));
  return line?.slice(prefix.length).trim() || null;
}

function isTutorMode(value: string | undefined): value is TutorMode {
  return (TUTOR_MODES as readonly string[]).includes(value ?? '');
}

function hasEarlierTutorTurn(transcript: string): boolean {
  const prefix = `${TUTOR_TRANSCRIPT_LABELS.assistant}: `;
  return transcript.split('\n\n').some((entry) => entry.startsWith(prefix));
}

function tutorReply(fields: Record<string, string | undefined>, content: string): string {
  const locale = toMockLocale(fields.locale);
  const mode = isTutorMode(fields.mode) ? fields.mode : 'explain';

  const reference = readUntrustedBlock(content, TUTOR_BLOCKS.reference) ?? '';
  const title =
    referenceField(reference, TUTOR_REFERENCE_LABELS.lesson) ??
    referenceField(reference, TUTOR_REFERENCE_LABELS.course);
  const topic = title === null ? GENERIC_TOPIC[locale] : quoteTopic(locale, title);

  const question = readUntrustedBlock(content, TUTOR_BLOCKS.question) ?? '';
  const wantsAnswer = ANSWER_REQUEST.test(normalizeForMatching(question));
  const transcript = readUntrustedBlock(content, TUTOR_BLOCKS.transcript) ?? '';
  const scripts = TUTOR_SCRIPTS[locale][mode];
  const script =
    fields.graded === 'yes' && wantsAnswer
      ? GRADED_WORK_SCRIPT[locale]
      : hasEarlierTutorTurn(transcript)
        ? scripts.next
        : scripts.first;

  const reply = paragraphs(
    script.opening(topic),
    script.body,
    script.closing,
    TUTOR_DEMO_NOTE[locale],
  );
  return locale === 'fr' ? frenchSpacing(reply) : reply;
}

// --- AI Lab -------------------------------------------------------------------------------------

function labReply(fields: Record<string, string | undefined>, content: string): string {
  const prompt = readUntrustedBlock(content, LAB_BLOCKS.prompt) ?? '';
  const words = prompt.split(/\s+/).filter(Boolean).length;

  if (toMockLocale(fields.locale) === 'fr') {
    return frenchSpacing(
      paragraphs(
        'Voici un court brouillon pour ta consigne.',
        'Il était une fois un petit robot qui apprenait une chose nouvelle chaque jour. Le lundi, il apprit à trier les couleurs, le mardi à suivre une ligne, et le vendredi il savait expliquer à un ami comment il avait appris.',
        `Nombre de mots dans ta consigne : ${words}. Pour un résultat plus précis, indique à qui le texte est destiné, quelle longueur il doit avoir et quel ton tu souhaites.`,
        'Mode démonstration : ceci est un résultat d’exemple, car aucun modèle d’IA n’est encore connecté.',
      ),
    );
  }
  return paragraphs(
    'Here is a short draft for your prompt.',
    'Once there was a small robot that learned one new thing every day. On Monday it learned to sort colours, on Tuesday to follow a line, and by Friday it could explain to a friend how it had learned.',
    `Words in your prompt: ${words}. For a more precise result, say who the text is for, how long it should be and which tone you want.`,
    'Demo mode: this is a sample result, because no AI model is connected yet.',
  );
}

// --- Review -------------------------------------------------------------------------------------

interface ReviewScript {
  comments: Record<RubricKey, string>;
  writtenFeedback: string;
  strengths: string[];
  improvements: string[];
  demoLimitation: string;
}

const REVIEW_SCRIPTS: Record<MockLocale, ReviewScript> = {
  en: {
    comments: {
      creativity:
        'The idea is presented in a personal way; one unexpected detail would make it stand out more.',
      technicalQuality:
        'The work is organised and can be followed; showing how it was tested would make it more convincing.',
      understanding:
        'The explanation shows that the main concept is understood; describing why it works would show more depth.',
      responsibleAi:
        'Some thought is given to using AI responsibly; naming who could be affected would strengthen the work.',
    },
    writtenFeedback:
      'Thank you for sharing your project. You clearly put effort into it, and the main idea comes through. The strongest part is how you explain what you wanted to build. To make it even better, describe one decision you made and why you made it, and show what happened when you tested your work. Also think about who could be affected by your project and how you would keep it fair and safe for them. Keep going: small improvements to the explanation and the testing will make this a much stronger piece of work. Well done so far.',
    strengths: [
      'A clear main idea',
      'Visible effort and care',
      'A good start on explaining the work',
    ],
    improvements: [
      'Explain one decision and why you made it',
      'Show how you tested your work',
      'Say who your project could affect',
    ],
    demoLimitation: 'Demo review: produced by the built-in sample reviewer, not by an AI model.',
  },
  fr: {
    comments: {
      creativity:
        'L’idée est présentée de façon personnelle ; un détail inattendu la rendrait plus originale.',
      technicalQuality:
        'Le travail est organisé et se suit facilement ; montrer comment il a été testé le rendrait plus convaincant.',
      understanding:
        'L’explication montre que la notion principale est comprise ; expliquer pourquoi cela fonctionne montrerait plus de profondeur.',
      responsibleAi:
        'L’usage responsable de l’IA est abordé ; préciser qui pourrait être concerné renforcerait le travail.',
    },
    writtenFeedback:
      'Merci d’avoir partagé ton projet. On voit que tu y as mis des efforts, et l’idée principale se comprend bien. Le point le plus réussi est la façon dont tu expliques ce que tu voulais construire. Pour aller plus loin, décris une décision que tu as prise et pourquoi tu l’as prise, puis montre ce qui s’est passé quand tu as testé ton travail. Pense aussi aux personnes que ton projet pourrait toucher, et à la manière de le rendre juste et sûr pour elles. Continue ainsi : de petites améliorations dans l’explication et dans les tests rendront ce travail bien plus solide. Bravo pour ce début.',
    strengths: [
      'Une idée principale claire',
      'Un effort et un soin visibles',
      'Un bon début d’explication du travail',
    ],
    improvements: [
      'Explique une décision et pourquoi tu l’as prise',
      'Montre comment tu as testé ton travail',
      'Indique qui ton projet pourrait concerner',
    ],
    demoLimitation:
      'Révision de démonstration : produite par le relecteur d’exemple intégré, et non par un modèle d’IA.',
  },
};

const clampScore = (score: number): number => Math.max(0, Math.min(100, score));

// "Derived from the input length" (ARCHITECTURE.md 8.1): longer work scores higher, so two
// different submissions give visibly different reviews while each one always gives the same.
function reviewObject(fields: Record<string, string | undefined>, content: string): unknown {
  const locale = toMockLocale(fields.locale);
  const script = REVIEW_SCRIPTS[locale];
  const say = locale === 'fr' ? frenchSpacing : (text: string): string => text;
  const read = (name: string): string => readUntrustedBlock(content, name) ?? '';
  const title = read(GRADING_BLOCKS.title);
  const description = read(GRADING_BLOCKS.description);
  const text = read(GRADING_BLOCKS.text);
  const code = read(GRADING_BLOCKS.code);

  const reviewable = text.length + code.length;
  const base = 50 + Math.min(40, Math.floor((reviewable + description.length) / 50));
  const scores: Record<RubricKey, number> = {
    creativity: base + 3,
    technicalQuality: code === '' ? base - 2 : base + 2,
    understanding: base,
    responsibleAi: base - 5,
  };

  const written = [title, description, text, code].join('\n');
  const flags: AiReviewFlag[] = [];
  if (containsRedaction(written)) flags.push('possible_personal_data');
  if (looksLikePromptInjection(written)) flags.push('possible_prompt_injection');

  const confidence: AiConfidence = reviewable === 0 ? 'low' : reviewable < 200 ? 'medium' : 'high';
  const criterion = (key: RubricKey) => ({
    score: clampScore(scores[key]),
    comment: say(script.comments[key]),
  });

  return {
    criteria: {
      creativity: criterion('creativity'),
      technicalQuality: criterion('technicalQuality'),
      understanding: criterion('understanding'),
      responsibleAi: criterion('responsibleAi'),
    },
    writtenFeedback: say(script.writtenFeedback),
    strengths: script.strengths.map(say),
    improvements: script.improvements.map(say),
    confidence,
    limitations: [say(script.demoLimitation)],
    flags,
  };
}

// --- Provider -----------------------------------------------------------------------------------

const GENERIC_REPLY = 'Demo mode: this is a sample reply, because no AI model is connected yet.';

function lastUserContent(request: AiTextRequest): string {
  return request.messages.findLast((message) => message.role === 'user')?.content ?? '';
}

function replyText(request: AiTextRequest): string {
  const fields = parsePolicyHeader(request.system);
  if (fields === null) return GENERIC_REPLY;
  const content = lastUserContent(request);
  if (fields.purpose === 'tutor') return tutorReply(fields, content);
  if (fields.purpose === 'lab') return labReply(fields, content);
  return GENERIC_REPLY;
}

const estimateTokens = (chars: number): number => Math.ceil(chars / 4);

function usageFor(request: AiTextRequest, outputChars: number): AiUsage {
  const inputChars = request.messages.reduce(
    (sum, message) => sum + message.content.length,
    request.system.length,
  );
  return { inputTokens: estimateTokens(inputChars), outputTokens: estimateTokens(outputChars) };
}

/** A few words at a time, whitespace included: the chunks concatenate to the exact text. */
function toChunks(text: string): string[] {
  const words = text.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += 3) {
    chunks.push(words.slice(index, index + 3).join(''));
  }
  return chunks;
}

export const mockProvider: AiProvider = {
  id: 'mock',

  async generateText(request: AiTextRequest): Promise<AiTextResult> {
    request.signal?.throwIfAborted();
    const text = replyText(request);
    return { text, usage: usageFor(request, text.length), stopReason: 'end', model: MOCK_MODEL };
  },

  async *streamText(request: AiTextRequest): AsyncGenerator<AiStreamEvent, void, void> {
    const text = replyText(request);
    for (const chunk of toChunks(text)) {
      request.signal?.throwIfAborted();
      yield { type: 'text', text: chunk };
    }
    yield {
      type: 'done',
      usage: usageFor(request, text.length),
      stopReason: 'end',
      model: MOCK_MODEL,
    };
  },

  async generateObject<T>(request: AiObjectRequest<T>): Promise<AiObjectResult<T>> {
    request.signal?.throwIfAborted();
    if (request.schemaName !== GRADING_SCHEMA_NAME) {
      throw new AiError('invalid_output', {
        message: `The mock provider has no sample object for schema "${request.schemaName}".`,
      });
    }
    const fields = parsePolicyHeader(request.system) ?? {};
    const parsed = request.schema.safeParse(reviewObject(fields, lastUserContent(request)));
    if (!parsed.success) {
      throw new AiError('invalid_output', {
        message: `The mock provider's sample object does not match schema "${request.schemaName}".`,
        cause: parsed.error,
      });
    }
    return {
      object: parsed.data,
      usage: usageFor(request, JSON.stringify(parsed.data).length),
      stopReason: 'end',
      model: MOCK_MODEL,
    };
  },
};
