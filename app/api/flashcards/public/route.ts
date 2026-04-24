import { NextRequest } from "next/server";
import { getPublicSets } from "@/app/lib/cosmosdb";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const sets = await getPublicSets(search);
  return Response.json(sets);
}
