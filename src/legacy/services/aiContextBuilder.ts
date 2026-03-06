/**
 * Builds a structured natural-language context string from the user's academic data.
 * This context is prepended to every AI chat message so the model has full awareness
 * of the student's current situation without the user needing to repeat themselves.
 */

import { Module, Assessment, AcademicTerm, AssessmentType } from '../../types';

/** Assessment types that are considered "continuous" (spread throughout the term). */
const CONTINUOUS_ASSESSMENT_TYPES: AssessmentType[] = [
  'Quiz',
  'Assignment',
  'Homework',
  'Tutorial',
  'Class Test',
  'Practical',
  'Semester Test',
];

/** Assessment types that are high-stakes finals (not continuous). */
const EXAM_ASSESSMENT_TYPES: AssessmentType[] = ['Exam'];

/**
 * Calculates the percentage of a module's total weight that comes from
 * continuous (ongoing) assessments vs. final exams.
 */
export function getAssessmentStructure(assessments: Assessment[]): {
  continuousWeight: number;
  examWeight: number;
  isContinuousHeavy: boolean;
} {
  const continuousWeight = assessments
    .filter(a => CONTINUOUS_ASSESSMENT_TYPES.includes(a.assessmentType))
    .reduce((sum, a) => sum + a.weight, 0);

  const examWeight = assessments
    .filter(a => EXAM_ASSESSMENT_TYPES.includes(a.assessmentType))
    .reduce((sum, a) => sum + a.weight, 0);

  return {
    continuousWeight,
    examWeight,
    isContinuousHeavy: continuousWeight > examWeight,
  };
}

/**
 * Finds the term a module is anchored to.
 */
function findModuleTerm(module: Module, allTerms: AcademicTerm[]): AcademicTerm | undefined {
  return allTerms.find(t => t.id === module.anchorTermId);
}

/**
 * Returns assessments that are eligible for the "Priority Actions" pane.
 * Overdue and missed assessments are excluded — only upcoming (actionable)
 * assessments are kept.
 */
export function getPriorityAssessments(assessments: Assessment[]): Assessment[] {
  return assessments.filter(a => a.status !== 'Overdue' && a.status !== 'Missed');
}

/**
 * Assembles a rich, structured system-context string that describes the student's
 * full academic snapshot. This is injected as a system prompt before every AI call.
 *
 * When `excludeOverdue` is true the detailed assessment list omits overdue /
 * missed items so the AI focuses only on actionable (upcoming) work — this is
 * used when generating priority-action recommendations.
 */
export function buildAcademicContext(
  modules: Module[],
  allAssessments: Assessment[],
  allTerms: AcademicTerm[],
  studentName?: string,
  excludeOverdue?: boolean,
): string {
  const activeModules = modules.filter(m => m.status === 'In Progress');

  if (activeModules.length === 0) {
    return 'The student currently has no active modules registered.';
  }

  const lines: string[] = [];

  if (studentName) {
    lines.push(`Student: ${studentName}`);
  }

  lines.push(`Active modules: ${activeModules.length}`);
  lines.push('');
  lines.push('--- MODULE DETAILS ---');

  for (const module of activeModules) {
    const allModuleAssessments = allAssessments.filter(a => a.moduleCode === module.moduleCode);
    const assessments = excludeOverdue
      ? allModuleAssessments.filter(a => a.status !== 'Overdue' && a.status !== 'Missed')
      : allModuleAssessments;
    const term = findModuleTerm(module, allTerms);
    const { continuousWeight, examWeight, isContinuousHeavy } = getAssessmentStructure(allModuleAssessments);

    const currentGrade =
      module.calculated_current_grade !== undefined && module.calculated_current_grade !== null
        ? `${module.calculated_current_grade.toFixed(1)}%`
        : 'No grades recorded yet';

    const weeklyHours =
      module.calculated_weekly_time_spent !== undefined && module.calculated_weekly_time_spent > 0
        ? `${Math.floor(module.calculated_weekly_time_spent / 60)}h ${Math.floor(module.calculated_weekly_time_spent % 60)}m/week`
        : 'No study time logged';

    const completionProgress =
      module.calculated_completion_progress !== undefined
        ? `${module.calculated_completion_progress.toFixed(0)}%`
        : 'N/A';

    const termLabel = term
      ? `${term.termName} ${term.academicYear} (${term.startDate} to ${term.endDate})`
      : 'Unknown term';

    const gradedAssessments = assessments.filter(a => a.status === 'Graded');
    const upcomingAssessments = assessments.filter(a => a.status === 'Upcoming');
    const overdueAssessments = allModuleAssessments.filter(a => a.status === 'Overdue' || a.status === 'Missed');

    const assessmentSummary = assessments
      .map(a => {
        const resultStr = a.result !== undefined ? `result: ${a.result}%` : a.status;
        const continuousLabel = CONTINUOUS_ASSESSMENT_TYPES.includes(a.assessmentType)
          ? 'continuous'
          : 'final exam';
        return `    • ${a.assessmentName} (${a.assessmentType}, ${continuousLabel}, weight: ${a.weight}%, ${resultStr})`;
      })
      .join('\n');

    lines.push(`Module: ${module.moduleName} [${module.moduleCode}]`);
    lines.push(`  Term/Semester: ${termLabel}`);
    lines.push(`  Credits: ${module.credits} | Type: ${module.moduleType}`);
    lines.push(`  Current grade: ${currentGrade}`);
    lines.push(`  Min passing grade: ${module.minFinalGrade}% | Target grade: ${module.targetFinalGrade}%`);
    lines.push(`  Weekly study time: ${weeklyHours}`);
    lines.push(`  Assessments completed: ${completionProgress} (${gradedAssessments.length} graded, ${upcomingAssessments.length} upcoming, ${overdueAssessments.length} overdue/missed)`);
    lines.push(`  Assessment structure:`);
    lines.push(`    Continuous assessment weight: ${continuousWeight.toFixed(1)}%`);
    lines.push(`    Final exam weight: ${examWeight.toFixed(1)}%`);
    lines.push(
      `    Overall: ${isContinuousHeavy ? 'Continuous-heavy (more ongoing work)' : 'Exam-heavy (relies more on final exam)'}`,
    );

    if (module.minExamEntrance !== undefined && module.minExamEntrance > 0) {
      lines.push(`    Exam entrance requirement: ${module.minExamEntrance}% class mark needed to write the exam`);
    }

    if (assessments.length > 0) {
      lines.push(`  Assessments:`);
      lines.push(assessmentSummary);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * The pre-built "Dangerous Modules Analysis" prompt pill text.
 *
 * This prompt is specifically crafted to elicit a comprehensive risk assessment
 * that covers study hours, assessment structure, continuous vs. exam-weighted grading,
 * current vs. target grade gaps, and semester/term context.
 */
export const DANGEROUS_MODULES_PROMPT = `Analyse my current academic workload and give me a clear risk assessment of each module. For every module, consider the following factors:

1. **Grade gap**: How far is my current grade from the minimum passing threshold and from my personal target? Flag any module where I am already below the minimum or where the gap is dangerously large.

2. **Study load**: How many hours per week am I spending on each module? Are there modules that are receiving little to no study time despite being high-risk?

3. **Assessment structure**: Is the module assessed continuously (regular assignments, quizzes, semester tests spread across the term) or is it heavily exam-weighted (the bulk of the grade depends on a single final exam)? Exam-heavy modules are riskier because there are fewer second chances.

4. **Assessment contribution**: Break down what percentage of the final grade is still "in play" (upcoming) versus already locked in. What score would I need on remaining assessments to still pass or reach my target?

5. **Semester/term context**: Which semester or term is each module in? Are any of these modules in a semester that is already well advanced, leaving very little time to recover?

Based on this analysis, rank my modules from most to least dangerous and explain why each is a concern. For the top two or three highest-risk modules, give me a specific, actionable study plan or strategy I should implement immediately.`;
