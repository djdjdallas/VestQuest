import { NextResponse } from "next/server";
import { withSubscriptionCheck } from "@/middleware/subscription-check";
import { FEATURES } from "@/lib/subscriptions/plans";

// This is an example API route that requires the COMPREHENSIVE_SCENARIOS feature
// which is only available in the Premium tier
async function handler(req, { userId }) {
  try {
    // Process the export request
    // In a real implementation, this would retrieve scenario data and format it for export
    
    return NextResponse.json({
      success: true,
      message: "Scenario exported successfully",
      // Additional data...
    });
  } catch (error) {
    console.error("Error exporting scenario:", error);
    return NextResponse.json(
      { error: "Failed to export scenario" },
      { status: 500 }
    );
  }
}

// Wrap the handler with subscription check middleware that requires the COMPREHENSIVE_SCENARIOS feature
export const GET = withSubscriptionCheck(FEATURES.COMPREHENSIVE_SCENARIOS, handler);
export const POST = withSubscriptionCheck(FEATURES.COMPREHENSIVE_SCENARIOS, handler);