import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const database = client.database(process.env.COSMOS_DATABASE!);

export const usersContainer = database.container("users");
export const flashcardSetsContainer = database.container("flashcard_sets");
export const cardsContainer = database.container("cards");

// --- Users ---

export async function getOrCreateUser(email: string, name: string) {
  const { resources } = await usersContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: email }],
    })
    .fetchAll();

  if (resources.length > 0) {
    return resources[0];
  }

  const user = { id: email, email, name };
  const { resource } = await usersContainer.items.create(user);
  return resource;
}

// --- Flashcard Sets ---

export async function getSetsByUserId(userId: string) {
  const { resources } = await flashcardSetsContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.create_date DESC",
      parameters: [{ name: "@userId", value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function getSetById(setId: string) {
  const { resources } = await flashcardSetsContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.id = @setId",
      parameters: [{ name: "@setId", value: setId }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function createSet(
  userId: string,
  setName: string,
  cards: { front: string; back: string; link: string }[],
  visibility: "public" | "private" | "unlisted" = "private"
) {
  const setId = uuidv4();
  const now = new Date().toISOString();

  const setDoc = {
    id: setId,
    user_id: userId,
    set_name: setName,
    card_count: cards.length,
    create_date: now,
    visibility,
  };

  const cardsDoc = {
    id: uuidv4(),
    set_id: setId,
    cards,
  };

  await flashcardSetsContainer.items.create(setDoc);
  await cardsContainer.items.create(cardsDoc);

  return { ...setDoc, cards };
}

export async function updateSet(
  setId: string,
  userId: string,
  updates: {
    set_name?: string;
    visibility?: "public" | "private" | "unlisted";
    cards?: { front: string; back: string; link: string }[];
  }
) {
  // Update set metadata
  const existingSet = await getSetById(setId);
  if (!existingSet || existingSet.user_id !== userId) return null;

  const updatedSet = {
    ...existingSet,
    ...(updates.set_name !== undefined && { set_name: updates.set_name }),
    ...(updates.visibility !== undefined && { visibility: updates.visibility }),
    ...(updates.cards !== undefined && { card_count: updates.cards.length }),
  };

  await flashcardSetsContainer
    .item(setId, userId)
    .replace(updatedSet);

  // Update cards if provided
  if (updates.cards !== undefined) {
    const { resources: cardsDocs } = await cardsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.set_id = @setId",
        parameters: [{ name: "@setId", value: setId }],
      })
      .fetchAll();

    if (cardsDocs.length > 0) {
      const updatedCards = { ...cardsDocs[0], cards: updates.cards };
      await cardsContainer
        .item(cardsDocs[0].id, setId)
        .replace(updatedCards);
    }
  }

  return updatedSet;
}

export async function deleteSet(setId: string, userId: string) {
  const existingSet = await getSetById(setId);
  if (!existingSet || existingSet.user_id !== userId) return false;

  // Delete set metadata
  await flashcardSetsContainer.item(setId, userId).delete();

  // Delete cards
  const { resources: cardsDocs } = await cardsContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.set_id = @setId",
      parameters: [{ name: "@setId", value: setId }],
    })
    .fetchAll();

  for (const doc of cardsDocs) {
    await cardsContainer.item(doc.id, setId).delete();
  }

  return true;
}

export async function getCardsBySetId(setId: string) {
  const { resources } = await cardsContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.set_id = @setId",
      parameters: [{ name: "@setId", value: setId }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function getPublicSets(search?: string) {
  let query = "SELECT * FROM c WHERE c.visibility = 'public'";
  const parameters: { name: string; value: string }[] = [];

  if (search) {
    query += " AND CONTAINS(LOWER(c.set_name), @search)";
    parameters.push({ name: "@search", value: search.toLowerCase() });
  }

  query += " ORDER BY c.create_date DESC";

  const { resources } = await flashcardSetsContainer.items
    .query({ query, parameters })
    .fetchAll();
  return resources;
}
