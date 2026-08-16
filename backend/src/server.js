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

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start();
