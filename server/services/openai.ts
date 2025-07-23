import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Period {
  id: string;
  name: string;
  locationId: number | null;
  startDate: string;
  endDate: string;
}

interface AnalyticsData {
  avgNetProduction: number;
  avgAcquisitionCost: number;
  noShowRate: number;
  referralSources: {
    digital: number;
    professional: number;
    direct: number;
  };
  conversionRates: {
    digital: number;
    professional: number;
    direct: number;
  };
}

export async function generateAnalyticsSummary(
  periods: Period[],
  periodData: { [key: string]: AnalyticsData }
): Promise<any> {
  try {
    const prompt = `As an orthodontic practice analytics expert, analyze the following data from multiple time periods and provide insights in JSON format.

Data Summary:
${JSON.stringify({ periods, periodData }, null, 2)}

Provide a comprehensive analysis with these sections:

1. **Recommendations** (3-5 actionable items to increase return on ad spend)
2. **Deep Dive** (detailed insights with relevant external research links)
3. **Comparative Analysis** (performance vs national orthodontic industry averages)

National Orthodontic Industry Averages for Reference:
- Average Case Value: $5,000-$7,500
- Digital Marketing ROI: 300-500%
- Professional Referral Conversion: 70-85%
- No-Show Rate: 15-25%
- Digital Lead Conversion: 20-35%

Return your analysis in this exact JSON format:
{
  "recommendations": [
    "Specific actionable recommendation with numbers/percentages"
  ],
  "deepDive": {
    "insights": [
      "Detailed analytical insight with context"
    ],
    "externalLinks": [
      {
        "title": "Resource Title",
        "url": "https://example.com",
        "description": "Brief description of the resource"
      }
    ]
  },
  "comparativeAnalysis": {
    "nationalAverages": {
      "Average Case Value": "$5,000-$7,500",
      "Marketing ROI": "300-500%",
      "No-Show Rate": "15-25%"
    },
    "performance": [
      "How this practice compares to national averages"
    ]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert orthodontic practice analytics consultant with deep knowledge of industry benchmarks, marketing ROI optimization, and practice management best practices. Provide actionable, data-driven insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate AI summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}