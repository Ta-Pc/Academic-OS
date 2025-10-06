import { BaseRepository } from './base/BaseRepository';
import { Term } from '../../core/domain/models/Term';
import { TermMapper } from '../mappers/TermMapper';
import { SQLiteManager } from '../storage/sqlite/SQLiteManager';
import { CacheManager } from '../storage/cache/CacheManager';

export class TermRepository extends BaseRepository<Term, string> {
  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager) {
    super(sqliteManager, cacheManager, 'AcademicTerm');
  }

  protected mapRowToEntity(row: any): Term {
    return TermMapper.toDomain(row);
  }

  protected mapEntityToRow(entity: Term): any {
    throw new Error('Write operations are not supported in read-only repository');
  }

  public async findRootTerms(): Promise<Term[]> {
    const rows = this.sqliteManager.query('SELECT * FROM AcademicTerm WHERE parentTermId IS NULL');
    return rows.map(row => this.mapRowToEntity(row));
  }
}
