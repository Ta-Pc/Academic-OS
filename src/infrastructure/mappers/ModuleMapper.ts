import { Module } from '../../core/domain/models/Module';
import { ModuleCode } from '../../core/domain/value-objects/ModuleCode';
import { Credits } from '../../core/domain/value-objects/Credits';

export class ModuleMapper {
  static toDomain(raw: any): Module {
    return new Module({
      offeringId: raw.offeringId,
      moduleId: raw.moduleId,
      moduleCode: raw.moduleCode,
      moduleName: raw.moduleName,
      credits: raw.credits,
      moduleType: raw.moduleType,
      anchorTermId: raw.anchorTermId,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
      minFinalGrade: raw.minFinalGrade,
      minExamEntrance: raw.minExamEntrance,
      minExamGrade: raw.minExamGrade,
      targetFinalGrade: raw.targetFinalGrade,
      notes: raw.notes,
      prerequisites: raw.prerequisites,
      calculated_current_grade: raw.calculated_current_grade,
      calculated_patfg: raw.calculated_patfg,
      calculated_final_grade: raw.calculated_final_grade,
      calculated_completion_progress: raw.calculated_completion_progress,
      calculated_projected_final_grade: raw.calculated_projected_final_grade,
      calculated_max_achievable_grade: raw.calculated_max_achievable_grade,
      calculated_category_performance: raw.calculated_category_performance,
      calculated_late_count: raw.calculated_late_count,
      calculated_upcoming_count: raw.calculated_upcoming_count,
      calculated_weekly_time_spent: raw.calculated_weekly_time_spent,
    });
  }

  static toPersistence(module: Module): any {
    return {
      id: module.id,
      moduleCode: module.moduleCode.value,
      moduleName: module.moduleName,
      credits: module.credits.value,
      moduleType: module.moduleType,
      minFinalGrade: module.minFinalGrade,
      minExamEntrance: module.minExamEntrance,
      minExamGrade: module.minExamGrade,
      targetFinalGrade: module.targetFinalGrade,
      notes: module.notes,
      prerequisites: module.prerequisites,
      offeringId: module.offeringId,
      anchorTermId: module.anchorTermId,
      startDate: module.startDate,
      endDate: module.endDate,
      status: module.status,
    };
  }
}
