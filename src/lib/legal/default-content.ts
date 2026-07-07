import type { LegalCmsData, LegalSection } from "./types";

const LEGAL_DISCLAIMER =
  "This document is provided for operational use by Verlin Labs. It does not constitute legal advice. Have it reviewed by qualified counsel in your jurisdiction before relying on it for compliance purposes.";

const CONTACT = "snemanenterprises@gmail.com";
const PRIVACY_CONTACT = "snemanenterprises@gmail.com";

function section(id: string, heading: string, content: string): LegalSection {
  return { id, heading, content };
}

const TERMS_SECTIONS: LegalSection[] = [
  section(
    "acceptance",
    "1. Acceptance of terms",
    `By accessing the Verlin Labs website, creating an account, booking a session, enrolling in a program, or otherwise using our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use our services.

We may require you to affirmatively accept updated terms before continuing to use the platform after material changes.`
  ),
  section(
    "services",
    "2. Our services",
    `Verlin Labs provides clarity-first learning for AI and technology, including free introductory sessions and paid programs for students, engineers, and product managers. Program structure, duration, pricing, and availability are described on our website and may change from time to time.

Educational content is for learning purposes only. We do not guarantee employment, grades, certification by third parties, or specific business outcomes.`
  ),
  section(
    "eligibility",
    "3. Eligibility and minors",
    `You must be legally able to enter into a binding agreement in your jurisdiction. If you are under 18 (or the age of majority where you live), a parent or legal guardian must book on your behalf, create or supervise your account, and accept these terms for you.

By submitting information for a minor, the parent or guardian represents that they have authority to do so and consents to our processing of the minor's information as described in our Privacy Policy.`
  ),
  section(
    "accounts",
    "4. Accounts and security",
    `You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us promptly of any unauthorized access.

You agree to provide accurate registration information and keep it current. We may suspend or terminate accounts that violate these terms or pose a security risk.`
  ),
  section(
    "bookings",
    "5. Bookings, pricing, and payments",
    `The introductory session is free; no payment card is required to book it unless explicitly stated otherwise.

Paid program prices are displayed in Indian Rupees (INR) and may be exclusive of applicable taxes, levies, or payment processing fees. Enrollment is confirmed only after we acknowledge payment per the instructions provided at checkout or enrollment.

Introductory or promotional pricing may be limited in time or availability. We reserve the right to modify list prices and offers; changes apply to new enrollments unless otherwise stated in writing.`
  ),
  section(
    "cancellations",
    "6. Rescheduling, cancellations, and refunds",
    `Free sessions may be rescheduled or cancelled using the link in your confirmation email, ideally at least 24 hours before the scheduled start.

Paid program refund and cancellation terms will be communicated at enrollment. Unless otherwise stated in writing, fees for services already delivered, digital materials accessed, or sessions attended may be non-refundable. Nothing in these terms limits rights you may have under applicable consumer protection law.`
  ),
  section(
    "acceptable-use",
    "7. Acceptable use",
    `You agree not to: (a) misuse, disrupt, or attempt unauthorized access to our systems; (b) scrape, copy, or redistribute course materials except as expressly permitted; (c) harass instructors, staff, or other learners; (d) use our services for unlawful purposes; (e) upload malware or harmful code; or (f) misrepresent your identity or affiliation.

We may investigate violations and take appropriate action, including removal of access.`
  ),
  section(
    "ip",
    "8. Intellectual property",
    `All website content, curricula, frameworks, recordings, slides, exercises, trademarks, and branding are owned by Verlin Labs or our licensors. We grant you a limited, personal, non-transferable, non-exclusive license to access materials solely for your own learning during an active enrollment.

You may not resell, publicly republish, record sessions for redistribution, or create derivative commercial products from our materials without prior written consent.`
  ),
  section(
    "third-party",
    "9. Third-party tools and links",
    `Programs may reference third-party AI tools, platforms, or websites. Your use of third-party services is governed by their terms. We are not responsible for third-party availability, pricing, or data practices.`
  ),
  section(
    "disclaimers",
    "10. Disclaimers",
    `OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.

We do not warrant that the site will be uninterrupted, error-free, or free of harmful components.`
  ),
  section(
    "liability",
    "11. Limitation of liability",
    `TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERLIN LABS AND ITS DIRECTORS, EMPLOYEES, CONTRACTORS, AND AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES.

OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SPECIFIC PROGRAM GIVING RISE TO THE CLAIM IN THE TWELVE (12) MONTHS BEFORE THE EVENT, OR (B) INR 5,000.

Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by law.`
  ),
  section(
    "indemnity",
    "12. Indemnification",
    `You agree to indemnify, defend, and hold harmless Verlin Labs and its personnel from claims, damages, losses, and expenses (including reasonable legal fees) arising from your misuse of the services, violation of these terms, or infringement of third-party rights.`
  ),
  section(
    "governing-law",
    "13. Governing law and disputes",
    `These terms are governed by the laws of India, without regard to conflict-of-law principles. Subject to applicable law, courts in Jaipur, Rajasthan, India shall have exclusive jurisdiction over disputes not resolved informally.

Before filing a claim, you agree to contact us at ${CONTACT} and attempt good-faith resolution for at least thirty (30) days.`
  ),
  section(
    "changes",
    "14. Changes to these terms",
    `We may update these terms from time to time. When we publish a new version, we will update the "Last updated" date and may require you to accept the updated terms before continued use of account features.

Your continued use after acceptance constitutes agreement to the updated terms.`
  ),
  section(
    "contact",
    "15. Contact",
    `Questions about these terms: ${CONTACT} or our contact page at /contact.`
  ),
];

const PRIVACY_SECTIONS: LegalSection[] = [
  section(
    "introduction",
    "1. Introduction",
    `Verlin Labs ("Verlin Labs", "we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, retain, and protect personal information when you visit verlinlabs.com, create an account, book sessions, enroll in programs, or contact us.

This policy is designed to align with common industry practices and India's Digital Personal Data Protection Act, 2023 (DPDP Act), where applicable.`
  ),
  section(
    "controller",
    "2. Data controller",
    `Verlin Labs is the data controller for personal information described in this policy. Contact: ${PRIVACY_CONTACT}.`
  ),
  section(
    "collection",
    "3. Information we collect",
    `We may collect:

• Identity and contact data: name, email, phone (if provided).
• Account data: hashed password (for email/password accounts), role, enrollment status.
• Booking and program data: audience track, session times, messages, attendance.
• Payment-related metadata: enrollment confirmations (we do not store full card numbers on our servers).
• Technical data: IP address, browser type, device identifiers, cookies necessary for authentication and security.
• Communications: contact form messages, support correspondence.
• Legal compliance data: terms and privacy policy version accepted, acceptance timestamp.`
  ),
  section(
    "purposes",
    "4. How we use your information",
    `We use personal information to:

• Provide, schedule, and deliver sessions and programs.
• Operate accounts and authenticate users.
• Respond to inquiries and provide learner support.
• Send transactional messages (confirmations, reminders, summaries).
• Send marketing communications only where permitted by law and your preferences.
• Improve our website, security, and services.
• Comply with law and enforce our terms.
• Maintain records of policy acceptance for compliance.`
  ),
  section(
    "legal-basis",
    "5. Legal basis and consent",
    `We process data based on your consent (forms, sign-up, newsletter opt-in), performance of a contract (delivering booked services), legitimate interests (security, analytics, service improvement), and legal obligations.

You may withdraw consent where processing is consent-based by contacting us. Withdrawal does not affect processing already performed.`
  ),
  section(
    "sharing",
    "6. Sharing and processors",
    `We do not sell your personal information. We share data only with:

• Service providers (hosting, email, scheduling, spreadsheets/CRM, authentication) under contractual confidentiality and security obligations.
• Professional advisers or authorities when required by law or to protect rights and safety.

A current list of processor categories is available on request.`
  ),
  section(
    "international",
    "7. International transfers",
    `Our service providers may process data in India or other countries. Where required, we implement appropriate safeguards for cross-border transfers.`
  ),
  section(
    "children",
    "8. Children's privacy",
    `Programs for school students may involve minors. We require parental or guardian involvement for bookings and limit collection to what is necessary to deliver the service. If you believe we collected a minor's data without appropriate authority, contact us for prompt deletion.`
  ),
  section(
    "retention",
    "9. Data retention",
    `We retain personal information only as long as necessary for the purposes described, including legal, accounting, and dispute resolution needs. When no longer needed, we delete or anonymize it within a reasonable period.`
  ),
  section(
    "rights",
    "10. Your rights",
    `Depending on applicable law (including the DPDP Act), you may have the right to access, correct, erase, withdraw consent, nominate a representative, or lodge a complaint with a supervisory authority.

To exercise rights, email ${PRIVACY_CONTACT} or use our contact page. We may verify your identity before responding.`
  ),
  section(
    "cookies",
    "11. Cookies and similar technologies",
    `We use essential cookies and similar technologies for authentication, session management, and security. We do not use advertising cookies. You can control cookies in your browser; disabling essential cookies may limit functionality.`
  ),
  section(
    "security",
    "12. Security",
    `We implement reasonable technical and organizational measures, including HTTPS, access controls, and hashed passwords. No method of transmission or storage is 100% secure.`
  ),
  section(
    "breach",
    "13. Data breach notification",
    `If we become aware of a personal data breach likely to affect your rights, we will notify you and relevant authorities as required by applicable law.`
  ),
  section(
    "changes",
    "14. Changes to this policy",
    `We may update this policy from time to time. We will revise the "Last updated" date and version number. Material changes may require you to accept the updated policy before continued use of account features.`
  ),
  section(
    "contact",
    "15. Contact us",
    `Privacy questions: ${PRIVACY_CONTACT} or /contact.`
  ),
];

const REFUND_SECTIONS: LegalSection[] = [
  section(
    "overview",
    "1. Overview",
    `This Refund and Cancellation Policy explains how cancellations, rescheduling, and refunds work for Verlin Labs free sessions and paid learning programs (typically ₹2,999–₹25,000 depending on track and offer).

By enrolling in a paid program, you agree to this policy in addition to our Terms of Service. Nothing here limits rights you may have under applicable consumer protection law in India.`
  ),
  section(
    "free-sessions",
    "2. Free introductory sessions",
    `The free 2-hour session requires no payment.

• You may reschedule or cancel using the link in your confirmation email.
• We ask for at least 24 hours' notice when possible so we can offer the slot to another learner.
• No-show without notice may limit future booking availability.
• Free sessions are not eligible for refunds because no fee is charged.`
  ),
  section(
    "paid-enrollment",
    "3. Paid program enrollment",
    `Enrollment in a paid program is confirmed only after we acknowledge receipt of payment per the instructions provided at checkout or enrollment.

Program fees, installment options (if any), and what is included (live sessions, materials, capstone support, etc.) are described on the relevant program page and in your enrollment confirmation.`
  ),
  section(
    "cooling-off",
    "4. Cooling-off period (before program start)",
    `If you cancel in writing to ${CONTACT} before your program's official start date and before accessing more than one (1) live session or substantial digital materials:

• Full refund of program fees paid, minus any non-refundable payment processing charges passed through by our payment provider (if applicable).
• Refunds are processed within 7–10 business days to the original payment method where possible.

To request cancellation, email ${CONTACT} with your name, enrollment email, program name, and reason (optional).`
  ),
  section(
    "after-start",
    "5. Cancellations after the program has started",
    `Once your program has started or you have attended more than one live session or accessed substantial course materials:

• Fees for sessions already delivered, mentor time already used, and digital materials already provided are non-refundable.
• If you must withdraw for documented medical or exceptional circumstances, contact us — we may offer a partial credit toward a future cohort at our discretion; this is not guaranteed.
• Introductory or promotional pricing is tied to the enrolled cohort and is not transferable without our written approval.`
  ),
  section(
    "rescheduling",
    "6. Rescheduling and cohort transfers",
    `If you need to defer participation:

• One complimentary cohort transfer may be available if requested at least 7 days before your cohort start and subject to seat availability.
• Additional transfers or late requests may incur an administrative fee or require re-enrollment at current list price.
• Corporate and team workshops follow the schedule agreed in your statement of work or proposal.`
  ),
  section(
    "no-show",
    "7. Missed sessions and no-shows",
    `Missed live sessions without 24 hours' notice are generally not refundable and may not be rescheduled unless we agree otherwise.

Recorded replays (where offered) are a courtesy for enrolled learners and do not extend refund eligibility for missed live attendance.`
  ),
  section(
    "chargebacks",
    "8. Chargebacks and disputes",
    `Please contact us before initiating a payment dispute or chargeback. We will work in good faith to resolve legitimate concerns.

Unfounded chargebacks after substantial program delivery may result in suspension of platform access and recovery of costs as permitted by law.`
  ),
  section(
    "corporate",
    "9. Corporate and team workshops",
    `Custom team programs are governed by the commercial terms in your proposal or invoice, including cancellation notice periods, rescheduling windows, and refund or credit terms for prepaid workshops.

For corporate inquiries, use our contact form (topic: Corporate / Team Program) or email ${CONTACT}.`
  ),
  section(
    "changes",
    "10. Changes to this policy",
    `We may update this policy from time to time. The version and "Last updated" date on this page reflect the current terms. Changes apply to new enrollments after publication unless otherwise stated in writing.`
  ),
  section(
    "contact",
    "11. Contact",
    `Refund and cancellation questions: ${CONTACT} or our contact page at /contact.`
  ),
];

const NOW = new Date().toISOString().slice(0, 10);

export function createDefaultLegalCms(): LegalCmsData {
  return {
    terms: {
      type: "terms",
      title: "Terms of Service",
      version: 1,
      lastUpdated: NOW,
      disclaimer: LEGAL_DISCLAIMER,
      sections: TERMS_SECTIONS,
    },
    privacy: {
      type: "privacy",
      title: "Privacy Policy",
      version: 1,
      lastUpdated: NOW,
      disclaimer: LEGAL_DISCLAIMER,
      sections: PRIVACY_SECTIONS,
    },
    refund: {
      type: "refund",
      title: "Refund & Cancellation Policy",
      version: 1,
      lastUpdated: NOW,
      disclaimer: LEGAL_DISCLAIMER,
      sections: REFUND_SECTIONS,
    },
  };
}