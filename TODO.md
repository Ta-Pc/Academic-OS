# TODO List for Phase 6: Read-Only Entity Repositories and Data Mappers

- [x] Create src/infrastructure/mappers/ directory
- [x] Implement ModuleMapper.ts with toDomain method handling join rows
- [x] Implement TermMapper.ts (AcademicTerm) with toDomain
- [x] Implement DegreeMapper.ts with toDomain
- [x] Implement AssessmentMapper.ts with toDomain
- [x] Create src/infrastructure/repositories/ModuleRepository.ts extending BaseRepository<Module, string>, with custom findByTermId
- [x] Create TermRepository.ts with findRootTerms
- [x] Create DegreeRepository.ts (basic read-only)
- [x] Create AssessmentRepository.ts with findByModuleId
- [x] Create a temporary test function/script to instantiate repositories and log full dataset
