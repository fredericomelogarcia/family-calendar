import { AuthProvider } from "@/app/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-dvh flex flex-col">
        <PublicNavbar variant="fixed" showSignUp={true} />
        <div className="flex-1 flex flex-col pt-16">{children}</div>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
