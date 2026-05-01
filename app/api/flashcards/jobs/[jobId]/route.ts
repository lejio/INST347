import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { getJob } from "@/app/lib/cosmosdb";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await getJob(jobId, session.user.email);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({
    id: job.id,
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    set_id: job.set_id,
    error: job.error,
  });
}
