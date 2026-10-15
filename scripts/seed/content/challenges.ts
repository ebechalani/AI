// The two sample challenges of ARCHITECTURE.md 11.6: one weekly challenge that is open now and
// one robotics challenge that has not started. Their dates are relative to the moment the seed
// runs, so a re-run moves them back into place.

import type { SeedChallenge } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

export const SEED_CHALLENGES: SeedChallenge[] = [
  {
    id: 'weekly-ai-around-me-poster',
    input: {
      type: 'weekly',
      scope: 'global',
      schoolId: null,
      area: 'creativity',
      ageMin: 8,
      ageMax: 14,
      startAt: daysFromNow(-2),
      deadlineAt: daysFromNow(5),
      allowedSubmissionTypes: ['image', 'pdf', 'text'],
      rubric: [
        { key: 'creativity', weight: 40 },
        { key: 'technicalQuality', weight: 20 },
        { key: 'understanding', weight: 20 },
        { key: 'responsibleAi', weight: 20 },
      ],
      xpReward: 500,
      coverImageFileId: null,
      hardwarePlatformIds: [],
      requiredCapabilities: [],
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Weekly challenge: an "AI around me" poster',
          description:
            'Look around your home, your school and your street. Where is artificial intelligence helping, suggesting or deciding? Make a poster that shows at least four places where you found AI, and say for each one how you can tell it is AI.',
          submissionRequirements:
            'One poster as an image or a PDF (drawn by hand and photographed, or made on a computer), or a written description. Name four examples of AI around you and explain what each one does. If an AI tool helped you, say how. No names, faces or addresses of real people on the poster.',
          prizes:
            'The three posters the jury likes most are shown on the RoboHolic home screen for a week.',
        },
        fr: {
          title: 'Défi de la semaine\u00a0: une affiche «\u00a0L’IA autour de moi\u00a0»',
          description:
            'Observe ce qui t’entoure\u00a0: à la maison, à l’école, dans ta rue. Où l’intelligence artificielle aide-t-elle, propose-t-elle ou décide-t-elle\u00a0? Réalise une affiche qui montre au moins quatre endroits où tu as trouvé de l’IA et, pour chacun, explique comment tu sais que c’est de l’IA.',
          submissionRequirements:
            'Une affiche en image ou en PDF (dessinée à la main puis photographiée, ou réalisée sur ordinateur), ou bien une description écrite. Cite quatre exemples d’IA autour de toi et explique ce que fait chacun d’eux. Si un outil d’IA t’a aidé, explique comment. Pas de noms, de visages ni d’adresses de vraies personnes sur l’affiche.',
          prizes:
            'Les trois affiches préférées du jury sont présentées sur l’écran d’accueil de RoboHolic pendant une semaine.',
        },
      },
    },
  },
  {
    id: 'robotics-line-follower',
    input: {
      type: 'roboholic',
      scope: 'global',
      schoolId: null,
      area: 'robotics',
      ageMin: 10,
      ageMax: 18,
      startAt: daysFromNow(10),
      deadlineAt: daysFromNow(40),
      allowedSubmissionTypes: ['video', 'link', 'code', 'text'],
      rubric: [
        { key: 'creativity', weight: 20 },
        { key: 'technicalQuality', weight: 40 },
        { key: 'understanding', weight: 20 },
        { key: 'responsibleAi', weight: 20 },
      ],
      xpReward: 500,
      coverImageFileId: null,
      hardwarePlatformIds: ['simulator', 'generic-camera-rover'],
      requiredCapabilities: ['drive', 'line'],
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'RoboHolic challenge: the line follower',
          description:
            'Program a robot that follows a black line on a white floor from start to finish without leaving it, on the simulator or on any kit with wheels and a line sensor. Bonus points for a robot that stops on its own when the line ends.',
          submissionRequirements:
            'A video or a link showing one complete run, plus your program (as code or a link to it) and a short text explaining how your robot decides when to turn. Runs on the simulator count as much as runs on a real robot. Film only the robot: no faces or names in the video. If an AI tool helped you write the program, say how.',
          prizes:
            'The fastest clean run and the most creative robot each receive a RoboHolic trophy badge and a feature in the Robotics area.',
        },
        fr: {
          title: 'Défi RoboHolic\u00a0: le suiveur de ligne',
          description:
            'Programme un robot qui suit une ligne noire sur un sol blanc, du départ à l’arrivée, sans jamais la quitter, sur le simulateur ou sur n’importe quel kit à roues équipé d’un capteur de ligne. Points bonus pour un robot qui s’arrête tout seul à la fin de la ligne.',
          submissionRequirements:
            'Une vidéo ou un lien montrant un parcours complet, ton programme (sous forme de code ou de lien) et un court texte qui explique comment ton robot décide de tourner. Les parcours sur le simulateur comptent autant que ceux sur un vrai robot. Ne filme que le robot\u00a0: pas de visages ni de noms dans la vidéo. Si un outil d’IA t’a aidé à écrire le programme, explique comment.',
          prizes:
            'Le parcours sans faute le plus rapide et le robot le plus créatif reçoivent chacun un badge trophée RoboHolic et sont mis en avant dans l’espace Robotique.',
        },
      },
    },
  },
];
