import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

function getLatestBlogPosts(count: number = 3) {
  try {
    const postsDirectory = path.join(process.cwd(), "src", "app", "blog", "posts");
    const fileNames = fs.readdirSync(postsDirectory);

    const posts = fileNames
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "");
        const filePath = path.join(postsDirectory, fileName);
        const fileContent = fs.readFileSync(filePath, "utf8");

        const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n/);
        let title = slug.replace(/-/g, " ");
        let date = new Date().toISOString().split("T")[0];
        let excerpt = "";

        if (frontmatterMatch) {
          const fm = frontmatterMatch[1];
          const titleMatch = fm.match(/title:\s*"?([^\n"]+)"?/);
          const dateMatch = fm.match(/date:\s*"?([^\n"]+)"?/);
          const excerptMatch = fm.match(/excerpt:\s*"?([^\n"]+)"?/);
          if (titleMatch) title = titleMatch[1];
          if (dateMatch) date = dateMatch[1];
          if (excerptMatch) excerpt = excerptMatch[1];
        }

        return {
          slug,
          title,
          date,
          excerpt: excerpt || `${title} - Learn more about managing your family's calendar and expenses.`,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);

    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: {
    default: "Zawly — Shared Family Calendar & Expenses",
    template: "%s | Zawly",
  },
  description:
    "Zawly brings your shared family calendar and household expenses together. Keep everyone in sync with appointments, school dates, routines, and budget tracking.",
  authors: [{ name: "Zawly" }],
  creator: "Zawly",
  metadataBase: new URL("https://zawly.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://zawly.app",
    siteName: "Zawly",
    title: "Zawly — Shared Family Calendar & Expenses",
    description:
      "Zawly brings your shared family calendar and household expenses together. Keep everyone in sync.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Zawly — One calm place for the family plan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zawly — Shared Family Calendar & Expenses",
    description:
      "Zawly brings your shared family calendar and household expenses together.",
    images: ["/icons/icon-512.png"],
    creator: "@zawlyapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Shared family calendar",
    desc: "Keep appointments, school dates, work plans, and recurring routines in one place everyone can see.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.536 60.536 0 0118.5 0M1.5 19.125a32.375 32.375 0 013.283-2.455l1.178-1.177a28.654 28.654 0 013.884-3.3m5.252 5.757a28.654 28.654 0 01-3.884-3.3l-1.178-1.177a32.375 32.375 0 00-3.283-2.455M15.75 9.75l-1.5-1.5m0 0l-1.5 1.5m1.5-1.5v6m6 3l-3-3m3 3l3-3" />
      </svg>
    ),
    title: "Simple household expenses",
    desc: "Track income, spending, and what is left this month without turning family life into a finance spreadsheet.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.721 9.721 0 01-3.956.97 9.764 9.764 0 01-5.488 0 9.721 9.721 0 01-3.956-.97M12 22.5c2.761 0 5.263-1.464 6.617-3.783a9.743 9.743 0 01-13.234 0C6.737 21.036 9.239 22.5 12 22.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    title: "Private family workspace",
    desc: "Create a family, invite trusted members, and keep schedules and spending organized around your household.",
  },
];

const steps = [
  "Invite your family with a private code.",
  "Add events once, including recurring routines.",
  "Record income and expenses as they happen.",
  "Use simple categories to keep spending readable.",
];

const faqs = [
  {
    q: "Is Zawly really free?",
    a: "Yes. Zawly is completely free to use for families. There are no paid feature gates, no premium tiers, and no complicated setup. We built it for our own families and want to keep it that way.",
  },
  {
    q: "Who can see our family calendar and expenses?",
    a: "Only the people you invite into your family group can see your calendar events and expense entries. We use secure authentication through Clerk, and your data is never shared with third parties or other families.",
  },
  {
    q: "Can I use Zawly on my phone?",
    a: "Absolutely. Zawly is mobile-first — designed to work beautifully on phones and tablets. Add events, log expenses, and check your family schedule from anywhere.",
  },
  {
    q: "What happens if I delete my account?",
    a: "You can delete your account at any time. Your personal data is removed from our systems. Events, income entries, expense entries, and categories you created within a family group may remain accessible to other members of that group even after your account is deleted.",
  },
  {
    q: "Do I need to install anything?",
    a: "No installation needed. Zawly runs in your web browser on any device — phone, tablet, or computer. Just sign up and start using it immediately.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://zawly.app/#app",
      name: "Zawly",
      description: "Shared family calendar and household expenses app for families.",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "120",
      },
    },
    {
      "@type": "WebPage",
      "@id": "https://zawly.app/#webpage",
      url: "https://zawly.app",
      name: "Zawly — Shared Family Calendar & Expenses",
      description: "Zawly brings your shared family calendar and household expenses together.",
      publisher: { "@id": "https://zawly.app/#organization" },
      mainEntity: { "@id": "https://zawly.app/#app" },
    },
    {
      "@type": "Organization",
      "@id": "https://zawly.app/#organization",
      name: "Zawly",
      url: "https://zawly.app",
      logo: {
        "@type": "ImageObject",
        url: "https://zawly.app/icons/icon-512.png",
        width: 512,
        height: 512,
      },
      sameAs: ["https://twitter.com/zawlyapp"],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      })),
    },
  ],
};

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-full flex flex-col bg-background">
        <main className="flex-grow">
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/8 blur-[60px]" />
              <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-secondary/8 blur-[60px]" />
              <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] rounded-full bg-accent/5 blur-[40px]" />
            </div>

            <div className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto">
              <div className="grid gap-12 xl:grid-cols-[1fr_1.2fr] xl:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Image
                      src="/icons/icon-192.png"
                      alt="Zawly"
                      width={48}
                      height={48}
                      className="rounded-xl"
                      priority
                    />
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                      Zawly
                    </span>
                  </div>

                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-text-primary font-[family-name:var(--font-heading)]">
                    One calm place for the{" "}
                    <span className="text-primary">family plan</span>.
                  </h1>

                  <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed">
                    Zawly brings your shared calendar and household expenses together,
                    so everyone can see what is happening and what has been spent.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl"
                    >
                      Get started — free
                    </Link>
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-border bg-surface text-text-primary font-bold hover:bg-surface-alt transition-colors"
                    >
                      Sign in
                    </Link>
                  </div>

                  <p className="mt-4 text-sm text-text-tertiary">
                    No credit card · No setup fees · Always free
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/20 via-secondary/10 to-accent/20 blur-2xl opacity-60" />

                  <div className="relative rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-text-primary/10">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                          Family workspace
                        </p>
                        <p className="font-bold text-text-primary text-sm">The Carter house</p>
                      </div>
                      <div className="flex -space-x-2">
                        {["M", "L", "S"].map((initial, i) => (
                          <span
                            key={initial}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white"
                            style={{ backgroundColor: ["#7C9A7E", "#4F83C2", "#D9903D"][i] }}
                          >
                            {initial}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: "Today", value: "3 events" },
                        { label: "Income", value: "£2,400" },
                        { label: "Spent", value: "£1,760" },
                        { label: "Left", value: "£640" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col justify-between rounded-xl border border-border bg-background p-3 min-h-[72px]"
                        >
                          <p className="text-[11px] font-medium text-text-tertiary">{item.label}</p>
                          <p className="text-sm font-bold text-text-primary">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-text-primary text-sm">Today</p>
                          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-bold text-primary">
                            Thursday
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { time: "3:15", title: "School pickup" },
                            { time: "4:30", title: "Dentist" },
                            { time: "7:00", title: "Dinner with Sam" },
                          ].map((event) => (
                            <div
                              key={event.title}
                              className="grid grid-cols-[44px_1fr_auto] items-center gap-3"
                            >
                              <p className="text-sm font-bold text-text-primary">{event.time}</p>
                              <p className="truncate font-medium text-text-primary text-sm">
                                {event.title}
                              </p>
                              <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-xs text-text-secondary">Left this month</p>
                          <p className="mt-1 text-2xl font-bold text-green-600">£640</p>
                          <div className="mt-3 h-2 rounded-full bg-surface-alt overflow-hidden">
                            <div className="h-full w-[68%] rounded-full bg-primary" />
                          </div>
                          <p className="mt-2 text-[11px] text-text-tertiary">Spent 68%</p>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="font-semibold text-text-primary text-sm mb-3">Recent money</p>
                          <div className="space-y-2">
                            {[
                              { label: "Groceries", detail: "Food", value: "-£42.18", color: "#7C9A7E" },
                              { label: "Salary", detail: "Income", value: "+£2,400", color: "#159A73" },
                              { label: "Childcare", detail: "Kids", value: "-£120", color: "#8B5CF6" },
                            ].map((row) => (
                              <div
                                key={row.label}
                                className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt px-3 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: row.color }}
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-text-primary">
                                      {row.label}
                                    </p>
                                    <p className="text-[11px] text-text-tertiary">{row.detail}</p>
                                  </div>
                                </div>
                                <p
                                  className={
                                    row.value.startsWith("+")
                                      ? "text-sm font-bold text-green-600"
                                      : "text-sm font-bold text-red-500"
                                  }
                                >
                                  {row.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary mb-3">
                Everything in one place
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Built for real family life
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-text-primary">{f.title}</h3>
                  <p className="mt-2 text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary mb-3">
                  How it works
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-heading)] mb-4">
                  Repeat family admin, simplified
                </h2>
                <p className="text-text-secondary">
                  Add the people in your household, put the calendar in one shared place, and
                  record the expenses that matter. Zawly stays simple so it is easy to keep using.
                </p>
              </div>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl bg-surface border border-border p-4 hover:border-primary/30 transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="font-medium text-text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary mb-3">
                From the blog
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Latest tips for family life
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {getLatestBlogPosts(3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-surface border border-border rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-text-primary group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-text-secondary text-base">{post.excerpt}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-text-tertiary">
                        {new Date(post.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="px-6 py-16 md:py-20 max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary mb-3">
                Got questions?
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Frequently asked questions
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-border bg-surface overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer select-none list-none">
                    <span className="font-semibold text-text-primary">{q}</span>
                    <svg
                      className="w-5 h-5 text-text-tertiary group-open:rotate-180 transition-transform shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-text-secondary text-sm leading-relaxed">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="px-6 pb-20 md:pb-28">
            <div className="max-w-4xl mx-auto text-center">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-[#4A5E4C] p-8 md:p-14 shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-heading)]">
                  Ready to bring your family together?
                </h2>
                <p className="mt-3 text-white/80 max-w-lg mx-auto">
                  Start using Zawly today. No credit card, no setup fees, no clutter.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-6 inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors shadow-lg"
                >
                  Get started — free forever
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
