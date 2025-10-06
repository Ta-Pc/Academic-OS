import { IRepository, TransactionContext } from './IRepository';
import { SQLiteManager } from '../../storage/sqlite/SQLiteManager';
import { CacheManager } from '../../storage/cache/CacheManager';
import { LRUCache } from '../../storage/cache/LRUCache';

export abstract class BaseRepository<T extends { id?: ID }, ID> implements IRepository<T, ID> {
  protected sqliteManager: SQLiteManager;
  protected cacheManager: CacheManager;
  protected tableName: string;
  protected cache: LRUCache<T>;

  constructor(sqliteManager: SQLiteManager, cacheManager: CacheManager, tableName: string) {
    this.sqliteManager = sqliteManager;
    this.cacheManager = cacheManager;
    this.tableName = tableName;
    this.cache = this.cacheManager.getCache<T>(tableName);
  }

  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: T): any;

  public async findById(id: ID): Promise<T | null> {
    const cacheKey = String(id);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = this.sqliteManager.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return null;
    }

    const entity = this.mapRowToEntity(rows[0]);
    this.cache.set(cacheKey, entity);
    return entity;
  }

  public async findAll(): Promise<T[]> {
    const rows = this.sqliteManager.query(`SELECT * FROM ${this.tableName}`);
    return rows.map(row => this.mapRowToEntity(row));
  }

  public async save(entity: T, tx?: TransactionContext): Promise<T> {
    const row = this.mapEntityToRow(entity);
    const isNew = !entity.id;

    const work = (db: TransactionContext) => {
      if (isNew) {
        const columns = Object.keys(row).join(', ');
        const placeholders = Object.keys(row).map(() => '?').join(', ');
        const values = Object.values(row);
        db.execute(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`, values);
        const idResult = db.query('SELECT last_insert_rowid() as id');
        (entity as any).id = idResult[0].id;
      } else {
        const setClause = Object.keys(row).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(row), entity.id];
        db.execute(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, values);
      }
      this.cache.delete(String(entity.id));
      return entity;
    };

    if (tx) {
      return work(tx);
    } else {
      this.sqliteManager.beginTransaction();
      try {
        const result = work(this.sqliteManager);
        this.sqliteManager.commit();
        return result;
      } catch (error) {
        this.sqliteManager.rollback();
        throw error;
      }
    }
  }

  public async delete(id: ID, tx?: TransactionContext): Promise<void> {
    const work = (db: TransactionContext) => {
      db.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      this.cache.delete(String(id));
    };

    if (tx) {
      work(tx);
    } else {
      this.sqliteManager.beginTransaction();
      try {
        work(this.sqliteManager);
        this.sqliteManager.commit();
      } catch (error) {
        this.sqliteManager.rollback();
        throw error;
      }
    }
  }

  public async exists(id: ID): Promise<boolean> {
    const rows = this.sqliteManager.query(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`, [id]);
    return rows.length > 0;
  }
}
