// =============================================
// API DOCUMENTATION GENERATOR
// =============================================

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  summary: string
  description: string
  tags: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  security?: SecurityRequirement[]
  rateLimit?: {
    requests: number
    window: string
  }
}

export interface Parameter {
  name: string
  in: 'query' | 'path' | 'header'
  required: boolean
  schema: Schema
  description: string
  example?: any
}

export interface RequestBody {
  required: boolean
  content: Record<string, MediaType>
}

export interface MediaType {
  schema: Schema
  example?: any
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
  headers?: Record<string, Header>
}

export interface Header {
  description: string
  schema: Schema
}

export interface Schema {
  type: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  example?: any
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: any[]
}

export interface SecurityRequirement {
  type: 'bearer' | 'apiKey'
  name?: string
  in?: 'header' | 'query'
}

// =============================================
// API DOCUMENTATION DATA
// =============================================

export const API_DOCUMENTATION: ApiEndpoint[] = [
  {
    path: '/api/contact',
    method: 'POST',
    summary: 'Submit contact form',
    description: 'Submit a contact form message. Rate limited to 3 requests per 15 minutes.',
    tags: ['Contact'],
    rateLimit: {
      requests: 3,
      window: '15 minutes'
    },
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email', 'subject', 'message'],
            properties: {
              name: {
                type: 'string',
                minLength: 2,
                maxLength: 100,
                pattern: '^[a-zA-Z\\s\'-]+$',
                example: 'John Doe'
              },
              email: {
                type: 'string',
                format: 'email',
                maxLength: 255,
                example: 'john@example.com'
              },
              subject: {
                type: 'string',
                minLength: 5,
                maxLength: 200,
                example: 'Project Inquiry'
              },
              message: {
                type: 'string',
                minLength: 10,
                maxLength: 5000,
                example: 'I would like to discuss a potential project...'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Contact form submitted successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'uuid-here' },
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    subject: { type: 'string', example: 'Project Inquiry' },
                    message: { type: 'string', example: 'I would like to discuss...' },
                    created_at: { type: 'string', format: 'date-time' }
                  }
                },
                message: { type: 'string', example: 'Your message has been sent successfully!' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    message: { type: 'string', example: 'Validation failed' },
                    details: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['name: Name must be at least 2 characters']
                    }
                  }
                }
              }
            }
          }
        }
      },
      '429': {
        description: 'Rate limit exceeded',
        headers: {
          'Retry-After': {
            description: 'Seconds to wait before retrying',
            schema: { type: 'integer' }
          }
        }
      }
    }
  },
  {
    path: '/api/admin/content/site',
    method: 'GET',
    summary: 'Get site content',
    description: 'Retrieve site content including hero, about, and footer sections.',
    tags: ['Admin', 'Content'],
    security: [{ type: 'bearer' }],
    responses: {
      '200': {
        description: 'Site content retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    hero_title: { type: 'string' },
                    hero_subtitle: { type: 'string' },
                    hero_cta_text: { type: 'string' },
                    about_intro: { type: 'string' },
                    about_description: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      '401': {
        description: 'Authentication required'
      }
    }
  },
  {
    path: '/api/admin/content/projects',
    method: 'GET',
    summary: 'List projects',
    description: 'Get all projects with their technologies.',
    tags: ['Admin', 'Projects'],
    security: [{ type: 'bearer' }],
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, example: 1 },
        description: 'Page number for pagination'
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
        description: 'Number of items per page'
      }
    ],
    responses: {
      '200': {
        description: 'Projects retrieved successfully'
      }
    }
  }
]

// =============================================
// OPENAPI SPEC GENERATOR
// =============================================

export function generateOpenApiSpec(): any {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'SAAD Portfolio API',
      description: 'API for Mudabbirul Saad\'s portfolio website',
      version: '1.0.0',
      contact: {
        name: 'Mudabbirul Saad',
        email: 'mudabbirulsaad@gmail.com',
        url: 'https://mudabbirulsaad.com'
      }
    },
    servers: [
      {
        url: 'https://mudabbirulsaad.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    paths: {} as any,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Contact', description: 'Contact form operations' },
      { name: 'Admin', description: 'Admin operations' },
      { name: 'Content', description: 'Content management' },
      { name: 'Projects', description: 'Project management' }
    ]
  }

  // Convert endpoints to OpenAPI paths
  API_DOCUMENTATION.forEach(endpoint => {
    if (!spec.paths[endpoint.path]) {
      spec.paths[endpoint.path] = {}
    }

    spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security?.map(sec => 
        sec.type === 'bearer' ? { bearerAuth: [] } : {}
      )
    }
  })

  return spec
}

// =============================================
// DOCUMENTATION UTILITIES
// =============================================

export function generateMarkdownDocs(): string {
  let markdown = '# SAAD Portfolio API Documentation\n\n'
  
  markdown += 'This document describes the REST API endpoints for the SAAD Portfolio website.\n\n'
  
  markdown += '## Base URL\n\n'
  markdown += '- Production: `https://mudabbirulsaad.com`\n'
  markdown += '- Development: `http://localhost:3000`\n\n'
  
  markdown += '## Authentication\n\n'
  markdown += 'Admin endpoints require Bearer token authentication.\n\n'
  
  markdown += '## Rate Limiting\n\n'
  markdown += 'API endpoints are rate limited to prevent abuse:\n\n'
  markdown += '- Contact form: 3 requests per 15 minutes\n'
  markdown += '- Admin endpoints: 60 requests per minute\n'
  markdown += '- Public endpoints: 100 requests per minute\n\n'
  
  markdown += '## Endpoints\n\n'
  
  API_DOCUMENTATION.forEach(endpoint => {
    markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `${endpoint.description}\n\n`
    
    if (endpoint.tags.length > 0) {
      markdown += `**Tags:** ${endpoint.tags.join(', ')}\n\n`
    }
    
    if (endpoint.rateLimit) {
      markdown += `**Rate Limit:** ${endpoint.rateLimit.requests} requests per ${endpoint.rateLimit.window}\n\n`
    }
    
    if (endpoint.security) {
      markdown += `**Authentication:** Required\n\n`
    }
    
    markdown += '---\n\n'
  })
  
  return markdown
}
