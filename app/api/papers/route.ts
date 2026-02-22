import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUserPapers, createPaper } from "@/features/papers";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = listUserPapers(wallet);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const paper = createPaper({ ...body, wallet });
  if (!paper) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(paper, { status: 201 });
}
