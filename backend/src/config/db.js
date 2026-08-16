import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const isProductionDatabase = (connectionString) =>
  typeof connectionString === 'string' && connectionString.includes('render.com');

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ...(isProductionDatabase(env.databaseUrl) ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {}),
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
});

export const query = (text, params) => pool.query(text, params);
