import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatWithGemini } from '../lib/gemini'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseChatProps {
  onCodeGenerated: (code: string) => void
}

interface ImageData {
  mimeType: string;
  data: string;
}

export function useChat({ onCodeGenerated }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_history')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages))
  }, [messages])

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async (params: { message: string; imageData?: ImageData }) => {
      const userMessage: ChatMessage = { 
        role: 'user', 
        content: params.imageData 
          ? `[Imagem de referência em base64:${params.imageData.data}]\n${params.message}`
          : params.message 
      }
      
      setMessages(prev => [...prev, userMessage])

      const response = await chatWithGemini([...messages, userMessage], params.imageData)
      const assistantMessage: ChatMessage = { role: 'assistant', content: response }
      
      setMessages(prev => [...prev, assistantMessage])

      const codeMatch = response.match(/```(?:typescript|jsx)?\s*([\s\S]*?)```/)
      if (codeMatch) {
        onCodeGenerated(codeMatch[1])
      }

      return response
    },
  })

  return {
    messages,
    sendMessage,
    isLoading,
    setMessages,
  }
} 