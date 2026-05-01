import { AuthProvider } from "@/app/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";
import Link from "next/link";
import Script from "next/script";

export const metadata = {
  title: {
    default: "Blog — Zawly",
    template: "%s | Zawly Blog",
  },
  description:
    "Read our blog for tips on family calendar management, household budgeting, and productivity.",
  authors: [{ name: "Zawly" }],
  creator: "Zawly",
  metadataBase: new URL("https://zawly.app"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://zawly.app/blog",
    siteName: "Zawly Blog",
    title: "Blog — Zawly",
    description:
      "Read our blog for tips on family calendar management, household budgeting, and productivity.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Zawly Blog — Family calendar and expense tips",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Zawly",
    description:
      "Read our blog for tips on family calendar management, household budgeting, and productivity.",
    images: ["/icons/icon-512.png"],
    creator: "@zawlyapp",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://zawly.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://zawly.app/blog"
      }
    ]
  };

  return (
    <AuthProvider>
      <div className="min-h-dvh flex flex-col">
        <PublicNavbar variant="fixed" showSignUp={true} />
        <div className="flex-1 flex flex-col pt-20">
          {children}
          <Script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
        </div>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
