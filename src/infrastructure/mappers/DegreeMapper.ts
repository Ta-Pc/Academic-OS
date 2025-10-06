import { Degree } from '../../core/domain/models/Degree';
import { Term } from '../../core/domain/models/Term';

export class DegreeMapper {
  static toDomain(row: any): Degree {
    const data = {
      id: row.id,
      degreeName: row.degreeName,
      institutionName: row.institutionName,
      specialization: row.specialization,
      nqfLevel: row.nqfLevel,
      duration: row.duration,
      totalCreditsToGraduate: row.totalCreditsToGraduate,
      status: row.status,
      startDate: row.startDate,
      expectedEndDate: row.expectedEndDate,
      terms: [] as Term[], // Terms will be loaded separately
      calculated_total_registered_credits: row.calculated_total_registered_credits,
      calculated_credits_per_year: row.calculated_credits_per_year ? JSON.parse(row.calculated_credits_per_year) : undefined,
      calculated_credits_per_term: row.calculated_credits_per_term ? JSON.parse(row.calculated_credits_per_term) : undefined,
      calculated_total_earned_credits: row.calculated_total_earned_credits,
      calculated_degree_progress_percent: row.calculated_degree_progress_percent,
      calculated_overall_gpa: row.calculated_overall_gpa,
    };

    return new Degree(data);
  }

  static toPersistence(degree: Degree): any {
    return {
      id: degree.id,
      degreeName: degree.degreeName,
      institutionName: degree.institutionName,
      specialization: degree.specialization,
      nqfLevel: degree.nqfLevel,
      duration: degree.duration,
      totalCreditsToGraduate: degree.totalCreditsToGraduate,
      status: degree.status,
      startDate: degree.startDate,
      expectedEndDate: degree.expectedEndDate,
      calculated_total_registered_credits: degree.calculated_total_registered_credits,
      calculated_credits_per_year: degree.calculated_credits_per_year ? JSON.stringify(degree.calculated_credits_per_year) : null,
      calculated_credits_per_term: degree.calculated_credits_per_term ? JSON.stringify(degree.calculated_credits_per_term) : null,
      calculated_total_earned_credits: degree.calculated_total_earned_credits,
      calculated_degree_progress_percent: degree.calculated_degree_progress_percent,
      calculated_overall_gpa: degree.calculated_overall_gpa,
    };
  }
}
