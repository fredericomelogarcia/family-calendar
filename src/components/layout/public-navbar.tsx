import Link from "next/link";
import Image from "next/image";

interface PublicNavbarProps {
  variant?: "fixed" | "sticky";
  showSignUp?: boolean;
}

export function PublicNavbar({ variant = "fixed", showSignUp = true }: PublicNavbarProps) {
  const positionClass = variant === "fixed" ? "fixed top-0" : "sticky top-0";
  
  return (
    <nav className={`${positionClass} w-full z-50 px-6 py-4 flex justify-between items-center bg-background border-b border-border`}>
      <Link href="/" className="flex items-center gap-2">
        <Image 
          src="/icons/icon-192.png" 
          alt="Zawly" 
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span className="font-bold text-lg">Zawly</span>
      </Link>
      <div className="flex gap-3">
        <Link 
          href="/sign-in" 
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-surface-alt transition-colors"
        >
          Sign In
        </Link>
        {showSignUp && (
          <Link 
            href="/sign-up" 
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>
    </nav>
  );
}
