import { useState, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import { Send, Star, Image as ImageIcon } from 'lucide-react'
import { optimizePrompt } from '../lib/gemini'

interface ChatProps {
  onCodeGenerated: (code: string) => void
}

export function Chat({ onCodeGenerated }: ChatProps) {
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<{ url: string; base64: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { messages, sendMessage, isLoading, setMessages } = useChat({ onCodeGenerated })
  const [isOptimizing, setIsOptimizing] = useState(false)

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.type !== 'image/png') {
      alert('Por favor, selecione apenas arquivos PNG')
      return
    }

    try {
      const base64Image = await convertImageToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage({ url: imageUrl, base64: base64Image })
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      alert('Erro ao processar imagem')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input
    let imageData: { mimeType: string; data: string } | undefined

    if (selectedImage) {
      // Extrair apenas a parte base64 da string, removendo o prefixo data:image/png;base64,
      const base64Data = selectedImage.base64.split(',')[1]
      imageData = {
        mimeType: 'image/png',
        data: base64Data
      }
    }

    await sendMessage({ message, imageData })
    setInput('')
    setSelectedImage(null)
  }

  const handleOptimizePrompt = async () => {
    if (!input.trim() || isLoading) return
    setIsOptimizing(true)
    
    try {
      const response = await optimizePrompt(input)
      const optimizedPrompt = response.replace(/^.*?["'](.+?)["'].*$/s, '$1')
      setInput(optimizedPrompt)
    } catch (error) {
      console.error('Erro ao otimizar prompt:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getContextIndicator = () => {
    if (messages.length === 0) return null
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) return null

    return (
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <p className="text-xs text-slate-400">
          Contexto atual: {lastUserMessage.content.slice(0, 100)}...
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Chat com Gemini</h2>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Adicionar imagem PNG"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
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

      {getContextIndicator()}
      
      <div className="flex-1 p-4 overflow-auto space-y-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[90%] sm:max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-blue-600/20 text-blue-100 hover:bg-blue-600/30 transition-colors'
                  : 'bg-slate-800/50 text-slate-100 hover:bg-slate-800/70 transition-colors'
              }`}
            >
              {message.role === 'user' && message.content.includes('base64:') && (
                <img 
                  src={message.content.match(/base64:(.*?)\]/)?.[1]} 
                  alt="Referência"
                  className="max-w-full h-auto rounded-lg mb-2"
                />
              )}
              <p className="whitespace-pre-wrap break-words">
                {message.content.replace(/\[Imagem de referência em base64:.*?\]/, '')}
              </p>
            </div>
          </div>
        ))}
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
            type="button"
            onClick={handleOptimizePrompt}
            disabled={isLoading || !input.trim()}
            className={`
              px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 
              hover:from-yellow-500 hover:to-yellow-400 
              disabled:opacity-50 rounded-xl transition-all duration-300 
              shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40
              ${isOptimizing ? 'animate-optimize-glow' : ''}
            `}
            title="Otimizar prompt"
          >
            <Star className={`h-4 w-4 text-white ${isOptimizing ? 'animate-pulse' : ''}`} />
          </button>
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