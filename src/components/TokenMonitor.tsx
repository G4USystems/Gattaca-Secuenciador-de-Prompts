'use client'

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatTokenCount, checkTokenLimits, TOKEN_LIMITS } from '@/lib/supabase'

interface TokenMonitorProps {
  totalTokens: number
  breakdown?: {
    label: string
    tokens: number
  }[]
}

export default function TokenMonitor({
  totalTokens,
  breakdown,
}: TokenMonitorProps) {
  const limits = checkTokenLimits(totalTokens)

  const getStatusIcon = () => {
    if (limits.isOverLimit) {
      return <AlertCircle className="text-red-600" size={24} />
    }
    if (limits.shouldWarn) {
      return <AlertTriangle className="text-yellow-600" size={24} />
    }
    return <CheckCircle className="text-green-600" size={24} />
  }

  const getStatusColor = () => {
    if (limits.isOverLimit) return 'red'
    if (limits.shouldWarn) return 'yellow'
    return 'green'
  }

  const color = getStatusColor()

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        color === 'red'
          ? 'border-red-300 bg-red-50'
          : color === 'yellow'
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-green-300 bg-green-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Monitor de Tokens
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Total: <strong>{formatTokenCount(totalTokens)}</strong> /{' '}
            {formatTokenCount(TOKEN_LIMITS.MAX_LIMIT)} ({limits.percentage}%)
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${
                color === 'red'
                  ? 'bg-red-600'
                  : color === 'yellow'
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(limits.percentage, 100)}%` }}
            />
          </div>

          {/* Warning Messages */}
          {limits.isOverLimit && (
            <div className="text-sm text-red-800 font-medium">
              ⚠️ El contexto excede el límite de 2M tokens. Reduce la cantidad
              de documentos o el tamaño de los mismos.
            </div>
          )}

          {limits.shouldWarn && !limits.isOverLimit && (
            <div className="text-sm text-yellow-800 font-medium">
              ⚠️ Te estás acercando al límite. Actualmente: {limits.percentage}
              % del máximo permitido.
            </div>
          )}

          {!limits.shouldWarn && (
            <div className="text-sm text-green-800">
              ✓ El tamaño del contexto está dentro de los límites seguros.
            </div>
          )}

          {/* Breakdown */}
          {breakdown && breakdown.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                Ver desglose por documento
              </summary>
              <div className="mt-2 space-y-1">
                {breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="font-mono">
                      {formatTokenCount(item.tokens)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
