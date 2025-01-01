import { useEffect, useState } from 'react'
import { Sandpack } from '@codesandbox/sandpack-react'
import Editor from '@monaco-editor/react'
import { Folders, Play } from 'lucide-react'
import JSZip from 'jszip'
import { LoadingScreen } from './LoadingScreen'

type Tab = 'files' | 'preview'

interface CodePanelProps {
  code: string
}

interface FileWithExplanation {
  path: string
  content: string
  explanation?: string
}

interface FileInfo {
  path: string
  explanation: string
  content: string
}

interface ChangesJSON {
  files: FileInfo[]
}

const getFileLanguage = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'css': 'css',
    'html': 'html',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
  }
  return languageMap[ext] || 'plaintext'
}

const parseAIResponse = (response: string): FileWithExplanation[] => {
  try {
    // Extrair apenas o JSON da resposta
    const jsonContent = response.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1').trim()
    
    // Tentar parsear o JSON, se falhar, tentar limpar caracteres de escape extras
    let changes: ChangesJSON
    try {
      changes = JSON.parse(jsonContent)
    } catch (e) {
      // Remover escapes extras que a IA pode ter adicionado
      const cleanJson = jsonContent
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
      changes = JSON.parse(cleanJson)
    }
    
    // Converter cada arquivo do JSON
    return changes.files.map(file => ({
      path: file.path,
      content: file.content.replace(/\\n/g, '\n'),
      explanation: file.explanation
    }))

  } catch (error) {
    console.error('Erro ao processar JSON:', error)
    throw new Error('Formato de resposta inválido')
  }
}

const createFileTree = (files: Record<string, string>) => {
  return Object.keys(files)
    .filter(path => !path.endsWith('/.gitkeep'))
    .reduce((tree, path) => {
      const parts = path.split('/').filter(Boolean)
      let current = tree
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1
        const fullPath = '/' + parts.slice(0, i + 1).join('/')
        
        if (isFile) {
          current[part] = fullPath
        } else {
          current[part] = current[part] || {}
          current = current[part]
        }
      }
      
      return tree
    }, {} as Record<string, any>)
}

export function CodePanel({ code }: CodePanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const [activeFile, setActiveFile] = useState<string>('')
  const [files, setFiles] = useState<Record<string, string>>({})
  const [fileExplanations, setFileExplanations] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      if (!code) {
        setIsLoading(false)
        return
      }

      const parsedFiles = parseAIResponse(code)
      const newFiles: Record<string, string> = { ...files }
      const newExplanations: Record<string, string> = {}

      // Processar arquivos da resposta da IA
      parsedFiles.forEach(({ path, content, explanation }) => {
        newFiles[path] = content
        if (explanation) {
          newExplanations[path] = explanation
        }

        // Criar diretórios necessários
        const dirs = path.split('/').slice(1, -1)
        let currentPath = ''
        for (const dir of dirs) {
          currentPath += '/' + dir
          if (!Object.keys(newFiles).some(file => file.startsWith(currentPath + '/'))) {
            newFiles[currentPath + '/.gitkeep'] = ''
          }
        }
      })

      setFiles(newFiles)
      setFileExplanations(prev => ({ ...prev, ...newExplanations }))
      setActiveFile(prev => newFiles[prev] ? prev : (parsedFiles[0]?.path || ''))
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar código')
      setIsLoading(false)
    }
  }, [code])

  const fileTree = createFileTree(files)

  const renderTree = (node: Record<string, any>, level = 0): JSX.Element[] => {
    return Object.entries(node)
      .filter(([name]) => name !== '.gitkeep')
      .map(([name, value]) => {
        const isFile = typeof value === 'string'
        const path = isFile ? value : ''
        
        return (
          <div key={name} style={{ marginLeft: level * 16 }}>
            <button
              onClick={() => isFile && setActiveFile(path)}
              className={`w-full text-left px-2 py-1 rounded-lg text-sm ${
                isFile
                  ? activeFile === path
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/20 text-blue-400 rounded-lg'
                    : 'text-slate-300 hover:bg-slate-800/50 rounded-lg'
                  : 'text-slate-400 font-medium'
              }`}
              title={fileExplanations[path] || path}
            >
              {name}
            </button>
            {!isFile && renderTree(value, level + 1)}
          </div>
        )
    })
  }

  return (
    <div className="h-full bg-slate-900/50 border border-slate-700/50 rounded-lg backdrop-blur-sm flex flex-col">
      {(isLoading || error) && <LoadingScreen error={error} />}

      <div className="border-b border-slate-700/50">
        <div className="flex justify-between items-center pr-2">
          <div className="flex">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-xl'
              }`}
            >
              <Folders className="w-4 h-4" />
              Arquivos
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-xl'
              }`}
            >
              <Play className="w-4 h-4" />
              Preview
            </button>
          </div>
          <button
            onClick={() => {
              const zip = new JSZip();
              Object.entries(files).forEach(([path, content]) => {
                if (!path.endsWith('/.gitkeep')) {
                  zip.file(path.slice(1), content);
                }
              });
              zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'projeto.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-lg shadow-green-500/20 hover:from-green-500 hover:to-green-400 transition-all duration-300 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'files' ? (
          <div className="flex-1 flex h-full">
            <div className="w-48 border-r border-slate-700/50 p-2 overflow-auto">
              <div className="space-y-1">
                {renderTree(fileTree)}
              </div>
            </div>
            <div className="flex-1">
              {activeFile && (
                <>
                  {fileExplanations[activeFile] && (
                    <div className="p-2 border-b border-slate-700/50 bg-slate-800/50">
                      <p className="text-sm text-slate-400">{fileExplanations[activeFile]}</p>
                    </div>
                  )}
                  <Editor
                    height="80vh"
                    language={getFileLanguage(activeFile)}
                    theme="vs-dark"
                    value={files[activeFile] || ''}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <div className="w-[857px]">
              <Sandpack
                template="static"
                files={files}
                theme="dark"
                customSetup={{
                  entry: "/index.html"
                }}
                options={{
                  showNavigator: false,
                  showTabs: true,
                  showLineNumbers: true,
                  showInlineErrors: true,
                  showRefreshButton: true,
                  editorHeight: "85vh",
                  editorWidthPercentage: 0,
                  startRoute: "/",
                  classes: {
                    'sp-wrapper': 'h-full w-full border-none bg-transparent',
                    'sp-preview-container': 'h-full w-full bg-transparent',
                    'sp-preview-iframe': 'h-full w-full bg-transparent',
                    'sp-preview': 'h-full w-full'
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 