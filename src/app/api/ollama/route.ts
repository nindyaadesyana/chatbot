import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/chatbot'
import { askOllamaWithLangChain } from '@/lib/chatbot/services/langchainOllamaService'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    const response = await ChatbotService.processMessage(prompt)
    const { ResponseHandler } = await import('@/lib/chatbot')
    const formatted = ResponseHandler.formatResponse(response)
    
    return NextResponse.json({ 
      response: formatted.display,
      speech: formatted.speech
    })
  } catch (error) {
    console.error("Error in /api/ollama:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
export async function POSTWithLangChain(req: NextRequest) {
  try {
    const { message } = await req.json()
    const result = await askOllamaWithLangChain(message)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error in /api/ollama/langchain:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}