"use client";

import { signIn, signUp } from "@/app/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      const { error } = await signUp.email({ email, password, name });
      if (error) {
        setError(error.message ?? "Sign up failed");
        return;
      }
    } else {
      const { error } = await signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Sign in failed");
        return;
      }
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-8 w-80">
        <h1 className="text-2xl font-semibold">AI Flashcards</h1>
        <p className="text-zinc-500">{isSignUp ? "Create an account" : "Sign in to get started"}</p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {isSignUp && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2"
          required
          minLength={8}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </form>
    </div>
  );
}
