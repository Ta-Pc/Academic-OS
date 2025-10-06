import { TermNavigatorData } from '../../../types';

export class Term {
  private readonly _id: string;
  private readonly _parentTermId?: string | null;
  private readonly _academicYear: number;
  private readonly _termName: string;
  private readonly _startDate: string;
  private readonly _endDate: string;
  private readonly _gradePointAverageGoal?: number;
  private readonly _durationInWeeks: number;
  private readonly _notionalHoursPerCredit: number;
  private readonly _calculated_term_gpa?: number;
  private readonly _calculated_registered_credits?: number;
  private readonly _calculated_earned_credits?: number;
  private readonly _calculated_cumulative_weight_timeline?: Record<number, number>;
  private readonly _calculated_cumulative_points_secured?: number;
  private readonly _calculated_term_navigator_data?: TermNavigatorData;

  constructor(data: {
    id: string;
    parentTermId?: string | null;
    academicYear: number;
    termName: string;
    startDate: string;
    endDate: string;
    gradePointAverageGoal?: number;
    durationInWeeks: number;
    notionalHoursPerCredit: number;
    calculated_term_gpa?: number;
    calculated_registered_credits?: number;
    calculated_earned_credits?: number;
    calculated_cumulative_weight_timeline?: Record<number, number>;
    calculated_cumulative_points_secured?: number;
    calculated_term_navigator_data?: TermNavigatorData;
  }) {
    if (!data.id) throw new Error('id is required');
    if (data.academicYear == null) throw new Error('academicYear is required');
    if (!data.termName) throw new Error('termName is required');
    if (!data.startDate) throw new Error('startDate is required');
    if (!data.endDate) throw new Error('endDate is required');
    if (data.durationInWeeks == null) throw new Error('durationInWeeks is required');
    if (data.notionalHoursPerCredit == null) throw new Error('notionalHoursPerCredit is required');

    this._id = data.id;
    this._parentTermId = data.parentTermId;
    this._academicYear = data.academicYear;
    this._termName = data.termName;
    this._startDate = data.startDate;
    this._endDate = data.endDate;
    this._gradePointAverageGoal = data.gradePointAverageGoal;
    this._durationInWeeks = data.durationInWeeks;
    this._notionalHoursPerCredit = data.notionalHoursPerCredit;
    this._calculated_term_gpa = data.calculated_term_gpa;
    this._calculated_registered_credits = data.calculated_registered_credits;
    this._calculated_earned_credits = data.calculated_earned_credits;
    this._calculated_cumulative_weight_timeline = data.calculated_cumulative_weight_timeline;
    this._calculated_cumulative_points_secured = data.calculated_cumulative_points_secured;
    this._calculated_term_navigator_data = data.calculated_term_navigator_data;
  }

  get id(): string { return this._id; }
  get parentTermId(): string | null | undefined { return this._parentTermId; }
  get academicYear(): number { return this._academicYear; }
  get termName(): string { return this._termName; }
  get startDate(): string { return this._startDate; }
  get endDate(): string { return this._endDate; }
  get gradePointAverageGoal(): number | undefined { return this._gradePointAverageGoal; }
  get durationInWeeks(): number { return this._durationInWeeks; }
  get notionalHoursPerCredit(): number { return this._notionalHoursPerCredit; }
  get calculated_term_gpa(): number | undefined { return this._calculated_term_gpa; }
  get calculated_registered_credits(): number | undefined { return this._calculated_registered_credits; }
  get calculated_earned_credits(): number | undefined { return this._calculated_earned_credits; }
  get calculated_cumulative_weight_timeline(): Record<number, number> | undefined { return this._calculated_cumulative_weight_timeline; }
  get calculated_cumulative_points_secured(): number | undefined { return this._calculated_cumulative_points_secured; }
  get calculated_term_navigator_data(): TermNavigatorData | undefined { return this._calculated_term_navigator_data; }

  isRootTerm(): boolean {
    return this._parentTermId === null;
  }
}
