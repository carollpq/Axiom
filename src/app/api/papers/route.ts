import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { createPaper } from "@/src/features/papers/actions";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listUserPapers(wallet);
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

  const paper = await createPaper({ ...body, wallet });
  if (!paper) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(paper, { status: 201 });
}
