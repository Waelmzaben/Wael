import type { SalaryScaleGrade } from '../types/salary';

export const SALARY_SCALE_STEPS_COUNT = 11;

export const DEFAULT_SALARY_SCALE: SalaryScaleGrade[] = [
  { gradeNumber: 1, gradeName: 'الأولى', step1Salary: 910000, annualIncrement: 20000 },
  { gradeNumber: 2, gradeName: 'الثانية', step1Salary: 723000, annualIncrement: 17000 },
  { gradeNumber: 3, gradeName: 'الثالثة', step1Salary: 600000, annualIncrement: 10000 },
  { gradeNumber: 4, gradeName: 'الرابعة', step1Salary: 509000, annualIncrement: 8000 },
  { gradeNumber: 5, gradeName: 'الخامسة', step1Salary: 429000, annualIncrement: 6000 },
  { gradeNumber: 6, gradeName: 'السادسة', step1Salary: 362000, annualIncrement: 6000 },
  { gradeNumber: 7, gradeName: 'السابعة', step1Salary: 296000, annualIncrement: 6000 },
  { gradeNumber: 8, gradeName: 'الثامنة', step1Salary: 260000, annualIncrement: 3000 },
  { gradeNumber: 9, gradeName: 'التاسعة', step1Salary: 210000, annualIncrement: 3000 },
  { gradeNumber: 10, gradeName: 'العاشرة', step1Salary: 170000, annualIncrement: 3000 },
];

const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function normalizeArabicText(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d] ?? d)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

const GRADE_WORD_MAP: Array<[string, number]> = [
  ['عاشره', 10],
  ['عاشر', 10],
  ['تاسعه', 9],
  ['تاسع', 9],
  ['ثامنه', 8],
  ['ثامن', 8],
  ['سابعه', 7],
  ['سابع', 7],
  ['سادسه', 6],
  ['سادس', 6],
  ['خامسه', 5],
  ['خامس', 5],
  ['رابعه', 4],
  ['رابع', 4],
  ['ثالثه', 3],
  ['ثالث', 3],
  ['ثانيه', 2],
  ['ثاني', 2],
  ['اولي', 1],
  ['اول', 1],
];

const STEP_WORD_MAP: Array<[string, number]> = [
  ['حادي عشر', 11],
  ['حاديه عشر', 11],
  ['عاشره', 10],
  ['عاشر', 10],
  ['تاسعه', 9],
  ['تاسع', 9],
  ['ثامنه', 8],
  ['ثامن', 8],
  ['سابعه', 7],
  ['سابع', 7],
  ['سادسه', 6],
  ['سادس', 6],
  ['خامسه', 5],
  ['خامس', 5],
  ['رابعه', 4],
  ['رابع', 4],
  ['ثالثه', 3],
  ['ثالث', 3],
  ['ثانيه', 2],
  ['ثاني', 2],
  ['اولي', 1],
  ['اول', 1],
];

export function parseGradeNumber(grade: string): number | null {
  const norm = normalizeArabicText(grade);
  if (!norm) return null;

  const numMatch = norm.match(/\b(10|[1-9])\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= 10) return n;
  }

  for (const [word, num] of GRADE_WORD_MAP) {
    if (norm.includes(word)) {
      return num;
    }
  }

  return null;
}

export function parseStepNumber(step: string): number | null {
  const norm = normalizeArabicText(step);
  if (!norm) return null;

  const numMatch = norm.match(/\b(11|10|[1-9])\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= SALARY_SCALE_STEPS_COUNT) return n;
  }

  for (const [word, num] of STEP_WORD_MAP) {
    if (norm.includes(word)) {
      return num;
    }
  }

  return null;
}

export function formatCanonicalGrade(gradeNumber: number): string {
  const found = DEFAULT_SALARY_SCALE.find((g) => g.gradeNumber === gradeNumber);
  return found ? found.gradeName : String(gradeNumber);
}

export function formatCanonicalStep(stepNumber: number): string {
  return `المرحلة ${stepNumber}`;
}

export function normalizeSalaryScale(rawScale: unknown): SalaryScaleGrade[] {
  if (!Array.isArray(rawScale) || rawScale.length === 0) {
    return DEFAULT_SALARY_SCALE.map((item) => ({ ...item }));
  }

  return DEFAULT_SALARY_SCALE.map((fallback) => {
    const match = rawScale.find(
      (item): item is Partial<SalaryScaleGrade> =>
        Boolean(item) && typeof item === 'object' && item.gradeNumber === fallback.gradeNumber
    );
    if (!match) return { ...fallback };

    const step1 = Number(match.step1Salary);
    const inc = Number(match.annualIncrement);
    return {
      gradeNumber: fallback.gradeNumber,
      gradeName: fallback.gradeName,
      step1Salary: Number.isFinite(step1) && step1 >= 0 ? Math.round(step1) : fallback.step1Salary,
      annualIncrement:
        Number.isFinite(inc) && inc >= 0 ? Math.round(inc) : fallback.annualIncrement,
    };
  });
}

export function getStepSalary(gradeEntry: SalaryScaleGrade, stepNumber: number): number {
  const clampedStep = Math.max(1, Math.min(SALARY_SCALE_STEPS_COUNT, Math.floor(stepNumber)));
  return Math.max(0, Math.round(gradeEntry.step1Salary + (clampedStep - 1) * gradeEntry.annualIncrement));
}

export interface SalaryScaleMatch {
  salary: number;
  gradeEntry: SalaryScaleGrade;
  stepNumber: number;
}

export function getScaleSalaryForGradeAndStep(
  scale: SalaryScaleGrade[],
  grade: string,
  step: string
): SalaryScaleMatch | null {
  const gradeNumber = parseGradeNumber(grade);
  if (!gradeNumber) return null;

  const normalizedScale = normalizeSalaryScale(scale);
  const gradeEntry = normalizedScale.find((g) => g.gradeNumber === gradeNumber);
  if (!gradeEntry) return null;

  const parsedStep = parseStepNumber(step);
  const stepNumber = parsedStep ?? 1;

  return {
    salary: getStepSalary(gradeEntry, stepNumber),
    gradeEntry,
    stepNumber,
  };
}
