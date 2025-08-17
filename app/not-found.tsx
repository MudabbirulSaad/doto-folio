import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20 mb-4">404</h1>
          <div className="w-32 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <BackButton />
        </div>

        {/* Helpful Links */}
        <div className="border-t border-border pt-8">
          <h3 className="text-lg font-semibold mb-4">Popular Pages</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/#about" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              About Me
            </Link>
            <Link 
              href="/#projects" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/#skills"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/#contact"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please{" "}
            <Link
              href="/#contact"
              className="text-primary hover:underline"
            >
              contact me
            </Link>
            {" "}and I&apos;ll fix it right away.
          </p>
        </div>
      </div>
    </div>
  )
}
