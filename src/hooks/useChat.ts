import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatWithGemini } from '../lib/gemini'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseChatProps {
  onCodeGenerated: (code: string) => void
}

export function useChat({ onCodeGenerated }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async (message: string) => {
      const userMessage: ChatMessage = { role: 'user', content: message }
      setMessages(prev => [...prev, userMessage])

      const response = await chatWithGemini([...messages, userMessage])
      const assistantMessage: ChatMessage = { role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMessage])

      // Extrair código se houver
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