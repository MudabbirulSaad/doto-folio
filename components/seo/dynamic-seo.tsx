"use client"

import Head from "next/head"

interface DynamicSEOProps {
  content: Record<string, unknown>
}

function text(content: Record<string, unknown>, key: string) {
  return String(content[key] || '')
}

export function DynamicSEO({ content }: DynamicSEOProps) {
  const dynamicTitle = `${text(content, 'hero_title')} | SAAD - Mudabbirul Saad`
  const dynamicDescription = `${text(content, 'about_intro')} ${text(content, 'about_description')}`.substring(0, 160)
  
  return (
    <Head>
      <title>{dynamicTitle}</title>
      <meta name="description" content={dynamicDescription} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={dynamicDescription} />
      <meta name="twitter:title" content={dynamicTitle} />
      <meta name="twitter:description" content={dynamicDescription} />
      
      {/* Dynamic Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SAAD Portfolio",
            "description": dynamicDescription,
            "url": "https://mudabbirulsaad.com",
            "author": {
              "@type": "Person",
              "name": "Mudabbirul Saad",
              "description": text(content, 'footer_brand_description'),
              "address": {
                "@type": "PostalAddress",
                "addressLocality": text(content, 'footer_location').split(', ')[0] || "Melbourne",
                "addressCountry": text(content, 'footer_location').split(', ')[1] || "Australia"
              },
              "affiliation": {
                "@type": "EducationalOrganization",
                "name": text(content, 'footer_university')
              },
              "studyField": text(content, 'footer_field')
            }
          })
        }}
      />
    </Head>
  )
}
