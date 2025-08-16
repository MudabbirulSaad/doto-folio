import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/auth/server'

// GET - Fetch contact submissions with filtering and search
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const readStatus = searchParams.get('readStatus') || 'all'
    const timeFilter = searchParams.get('timeFilter') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const supabase = await createClient()
    
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`)
    }
    
    // Apply read status filter
    if (readStatus === 'read') {
      query = query.eq('is_read', true)
    } else if (readStatus === 'unread') {
      query = query.eq('is_read', false)
    }
    
    // Apply time filter
    const now = new Date()
    if (timeFilter === 'last7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', sevenDaysAgo.toISOString())
    } else if (timeFilter === 'last30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())
    } else if (timeFilter === 'last3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', threeMonthsAgo.toISOString())
    } else if (timeFilter === 'lastyear') {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', oneYearAgo.toISOString())
    } else if (timeFilter === 'custom' && startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }
    
    const { data: submissions, error } = await query
    
    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ submissions: submissions || [] })
    
  } catch (error) {
    console.error('Submissions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update submission read status
export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth()
    
    const body = await request.json()
    const { submissionIds, isRead, readBy } = body
    
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return NextResponse.json(
        { error: 'Invalid submission IDs' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    const updateData: {
      is_read: boolean
      updated_at: string
      read_at?: string | null
      read_by?: string | null
    } = {
      is_read: isRead,
      updated_at: new Date().toISOString()
    }
    
    if (isRead) {
      updateData.read_at = new Date().toISOString()
      updateData.read_by = readBy || null
    } else {
      updateData.read_at = null
      updateData.read_by = null
    }
    
    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .in('id', submissionIds)
      .select()
    
    if (error) {
      console.error('Error updating submissions:', error)
      return NextResponse.json(
        { error: 'Failed to update submissions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0,
      submissions: data 
    })
    
  } catch (error) {
    console.error('Update submissions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
