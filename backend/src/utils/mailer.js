import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export const sendMail = async ({ to, subject, text, html }) => {
  if (!env.smtpHost) {
    throw new Error('SMTP not configured');
  }
  return transporter.sendMail({
    from: env.smtpFrom,
    envelope: { from: env.smtpEnvelopeFrom || env.smtpFrom, to },
    to,
    subject,
    text,
    html
  });
};
