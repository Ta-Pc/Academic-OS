import { BaseRepository } from './base/BaseRepository';
import { Degree } from '../../types';
import { DegreeMapper } from '../mappers/DegreeMapper';
import { SQLiteManager } from '../storage/sqlite/SQLiteManager';
import { CacheManager } from '../storage/cache/CacheManager';

export class DegreeRepository extends BaseRepository<Degree, string> {
  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager) {
    super(sqliteManager, cacheManager, 'Degree');
  }

  protected mapRowToEntity(row: any): Degree {
    return DegreeMapper.toDomain(row);
  }

  protected mapEntityToRow(entity: Degree): any {
    throw new Error('Write operations are not supported in read-only repository');
  }
}
