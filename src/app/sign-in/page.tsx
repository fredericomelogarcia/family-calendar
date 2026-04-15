import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary text-center">Welcome Back</h1>
          <p className="text-text-secondary mt-2 text-center">Sign in to manage your family calendar</p>
        </div>

        <form className="bg-surface p-8 rounded-2xl shadow-lg border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-text-secondary">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
