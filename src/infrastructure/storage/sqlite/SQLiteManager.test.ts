import { describe, it, expect, beforeEach } from 'vitest';
import { SQLiteManager } from './SQLiteManager';
import { TransactionManager } from './TransactionManager';

describe('SQLiteManager Singleton', () => {
  it('should return the same instance', () => {
    const instance1 = SQLiteManager.getInstance();
    const instance2 = SQLiteManager.getInstance();
    expect(instance1).toBe(instance2);
  });
});

describe('SQLiteManager Query Execution', () => {
  let sqliteManager: SQLiteManager;

  beforeEach(async () => {
    sqliteManager = SQLiteManager.getInstance();
    await sqliteManager.initialize();
    sqliteManager.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    sqliteManager.execute('INSERT INTO test (name) VALUES (?)', ['Alice']);
  });

  it('should execute a SELECT query successfully', () => {
    const results = sqliteManager.query('SELECT * FROM test WHERE name = ?', ['Alice']);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Alice');
  });
});

describe('TransactionManager runInTransaction', () => {
  let sqliteManager: SQLiteManager;
  let transactionManager: TransactionManager;

  beforeEach(async () => {
    sqliteManager = SQLiteManager.getInstance();
    await sqliteManager.initialize();
    sqliteManager.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
    transactionManager = new TransactionManager(sqliteManager);
  });

  it('should commit transaction on success', async () => {
    await transactionManager.runInTransaction(async () => {
      sqliteManager.execute('INSERT INTO users (name) VALUES (?)', ['Bob']);
    });

    const results = sqliteManager.query('SELECT * FROM users WHERE name = ?', ['Bob']);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Bob');
  });

  it('should rollback transaction on error', async () => {
    try {
      await transactionManager.runInTransaction(async () => {
        sqliteManager.execute('INSERT INTO users (name) VALUES (?)', ['Charlie']);
        throw new Error('Simulated error');
      });
    } catch (error) {
      // Expected error
    }

    const results = sqliteManager.query('SELECT * FROM users WHERE name = ?', ['Charlie']);
    expect(results.length).toBe(0);
  });
});
