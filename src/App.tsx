import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Chat } from './components/Chat'
import { CodePanel } from './components/CodePanel'

const queryClient = new QueryClient()

function App() {
  const [generatedCode, setGeneratedCode] = useState<string>('')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-8 flex gap-6">
        <div className="w-[400px] animate-float">
          <Chat onCodeGenerated={setGeneratedCode} />
        </div>
        <div className="flex-1 animate-float-delayed">
          <CodePanel code={generatedCode} />
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
