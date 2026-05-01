import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/app/lib/auth";
import { downloadBlob, getBlobUrl } from "@/app/lib/blob-storage";
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    blobName?: string;
    fileName?: string;
    fileType?: string;
    setName?: string;
    visibility?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { blobName, fileName, fileType } = body;
  const setName = body.setName?.trim() || "Untitled Set";
  const rawVisibility = body.visibility ?? "private";
  const visibility = (["public", "private", "unlisted"] as const).includes(
    rawVisibility as "public" | "private" | "unlisted"
  )
    ? (rawVisibility as "public" | "private" | "unlisted")
    : "private";

  if (!blobName || typeof blobName !== "string") {
    return Response.json({ error: "blobName is required" }, { status: 400 });
  }
  if (!fileName || typeof fileName !== "string") {
    return Response.json({ error: "fileName is required" }, { status: 400 });
  }
  if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
    return Response.json(
      { error: `Unsupported file type: ${fileType}` },
      { status: 400 }
    );
  }

  const userId = session.user.email;
  const job = await createJob({ userId, fileName, setName, visibility });

  // Heavy work runs after the response is sent.
  after(async () => {
    try {
      await updateJob(job.id, userId, {
        status: "processing",
        phase: "Fetching upload",
        progress: 10,
      });

      const { buffer, size } = await downloadBlob(blobName);
      console.log(`[job:${job.id}] downloaded blob`, getBlobUrl(blobName), size);

      if (size > MAX_FILE_SIZE) {
        throw new Error("File too large. Maximum size is 50MB");
      }

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
