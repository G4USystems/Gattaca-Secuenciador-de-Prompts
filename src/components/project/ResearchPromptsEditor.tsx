'use client'

import { useState } from 'react'
import { Plus, X, Save, BookOpen, Copy, Check } from 'lucide-react'

interface ResearchPrompt {
  id: string
  name: string
  content: string
}

interface ResearchPromptsEditorProps {
  projectId: string
  initialPrompts: ResearchPrompt[]
  onUpdate?: () => void
}

export default function ResearchPromptsEditor({
  projectId,
  initialPrompts,
  onUpdate,
}: ResearchPromptsEditorProps) {
  const [prompts, setPrompts] = useState<ResearchPrompt[]>(initialPrompts || [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const addPrompt = () => {
    setPrompts([
      ...prompts,
      { id: crypto.randomUUID(), name: '', content: '' },
    ])
  }

  const updatePrompt = (
    index: number,
    field: keyof ResearchPrompt,
    value: string
  ) => {
    const updated = [...prompts]
    updated[index] = { ...updated[index], [field]: value }
    setPrompts(updated)
  }

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index))
  }

  const copyPromptContent = async (prompt: ResearchPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('No se pudo copiar al portapapeles')
    }
  }

  const handleSave = async () => {
    // Validate: all prompts must have a name and content
    const invalidName = prompts.find((p) => !p.name.trim())
    if (invalidName) {
      alert('Todos los prompts deben tener un nombre')
      return
    }

    const invalidContent = prompts.find((p) => !p.content.trim())
    if (invalidContent) {
      alert('Todos los prompts deben tener contenido')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deep_research_prompts: prompts,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update research prompts')
      }

      alert('Prompts de research guardados exitosamente')
      setIsEditing(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error saving research prompts:', error)
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPrompts(initialPrompts || [])
    setIsEditing(false)
  }

  if (!isEditing && prompts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Prompts de Deep Research</h3>
          </div>
        </div>

        <div className="text-center py-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
          <BookOpen size={32} className="mx-auto mb-3 text-purple-400" />
          <p className="text-gray-600 mb-4">
            No hay prompts de research definidos
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Los prompts de research ayudan a los usuarios a generar documentos adicionales
            para cada campaña. Pueden incluir variables con formato {'{{variable}}'}.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Agregar Prompts de Research
          </button>
        </div>
      </div>
    )
  }

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Prompts de Deep Research</h3>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
              {prompts.length} prompts
            </span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
          >
            Editar
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Estos prompts aparecerán en cada campaña con las variables reemplazadas por sus valores reales.
        </p>

        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-purple-50 border border-purple-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-purple-800">{prompt.name}</h4>
                <button
                  onClick={() => copyPromptContent(prompt)}
                  className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 transition-colors ${
                    copiedId === prompt.id
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  title="Copiar contenido del prompt"
                >
                  {copiedId === prompt.id ? (
                    <>
                      <Check size={12} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-purple-700 whitespace-pre-wrap max-h-40 overflow-y-auto bg-white/50 rounded p-2 border border-purple-100">
                {prompt.content.length > 500
                  ? `${prompt.content.substring(0, 500)}...`
                  : prompt.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prompts de Deep Research</h3>
        </div>
        <button
          onClick={addPrompt}
          className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 inline-flex items-center gap-1"
        >
          <Plus size={16} />
          Agregar Prompt
        </button>
      </div>

      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Estos prompts ayudan a los usuarios a generar documentación adicional
          para cada campaña. Usa {'{{variable}}'} para incluir variables que se
          reemplazarán con los valores de cada campaña.
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mb-4">
          <p className="text-sm text-gray-500">
            No hay prompts. Click en "Agregar Prompt" para crear uno.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className="border border-purple-300 rounded-lg p-4 bg-purple-50"
            >
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre del Prompt *
                </label>
                <input
                  type="text"
                  value={prompt.name}
                  onChange={(e) => updatePrompt(index, 'name', e.target.value)}
                  placeholder="ej: Análisis de Competidores"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contenido del Prompt *
                </label>
                <textarea
                  value={prompt.content}
                  onChange={(e) => updatePrompt(index, 'content', e.target.value)}
                  placeholder="Escribe el prompt aquí. Usa {{variable}} para incluir variables de la campaña..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder:text-gray-400 resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: "Analiza el problema de {'{{problem_core}}'} en {'{{country}}'} para el sector {'{{industry}}'}..."
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => removePrompt(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center gap-1"
                >
                  <X size={18} />
                  <span className="text-xs">Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar Prompts'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
