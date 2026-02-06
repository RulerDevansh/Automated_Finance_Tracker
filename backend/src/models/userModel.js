import { query } from '../config/db.js';

export const createUser = async ({ email, passwordHash, fullName }) => {
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, created_at`,
    [email.toLowerCase(), passwordHash, fullName]
  );
  return result.rows[0];
};

export const findByEmail = async (email) => {
  const result = await query(
    `SELECT id, email, password_hash, full_name, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await query(
    `SELECT id, email, full_name, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const updateUser = async ({ id, fullName, passwordHash }) => {
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

  if (!fields.length) return findById(id);

  const setFragments = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  values.push(id);

  const result = await query(
    `UPDATE users SET ${setFragments}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, email, full_name, created_at, updated_at`,
    values
  );
  return result.rows[0];
};
