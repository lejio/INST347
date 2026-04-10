"use client";

import { signOut } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100"
    >
      Sign Out
    </button>
  );
}
