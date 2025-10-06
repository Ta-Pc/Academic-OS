import { Term } from '../../core/domain/models/Term';

export class TermMapper {
  static toDomain(row: any): Term {
    const data = {
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

    return new Term(data);
  }

  static toPersistence(term: Term): any {
    return {
      id: term.id,
      parentTermId: term.parentTermId,
      academicYear: term.academicYear,
      termName: term.termName,
      startDate: term.startDate,
      endDate: term.endDate,
      gradePointAverageGoal: term.gradePointAverageGoal,
      durationInWeeks: term.durationInWeeks,
      notionalHoursPerCredit: term.notionalHoursPerCredit,
      calculated_term_gpa: term.calculated_term_gpa,
      calculated_registered_credits: term.calculated_registered_credits,
      calculated_earned_credits: term.calculated_earned_credits,
      calculated_cumulative_weight_timeline: term.calculated_cumulative_weight_timeline ? JSON.stringify(term.calculated_cumulative_weight_timeline) : null,
      calculated_cumulative_points_secured: term.calculated_cumulative_points_secured,
      calculated_term_navigator_data: term.calculated_term_navigator_data ? JSON.stringify(term.calculated_term_navigator_data) : null,
    };
  }
}
