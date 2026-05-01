import type { Metadata, Viewport } from "next";
import { Nunito, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Zawly",
    template: "%s | Zawly",
  },
  description:
    "A warm, mobile-first family workspace for calendars and household expenses.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zawly",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#7C9A7E",
  },
  authors: [{ name: "Zawly" }],
  creator: "Zawly",
  metadataBase: new URL("https://zawly.app"),
  twitter: {
    card: "summary_large_image",
    site: "@zawlyapp",
    creator: "@zawlyapp",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://zawly.app",
    siteName: "Zawly",
    title: "Zawly",
    description:
      "A warm, mobile-first family workspace for calendars and household expenses.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Zawly" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#7C9A7E",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://zawly.app/#organization",
      name: "Zawly",
      url: "https://zawly.app",
      logo: {
        "@type": "ImageObject",
        url: "https://zawly.app/icons/icon-512.png",
        width: 512,
        height: 512,
      },
      sameAs: ["https://twitter.com/zawlyapp"],
    },
    {
      "@type": "WebSite",
      "@id": "https://zawly.app/#website",
      url: "https://zawly.app",
      name: "Zawly",
      description: "A warm, mobile-first family workspace for calendars and household expenses.",
      publisher: { "@id": "https://zawly.app/#organization" },
      potentialAction: [
        {
          "@type": "SearchAction",
          target: "https://zawly.app/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      ],
    },
  ],
};

// Root layout with ClerkProvider - wraps entire app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${nunito.variable} ${inter.variable} ${jetbrainsMono.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Preconnect to external domains for faster font/script loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://clerk.zawly.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
