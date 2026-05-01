import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { createUploadSasUrl } from "@/app/lib/blob-storage";

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

  let body: { fileName?: string; fileType?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, fileType, fileSize } = body;

  if (!fileName || typeof fileName !== "string") {
    return Response.json({ error: "fileName is required" }, { status: 400 });
  }
  if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
    return Response.json(
      { error: `Unsupported file type: ${fileType}` },
      { status: 400 }
    );
  }
  if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 50MB" },
      { status: 400 }
    );
  }

  const { uploadUrl, blobName } = await createUploadSasUrl(fileName, fileType);

  return Response.json({ uploadUrl, blobName });
}
