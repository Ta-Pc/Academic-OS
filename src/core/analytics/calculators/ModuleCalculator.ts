import { Assessment } from '../../domain/models/Assessment';
import { startOfDay, parseISO } from 'date-fns';

export class ModuleCalculator {
  /**
   * Calculates the current grade for a module based on graded assessments.
   */
  static calculateCurrentGrade(assessments: Assessment[]): number | undefined {
    const gradedAssessments = assessments.filter(a => a.result !== undefined);
    const gradedSemesterWork = gradedAssessments.filter(a => a.assessmentType !== 'Exam');

    const totalWeightOfGradedSemesterWork = gradedSemesterWork.reduce((acc, assessment) => acc + assessment.weight, 0);
    if (totalWeightOfGradedSemesterWork === 0) return undefined;

    const patfg = gradedSemesterWork.reduce((acc, assessment) => {
      const contribution = (assessment.weight * assessment.result!.value) / 100;
      return acc + contribution;
    }, 0);

    return (patfg / totalWeightOfGradedSemesterWork) * 100;
  }

  /**
   * Calculates Points Accumulated Toward Final Grade (PATFG).
   */
  static calculatePATFG(assessments: Assessment[]): number {
    const gradedSemesterWork = assessments.filter(a =>
      a.result !== undefined && a.assessmentType !== 'Exam'
    );

    return gradedSemesterWork.reduce((acc, assessment) => {
      const contribution = (assessment.weight * assessment.result!.value) / 100;
      return acc + contribution;
    }, 0);
  }

  /**
   * Calculates completion progress (total weight of graded assessments).
   */
  static calculateCompletionProgress(assessments: Assessment[]): number {
    const gradedAssessments = assessments.filter(a => a.result !== undefined);
    return gradedAssessments.reduce((acc, assessment) => acc + assessment.weight, 0);
  }

  /**
   * Calculates final grade if all assessments are graded.
   */
  static calculateFinalGrade(assessments: Assessment[]): number | undefined {
    const allGraded = assessments.every(a => a.result !== undefined);
    if (!allGraded) return undefined;

    return assessments.reduce((acc, assessment) => {
      const contribution = (assessment.weight * assessment.result!.value) / 100;
      return acc + contribution;
    }, 0);
  }

  /**
   * Calculates projected final grade.
   */
  static calculateProjectedFinalGrade(assessments: Assessment[]): number | undefined {
    const currentGrade = this.calculateCurrentGrade(assessments);
    if (currentGrade === undefined) return undefined;

    const gradedAssessments = assessments.filter(a => a.result !== undefined);
    const ungradedAssessments = assessments.filter(a => a.result === undefined);

    const totalPointsFromGraded = gradedAssessments.reduce((acc, a) => acc + (a.weight * a.result!.value) / 100, 0);
    const totalWeightOfUngraded = ungradedAssessments.reduce((acc, a) => acc + a.weight, 0);

    const projectedPointsFromUngraded = (totalWeightOfUngraded / 100) * currentGrade;
    return totalPointsFromGraded + projectedPointsFromUngraded;
  }

  /**
   * Calculates maximum achievable grade.
   */
  static calculateMaxAchievableGrade(assessments: Assessment[]): number {
    const gradedAssessments = assessments.filter(a => a.result !== undefined);
    const ungradedAssessments = assessments.filter(a => a.result === undefined);

    const totalPointsFromGraded = gradedAssessments.reduce((acc, a) => acc + (a.weight * a.result!.value) / 100, 0);
    const maxPointsFromUngraded = ungradedAssessments.reduce((acc, assessment) => acc + assessment.weight, 0);

    return Math.min(100, totalPointsFromGraded + maxPointsFromUngraded);
  }

  /**
   * Calculates category performance.
   */
  static calculateCategoryPerformance(assessments: Assessment[]): Record<string, number> {
    const gradedAssessments = assessments.filter(a => a.result !== undefined);
    const categoryPerformance: Record<string, number> = {};

    const assessmentsByCategory = gradedAssessments.reduce((acc, assessment) => {
      const type = assessment.assessmentType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(assessment);
      return acc;
    }, {} as Record<string, Assessment[]>);

    for (const category in assessmentsByCategory) {
      const catAssessments = assessmentsByCategory[category];
      const totalWeight = catAssessments.reduce((sum, a) => sum + a.weight, 0);
      if (totalWeight > 0) {
        const weightedSum = catAssessments.reduce((sum, a) => sum + (a.result!.value * a.weight), 0);
        categoryPerformance[category] = weightedSum / totalWeight;
      }
    }

    return categoryPerformance;
  }

  /**
   * Calculates late count.
   */
  static calculateLateCount(assessments: Assessment[]): number {
    const today = startOfDay(new Date());
    return assessments.filter(a => {
      if (a.status !== 'Missed') return false;
      if (!a.dueDate || a.dueDate === 'TBC') return false;
      const dueDate = parseISO(a.dueDate);
      return dueDate < today;
    }).length;
  }

  /**
   * Calculates upcoming count (due in next 7 days).
   */
  static calculateUpcomingCount(assessments: Assessment[]): number {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return assessments.filter(a => {
      if (a.status !== 'Upcoming' || !a.dueDate || a.dueDate === 'TBC') return false;
      const dueDate = parseISO(a.dueDate);
      return dueDate >= today && dueDate < sevenDaysFromNow;
    }).length;
  }

  /**
   * Calculates weekly time spent (placeholder, hardcoded to 0).
   */
  static calculateWeeklyTimeSpent(): number {
    // Placeholder: requires Task and Pomodoro Log entities
    return 0;
  }
}
