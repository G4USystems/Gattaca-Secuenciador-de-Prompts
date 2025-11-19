'use client'

import { useState, useEffect } from 'react'
import { Play, CheckCircle, Clock, AlertCircle, Download, Copy } from 'lucide-react'

interface CampaignRunnerProps {
  projectId: string
}

interface Campaign {
  id: string
  ecp_name: string
  problem_core: string
  country: string
  industry: string
  status: string
  current_step_id: string | null
  step_outputs: Record<string, any>
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export default function CampaignRunner({ projectId }: CampaignRunnerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  // Form state
  const [ecpName, setEcpName] = useState('')
  const [problemCore, setProblemCore] = useState('')
  const [country, setCountry] = useState('')
  const [industry, setIndustry] = useState('')

  useEffect(() => {
    loadCampaigns()
  }, [projectId])

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaign/create?projectId=${projectId}`)
      const data = await response.json()

      if (data.success) {
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!ecpName || !problemCore || !country || !industry) {
      alert('Por favor completa todos los campos')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/campaign/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ecp_name: ecpName,
          problem_core: problemCore,
          country,
          industry,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Campaign created successfully')
        setShowNewForm(false)
        setEcpName('')
        setProblemCore('')
        setCountry('')
        setIndustry('')
        loadCampaigns()
      } else {
        throw new Error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleRunCampaign = async (campaignId: string) => {
    if (!confirm('¿Ejecutar esta campaña? Esto puede tomar varios minutos.')) {
      return
    }

    setRunning(campaignId)
    try {
      const response = await fetch('/api/campaign/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ Campaign completed! ${data.steps_completed} steps executed in ${(data.duration_ms / 1000).toFixed(1)}s`)
        loadCampaigns()
      } else {
        throw new Error(data.error || 'Execution failed')
      }
    } catch (error) {
      console.error('Error running campaign:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRunning(null)
    }
  }

  const handleDuplicateCampaign = async (campaignId: string) => {
    setDuplicating(campaignId)
    try {
      const response = await fetch('/api/campaign/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Campaign duplicated successfully')
        loadCampaigns()
      } else {
        throw new Error(data.error || 'Failed to duplicate')
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDuplicating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-600" />
      case 'running':
        return <Clock size={20} className="text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />
      default:
        return <Clock size={20} className="text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'running':
        return 'Running...'
      case 'error':
        return 'Error'
      case 'draft':
        return 'Ready to run'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cargando campañas...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Campañas</h2>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showNewForm ? 'Cancelar' : '+ Nueva Campaña'}
        </button>
      </div>

      {/* New Campaign Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-4">Create New Campaign</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ECP Name *
              </label>
              <input
                type="text"
                value={ecpName}
                onChange={(e) => setEcpName(e.target.value)}
                placeholder="e.g., Fintech for SMEs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Core *
              </label>
              <input
                type="text"
                value={problemCore}
                onChange={(e) => setProblemCore(e.target.value)}
                placeholder="e.g., Access to credit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Mexico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Financial Services"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateCampaign}
                disabled={creating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay campañas todavía</p>
          <p className="text-sm mt-2">Crea una campaña para empezar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{campaign.ecp_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {campaign.problem_core} • {campaign.country} • {campaign.industry}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(campaign.status)}
                  <span className="text-sm font-medium">
                    {getStatusLabel(campaign.status)}
                  </span>
                </div>
              </div>

              {/* Step outputs summary */}
              {campaign.step_outputs && Object.keys(campaign.step_outputs).length > 0 && (
                <div className="mb-3 text-sm text-gray-600">
                  <p>
                    Steps completed: {Object.keys(campaign.step_outputs).length}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleRunCampaign(campaign.id)}
                    disabled={running === campaign.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <Play size={16} />
                    {running === campaign.id ? 'Running...' : 'Run Campaign'}
                  </button>
                )}

                {campaign.status === 'completed' && (
                  <button
                    onClick={() => {
                      const outputs = campaign.step_outputs
                      const text = Object.entries(outputs)
                        .map(([stepId, data]: [string, any]) => {
                          return `=== ${data.step_name} ===\n\n${data.output}\n\n`
                        })
                        .join('\n')

                      const blob = new Blob([text], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${campaign.ecp_name.replace(/\s+/g, '_')}_outputs.txt`
                      a.click()
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Outputs
                  </button>
                )}

                {campaign.status === 'completed' && (
                  <button
                    onClick={() => {
                      const outputs = campaign.step_outputs
                      const message = Object.entries(outputs)
                        .map(([stepId, data]: [string, any]) => {
                          return `${data.step_name}:\n${data.output.substring(0, 200)}...`
                        })
                        .join('\n\n')
                      alert(message)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    View Summary
                  </button>
                )}

                <button
                  onClick={() => handleDuplicateCampaign(campaign.id)}
                  disabled={duplicating === campaign.id}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  title="Duplicate this campaign"
                >
                  <Copy size={16} />
                  {duplicating === campaign.id ? 'Duplicating...' : 'Duplicate'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Created: {new Date(campaign.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
