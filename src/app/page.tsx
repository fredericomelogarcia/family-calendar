import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { 
  House, 
  CalendarBlank, 
  Users, 
  CheckCircle, 
  DeviceMobile, 
  Heart, 
  Clock,
  ArrowRight
} from "@phosphor-icons/react/dist/ssr";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary-light flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <span className="font-bold text-lg font-[family-name:var(--font-heading)]">Famly</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/sign-in" 
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
          >
            Sign In
          </Link>
          <Link 
            href="/sign-up" 
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-30 flex-grow">
        {/* Hero Section */}
        <section className="px-6 max-w-5xl mx-auto text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] mb-4 leading-tight">
            Your family's rhythm, <br />
            <span className="text-primary">perfectly in sync.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Stop the "who is doing what" chaos. Famly is a warm, mobile-first shared calendar 
            designed to keep your household organized and connected.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-up"
              className="group w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              Start Your Family Calendar
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow animate-slide-up">
              <div className="w-10 h-10 rounded-2xl bg-primary-light/20 flex items-center justify-center text-primary mb-4">
                <DeviceMobile size={20} />
              </div>
              <h3 className="text-lg font-bold mb-2">Mobile First</h3>
              <p className="text-text-secondary text-sm">
                Designed for the kitchen tablet or the pocket. Access your family schedule 
                anywhere, instantly, without the clutter of corporate tools.
              </p>
            </div>
            
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="w-10 h-10 rounded-2xl bg-secondary-light/20 flex items-center justify-center text-secondary mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold mb-2">Shared Harmony</h3>
              <p className="text-text-secondary text-sm">
                One source of truth for everyone. No more fragmented texts or 
                forgotten appointments. Everyone knows the plan.
              </p>
            </div>
            
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-4">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold mb-2">Effortless Setup</h3>
              <p className="text-text-secondary text-sm">
                Get your family onboarded in seconds. Simple invites and intuitive 
                interfaces that even the kids can learn to use.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing/Trust Section */}
        <section className="px-6 max-w-4xl mx-auto mb-16">
          <div className="relative p-1 rounded-3xl bg-primary shadow-xl">
            <div className="bg-surface rounded-[calc(1.5rem-4px)] p-6 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Zero stress, zero cost.</h2>
              <p className="text-md text-text-secondary mb-6 max-w-lg mx-auto">
                We believe organizing your family life shouldn't come with a monthly subscription. 
                That's why Famly is completely free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-8">
            <Link
              href="/sign-up"
              className="group w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              Start Your Family Calendar
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
              <div className="inline-block px-6 py-2 rounded-full bg-surface-alt border border-border font-bold text-text-primary text-lg">
                Free forever
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border bg-surface-alt/50">
        <div className="flex flex-row justify-center">
          <p className="text-sm text-text-tertiary">
            © {new Date().getFullYear()} Famly. Built with ❤️ for families everywhere.
          </p>
          </div>
      </footer>
    </div>
  );
}
