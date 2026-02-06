import { createUser, findByEmail } from '../models/userModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const register = async ({ email, password, fullName }) => {
  const existing = await findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, fullName });
  const token = signToken(user);
  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = signToken(user);
  return {
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token
  };
};
