export interface TransactionContext {
  query(sql: string, params?: any[]): any[];
  execute(sql: string, params?: any[]): void;
}

export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T, tx?: TransactionContext): Promise<T>;
  delete(id: ID, tx?: TransactionContext): Promise<void>;
  exists(id: ID): Promise<boolean>;
}
