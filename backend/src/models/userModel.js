import { query } from '../config/db.js';

export const createUser = async ({ email, passwordHash, fullName, provider = 'local', googleId = null, baseCurrency = 'INR' }) => {
  const safePassword = passwordHash || '';
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, provider, google_id, base_currency)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, full_name, provider, google_id, base_currency, created_at`,
    [email.toLowerCase(), safePassword, fullName, provider, googleId, baseCurrency]
  );
  return result.rows[0];
};

export const findByEmail = async (email) => {
  const result = await query(
    `SELECT id, email, password_hash, full_name, provider, google_id, base_currency, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await query(
    `SELECT id, email, full_name, provider, google_id, base_currency, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const updateUser = async ({ id, fullName, passwordHash, baseCurrency }) => {
  const fields = [];
  const values = [];

  if (fullName) {
    fields.push('full_name');
    values.push(fullName);
  }
  if (passwordHash) {
    fields.push('password_hash');
    values.push(passwordHash);
  }
  if (baseCurrency) {
    fields.push('base_currency');
    values.push(baseCurrency);
  }

  if (!fields.length) return findById(id);

  const setFragments = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  values.push(id);

  const result = await query(
    `UPDATE users SET ${setFragments}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, email, full_name, provider, google_id, base_currency, created_at, updated_at`,
    values
  );
  return result.rows[0];
};

export const findByGoogleId = async (googleId) => {
  const result = await query(
    `SELECT id, email, password_hash, full_name, provider, google_id, base_currency, created_at
     FROM users WHERE google_id = $1`,
    [googleId]
  );
  return result.rows[0] || null;
};
