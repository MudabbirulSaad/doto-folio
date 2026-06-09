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
  example?: unknown
}

export interface RequestBody {
  required: boolean
  content: Record<string, MediaType>
}

export interface MediaType {
  schema: Schema
  example?: unknown
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
  example?: unknown
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: unknown[]
}

export interface SecurityRequirement {
  type: 'bearer' | 'apiKey'
  name?: string
  in?: 'header' | 'query'
}

const successEnvelope = (data: Schema): Schema => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data
  }
})

const messageEnvelope = (message: string): Schema => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message }
  }
})

const okJson = (description: string, schema?: Schema): Response => ({
  description,
  content: schema
    ? {
        'application/json': {
          schema
        }
      }
    : undefined
})

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
    path: '/api/subscribe',
    method: 'POST',
    summary: 'Subscribe to newsletter',
    description: 'Create or reactivate a newsletter subscription. Rate limited to 5 attempts per 15 minutes.',
    tags: ['Subscriptions'],
    rateLimit: {
      requests: 5,
      window: '15 minutes'
    },
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              name: { type: 'string', maxLength: 100, example: 'Ada Lovelace' },
              email: { type: 'string', format: 'email', maxLength: 255, example: 'ada@example.com' }
            }
          }
        }
      }
    },
    responses: {
      '200': okJson('Subscription accepted', messageEnvelope('Successfully subscribed to newsletter!')),
      '400': { description: 'Validation error' },
      '409': { description: 'Email is already subscribed' },
      '429': { description: 'Rate limit exceeded' }
    }
  },
  {
    path: '/api/health',
    method: 'GET',
    summary: 'Check application health',
    description: 'Returns application, database, environment, and system health details.',
    tags: ['Health'],
    responses: {
      '200': okJson('Health check completed', successEnvelope({
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' }
        }
      }))
    }
  },
  {
    path: '/api/site-content',
    method: 'GET',
    summary: 'Get public portfolio content',
    description: 'Returns published public portfolio content for the homepage sections.',
    tags: ['Public Content'],
    responses: {
      '200': okJson('Published portfolio content retrieved')
    }
  },
  {
    path: '/api/blog/posts',
    method: 'GET',
    summary: 'List public blog posts',
    description: 'Returns published blog posts with pagination, taxonomy filters, featured filtering, search, and sorting.',
    tags: ['Blog'],
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, example: 1 }, description: 'Page number' },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, example: 9 }, description: 'Posts per page' },
      { name: 'category', in: 'query', required: false, schema: { type: 'string', example: 'ai' }, description: 'Category slug' },
      { name: 'tag', in: 'query', required: false, schema: { type: 'string', example: 'nextjs' }, description: 'Tag slug' },
      { name: 'search', in: 'query', required: false, schema: { type: 'string', example: 'agent' }, description: 'Search query' }
    ],
    responses: {
      '200': okJson('Published blog posts retrieved')
    }
  },
  {
    path: '/api/blog/posts/{slug}',
    method: 'GET',
    summary: 'Get public blog post',
    description: 'Returns a published blog post by slug.',
    tags: ['Blog'],
    parameters: [
      { name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'building-agent-access' }, description: 'Blog post slug' }
    ],
    responses: {
      '200': okJson('Blog post retrieved'),
      '404': { description: 'Post not found' }
    }
  },
  {
    path: '/api/blog/categories',
    method: 'GET',
    summary: 'List public blog categories',
    description: 'Returns published blog categories with counts.',
    tags: ['Blog'],
    responses: {
      '200': okJson('Blog categories retrieved')
    }
  },
  {
    path: '/api/agent/public-context',
    method: 'GET',
    summary: 'Get public agent context',
    description: 'Returns public portfolio and blog context for unauthenticated agents.',
    tags: ['Agent Access'],
    responses: {
      '200': okJson('Public agent context retrieved')
    }
  },
  {
    path: '/api/agent/invitations/claim',
    method: 'POST',
    summary: 'Claim agent invitation',
    description: 'Claims a one-time invite code and returns the bearer token once.',
    tags: ['Agent Access'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code'],
            properties: {
              code: { type: 'string', minLength: 4, example: 'YOUR_INVITE_CODE' }
            }
          }
        }
      }
    },
    responses: {
      '200': okJson('Agent invitation claimed'),
      '400': { description: 'Invalid or expired invitation' }
    }
  },
  {
    path: '/api/agent/access-requests',
    method: 'POST',
    summary: 'Request agent access',
    description: 'Creates a pending access request when no invite code is available.',
    tags: ['Agent Access'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['toolName', 'reason', 'requestedScopes'],
            properties: {
              agentName: { type: 'string', example: 'Codex' },
              toolName: { type: 'string', example: 'codex-cli' },
              reason: { type: 'string', example: 'Help with a portfolio task' },
              requestedScopes: {
                type: 'array',
                items: { type: 'string' },
                example: ['portfolio:read']
              }
            }
          }
        }
      }
    },
    responses: {
      '200': okJson('Agent access request created'),
      '400': { description: 'Validation error' }
    }
  },
  {
    path: '/api/agent/me',
    method: 'GET',
    summary: 'Inspect agent token',
    description: 'Returns token identity and scopes for an authenticated agent.',
    tags: ['Agent Access'],
    security: [{ type: 'bearer' }],
    responses: {
      '200': okJson('Agent token inspected'),
      '401': { description: 'Missing or invalid bearer token' }
    }
  },
  {
    path: '/api/agent/instructions',
    method: 'GET',
    summary: 'Get private agent instructions',
    description: 'Returns invite/task instructions and scope-aware guidance for the authenticated agent.',
    tags: ['Agent Access'],
    security: [{ type: 'bearer' }],
    responses: {
      '200': okJson('Private agent instructions retrieved'),
      '401': { description: 'Missing or invalid bearer token' }
    }
  },
  {
    path: '/api/agent/context',
    method: 'GET',
    summary: 'Get private agent context',
    description: 'Returns scope-aware private portfolio context for the authenticated agent.',
    tags: ['Agent Access'],
    security: [{ type: 'bearer' }],
    responses: {
      '200': okJson('Private agent context retrieved'),
      '401': { description: 'Missing or invalid bearer token' }
    }
  },
  {
    path: '/api/admin/content/site',
    method: 'GET',
    summary: 'Get site content',
    description: 'Partial admin CMS documentation. Retrieve site content including hero, about, and footer sections.',
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
    description: 'Partial admin CMS documentation. Get all projects with their technologies.',
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

export function generateOpenApiSpec(): Record<string, unknown> {
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
    paths: {} as Record<string, unknown>,
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
      { name: 'Subscriptions', description: 'Newsletter subscription operations' },
      { name: 'Health', description: 'Application health checks' },
      { name: 'Public Content', description: 'Public portfolio content' },
      { name: 'Blog', description: 'Public blog reads' },
      { name: 'Agent Access', description: 'Invite-first scoped agent access' },
      { name: 'Admin', description: 'Partial admin CMS operations' },
      { name: 'Content', description: 'Partial content management operations' },
      { name: 'Projects', description: 'Partial project management operations' }
    ]
  }

  // Convert endpoints to OpenAPI paths
  API_DOCUMENTATION.forEach(endpoint => {
    if (!spec.paths[endpoint.path]) {
      spec.paths[endpoint.path] = {}
    }

    const pathObj = spec.paths[endpoint.path] as Record<string, unknown>
    pathObj[endpoint.method.toLowerCase()] = {
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
  markdown += 'Admin endpoints require admin session authentication or a scoped agent Bearer token. Agent private endpoints require an agent Bearer token.\n\n'
  
  markdown += '## Rate Limiting\n\n'
  markdown += 'API endpoints are rate limited to prevent abuse:\n\n'
  markdown += '- Contact form: 3 requests per 15 minutes\n'
  markdown += '- Admin endpoints: 60 requests per minute\n'
  markdown += '- Public endpoints: 100 requests per minute\n\n'
  markdown += 'Current rate limits use an in-memory process-local store. Replace with a distributed store before relying on them for serious production abuse protection.\n\n'
  
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
