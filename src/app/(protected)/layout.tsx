import { Nunito, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/app/providers";
import { ThemeProvider } from "@/lib/theme";
import { ToastContainer } from "@/components/ui/toast";
import { BottomNav, Sidebar } from "@/components/layout/navigation";
import { MainContent } from "@/components/layout/main-content";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Protected layout - includes Clerk, Theme, Sidebar
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex min-h-dvh">
              <Sidebar />
              <MainContent>{children}</MainContent>
            </div>
            <BottomNav />
          </SidebarProvider>
          <ToastContainer />
        </ThemeProvider>
      </AuthProvider>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
