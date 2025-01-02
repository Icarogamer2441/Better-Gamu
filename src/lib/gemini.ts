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

const systemPrompt = `Você é uma API que DEVE retornar APENAS um JSON com a estrutura abaixo. IMPORTANTE: Forneça SEMPRE o content e explanation para CADA arquivo.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use CDNs para bibliotecas:
   - Bootstrap (CSS e JS) ou Tailwind para estilos
   - FontAwesome ou Material Icons para ícones
   - Google Fonts para fontes personalizadas
   - Alpine.js ou jQuery para interatividade leve
   - AOS (Animate On Scroll) para animações
   - Swiper para sliders/carrosséis
   - Three.js para efeitos 3D
   - GSAP para animações avançadas

2. SEMPRE use elementos visuais modernos:
   - Gradientes em backgrounds
   - Glassmorphism (backdrop-filter: blur)
   - Temas escuros com cores vibrantes
   - Sombras suaves
   - Animações em hover
   - Bordas arredondadas
   - Ícones com gradientes
   - Efeitos de brilho e reflexo
   - Bordas com gradiente

3. ESTRUTURA DO JSON:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!doctype html>\\n<html>...</html>",
      "explanation": "Arquivo HTML principal com todas as CDNs e estrutura"
    },
    {
      "path": "/styles.css",
      "content": "/* Estilos personalizados */",
      "explanation": "CSS adicional para complementar as bibliotecas"
    },
    {
      "path": "/script.js",
      "content": "// Interatividade e animações",
      "explanation": "JavaScript para funcionalidades específicas"
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
  const lastMessage = messages[messages.length - 1]

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }, { apiVersion: 'v1beta' })
    let response

    // Preparar o prompt com o systemPrompt
    const prompt = `${systemPrompt}\n\n${lastMessage.content}`

    // Se tiver imagem, inclui ela no generateContent
    if (image) {
      response = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        }
      ])
    } else {
      response = await model.generateContent(prompt)
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