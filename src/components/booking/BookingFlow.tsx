"use client";

import { Calendar } from "./Calendar";
import { TimeSlotCard } from "./TimeSlotCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ApiSlot {
  id: string;
  time: string;
  total: number;
  available: number;
}

interface BookingRecord {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  audience: string;
}

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function fetchSlots(date: Date): Promise<ApiSlot[]> {
  const res = await fetch(`/api/booking/slots?date=${dateKey(date)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.slots) ? data.slots : [];
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  audience: z.string().min(1, "Please select your audience"),
});

type FormData = z.infer<typeof schema>;

interface BookingFlowProps {
  defaultAudience?: string;
}

export function BookingFlow({ defaultAudience }: BookingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ApiSlot | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // OTP step (logged-out users only)
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { audience: defaultAudience || "" },
  });

  useEffect(() => {
    if (session?.user?.name) setValue("name", session.user.name);
    if (session?.user?.email) setValue("email", session.user.email);
  }, [session, setValue]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetchSlots(selectedDate)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const onRequestConfirm = handleSubmit(() => {
    if (!selectedDate || !selectedSlot) {
      toast("Please select a date and time slot.", "warning");
      return;
    }
    setShowConfirm(true);
  });

  const goToConfirmationPage = (booking: BookingRecord) => {
    const params = new URLSearchParams({
      date: booking.date,
      time: booking.time,
      name: booking.name,
      bookingId: booking.id,
    });
    router.push(`/book/confirmation?${params.toString()}`);
  };

  const onConfirmBooking = async () => {
    const values = getValues();
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);

    try {
      if (isLoggedIn) {
        const res = await fetch("/api/booking/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateKey(selectedDate),
            slotId: selectedSlot.id,
            audience: values.audience,
          }),
        });
        const data = await res.json();

        if (res.status === 409 || data.error === "slot_unavailable") {
          setShowConfirm(false);
          setShowUnavailable(true);
          return;
        }
        if (!res.ok) {
          toast("Something went wrong. Please try again.", "error");
          return;
        }

        setShowConfirm(false);
        goToConfirmationPage(data.booking);
        return;
      }

      // Logged-out path: request an OTP first, do not book yet.
      const res = await fetch("/api/booking/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey(selectedDate),
          slotId: selectedSlot.id,
          name: values.name,
          email: values.email,
          audience: values.audience,
        }),
      });
      const data = await res.json();

      if (res.status === 409 || data.error === "slot_unavailable") {
        setShowConfirm(false);
        setShowUnavailable(true);
        return;
      }
      if (!res.ok) {
        toast(
          data.error === "email_failed"
            ? "We could not send a confirmation code. Please try again."
            : "Something went wrong. Please try again.",
          "error"
        );
        return;
      }

      setChallengeId(data.challengeId);
      setOtpError(null);
      setOtpCode("");
      setShowConfirm(false);
      setShowOtpStep(true);
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    const values = getValues();
    if (!selectedDate || !selectedSlot) return;
    setResending(true);
    try {
      const res = await fetch("/api/booking/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey(selectedDate),
          slotId: selectedSlot.id,
          name: values.name,
          email: values.email,
          audience: values.audience,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("Could not resend the code. Please try again.", "error");
        return;
      }
      setChallengeId(data.challengeId);
      setOtpError(null);
      toast("A new code has been sent to your email.", "success");
    } finally {
      setResending(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!challengeId || !otpCode) return;
    setVerifying(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/booking/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: otpCode }),
      });
      const data = await res.json();

      if (res.status === 409 || data.error === "slot_unavailable") {
        setShowOtpStep(false);
        setShowUnavailable(true);
        return;
      }
      if (res.status === 410) {
        setOtpError("This code expired. Request a new one below.");
        return;
      }
      if (!res.ok) {
        setOtpError("That code did not match. Please try again.");
        return;
      }

      setShowOtpStep(false);
      goToConfirmationPage(data.booking);
    } finally {
      setVerifying(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available > 0);

  const steps = [
    { label: "Date", done: !!selectedDate, active: !selectedDate },
    { label: "Time", done: !!selectedSlot, active: !!selectedDate && !selectedSlot },
    { label: "Details", done: false, active: !!selectedSlot },
  ];

  return (
    <div className="space-y-8">
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step.done && "bg-teal text-white",
                  step.active && !step.done && "bg-teal/15 text-teal ring-2 ring-teal/30",
                  !step.done && !step.active && "bg-muted text-text-secondary"
                )}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.active || step.done ? "text-foreground" : "text-text-secondary"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden h-px w-6 bg-border sm:block md:w-10" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <div className={cn("grid gap-8", selectedDate && "lg:grid-cols-2")}>
        <div>
          <h3 className="text-base font-semibold mb-4">1. Select a date</h3>
          <Calendar
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          {!selectedDate && (
            <p className="mt-4 text-sm text-text-secondary">
              Pick a date to see available time slots.
            </p>
          )}
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-base font-semibold mb-4">
              2. Time slots - {formatDate(selectedDate)}
            </h3>
            {loadingSlots && (
              <div className="flex items-center justify-center py-16">
                <Spinner />
              </div>
            )}
            {!loadingSlots && slots.length === 0 && (
              <EmptyState
                title="All slots booked for this day"
                description="Try selecting another date. Weekends are typically unavailable."
                cta={{ label: "View next week", href: "#book" }}
              />
            )}
            {!loadingSlots && slots.length > 0 && availableSlots.length === 0 && (
              <EmptyState
                title="All slots for today are booked"
                description="Every time slot is full. Please try another date."
              />
            )}
            {!loadingSlots && availableSlots.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <TimeSlotCard
                    key={slot.id}
                    time={slot.time}
                    available={slot.available}
                    total={slot.total}
                    selected={selectedSlot?.id === slot.id}
                    onClick={() => setSelectedSlot(slot)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSlot && (
      <form onSubmit={onRequestConfirm} className="rounded-2xl border border-border bg-muted/40 p-6 space-y-6">
        <h3 className="text-base font-semibold">3. Your details</h3>
        {isLoggedIn && (
          <p className="text-sm text-text-secondary">
            Signed in as {session?.user?.email} - we will email your confirmation immediately, no code needed.
          </p>
        )}
        {!isLoggedIn && (
          <p className="text-sm text-text-secondary">
            Not signed in - we will send a confirmation code to your email before your seat is booked.
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="Your name"
            error={errors.name?.message}
            disabled={isLoggedIn}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            disabled={isLoggedIn}
            {...register("email")}
          />
        </div>
        <Select
          label="Audience Type"
          options={[
            { value: "", label: "Select your audience" },
            { value: "students", label: "School Students (Classes 6–12)" },
            { value: "engineers", label: "College Engineers" },
            { value: "professionals", label: "Professionals" },
          ]}
          error={errors.audience?.message}
          {...register("audience")}
        />
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {isLoggedIn ? "Confirm booking" : "Send confirmation code"}
        </Button>
      </form>
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Your Booking">
        <div className="space-y-4">
          {selectedDate && selectedSlot && (
            <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
              <p><span className="text-text-secondary">Date:</span> {formatDate(selectedDate)}</p>
              <p><span className="text-text-secondary">Time:</span> {selectedSlot.time}</p>
              <p><span className="text-text-secondary">Name:</span> {getValues("name")}</p>
              <p><span className="text-text-secondary">Email:</span> {getValues("email")}</p>
            </div>
          )}
          {!isLoggedIn && (
            <p className="text-xs text-text-secondary">
              We will email a 6-digit code to confirm this address before the seat is booked.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>
              Edit Selection
            </Button>
            <Button className="flex-1" loading={submitting} onClick={onConfirmBooking}>
              {isLoggedIn ? "Confirm & Book" : "Send Code"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showOtpStep} onClose={() => setShowOtpStep(false)} title="Enter Confirmation Code">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            We sent a 6-digit code to <strong>{getValues("email")}</strong>. Enter it below to confirm your seat.
          </p>
          <Input
            label="Confirmation Code"
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={otpError ?? undefined}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onResendOtp}
              loading={resending}
            >
              Resend Code
            </Button>
            <Button
              className="flex-1"
              loading={verifying}
              disabled={otpCode.length < 4}
              onClick={onVerifyOtp}
            >
              Verify & Book
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showUnavailable} onClose={() => setShowUnavailable(false)} title="Slot No Longer Available">
        <p className="text-text-secondary mb-4">
          This time slot was just booked by someone else. Here are alternative slots:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {availableSlots.slice(0, 4).map((slot) => (
            <TimeSlotCard
              key={slot.id}
              time={slot.time}
              available={slot.available}
              total={slot.total}
              selected={false}
              onClick={() => {
                setSelectedSlot(slot);
                setShowUnavailable(false);
              }}
            />
          ))}
        </div>
        <Button variant="secondary" className="w-full" onClick={() => setShowUnavailable(false)}>
          Choose Another Slot
        </Button>
      </Modal>
    </div>
  );
}
