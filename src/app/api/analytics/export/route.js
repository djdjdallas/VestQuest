import { NextResponse } from "next/server";
import { withSubscriptionTier } from "@/middleware/subscription-check";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptions/plans";
import { createClient } from "@supabase/supabase-js";

/**
 * Handler function for exporting analytics data
 * This route requires at least the PRO tier subscription
 */
async function handler(req, { userId }) {
  try {
    // Get export format from request
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    
    // Initialize Supabase admin client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Fetch user's grants
    const { data: grants, error: grantsError } = await supabase
      .from("equity_grants")
      .select("*")
      .eq("user_id", userId);
    
    if (grantsError) {
      return NextResponse.json(
        { error: "Failed to fetch equity grants" },
        { status: 500 }
      );
    }
    
    // Fetch user's scenarios
    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("user_id", userId);
    
    if (scenariosError) {
      return NextResponse.json(
        { error: "Failed to fetch scenarios" },
        { status: 500 }
      );
    }
    
    // Process and format the data based on the requested format
    let exportedData;
    let contentType;
    
    if (format === "csv") {
      // Convert data to CSV format
      exportedData = convertToCSV([...grants, ...scenarios]);
      contentType = "text/csv";
    } else {
      // Default to JSON format
      exportedData = JSON.stringify({
        grants,
        scenarios,
        exportedAt: new Date().toISOString(),
      });
      contentType = "application/json";
    }
    
    // Return the formatted data
    return new NextResponse(exportedData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="analytics-export.${format}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    return NextResponse.json(
      { error: "Failed to export analytics data" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to convert data to CSV format
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return "";
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(",");
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle different data types
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
      
      return value;
    }).join(",");
  });
  
  // Combine all rows
  return [headerRow, ...dataRows].join("\n");
}

// Export route handlers with subscription tier check
// This route requires at least the PRO tier subscription
export const GET = withSubscriptionTier(SUBSCRIPTION_TIERS.PRO, handler);
export const POST = withSubscriptionTier(SUBSCRIPTION_TIERS.PRO, handler);