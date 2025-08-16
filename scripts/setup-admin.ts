/**
 * Admin Setup Script
 *
 * This script helps you create an admin user for your portfolio.
 * Run this script once to set up admin access.
 *
 * Usage:
 * 1. Make sure your Supabase environment variables are set
 * 2. Run: npx tsx scripts/setup-admin.ts
 */

import * as dotenv from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function setupAdmin() {
  console.log('🚀 Setting up admin user for SAAD Portfolio...\n')

  try {
    const supabase = createAdminClient()

    // Admin user details
    const adminEmail = 'mudabbirulsaad@gmail.com'
    const adminPassword = '@Saad8775'

    console.log(`📧 Creating admin user: ${adminEmail}`)

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Mudabbirul Saad'
      }
    })

    if (error) {
      console.error('❌ Error creating admin user:', error.message)
      return
    }

    if (data.user) {
      console.log('✅ Admin user created successfully!')
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
      console.log(`🆔 User ID: ${data.user.id}`)
      console.log('\n🎉 Admin setup complete!')
      console.log('\nYou can now login at: http://localhost:3000/admin/login')
      console.log('\n⚠️  IMPORTANT: Change the default password after first login!')
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
setupAdmin()
