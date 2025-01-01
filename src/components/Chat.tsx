import { useState } from 'react'
import { useChat } from '../hooks/useChat'
import { Send } from 'lucide-react'

interface ChatProps {
  onCodeGenerated: (code: string) => void
}

export function Chat({ onCodeGenerated }: ChatProps) {
  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading, setMessages } = useChat({ onCodeGenerated })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input)
    setInput('')
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Chat com Gemini</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const key = prompt('Digite sua API Key do Google Gemini:')
                if (key) {
                  localStorage.setItem('gemini_api_key', key)
                  window.location.reload()
                }
              }}
              className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
              title="Configurar API Key"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={() => setMessages([])}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors"
              title="Limpar histórico"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600/20 text-blue-100'
                    : 'bg-slate-800/50 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className={`
              flex-1 bg-slate-800/50 border rounded-xl px-4 py-3
              text-slate-100 placeholder:text-slate-400 
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
              ${isLoading ? 'animate-rainbow-border' : 'border-slate-700/50'}
            `}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  )
} 