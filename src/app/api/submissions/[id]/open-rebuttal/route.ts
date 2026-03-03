import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Rebuttal is now researcher-initiated via POST /api/submissions/[id]/author-response.
 * This route is deprecated.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Rebuttal is now researcher-initiated. Use POST /api/submissions/[id]/author-response with action 'request_rebuttal'.",
    },
    { status: 410 },
  );
}
