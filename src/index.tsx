
import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import App from './App';
import { MigrationRunner } from './infrastructure/storage/sqlite/migrations/MigrationRunner';
import { SQLiteManager } from './infrastructure/storage/sqlite/SQLiteManager';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Run database migrations before starting the app
const initializeApp = async () => {
  try {
    // First initialize and load the database
    const sqliteManager = SQLiteManager.getInstance();
    await sqliteManager.initialize();
    console.log('[App] Database initialized successfully');

    // Then run migrations
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();
    console.log('[App] Database migrations completed successfully');
  } catch (error) {
    console.error('[App] Failed to initialize database or run migrations:', error);
    // Continue with app startup even if migrations fail
    // This allows the app to potentially recover or show an error state
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

initializeApp();
