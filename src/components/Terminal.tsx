import { useState, useEffect, useRef } from 'react'

interface TerminalProps {
  onCommand: (command: string) => Promise<string>
  disabled?: boolean
}

export function Terminal({ onCommand, disabled }: TerminalProps) {
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const command = input.trim()
    setInput('')
    setHistory(prev => [...prev, { command, output: 'Executando...' }])

    const output = await onCommand(command)
    setHistory(prev => {
      const newHistory = [...prev]
      newHistory[newHistory.length - 1].output = output
      return newHistory
    })
  }

  return (
    <div className="bg-gray-900 text-gray-100 font-mono text-sm p-4 h-full overflow-auto">
      {disabled ? (
        <div className="text-yellow-400">
          ⚠️ Terminal não disponível no modo CDN
        </div>
      ) : (
        <>
          {history.map((entry, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-center text-green-400">
                <span className="mr-2">$</span>
                <span>{entry.command}</span>
              </div>
              <div className="ml-4 text-gray-300 whitespace-pre-wrap">{entry.output}</div>
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex items-center">
            <span className="text-green-400 mr-2">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-100"
              placeholder="Digite um comando..."
            />
          </form>
          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
} 