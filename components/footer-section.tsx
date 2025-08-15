"use client"

import { Mail, Linkedin, Github, MessageCircle, Facebook, Instagram } from "lucide-react"

export function FooterSection() {
  const currentYear = new Date().getFullYear()

  const navigationLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Skills", href: "#skills" },
    { name: "Contact", href: "#contact" },
    { name: "Get In Touch", href: "#contact-form" },
  ]

  const socialLinks = [
    {
      name: "Email",
      href: "mailto:mudabbirulsaad@gmail.com",
      icon: Mail,
      label: "mudabbirulsaad@gmail.com"
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/",
      icon: Linkedin,
      label: "Professional Network"
    },
    {
      name: "GitHub",
      href: "https://github.com/mudabbirulsaad",
      icon: Github,
      label: "Code Repositories"
    },
    {
      name: "Telegram",
      href: "https://t.me/mudabbirulsaad",
      icon: MessageCircle,
      label: "Quick Messaging"
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/MudabbirulSaad",
      icon: Facebook,
      label: "Social Updates"
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/mudabbirulsaad",
      icon: Instagram,
      label: "Visual Content"
    }
  ]

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1))
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground font-serif">
              SAAD
            </h3>
            <p className="text-sm leading-relaxed">
              AI Student & Developer building intelligent digital experiences
              with a passion for innovation and technology.
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-foreground">Location:</span> Melbourne, Australia
              </p>
              <p>
                <span className="font-medium text-foreground">University:</span> Swinburne University
              </p>
              <p>
                <span className="font-medium text-foreground">Major:</span> Artificial Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
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

          {/* Connect With Me */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              Connect With Me
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors duration-300"
                >
                  <social.icon className="w-4 h-4" />
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border/50 mt-8 pt-6 text-center">
          <p className="text-sm">
            © {currentYear} <span className="font-medium text-foreground">Mudabbirul Saad</span>.
            All rights reserved.
          </p>
          <p className="text-xs mt-1 opacity-75">
            Built with Next.js, React, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
