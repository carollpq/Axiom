import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/shared/lib/db";
import { users } from "@/src/shared/lib/db/schema";
import { requireSession } from "@/src/shared/lib/api-helpers";

export const runtime = "nodejs";

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { wallet, role, orcidId } = body;

    // Validate input
    if (!wallet) {
      return NextResponse.json(
        { message: "Wallet required" },
        { status: 400 }
      );
    }

    if (!["researcher", "editor", "reviewer"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    if (!ORCID_REGEX.test(orcidId)) {
      return NextResponse.json(
        { message: "Invalid ORCID format" },
        { status: 400 }
      );
    }

    const walletLower = wallet.toLowerCase();

    // Find or create user
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletLower))
      .limit(1);

    if (existing.length > 0) {
      // Update existing user
      const currentRoles = (existing[0].roles as string[]) || [];
      const updatedRoles = currentRoles.includes(role)
        ? currentRoles
        : [...currentRoles, role];

      await db
        .update(users)
        .set({
          roles: updatedRoles,
          orcidId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.walletAddress, walletLower));
    } else {
      // Create new user
      await db.insert(users).values({
        walletAddress: walletLower,
        roles: [role],
        orcidId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Register user error:", err);
    return NextResponse.json(
      { message: "Failed to register user" },
      { status: 500 }
    );
  }
}
