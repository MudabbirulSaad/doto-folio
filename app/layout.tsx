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
  title: "SAAD - Mudabbirul Saad | Portfolio",
  description: "Professional portfolio of Mudabbirul Saad - Building beautiful and intelligent digital experiences",
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
