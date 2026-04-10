import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { getSetsByUserId, createSet } from "@/app/lib/cosmosdb";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sets = await getSetsByUserId(session.user.email);
  return Response.json(sets);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { set_name, visibility, cards } = body;

  // Validate required fields
  if (!set_name || typeof set_name !== "string") {
    return Response.json({ error: "set_name is required" }, { status: 400 });
  }

  if (!Array.isArray(cards) || cards.length === 0) {
    return Response.json(
      { error: "cards must be a non-empty array" },
      { status: 400 }
    );
  }

  const validVisibility = ["public", "private", "unlisted"];
  if (visibility && !validVisibility.includes(visibility)) {
    return Response.json(
      { error: `visibility must be one of: ${validVisibility.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate each card
  for (const card of cards) {
    if (
      typeof card.front !== "string" ||
      typeof card.back !== "string" ||
      typeof card.link !== "string"
    ) {
      return Response.json(
        { error: "Each card must have front, back, and link as strings" },
        { status: 400 }
      );
    }
  }

  const result = await createSet(
    session.user.email,
    set_name,
    cards,
    visibility || "private"
  );

  return Response.json(result, { status: 201 });
}
