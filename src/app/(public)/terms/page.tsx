import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — Zawly Calendar",
  description: "Terms and conditions for using Zawly Calendar, the free family calendar app.",
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-background text-text-primary selection:bg-primary-light flex flex-col">
      <article className="max-w-2xl mx-auto px-6 py-12 md:py-16 flex-grow">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] mb-2">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-text-tertiary mb-10">
          Last updated: June 2025
        </p>

        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Zawly Calendar (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions.
              If you do not agree with any part of these terms, you may not use the Service. These terms apply to
              all visitors, users, and others who access Zawly Calendar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">2. Description of Service</h2>
            <p>
              Zawly Calendar is a free, mobile-first shared calendar application designed for families to coordinate
              schedules, events, and appointments. The Service allows you to create a family group, invite
              members via a shareable invite code, and manage shared calendar events including recurring
              events, and assignments.
            </p>
            <p className="mt-3">
              Zawly Calendar is provided free of charge. We offer an optional support plan that allows users to
              contribute financially, but it does not unlock additional features or change the terms
              described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">3. Account Registration</h2>
            <p>
              To use Zawly Calendar, you must create an account through our authentication provider. You are responsible
              for maintaining the confidentiality of your login credentials and for all activities that occur
              under your account. You must be at least 13 years old to create an account.
            </p>
            <p className="mt-3">
              You agree to provide accurate and complete information during registration and to update
              your information as necessary to keep it current.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">4. Family Groups &amp; Invite Codes</h2>
            <p>
              When you create a family, you become its administrator. As an admin, you can rename the family
              and regenerate its invite code. Invite codes are designed to be shared with people you trust —
              your family members. Anyone with a valid invite code can join your family group and access
              all shared calendar events.
            </p>
            <p className="mt-3">
              Each family group supports up to 6 members. If you need additional capacity, please contact us.
              You may leave a family group at any time from the Settings page. Leaving removes your access
              to the shared calendar. If you are the admin, you must transfer ownership before leaving.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">5. Your Content</h2>
            <p>
              You retain ownership of the events, notes, and other content you create in Zawly Calendar. By adding
              content to a shared family calendar, you grant other family members the ability to view and,
              where applicable, edit that content within the context of the family group.
            </p>
            <p className="mt-3">
              You are responsible for ensuring that the content you add does not violate any applicable laws
              or infringe on the rights of others. We reserve the right to remove content that violates
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">6. Acceptable Use</h2>
            <p>You agree not to use Zawly Calendar to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Share content that is unlawful, harmful, threatening, or harassing</li>
              <li>Impersonate another person or misrepresent your affiliation</li>
              <li>Attempt to gain unauthorized access to another user&apos;s account</li>
              <li>Interfere with or disrupt the Service&apos;s infrastructure</li>
              <li>Use the Service for any automated or commercial purpose without permission</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract the source code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">7. Availability &amp; Modifications</h2>
            <p>
              Zawly Calendar is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted access, and
              we may modify, suspend, or discontinue the Service at any time. We will make reasonable efforts
              to notify users of significant changes.
            </p>
            <p className="mt-3">
              We may update these Terms from time to time. Continued use of the Service after changes are
              posted constitutes acceptance of the revised terms. We will indicate the &quot;Last updated&quot; date
              at the top of this page whenever revisions are made.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Zawly Calendar and its creators shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of
              the Service, including but not limited to loss of data, missed appointments, or any other
              damages resulting from service interruptions or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">9. Data &amp; Privacy</h2>
            <p>
              Your privacy matters to us. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for details on how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">10. Termination</h2>
            <p>
              You may delete your account at any time through your account settings or by contacting us.
              Upon deletion, your personal data will be removed in accordance with our Privacy Policy.
              Events you created within a family group may remain visible to other members of that group.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms, with or
              without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">11. Contact</h2>
            <p>
              If you have questions about these Terms or need to report a violation, please reach out to us at{" "}
              <a href="mailto:support@zawly.app" className="text-primary hover:underline">
                support@zawly.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline text-sm">
            ← Back to Zawly Calendar
          </Link>
        </div>
      </article>
    </div>
  );
}
