"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">AI Flashcards</h1>
        <p className="text-zinc-500">Sign in to get started</p>
        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
