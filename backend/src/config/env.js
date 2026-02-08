import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  smtpEnvelopeFrom: process.env.SMTP_ENVELOPE_FROM,
  baseUrl: process.env.BASE_URL || 'http://localhost:4000'
};
