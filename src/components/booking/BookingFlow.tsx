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
import { fetchSlots, createBooking, type TimeSlot } from "@/lib/booking/calcom";
import { cn, formatDate } from "@/lib/utils";
import { submitForm } from "@/lib/submit-to-sheets";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { audience: defaultAudience || "" },
  });

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

  const onConfirmBooking = async () => {
    const values = getValues();
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    const result = await createBooking({
      name: values.name,
      email: values.email,
      date: selectedDate.toISOString().split("T")[0],
      slotId: selectedSlot.id,
      audience: values.audience,
    });
    setSubmitting(false);
    setShowConfirm(false);

    if (result.error === "slot_unavailable") {
      setShowUnavailable(true);
      return;
    }
    if (!result.success) {
      toast("Something went wrong. Please try again.", "error");
      return;
    }

    const sheetResult = await submitForm({
      type: "booking",
      name: values.name,
      email: values.email,
      audience: values.audience,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedSlot.time,
      bookingId: result.bookingId || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: "Confirmed",
      source: "Free Session Calendar",
    });

    if (!sheetResult.synced) {
      toast(
        "Booking confirmed, but Google Sheets sync is not configured yet. Contact support if you need a copy of your booking.",
        "warning"
      );
    }

    const params = new URLSearchParams({
      date: selectedDate.toISOString().split("T")[0],
      time: selectedSlot.time,
      name: values.name,
      bookingId: result.bookingId || "",
    });
    router.push(`/book/confirmation?${params.toString()}`);
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
              2. Time slots — {formatDate(selectedDate)}
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
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Full Name" placeholder="Your name" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
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
          Confirm booking
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
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>
              Edit Selection
            </Button>
            <Button className="flex-1" loading={submitting} onClick={onConfirmBooking}>
              Confirm & Book
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