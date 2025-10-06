import { SQLiteManager } from './infrastructure/storage/sqlite/SQLiteManager';
import { CacheManager } from './infrastructure/storage/cache/CacheManager';
import { ModuleRepository } from './infrastructure/repositories/ModuleRepository';
import { TermRepository } from './infrastructure/repositories/TermRepository';
import { DegreeRepository } from './infrastructure/repositories/DegreeRepository';
import { AssessmentRepository } from './infrastructure/repositories/AssessmentRepository';
import { InitialMigration } from './infrastructure/storage/sqlite/migrations/001_initial';

// Temporary test function to instantiate repositories and log full dataset
export async function testRepositories() {
  console.log('Testing repositories...');

  const sqliteManager = SQLiteManager.getInstance();
  await sqliteManager.initialize();

  // Run initial migration to create tables
  const migration = new InitialMigration();
  await migration.up();

  const cacheManager = CacheManager.getInstance();

  const moduleRepo = new ModuleRepository(sqliteManager, cacheManager);
  const termRepo = new TermRepository(sqliteManager, cacheManager);
  const degreeRepo = new DegreeRepository(sqliteManager, cacheManager);
  const assessmentRepo = new AssessmentRepository(sqliteManager, cacheManager);

  // Test findAll for each
  console.log('Modules:', await moduleRepo.findAll());
  console.log('Terms:', await termRepo.findAll());
  console.log('Degrees:', await degreeRepo.findAll());
  console.log('Assessments:', await assessmentRepo.findAll());

  // Test custom methods
  console.log('Root Terms:', await termRepo.findRootTerms());

  // For modules, if there are terms, test findByTermId
  const terms = await termRepo.findAll();
  if (terms.length > 0) {
    console.log('Modules by Term:', await moduleRepo.findByTermId(terms[0].id));
  }

  // For assessments, if there are modules, test findByModuleCode
  const modules = await moduleRepo.findAll();
  if (modules.length > 0) {
    console.log('Assessments by Module:', await assessmentRepo.findByModuleCode(modules[0].moduleCode));
  }

  console.log('Repository testing complete.');
}
