"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const navigationItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Projects", href: "#projects" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
  { name: "Get In Touch", href: "#contact-form" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="fixed top-4 left-4 right-4 z-50 md:top-6 md:left-8 md:right-8">
      {/* Floating Navigation Container with iOS 26 Liquid Glass Effect */}
      <div className="glass-navigation rounded-2xl shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-foreground">
                SAAD
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    const element = document.getElementById(item.href.substring(1))
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="default" size="sm">
                View Resume
              </Button>
              <Button variant="outline" size="sm">
                Blog
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="!fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !transform-none !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !border-0 !rounded-none !p-0 !m-0 !z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                <DialogDescription className="sr-only">
                  Main navigation menu with links to different sections of the portfolio
                </DialogDescription>

                {/* Close Button - Fixed positioning with glass effect */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="glass-close-button fixed top-4 right-4 z-50 p-3 rounded-full"
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close menu</span>
                </button>

                {/* Modal Content Container */}
                <div className="flex flex-col items-center justify-center w-full h-full px-6 py-16 overflow-y-auto">

                  {/* Modal Content - Centered and Constrained */}
                  <div className="flex flex-col items-center justify-center space-y-8 max-w-sm w-full mx-auto">
                    {/* Mobile Logo */}
                    <Link
                      href="/"
                      className="text-3xl font-bold text-foreground mb-4"
                      onClick={() => setIsOpen(false)}
                    >
                      SAAD
                    </Link>

                    {/* Mobile Navigation */}
                    <nav className="flex flex-col items-center space-y-4 w-full">
                      {navigationItems.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => {
                            const element = document.getElementById(item.href.substring(1))
                            element?.scrollIntoView({ behavior: 'smooth' })
                            setIsOpen(false)
                          }}
                          className="text-xl font-medium text-muted-foreground hover:text-foreground transition-colors text-center py-3 px-4 rounded-lg hover:bg-muted/20 w-full"
                        >
                          {item.name}
                        </button>
                      ))}
                    </nav>

                    {/* Mobile CTA Buttons */}
                    <div className="flex flex-col space-y-3 w-full pt-6">
                      <Button variant="default" size="lg" className="w-full text-base py-4">
                        View Resume
                      </Button>
                      <Button variant="outline" size="lg" className="w-full text-base py-4">
                        Blog
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  )
}
