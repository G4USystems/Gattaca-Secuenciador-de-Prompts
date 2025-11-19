import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ECP Generator</h1>
            <p className="mt-2 text-gray-600">
              Sistema automatizado para generar estrategias de marketing ECP
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </Link>
        </div>

        {/* Projects will be loaded here */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 text-center text-gray-500">
            <p>Cargando proyectos...</p>
            <p className="text-sm mt-2">
              Esta página se conectará a Supabase para mostrar tus proyectos.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
