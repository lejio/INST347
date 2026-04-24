import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CreateSetClient from "./client";

export default async function CreateSetPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    redirect("/login");
  }

  return <CreateSetClient />;
}
