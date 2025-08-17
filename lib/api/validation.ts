import { z } from 'zod'
import { NextRequest } from 'next/server'

// =============================================
// VALIDATION SCHEMAS
// =============================================

export const ContactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters')
})

export const ProjectSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  status: z.enum(['Planning', 'In Development', 'Completed', 'On Hold']),
  display_order: z.number().int().min(0).optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  technologies: z.array(z.string().min(1).max(50)).max(20).optional()
})

export const SkillSchema = z.object({
  name: z.string()
    .min(2, 'Skill name must be at least 2 characters')
    .max(50, 'Skill name must be less than 50 characters'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  display_order: z.number().int().min(0).optional(),
  is_published: z.boolean().optional()
})

export const SiteContentSchema = z.object({
  hero_title: z.string().min(10).max(200),
  hero_subtitle: z.string().max(300).optional(),
  hero_cta_text: z.string().min(3).max(50),
  hero_cta_link: z.string().max(100),
  about_intro: z.string().min(50).max(1000),
  about_description: z.string().min(100).max(2000),
  about_personal: z.string().min(50).max(1000),
  education_degree: z.string().min(5).max(100),
  education_field: z.string().min(5).max(100),
  education_institution: z.string().min(5).max(100),
  approach_description: z.string().min(50).max(1000),
  contact_description: z.string().max(500).optional(),
  contact_opportunities_description: z.string().max(500).optional(),
  footer_brand_name: z.string().min(1).max(50),
  footer_brand_description: z.string().max(200),
  footer_location: z.string().max(100),
  footer_university: z.string().max(100),
  footer_field: z.string().max(100),
  footer_copyright: z.string().max(200),
  is_published: z.boolean().optional()
})

// =============================================
// VALIDATION UTILITIES
// =============================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Invalid request data']
    }
  }
}

// =============================================
// REQUEST SANITIZATION
// =============================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value as T[keyof T]
    }
  }
  
  return sanitized
}

// =============================================
// REQUEST SIZE VALIDATION
// =============================================

export const MAX_REQUEST_SIZE = 1024 * 1024 // 1MB
export const MAX_JSON_SIZE = 512 * 1024 // 512KB

export async function validateRequestSize(request: NextRequest): Promise<boolean> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    return size <= MAX_REQUEST_SIZE
  }
  
  return true // Allow if no content-length header
}

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // Check request size
    const sizeValid = await validateRequestSize(request)
    if (!sizeValid) {
      return {
        success: false,
        errors: ['Request too large']
      }
    }

    // Parse JSON
    const body = await request.json()
    
    // Sanitize input
    const sanitizedBody = sanitizeObject(body)
    
    // Validate against schema
    return validateRequest(schema, sanitizedBody)
  } catch {
    return {
      success: false,
      errors: ['Invalid JSON format']
    }
  }
}
