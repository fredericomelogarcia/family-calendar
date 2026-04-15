import Link from "next/link";
import { WarningIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicNavbar variant="fixed" showSignUp={true} />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-20">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-primary-light/20 flex items-center justify-center text-primary shadow-inner">
              <WarningIcon size={48} weight="duotone" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] mb-4 text-text-primary">
            Lost in the clouds?
          </h1>
          
          <p className="text-lg text-text-secondary mb-10">
            We couldn't find the page you're looking for. It might have moved, 
            been deleted, or perhaps it never existed in the first place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="group px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <HouseIcon size={20} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
