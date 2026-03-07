import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/src/features/users/queries";
import { registerUserRole } from "@/src/features/users/actions";
import { requireSession } from "@/src/shared/lib/api-helpers";
import { ROLES } from "@/src/features/auth/types";


export const runtime = "nodejs";

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const user = await getOrCreateUser(wallet);
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  try {
    const wallet = await requireSession();
    if (wallet instanceof NextResponse) return wallet;

    const { role, orcidId, displayName } = await request.json();

    if (!ROLES.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }


    // Validate ORCID ID using the ORCID public API
    const orcidApiUrl = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcidId)}`;
    const orcidRes = await fetch(orcidApiUrl, {
      headers: { Accept: "application/json" },
      method: "GET",
    });
    if (!orcidRes.ok) {
      return NextResponse.json(
        { message: "ORCID ID not found or invalid" },
        { status: 400 }
      );
    }

    if (typeof displayName !== "string" || !displayName.trim()) {
      return NextResponse.json(
        { message: "Display name is required" },
        { status: 400 }
      );
    }

    await registerUserRole(wallet, role, orcidId, displayName.trim());

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
