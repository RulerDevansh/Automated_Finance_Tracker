import { env } from './config/env.js';
import { pool } from './config/db.js';
import app from './app.js';

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection OK');
  } catch (err) {
    console.error('Database connection failed during startup:');
    console.error(err && err.stack ? err.stack : err);
    console.error('Continuing to start the HTTP server so Render can detect the port.');
  }
  // Log the DATABASE_URL used (mask password) for debugging in Render logs
  try {
    const dbUrl = env.databaseUrl || process.env.DATABASE_URL;
    if (dbUrl) {
      const masked = dbUrl.replace(/:(?:[^:@]+)@/, ':*****@');
      console.log('Using DATABASE_URL:', masked);
    } else {
      console.log('No DATABASE_URL environment variable set');
    }
  } catch (e) {
    // ignore logging errors
  }

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start();
