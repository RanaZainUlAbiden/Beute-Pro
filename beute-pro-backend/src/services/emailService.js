const nodemailer = require('nodemailer');

/**
 * Email transport (Gmail SMTP via Nodemailer).
 *
 * The transport is created lazily and only if EMAIL_ENABLED is true.
 * When disabled, every `send*` call becomes a no-op that logs instead
 * of hitting Gmail — so you can develop without credentials.
 */

let transporter = null;
let initialized = false;

const isEnabled = () => process.env.EMAIL_ENABLED === 'true';

const initTransport = () => {
  if (initialized) return;
  initialized = true;

  if (!isEnabled()) {
    console.log('📧 Email disabled (EMAIL_ENABLED != true) — emails will be logged only');
    return;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP credentials missing — email will be logged only');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: { user, pass },
    // Sensible timeouts so a bad SMTP host doesn't hang requests
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  console.log('📧 Email transport initialized (Gmail SMTP)');
};

/**
 * Core send. Never throws — callers should not fail an order just because
 * the email could not be delivered. Errors are logged, not propagated.
 *
 * @param {Object} opts
 * @param {string} opts.to      - recipient email
 * @param {string} opts.subject - subject line
 * @param {string} opts.html    - HTML body
 * @param {string} [opts.text]  - plain text fallback
 * @param {string} [opts.replyTo] - reply-to address
 */
const send = async (opts) => {
  initTransport();

  const from = process.env.EMAIL_FROM || 'Béute Pro <no-reply@beutepro.com>';
  const payload = {
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || undefined,
    replyTo: opts.replyTo || undefined,
  };

  if (!transporter) {
    console.log('📧 [MOCK EMAIL]', {
      to: payload.to,
      subject: payload.subject,
    });
    return { mock: true };
  }

  try {
    const info = await transporter.sendMail(payload);
    console.log(`📧 Email sent to ${payload.to} — messageId: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email send failed (${payload.to}):`, err.message);
    return { error: err.message };
  }
};

module.exports = { send, isEnabled };