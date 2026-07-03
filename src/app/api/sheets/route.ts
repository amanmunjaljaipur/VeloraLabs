import { enrichBookingPayload } from "@/lib/sheets-booking";
import { submitToGoogleSheet } from "@/lib/google-sheets";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookingSchema = z.object({
  type: z.literal("booking"),
  name: z.string().min(2),
  email: z.string().email(),
  audience: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  bookingId: z.string().optional(),
  timezone: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  audienceLabel: z.string().optional(),
});

const contactSchema = z.object({
  type: z.literal("contact"),
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
  source: z.string().optional(),
});

const newsletterSchema = z.object({
  type: z.literal("newsletter"),
  email: z.string().email(),
  source: z.string().optional(),
});

const schema = z.discriminatedUnion("type", [
  bookingSchema,
  contactSchema,
  newsletterSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid submission" },
        { status: 400 }
      );
    }

    const payload =
      parsed.data.type === "booking"
        ? enrichBookingPayload(parsed.data)
        : parsed.data;

    const synced = await submitToGoogleSheet(payload);

    return NextResponse.json({
      success: true,
      synced,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}