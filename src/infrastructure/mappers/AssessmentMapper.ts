import { Assessment } from '../../core/domain/models/Assessment';

export class AssessmentMapper {
  static toDomain(row: any): Assessment {
    const data = {
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

    return new Assessment(data);
  }
}
