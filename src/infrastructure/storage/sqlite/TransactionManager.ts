import { SQLiteManager } from './SQLiteManager';
import { DatabaseError } from '../../../shared/errors/DatabaseError';

export class TransactionManager {
  private sqliteManager: SQLiteManager;

  constructor(sqliteManager: SQLiteManager) {
    this.sqliteManager = sqliteManager;
  }

  public async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    this.sqliteManager.beginTransaction();

    try {
      const result = await work();
      this.sqliteManager.commit();
      return result;
    } catch (error) {
      this.sqliteManager.rollback();
      throw new DatabaseError('Transaction failed and was rolled back', error as Error);
    }
  }
}
