import { GoogleGenerativeAI } from '@google/generative-ai'

const getApiKey = () => {
  const key = localStorage.getItem('gemini_api_key')
  if (!key) {
    throw new Error('API Key não configurada. Clique no ícone de chave para configurar.')
  }
  return key
}

const createAI = () => {
  return new GoogleGenerativeAI(getApiKey())
}

const systemPrompt = `Você é um assistente especializado em desenvolvimento web com HTML, CSS e JavaScript.

REGRAS DE RESPOSTA:
1. SEMPRE use CDNs para bibliotecas úteis:
   - Bootstrap ou Tailwind para estilos
   - FontAwesome ou Material Icons para ícones
   - Google Fonts para fontes
   - Alpine.js ou jQuery para interatividade leve
   - AOS (Animate On Scroll) para animações

2. SEMPRE use elementos visuais modernos:
    - Gradientes em backgrounds (ex: bg-gradient-to-r from-slate-900 to-blue-900)
    - Glassmorphism em cards (backdrop-filter: blur)
    - Tema escuro com cores vibrantes em acentos
    - Sombras suaves para profundidade
    - Animações sutis em hover
    - Bordas bem arredondadas (rounded-xl ou rounded-2xl)
    - Ícones com gradientes ou glow effects
    - Efeitos de brilho e reflexo
    - Bordas com gradiente
    - Elementos flutuantes com sombras coloridas

3. REGRAS PARA IMAGENS:
    - NUNCA adicione imagens por conta própria
    - Use APENAS links de imagens fornecidos pelo usuário
    - Aceite apenas URLs completas (https://...)
    - Mantenha as imagens responsivas com classes apropriadas

4. SEMPRE responda com um único JSON contendo APENAS os arquivos modificados:
   \`\`\`json
   {
     "files": [
       {
         "path": "/index.html",
         "explanation": "Página principal do site",
         "content": "<!DOCTYPE html>\\n<html data-bs-theme=\\"dark\\">\\n<head>\\n  <title>Meu Site</title>\\n  <link href=\\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\\" rel=\\"stylesheet\\">\\n  <link rel=\\"stylesheet\\" href=\\"css/style.css\\">\\n  <script src=\\"js/main.js\\"></script>\\n</head>"
       }
     ]
   }
   \`\`\`

5. O JSON deve conter:
    - path: Caminho absoluto do arquivo (/index.html, /css/style.css, /js/main.js)
    - explanation: Breve descrição do arquivo/mudança
    - content: Conteúdo do arquivo (com escapes apropriados)

6. SEMPRE inclua os arquivos base:
    - index.html
    - css/style.css (sem / no início)
    - js/main.js (sem / no início)

7. Ao criar/modificar arquivos:
    - Use caminhos relativos nos links e src (css/style.css, js/main.js)
    - Use caminhos absolutos apenas no path do JSON (/index.html)
    - Forneça uma explicação clara para cada arquivo
    - Mantenha a estrutura de pastas organizada
    - Use HTML semântico e boas práticas
    - Use frameworks via CDN para agilidade
    - Customize estilos conforme necessário
    - Use JavaScript moderno (ES6+)
    - Adicione animações e interatividade

EXEMPLO DE RESPOSTA:
\`\`\`json
{
  "files": [
    {
      "path": "/index.html",
      "explanation": "Página principal do site",
      "content": "<!DOCTYPE html>\\n<html data-bs-theme=\\"dark\\">\\n<head>\\n  <title>Meu Site</title>\\n  <link href=\\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\\" rel=\\"stylesheet\\">\\n  <link rel=\\"stylesheet\\" href=\\"css/style.css\\">\\n  <script src=\\"js/main.js\\"></script>\\n</head>"
    },
    {
      "path": "/css/style.css", 
      "explanation": "Estilos CSS do site",
      "content": "body {\\n  margin: 0;\\n  padding: 20px;\\n  font-family: sans-serif;\\n}\\n\\nh1 {\\n  color: #333;\\n}"
    },
    {
      "path": "/js/main.js",
      "explanation": "JavaScript principal do site",
      "content": "console.log('Site carregado!');"
    }
  ]
}
\`\`\` 
`

export async function chatWithGemini(messages: { role: 'user' | 'assistant', content: string }[]) {
  try {
    const model = createAI().getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Entendi. Seguirei todas as regras especificadas.' }] },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    })

    const result = await chat.sendMessage(messages[messages.length - 1].content)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error)
    throw new Error('Falha ao processar sua solicitação')
  }
}