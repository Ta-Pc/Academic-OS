import { Module } from '../../domain/models/Module';

export class DegreeCalculator {
  /**
   * Calculates total registered credits.
   */
  static calculateTotalRegisteredCredits(modules: Module[]): number {
    return modules.reduce((sum, module) => sum + module.credits.value, 0);
  }

  /**
   * Calculates total earned credits (completed modules).
   */
  static calculateTotalEarnedCredits(modules: Module[]): number {
    return modules
      .filter(m => m.status === 'Completed')
      .reduce((sum, module) => sum + module.credits.value, 0);
  }

  /**
   * Calculates degree progress percent.
   */
  static calculateDegreeProgressPercent(totalEarnedCredits: number, totalCreditsToGraduate: number): number {
    return totalCreditsToGraduate > 0 ? (totalEarnedCredits / totalCreditsToGraduate) * 100 : 0;
  }

  /**
   * Calculates credits per year.
   */
  static calculateCreditsPerYear(modules: Module[]): Record<number, number> {
    const creditsPerYear: Record<number, number> = {};
    // Assuming modules have anchorTermId, but to get year, need term data.
    // For simplicity, placeholder. In real, need to join with terms.
    // Since we don't have term year here, return empty.
    return creditsPerYear;
  }

  /**
   * Calculates credits per term.
   */
  static calculateCreditsPerTerm(modules: Module[]): Record<string, number> {
    const creditsPerTerm: Record<string, number> = {};
    modules.forEach(module => {
      const termId = module.anchorTermId;
      creditsPerTerm[termId] = (creditsPerTerm[termId] || 0) + module.credits.value;
    });
    return creditsPerTerm;
  }

  /**
   * Calculates overall GPA.
   */
  static calculateOverallGPA(modules: Module[]): number | undefined {
    const modulesWithFinalGrade = modules.filter(m => m.calculated_final_grade !== undefined && m.calculated_final_grade !== null);
    const totalWeightedGradePoints = modulesWithFinalGrade.reduce((sum, m) => sum + (m.calculated_final_grade! * m.credits.value), 0);
    const totalCreditsWithGrade = modulesWithFinalGrade.reduce((sum, m) => sum + m.credits.value, 0);
    return totalCreditsWithGrade > 0 ? totalWeightedGradePoints / totalCreditsWithGrade : undefined;
  }
}
