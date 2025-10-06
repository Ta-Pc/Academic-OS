import { Assessment } from '../../types';

export class AssessmentMapper {
  static toDomain(row: any): Assessment {
    return {
      id: row.id,
      moduleCode: row.moduleCode,
      assessmentName: row.assessmentName,
      assessmentType: row.assessmentType,
      weight: row.weight,
      dueDate: row.dueDate,
      status: row.status,
      result: row.result,
      effort: row.effort,
      calculated_priority_score: row.calculated_priority_score,
    };
  }
}
