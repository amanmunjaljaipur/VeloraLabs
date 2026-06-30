"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    toast("Message sent! We'll get back to you within 24 hours.", "success");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg px-4 md:px-8 space-y-6">
      <Input label="Name" placeholder="Your name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
      <div className="space-y-2">
        <label htmlFor="message" className="block text-sm font-medium">Message</label>
        <textarea
          id="message"
          rows={5}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-text-secondary/60 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none"
          placeholder="How can we help?"
          {...register("message")}
        />
        {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send Message
      </Button>
    </form>
  );
}