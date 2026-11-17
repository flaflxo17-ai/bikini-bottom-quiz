import { QuestionItem } from '../types/game';
import { QUESTIONS_MATH_SCIENCE } from './questionsMathScience';
import { QUESTIONS_SOCIAL_CIVICS } from './questionsSocialCivics';
import { QUESTIONS_LANGUAGES } from './questionsLanguages';
import { QUESTIONS_RELIGION_ARABIC } from './questionsReligionArabic';
import { QUESTIONS_EXTRA_A } from './questionsExtraA';
import { QUESTIONS_EXTRA_B } from './questionsExtraB';

export const QUESTION_BANK: QuestionItem[] = [
  ...QUESTIONS_MATH_SCIENCE,
  ...QUESTIONS_SOCIAL_CIVICS,
  ...QUESTIONS_LANGUAGES,
  ...QUESTIONS_RELIGION_ARABIC,
  ...QUESTIONS_EXTRA_A,
  ...QUESTIONS_EXTRA_B,
];
