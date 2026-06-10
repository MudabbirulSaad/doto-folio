"use client"

import { useEffect } from "react"

export function PerformanceSEO() {
  useEffect(() => {
    // Add performance hints
    const addPerformanceHints = () => {
      // DNS prefetch for external resources
      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = 'https://cdn.jsdelivr.net'
      document.head.appendChild(dnsPrefetch)
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
