import { PageHeader } from "@/components/layout/PageHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "How Verlin Labs collects, uses, and protects the personal information you share when booking a session or contacting us.",
  path: "/privacy",
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

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <section className="section-y">
        <div className="container-verlin max-w-3xl space-y-10">
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-text-secondary">
            This policy is provided as a general template and does not constitute
            legal advice. Please have it reviewed by a qualified professional and
            tailored to your jurisdiction before relying on it.
          </p>

          <Section heading="1. Introduction">
            <p>
              Verlin Labs (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your
              privacy. This Privacy Policy explains what personal information we collect,
              how we use it, and the choices you have when you visit our website or book a
              free introductory session or program with us.
            </p>
          </Section>

          <Section heading="2. Information we collect">
            <p>We collect information you provide directly to us, including:</p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Your name and email address when you request or book a session.</li>
              <li>Your selected audience track or role and preferred session time.</li>
              <li>Messages and details you send through our contact form.</li>
              <li>Account information (name, email, and a hashed password) if you register.</li>
            </ul>
            <p>
              We also collect limited technical information automatically, such as your
              browser type, device, and general usage of the site, to keep the service
              secure and improve it.
            </p>
          </Section>

          <Section heading="3. How we use your information">
            <ul className="ml-5 list-disc space-y-1.5">
              <li>To schedule, confirm, and deliver your sessions and programs.</li>
              <li>To respond to your inquiries and provide learner support.</li>
              <li>To send session summaries, resources, and — only with your consent — our newsletter.</li>
              <li>To operate, secure, and improve our website and services.</li>
            </ul>
          </Section>

          <Section heading="4. Legal basis and consent">
            <p>
              We process your information based on your consent (which you give when you
              submit a form), to perform the service you request, and to pursue our
              legitimate interest in running and improving Verlin Labs. You may withdraw
              consent at any time by contacting us.
            </p>
          </Section>

          <Section heading="5. Sharing and disclosure">
            <p>
              We do not sell your personal information. We share it only with trusted
              service providers who help us operate — for example, scheduling, spreadsheet,
              and email delivery tools — and only to the extent needed to provide the
              service. We may also disclose information where required by law.
            </p>
          </Section>

          <Section heading="6. Children&rsquo;s privacy">
            <p>
              Some of our programs are designed for school students (Classes 6&ndash;12), who
              may be minors. We ask that a parent or guardian books and provides consent on
              behalf of a minor, and that only the information necessary to deliver the
              session is shared. If you believe a child has provided us information without
              appropriate consent, contact us and we will delete it promptly.
            </p>
          </Section>

          <Section heading="7. Data retention">
            <p>
              We keep your information only as long as needed to provide our services and
              for legitimate business or legal purposes. When it is no longer needed, we
              delete or anonymize it.
            </p>
          </Section>

          <Section heading="8. Your rights">
            <p>
              Depending on your location, you may have the right to access, correct, delete,
              or export your personal information, and to object to or restrict certain
              processing. To exercise any of these rights, please contact us through our
              contact page.
            </p>
          </Section>

          <Section heading="9. Cookies">
            <p>
              We use essential cookies to keep you signed in and to keep the site secure. We
              do not use advertising cookies. You can control cookies through your browser
              settings, though some features may not work without them.
            </p>
          </Section>

          <Section heading="10. Security">
            <p>
              We use reasonable technical and organizational measures — including encrypted
              connections and hashed passwords — to protect your information. No method of
              transmission or storage is completely secure, so we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section heading="11. Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date above and, where appropriate, notify you.
            </p>
          </Section>

          <Section heading="12. Contact us">
            <p>
              If you have questions about this policy or your information, please reach us
              through our <a href="/contact" className="text-teal hover:underline">contact page</a>{" "}
              or at <span className="text-foreground">privacy@verlinlabs.com</span>{" "}
              <span className="text-text-muted">(update to your registered contact email)</span>.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
}
