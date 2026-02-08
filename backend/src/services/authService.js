import { OAuth2Client } from 'google-auth-library';
import { createUser, findByEmail, findByGoogleId } from '../models/userModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

export const register = async ({ email, password, fullName, baseCurrency = 'INR' }) => {
  const existing = await findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, fullName, baseCurrency });
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
  if (user.provider !== 'local') {
    const err = new Error('Please sign in with Google for this account');
    err.status = 400;
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

export const googleLogin = async ({ idToken, baseCurrency = 'INR' }) => {
  if (!googleClient) {
    const err = new Error('Google login not configured');
    err.status = 500;
    throw err;
  }
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = payload.email;
  const fullName = payload.name || email;

  let user = await findByGoogleId(googleId);
  if (!user) {
    const existingEmail = await findByEmail(email);
    if (existingEmail && existingEmail.provider === 'local') {
      const err = new Error('Email already registered. Sign in with email/password.');
      err.status = 400;
      throw err;
    }
    user = await createUser({
      email,
      passwordHash: null,
      fullName,
      provider: 'google',
      googleId,
      baseCurrency
    });
  }

  const token = signToken(user);
  return {
    user: { id: user.id, email: user.email, full_name: user.full_name, base_currency: user.base_currency, provider: user.provider },
    token
  };
};
