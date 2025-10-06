import { ModuleType, ModuleStatus } from '../../../types';
import { Credits } from '../value-objects/Credits';
import { ModuleCode } from '../value-objects/ModuleCode';

export class Module {
  private readonly _offeringId: string;
  private readonly _moduleId: string;
  private readonly _moduleCode: ModuleCode;
  private readonly _moduleName: string;
  private readonly _credits: Credits;
  private readonly _moduleType: ModuleType;
  private readonly _anchorTermId: string;
  private readonly _startDate?: string;
  private readonly _endDate?: string;
  private readonly _status: ModuleStatus;
  private readonly _minFinalGrade: number;
  private readonly _minExamEntrance?: number;
  private readonly _minExamGrade?: number;
  private readonly _targetFinalGrade: number;
  private readonly _notes?: string;
  private readonly _prerequisites?: string[];
  private readonly _calculated_current_grade?: number;
  private readonly _calculated_patfg?: number;
  private readonly _calculated_final_grade?: number;
  private readonly _calculated_completion_progress?: number;
  private readonly _calculated_projected_final_grade?: number;
  private readonly _calculated_max_achievable_grade?: number;
  private readonly _calculated_category_performance?: Record<string, number>;
  private readonly _calculated_late_count?: number;
  private readonly _calculated_upcoming_count?: number;
  private readonly _calculated_weekly_time_spent?: number;

  constructor(data: {
    offeringId: string;
    moduleId: string;
    moduleCode: string;
    moduleName: string;
    credits: number;
    moduleType: ModuleType;
    anchorTermId: string;
    startDate?: string;
    endDate?: string;
    status: ModuleStatus;
    minFinalGrade: number;
    minExamEntrance?: number;
    minExamGrade?: number;
    targetFinalGrade: number;
    notes?: string;
    prerequisites?: string[];
    calculated_current_grade?: number;
    calculated_patfg?: number;
    calculated_final_grade?: number;
    calculated_completion_progress?: number;
    calculated_projected_final_grade?: number;
    calculated_max_achievable_grade?: number;
    calculated_category_performance?: Record<string, number>;
    calculated_late_count?: number;
    calculated_upcoming_count?: number;
    calculated_weekly_time_spent?: number;
  }) {
    if (!data.offeringId) throw new Error('offeringId is required');
    if (!data.moduleId) throw new Error('moduleId is required');
    if (!data.moduleName) throw new Error('moduleName is required');
    if (!data.anchorTermId) throw new Error('anchorTermId is required');

    this._offeringId = data.offeringId;
    this._moduleId = data.moduleId;
    this._moduleCode = new ModuleCode(data.moduleCode);
    this._moduleName = data.moduleName;
    this._credits = new Credits(data.credits);
    this._moduleType = data.moduleType;
    this._anchorTermId = data.anchorTermId;
    this._startDate = data.startDate;
    this._endDate = data.endDate;
    this._status = data.status;
    this._minFinalGrade = data.minFinalGrade;
    this._minExamEntrance = data.minExamEntrance;
    this._minExamGrade = data.minExamGrade;
    this._targetFinalGrade = data.targetFinalGrade;
    this._notes = data.notes;
    this._prerequisites = data.prerequisites;
    this._calculated_current_grade = data.calculated_current_grade;
    this._calculated_patfg = data.calculated_patfg;
    this._calculated_final_grade = data.calculated_final_grade;
    this._calculated_completion_progress = data.calculated_completion_progress;
    this._calculated_projected_final_grade = data.calculated_projected_final_grade;
    this._calculated_max_achievable_grade = data.calculated_max_achievable_grade;
    this._calculated_category_performance = data.calculated_category_performance;
    this._calculated_late_count = data.calculated_late_count;
    this._calculated_upcoming_count = data.calculated_upcoming_count;
    this._calculated_weekly_time_spent = data.calculated_weekly_time_spent;
  }

  get id(): string { return this._offeringId; }
  get offeringId(): string { return this._offeringId; }
  get moduleId(): string { return this._moduleId; }
  get moduleCode(): ModuleCode { return this._moduleCode; }
  get moduleName(): string { return this._moduleName; }
  get credits(): Credits { return this._credits; }
  get moduleType(): ModuleType { return this._moduleType; }
  get anchorTermId(): string { return this._anchorTermId; }
  get startDate(): string | undefined { return this._startDate; }
  get endDate(): string | undefined { return this._endDate; }
  get status(): ModuleStatus { return this._status; }
  get minFinalGrade(): number { return this._minFinalGrade; }
  get minExamEntrance(): number | undefined { return this._minExamEntrance; }
  get minExamGrade(): number | undefined { return this._minExamGrade; }
  get targetFinalGrade(): number { return this._targetFinalGrade; }
  get notes(): string | undefined { return this._notes; }
  get prerequisites(): string[] | undefined { return this._prerequisites; }
  get calculated_current_grade(): number | undefined { return this._calculated_current_grade; }
  get calculated_patfg(): number | undefined { return this._calculated_patfg; }
  get calculated_final_grade(): number | undefined { return this._calculated_final_grade; }
  get calculated_completion_progress(): number | undefined { return this._calculated_completion_progress; }
  get calculated_projected_final_grade(): number | undefined { return this._calculated_projected_final_grade; }
  get calculated_max_achievable_grade(): number | undefined { return this._calculated_max_achievable_grade; }
  get calculated_category_performance(): Record<string, number> | undefined { return this._calculated_category_performance; }
  get calculated_late_count(): number | undefined { return this._calculated_late_count; }
  get calculated_upcoming_count(): number | undefined { return this._calculated_upcoming_count; }
  get calculated_weekly_time_spent(): number | undefined { return this._calculated_weekly_time_spent; }

  getCreditsAsNumber(): number {
    return this._credits.value;
  }
}
