import { BaseRepository } from './base/BaseRepository';
import { Assessment } from '../../core/domain/models/Assessment';
import { AssessmentMapper } from '../mappers/AssessmentMapper';
import { SQLiteManager } from '../storage/sqlite/SQLiteManager';
import { CacheManager } from '../storage/cache/CacheManager';

export class AssessmentRepository extends BaseRepository<Assessment, string> {
  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager) {
    super(sqliteManager, cacheManager, 'Assessment');
  }

  protected mapRowToEntity(row: any): Assessment {
    return AssessmentMapper.toDomain(row);
  }

  protected mapEntityToRow(entity: Assessment): any {
    throw new Error('Write operations are not supported in read-only repository');
  }

  public async findByModuleCode(moduleCode: string | { value: string }): Promise<Assessment[]> {
    const code = typeof moduleCode === 'string' ? moduleCode : moduleCode.value;
    const rows = this.sqliteManager.query('SELECT * FROM Assessment WHERE moduleCode = ?', [code]);
    return rows.map(row => this.mapRowToEntity(row));
  }
}
