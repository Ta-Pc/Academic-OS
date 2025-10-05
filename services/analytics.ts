import { Module, Assessment, AssessmentStatus, AcademicTerm, EffortCategory, AssessmentType, Degree, TermNavigatorData, WeeklyMetric } from '../types';
import { differenceInDays, differenceInCalendarWeeks, parseISO, startOfDay, addDays, format } from 'date-fns';

// This map defines the numerical "effort points" for each category.
// It's used for workload calculations like the Priority Score.
const EFFORT_MAP: Record<EffortCategory, number> = {
  'Quick Win': 3,
  'Standard': 8,
  'Deep Dive': 15,
  'Emergency Rescue': 20,
  'Group Project': 12,
};

const WEEKLY_CAPACITY_PLACEHOLDER = 40; // Represents 40 effort points per week.

/**
 * Calculates a priority score for an assessment to rank its urgency and importance.
 * Higher scores indicate a higher priority.
 *
 * The formula weighs:
 * - Assessment Weight (importance)
 * - Effort Required (complexity)
 * - Urgency (days until due date)
 *
 * @param assessment The assessment to score.
 * @param today The current date, used to calculate urgency.
 * @returns A numerical priority score.
 */
export function calculatePriorityScore(assessment: Assessment, today: Date): number {
    const weightScore = (assessment.weight || 0) * 10;
    const effortScore = EFFORT_MAP[assessment.effort] || EFFORT_MAP['Standard'];
    
    let urgencyScore = 0;
    if (assessment.dueDate && assessment.dueDate !== 'TBC') {
        const dueDate = parseISO(assessment.dueDate);
        const daysUntilDue = differenceInDays(dueDate, today);
        
        // Overdue items have maximum urgency.
        const effectiveDays = Math.max(0, daysUntilDue);
        
        // Urgency score increases exponentially as the due date approaches.
        urgencyScore = 50 / (effectiveDays + 1);
    }

    return weightScore + effortScore + urgencyScore;
}


/**
 * Calculates a suite of academic performance metrics for a given module based on its assessments.
 *
 * @param module The module for which to calculate metrics.
 * @param assessments An array of all assessments associated with that module.
 * @returns A partial Module object containing only the new calculated metric fields.
 */
export function calculateModuleMetrics(module: Module, assessments: Assessment[]): Partial<Module> {
    const today = startOfDay(new Date());

    const getStatus = (assessment: Assessment): AssessmentStatus => {
        if (assessment.result !== undefined && assessment.result !== null) {
            return 'Graded';
        }
        if (assessment.dueDate && assessment.dueDate !== 'TBC') {
            const dueDate = parseISO(assessment.dueDate);
            if (dueDate < today) {
                return 'Missed';
            }
        }
        return assessment.status || 'Upcoming';
    };

    const allAssessmentsWithStatus = assessments.map(a => ({...a, status: getStatus(a)}));
    const gradedAssessments = allAssessmentsWithStatus.filter(a => a.status === 'Graded' && a.result !== undefined);
    const ungradedAssessments = allAssessmentsWithStatus.filter(a => a.status !== 'Graded');
    const gradedSemesterWork = gradedAssessments.filter(a => a.assessmentType !== 'Exam');

    // 1. Points Accumulated Toward Final Grade (calculated_patfg)
    const calculated_patfg = gradedSemesterWork.reduce((acc, assessment) => {
        const contribution = (assessment.weight * assessment.result!) / 100;
        return acc + contribution;
    }, 0);

    // 2. Current Semester Grade (calculated_current_grade)
    const totalWeightOfGradedSemesterWork = gradedSemesterWork.reduce((acc, assessment) => acc + assessment.weight, 0);
    const calculated_current_grade = totalWeightOfGradedSemesterWork > 0
        ? (calculated_patfg / totalWeightOfGradedSemesterWork) * 100
        : undefined;

    // 3. Module Completion Progress (calculated_completion_progress)
    const calculated_completion_progress = gradedAssessments.reduce((acc, assessment) => acc + assessment.weight, 0);

    // 4. Final Grade (calculated_final_grade)
    let calculated_final_grade: number | undefined = undefined;
    if (assessments.length > 0 && ungradedAssessments.length === 0) {
        calculated_final_grade = gradedAssessments.reduce((acc, assessment) => {
             const contribution = (assessment.weight * assessment.result!) / 100;
             return acc + contribution;
        }, 0);
    }

    // 5. Projected Final Grade (calculated_projected_final_grade)
    let calculated_projected_final_grade: number | undefined = undefined;
    const totalPointsFromGraded = gradedAssessments.reduce((acc, a) => acc + (a.weight * a.result!) / 100, 0);
    const totalWeightOfUngraded = ungradedAssessments.reduce((acc, a) => acc + a.weight, 0);

    if (calculated_current_grade !== undefined) {
        const projectedPointsFromUngraded = (totalWeightOfUngraded / 100) * calculated_current_grade;
        calculated_projected_final_grade = totalPointsFromGraded + projectedPointsFromUngraded;
    } else if (gradedAssessments.length === 0 && assessments.length > 0) {
        calculated_projected_final_grade = undefined;
    } else {
        calculated_projected_final_grade = totalPointsFromGraded;
    }

    // 6. Maximum Achievable Final Grade (calculated_max_achievable_grade)
    const maxPointsFromUngraded = ungradedAssessments.reduce((acc, assessment) => acc + assessment.weight, 0);
    const calculated_max_achievable_grade = Math.min(100, totalPointsFromGraded + maxPointsFromUngraded);
    
    // --- V2 Dashboard Calculations ---

    // 7. Category Performance (calculated_category_performance)
    const categoryPerformance: Record<string, number> = {};
    const assessmentsByCategory = gradedAssessments.reduce((acc, assessment) => {
        const type = assessment.assessmentType;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(assessment);
        return acc;
    }, {} as Record<AssessmentType, Assessment[]>);

    for (const category in assessmentsByCategory) {
        const catAssessments = assessmentsByCategory[category as AssessmentType];
        const totalWeight = catAssessments.reduce((sum, a) => sum + a.weight, 0);
        if (totalWeight > 0) {
            const weightedSum = catAssessments.reduce((sum, a) => sum + (a.result! * a.weight), 0);
            categoryPerformance[category] = weightedSum / totalWeight;
        }
    }
    const calculated_category_performance = categoryPerformance;
    
    // 8. Late Count (calculated_late_count)
    const calculated_late_count = allAssessmentsWithStatus.filter(a => a.status === 'Missed').length;

    // 9. Upcoming Count (calculated_upcoming_count)
    const sevenDaysFromNow = addDays(today, 7);
    const calculated_upcoming_count = allAssessmentsWithStatus.filter(a => {
        if (a.status !== 'Upcoming' || !a.dueDate || a.dueDate === 'TBC') return false;
        const dueDate = parseISO(a.dueDate);
        return dueDate >= today && dueDate < sevenDaysFromNow;
    }).length;

    // 10. Weekly Time Spent (calculated_weekly_time_spent)
    // This metric requires Task and Pomodoro Log entities to function.
    // As these are not yet implemented, this value is currently hardcoded.
    // To implement fully:
    // 1. Filter tasks related to this module.
    // 2. Filter Pomodoro logs for those tasks within the current calendar week.
    // 3. Sum the duration of those logs.
    const calculated_weekly_time_spent = 0;


    return {
        // V1 metrics
        calculated_patfg,
        calculated_current_grade,
        calculated_completion_progress,
        calculated_final_grade,
        calculated_projected_final_grade,
        calculated_max_achievable_grade,
        // V2 metrics
        calculated_category_performance,
        calculated_late_count,
        calculated_upcoming_count,
        calculated_weekly_time_spent,
    };
}

/**
 * The main data aggregation engine for the Term Navigator feature.
 * It processes a term's data and aggregates it into a week-by-week structure,
 * along with calculating top-level metrics for the term.
 *
 * @param term The academic term to analyze.
 * @param assessmentsInTerm All assessments belonging to modules within that term.
 * @param today The current date.
 * @returns A TermNavigatorData object containing weekly breakdowns and key term metrics.
 */
export function calculateTermNavigatorData(term: AcademicTerm, assessmentsInTerm: Assessment[], today: Date): TermNavigatorData {
    const termStartDate = parseISO(term.startDate);
    const termEndDate = parseISO(term.endDate);

    // --- 1. Calculate Top-Level Metrics ---
    const upcomingAssessments = assessmentsInTerm.filter(a => {
        if (a.status !== 'Upcoming' || !a.dueDate || a.dueDate === 'TBC') return false;
        try {
            return parseISO(a.dueDate) >= today;
        } catch { return false; }
    });

    const firstExamInTerm = upcomingAssessments
        .filter(a => a.assessmentType === 'Exam')
        .sort((a,b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())[0] || null;

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

    // --- 2. Calculate Week-by-Week Metrics ---
    const weeklyMetrics: WeeklyMetric[] = [];
    let cumulativeLockedWeight = 0;

    for (let i = 0; i < term.durationInWeeks; i++) {
        const weekNumber = i + 1;
        const weekStartDate = addDays(termStartDate, i * 7);
        // Ensure week end date does not exceed term end date
        const weekEndDate = new Date(Math.min(addDays(weekStartDate, 6).getTime(), termEndDate.getTime()));

        const assessmentsDueThisWeek = assessmentsInTerm.filter(a => {
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


/**
 * Calculates term-level aggregate metrics.
 * NOTE: This function assumes that the `modules` passed in have already had their individual metrics calculated.
 *
 * @param term The academic term to analyze.
 * @param modules The list of modules within that term (with calculated fields already populated).
 * @param allAssessments A list of all assessments in the system, to be filtered for this term.
 * @returns A partial AcademicTerm object containing only the new calculated metric fields.
 */
export function calculateTermMetrics(term: AcademicTerm, modules: Module[], allAssessments: Assessment[]): Partial<AcademicTerm> {
    const today = startOfDay(new Date());
    const moduleCodesInTerm = new Set(modules.map(m => m.moduleCode));
    const assessmentsInTerm = allAssessments.filter(a => moduleCodesInTerm.has(a.moduleCode));

    // 1. Cumulative Points Secured (calculated_cumulative_points_secured)
    // The sum of all points accumulated toward the final grade across all modules in the term.
    const calculated_cumulative_points_secured = modules.reduce((sum, module) => {
        return sum + (module.calculated_patfg || 0);
    }, 0);


    // 2. Cumulative Weight Timeline (calculated_cumulative_weight_timeline)
    // A week-by-week breakdown of the cumulative assessment weight due in this term.
    const weeklyWeights: Record<number, number> = {};
    const termStartDate = parseISO(term.startDate);

    for (const assessment of assessmentsInTerm) {
        if (assessment.dueDate && assessment.dueDate !== 'TBC') {
            const dueDate = parseISO(assessment.dueDate);
            // Ensure the assessment is within the term dates for timeline purposes
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
    const calculated_cumulative_weight_timeline = timeline;

    // 3. NEW: Term Navigator Data Engine
    const calculated_term_navigator_data = calculateTermNavigatorData(term, assessmentsInTerm, today);

    return {
        calculated_cumulative_points_secured,
        calculated_cumulative_weight_timeline,
        calculated_term_navigator_data,
    };
}

/**
 * Calculates degree-level aggregate metrics.
 * NOTE: This assumes that modules and terms have already had their metrics calculated.
 *
 * @param degree The degree to analyze.
 * @param allModules A list of all modules in the system.
 * @param allTerms A list of all academic terms for the degree.
 * @returns A partial Degree object containing only the new calculated metric fields.
 */
export function calculateDegreeMetrics(degree: Degree, allModules: Module[], allTerms: AcademicTerm[]): Partial<Degree> {
    // 1. Total Registered Credits
    const calculated_total_registered_credits = allModules.reduce((sum, module) => sum + module.credits, 0);

    // 2. Total Earned Credits
    const calculated_total_earned_credits = allModules
        .filter(m => m.status === 'Completed')
        .reduce((sum, module) => sum + module.credits, 0);

    // 3. Degree Progress Percent
    const calculated_degree_progress_percent = degree.totalCreditsToGraduate > 0
        ? (calculated_total_earned_credits / degree.totalCreditsToGraduate) * 100
        : 0;

    // 4. Credits per Year
    const calculated_credits_per_year: Record<number, number> = {};
    allTerms.forEach(term => {
        const year = term.academicYear;
        const creditsInTerm = allModules
            .filter(m => m.anchorTermId === term.id)
            .reduce((sum, m) => sum + m.credits, 0);
        
        calculated_credits_per_year[year] = (calculated_credits_per_year[year] || 0) + creditsInTerm;
    });

    // 5. Credits per Term
    const calculated_credits_per_term: Record<string, number> = {};
     allModules.forEach(module => {
        const termIdentifier = `${module.anchorTermId}`; // Could be more descriptive if needed
        calculated_credits_per_term[termIdentifier] = (calculated_credits_per_term[termIdentifier] || 0) + module.credits;
    });

    // 6. Overall GPA
    const modulesWithFinalGrade = allModules.filter(m => m.calculated_final_grade !== undefined && m.calculated_final_grade !== null);
    const totalWeightedGradePoints = modulesWithFinalGrade.reduce((sum, m) => sum + (m.calculated_final_grade! * m.credits), 0);
    const totalCreditsWithGrade = modulesWithFinalGrade.reduce((sum, m) => sum + m.credits, 0);
    const calculated_overall_gpa = totalCreditsWithGrade > 0
        ? totalWeightedGradePoints / totalCreditsWithGrade
        : undefined;

    return {
        calculated_total_registered_credits,
        calculated_total_earned_credits,
        calculated_degree_progress_percent,
        calculated_credits_per_year,
        calculated_credits_per_term,
        calculated_overall_gpa,
    };
}