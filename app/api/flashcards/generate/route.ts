import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { uploadFile } from "@/app/lib/blob-storage";
import { generateFlashcards } from "@/app/lib/openai";
import { createSet } from "@/app/lib/cosmosdb";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const setName = (formData.get("set_name") as string) || "Untitled Set";

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: `Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPEG, DOCX` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 10MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Azure Blob Storage
  const blobUrl = await uploadFile(file.name, buffer, file.type);

  // Generate flashcards via OpenAI
  const cards = await generateFlashcards(buffer, file.type, file.name);

  // Save to CosmosDB
  const result = await createSet(session.user.email, setName, cards, "private");

  return Response.json(
    { ...result, blob_url: blobUrl },
    { status: 201 }
  );
}
