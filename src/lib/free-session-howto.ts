import { getFreeSession } from "@/lib/content";
import type { HowToStepInput } from "@/lib/howto-schema";

export function getFreeSessionHowToSteps(): HowToStepInput[] {
  const { agenda } = getFreeSession();
  return agenda.map((item, index) => ({
    position: index + 1,
    name: item.title,
    text: [item.description, item.duration ? `Duration: ${item.duration}` : ""]
      .filter(Boolean)
      .join(" "),
  }));
}

export const FREE_SESSION_BOOKING_STEPS: HowToStepInput[] = [
  {
    name: "Choose your audience track",
    text: "Select student, engineer, or product manager so examples match your background.",
  },
  {
    name: "Pick a live time slot",
    text: "Book a free 2-hour session on the calendar - no credit card required.",
  },
  {
    name: "Join the live session",
    text: "Experience mental models, a tailored AI walkthrough, hands-on practice, and Q&A.",
  },
  {
    name: "Get your learning path",
    text: "Leave with frameworks, a resource pack, and optional next steps for the full program.",
  },
];