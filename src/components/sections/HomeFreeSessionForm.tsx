"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { submitForm } from "@/lib/submit-to-sheets";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function HomeFreeSessionForm() {
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
      type: "contact",
      name,
      email,
      message: `Free session interest from homepage. Role: ${role}. Preferred time: ${preferredTime}`,
    });

    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
      setName("");
      setEmail("");
      setRole("");
      setPreferredTime("");
    }
  };

  return (
    <section id="free-session-form" className="py-16 md:py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Start with a free 2-hour session
            </h2>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              Experience clarity-first teaching live — mental models, hands-on exercises, and a
              personalized path forward. No sales pitch.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "Tailored to students, engineers, or product managers",
                "Live Q&A with real instructors",
                "Leave with frameworks you can reuse immediately",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="relative mt-8 hidden aspect-[16/10] overflow-hidden rounded-2xl border border-border sm:block lg:max-w-md">
              <Image
                src="/images/workshop.jpg"
                alt="Calm live online learning session"
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/50 to-transparent" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <Card className="border-teal/20 shadow-md">
              {success ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">You&apos;re on the list!</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    We&apos;ll reach out shortly with available session times. Or book directly now.
                  </p>
                  <Link href="/free-session" className="mt-6 inline-block">
                    <Button>Book your session</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Request your free session</h3>
                  <Input
                    label="Full Name"
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
                    label="Your Role"
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
                    label="Preferred Time"
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
                  <Button type="submit" size="lg" className="w-full" loading={submitting}>
                    Start Free 2-Hour Session
                  </Button>
                  <p className="text-center text-xs text-text-secondary">
                    Prefer to pick a date now?{" "}
                    <Link href="/free-session" className="text-teal hover:underline">
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