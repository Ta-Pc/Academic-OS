import { AssessmentType, AssessmentStatus, EffortCategory } from '../../../types';
import { GradePercentage } from '../value-objects/GradePercentage';
import { ModuleCode } from '../value-objects/ModuleCode';

export class Assessment {
  private readonly _id: string;
  private readonly _moduleCode: ModuleCode;
  private readonly _assessmentName: string;
  private readonly _assessmentType: AssessmentType;
  private readonly _weight: number;
  private readonly _dueDate: string;
  private readonly _status: AssessmentStatus;
  private readonly _result?: GradePercentage;
  private readonly _effort: EffortCategory;
  private readonly _calculated_priority_score?: number;

  constructor(data: {
    id: string;
    moduleCode: string;
    assessmentName: string;
    assessmentType: AssessmentType;
    weight: number;
    dueDate: string;
    status: AssessmentStatus;
    result?: number;
    effort: EffortCategory;
    calculated_priority_score?: number;
  }) {
    if (!data.id) throw new Error('id is required');
    if (!data.assessmentName) throw new Error('assessmentName is required');
    if (data.weight == null) throw new Error('weight is required');
    if (!data.dueDate) throw new Error('dueDate is required');

    this._id = data.id;
    this._moduleCode = new ModuleCode(data.moduleCode);
    this._assessmentName = data.assessmentName;
    this._assessmentType = data.assessmentType;
    this._weight = data.weight;
    this._dueDate = data.dueDate;
    this._status = data.status;
    this._result = data.result != null ? new GradePercentage(data.result) : undefined;
    this._effort = data.effort;
    this._calculated_priority_score = data.calculated_priority_score;
  }

  get id(): string { return this._id; }
  get moduleCode(): ModuleCode { return this._moduleCode; }
  get assessmentName(): string { return this._assessmentName; }
  get assessmentType(): AssessmentType { return this._assessmentType; }
  get weight(): number { return this._weight; }
  get dueDate(): string { return this._dueDate; }
  get status(): AssessmentStatus { return this._status; }
  get result(): GradePercentage | undefined { return this._result; }
  get effort(): EffortCategory { return this._effort; }
  get calculated_priority_score(): number | undefined { return this._calculated_priority_score; }
}
