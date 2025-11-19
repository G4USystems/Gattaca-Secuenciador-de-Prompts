import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, ecp_name, problem_core, country, industry } = body

    if (!projectId || !ecp_name || !problem_core || !country || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Create campaign
    const { data, error } = await supabase
      .from('ecp_campaigns')
      .insert({
        project_id: projectId,
        ecp_name,
        problem_core,
        country,
        industry,
        status: 'draft',
        step_outputs: {},
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create campaign', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: data,
      message: 'Campaign created successfully',
    })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * List campaigns for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data, error } = await supabase
      .from('ecp_campaigns')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to load campaigns' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaigns: data,
    })
  } catch (error) {
    console.error('List campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
