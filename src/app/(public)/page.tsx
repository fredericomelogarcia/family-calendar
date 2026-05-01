import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const featureCards = [
  {
    title: "Shared family calendar",
    text: "Keep appointments, school dates, work plans, and recurring routines in one place everyone can see.",
  },
  {
    title: "Simple household expenses",
    text: "Track income, spending, and what is left this month without turning family life into a finance spreadsheet.",
  },
  {
    title: "Private family workspace",
    text: "Create a family, invite trusted members, and keep schedules and spending organized around your household.",
  },
];

const expenseRows = [
  { label: "Groceries", detail: "Food", value: "-£42.18", color: "#7C9A7E" },
  { label: "Salary", detail: "Income", value: "+£2,400.00", color: "#159A73" },
  { label: "Childcare", detail: "Kids", value: "-£120.00", color: "#8B5CF6" },
];

const scheduleRows = [
  { time: "3:15", title: "School pickup" },
  { time: "4:30", title: "Dentist" },
  { time: "7:00", title: "Dinner with Sam" },
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      <main className="flex-grow">
        <section className="px-6 py-14 md:py-20">
          <div className="max-w-7xl mx-auto grid gap-10 xl:grid-cols-[0.82fr_1.18fr] xl:items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Image src="/icons/icon-192.png" alt="Zawly" width={44} height={44} className="rounded-xl" priority />
                <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Zawly</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-text-primary font-[family-name:var(--font-heading)]">
                One calm place for the family plan.
              </h1>
              <p className="text-lg md:text-xl text-text-secondary mt-5 max-w-2xl">
                Zawly brings your shared calendar and household expenses together, so everyone can see what is happening and what has been spent.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link href="/sign-up" className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg">
                  Get started
                </Link>
                <Link href="/sign-in" className="inline-flex items-center justify-center px-7 py-3 rounded-xl border border-border bg-surface text-text-primary font-bold hover:bg-surface-alt transition-colors">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 shadow-xl shadow-text-primary/10 xl:min-w-[680px]">
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-alt px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">Family workspace</p>
                    <p className="font-bold text-text-primary">The Carter house</p>
                  </div>
                  <div className="flex -space-x-2">
                    {["M", "L", "S"].map((initial, index) => (
                      <span
                        key={initial}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white"
                        style={{ backgroundColor: ["#7C9A7E", "#4F83C2", "#D9903D"][index] }}
                      >
                        {initial}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                      { label: "Today", value: "3 events" },
                      { label: "Income", value: "£2,400" },
                      { label: "Spent", value: "£1,760" },
                      { label: "Left", value: "£640" },
                    ].map((item) => (
                      <div key={item.label} className="flex min-h-[72px] flex-col justify-between rounded-lg border border-border bg-surface p-3">
                        <p className="text-[11px] font-medium text-text-tertiary">{item.label}</p>
                        <p className="text-sm font-bold text-text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-text-primary">Today</p>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Thursday</span>
                      </div>
                      <div className="space-y-3">
                        {scheduleRows.map((event) => (
                          <div key={event.title} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                            <p className="text-sm font-bold text-text-primary">{event.time}</p>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text-primary">{event.title}</p>
                            </div>
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-border bg-surface p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-text-secondary">Left this month</p>
                            <p className="mt-1 text-3xl font-bold text-green-600">£640</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full w-[68%] rounded-full bg-primary" />
                        </div>
                        <div className="mt-3 flex justify-between text-xs text-text-tertiary">
                          <span>Income</span>
                          <span>Spent 68%</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-text-primary">Recent money</p>
                          <p className="text-xs text-text-tertiary">April</p>
                        </div>
                        <div className="space-y-2">
                          {expenseRows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-text-primary">{row.label}</p>
                                  <p className="text-xs text-text-tertiary">{row.detail}</p>
                                </div>
                              </div>
                              <p className={row.value.startsWith("+") ? "text-sm font-bold text-green-600" : "text-sm font-bold text-red-500"}>{row.value}</p>
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

        <section className="px-6 max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-4">
            {featureCards.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-surface border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-2 text-text-primary">{feature.title}</h2>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 max-w-6xl mx-auto mb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary mb-3">How it works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-heading)] mb-4">
                Built for repeat family admin.
              </h2>
              <p className="text-text-secondary">
                Add the people in your household, put the calendar in one shared place, and record the expenses that matter. Zawly stays simple so it is easy to keep using.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                "Invite your family with a private code.",
                "Add events once, including recurring routines.",
                "Record income and expenses as they happen.",
                "Use simple categories to keep spending readable.",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-xl bg-surface border border-border p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <p className="font-medium text-text-primary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 max-w-4xl mx-auto mb-16 text-center">
          <div className="rounded-xl bg-surface border border-border p-6 md:p-10 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-text-primary font-[family-name:var(--font-heading)]">
              Free for families.
            </h2>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Zawly is free to use. No paid feature gates, no complicated setup, no corporate calendar clutter.
            </p>
            <Link href="/sign-up" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg">
              Start with Zawly
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
