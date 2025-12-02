'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Save, RotateCcw, Eye, Edit2, AlertTriangle, Table, Download, Sparkles, Loader2, Check, XCircle, MousePointer2 } from 'lucide-react'
import MarkdownRenderer, { extractTables, tablesToCSV } from '../common/MarkdownRenderer'

interface StepOutputEditorProps {
  campaignId: string
  campaignName: string
  stepId: string
  stepName: string
  stepOrder: number
  currentOutput: {
    step_name: string
    output: string
    tokens?: number
    status: string
    completed_at?: string
    edited_at?: string
    original_output?: string
  }
  allStepOutputs: Record<string, any>
  onSave: (updatedStepOutputs: Record<string, any>) => void
  onClose: () => void
}

// Find changed sections between original and modified text
function findChangedSections(original: string, modified: string): { start: number; end: number; type: 'changed' }[] {
  const changes: { start: number; end: number; type: 'changed' }[] = []

  // Simple approach: find sequences that differ
  // Split into paragraphs/sections for better matching
  const originalParts = original.split(/(\n\n+)/)
  const modifiedParts = modified.split(/(\n\n+)/)

  let modifiedPos = 0

  for (let i = 0; i < modifiedParts.length; i++) {
    const modPart = modifiedParts[i]
    const origPart = originalParts[i] || ''

    // If this part is different from original
    if (modPart !== origPart && modPart.trim()) {
      changes.push({
        start: modifiedPos,
        end: modifiedPos + modPart.length,
        type: 'changed'
      })
    }

    modifiedPos += modPart.length
  }

  // If modified is longer, mark the rest as changed
  if (modifiedParts.length > originalParts.length) {
    const extraStart = originalParts.join('').length
    if (extraStart < modified.length) {
      changes.push({
        start: extraStart,
        end: modified.length,
        type: 'changed'
      })
    }
  }

  return changes
}

// Component to render markdown with highlighted changes
function MarkdownWithHighlights({
  content,
  highlights
}: {
  content: string
  highlights: { start: number; end: number; type: 'changed' }[]
}) {
  if (highlights.length === 0) {
    return <MarkdownRenderer content={content} />
  }

  // Build content with highlight markers
  let markedContent = ''
  let lastEnd = 0

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start)

  for (const hl of sortedHighlights) {
    // Add unmarked content before this highlight
    if (hl.start > lastEnd) {
      markedContent += content.slice(lastEnd, hl.start)
    }
    // Add highlighted content with special markers
    markedContent += `<mark class="ai-change">${content.slice(hl.start, hl.end)}</mark>`
    lastEnd = hl.end
  }

  // Add remaining content
  if (lastEnd < content.length) {
    markedContent += content.slice(lastEnd)
  }

  return (
    <div className="markdown-with-highlights">
      <style jsx global>{`
        .markdown-with-highlights mark.ai-change,
        .markdown-with-highlights .ai-change {
          background: linear-gradient(to bottom, #dcfce7 0%, #bbf7d0 100%);
          border-left: 3px solid #22c55e;
          padding: 2px 4px;
          margin: -2px 0;
          border-radius: 2px;
          display: inline;
        }
        .markdown-with-highlights p mark.ai-change,
        .markdown-with-highlights li mark.ai-change {
          display: inline;
        }
      `}</style>
      <MarkdownRenderer content={markedContent} />
    </div>
  )
}

export default function StepOutputEditor({
  campaignId,
  campaignName,
  stepId,
  stepName,
  stepOrder,
  currentOutput,
  allStepOutputs,
  onSave,
  onClose,
}: StepOutputEditorProps) {
  const [editedOutput, setEditedOutput] = useState(currentOutput.output || '')
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  // Selection state
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Store original output for revert functionality
  const originalOutput = currentOutput.original_output || currentOutput.output

  // Extract tables from the content
  const tables = useMemo(() => extractTables(aiSuggestion || editedOutput), [aiSuggestion, editedOutput])

  // Find changed sections for highlighting
  const changedSections = useMemo(() => {
    if (!aiSuggestion) return []
    return findChangedSections(editedOutput, aiSuggestion)
  }, [editedOutput, aiSuggestion])

  // Handle text selection
  const handleTextSelection = () => {
    if (!selectionMode) return

    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    }
  }

  const clearSelection = () => {
    setSelectedText(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleTextChange = (value: string) => {
    setEditedOutput(value)
    setHasChanges(value !== currentOutput.output)
  }

  const handleSuggestionChange = (value: string) => {
    setAiSuggestion(value)
  }

  const handleGenerateSuggestion = async () => {
    if (!aiPrompt.trim()) {
      alert('Por favor, describe qué cambios deseas realizar.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/campaign/suggest-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOutput: aiSuggestion || editedOutput,
          instruction: aiPrompt,
          stepName,
          campaignName,
          selectedText: selectedText || undefined, // Send selection context if available
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAiSuggestion(data.suggestion)
        setAiPrompt('')
        setSelectedText(null) // Clear selection after generating
        setSelectionMode(false)
      } else {
        throw new Error(data.error || 'Failed to generate suggestion')
      }
    } catch (error) {
      console.error('Error generating suggestion:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplySuggestion = () => {
    if (aiSuggestion) {
      setEditedOutput(aiSuggestion)
      setHasChanges(aiSuggestion !== currentOutput.output)
      setAiSuggestion(null)
      setIsEditing(true)
    }
  }

  const handleDiscardSuggestion = () => {
    setAiSuggestion(null)
    setAiPrompt('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedStepOutputs = {
        ...allStepOutputs,
        [stepId]: {
          ...currentOutput,
          output: editedOutput,
          edited_at: new Date().toISOString(),
          original_output: currentOutput.original_output || currentOutput.output,
        },
      }

      const response = await fetch(`/api/campaign/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_outputs: updatedStepOutputs }),
      })

      const data = await response.json()

      if (data.success) {
        onSave(updatedStepOutputs)
        setHasChanges(false)
        setIsEditing(false)
        alert('Output guardado correctamente.')
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving output:', error)
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleRevert = () => {
    if (confirm('¿Restaurar el output original generado por la IA?')) {
      setEditedOutput(originalOutput)
      setHasChanges(originalOutput !== currentOutput.output)
      setAiSuggestion(null)
      setIsEditing(true)
    }
  }

  const handleExportTables = () => {
    if (tables.length === 0) {
      alert('No se encontraron tablas en el output.')
      return
    }

    const csv = tablesToCSV(tables)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stepName.replace(/\s+/g, '_')}_tables.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isEdited = !!currentOutput.edited_at || !!currentOutput.original_output
  const displayContent = aiSuggestion || editedOutput
  const charCount = displayContent.length
  const wordCount = displayContent.trim() ? displayContent.trim().split(/\s+/).length : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Step {stepOrder}
              </span>
              <h2 className="text-lg font-semibold text-gray-900">{stepName} - Output</h2>
              {isEdited && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <Edit2 size={10} />
                  Editado
                </span>
              )}
              {aiSuggestion && (
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <Sparkles size={10} />
                  Sugerencia AI
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{campaignName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Assistant Bar */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles size={18} />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                    e.preventDefault()
                    handleGenerateSuggestion()
                  }
                }}
                placeholder={selectedText
                  ? `Instrucción para la selección: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`
                  : aiSuggestion
                    ? "Pide más cambios a la sugerencia..."
                    : "Describe qué cambios deseas (ej: 'Agrega más detalle sobre X')..."
                }
                className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-400"
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateSuggestion}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Sugerir
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selection indicator and mode toggle */}
          <div className="flex items-center gap-4 mt-2">
            {!aiSuggestion && !isEditing && (
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode)
                  if (selectionMode) clearSelection()
                }}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                  selectionMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <MousePointer2 size={12} />
                {selectionMode ? 'Selección activa' : 'Seleccionar texto'}
              </button>
            )}

            {selectedText && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded max-w-xs truncate">
                  📌 "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                </span>
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {aiSuggestion && (
              <p className="text-xs text-purple-600">
                💡 Los cambios están resaltados en verde. Puedes editar, pedir más cambios, o aplicar/descartar.
              </p>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{charCount.toLocaleString()} caracteres</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} palabras</span>
              {currentOutput.tokens && (
                <>
                  <span>•</span>
                  <span>{currentOutput.tokens.toLocaleString()} tokens</span>
                </>
              )}
            </div>
            {tables.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleExportTables}
                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                >
                  <Table size={12} />
                  <span>Exportar {tables.length} tabla{tables.length > 1 ? 's' : ''}</span>
                  <Download size={10} />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            {currentOutput.completed_at && (
              <span>Generado: {new Date(currentOutput.completed_at).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          {aiSuggestion ? (
            // AI Suggestion Mode - show markdown with highlighted changes
            <div
              ref={contentRef}
              className="h-full overflow-auto bg-white rounded-lg border border-purple-200 p-6"
            >
              <div className="text-xs text-gray-500 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded border-l-2 border-green-500">
                  Cambios sugeridos
                </span>
                <span className="text-gray-400">El contenido modificado está resaltado en verde</span>
              </div>
              <MarkdownWithHighlights
                content={aiSuggestion}
                highlights={changedSections}
              />
            </div>
          ) : isEditing ? (
            // Manual editing mode
            <textarea
              value={editedOutput}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-full resize-none bg-white rounded-lg border border-blue-300 p-4 text-sm text-gray-900 font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              placeholder="Output del paso..."
              autoFocus
            />
          ) : (
            // Preview mode with markdown rendering and optional selection
            <div
              ref={contentRef}
              className={`h-full overflow-auto bg-white rounded-lg border p-6 ${
                selectionMode
                  ? 'border-purple-300 cursor-text selection:bg-purple-200'
                  : 'border-gray-200'
              }`}
              onMouseUp={handleTextSelection}
            >
              {selectionMode && (
                <div className="text-xs text-purple-600 mb-4 pb-3 border-b border-purple-100">
                  👆 Selecciona el texto que quieres modificar, luego escribe la instrucción arriba
                </div>
              )}
              {editedOutput ? (
                <MarkdownRenderer content={editedOutput} />
              ) : (
                <span className="text-gray-400 italic">No hay output generado todavía.</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            {isEdited && !isEditing && !aiSuggestion && (
              <button
                onClick={handleRevert}
                disabled={saving}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Restaurar Original
              </button>
            )}
            {hasChanges && !aiSuggestion && (
              <span className="text-sm text-amber-600 inline-flex items-center gap-1">
                <AlertTriangle size={14} />
                Cambios sin guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {aiSuggestion ? (
              // AI Suggestion actions
              <>
                <button
                  onClick={handleDiscardSuggestion}
                  className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 inline-flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  Descartar
                </button>
                <button
                  onClick={() => {
                    // Switch to edit mode for the suggestion
                    setIsEditing(true)
                    setEditedOutput(aiSuggestion)
                    setAiSuggestion(null)
                    setHasChanges(true)
                  }}
                  className="px-4 py-2 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 inline-flex items-center gap-1.5"
                >
                  <Edit2 size={14} />
                  Editar Manualmente
                </button>
                <button
                  onClick={handleApplySuggestion}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Aplicar y Guardar
                </button>
              </>
            ) : isEditing ? (
              // Manual editing actions
              <>
                <button
                  onClick={() => {
                    if (hasChanges && !confirm('¿Descartar cambios?')) return
                    setEditedOutput(currentOutput.output || '')
                    setHasChanges(false)
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Guardar
                    </>
                  )}
                </button>
              </>
            ) : (
              // Preview mode actions
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <Edit2 size={14} />
                  Editar Manual
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
