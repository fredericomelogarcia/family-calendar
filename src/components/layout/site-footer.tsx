import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="shrink-0 px-6 py-12 border-t border-border bg-surface-alt/50">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
        <p className="text-sm text-text-tertiary">
          &copy; {new Date().getFullYear()} Zawly
        </p>
        <p className="text-sm text-text-tertiary">
          Built with ❤️ for families everywhere.
        </p>
        <nav className="flex items-center gap-4">
          <Link
            href="/terms"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}