import { BaseRepository } from './base/BaseRepository';
import { Module } from '../../core/domain/models/Module';
import { ModuleMapper } from '../mappers/ModuleMapper';
import { SQLiteManager } from '../storage/sqlite/SQLiteManager';
import { CacheManager } from '../storage/cache/CacheManager';

export class ModuleRepository extends BaseRepository<Module, string> {
  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager) {
    super(sqliteManager, cacheManager, 'ModuleOffering');
  }

  protected mapRowToEntity(row: any): Module {
    return ModuleMapper.toDomain(row);
  }

  protected mapEntityToRow(entity: Module): any {
    throw new Error('Write operations are not supported in read-only repository');
  }

  public async findByTermId(termId: string): Promise<Module[]> {
    const query = `
      SELECT
        m.id as moduleId,
        m.moduleCode,
        m.moduleName,
        m.credits,
        m.moduleType,
        m.minFinalGrade,
        m.minExamEntrance,
        m.minExamGrade,
        m.targetFinalGrade,
        m.notes,
        m.prerequisites,
        mo.id as offeringId,
        mo.anchorTermId,
        mo.startDate,
        mo.endDate,
        mo.status
      FROM Module m
      JOIN ModuleOffering mo ON m.id = mo.moduleId
      WHERE mo.anchorTermId = ?
    `;
    const rows = this.sqliteManager.query(query, [termId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  public async findAll(): Promise<Module[]> {
    const query = `
      SELECT 
        m.id as moduleId, 
        m.moduleCode, 
        m.moduleName, 
        m.credits,
        m.moduleType,
        m.minFinalGrade,
        m.minExamEntrance,
        m.minExamGrade,
        m.targetFinalGrade,
        m.notes,
        m.prerequisites,
        mo.id as offeringId,
        mo.anchorTermId,
        mo.startDate,
        mo.endDate,
        mo.status
      FROM Module m
      JOIN ModuleOffering mo ON m.id = mo.moduleId
    `;
    const rows = this.sqliteManager.query(query);
    return rows.map(row => this.mapRowToEntity(row));
  }
}
