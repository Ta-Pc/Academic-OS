# TODO: Resolve TypeScript Errors in Repositories

## Step 1: Verify IRepository.ts and BaseRepository.ts
- [ ] Review IRepository.ts for any incorrect constraints on generic T
- [ ] Review BaseRepository.ts for correct usage of generic T in method signatures

## Step 2: Fix ModuleRepository.ts
- [x] Change import from `import { Module } from '../../types';` to `import { Module } from '../../core/domain/models/Module';`
- [x] Change class signature to `export class ModuleRepository extends BaseRepository<Module, string>`
- [x] Update `mapRowToEntity` return type to `Module`
- [x] Update `findAll` return type to `Promise<Module[]>`

## Step 3: Apply Pattern to Other Repositories
- [x] Fix TermRepository.ts: Change import to `import { Term } from '../../core/domain/models/Term';` and update class to extend `BaseRepository<Term, string>`
- [x] Fix DegreeRepository.ts: Change import to `import { Degree } from '../../core/domain/models/Degree';` and update class to extend `BaseRepository<Degree, string>`
- [x] Verify AssessmentRepository.ts: Already imports from correct domain model

## Step 4: Address AnalyticsEngine.ts
- [x] After repositories are fixed, check AnalyticsEngine.ts for remaining errors
- [x] Ensure all domain model usages are imported as classes, not old interfaces
- [x] Unwrap value objects (.value) when passing to functions expecting primitives

## Step 5: Test Compilation
- [x] Run TypeScript compilation to verify all errors are resolved
- [x] Run parity test to ensure functionality works
