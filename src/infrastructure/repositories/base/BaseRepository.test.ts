import { describe, it, expect, beforeEach } from 'vitest';
import { SQLiteManager } from '../../storage/sqlite/SQLiteManager';
import { CacheManager } from '../../storage/cache/CacheManager';
import { BaseRepository } from './BaseRepository';
import { EntityNotFoundError } from './RepositoryError';

interface TestEntity {
  id?: number;
  name: string;
}

class TestEntityRepository extends BaseRepository<TestEntity, number> {
  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager) {
    super(sqliteManager, cacheManager, 'test_entities');
  }

  protected mapRowToEntity(row: any): TestEntity {
    return {
      id: row.id,
      name: row.name,
    };
  }

  protected mapEntityToRow(entity: TestEntity): any {
    const row: any = { name: entity.name };
    if (entity.id !== undefined) {
      row.id = entity.id;
    }
    return row;
  }

  public async getById(id: number): Promise<TestEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new EntityNotFoundError(`Entity with id ${id} not found`);
    }
    return entity;
  }
}

describe('BaseRepository', () => {
  let sqliteManager: SQLiteManager;
  let cacheManager: CacheManager;
  let repository: TestEntityRepository;

  beforeEach(async () => {
    sqliteManager = SQLiteManager.getInstance();
    await sqliteManager.initialize();

    // Reset the test table
    sqliteManager.execute('DROP TABLE IF EXISTS test_entities');
    sqliteManager.execute(`
      CREATE TABLE test_entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    cacheManager = CacheManager.getInstance();
    cacheManager.clearCache('test_entities');

    repository = new TestEntityRepository(sqliteManager, cacheManager);
  });

  it('findById returns entity when it exists and null when it does not', async () => {
    // Insert a test entity directly
    sqliteManager.execute('INSERT INTO test_entities (name) VALUES (?)', ['Test Name']);
    const rows = sqliteManager.query('SELECT * FROM test_entities');
    const insertedId = rows[0].id;

    const found = await repository.findById(insertedId);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(insertedId);
    expect(found?.name).toBe('Test Name');

    const notFound = await repository.findById(9999);
    expect(notFound).toBeNull();
  });

  it('save can insert a new entity and update an existing one', async () => {
    // Insert new entity
    const newEntity: TestEntity = { name: 'New Entity' };
    const savedEntity = await repository.save(newEntity);
    expect(savedEntity.id).toBeDefined();
    expect(savedEntity.name).toBe('New Entity');

    // Update existing entity
    savedEntity.name = 'Updated Entity';
    const updatedEntity = await repository.save(savedEntity);
    expect(updatedEntity.id).toBe(savedEntity.id);
    expect(updatedEntity.name).toBe('Updated Entity');

    // Verify update in DB
    const dbEntity = await repository.findById(updatedEntity.id!);
    expect(dbEntity?.name).toBe('Updated Entity');
  });

  it('delete successfully removes an entity', async () => {
    // Insert new entity
    const newEntity: TestEntity = { name: 'To Be Deleted' };
    const savedEntity = await repository.save(newEntity);
    expect(savedEntity.id).toBeDefined();

    // Delete entity
    await repository.delete(savedEntity.id!);

    // Verify deletion
    const found = await repository.findById(savedEntity.id!);
    expect(found).toBeNull();
  });

  it('throws EntityNotFoundError when entity is not found', async () => {
    await expect(repository.getById(9999)).rejects.toThrow(EntityNotFoundError);
  });
});
