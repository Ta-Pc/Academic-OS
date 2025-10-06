import { DegreeStatus } from '../../../types';
import { Term } from './Term';

export class Degree {
  private readonly _id: string;
  private readonly _degreeName: string;
  private readonly _institutionName: string;
  private readonly _specialization?: string;
  private readonly _nqfLevel: number;
  private readonly _duration: number;
  private readonly _totalCreditsToGraduate: number;
  private readonly _status: DegreeStatus;
  private readonly _startDate: string;
  private readonly _expectedEndDate?: string;
  private readonly _terms: Term[];
  private readonly _calculated_total_registered_credits?: number;
  private readonly _calculated_credits_per_year?: Record<number, number>;
  private readonly _calculated_credits_per_term?: Record<string, number>;
  private readonly _calculated_total_earned_credits?: number;
  private readonly _calculated_degree_progress_percent?: number;
  private readonly _calculated_overall_gpa?: number;

  constructor(data: {
    id: string;
    degreeName: string;
    institutionName: string;
    specialization?: string;
    nqfLevel: number;
    duration: number;
    totalCreditsToGraduate: number;
    status: DegreeStatus;
    startDate: string;
    expectedEndDate?: string;
    terms: Term[];
    calculated_total_registered_credits?: number;
    calculated_credits_per_year?: Record<number, number>;
    calculated_credits_per_term?: Record<string, number>;
    calculated_total_earned_credits?: number;
    calculated_degree_progress_percent?: number;
    calculated_overall_gpa?: number;
  }) {
    if (!data.id) throw new Error('id is required');
    if (!data.degreeName) throw new Error('degreeName is required');
    if (!data.institutionName) throw new Error('institutionName is required');
    if (data.nqfLevel == null) throw new Error('nqfLevel is required');
    if (data.duration == null) throw new Error('duration is required');
    if (data.totalCreditsToGraduate == null) throw new Error('totalCreditsToGraduate is required');
    if (!data.startDate) throw new Error('startDate is required');

    this._id = data.id;
    this._degreeName = data.degreeName;
    this._institutionName = data.institutionName;
    this._specialization = data.specialization;
    this._nqfLevel = data.nqfLevel;
    this._duration = data.duration;
    this._totalCreditsToGraduate = data.totalCreditsToGraduate;
    this._status = data.status;
    this._startDate = data.startDate;
    this._expectedEndDate = data.expectedEndDate;
    this._terms = data.terms;
    this._calculated_total_registered_credits = data.calculated_total_registered_credits;
    this._calculated_credits_per_year = data.calculated_credits_per_year;
    this._calculated_credits_per_term = data.calculated_credits_per_term;
    this._calculated_total_earned_credits = data.calculated_total_earned_credits;
    this._calculated_degree_progress_percent = data.calculated_degree_progress_percent;
    this._calculated_overall_gpa = data.calculated_overall_gpa;
  }

  get id(): string { return this._id; }
  get degreeName(): string { return this._degreeName; }
  get institutionName(): string { return this._institutionName; }
  get specialization(): string | undefined { return this._specialization; }
  get nqfLevel(): number { return this._nqfLevel; }
  get duration(): number { return this._duration; }
  get totalCreditsToGraduate(): number { return this._totalCreditsToGraduate; }
  get status(): DegreeStatus { return this._status; }
  get startDate(): string { return this._startDate; }
  get expectedEndDate(): string | undefined { return this._expectedEndDate; }
  get terms(): Term[] { return this._terms; }
  get calculated_total_registered_credits(): number | undefined { return this._calculated_total_registered_credits; }
  get calculated_credits_per_year(): Record<number, number> | undefined { return this._calculated_credits_per_year; }
  get calculated_credits_per_term(): Record<string, number> | undefined { return this._calculated_credits_per_term; }
  get calculated_total_earned_credits(): number | undefined { return this._calculated_total_earned_credits; }
  get calculated_degree_progress_percent(): number | undefined { return this._calculated_degree_progress_percent; }
  get calculated_overall_gpa(): number | undefined { return this._calculated_overall_gpa; }

  getDurationInYears(): number {
    return this._duration;
  }
}
