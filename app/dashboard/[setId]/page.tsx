import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSetById, getCardsBySetId } from "@/app/lib/cosmosdb";
import StudyClient from "./client";

export default async function StudySetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const set = await getSetById(setId);
  if (!set) notFound();

  const isOwner = session?.user?.email === set.user_id;
  if (!isOwner && set.visibility === "private") notFound();

  const cardsDoc = await getCardsBySetId(setId);
  const cards = cardsDoc?.cards ?? [];

  return (
    <StudyClient
      set={{
        id: set.id,
        set_name: set.set_name,
        card_count: set.card_count,
        visibility: set.visibility,
        create_date: set.create_date,
      }}
      cards={cards}
      canEdit={isOwner}
    />
  );
}
