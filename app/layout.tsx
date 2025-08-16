import type { Metadata } from "next";
import { Doto, Besley } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const doto = Doto({
  variable: "--font-sans",
  subsets: ["latin"],
});

const besley = Besley({
  variable: "--font-serif",
  subsets: ["latin"],
});

// Note: Google Sans Code is not available via next/font/google
// It's defined in CSS as fallback with system fonts

export const metadata: Metadata = {
  metadataBase: new URL('https://mudabbirulsaad.com'),
  title: {
    default: "SAAD - Mudabbirul Saad | AI Student & Developer Portfolio",
    template: "%s | SAAD - Mudabbirul Saad"
  },
  description: "Professional portfolio of Mudabbirul Saad - AI Student at Swinburne University building beautiful and intelligent digital experiences with React, Next.js, Python, and Machine Learning.",
  keywords: [
    "Mudabbirul Saad",
    "SAAD",
    "AI Student",
    "Artificial Intelligence",
    "Swinburne University",
    "React Developer",
    "Next.js",
    "Python",
    "Machine Learning",
    "Web Development",
    "Portfolio",
    "Melbourne",
    "Australia",
    "Frontend Developer",
    "Full Stack Developer"
  ],
  authors: [{ name: "Mudabbirul Saad", url: "https://mudabbirulsaad.com" }],
  creator: "Mudabbirul Saad",
  publisher: "Mudabbirul Saad",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://mudabbirulsaad.com",
    title: "SAAD - Mudabbirul Saad | AI Student & Developer Portfolio",
    description: "Professional portfolio of Mudabbirul Saad - AI Student at Swinburne University building beautiful and intelligent digital experiences.",
    siteName: "SAAD Portfolio",
    images: [
      {
        url: "/saad-icon.svg",
        width: 1200,
        height: 630,
        alt: "SAAD - Mudabbirul Saad Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAAD - Mudabbirul Saad | AI Student & Developer Portfolio",
    description: "Professional portfolio of Mudabbirul Saad - AI Student at Swinburne University building beautiful and intelligent digital experiences.",
    images: ["/saad-icon.svg"],
    creator: "@mudabbirulsaad",
  },
  // verification: {
  //   google: process.env.GOOGLE_VERIFICATION_CODE, // Not needed - verified via Cloudflare
  // },
  alternates: {
    canonical: "https://mudabbirulsaad.com",
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/saad-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${doto.variable} ${besley.variable} antialiased`}
      >
        {children}

        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Mudabbirul Saad",
              "alternateName": "SAAD",
              "description": "AI Student at Swinburne University building beautiful and intelligent digital experiences",
              "url": "https://mudabbirulsaad.com",
              "image": "https://mudabbirulsaad.com/saad-icon.svg",
              "sameAs": [
                "https://github.com/MudabbirulSaad",
                "https://linkedin.com/in/mudabbirulsaad"
              ],
              "jobTitle": "AI Student & Developer",
              "worksFor": {
                "@type": "EducationalOrganization",
                "name": "Swinburne University of Technology",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Melbourne",
                  "addressRegion": "Victoria",
                  "addressCountry": "Australia"
                }
              },
              "alumniOf": {
                "@type": "EducationalOrganization",
                "name": "Swinburne University of Technology"
              },
              "knowsAbout": [
                "Artificial Intelligence",
                "Machine Learning",
                "React",
                "Next.js",
                "Python",
                "JavaScript",
                "TypeScript",
                "Web Development",
                "Frontend Development",
                "Full Stack Development"
              ],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Melbourne",
                "@addressRegion": "Victoria",
                "addressCountry": "Australia"
              }
            })
          }}
        />

        {/* SVG Filter for Authentic Liquid Glass Effect - Optimized Parameters */}
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="glass-blur" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.002 0.002" numOctaves="2" result="turbulence" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="12" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Unicorn Studio Script */}
        <Script
          id="unicorn-studio"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(){
                if(!window.UnicornStudio){
                  window.UnicornStudio={isInitialized:!1};
                  var i=document.createElement("script");
                  i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
                  i.onload=function(){
                    window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
                  };
                  (document.head || document.body).appendChild(i)
                }
              }();
            `
          }}
        />
      </body>
    </html>
  );
}
