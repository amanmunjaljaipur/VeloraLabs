"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { mapHomepageRoleToAudience } from "@/lib/audience-map";
import { submitForm } from "@/lib/submit-to-sheets";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Copy left + form right (original two-column structure). */
export function HomeFreeSessionForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await submitForm({
      type: "booking",
      name,
      email,
      audience: mapHomepageRoleToAudience(role),
      audienceLabel: role,
      date: "TBD",
      time: preferredTime,
      status: "Request",
      source: "Homepage Free Session",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
      setName("");
      setEmail("");
      setRole("");
      setPreferredTime("");
    } else {
      toast("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <section
      id="free-session-form"
      className="section-y scroll-mt-20 border-y border-border bg-[var(--bg-light)]"
    >
      <div className="container-verlin">
        <div className="grid-editorial items-start gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="min-w-0 max-w-xl text-left">
            <p className="section-eyebrow">Free intro</p>
            <h2 className="section-title">Start with a free 2-hour session</h2>
            <p className="section-subtitle mt-4 max-w-none">
              Experience clarity-first teaching live - mental models, hands-on exercises, and a
              personalized path forward. No sales pitch.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              {[
                "Tailored to students, engineers, or product managers",
                "Live Q&A with real instructors",
                "Leave with frameworks you can reuse immediately",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            className="min-w-0 w-full"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-8% 0px -8% 0px" }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-border shadow-sm">
              {success ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-teal" aria-hidden />
                  <h3 className="card-title mt-4 text-lg">You&apos;re on the list</h3>
                  <p className="card-body mt-2">
                    We&apos;ll reach out shortly with available session times. Or book directly now.
                  </p>
                  <Link href="/free-session" className="mt-6 inline-block">
                    <Button variant="cta">Book your session</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <h3 className="card-title text-lg">Request your free session</h3>
                  <Input
                    label="Full name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Select
                    label="Your role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    options={[
                      { value: "", label: "Select your role" },
                      { value: "Student", label: "Student" },
                      { value: "Engineer", label: "Engineer" },
                      { value: "Product Manager", label: "Product Manager" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <Select
                    label="Preferred time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    required
                    options={[
                      { value: "", label: "Select preferred time" },
                      { value: "Weekday morning", label: "Weekday morning" },
                      { value: "Weekday evening", label: "Weekday evening" },
                      { value: "Weekend morning", label: "Weekend morning" },
                      { value: "Weekend afternoon", label: "Weekend afternoon" },
                    ]}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    variant="cta"
                    className="w-full"
                    loading={submitting}
                  >
                    Start free 2-hour session
                  </Button>
                  <p className="text-center text-xs text-text-muted">
                    Prefer to pick a date now?{" "}
                    <Link href="/free-session" className="link-hover font-medium">
                      Book with calendar →
                    </Link>
                  </p>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
