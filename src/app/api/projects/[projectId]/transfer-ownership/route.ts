import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 10

/**
 * POST - Transfer project ownership to another member
 * Only the current owner can transfer ownership
 * Can only transfer to existing project members
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { newOwnerId } = body

    if (!newOwnerId) {
      return NextResponse.json({ error: 'Missing newOwnerId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify current user is the owner
    const { data: userRole } = await supabase
      .rpc('get_user_project_role', {
        p_project_id: projectId,
        p_user_id: session.user.id
      })

    if (userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only the project owner can transfer ownership' },
        { status: 403 }
      )
    }

    // Verify new owner is a member of the project
    const { data: newOwnerRole } = await supabase
      .rpc('get_user_project_role', {
        p_project_id: projectId,
        p_user_id: newOwnerId
      })

    if (!newOwnerRole) {
      return NextResponse.json(
        { error: 'New owner must be a member of the project' },
        { status: 400 }
      )
    }

    // Can't transfer to yourself
    if (newOwnerId === session.user.id) {
      return NextResponse.json(
        { error: 'You are already the owner' },
        { status: 400 }
      )
    }

    // Get project details for notifications
    const { data: project } = await supabase
      .from('projects')
      .select('name, user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use service role to update ownership (bypass RLS)
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Update project.user_id to new owner
    const { error: updateProjectError } = await supabaseAdmin
      .from('projects')
      .update({ user_id: newOwnerId })
      .eq('id', projectId)

    if (updateProjectError) {
      console.error('Error updating project owner:', updateProjectError)
      return NextResponse.json(
        { error: 'Failed to update project owner' },
        { status: 500 }
      )
    }

    // Update new owner's role in project_members to 'owner'
    const { error: updateNewOwnerError } = await supabaseAdmin
      .from('project_members')
      .update({ role: 'owner' })
      .eq('project_id', projectId)
      .eq('user_id', newOwnerId)

    if (updateNewOwnerError) {
      console.error('Error updating new owner role:', updateNewOwnerError)
      // Rollback project owner change
      await supabaseAdmin
        .from('projects')
        .update({ user_id: session.user.id })
        .eq('id', projectId)

      return NextResponse.json(
        { error: 'Failed to update new owner role' },
        { status: 500 }
      )
    }

    // Downgrade previous owner to 'editor' role
    const { error: updateOldOwnerError } = await supabaseAdmin
      .from('project_members')
      .update({ role: 'editor' })
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)

    if (updateOldOwnerError) {
      console.error('Error updating old owner role:', updateOldOwnerError)
      // Note: Not rolling back here as the transfer is essentially complete
    }

    // Get new owner email for notification
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const newOwnerEmail = authUsers.users.find(u => u.id === newOwnerId)?.email || 'Unknown'

    // Create notification for new owner
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: newOwnerId,
        type: 'role_changed',
        title: 'You are now the project owner',
        message: `${session.user.email} transferred ownership of "${project.name}" to you`,
        project_id: projectId,
        actor_id: session.user.id
      })

    // Create notification for old owner (confirmation)
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: session.user.id,
        type: 'role_changed',
        title: 'Ownership transferred',
        message: `You transferred ownership of "${project.name}" to ${newOwnerEmail}`,
        project_id: projectId,
        actor_id: newOwnerId
      })

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully',
      newOwnerId,
      newOwnerEmail
    })
  } catch (error) {
    console.error('Transfer ownership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
