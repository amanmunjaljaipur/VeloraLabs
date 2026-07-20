import { CONTACT_EMAIL } from "@/lib/brand-email";
import { isTransactionalEmailConfigured, sendTransactionalEmail } from "@/lib/send-email";
import { buildBookingIcs, formatIstRange } from "@/lib/booking/ics";
import type { BookingAudience } from "@/lib/booking/store";

/** Current site palette (globals.css) - literal hex, CSS variables do not work in email HTML. */
const COLOR = {
  navy: "#101914",
  teal: "#065f46",
  accentTeal: "#059669",
  amber: "#a16207",
  amberLight: "#fdf6e0",
  canvas: "#faf9f4",
  bgLight: "#f2f0e8",
  textSecondary: "#4a5750",
  textMuted: "#6e7a72",
  border: "#d8d3bf",
};

const AUDIENCE_LABEL: Record<BookingAudience, string> = {
  students: "School Students (Classes 6-12)",
  engineers: "College Engineers",
  professionals: "Professionals",
};

function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function emailShell(eyebrow: string, title: string, bodyHtml: string): string {
  return `
    <div style="font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: ${COLOR.navy}; max-width: 560px; margin: 0 auto; background: ${COLOR.canvas}; padding: 32px 28px; border-radius: 16px; border: 1px solid ${COLOR.border};">
      <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${COLOR.teal}; font-weight: 700; margin: 0 0 12px;">
        ${eyebrow}
      </p>
      <h1 style="font-size: 24px; line-height: 1.3; margin: 0 0 16px; color: ${COLOR.navy};">${title}</h1>
      ${bodyHtml}
      <p style="font-size: 12px; color: ${COLOR.textMuted}; margin-top: 32px; border-top: 1px solid ${COLOR.border}; padding-top: 16px;">
        Questions? Reply to this email or write to ${CONTACT_EMAIL}.
      </p>
    </div>
  `;
}

export function isBookingEmailConfigured(): boolean {
  return isTransactionalEmailConfigured();
}

/** Sent when a logged-out visitor requests a booking - code confirms the email before any slot is reserved. */
export async function sendBookingOtpEmail(input: {
  email: string;
  name: string;
  code: string;
  date: string;
  time: string;
}): Promise<boolean> {
  const html = emailShell(
    "Verlin Labs - Confirm your session",
    "Confirm your email to finish booking",
    `
      <p style="font-size: 16px; line-height: 1.6; color: ${COLOR.textSecondary};">
        Hi ${input.name.split(" ")[0] || input.name}, enter this code to confirm your free session request for
        <strong>${formatDateLong(input.date)}</strong> at <strong>${formatIstRange(input.date, input.time)}</strong>.
        Your seat is not held yet - it is booked the moment you confirm this code.
      </p>
      <div style="margin: 24px 0; padding: 20px; background: ${COLOR.amberLight}; border: 1px solid ${COLOR.amber}55; border-radius: 12px; text-align: center;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em; color: ${COLOR.navy};">${input.code}</span>
      </div>
      <p style="font-size: 13px; color: ${COLOR.textMuted}; line-height: 1.5;">
        This code expires in 10 minutes. If you did not request a Verlin Labs session, you can safely ignore this email.
      </p>
    `
  );

  return sendTransactionalEmail({
    to: input.email,
    subject: `Your Verlin Labs confirmation code: ${input.code}`,
    html,
    from: process.env.AUTH_FROM_EMAIL,
  });
}

/** Sent once a booking is actually confirmed (logged-in path, or right after OTP verification). */
export async function sendBookingConfirmationEmail(input: {
  email: string;
  name: string;
  date: string;
  time: string;
  audience: BookingAudience;
  bookingId: string;
}): Promise<boolean> {
  const html = emailShell(
    "Verlin Labs - Booking confirmed",
    "You're booked for your free session",
    `
      <p style="font-size: 16px; line-height: 1.6; color: ${COLOR.textSecondary};">
        Hi ${input.name.split(" ")[0] || input.name}, your free 2-hour live AI session is confirmed. We have attached a
        calendar invite - open it to add the session to Google Calendar, Outlook, or Apple Calendar in one tap.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: ${COLOR.textMuted}; width: 120px;">Date</td>
          <td style="padding: 10px 0; color: ${COLOR.navy}; font-weight: 600; border-top: 1px solid ${COLOR.border};">${formatDateLong(input.date)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: ${COLOR.textMuted};">Time</td>
          <td style="padding: 10px 0; color: ${COLOR.navy}; font-weight: 600; border-top: 1px solid ${COLOR.border};">${formatIstRange(input.date, input.time)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: ${COLOR.textMuted};">Track</td>
          <td style="padding: 10px 0; color: ${COLOR.navy}; font-weight: 600; border-top: 1px solid ${COLOR.border};">${AUDIENCE_LABEL[input.audience]}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: ${COLOR.textMuted};">Booking ID</td>
          <td style="padding: 10px 0; color: ${COLOR.navy}; font-weight: 600; border-top: 1px solid ${COLOR.border};">${input.bookingId}</td>
        </tr>
      </table>
      <p style="font-size: 14px; line-height: 1.6; color: ${COLOR.textSecondary};">
        The join link will be emailed to you closer to the session. No credit card was required and none is needed now.
      </p>
      <p style="margin-top: 24px;">
        <span style="display: inline-block; background: ${COLOR.accentTeal}; color: #ffffff; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px;">
          See you ${formatDateLong(input.date)}
        </span>
      </p>
    `
  );

  const icsBuffer = buildBookingIcs({
    bookingId: input.bookingId,
    date: input.date,
    time: input.time,
    attendeeName: input.name,
    attendeeEmail: input.email,
  });

  return sendTransactionalEmail({
    to: input.email,
    subject: `Confirmed: your Verlin Labs free session on ${formatDateLong(input.date)}`,
    html,
    from: process.env.AUTH_FROM_EMAIL,
    attachments: [{ filename: "verlin-labs-free-session.ics", content: icsBuffer }],
  });
}
