import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import {
  getSetById,
  getCardsBySetId,
  updateSet,
  deleteSet,
} from "@/app/lib/cosmosdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const set = await getSetById(setId);
  if (!set) {
    return Response.json({ error: "Set not found" }, { status: 404 });
  }

  // Allow access if user owns the set, or if it's public/unlisted
  const isOwner = session?.user?.email === set.user_id;
  if (!isOwner && set.visibility === "private") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const cardsDoc = await getCardsBySetId(setId);
  return Response.json({ ...set, cards: cardsDoc?.cards ?? [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { set_name, visibility, cards } = body;

  // Validate visibility if provided
  if (visibility) {
    const validVisibility = ["public", "private", "unlisted"];
    if (!validVisibility.includes(visibility)) {
      return Response.json(
        { error: `visibility must be one of: ${validVisibility.join(", ")}` },
        { status: 400 }
      );
    }
  }

  // Validate cards if provided
  if (cards !== undefined) {
    if (!Array.isArray(cards) || cards.length === 0) {
      return Response.json(
        { error: "cards must be a non-empty array" },
        { status: 400 }
      );
    }
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
  }

  const updated = await updateSet(setId, session.user.email, {
    set_name,
    visibility,
    cards,
  });

  if (!updated) {
    return Response.json(
      { error: "Set not found or you don't own it" },
      { status: 404 }
    );
  }

  return Response.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteSet(setId, session.user.email);
  if (!deleted) {
    return Response.json(
      { error: "Set not found or you don't own it" },
      { status: 404 }
    );
  }

  return Response.json({ deleted: true });
}
