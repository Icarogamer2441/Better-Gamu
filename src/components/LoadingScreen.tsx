import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  error?: string
  status?: string
}

export function LoadingScreen({ error, status }: LoadingScreenProps) {
  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-4">
        {error ? (
          <>
            <div className="text-red-400 mb-4">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Erro ao inicializar ambiente</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-sm font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Inicializando ambiente de desenvolvimento
            </h3>
            {status && (
              <p className="text-sm text-slate-400">{status}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
} 