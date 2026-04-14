import type { Metadata, Viewport } from "next";
import { Nunito, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { ToastContainer } from "@/components/ui/toast";
import { BottomNav, Sidebar } from "@/components/layout/navigation";
import { MainContent } from "@/components/layout/main-content";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Famly - Family Calendar",
  description: "A warm, mobile-first family calendar that keeps your household in sync.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Famly",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C9A7E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Inline script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("famly-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"#1A1A1F":"#7C9A7E");}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
          <div className="flex h-full">
            {/* Sidebar - Desktop */}
            <Sidebar />
            
            {/* Main content */}
            <MainContent>
              {children}
            </MainContent>
          </div>
          
          {/* Bottom Nav - Mobile */}
          <BottomNav />
          </SidebarProvider>
          
          {/* Toast notifications */}
          <ToastContainer />
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}