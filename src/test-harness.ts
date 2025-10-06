import { AnalyticsEngine } from './core/analytics/AnalyticsEngine';
import { ModuleRepository } from './infrastructure/repositories/ModuleRepository';
import { TermRepository } from './infrastructure/repositories/TermRepository';
import { DegreeRepository } from './infrastructure/repositories/DegreeRepository';
import { AssessmentRepository } from './infrastructure/repositories/AssessmentRepository';
import { SQLiteManager } from './infrastructure/storage/sqlite/SQLiteManager';
import { CacheManager } from './infrastructure/storage/cache/CacheManager';

export async function runTests() {
  console.log('Starting test engine...');

  // Instantiate SQLiteManager and CacheManager
  const sqliteManager = SQLiteManager.getInstance();
  const cacheManager = CacheManager.getInstance();

  // Instantiate repositories with required dependencies
  const moduleRepo = new ModuleRepository(sqliteManager, cacheManager);
  const termRepo = new TermRepository(sqliteManager, cacheManager);
  const degreeRepo = new DegreeRepository(sqliteManager, cacheManager);
  const assessmentRepo = new AssessmentRepository(sqliteManager, cacheManager);

  // Load data from repositories
  const modules = await moduleRepo.findAll();
  const terms = await termRepo.findAll();
  const degrees = await degreeRepo.findAll();
  const assessments = await assessmentRepo.findAll();

  // Create instance of AnalyticsEngine
  const analyticsEngine = AnalyticsEngine.getInstance();

  // Load data into analytics engine
  analyticsEngine.loadData(modules, terms, degrees, assessments);

  // Run full calculation
  const result = analyticsEngine.calculateAll();

  console.log('Analytics calculation result:', JSON.stringify(result, null, 2));

  // TODO: Add parity tests comparing legacy analytics results with new engine results
  // This would involve calling legacy functions and comparing outputs

  console.log('Test engine completed.');
}
