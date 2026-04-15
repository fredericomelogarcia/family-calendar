import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full bg-background text-text-primary flex flex-col landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-background/95 border-b border-border">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
            aria-label="Zawly logo"
          >
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="font-bold text-lg">Zawly</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/sign-in" 
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/sign-up" 
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-24">
        {/* Hero Section - Original Copy */}
        <section className="px-6 max-w-5xl mx-auto text-center mb-12">
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Your family&apos;s rhythm, <br />
            <span className="text-primary">perfectly in sync.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Stop the &quot;who is doing what&quot; chaos. Zawly Calendar is a warm, mobile-first shared calendar 
            designed to keep your household organized and connected.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-up"
              className="group px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors shadow-lg flex items-center gap-2"
            >
              Start Your Family Calendar
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Features Grid - Original Copy */}
        <section className="px-6 max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon="mobile"
              title="Mobile First"
              description="Designed for the kitchen tablet or the pocket. Access your family schedule anywhere, instantly, without the clutter of corporate tools."
            />
            <FeatureCard 
              icon="users"
              title="Shared Harmony"
              description="One source of truth for everyone. No more fragmented texts or forgotten appointments. Everyone knows the plan."
            />
            <FeatureCard 
              icon="clock"
              title="Effortless Setup"
              description="Get your family onboarded in seconds. Simple invites and intuitive interfaces that even the kids can learn to use."
            />
          </div>
        </section>

        {/* Pricing/Trust Section - Original Copy */}
        <section className="px-6 max-w-4xl mx-auto mb-16">
          <div className="relative p-1 rounded-3xl bg-primary shadow-xl">
            <div className="bg-surface rounded-[calc(1.5rem-4px)] p-6 md:p-10 text-center">
              <h2 
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Zero stress, zero cost.
              </h2>
              <p className="text-md text-text-secondary mb-6 max-w-lg mx-auto">
                We believe organizing your family life shouldn&apos;t come with a monthly subscription. 
                That&apos;s why Zawly Calendar is completely free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-8">
                <Link
                  href="/sign-up"
                  className="group px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors shadow-lg flex items-center gap-2"
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

      <SiteFooter />
    </div>
  );
}

// Server Component feature card
function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: 'mobile' | 'users' | 'clock';
  title: string; 
  description: string;
}) {
  const icons = {
    mobile: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197 13.5 13.5 0 00-3 .197M13.5 6.5a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  };

  return (
    <div className="p-6 rounded-3xl bg-surface border border-border hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icons[icon]}
      </div>
      <h3 
        className="text-lg font-bold mb-2"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {title}
      </h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  );
}
