import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  corsOrigins: (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173,https://financetrackeraipowered.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleApiKey: process.env.GOOGLE_API_KEY,
  smtpFrom: process.env.SMTP_FROM,
  smtpEnvelopeFrom: process.env.SMTP_ENVELOPE_FROM,
  brevoApiKey: process.env.BREVO_API_KEY,
  baseUrl: process.env.BASE_URL || 'http://localhost:4000'
};
