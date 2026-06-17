import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!transporter) {
    console.info("[email:dev]", {
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text.replace(/\n/g, "<br>"),
  });
}

export function buildVerificationEmail(token: string): { subject: string; text: string } {
  const url = `${env.APP_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your Inzozi Nziza email",
    text: `Welcome to Inzozi Nziza.\n\nVerify your email by visiting:\n${url}\n\nThis link expires in ${env.EMAIL_VERIFICATION_TTL_HOURS} hours.`,
  };
}

export function buildPasswordResetEmail(token: string): { subject: string; text: string } {
  const url = `${env.APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "Reset your Inzozi Nziza password",
    text: `You requested a password reset.\n\nReset your password by visiting:\n${url}\n\nThis link expires in ${env.PASSWORD_RESET_TTL_HOURS} hour(s).\n\nIf you did not request this, ignore this email.`,
  };
}
