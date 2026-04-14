import Link from "next/link";
import { Warning, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-primary-light/20 flex items-center justify-center text-primary shadow-inner">
            <Warning size={48} weight="duotone" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] mb-4">
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
            <House size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
