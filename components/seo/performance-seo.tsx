"use client"

import { useEffect } from "react"

export function PerformanceSEO() {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload fonts
      const fontLink = document.createElement('link')
      fontLink.rel = 'preload'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Besley:ital,wght@0,400..900;1,400..900&display=swap'
      fontLink.as = 'style'
      fontLink.crossOrigin = 'anonymous'
      document.head.appendChild(fontLink)

      // Preload critical API endpoints
      const apiLink = document.createElement('link')
      apiLink.rel = 'prefetch'
      apiLink.href = '/api/admin/content/site'
      document.head.appendChild(apiLink)
    }

    // Add performance hints
    const addPerformanceHints = () => {
      // DNS prefetch for external resources
      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = 'https://fonts.googleapis.com'
      document.head.appendChild(dnsPrefetch)

      const dnsPrefetch2 = document.createElement('link')
      dnsPrefetch2.rel = 'dns-prefetch'
      dnsPrefetch2.href = 'https://cdn.jsdelivr.net'
      document.head.appendChild(dnsPrefetch2)

      // Preconnect to critical origins
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://fonts.gstatic.com'
      preconnect.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect)
    }

    // Optimize images loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        if (!img.loading) {
          img.loading = 'lazy'
        }
        if (!img.decoding) {
          img.decoding = 'async'
        }
      })
    }

    // Optimize inline styles
    const optimizeInlineStyles = () => {
      // Move critical inline styles to CSS classes
      const elementsWithInlineStyles = document.querySelectorAll('[style]')
      elementsWithInlineStyles.forEach(element => {
        const style = element.getAttribute('style')
        if (style && style.includes('position: absolute')) {
          // Add CSS class instead of inline styles where possible
          element.classList.add('absolute-positioned')
        }
      })
    }

    // Run optimizations
    preloadCriticalResources()
    addPerformanceHints()

    // Optimize images and styles after a short delay to ensure DOM is ready
    setTimeout(() => {
      optimizeImages()
      optimizeInlineStyles()
    }, 100)

    // Add viewport meta for mobile optimization
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      const viewport = document.createElement('meta')
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover'
      document.head.appendChild(viewport)
    }

  }, [])

  return null
}
