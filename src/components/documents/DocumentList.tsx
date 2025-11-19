'use client'

import { FileText, Trash2, Eye } from 'lucide-react'
import { DocCategory } from '@/types/database.types'
import { formatTokenCount } from '@/lib/supabase'

interface Document {
  id: string
  filename: string
  category: DocCategory
  token_count: number | null
  file_size_bytes: number | null
  created_at: string
}

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => void
  onView: (doc: Document) => void
}

export default function DocumentList({
  documents,
  onDelete,
  onView,
}: DocumentListProps) {
  const getCategoryBadge = (category: DocCategory) => {
    const styles = {
      product: 'bg-blue-100 text-blue-800',
      competitor: 'bg-purple-100 text-purple-800',
      research: 'bg-green-100 text-green-800',
      output: 'bg-orange-100 text-orange-800',
    }

    const labels = {
      product: '📦 Producto',
      competitor: '🎯 Competidor',
      research: '🔬 Research',
      output: '📝 Output',
    }

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${styles[category]}`}
      >
        {labels[category]}
      </span>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>No hay documentos todavía</p>
        <p className="text-sm mt-2">
          Sube PDFs o DOCX con información de producto, competidores o research
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-gray-400 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 truncate">
                  {doc.filename}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                {getCategoryBadge(doc.category)}
                {doc.token_count && (
                  <span className="text-gray-500">
                    {formatTokenCount(doc.token_count)} tokens
                  </span>
                )}
                {doc.file_size_bytes && (
                  <span className="text-gray-500">
                    {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                <span className="text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(doc)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Ver contenido"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `¿Eliminar "${doc.filename}"? Esta acción no se puede deshacer.`
                    )
                  ) {
                    onDelete(doc.id)
                  }
                }}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
