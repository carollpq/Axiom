import { NextRequest, NextResponse } from "next/server";
import { listUserPapers, createPaper } from "@/features/papers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const result = listUserPapers(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, wallet } = body;

  if (!title || !wallet) {
    return NextResponse.json(
      { error: "title and wallet are required" },
      { status: 400 },
    );
  }

  const paper = createPaper(body);
  if (!paper) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(paper, { status: 201 });
}
