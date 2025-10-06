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

  static toPersistence(assessment: Assessment): any {
    return {
      id: assessment.id,
      moduleCode: assessment.moduleCode.value,
      assessmentName: assessment.assessmentName,
      assessmentType: assessment.assessmentType,
      weight: assessment.weight,
      dueDate: assessment.dueDate,
      status: assessment.status,
      result: assessment.result?.value,
      effort: assessment.effort,
      calculated_priority_score: assessment.calculated_priority_score,
    };
  }
}
