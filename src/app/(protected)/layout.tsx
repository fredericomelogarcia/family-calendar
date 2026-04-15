import { Nunito, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/app/providers";
import { ToastContainer } from "@/components/ui/toast";
import { BottomNav, Sidebar } from "@/components/layout/navigation";
import { MainContent } from "@/components/layout/main-content";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { LazyAnalytics } from "@/components/analytics/lazy-analytics";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
});

// Protected layout - light theme only
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <AuthProvider>
        <SidebarProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <MainContent>{children}</MainContent>
          </div>
          <BottomNav />
        </SidebarProvider>
        <ToastContainer />
      </AuthProvider>
      <LazyAnalytics />
    </div>
  );
}
