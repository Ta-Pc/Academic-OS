export enum SetupStep {
  AcademicInfo = 1,
  Confirmation,
  ManageCalendar,
  ImportCSV,
  SystemSettings,
  Building,
  Complete,
}

export enum InitPhase {
  IDLE,
  CHECKING_ENVIRONMENT,
  CHECKING_SETUP_STATUS,
  INITIALIZING_SQL,
  LOADING_DATABASE,
  CHECKING_DB_VERSION,
  HYDRATING_DATA,
  READY,
  FATAL_ERROR,
  SETUP_REQUIRED,
}

export interface InitializationState {
  phase: InitPhase;
  message: string;
  progress: number;
  error?: {
    title: string;
    description: string;
  };
}

export type DegreeStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Planned';
export type FilterMode = 'broad' | 'focused' | 'strict' | 'smart';
export type TermType = 'Year' | 'Semester' | 'Quarter';

// User-specific information
export interface AcademicInfo {
  name: string;
  surname: string;
  studentNumber: string;
  profilePicture: File | null;
  profilePictureUrl: string;
}

// New Degree entity
export interface Degree {
  id: string;
  degreeName: string;
  institutionName: string;
  specialization?: string;
  nqfLevel: number;
  duration: number; // Official Duration (Years)
  totalCreditsToGraduate: number;
  status: DegreeStatus;
  startDate: string; // YYYY-MM-DD
  expectedEndDate?: string; // YYYY-MM-DD
  terms: AcademicTerm[];

  // Calculated properties
  calculated_total_registered_credits?: number;
  calculated_credits_per_year?: Record<number, number>;
  calculated_credits_per_term?: Record<string, number>;
  calculated_total_earned_credits?: number;
  calculated_degree_progress_percent?: number;
  calculated_overall_gpa?: number;
}

export interface WeeklyMetric {
  weekNumber: number;
  dateRange: { start: string; end: string };
  lockedInWeight: number; // Cumulative
  dueWeight: number;
  overdueWeight: number;
  weeklyEffort: number;
  weeklyCapacity: number;
  effortVsCapacityRatio: number;
  assessmentsDue: Assessment[];
  dueCount: number;
  overdueCount: number;
}

export interface TermNavigatorData {
  firstExamInDays: number | null;
  firstExamDate: string | null;
  teachingDaysLeft: number;
  remainingWeightBeforeExams: number;
  weeklyMetrics: WeeklyMetric[];
  effortSpikes: { weekNumber: number; ratio: number }[];
}


// Updated AcademicTerm entity
export interface AcademicTerm {
  id: string; // TermID
  parentTermId?: string | null;
  academicYear: number;
  termName: string;
  startDate: string;
  endDate: string;
  gradePointAverageGoal?: number;
  durationInWeeks: number;
  notionalHoursPerCredit: number;

  // Calculated properties
  calculated_term_gpa?: number;
  calculated_registered_credits?: number;
  calculated_earned_credits?: number;
  calculated_cumulative_weight_timeline?: Record<number, number>;
  calculated_cumulative_points_secured?: number;
  calculated_term_navigator_data?: TermNavigatorData;
}

export type Language = 'en' | 'zu' | 'af' | 'xh' | 'st' | 'nso';
export type EffortCategory = 'Quick Win' | 'Standard' | 'Deep Dive' | 'Emergency Rescue' | 'Group Project';

export interface SystemSettings {
  theme: 'light' | 'dark' | 'system';
  language: Language;
  dueDateReminders: boolean;
  defaultEffort: EffortCategory;
  dailyEffortCutline?: number;
}

export type AssessmentType = 'Quiz' | 'Semester Test' | 'Assignment' | 'Homework' | 'Practical' | 'Exam' | 'Tutorial' | 'Class Test';
export type AssessmentStatus = 'Upcoming' | 'Overdue' | 'Submitted' | 'Graded' | 'Missed' | 'Pending Result';

export interface Assessment {
  id: string; // Unique ID composed of moduleCode, type, and name
  moduleCode: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  weight: number;
  dueDate: string; // Default 'TBC'
  status: AssessmentStatus; // Default 'Upcoming' or system-determined
  result?: number; // Default undefined
  effort: EffortCategory; // Default 'Standard'
  calculated_priority_score?: number;
}

export type ModuleType = 'Core' | 'Elective';
export type ModuleStatus = 'In Progress' | 'Completed' | 'Dropped' | 'Planned' | 'Archived';

// This is the combined "instance" object used throughout the app.
// It joins the Module Blueprint with its scheduled Offering.
export interface Module {
  offeringId: string; // Unique ID for this specific offering
  moduleId: string; // ID of the module blueprint
  moduleCode: string;
  moduleName: string;
  credits: number;
  moduleType: ModuleType;
  anchorTermId: string; // The "home" term for this offering
  startDate?: string;
  endDate?: string;
  status: ModuleStatus;
  minFinalGrade: number;
  minExamEntrance?: number;
  minExamGrade?: number;
  targetFinalGrade: number;
  notes?: string;
  prerequisites?: string[];

  // Calculated properties
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
}


// Represents the timeless "blueprint" of a module.
export interface ModuleBlueprint {
  id: string;
  moduleCode: string;
  moduleName: string;
  credits: number;
  moduleType: ModuleType;
  minFinalGrade: number;
  targetFinalGrade: number;
  minExamEntrance?: number;
  minExamGrade?: number;
  notes?: string;
  prerequisites?: string[];
}

// Represents a specific, scheduled instance of a module blueprint.
export interface ModuleOffering {
    id: string;
    moduleId: string;
    anchorTermId: string;
    startDate?: string;
    endDate?: string;
    status: ModuleStatus;
}


export interface FormData {
  academicInfo: AcademicInfo;
  degree: Degree;
  csvImported: boolean;
  importedAssessments: Assessment[];
  systemSettings: SystemSettings;
  modules: Module[]; // This will hold the combined Module objects
}

// --- Backup Schema ---

export interface AcademicOSBackup {
  schemaVersion: string;
  exportedAt: string;
  appVersion: string;
  data: BackupData;
}

export interface BackupData {
  degreeProfile: DegreeProfileData;
  applicationSettings: ApplicationSettingsData;
  academicTerms: AcademicTermData[];
  holidays: any[]; // Using any[] as these types are not defined in the app yet
  modules: ModuleData[];
  assessments: AssessmentData[];
  tasks: any[];
  pomodoroSessions: any[];
}

export interface DegreeProfileData {
  degreeName: string;
  specialization: string;
  institutionName: string;
  totalCreditsToGraduate: number;
}

export interface ApplicationSettingsData {
  theme: 'light' | 'dark' | 'system';
  language: Language;
  pomodoroFocusDuration: number;
  pomodoroBreakDuration: number;
}

export interface AcademicTermData {
  TermID: string;
  ParentTermID: string | null;
  TermName: string;
  AcademicYear: number;
  StartDate: string;
  EndDate: string;
  DurationInWeeks: number;
  NotionalHoursPerCredit: number;
}

export interface ModuleData {
  ModuleID: string;
  TermID: string;
  ModuleName: string;
  ModuleCode: string;
  Credits: number;
  Status: ModuleStatus;
  Prerequisites: string[];
  calculated_current_grade: number | null;
  [key: string]: any; // Allow other fields
}

export interface AssessmentData {
  AssessmentID: string;
  ModuleID: string;
  AssessmentName: string;
  AssessmentType: AssessmentType;
  DueDate: string;
  Weight: number;
  Result: number | null;
  [key: string]: any; // Allow other fields
}