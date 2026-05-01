import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Zawly",
  description: "Privacy policy for Zawly, the free family calendar and household expenses app. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-background text-text-primary selection:bg-primary-light flex flex-col">
      <article className="max-w-2xl mx-auto px-6 py-12 md:py-16 flex-grow">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-tertiary mb-10">
          Last updated: April 2026
        </p>

        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <p className="italic">
              We built Zawly for our own families, so we understand how important it is that your personal
              information is handled with care. This policy explains what data we collect, why we collect it,
              how we use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">1. Information We Collect</h2>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Account Information</h3>
            <p>
              When you sign up, we collect your name and email address through our authentication provider
              (Clerk). This information is necessary to create and manage your account.
            </p>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Calendar Data</h3>
            <p>
              The events you create — including titles, dates, times, recurrence rules, and notes —
              are stored on our servers so they can be shared within your family
              group.
            </p>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Expense &amp; Budget Data</h3>
            <p>
              If you use Expenses, we store household income entries, expense entries, descriptions, amounts,
              dates, repeat periods, categories, and category colours so your family can view
              and manage shared spending. You should avoid entering bank account numbers, card numbers,
              tax identifiers, or other highly sensitive financial details in free-text fields.
            </p>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Family Group Data</h3>
            <p>
              When you create or join a family, we store your family name and the relationships between
              members. Invite codes are generated to allow trusted people to join your family group.
            </p>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Usage Data</h3>
            <p>
              We collect anonymous, aggregated analytics — such as page views and feature usage patterns —
              to understand how Zawly is used and to improve the product. This data cannot be traced back
              to individual users.
            </p>

            <h3 className="font-semibold text-text-primary mt-4 mb-2">Device Information</h3>
            <p>
              We may collect standard technical information such as browser type, operating system, and
              screen resolution. This helps us ensure Zawly works well across different devices and
              browsers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide, maintain, and improve the Zawly service</li>
              <li>Create and manage your account and family group</li>
              <li>Share calendar events and household expense information with your family members, as intended</li>
              <li>Communicate with you about your account or service updates</li>
              <li>Monitor for abuse, security issues, and policy violations</li>
              <li>Improve user experience through anonymized analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">3. How We Share Your Information</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. Your data is shared
              only in the following circumstances:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Within your family group:</strong> Calendar events, household expense information, and your name are visible to
                other members of your family group. This is a core feature of Zawly.
              </li>
              <li>
                <strong>Service providers:</strong> We rely on trusted third-party services to operate Zawly.
                These include Clerk (authentication), our cloud hosting provider (infrastructure), and
                analytics tools. Each provider is contractually obligated to protect your data.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose information if required by law or in
                response to a valid legal request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">4. Data Security</h2>
            <p>
              We take reasonable measures to protect your data, including encryption in transit (HTTPS),
              secure authentication, and access controls. However, no method of electronic transmission or
              storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">5. Data Retention</h2>
            <p>
              We retain your account information, calendar data, and expense and budget data for as long as your account is active.
              If you delete your account, we will remove your personal data from our systems within a
              reasonable timeframe. Events, income entries, expense entries, and categories you created
              within a family group may remain accessible to other members of that group even
              after your account is deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">6. Cookies &amp; Local Storage</h2>
            <p>
              Zawly uses essential cookies and local storage to keep you signed in and to store your
              preferences (such as your theme preference). We do not use tracking cookies or
              advertising networks. Analytics are collected in an anonymized, privacy-respecting manner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">7. Your Rights &amp; Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — Update or correct your account information at any time through Settings</li>
              <li><strong>Deletion</strong> — Request that we delete your account and associated data</li>
              <li><strong>Portability</strong> — Request an export of your calendar and expense data</li>
              <li><strong>Objection</strong> — Object to processing of your data for specific purposes</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:support@zawly.app" className="text-primary hover:underline">
                support@zawly.app
              </a>. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Zawly is designed for family use, but users must be at least 13 years old to create an
              account. We do not knowingly collect personal information from children under 13. If we
              learn that we have collected data from a child under 13, we will take steps to delete
              that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">9. International Users</h2>
            <p>
              Zawly is operated from the United States. If you access the Service from outside the US,
              please be aware that your information may be transferred to, stored, and processed on
              servers located in the United States. By using Zawly, you consent to this transfer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make changes, we will update
              the &quot;Last updated&quot; date at the top of this page and, for significant changes, we will
              provide additional notice (such as an in-app notification or email). We encourage you to
              review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-3">11. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or your data, please contact us at{" "}
              <a href="mailto:support@zawly.app" className="text-primary hover:underline">
                support@zawly.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline text-sm">
            ← Back to Zawly
          </Link>
        </div>
      </article>
    </div>
  );
}
