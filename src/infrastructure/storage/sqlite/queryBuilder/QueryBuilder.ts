type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

interface QueryBuilderInterface {
  select(columns: string[]): this;
  from(table: string): this;
  where(condition: string, params?: any[]): this;
  insertInto(table: string, columns: string[]): this;
  values(values: any[]): this;
  update(table: string): this;
  set(values: Record<string, any>): this;
  deleteFrom(table: string): this;
  build(): { sql: string; params: any[] };
}

export class QueryBuilder implements QueryBuilderInterface {
  private queryType: QueryType | null = null;
  private table: string | null = null;
  private columns: string[] = [];
  private whereClause: string | null = null;
  private whereParams: any[] = [];
  private insertValues: any[] = [];
  private updateValues: Record<string, any> = {};

  select(columns: string[]): this {
    this.queryType = 'SELECT';
    this.columns = columns;
    return this;
  }

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string, params: any[] = []): this {
    this.whereClause = condition;
    this.whereParams = params;
    return this;
  }

  insertInto(table: string, columns: string[]): this {
    this.queryType = 'INSERT';
    this.table = table;
    this.columns = columns;
    return this;
  }

  values(values: any[]): this {
    this.insertValues = values;
    return this;
  }

  update(table: string): this {
    this.queryType = 'UPDATE';
    this.table = table;
    return this;
  }

  set(values: Record<string, any>): this {
    this.updateValues = values;
    return this;
  }

  deleteFrom(table: string): this {
    this.queryType = 'DELETE';
    this.table = table;
    return this;
  }

  build(): { sql: string; params: any[] } {
    if (!this.queryType || !this.table) {
      throw new Error('Query type and table must be specified');
    }

    let sql = '';
    let params: any[] = [];

    switch (this.queryType) {
      case 'SELECT':
        const cols = this.columns.length > 0 ? this.columns.join(', ') : '*';
        sql = `SELECT ${cols} FROM ${this.table}`;
        if (this.whereClause) {
          sql += ` WHERE ${this.whereClause}`;
          params = this.whereParams;
        }
        break;

      case 'INSERT':
        if (this.columns.length === 0 || this.insertValues.length === 0) {
          throw new Error('Columns and values must be specified for INSERT');
        }
        const placeholders = this.columns.map(() => '?').join(', ');
        sql = `INSERT INTO ${this.table} (${this.columns.join(', ')}) VALUES (${placeholders})`;
        params = this.insertValues;
        break;

      case 'UPDATE':
        if (Object.keys(this.updateValues).length === 0) {
          throw new Error('Values must be specified for UPDATE');
        }
        const setClauses = Object.keys(this.updateValues).map(key => `${key} = ?`).join(', ');
        sql = `UPDATE ${this.table} SET ${setClauses}`;
        params = Object.values(this.updateValues);
        if (this.whereClause) {
          sql += ` WHERE ${this.whereClause}`;
          params = params.concat(this.whereParams);
        }
        break;

      case 'DELETE':
        sql = `DELETE FROM ${this.table}`;
        if (this.whereClause) {
          sql += ` WHERE ${this.whereClause}`;
          params = this.whereParams;
        }
        break;
    }

    return { sql, params };
  }
}
