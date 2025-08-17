"use client"

import { useEffect, useState } from "react"
import Head from "next/head"

interface SiteContent {
  hero_title: string
  hero_subtitle?: string
  about_intro: string
  about_description: string
  footer_brand_description: string
  footer_location: string
  footer_university: string
  footer_field: string
}

export function DynamicSEO() {
  const [content, setContent] = useState<SiteContent | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/site-content')
        if (response.ok) {
          const result = await response.json()
          setContent(result.data)
        }
      } catch (error) {
        console.error('Error fetching SEO content:', error)
      }
    }

    fetchContent()
  }, [])

  if (!content) return null

  const dynamicTitle = `${content.hero_title} | SAAD - Mudabbirul Saad`
  const dynamicDescription = `${content.about_intro} ${content.about_description}`.substring(0, 160)
  
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
              "description": content.footer_brand_description,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": content.footer_location.split(', ')[0] || "Melbourne",
                "addressCountry": content.footer_location.split(', ')[1] || "Australia"
              },
              "affiliation": {
                "@type": "EducationalOrganization",
                "name": content.footer_university
              },
              "studyField": content.footer_field
            }
          })
        }}
      />
    </Head>
  )
}
