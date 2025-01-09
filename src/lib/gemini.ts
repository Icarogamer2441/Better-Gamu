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

const systemPrompt = `Você é um designer e desenvolvedor web especializado em criar sites modernos e únicos. Você DEVE retornar APENAS um JSON com a estrutura abaixo, sem explicações adicionais.

REGRAS DE DESIGN:
1. NUNCA use o mesmo design duas vezes
2. Crie designs únicos baseados no pedido do usuário
3. Use elementos visuais modernos e criativos:
   - Gradientes complexos e únicos
   - Glassmorphism criativo
   - Neomorfismo quando apropriado
   - Animações suaves e elegantes
   - Micro-interações
   - Efeitos de parallax
   - Scrolling suave
   - Transições entre seções
   - Efeitos de hover elaborados
   - Layouts assimétricos
   - Tipografia expressiva
   - Formas orgânicas e geométricas
   - Sombras dinâmicas
   - Efeitos de profundidade
   - Cores vibrantes em dark mode

4. SEMPRE use as melhores bibliotecas:
   - Bootstrap 5 ou Tailwind CSS para estilos base
   - GSAP para animações complexas
   - Three.js para efeitos 3D
   - AOS para animações no scroll
   - Swiper para carrosséis
   - Locomotive Scroll para smooth scrolling
   - Splitting.js para animações de texto
   - Barba.js para transições de página
   - Tilt.js para efeitos de hover 3D
   - FontAwesome ou Material Icons
   - Google Fonts (fontes modernas)

5. MANTENHA A CONSISTÊNCIA:
   - Use o mesmo esquema de cores
   - Mantenha a identidade visual
   - Siga as diretrizes de design do usuário
   - Respeite o tema escuro
   - Mantenha a harmonia visual

6. ESTRUTURA DO JSON:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!doctype html>\\n<html>...</html>",
      "explanation": "Arquivo HTML principal com estrutura e CDNs"
    },
    {
      "path": "/styles.css",
      "content": "/* Estilos personalizados */",
      "explanation": "CSS com animações e efeitos visuais"
    },
    {
      "path": "/script.js",
      "content": "// Interatividade e animações",
      "explanation": "JavaScript para funcionalidades e efeitos"
    }
  ]
}`

interface ImageData {
  mimeType: string;
  data: string;
}

export const chatWithGemini = async (
  messages: Array<{ role: string; content: string }>, 
  image?: ImageData
) => {
  const ai = createAI()

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    })

    // Construir o histórico de chat com o systemPrompt apenas na primeira mensagem
    const chatHistory = messages.map((msg, index) => {
      if (index === 0) {
        return `${systemPrompt}\n\n${msg.content}`
      }
      return msg.content
    }).join('\n\nUsuário: ')

    let response
    if (image) {
      response = await model.generateContent([
        chatHistory,
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        }
      ])
    } else {
      response = await model.generateContent(chatHistory)
    }

    if (!response) {
      throw new Error('Não foi possível gerar uma resposta')
    }

    const result = await response.response
    return result.text()
  } catch (error: any) {
    console.error('Erro ao chamar Gemini:', error)
    throw new Error(error.message || 'Erro ao processar sua solicitação')
  }
}

const optimizePrompt = async (input: string) => {
  const ai = createAI()
  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    })

    const prompt = `Melhore este prompt para um site, adicionando detalhes essenciais de design e UX que estejam faltando, mantendo a ideia original. Seja detalhado mas mantenha a clareza: "${input}"

REGRAS:
1. Mantenha o prompt claro e estruturado
2. Adicione apenas elementos realmente necessários
3. Não altere a ideia principal
4. Retorne apenas o prompt melhorado entre aspas, sem explicações
5. Você pode usar até 8192 tokens na resposta`

    const response = await model.generateContent(prompt)
    if (!response) throw new Error('Não foi possível gerar uma resposta')
    
    const result = await response.response
    return result.text()
  } catch (error: any) {
    console.error('Erro ao otimizar prompt:', error)
    throw new Error(error.message || 'Erro ao otimizar prompt')
  }
}

export { optimizePrompt }