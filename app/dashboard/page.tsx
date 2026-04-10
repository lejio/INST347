import { auth, signOut } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { getSetsByUserId } from "@/app/lib/cosmosdb";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const session = await auth();
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
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100"
          >
            Sign Out
          </button>
        </form>
      </div>

      <DashboardClient initialSets={sets} />
    </div>
  );
}
