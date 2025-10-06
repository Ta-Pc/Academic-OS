import { AcademicTerm } from '../../types';

export class TermMapper {
  static toDomain(row: any): AcademicTerm {
    return {
      id: row.id,
      parentTermId: row.parentTermId,
      academicYear: row.academicYear,
      termName: row.termName,
      startDate: row.startDate,
      endDate: row.endDate,
      gradePointAverageGoal: row.gradePointAverageGoal,
      durationInWeeks: row.durationInWeeks,
      notionalHoursPerCredit: row.notionalHoursPerCredit,
      calculated_term_gpa: row.calculated_term_gpa,
      calculated_registered_credits: row.calculated_registered_credits,
      calculated_earned_credits: row.calculated_earned_credits,
      calculated_cumulative_weight_timeline: row.calculated_cumulative_weight_timeline ? JSON.parse(row.calculated_cumulative_weight_timeline) : undefined,
      calculated_cumulative_points_secured: row.calculated_cumulative_points_secured,
      calculated_term_navigator_data: row.calculated_term_navigator_data ? JSON.parse(row.calculated_term_navigator_data) : undefined,
    };
  }
}
