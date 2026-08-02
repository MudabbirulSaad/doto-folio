/**
 * Content Management System Setup Script
 *
 * This script sets up the database schema and initial data for the content management system.
 * Run this script once to set up the CMS tables and populate them with current content.
 *
 * Usage:
 * 1. Make sure your Supabase environment variables are set
 * 2. Run: npm run setup:content
 */

import * as dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { SupabaseAdminDataClient } from '../lib/server/adapters/supabase/types.ts'
import { createAdminClient } from '../lib/supabase/admin.ts'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function insertInitialData(supabase: SupabaseAdminDataClient) {
  try {
    // Insert site content
    const { error: siteError } = await supabase
      .from('site_content')
      .insert({
        hero_title: 'I build secure, reliable platforms and intelligent developer tools.',
        hero_subtitle: 'Software Development student at Swinburne University with additional applied-AI coursework and project experience.',
        hero_cta_text: 'Explore My Work',
        about_intro: 'I am Mudabbirul Saad, a Bachelor of Computer Science student at Swinburne University of Technology, majoring in Software Development.',
        about_description: 'I build product and platform systems with typed boundaries, reliable delivery paths, and evidence-backed engineering decisions.',
        about_personal: 'Additional applied-AI coursework and projects support my work in developer tooling, local AI workflows, and evaluated machine-learning systems.',
        education_degree: 'Bachelor of Computer Science',
        education_field: 'Software Development',
        education_institution: 'Swinburne University of Technology',
        approach_description: 'I prefer clear contracts, observable failure modes, focused tests, and deployment processes that remain understandable under pressure.',
        contact_description: 'Use the contact form or LinkedIn to discuss software and platform engineering opportunities.',
        contact_opportunities_description: 'Seeking graduate, internship, and junior software or platform engineering roles in Melbourne or remote-friendly teams.',
        footer_brand_name: 'SAAD',
        footer_brand_description: 'Building secure platforms, developer tools, and reliable product systems.',
        footer_location: 'Melbourne, Australia',
        footer_university: 'Swinburne University',
        footer_field: 'Software Development'
      })

    if (siteError) {
      console.log('Site content may already exist:', siteError.message)
    } else {
      console.log('Site content inserted')
    }

    // Insert skill categories
    const categories = [
      { title: 'Programming Languages', display_order: 1 },
      { title: 'Web Technologies', display_order: 2 },
      { title: 'Artificial Intelligence', display_order: 3 }
    ]

    for (const category of categories) {
      const { error } = await supabase
        .from('skill_categories')
        .insert(category)

      if (error) {
        console.log(`Category "${category.title}" may already exist`)
      } else {
        console.log(`Category "${category.title}" inserted`)
      }
    }

    // Insert projects
    const projects = [
      {
        title: 'OpenReels',
        description: 'Private production-oriented video platform with protected media delivery, resilient asynchronous workflows, and immutable releases.',
        status: 'In Development',
        display_order: 1
      },
      {
        title: 'ThePlanner',
        description: 'Published TypeScript CLI for deterministic planning graphs, work items, readiness checks, and agent handoffs.',
        status: 'Completed',
        display_order: 2
      },
      {
        title: 'Inspector',
        description: 'Local TypeScript CLI for evidence-backed AI-assisted codebase inspection, deterministic QA, and resumable reports.',
        status: 'In Development',
        display_order: 3
      },
      {
        title: 'Study Podcast Generator',
        description: 'Local-first FastAPI and React app for queued WAV podcast generation with persistent projects and reusable voices.',
        status: 'In Development',
        display_order: 4
      },
      {
        title: 'Aura',
        description: 'End-to-end misinformation-classification prototype with evaluated ML models, FastAPI inference, Vue, and Docker.',
        status: 'Completed',
        display_order: 5
      }
    ]

    for (const project of projects) {
      const { error } = await supabase
        .from('projects')
        .insert(project)

      if (error) {
        console.log(`Project "${project.title}" may already exist`)
      } else {
        console.log(`Project "${project.title}" inserted`)
      }
    }

    console.log('Initial data insertion completed')
  } catch (error) {
    console.error('Error inserting initial data:', error)
  }
}

async function setupContentManagement() {
  console.log('Setting up Content Management System for SAAD Portfolio...\n')

  try {
    const supabase = createAdminClient()

    console.log('Setting up database schema and initial data...')

    // Try to insert initial data directly using Supabase client
    await insertInitialData(supabase)

    // Verify the setup by checking if tables exist and have data
    console.log('\nVerifying setup...')

    const tables = [
      'site_content',
      'projects',
      'skill_categories'
    ]

    let tablesExist = true

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error(`Error checking ${table}:`, error.message)
          tablesExist = false
        } else {
          console.log(`${table}: ${count} records`)
        }
      } catch {
        console.log(`${table}: Table doesn't exist yet`)
        tablesExist = false
      }
    }

    if (!tablesExist) {
      console.log('\nSome tables don\'t exist yet. Please run the SQL manually:')
      console.log('\nManual Setup Instructions:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of: database/schema/content-management.sql')
      console.log('4. Execute the SQL to create all tables')
      console.log('5. Then copy and paste: database/migrations/001_initial_content_data.sql')
      console.log('6. Execute to insert initial data')
      console.log('\nAlternatively, you can create the tables manually and the data will be inserted automatically.')
    } else {
      console.log('\nContent Management System setup completed successfully!')
    }

    console.log('\nNext steps:')
    console.log('1. Access the admin dashboard at /admin/dashboard')
    console.log('2. Navigate to the new content management pages at /admin/content')
    console.log('3. Start customizing your portfolio content!')
  } catch (error) {
    console.error('Setup failed:', error)
    console.log('\nManual Setup Required:')
    console.log('Please run the SQL files manually in your Supabase dashboard:')
    console.log('1. database/schema/content-management.sql (create tables)')
    console.log('2. database/migrations/001_initial_content_data.sql (insert data)')
  }
}

// Alternative method using direct SQL execution if rpc doesn't work
async function setupContentManagementDirect() {
  console.log('Setting up Content Management System (Direct SQL)...\n')

  try {
    const supabase = createAdminClient()

    // Read and split SQL files into individual statements
    const schemaPath = join(process.cwd(), 'database', 'schema', 'content-management.sql')
    const dataPath = join(process.cwd(), 'database', 'migrations', '001_initial_content_data.sql')

    const schemaSql = readFileSync(schemaPath, 'utf8')
    const dataSql = readFileSync(dataPath, 'utf8')

    // Split SQL into individual statements (basic splitting)
    const schemaStatements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const dataStatements = dataSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('Executing schema statements...')

    for (let i = 0; i < schemaStatements.length; i++) {
      const statement = schemaStatements[i]
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement })
          console.log(`Schema statement ${i + 1}/${schemaStatements.length} executed`)
        } catch (error) {
          console.error(`Error in schema statement ${i + 1}:`, error)
        }
      }
    }

    console.log('Executing data statements...')

    for (let i = 0; i < dataStatements.length; i++) {
      const statement = dataStatements[i]
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement })
          console.log(`Data statement ${i + 1}/${dataStatements.length} executed`)
        } catch (error) {
          console.error(`Error in data statement ${i + 1}:`, error)
        }
      }
    }

    console.log('\nContent Management System setup completed!')
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

// Run the setup
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setupContentManagement().catch(console.error)
}

export { setupContentManagement, setupContentManagementDirect }
