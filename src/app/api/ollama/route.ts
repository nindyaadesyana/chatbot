import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/chatbot'

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