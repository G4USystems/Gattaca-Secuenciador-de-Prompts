import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Simple test endpoint to diagnose upload issues
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Test Upload Started ===')
    console.log('Content-Type:', request.headers.get('content-type'))
    console.log('Content-Length:', request.headers.get('content-length'))

    // Try to parse formData
    let formData
    try {
      formData = await request.formData()
      console.log('✅ FormData parsed successfully')
    } catch (e) {
      console.error('❌ FormData parse failed:', e)
      return NextResponse.json({
        error: 'Failed to parse FormData',
        details: e instanceof Error ? e.message : 'Unknown error',
        hint: 'This suggests the request is being rejected before reaching the function'
      }, { status: 500 })
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({
        error: 'No file in FormData',
        formDataKeys: Array.from(formData.keys())
      }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    return NextResponse.json({
      success: true,
      message: '✅ Upload endpoint is working!',
      file: {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        type: file.type
      }
    })
  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Also add GET for quick check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Test endpoint is reachable',
    timestamp: new Date().toISOString()
  })
}
