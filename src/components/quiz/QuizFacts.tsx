import { ListChecks, RotateCcw, Target, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui';
import type { Quiz } from '@/types/quiz';

export interface QuizFactsProps {
  quiz: Quiz;
  /** Attempts left; null = unlimited. */
  remaining: number | null;
}

/** The quiz at a glance: questions, pass mark, attempts and the XP for passing. */
export function QuizFacts({ quiz, remaining }: QuizFactsProps) {
  const t = useTranslations('quiz');
  const facts = [
    {
      key: 'questions',
      icon: <ListChecks aria-hidden="true" />,
      text: t('facts.questions', { count: quiz.questions.length }),
    },
    {
      key: 'passMark',
      icon: <Target aria-hidden="true" />,
      text: t('facts.passMark', { percent: quiz.passingScorePercent }),
    },
    {
      key: 'attempts',
      icon: <RotateCcw aria-hidden="true" />,
      text:
        remaining === null
          ? t('facts.attemptsUnlimited')
          : t('facts.attemptsLeft', { remaining, max: quiz.maxAttempts ?? remaining }),
    },
  ];
  if (quiz.xpReward > 0) {
    facts.push({
      key: 'xp',
      icon: <Zap aria-hidden="true" />,
      text: t('facts.xpReward', { xp: quiz.xpReward }),
    });
  }

  return (
    <ul aria-label={t('facts.label')} className="flex flex-wrap gap-2">
      {facts.map((fact) => (
        <li key={fact.key} className="max-w-full">
          <Chip size="md" tone={fact.key === 'xp' ? 'brand' : 'neutral'} icon={fact.icon}>
            {fact.text}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
