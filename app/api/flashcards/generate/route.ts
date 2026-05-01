import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/app/lib/auth";
import { uploadFile } from "@/app/lib/blob-storage";
import { generateFlashcards } from "@/app/lib/openai";
import { createSet, createJob, updateJob } from "@/app/lib/cosmosdb";

export const maxDuration = 300;
export const runtime = "nodejs";

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("[flashcards] Failed to parse multipart form body", error);
    return Response.json(
      { error: "Upload payload could not be parsed." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const setName = (formData.get("set_name") as string) || "Untitled Set";
  const rawVisibility = (formData.get("visibility") as string) || "private";
  const visibility = (["public", "private", "unlisted"] as const).includes(
    rawVisibility as "public" | "private" | "unlisted"
  )
    ? (rawVisibility as "public" | "private" | "unlisted")
    : "private";

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

  // Read the file now (Request body is gone after we respond)
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name;
  const fileType = file.type;
  const userId = session.user.email;

  const job = await createJob({ userId, fileName, setName, visibility });

  // Run the heavy work after the response is sent
  after(async () => {
    try {
      await updateJob(job.id, userId, {
        status: "processing",
        phase: "Uploading file",
        progress: 10,
      });

      const blobUrl = await uploadFile(fileName, buffer, fileType);
      console.log(`[job:${job.id}] uploaded`, blobUrl);

      await updateJob(job.id, userId, {
        phase: "Generating flashcards",
        progress: 35,
      });

      const cards = await generateFlashcards(buffer, fileType, fileName);

      await updateJob(job.id, userId, {
        phase: "Saving set",
        progress: 90,
      });

      const result = await createSet(userId, setName, cards, visibility);

      await updateJob(job.id, userId, {
        status: "succeeded",
        phase: "Done",
        progress: 100,
        set_id: result.id,
      });
    } catch (error) {
      console.error(`[job:${job.id}] failed`, error);
      const message =
        error instanceof Error ? error.message : "Generation failed";
      await updateJob(job.id, userId, {
        status: "failed",
        phase: "Error",
        error: message,
      });
    }
  });

  return Response.json({ jobId: job.id }, { status: 202 });
}
