// src/utils/claudeApiService.js
/**
 * Claude API service for generating AI-powered equity insights
 * This service uses the Claude API to generate personalized recommendations
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Generate equity insights using Claude API
 * @param {Array} grants - User's equity grants 
 * @param {Object} financialData - User's financial profile
 * @param {Object} marketData - Optional market data for context
 * @returns {Promise<Object>} - AI-generated insights and recommendations
 */
export async function generateClaudeInsights(grants, financialData = {}, marketData = {}) {
  try {
    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    if (!apiKey) {
      console.warn("Claude API key not configured");
      return fallbackInsights(grants, financialData);
    }

    // Prepare prompt with user data
    const prompt = createInsightsPrompt(grants, financialData, marketData);
    
    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return parseClaudeResponse(data, grants);
  } catch (error) {
    console.error("Error generating Claude insights:", error);
    return fallbackInsights(grants, financialData);
  }
}

/**
 * Create a detailed prompt for Claude based on user data
 */
function createInsightsPrompt(grants, financialData, marketData) {
  // Calculate aggregate grant metrics
  const totalShares = grants.reduce((sum, grant) => sum + grant.shares, 0);
  const vestedShares = grants.reduce((sum, grant) => sum + (grant.vested_shares || 0), 0);
  const totalValue = grants.reduce((sum, grant) => sum + (grant.vested_shares || 0) * grant.current_fmv, 0);
  
  // Format grant data
  const grantsData = grants.map(g => ({
    company: g.company_name,
    type: g.grant_type,
    shares: g.shares,
    vested: g.vested_shares || 0,
    strikePrice: g.strike_price,
    currentPrice: g.current_fmv,
    grantDate: g.grant_date,
    vestingStart: g.vesting_start_date,
    vestingEnd: g.vesting_end_date
  }));
  
  // Create the prompt
  return `
You are VestQuest's AI equity advisor. Analyze this equity portfolio and provide expert insights. 
Use a professional, strategic tone similar to a financial advisor.

# EQUITY GRANTS
${JSON.stringify(grantsData, null, 2)}

# FINANCIAL PROFILE
${JSON.stringify(financialData, null, 2)}

# MARKET CONTEXT
${JSON.stringify(marketData, null, 2)}

# PORTFOLIO SUMMARY
- Total shares: ${totalShares}
- Vested shares: ${vestedShares} (${((vestedShares/totalShares)*100).toFixed(1)}%)
- Estimated vested value: $${totalValue.toLocaleString()}

Provide the following in JSON format:
1. An array of 2-3 strategic insights (each with title, content, priority: high/medium/low)
2. A summary sentence of the overall equity position
3. An array of 3-4 specific recommended actions

Focus on key factors: diversification risk, tax optimization, vesting milestones, 
exercise strategy, and financial integration. Consider company concentration, 
market conditions, and long-term wealth building.

Return only valid JSON with this structure:
{
  "insights": [
    {
      "type": "key_insight_type",
      "title": "Insight Title",
      "content": "Detailed insight explanation",
      "priority": "high/medium/low"
    }
  ],
  "summary": "Overall portfolio summary",
  "recommendedActions": [
    "Action recommendation 1",
    "Action recommendation 2"
  ]
}
`;
}

/**
 * Parse Claude API response to extract recommendations
 */
function parseClaudeResponse(apiResponse, grants) {
  try {
    // Extract the text response from Claude
    const responseText = apiResponse.content?.[0]?.text || 
                         apiResponse.messages?.[0]?.content ||
                         apiResponse.completion;
    
    // Find JSON content in the response
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    if (jsonMatch && jsonMatch[0]) {
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Ensure the response has the expected structure
      if (parsed.insights && parsed.summary && parsed.recommendedActions) {
        return parsed;
      }
    }
    
    // If parsing fails, return fallback insights
    return fallbackInsights(grants);
  } catch (error) {
    console.error("Error parsing Claude response:", error);
    return fallbackInsights(grants);
  }
}

/**
 * Generate fallback insights when API fails
 */
function fallbackInsights(grants, financialData = {}) {
  // Basic fallback insights
  return {
    insights: [
      {
        type: "diversification",
        title: "Consider portfolio diversification",
        content: "Having multiple equity grants concentrated in a few companies creates portfolio risk. Consider diversification strategies as your equity vests.",
        priority: "medium"
      },
      {
        type: "tax",
        title: "Tax planning is essential",
        content: "Each equity type has different tax implications. Plan your exercise and selling strategy to optimize tax outcomes.",
        priority: "high"
      }
    ],
    summary: "Optimize your equity strategy through diversification and tax planning.",
    recommendedActions: [
      "Review your vesting schedule and upcoming events",
      "Consider consulting with a financial advisor about your equity strategy",
      "Create a plan for exercising and selling equity based on your financial goals"
    ]
  };
}