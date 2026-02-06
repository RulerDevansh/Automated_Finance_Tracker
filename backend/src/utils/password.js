import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export const hashPassword = async (plain) => {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
};

export const verifyPassword = async (plain, hash) => bcrypt.compare(plain, hash);
