# TODO List for BaseRepository Unit Tests

- [x] Create `BaseRepository.test.ts` file with TestEntity interface and TestEntityRepository class
- [x] Implement `beforeEach` setup: initialize SQLiteManager, create/reset test table, clear caches, instantiate repository
- [x] Implement Verification 1: Test `findById` returns entity when exists and null when not
- [x] Implement Verification 2: Test `save` inserts new entity and updates existing one
- [x] Implement Verification 3: Test `delete` successfully removes an entity
- [x] Implement Verification 4: Test `EntityNotFoundError` is thrown when appropriate (via `getById`)
- [x] Run the tests using `npm run test` to ensure all pass
