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
        hero_title: 'I build beautiful and intelligent digital experiences.',
        hero_cta_text: 'Explore My Work',
        about_intro: 'I\'m Mudabbirul Saad, a passionate Bachelor\'s degree student at Swinburne University of Technology, majoring in Artificial Intelligence.',
        about_description: 'My journey in technology is driven by a deep fascination with how intelligent systems can transform the way we interact with digital experiences. I thrive in quiet, focused environments where I can dive deep into complex problems and emerge with elegant solutions.',
        about_personal: 'When I\'m not immersed in coursework, you\'ll find me coding personal projects, watching the latest tech content, and staying current with emerging technology trends. I believe that continuous learning and hands-on experimentation are the keys to mastering the rapidly evolving field of AI.',
        education_degree: 'Bachelor\'s Degree',
        education_field: 'Artificial Intelligence',
        education_institution: 'Swinburne University of Technology',
        approach_description: 'I believe in building beautiful, intelligent digital experiences through focused work, continuous learning, and staying at the forefront of technological innovation.',
        contact_description: 'I\'m always interested in discussing AI, technology trends, and potential collaboration opportunities. Feel free to reach out through any of the channels below.',
        contact_opportunities_description: 'As a dedicated AI student, I\'m actively seeking internships, research opportunities, and collaborative projects that align with my passion for artificial intelligence and software development. I\'m particularly interested in roles that combine technical challenges with innovative problem-solving.',
        footer_brand_name: 'SAAD',
        footer_brand_description: 'AI Student & Developer building intelligent digital experiences with a passion for innovation and technology.',
        footer_location: 'Melbourne, Australia',
        footer_university: 'Swinburne University',
        footer_field: 'Artificial Intelligence'
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
        title: 'AI-Powered Application',
        description: 'Intelligent system leveraging machine learning algorithms to solve complex problems.',
        status: 'In Development',
        display_order: 1
      },
      {
        title: 'Web Development Project',
        description: 'Full-stack web application with modern design and responsive functionality.',
        status: 'Completed',
        display_order: 2
      },
      {
        title: 'Data Analysis Tool',
        description: 'Comprehensive data processing and visualization tool for insights generation.',
        status: 'Planning',
        display_order: 3
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
