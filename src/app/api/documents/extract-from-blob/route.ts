import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for processing multiple large files
export const dynamic = 'force-dynamic'

/**
 * API Route: Extract text content from files already uploaded to Blob Storage
 * Used for bulk upload with large files - files are uploaded to Blob first,
 * then this endpoint downloads and extracts content
 */
export async function POST(request: NextRequest) {
  try {
    const { blobFiles } = await request.json()

    if (!blobFiles || !Array.isArray(blobFiles) || blobFiles.length === 0) {
      return NextResponse.json(
        { error: 'No blob files provided' },
        { status: 400 }
      )
    }

    console.log(`Processing ${blobFiles.length} files from Blob Storage`)

    // Extract content from all files
    const extractedFiles = await Promise.all(
      blobFiles.map(async (blobFile: {
        blobUrl: string
        filename: string
        fileSize: number
        mimeType: string
      }) => {
        try {
          console.log(`Downloading ${blobFile.filename} from Blob...`)

          // Download file from Blob
          const response = await fetch(blobFile.blobUrl)
          if (!response.ok) {
            throw new Error(`Failed to download from Blob: ${response.statusText}`)
          }

          const arrayBuffer = await response.arrayBuffer()
          console.log(`Downloaded ${blobFile.filename}: ${arrayBuffer.byteLength} bytes`)

          // Validate file type
          const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
          ]

          if (!validTypes.includes(blobFile.mimeType)) {
            return {
              filename: blobFile.filename,
              success: false,
              error: 'Tipo de archivo no soportado',
              fileSize: blobFile.fileSize,
              mimeType: blobFile.mimeType,
            }
          }

          // Extract content based on mime type
          let extractedContent = ''

          if (blobFile.mimeType === 'application/pdf') {
            console.log(`Extracting PDF content from ${blobFile.filename}...`)
            extractedContent = await extractPDF(arrayBuffer)
          } else if (
            blobFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            blobFile.mimeType === 'application/msword'
          ) {
            console.log(`Extracting DOCX content from ${blobFile.filename}...`)
            extractedContent = await extractDOCX(arrayBuffer)
          } else if (blobFile.mimeType === 'text/plain') {
            console.log(`Reading TXT content from ${blobFile.filename}...`)
            const decoder = new TextDecoder()
            extractedContent = decoder.decode(arrayBuffer)
          }

          if (!extractedContent || extractedContent.trim().length === 0) {
            return {
              filename: blobFile.filename,
              success: false,
              error: 'No se pudo extraer contenido del archivo',
              fileSize: blobFile.fileSize,
              mimeType: blobFile.mimeType,
            }
          }

          // Calculate tokens
          const tokenCount = Math.ceil(extractedContent.length / 4)

          console.log(`✅ Extracted ${tokenCount} tokens from ${blobFile.filename}`)

          return {
            filename: blobFile.filename,
            success: true,
            extractedContent,
            tokenCount,
            fileSize: blobFile.fileSize,
            mimeType: blobFile.mimeType,
          }
        } catch (error) {
          console.error(`Error extracting ${blobFile.filename}:`, error)
          return {
            filename: blobFile.filename,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            fileSize: blobFile.fileSize,
            mimeType: blobFile.mimeType,
          }
        }
      })
    )

    const successCount = extractedFiles.filter((f) => f.success).length
    const failCount = extractedFiles.length - successCount

    console.log(`Extraction complete: ${successCount} success, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      files: extractedFiles,
      summary: {
        total: extractedFiles.length,
        success: successCount,
        failed: failCount,
      },
    })
  } catch (error) {
    console.error('Extract from blob error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PDF extraction using pdf-parse
async function extractPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // @ts-expect-error - pdf-parse doesn't have TypeScript types
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(Buffer.from(buffer))
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract PDF content')
  }
}

// DOCX extraction using mammoth
async function extractDOCX(buffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    return result.value
  } catch (error) {
    console.error('DOCX extraction error:', error)
    throw new Error('Failed to extract DOCX content')
  }
}
