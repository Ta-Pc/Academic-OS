import { Module } from '../../types';

export class ModuleMapper {
  static toDomain(row: any): Module & { id: string } {
    console.log('ModuleMapper.toDomain raw row:', row);
    const moduleObject = {
      id: row.offeringId,
      offeringId: row.offeringId,
      moduleId: row.moduleId,
      moduleCode: row.moduleCode,
      moduleName: row.moduleName,
      credits: row.credits,
      moduleType: row.moduleType,
      anchorTermId: row.anchorTermId,
      startDate: row.startDate ? new Date(row.startDate).toISOString() : undefined,
      endDate: row.endDate ? new Date(row.endDate).toISOString() : undefined,
      status: row.status,
      minFinalGrade: row.minFinalGrade,
      minExamEntrance: row.minExamEntrance,
      minExamGrade: row.minExamGrade,
      targetFinalGrade: row.targetFinalGrade,
      notes: row.notes,
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites) : undefined,
      calculated_current_grade: row.calculated_current_grade,
      calculated_patfg: row.calculated_patfg,
      calculated_final_grade: row.calculated_final_grade,
      calculated_completion_progress: row.calculated_completion_progress,
      calculated_projected_final_grade: row.calculated_projected_final_grade,
      calculated_max_achievable_grade: row.calculated_max_achievable_grade,
      calculated_category_performance: row.calculated_category_performance ? JSON.parse(row.calculated_category_performance) : undefined,
      calculated_late_count: row.calculated_late_count,
      calculated_upcoming_count: row.calculated_upcoming_count,
      calculated_weekly_time_spent: row.calculated_weekly_time_spent,
    };

    console.log("ModuleMapper.toDomain MAPPED OBJECT:", moduleObject);

    return moduleObject;
  }
}
