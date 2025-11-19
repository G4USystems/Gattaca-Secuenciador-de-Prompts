import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Duplicate an existing campaign
 * Creates a new campaign with the same configuration in "draft" status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
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

    // Load original campaign
    const { data: originalCampaign, error: loadError } = await supabase
      .from('ecp_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (loadError || !originalCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found', details: loadError?.message },
        { status: 404 }
      )
    }

    // Create duplicate campaign
    const { data: newCampaign, error: createError } = await supabase
      .from('ecp_campaigns')
      .insert({
        project_id: originalCampaign.project_id,
        ecp_name: `${originalCampaign.ecp_name} (Copy)`,
        problem_core: originalCampaign.problem_core,
        country: originalCampaign.country,
        industry: originalCampaign.industry,
        status: 'draft',
        step_outputs: {},
        current_step_id: null,
        started_at: null,
        completed_at: null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json(
        { error: 'Failed to duplicate campaign', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      message: 'Campaign duplicated successfully',
    })
  } catch (error) {
    console.error('Duplicate campaign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
