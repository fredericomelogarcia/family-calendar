import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// LANDING PAGE - Zero Clerk.js, zero heavy components
export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="font-bold text-lg text-text-primary">Zawly</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in" className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-surface-alt transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-24">
        <section className="px-6 max-w-3xl mx-auto text-center py-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-text-primary">
            Your family&apos;s rhythm,
            <br />
            <span className="text-primary">perfectly in sync.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Stop the &quot;who is doing what&quot; chaos. Zawly Calendar is a warm, mobile-first shared calendar designed to keep your household organized and connected.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="inline-block px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors shadow-lg">
              Start Your Family Calendar →
            </Link>
          </div>
        </section>

        <section className="px-6 max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">📱</div>
              <h3 className="text-lg font-bold mb-2 text-text-primary">Mobile First</h3>
              <p className="text-text-secondary text-sm">Designed for the kitchen tablet or the pocket. Access your family schedule anywhere, instantly.</p>
            </div>
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-lg font-bold mb-2 text-text-primary">Shared Harmony</h3>
              <p className="text-text-secondary text-sm">One source of truth for everyone. No more fragmented texts or forgotten appointments.</p>
            </div>
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4">⚡</div>
              <h3 className="text-lg font-bold mb-2 text-text-primary">Effortless Setup</h3>
              <p className="text-text-secondary text-sm">Get your family onboarded in seconds. Simple invites that even the kids can learn to use.</p>
            </div>
          </div>
        </section>

        <section className="px-6 max-w-4xl mx-auto mb-16">
          <div className="relative p-1 rounded-3xl bg-primary shadow-xl">
            <div className="bg-surface rounded-[calc(1.5rem-4px)] p-6 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-text-primary">Zero stress, zero cost.</h2>
              <p className="text-text-secondary mb-6 max-w-lg mx-auto">We believe organizing your family life shouldn&apos;t come with a monthly subscription. Zawly Calendar is completely free.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-8">
                <Link href="/sign-up" className="inline-block px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors shadow-lg">
                  Start Your Family Calendar →
                </Link>
              </div>
              <div className="inline-block px-6 py-2 rounded-full bg-surface-alt border border-border font-bold text-text-primary text-lg">
                Free forever
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-12 border-t border-border bg-surface-alt">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
          <p className="text-sm text-text-tertiary">© {new Date().getFullYear()} Zawly Calendar</p>
          <nav className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-text-tertiary hover:text-text-secondary">Terms & Conditions</Link>
            <Link href="/privacy" className="text-xs text-text-tertiary hover:text-text-secondary">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
