import { Express } from "express";
import OpenAI from "openai";

export function setupOpenAIRoutes(app: Express) {
  // Initialize OpenAI with environment variable
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Generate AI summary endpoint
  app.post("/api/generate-summary", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: "OpenAI API key not configured. Please add your OPENAI_API_KEY to environment variables." 
        });
      }

      const { periods, periodData } = req.body;

      // Construct prompt with actual data
      const dataString = JSON.stringify({ periods, periodData }, null, 2);
      
      const prompt = `
      Analyze the following orthodontic practice analytics data and provide actionable insights:

      ${dataString}

      Please provide:
      1. 3-5 key recommendations for improving ROI and patient acquisition
      2. Deep dive insights about performance trends and opportunities
      3. Comparative analysis against typical orthodontic practice benchmarks
      4. Include relevant external resources for implementation

      Format the response as JSON with this structure:
      {
        "recommendations": ["recommendation1", "recommendation2", ...],
        "deepDive": {
          "insights": ["insight1", "insight2", ...],
          "externalLinks": [
            {
              "title": "Resource Title",
              "url": "https://example.com",
              "description": "Brief description"
            }
          ]
        },
        "comparativeAnalysis": {
          "nationalAverages": {
            "metric1": "value1",
            "metric2": "value2"
          },
          "performance": ["analysis1", "analysis2", ...]
        }
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert orthodontic practice management consultant. Analyze practice data and provide specific, actionable insights for improving patient acquisition costs, conversion rates, and overall ROI. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
      
      res.json(analysisResult);

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
        res.status(401).json({ 
          error: "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable." 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to generate AI summary. Please try again later." 
        });
      }
    }
  });
}