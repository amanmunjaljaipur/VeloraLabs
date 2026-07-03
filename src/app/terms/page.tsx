import { PageHeader } from "@/components/layout/PageHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service",
  description:
    "The terms that govern your use of the Verlin Labs website, free sessions, and paid learning programs.",
  path: "/terms",
});

const LAST_UPDATED = "July 3, 2026";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="space-y-3 text-text-secondary leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <section className="section-y">
        <div className="container-verlin max-w-3xl space-y-10">
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-text-secondary">
            These terms are provided as a general template and do not constitute legal
            advice. Please have them reviewed by a qualified professional and tailored to
            your jurisdiction before relying on them.
          </p>

          <Section heading="1. Acceptance of terms">
            <p>
              By accessing the Verlin Labs website or booking a session or program, you
              agree to these Terms of Service. If you do not agree, please do not use our
              services.
            </p>
          </Section>

          <Section heading="2. Our services">
            <p>
              Verlin Labs offers a free introductory session and paid learning programs for
              students, engineers, and product managers. Program length, structure, and
              pricing are described on the relevant program pages and may change over time.
            </p>
          </Section>

          <Section heading="3. Eligibility and minors">
            <p>
              If you are a minor (including school students in Classes 6&ndash;12), a parent or
              legal guardian must book on your behalf and agree to these terms. By booking
              for a minor, the parent or guardian accepts these terms for that learner.
            </p>
          </Section>

          <Section heading="4. Bookings, pricing, and payments">
            <ul className="ml-5 list-disc space-y-1.5">
              <li>The introductory session is free; no payment information is required to book it.</li>
              <li>Program prices are shown in Indian Rupees (₹) and may be exclusive of applicable taxes.</li>
              <li>Enrollment in a paid program is confirmed once payment is received per the instructions we provide.</li>
            </ul>
          </Section>

          <Section heading="5. Rescheduling and cancellations">
            <p>
              You may reschedule or cancel a free session using the link in your confirmation
              email, ideally at least 24 hours in advance. Refund and cancellation terms for
              paid programs will be provided at the time of enrollment.
            </p>
          </Section>

          <Section heading="6. Accounts">
            <p>
              If you create an account, you are responsible for keeping your login details
              secure and for activity that occurs under your account. Please notify us of any
              unauthorized use.
            </p>
          </Section>

          <Section heading="7. Acceptable use">
            <p>
              You agree not to misuse the services, including by attempting to disrupt the
              site, access it without authorization, or use our content in ways these terms do
              not permit.
            </p>
          </Section>

          <Section heading="8. Intellectual property">
            <p>
              All course materials, frameworks, text, and graphics provided by Verlin Labs are
              owned by us or our licensors and are provided for your personal, non-commercial
              learning use. You may not redistribute or resell them without our written
              permission.
            </p>
          </Section>

          <Section heading="9. Disclaimers">
            <p>
              Our services are provided &ldquo;as is&rdquo; and are intended for educational purposes. We
              do not guarantee specific outcomes such as grades, job offers, or business
              results.
            </p>
          </Section>

          <Section heading="10. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Verlin Labs will not be liable for
              indirect, incidental, or consequential damages arising from your use of the
              services. Our total liability for any claim will not exceed the amount you paid
              to us for the service in question.
            </p>
          </Section>

          <Section heading="11. Governing law">
            <p>
              These terms are governed by the laws of India, and any disputes will be subject
              to the courts of competent jurisdiction there, unless otherwise required by
              applicable law.
            </p>
          </Section>

          <Section heading="12. Changes to these terms">
            <p>
              We may update these terms from time to time. Continued use of the services after
              changes take effect means you accept the updated terms.
            </p>
          </Section>

          <Section heading="13. Contact us">
            <p>
              Questions about these terms? Reach us through our{" "}
              <a href="/contact" className="text-teal hover:underline">contact page</a> or at{" "}
              <span className="text-foreground">hello@verlinlabs.com</span>{" "}
              <span className="text-text-muted">(update to your registered contact email)</span>.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
}
