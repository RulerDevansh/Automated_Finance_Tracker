import dotenv from 'dotenv';

dotenv.config();

const normalizeOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const renderOrigin = process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '') : '';
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://financetrackeraipowered.vercel.app',
  'https://frontend-mxckxwz1r-devanshs-projects-abc2cd26.vercel.app',
  'https://www.devansh2004.tech',
  'https://devansh2004.tech',
  renderOrigin
].filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  corsOrigins: [...new Set([
    ...normalizeOrigins(process.env.CORS_ORIGINS),
    ...normalizeOrigins(process.env.CORS_ORIGIN),
    ...normalizeOrigins(process.env.FRONTEND_URL),
    ...defaultOrigins
  ])],
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleApiKey: process.env.GOOGLE_API_KEY,
  smtpFrom: process.env.SMTP_FROM,
  smtpEnvelopeFrom: process.env.SMTP_ENVELOPE_FROM,
  brevoApiKey: process.env.BREVO_API_KEY,
  baseUrl: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'
};
