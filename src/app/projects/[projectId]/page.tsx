'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Settings, Rocket, Database } from 'lucide-react'

type TabType = 'documents' | 'config' | 'campaigns' | 'context'

export default function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const [activeTab, setActiveTab] = useState<TabType>('documents')

  const tabs = [
    { id: 'documents' as TabType, label: 'Documentos', icon: FileText },
    { id: 'context' as TabType, label: 'Configuración de Contexto', icon: Database },
    { id: 'config' as TabType, label: 'Prompts', icon: Settings },
    { id: 'campaigns' as TabType, label: 'Campañas', icon: Rocket },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Volver a proyectos
        </Link>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Proyecto: {params.projectId}
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona documentos, configura prompts y ejecuta campañas
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'documents' && (
              <DocumentsTab projectId={params.projectId} />
            )}
            {activeTab === 'context' && (
              <ContextConfigTab projectId={params.projectId} />
            )}
            {activeTab === 'config' && (
              <PromptsConfigTab projectId={params.projectId} />
            )}
            {activeTab === 'campaigns' && (
              <CampaignsTab projectId={params.projectId} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// Tab Components (placeholders)
function DocumentsTab({ projectId }: { projectId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Base de Conocimiento</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Subir Documento
        </button>
      </div>
      <div className="text-center py-12 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>No hay documentos todavía</p>
        <p className="text-sm mt-2">
          Sube PDFs o DOCX con información de producto, competidores o research
        </p>
      </div>
    </div>
  )
}

function ContextConfigTab({ projectId }: { projectId: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Configuración de Contexto por Paso
      </h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          💡 Aquí defines qué documentos se usarán en cada paso del proceso.
          Esto te da control granular sobre qué información ve el modelo en cada etapa.
        </p>
      </div>

      <div className="space-y-6">
        {['step_1', 'step_2', 'step_3', 'step_4'].map((step) => (
          <div key={step} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">
              {step === 'step_1' && '🎯 Step 1: Find Place'}
              {step === 'step_2' && '🔧 Step 2: Select Assets'}
              {step === 'step_3' && '✅ Step 3: Proof Points'}
              {step === 'step_4' && '📝 Step 4: Final Output'}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los documentos que se usarán en este paso
            </p>
            <div className="text-sm text-gray-500">
              No hay documentos seleccionados para este paso
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PromptsConfigTab({ projectId }: { projectId: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prompts Maestros</h2>
      <p className="text-gray-600 mb-6">
        Edita los prompts que se usarán en cada paso del proceso
      </p>
      <div className="space-y-4">
        {[
          'Deep Research',
          'Step 1: Find Place',
          'Step 2: Select Assets',
          'Step 3: Proof Points',
          'Step 4: Final Output',
        ].map((prompt) => (
          <div key={prompt} className="border border-gray-200 rounded-lg p-4">
            <label className="block font-medium mb-2">{prompt}</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder={`Prompt para ${prompt}...`}
            />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}

function CampaignsTab({ projectId }: { projectId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Campañas por Nicho</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Nueva Campaña
        </button>
      </div>
      <div className="text-center py-12 text-gray-500">
        <Rocket size={48} className="mx-auto mb-4 opacity-50" />
        <p>No hay campañas todavía</p>
        <p className="text-sm mt-2">
          Crea una campaña especificando el nicho, país e industria
        </p>
      </div>
    </div>
  )
}
