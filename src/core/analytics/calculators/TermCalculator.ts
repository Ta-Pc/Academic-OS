import { Term } from '../../domain/models/Term';
import { Assessment } from '../../domain/models/Assessment';
import { Module } from '../../domain/models/Module';
import { differenceInDays, differenceInCalendarWeeks, parseISO, startOfDay, addDays, format } from 'date-fns';

interface WeeklyMetric {
  weekNumber: number;
  dateRange: {
    start: string;
    end: string;
  };
  lockedInWeight: number;
  dueWeight: number;
  overdueWeight: number;
  weeklyEffort: number;
  weeklyCapacity: number;
  effortVsCapacityRatio: number;
  assessmentsDue: Assessment[];
  dueCount: number;
  overdueCount: number;
}

interface TermNavigatorData {
  firstExamInDays: number | null;
  firstExamDate: string | null;
  teachingDaysLeft: number;
  remainingWeightBeforeExams: number;
  weeklyMetrics: WeeklyMetric[];
  effortSpikes: { weekNumber: number; ratio: number }[];
}

const EFFORT_MAP: Record<string, number> = {
  'Quick Win': 3,
  'Standard': 8,
  'Deep Dive': 15,
  'Emergency Rescue': 20,
  'Group Project': 12,
};

const WEEKLY_CAPACITY_PLACEHOLDER = 40;

export class TermCalculator {
  /**
   * Calculates term GPA based on modules' final grades and credits.
   */
  static calculateTermGPA(modules: Module[]): number | undefined {
    const modulesWithFinalGrade = modules.filter(m => m.calculated_final_grade !== undefined);
    if (modulesWithFinalGrade.length === 0) return undefined;

    const totalWeightedGradePoints = modulesWithFinalGrade.reduce((sum, m) => sum + (m.calculated_final_grade! * m.credits.value), 0);
    const totalCredits = modulesWithFinalGrade.reduce((sum, m) => sum + m.credits.value, 0);

    return totalCredits > 0 ? totalWeightedGradePoints / totalCredits : undefined;
  }

  /**
   * Calculates registered credits for the term.
   */
  static calculateRegisteredCredits(modules: Module[]): number {
    return modules.reduce((sum, module) => sum + module.credits.value, 0);
  }

  /**
   * Calculates earned credits (completed modules).
   */
  static calculateEarnedCredits(modules: Module[]): number {
    return modules
      .filter(m => m.status === 'Completed')
      .reduce((sum, module) => sum + module.credits.value, 0);
  }

  /**
   * Calculates cumulative points secured (sum of PATFG across modules).
   */
  static calculateCumulativePointsSecured(modules: Module[]): number {
    return modules.reduce((sum, module) => sum + (module.calculated_patfg || 0), 0);
  }

  /**
   * Calculates cumulative weight timeline.
   */
  static calculateCumulativeWeightTimeline(term: Term, assessments: Assessment[]): Record<number, number> {
    const weeklyWeights: Record<number, number> = {};
    const termStartDate = parseISO(term.startDate);

    for (const assessment of assessments) {
      if (assessment.dueDate && assessment.dueDate !== 'TBC') {
        const dueDate = parseISO(assessment.dueDate);
        if (dueDate >= termStartDate && dueDate <= parseISO(term.endDate)) {
          const weekNumber = differenceInCalendarWeeks(dueDate, termStartDate) + 1;
          if (weekNumber > 0) {
            weeklyWeights[weekNumber] = (weeklyWeights[weekNumber] || 0) + assessment.weight;
          }
        }
      }
    }

    const timeline: Record<number, number> = {};
    let cumulativeWeight = 0;
    for (let i = 1; i <= term.durationInWeeks; i++) {
      if (weeklyWeights[i]) {
        cumulativeWeight += weeklyWeights[i];
      }
      timeline[i] = cumulativeWeight;
    }

    return timeline;
  }

  /**
   * Calculates term navigator data.
   */
  static calculateTermNavigatorData(term: Term, assessments: Assessment[]): TermNavigatorData {
    const today = startOfDay(new Date());
    const termStartDate = parseISO(term.startDate);
    const termEndDate = parseISO(term.endDate);

    const upcomingAssessments = assessments.filter(a => {
      if (a.status !== 'Upcoming' || !a.dueDate || a.dueDate === 'TBC') return false;
      try {
        return parseISO(a.dueDate) >= today;
      } catch { return false; }
    });

    const firstExamInTerm = upcomingAssessments
      .filter(a => a.assessmentType === 'Exam')
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())[0] || null;

    const firstExamInDays = firstExamInTerm ? differenceInDays(parseISO(firstExamInTerm.dueDate), today) : null;
    const firstExamDate = firstExamInTerm ? firstExamInTerm.dueDate : null;

    const teachingDaysLeft = Math.max(0, differenceInDays(termEndDate, today));

    let remainingWeightBeforeExams = 0;
    if (!firstExamInTerm) {
      remainingWeightBeforeExams = upcomingAssessments.reduce((sum, a) => sum + a.weight, 0);
    } else {
      const examDate = parseISO(firstExamInTerm.dueDate);
      remainingWeightBeforeExams = upcomingAssessments
        .filter(a => parseISO(a.dueDate) < examDate)
        .reduce((sum, a) => sum + a.weight, 0);
    }

    const weeklyMetrics: WeeklyMetric[] = [];
    let cumulativeLockedWeight = 0;

    for (let i = 0; i < term.durationInWeeks; i++) {
      const weekNumber = i + 1;
      const weekStartDate = addDays(termStartDate, i * 7);
      const weekEndDate = new Date(Math.min(addDays(weekStartDate, 6).getTime(), termEndDate.getTime()));

      const assessmentsDueThisWeek = assessments.filter(a => {
        if (!a.dueDate || a.dueDate === 'TBC') return false;
        try {
          const dueDate = parseISO(a.dueDate);
          return dueDate >= weekStartDate && dueDate <= weekEndDate;
        } catch { return false; }
      });

      const dueWeight = assessmentsDueThisWeek.reduce((sum, a) => sum + a.weight, 0);

      const overdueAssessmentsThisWeek = assessmentsDueThisWeek
        .filter(a => a.status === 'Overdue' || a.status === 'Missed');
      const overdueWeight = overdueAssessmentsThisWeek.reduce((sum, a) => sum + a.weight, 0);

      const weeklyEffort = assessmentsDueThisWeek.reduce((sum, a) => sum + (EFFORT_MAP[a.effort] || 0), 0);

      const gradedAssessmentsThisWeek = assessmentsDueThisWeek.filter(a => a.status === 'Graded');
      cumulativeLockedWeight += gradedAssessmentsThisWeek.reduce((sum, a) => sum + a.weight, 0);

      weeklyMetrics.push({
        weekNumber,
        dateRange: {
          start: format(weekStartDate, 'yyyy-MM-dd'),
          end: format(weekEndDate, 'yyyy-MM-dd')
        },
        lockedInWeight: cumulativeLockedWeight,
        dueWeight,
        overdueWeight,
        weeklyEffort,
        weeklyCapacity: WEEKLY_CAPACITY_PLACEHOLDER,
        effortVsCapacityRatio: weeklyEffort / WEEKLY_CAPACITY_PLACEHOLDER,
        assessmentsDue: assessmentsDueThisWeek,
        dueCount: assessmentsDueThisWeek.length,
        overdueCount: overdueAssessmentsThisWeek.length,
      });
    }

    const effortSpikes = weeklyMetrics
      .filter(w => w.effortVsCapacityRatio > 1 && parseISO(w.dateRange.start) >= today)
      .map(w => ({ weekNumber: w.weekNumber, ratio: w.effortVsCapacityRatio }));

    return {
      firstExamInDays,
      firstExamDate,
      teachingDaysLeft,
      remainingWeightBeforeExams,
      weeklyMetrics,
      effortSpikes,
    };
  }
}
