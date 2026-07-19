"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateICS } from "@/lib/booking/calcom";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const params = useSearchParams();
  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const name = params.get("name") || "Guest";
  const bookingId = params.get("bookingId") || "";

  const handleAddToCalendar = () => {
    const ics = generateICS(date, time, name);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verlin-labs-session.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayDate = date ? formatDate(new Date(date)) : "TBD";

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 md:px-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground">You&apos;re Booked!</h1>
        <p className="mt-4 text-text-secondary">
          Your free 2-hour session is confirmed. We&apos;ve sent details to your email.
        </p>

        <Card className="mt-10 text-left">
          <h2 className="font-semibold text-lg mb-4">Session Details</h2>
          <div className="space-y-3 text-sm">
            <p><span className="text-text-secondary">Date:</span> <span className="font-medium">{displayDate}</span></p>
            <p><span className="text-text-secondary">Time:</span> <span className="font-medium">{time ? formatTime(time) : "TBD"}</span></p>
            <p><span className="text-text-secondary">Duration:</span> <span className="font-medium">2 hours</span></p>
            <p><span className="text-text-secondary">Booking ID:</span> <span className="font-medium">{bookingId}</span></p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAddToCalendar} variant="secondary" className="flex-1">
              <Calendar className="h-4 w-4" /> Add to Calendar
            </Button>
            <Button className="flex-1" disabled>
              <ExternalLink className="h-4 w-4" /> Join Link (sent via email)
            </Button>
          </div>
        </Card>

        <Card className="mt-6 text-left">
          <h2 className="font-semibold text-lg mb-4">What to Expect Next</h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li>1. Check your email for a confirmation with the session link.</li>
            <li>2. Add the session to your calendar so you don&apos;t miss it.</li>
            <li>3. No preparation needed - just bring curiosity.</li>
            <li>4. After the session, we&apos;ll share a personalized learning path.</li>
          </ul>
        </Card>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
          <Link href="/courses">
            <Button>Explore Courses</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><p className="text-text-secondary">Loading...</p></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}