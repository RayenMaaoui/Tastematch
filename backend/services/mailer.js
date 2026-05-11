const nodemailer = require("nodemailer");

let transporter = null;

function isMailerConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getTransporter() {
  if (!isMailerConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    return { skipped: true, reason: "SMTP is not configured" };
  }

  if (!to) {
    return { skipped: true, reason: "Recipient email is missing" };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const info = await mailer.sendMail({ from, to, subject, text, html });
  return { skipped: false, messageId: info.messageId };
}

module.exports = {
  isMailerConfigured,
  sendMail,
};
