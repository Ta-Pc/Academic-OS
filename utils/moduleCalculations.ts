/**
 * Calculates the average grade required on remaining assessments to achieve a target final grade.
 * @param goal The target final grade (e.g., 75 for 75%).
 * @param patfg Points Accumulated Toward Final Grade.
 * @param completion The percentage of the module's total weight that has been graded.
 * @returns The required average as a percentage, or null if unattainable or already met.
 */
export const calculateRequiredAverage = (
  goal: number,
  patfg: number | undefined,
  completion: number | undefined
): number | null => {
  if (typeof patfg === 'undefined' || typeof completion === 'undefined') return null;

  const remainingWeight = 100 - completion;
  if (remainingWeight <= 0) {
    return patfg >= goal ? 0 : null; // Goal met or unattainable
  }

  const pointsNeeded = goal - patfg;
  if (pointsNeeded <= 0) return 0; // Goal already met

  const requiredAverage = (pointsNeeded / remainingWeight) * 100;
  return requiredAverage;
};

/**
 * Calculates the difference between the current accumulated points and a target grade.
 * @param goal The target final grade.
 * @param patfg Points Accumulated Toward Final Grade.
 * @returns The difference in percentage points.
 */
export const calculateGapToTarget = (
  goal: number,
  patfg: number | undefined
): number | null => {
  if (typeof patfg === 'undefined') return null;
  return goal - patfg;
};

/**
 * Calculates the difference between the current semester mark and the exam entrance requirement.
 * @param minExamEntrance The minimum grade required to be admitted to the exam.
 * @param currentGrade The student's current grade in the module.
 * @returns The difference in percentage points. A positive value means the requirement is not yet met.
 */
export const calculateExamEntranceGap = (
  minExamEntrance: number | undefined,
  currentGrade: number | undefined
): number | null => {
  if (typeof minExamEntrance === 'undefined' || typeof currentGrade === 'undefined') {
    return null;
  }
  const gap = minExamEntrance - currentGrade;
  return Math.max(0, gap); // Gap cannot be negative
};
