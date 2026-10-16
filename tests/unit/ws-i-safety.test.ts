import { describe, expect, it } from 'vitest';
import { checkOutput } from '@/lib/ai/safety';
import type { AiPurpose } from '@/lib/ai/types';

// WS-I core: the tuning of the output list (ARCHITECTURE.md 8.6, "WS-I tunes the list").

const PURPOSES: AiPurpose[] = ['tutor', 'lab', 'review'];

describe('checkOutput after the WS-I tuning', () => {
  it.each([
    'Open http://localhost:3000 in your browser.',
    'Try http://127.0.0.1:5000/predict',
    'Run it, then open http://localhost:8000.',
    'See (http://localhost:3000) now',
    'Start the server and visit https://localhost',
    'Let’s meet the perceptron!',
    'Keep your password secret.',
    'Show me a picture of a cat.',
    'On peut se voir comme une équipe.',
  ])('allows %j', (text) => {
    for (const purpose of PURPOSES)
      expect(checkOutput(text, purpose), purpose).toEqual({ ok: true });
  });

  it.each([
    'Let’s meet up after school.',
    'We could meet in person tomorrow.',
    'Meet me at the park.',
    'On pourrait se voir en vrai.',
    'Nous retrouver après l’école ?',
    'Send me a photo of yourself.',
    'Show me pictures of you.',
    'Envoie-moi une photo de toi.',
    // Look-alikes that are not loopback.
    'http://localhost.evil.example/x',
    'http://localhost@evil.example/',
    'http://127.0.0.1.evil.example/',
    'http://localhost:3000.evil.example/',
    // Links smuggled behind a loopback origin.
    '[http://localhost:3000](https://evil.example)',
    'open http://localhost:3000/?next=https://evil.example now',
    'go to http://localhost:3000/www.evil.com',
    'http://localhost:3000/ write to a@evil.example',
    // Every other address stays banned.
    'Read more on https://example.org/ai.',
  ])('refuses %j', (text) => {
    for (const purpose of PURPOSES) {
      expect(checkOutput(text, purpose), purpose).toEqual({ ok: false, reason: 'banned_pattern' });
    }
  });
});
