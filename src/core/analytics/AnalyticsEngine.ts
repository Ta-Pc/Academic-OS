import { DependencyGraph } from './DependencyGraph';
import { MemoizationCache } from './memoization/MemoizationCache';
import { ModuleCalculator } from './calculators/ModuleCalculator';
import { TermCalculator } from './calculators/TermCalculator';
import { DegreeCalculator } from './calculators/DegreeCalculator';
import { Module } from '../../core/domain/models/Module';
import { Assessment } from '../../core/domain/models/Assessment';
import { Term } from '../../core/domain/models/Term';
import { Degree } from '../../core/domain/models/Degree';

export interface CalculationResult {
  modules: Record<string, any>;
  terms: Record<string, any>;
  degrees: Record<string, any>;
}

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private graph: DependencyGraph;
  private cache: MemoizationCache;
  private modules: Module[] = [];
  private terms: Term[] = [];
  private degrees: Degree[] = [];
  private assessments: Assessment[] = [];
  private moduleResults: Record<string, any> = {};
  private termResults: Record<string, any> = {};
  private degreeResults: Record<string, any> = {};

  private constructor() {
    this.graph = new DependencyGraph();
    this.cache = new MemoizationCache();
    this.setupGraph();
  }

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  private setupGraph(): void {
    // Define the calculation hierarchy
    this.graph.addNode('assessment', []);
    this.graph.addNode('module', ['assessment']);
    this.graph.addNode('term', ['module']);
    this.graph.addNode('degree', ['term']);
  }

  loadData(modules: Module[], terms: Term[], degrees: Degree[], assessments: Assessment[]): void {
    this.modules = modules;
    this.terms = terms;
    this.degrees = degrees;
    this.assessments = assessments;
  }

  async recalculate(entity: Module | Assessment | Term | Degree, changedFields: string[]): Promise<CalculationResult> {
    // Determine the base node affected
    let baseNode: string;
    if (entity instanceof Assessment) {
      baseNode = 'assessment';
    } else if (entity instanceof Module) {
      baseNode = 'module';
    } else if (entity instanceof Term) {
      baseNode = 'term';
    } else {
      baseNode = 'degree';
    }

    // Invalidate cache for affected
    this.cache.invalidate(baseNode + '.');

    // Get dependents in order
    const dependents = this.graph.getDependents(baseNode);

    // Recalculate each dependent
    for (const dep of dependents) {
      if (dep === 'module') {
        this.recalculateModules();
      } else if (dep === 'term') {
        this.recalculateTerms();
      } else if (dep === 'degree') {
        this.recalculateDegrees();
      }
    }

    return {
      modules: this.moduleResults,
      terms: this.termResults,
      degrees: this.degreeResults,
    };
  }

  calculateAll(): CalculationResult {
    this.recalculateModules();
    this.recalculateTerms();
    this.recalculateDegrees();

    return {
      modules: this.moduleResults,
      terms: this.termResults,
      degrees: this.degreeResults,
    };
  }

  private recalculateModules(): void {
    this.moduleResults = {};
    for (const module of this.modules) {
      const moduleAssessments = this.assessments.filter(a => a.moduleCode.value === module.moduleCode.value);
      const cacheKey = `module.${module.offeringId}`;

      let metrics = this.cache.get(cacheKey);
      if (!metrics) {
        metrics = {
          calculated_current_grade: ModuleCalculator.calculateCurrentGrade(moduleAssessments),
          calculated_patfg: ModuleCalculator.calculatePATFG(moduleAssessments),
          calculated_final_grade: ModuleCalculator.calculateFinalGrade(moduleAssessments),
          calculated_completion_progress: ModuleCalculator.calculateCompletionProgress(moduleAssessments),
          calculated_projected_final_grade: ModuleCalculator.calculateProjectedFinalGrade(moduleAssessments),
          calculated_max_achievable_grade: ModuleCalculator.calculateMaxAchievableGrade(moduleAssessments),
          calculated_category_performance: ModuleCalculator.calculateCategoryPerformance(moduleAssessments),
          calculated_late_count: ModuleCalculator.calculateLateCount(moduleAssessments),
          calculated_upcoming_count: ModuleCalculator.calculateUpcomingCount(moduleAssessments),
          calculated_weekly_time_spent: ModuleCalculator.calculateWeeklyTimeSpent(),
        };
        this.cache.set(cacheKey, metrics);
      }

      this.moduleResults[module.offeringId] = metrics;
    }
  }

  private recalculateTerms(): void {
    this.termResults = {};
    for (const term of this.terms) {
      const termModules = this.modules.filter(m => m.anchorTermId === term.id);
      const termAssessments = this.assessments.filter(a =>
        termModules.some(m => m.moduleCode.value === a.moduleCode.value)
      );
      const cacheKey = `term.${term.id}`;

      let metrics = this.cache.get(cacheKey);
      if (!metrics) {
        metrics = {
          calculated_term_gpa: TermCalculator.calculateTermGPA(termModules),
          calculated_registered_credits: TermCalculator.calculateRegisteredCredits(termModules),
          calculated_earned_credits: TermCalculator.calculateEarnedCredits(termModules),
          calculated_cumulative_points_secured: TermCalculator.calculateCumulativePointsSecured(termModules),
          calculated_cumulative_weight_timeline: TermCalculator.calculateCumulativeWeightTimeline(term, termAssessments),
          calculated_term_navigator_data: TermCalculator.calculateTermNavigatorData(term, termAssessments),
        };
        this.cache.set(cacheKey, metrics);
      }

      this.termResults[term.id] = metrics;
    }
  }

  private recalculateDegrees(): void {
    this.degreeResults = {};
    for (const degree of this.degrees) {
      const degreeModules = this.modules.filter(m =>
        this.terms.some(t => t.id === m.anchorTermId && degree.terms.some(dt => dt.id === t.id))
      );
      const cacheKey = `degree.${degree.id}`;

      let metrics = this.cache.get(cacheKey);
      if (!metrics) {
        const totalRegisteredCredits = DegreeCalculator.calculateTotalRegisteredCredits(degreeModules);
        const totalEarnedCredits = DegreeCalculator.calculateTotalEarnedCredits(degreeModules);
        metrics = {
          calculated_total_registered_credits: totalRegisteredCredits,
          calculated_total_earned_credits: totalEarnedCredits,
          calculated_degree_progress_percent: DegreeCalculator.calculateDegreeProgressPercent(totalEarnedCredits, degree.totalCreditsToGraduate),
          calculated_credits_per_year: DegreeCalculator.calculateCreditsPerYear(degreeModules),
          calculated_credits_per_term: DegreeCalculator.calculateCreditsPerTerm(degreeModules),
          calculated_overall_gpa: DegreeCalculator.calculateOverallGPA(degreeModules),
        };
        this.cache.set(cacheKey, metrics);
      }

      this.degreeResults[degree.id] = metrics;
    }
  }
}
