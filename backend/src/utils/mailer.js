import axios from 'axios';
import { env } from '../config/env.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const parseSender = (value) => {
  if (!value) return { email: null, name: null };
  const match = value.match(/^(.*)<(.+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, '') || undefined,
      email: match[2].trim()
    };
  }
  return { email: value.trim(), name: undefined };
};

export const sendMail = async ({ to, subject, text, html }) => {
  const apiKey = env.brevoApiKey;
  if (!apiKey) {
    throw new Error('Brevo API key not configured');
  }

  const sender = parseSender(env.smtpFrom || env.smtpEnvelopeFrom);
  if (!sender.email) {
    throw new Error('Sender email not configured');
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((email) => ({ email }));

  if (!recipients.length) {
    throw new Error('Recipient email required');
  }

  const payload = {
    sender,
    to: recipients,
    subject,
    textContent: text,
    htmlContent: html
  };

  if (env.smtpEnvelopeFrom && env.smtpEnvelopeFrom !== sender.email) {
    payload.replyTo = { email: env.smtpEnvelopeFrom };
  }

  try {
    const { data } = await axios.post(BREVO_URL, payload, {
      headers: {
        'api-key': apiKey,
        accept: 'application/json',
        'content-type': 'application/json'
      },
      timeout: 15000
    });
    return data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || err.message || 'Failed to send email';
    const wrapped = new Error(`Brevo send failed: ${message}`);
    wrapped.cause = err;
    throw wrapped;
  }
};
