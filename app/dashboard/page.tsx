import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSetsByUserId } from "@/app/lib/cosmosdb";
import DashboardClient from "./client";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    redirect("/login");
  }

  const sets = await getSetsByUserId(session.user.email);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-500">{session.user.name} ({session.user.email})</p>
        </div>
        <SignOutButton />
      </div>

      <DashboardClient initialSets={sets} />
    </div>
  );
}
