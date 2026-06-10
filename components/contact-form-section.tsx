"use client"

import { useState } from "react"
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { AnimatedSection, AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  submitContactForm,
  validateContactForm,
  type ContactFormData
} from "@/lib/client/application/contact/contact-form"
import { createContactApiGateway } from "@/lib/client/adapters/http/contact-api"

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

export function ContactFormSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState<string>("")

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data using Supabase service
    const validation = await validateContactForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrors({})

    try {
      // Submit to Supabase
      const result = await submitContactForm(createContactApiGateway(), formData)

      if (result.success) {
        // Reset form on success
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        })
        setSubmitStatus('success')
        setSubmitMessage(result.message || "Thank you! Your message has been sent successfully. I'll get back to you soon.")
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || "Failed to send your message. Please try again.")
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setSubmitMessage("An unexpected error occurred. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact-form" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection animation="fadeUp" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display">
              Get In Touch
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Have a project in mind or want to discuss opportunities? 
              I&apos;d love to hear from you. Send me a message and I&apos;ll get back to you as soon as possible.
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <AnimatedCard delay={0.2}>
              <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 ${
                        errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="Your full name"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 ${
                        errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="your.email@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 ${
                        errors.subject ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="What's this about?"
                      disabled={isSubmitting}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-foreground">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 min-h-[120px] resize-none ${
                        errors.message ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''
                      }`}
                      placeholder="Tell me about your project or inquiry..."
                      disabled={isSubmitting}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </Button>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-sm text-primary font-medium">
                        {submitMessage || "Thank you! Your message has been sent successfully. I'll get back to you soon."}
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {submitMessage || "Sorry, there was an error sending your message. Please try again or contact me directly."}
                      </p>
                    </div>
                  )}
                </form>
              </RevealCard>
            </AnimatedCard>

            {/* Contact Information */}
            <AnimatedCard delay={0.4}>
              <div className="space-y-8">
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    Let&apos;s Start a Conversation
                  </h3>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">
                      I&apos;m always excited to discuss new projects, creative ideas, or opportunities to be part of your vision.
                    </p>
                    <p className="leading-relaxed">
                      Whether you&apos;re looking for an AI enthusiast for your team, need help with a web development project,
                      or want to collaborate on something innovative, I&apos;d love to hear from you.
                    </p>
                  </div>
                </RevealCard>

                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    Response Time
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Email:</span> Usually within 24 hours
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-secondary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Projects:</span> Initial response within 48 hours
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Urgent:</span> Contact me via LinkedIn for faster response
                      </span>
                    </div>
                  </div>
                </RevealCard>

                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    What to Include
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Project timeline and budget (if applicable)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Technical requirements or preferred technologies</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Any specific goals or challenges you&apos;re facing</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Links to existing work or references (if relevant)</span>
                    </div>
                  </div>
                </RevealCard>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </section>
  )
}
