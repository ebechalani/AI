import 'server-only';
import { AI_LIMITS } from '@/lib/limits';
import type { AiPurpose } from './types';

// --- Input: redaction ---------------------------------------------------------------------------

export const REDACTIONS = {
  email: '[email removed]',
  phone: '[phone number removed]',
  link: '[link removed]',
} as const;

// Invisible on screen: control codes (tab and line feed stay), soft hyphen, zero-width space,
// word joiner, BOM, and the bidi embedding, override and isolate controls that can disguise text.
const INVISIBLE_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g;

const URL_PATTERN = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/gi;
const URL_USERINFO = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*@/i;
const URL_SECRET_PARAM =
  /[?&#;][\w.-]*(?:token|secret|password|passwd|pwd|signature|sig|auth|session|key)=/i;

const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;

const PHONE_CANDIDATE = /\+?\(?\d[\d \u00A0\t().-]{6,24}\d/g;
const ISO_DATE_PREFIX = /^(?:19|20)\d{2}-\d{2}-\d{2}(?![\d-])/;
const DECIMAL_NUMBER = /^\d+\.\d+$/;
const IPV4_ADDRESS = /^\d{1,3}(?:\.\d{1,3}){3}$/;
// "1939-1945" and "02.10.2026": school work is full of them, and a redaction raises a review flag.
const YEAR_RANGE = /^\(?(?:1\d{3}|20\d{2})\s?-\s?(?:1\d{3}|20\d{2})$/;
const DAY_MONTH_YEAR = /^\d{1,2}([.-])\d{1,2}\1[12]\d{3}$/;

function stripInvisible(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(INVISIBLE_CHARS, '');
}

// Deliberately broad: a long number in code or prose is redacted too. Losing a number costs the
// model a detail; sending a child's phone number to a provider cannot be undone.
function redactPhones(text: string): string {
  return text.replace(PHONE_CANDIDATE, (match: string, offset: number): string => {
    if (ISO_DATE_PREFIX.test(match)) return match.slice(0, 10) + redactPhones(match.slice(10));
    const digits = match.replace(/\D/g, '').length;
    if (digits < 8 || digits > 15) return match;
    if (DECIMAL_NUMBER.test(match) || IPV4_ADDRESS.test(match)) return match;
    if (YEAR_RANGE.test(match) || DAY_MONTH_YEAR.test(match)) return match;
    const before = offset > 0 ? text.charAt(offset - 1) : '';
    if (/[\p{L}\p{N}_]/u.test(before)) return match;
    return REDACTIONS.phone;
  });
}

/**
 * Applied to every string before it leaves the server (ARCHITECTURE.md 8.6): redacts email
 * addresses, phone numbers and URLs that carry credentials, and removes invisible characters.
 * Idempotent, so layers may apply it again.
 */
export function sanitizeUserText(text: string): string {
  const withoutCredentialUrls = stripInvisible(text).replace(URL_PATTERN, (url) =>
    URL_USERINFO.test(url) || URL_SECRET_PARAM.test(url) ? REDACTIONS.link : url,
  );
  return redactPhones(withoutCredentialUrls.replace(EMAIL_PATTERN, REDACTIONS.email));
}

/** True when sanitizeUserText removed something from this text, now or in an earlier layer. */
export function containsRedaction(text: string): boolean {
  return Object.values(REDACTIONS).some((marker) => text.includes(marker));
}

// --- Pattern matching ---------------------------------------------------------------------------

// Lower case, no diacritics, straight apostrophes, single spaces. The pattern lists below are
// written in that form, so an accented, unaccented or upper-case spelling of a word all match.
export function normalizeForMatching(text: string): string {
  return stripInvisible(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\s+/g, ' ');
}

const INJECTION_PATTERNS: readonly RegExp[] = [
  // Attempts to replace the instructions.
  /\b(?:ignore|disregard|forget|override|bypass)\b[^.!?]{0,30}\b(?:previous|prior|above|earlier|preceding|system|original|your)\b[^.!?]{0,20}\b(?:instructions?|rules?|prompts?|guidelines?|rubric|policy)\b/,
  /\b(?:ignore|disregard|override|bypass)\s+(?:all\s+)?(?:the\s+)?(?:instructions|rubric|grading)\b/,
  /\b(?:system|developer|hidden)\s+(?:prompt|message|instructions?)\b/,
  /\b(?:new|updated)\s+instructions?\s*:/,
  /\b(?:ignore[rz]?|oublie[rz]?)\s+(?:toutes\s+)?(?:les|tes|vos|ces)\s+(?:instructions|consignes|regles|directives)\b/,
  /\bnouvelles?\s+(?:instructions?|consignes?)\s*:/,
  // Text that addresses the grader or the tutor instead of doing the work.
  /\b(?:dear|hey|hello|hi|attention|note to|message (?:to|for)|instructions? (?:to|for))\s+(?:the\s+)?(?:ai|grader|reviewer|evaluator|assistant|model|examiner|chatbot)\b/,
  /\byou\s+(?:are|act as)\s+(?:now\s+)?(?:an?|the|my)\s+(?:\w+\s+){0,2}(?:grader|reviewer|evaluator|examiner)\b/,
  /\bas\s+(?:the|an?)\s+(?:ai\s+)?(?:grader|reviewer|evaluator|examiner)\b/,
  /\b(?:cher|chere|bonjour|salut|attention|message (?:a|pour)|note (?:a|pour))\s+(?:a\s+)?(?:l'|le\s+|la\s+)?(?:ia|correcteur|correctrice|evaluateur|evaluatrice|assistant|modele)\b/,
  /\b(?:tu es|vous etes)\s+(?:maintenant\s+)?(?:le|la|un|une|mon)\s+(?:correcteur|correctrice|evaluateur|evaluatrice)\b/,
  // Text that asks for a score.
  /\b(?:give|award|assign|grant)\s+(?:me|us|it|this|my)\b[^.!?]{0,30}\b(?:100|full|perfect|maximum|max|top|highest|best)\b[^.!?]{0,20}\b(?:score|marks?|grade|points?|rating)\b/,
  /\b(?:score|grade|mark|rate)\s+(?:this|me|it|my\s+\w+)\b[^.!?]{0,30}\b(?:100|full|perfect|maximum|highest|top)\b/,
  // "100" alone is not enough: "j'ai donné 100 exemples à mon modèle" is ordinary school work.
  /\b(?:donne[rz]?|mets|mettez|attribue[rz]?|accorde[rz]?)\b[^.!?]{0,40}(?:\b100\s*(?:points?\b|sur\s+100\b|\/\s*100\b)|\b20\s*(?:\/|sur)\s*20\b|\bnote maximale\b|\bmeilleure note\b|\btous les points\b)/,
];

/**
 * Heuristic for text that tries to instruct the model: it addresses the grader, asks for a
 * score or tells the model to drop its instructions. Sets the review flag
 * `possible_prompt_injection`; a hit never changes how the text is sent (it is always sent as
 * delimited data).
 */
export function looksLikePromptInjection(text: string): boolean {
  const normalized = normalizeForMatching(text);
  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

// --- Untrusted blocks ---------------------------------------------------------------------------

const BLOCK_TAG = 'untrusted_data';
const FORGED_TAG = /<\s*\/?\s*untrusted[\s_-]*data/gi;
const EMPTY_BLOCK = '(empty)';

/**
 * A delimited block for text written by a learner, a client or a course author. The system
 * prompts declare everything between these tags to be data. The content is sanitized here as
 * well, and anything in it that resembles the tag is removed, so content cannot close its block.
 */
export function wrapUntrusted(name: string, content: string): string {
  if (!/^[a-z][a-z_]*$/.test(name)) throw new Error(`Invalid untrusted block name: ${name}`);
  const body = sanitizeUserText(content).replace(FORGED_TAG, '[tag removed]').trim();
  return `<${BLOCK_TAG} name="${name}">\n${body === '' ? EMPTY_BLOCK : body}\n</${BLOCK_TAG}>`;
}

/** The inverse of wrapUntrusted, for the mock provider and for tests. */
export function readUntrustedBlock(message: string, name: string): string | null {
  const open = `<${BLOCK_TAG} name="${name}">\n`;
  const start = message.indexOf(open);
  if (start === -1) return null;
  const end = message.indexOf(`\n</${BLOCK_TAG}>`, start + open.length - 1);
  if (end === -1) return null;
  const body = message.slice(start + open.length, end);
  return body === EMPTY_BLOCK ? '' : body;
}

// --- Policy header ------------------------------------------------------------------------------

/**
 * First line of every system prompt. It names the prompt version in provider logs, tells the
 * mock provider which canned reply to give, and is a canary: checkOutput refuses a reply that
 * contains the marker, because that reply is quoting its instructions.
 */
export const POLICY_MARKER = 'ROBOHOLIC-POLICY';

/** Values are identifiers (enum values, versions): no spaces. */
export function policyHeader(
  purpose: AiPurpose,
  version: string,
  fields: Record<string, string> = {},
): string {
  const pairs = Object.entries({ purpose, version, ...fields });
  return `${POLICY_MARKER} ${pairs.map(([key, value]) => `${key}=${value}`).join(' ')}`;
}

export function parsePolicyHeader(system: string): Record<string, string | undefined> | null {
  const firstLine = system.split('\n', 1)[0] ?? '';
  if (!firstLine.startsWith(`${POLICY_MARKER} `)) return null;
  const fields: Record<string, string | undefined> = {};
  for (const pair of firstLine.slice(POLICY_MARKER.length).trim().split(/\s+/)) {
    const separator = pair.indexOf('=');
    if (separator > 0) fields[pair.slice(0, separator)] = pair.slice(separator + 1);
  }
  return fields;
}

// --- Output -------------------------------------------------------------------------------------

// Generous on purpose: the prompt holds the visible-length target and this is the backstop.
// 700 tokens at 5 characters each stays under the 4 000 characters the tutor request schema
// accepts for an assistant turn, so a released reply can always be sent back as history.
const CHARS_PER_TOKEN = 5;

export function outputCharLimit(purpose: AiPurpose): number {
  return AI_LIMITS.maxOutputTokens[purpose] * CHARS_PER_TOKEN;
}

// Written for normalizeForMatching() output. A first list: short, and biased towards patterns
// that have no place in a reply to a child whatever the context.
const BANNED_OUTPUT_PATTERNS: readonly RegExp[] = [
  // Contact details and links: a reply neither repeats nor invents them.
  /[\w.%+-]+@[\w-]+(?:\.[\w-]+)+/,
  /(?:\bhttps?:\/\/|\bwww\.)\S/,
  // Asking the learner for personal information.
  /\b(?:what(?:'s| is)|send me|give me)\s+your\s+(?:home address|address|phone number|phone|password|email address|full name|last name|surname)\b/,
  /\bwhere\s+do\s+you\s+live\b/,
  /\b(?:quel(?:le)? est|donne[- ]moi|donnez[- ]moi|envoie[- ]moi|envoyez[- ]moi)\s+(?:ton|ta|votre)\s+(?:adresse|numero de telephone|numero|mot de passe|nom complet|nom de famille)\b/,
  /\bou\s+(?:habites[- ]tu|habitez[- ]vous)\b/,
  // Abuse and self-harm.
  /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|nigg(?:er|a)\w*|faggot\w*|whore\w*|slut\w*|porn\w*)\b/,
  // The lookbehind keeps "pique-nique" legal.
  /(?<![\w-])(?:putain|merde|connard|connasse|salope|encule\w*|pute|nique)\b/,
  /\bkill\s+yourself\b/,
  /\b(?:tue|suicide)[- ]toi\b/,
  // Proposals to meet in person (8.6, tuned by WS-I). "Let's meet the perceptron" stays legal.
  /\b(?:let's|lets|we\s+(?:could|should|can))\s+meet\s+(?:up|in\s+person|in\s+real\s+life|irl|after\s+school|somewhere)\b/,
  /\bmeet\s+me\s+(?:at|in|after|outside|somewhere)\b/,
  /\b(?:se|nous)\s+(?:voir|rencontrer|retrouver)\s+(?:en\s+vrai|en\s+personne|apres\s+l'ecole|quelque\s+part)\b/,
  // Requests for photos of the learner.
  /\b(?:send|show)\s+me\s+(?:a\s+)?(?:photo|picture|selfie|pic)s?\s+of\s+(?:you|yourself)\b/,
  /\benvoie[- ]moi\s+(?:une\s+)?(?:photo|image|selfie)s?\s+de\s+toi\b/,
  // The reply is quoting its instructions or the block delimiters.
  new RegExp(POLICY_MARKER.toLowerCase()),
  /<\s*\/?\s*untrusted_data/,
];

// Coding lessons need "open http://localhost:3000": it leads nowhere outside the learner's
// computer. Only the scheme, host and port are exempt; the path stays and is checked like any
// other text, so a link smuggled into it (`?next=https://...`, `/www....`) is still refused. The
// lookahead keeps look-alikes such as `localhost.evil.example` or `localhost@evil.example` out.
const LOOPBACK_ORIGIN =
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?(?=[/?#\s)\]]|[.,;:!?](?:\s|$)|$)/g;

export type OutputCheck = { ok: true } | { ok: false; reason: 'banned_pattern' | 'too_long' };

/**
 * Runs before any AI text is shown (ARCHITECTURE.md 8.6). The banned patterns are tested
 * first, so `too_long` also says that the text itself was clean.
 */
export function checkOutput(text: string, purpose: AiPurpose): OutputCheck {
  const normalized = normalizeForMatching(text).replace(LOOPBACK_ORIGIN, ' ');
  if (BANNED_OUTPUT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { ok: false, reason: 'banned_pattern' };
  }
  if (text.length > outputCharLimit(purpose)) return { ok: false, reason: 'too_long' };
  return { ok: true };
}

/** The longest prefix within the length limit that ends between two words. */
export function fitOutput(text: string, purpose: AiPurpose): string {
  const limit = outputCharLimit(purpose);
  if (text.length <= limit) return text;
  const head = text.slice(0, limit + 1);
  const lastSpace = head.search(/\s\S*$/);
  return (lastSpace > 0 ? head.slice(0, lastSpace) : text.slice(0, limit)).trimEnd();
}
