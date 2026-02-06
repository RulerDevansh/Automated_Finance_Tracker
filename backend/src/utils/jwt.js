import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
};
