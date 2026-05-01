import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { getSetsByUserId } from "@/app/lib/cosmosdb";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const sets = await getSetsByUserId(session!.user.email);

  return <DashboardClient initialSets={sets} />;
}

