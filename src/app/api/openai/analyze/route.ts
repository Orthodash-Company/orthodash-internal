import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client only if API key is available
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });
};

export async function POST(request: NextRequest) {
  try {
    const { userId, prompt, data } = await request.json()
    
    if (!userId || !prompt) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID and prompt are required' 
      }, { status: 400 })
    }
    
    console.log('Generating AI analysis for user:', userId)
    
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert orthodontic practice analyst. Analyze the provided data and generate comprehensive insights and recommendations. Focus on actionable insights that can help improve practice performance, patient acquisition, and operational efficiency.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })
    
    const analysis = completion.choices[0]?.message?.content || 'No analysis generated'
    
    // Parse the analysis to extract structured insights
    const insights = extractInsights(analysis)
    const recommendations = extractRecommendations(analysis)
    
    return NextResponse.json({
      success: true,
      summary: analysis,
      insights,
      recommendations,
      message: 'AI analysis generated successfully'
    })
  } catch (error) {
    console.error('OpenAI analysis failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate AI analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function extractInsights(analysis: string): string[] {
  const insights: string[] = []
  
  // Extract insights from the analysis text
  const lines = analysis.split('\n')
  for (const line of lines) {
    if (line.includes('insight') || line.includes('finding') || line.includes('observation')) {
      insights.push(line.trim())
    }
  }
  
  return insights.length > 0 ? insights : ['Analysis completed successfully']
}

function extractRecommendations(analysis: string): string[] {
  const recommendations: string[] = []
  
  // Extract recommendations from the analysis text
  const lines = analysis.split('\n')
  for (const line of lines) {
    if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
      recommendations.push(line.trim())
    }
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue monitoring performance metrics']
}
