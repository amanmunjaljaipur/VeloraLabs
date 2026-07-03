"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { submitForm } from "@/lib/submit-to-sheets";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const TOPICS = [
  { value: "free-session", label: "Free Session Inquiry" },
  { value: "corporate", label: "Corporate / Team Program" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "general", label: "General Question" },
  { value: "media", label: "Media / Press" },
  { value: "other", label: "Other" },
] as const;

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Phone call" },
] as const;

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  topic: z.enum([
    "free-session",
    "corporate",
    "partnership",
    "general",
    "media",
    "other",
  ]),
  message: z.string().min(10, "Please share a few more details (at least 10 characters)"),
  preferredContact: z.enum(["email", "whatsapp", "call"]),
});

type FormData = z.infer<typeof schema>;

function formatMessage(data: FormData): string {
  const topicLabel = TOPICS.find((t) => t.value === data.topic)?.label ?? data.topic;
  const methodLabel =
    CONTACT_METHODS.find((m) => m.value === data.preferredContact)?.label ?? data.preferredContact;

  const lines = [
    `Topic: ${topicLabel}`,
    `Preferred contact: ${methodLabel}`,
  ];
  if (data.phone?.trim()) {
    lines.push(`Phone / WhatsApp: ${data.phone.trim()}`);
  }
  lines.push("", data.message.trim());
  return lines.join("\n");
}

export function ContactForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: "general",
      preferredContact: "email",
    },
  });

  const onSubmit = async (data: FormData) => {
    const result = await submitForm({
      type: "contact",
      name: data.name,
      email: data.email,
      message: formatMessage(data),
      source: "Contact Page",
    });

    if (!result.ok) {
      toast("Something went wrong. Please try again.", "error");
      return;
    }

    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <Card
        id="contact-form"
        className="mx-auto max-w-2xl scroll-mt-24 border-accent-teal/30 bg-gradient-to-br from-accent-teal/5 to-transparent p-8 text-center md:p-12"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Message received</h2>
        <p className="mt-3 text-text-secondary leading-relaxed">
          Thank you for reaching out. We typically respond within 24–48 hours on business days.
          There&apos;s no obligation — we&apos;ll answer your question and suggest next steps only if
          they&apos;re helpful for you.
        </p>
        <Button className="mt-8" variant="secondary" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </Card>
    );
  }

  return (
    <Card id="contact-form" className="mx-auto max-w-2xl scroll-mt-24 p-6 md:p-10">
      <h2 className="text-2xl font-semibold text-foreground">Send us a message</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Fields marked with * are required. We never share your details with third parties.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Full Name *"
            placeholder="Your name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <Input
          label="Phone / WhatsApp (optional)"
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <Select
          label="I'm reaching out about *"
          options={TOPICS.map((t) => ({ value: t.value, label: t.label }))}
          error={errors.topic?.message}
          {...register("topic")}
        />

        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-medium text-foreground">
            Message / Details *
          </label>
          <textarea
            id="message"
            rows={6}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
            placeholder="Tell us what you're looking for — goals, team size, timeline, or questions."
            {...register("message")}
          />
          {errors.message && (
            <p className="text-sm text-red-500">{errors.message.message}</p>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Preferred contact method *</legend>
          <div className="flex flex-wrap gap-4">
            {CONTACT_METHODS.map((method) => (
              <label
                key={method.value}
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
              >
                <input
                  type="radio"
                  value={method.value}
                  className="h-4 w-4 border-border text-accent-teal focus:ring-accent-teal/30"
                  {...register("preferredContact")}
                />
                {method.label}
              </label>
            ))}
          </div>
          {errors.preferredContact && (
            <p className="text-sm text-red-500">{errors.preferredContact.message}</p>
          )}
        </fieldset>

        <Button type="submit" loading={isSubmitting} size="lg" className="w-full sm:w-auto">
          Send Message
        </Button>
      </form>
    </Card>
  );
}