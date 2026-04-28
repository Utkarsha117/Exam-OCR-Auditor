import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GRADE_POINTS: Record<string, number> = {
  'O': 10,
  'A+': 10,
  'A': 9,
  'B+': 8,
  'B': 7,
  'C+': 6,
  'C': 5,
  'D': 4,
  'P': 4,
  'F': 0,
  'AB': 0,
};

export function calculateGradePoints(grade: string): number {
  const normalizedGrade = grade.trim().toUpperCase();
  // Document uses standard NEP/Engineering scale: O/A+=10, A=9, B+=8, etc.
  if (normalizedGrade in GRADE_POINTS) {
    return GRADE_POINTS[normalizedGrade];
  }
  return 0;
}

export function calculateSGPA(subjects: { credits: number; grade: string; points?: number }[]) {
  let totalCredits = 0;
  let totalPoints = 0;

  subjects.forEach((sub) => {
    // Audit/Non-credit courses (Credits = 0) shouldn't affect SGPA
    if (sub.credits <= 0) return;

    // Special grades that don't count towards CGPA/SGPA (S, X, U, etc. in some systems)
    const normalizedGrade = sub.grade.trim().toUpperCase();
    if (['S', 'X', 'U', 'I'].includes(normalizedGrade)) return;

    const points = typeof sub.points === 'number' ? sub.points : calculateGradePoints(sub.grade);
    
    // F/AB/I count as 0 points but do count in total credits for that semester's SGPA calculation
    // unless the system rules say otherwise. Usually F counts towards denominator.
    totalCredits += sub.credits;
    totalPoints += sub.credits * points;
  });

  if (totalCredits === 0) return 0;
  
  const sgpa = totalPoints / totalCredits;
  // Standard NEP rounding: round to 2 decimal places
  return Number(sgpa.toFixed(2));
}

export function formatTimestamp(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

export function getPointerColor(sgpa: number) {
  if (sgpa >= 9) return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
  if (sgpa >= 8) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  if (sgpa >= 7) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-red-500 bg-red-500/10 border-red-500/20';
}
