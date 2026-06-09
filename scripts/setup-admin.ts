/**
 * Admin Setup Script
 *
 * This script helps you create an admin user for your portfolio.
 * Run this script once to set up admin access.
 *
 * Usage:
 * 1. Make sure your Supabase environment variables are set
 * 2. Run: npm run setup:admin
 */

import * as dotenv from 'dotenv'
import { createAdminClient } from '../lib/supabase/admin.ts'

// Load environment variables
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function findUserIdByEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  const normalizedEmail = email.toLowerCase()
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`Could not look up existing admin user: ${error.message}`)
    }

    const users = data?.users ?? []
    const user = users.find(user => user.email?.toLowerCase() === normalizedEmail)

    if (user) {
      return user.id
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function updateExistingAdminPassword(
  supabase: ReturnType<typeof createAdminClient>,
  adminEmail: string,
  adminPassword: string,
  adminName: string
) {
  const userId = await findUserIdByEmail(supabase, adminEmail)

  if (!userId) {
    throw new Error(`Could not find an existing user for ${adminEmail}`)
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: adminPassword,
    user_metadata: {
      role: 'admin',
      name: adminName
    }
  })

  if (error) {
    throw new Error(`Could not update admin user: ${error.message}`)
  }

  console.log('Existing admin password updated successfully!')
  console.log(`Email: ${adminEmail}`)
  console.log(`User ID: ${userId}`)
  console.log('\nYou can now login at: http://localhost:3000/admin/login')
}

async function setupAdmin() {
  console.log('Setting up admin user for SAAD Portfolio...\n')

  try {
    const supabase = createAdminClient()

    // Admin user details
    const adminEmail = requireEnv('ADMIN_EMAIL')
    const adminPassword = requireEnv('ADMIN_PASSWORD')
    const adminName = requireEnv('ADMIN_NAME')
    const shouldUpdatePassword = process.argv.includes('--update-password')

    console.log(`Creating admin user: ${adminEmail}`)

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: adminName
      }
    })

    if (error) {
      if (error.message.toLowerCase().includes('already been registered')) {
        if (shouldUpdatePassword) {
          console.log('Admin user already exists. Updating password from ADMIN_PASSWORD...')
          await updateExistingAdminPassword(supabase, adminEmail, adminPassword, adminName)
          return
        }

        console.error('Admin user already exists.')
        console.error('Run `node .\\scripts\\setup-admin.ts --update-password` to update the password from ADMIN_PASSWORD.')
        return
      }

      console.error('Error creating admin user:', error.message)
      return
    }

    if (data.user) {
      console.log('Admin user created successfully!')
      console.log(`Email: ${adminEmail}`)
      console.log(`User ID: ${data.user.id}`)
      console.log('\nAdmin setup complete!')
      console.log('\nYou can now login at: http://localhost:3000/admin/login')
      console.log('\nIMPORTANT: Change the default password after first login!')
    }
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

// Run the setup
setupAdmin()
