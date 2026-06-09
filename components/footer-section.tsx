"use client"

import { Facebook, Github, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react"
import type { PublicSocialLink } from "@/lib/server/application/content/public-portfolio"

interface FooterSectionProps {
  content: Record<string, unknown>
  socialLinks?: PublicSocialLink[]
}

const icons = {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle
}

function iconFor(iconName: string) {
  return icons[iconName as keyof typeof icons] || MessageCircle
}

function text(content: Record<string, unknown>, key: string) {
  return String(content[key] || '')
}

export function FooterSection({ content, socialLinks = [] }: FooterSectionProps) {
  const currentYear = new Date().getFullYear()

  const navigationLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Skills", href: "#skills" },
    { name: "Contact", href: "#contact" },
    { name: "Get In Touch", href: "#contact-form" },
  ]

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1))
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground font-serif">
              {text(content, 'footer_brand_name')}
            </h3>
            <p className="text-sm leading-relaxed">
              {text(content, 'footer_brand_description')}
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-foreground">Location:</span> {text(content, 'footer_location')}
              </p>
              <p>
                <span className="font-medium text-foreground">University:</span> {text(content, 'footer_university')}
              </p>
              <p>
                <span className="font-medium text-foreground">Major:</span> {text(content, 'footer_field')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              Navigation
            </h4>
            <nav className="space-y-2">
              {navigationLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="block text-sm hover:text-primary transition-colors duration-300 text-left"
                >
                  {link.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              Connect With Me
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((social) => {
                const Icon = iconFor(social.icon_name)
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors duration-300"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{social.platform}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6 text-center">
          <p className="text-sm">
            {text(content, 'footer_copyright').replace('{year}', String(currentYear))}
          </p>
          <p className="text-xs mt-1 opacity-75">
            Built with Next.js, React, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
