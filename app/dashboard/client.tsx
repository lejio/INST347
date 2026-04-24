"use client";

import Link from "next/link";
import { useState } from "react";

interface FlashcardSet {
  id: string;
  set_name: string;
  card_count: number;
  create_date: string;
  visibility: string;
}

export default function DashboardClient({
  initialSets,
}: {
  initialSets: FlashcardSet[];
}) {
  const [sets, setSets] = useState(initialSets);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        body: formData,
      });

      const raw = await res.text();
      let data: { error?: string } | null = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { error: raw.startsWith("<!DOCTYPE") ? "Upload failed" : raw };
        }
      }

      if (res.ok) {
        if (
          data &&
          typeof data === "object" &&
          "id" in data &&
          "set_name" in data &&
          "card_count" in data &&
          "create_date" in data &&
          "visibility" in data
        ) {
          setSets((prev) => [data as FlashcardSet, ...prev]);
          form.reset();
        } else {
          alert("Upload succeeded but returned an unexpected response.");
        }
      } else {
        alert(data?.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* AI Generate Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-medium mb-4">Generate Flashcards from File</h2>
        <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
          <input
            type="text"
            name="set_name"
            placeholder="Set name"
            className="rounded border px-3 py-2"
          />
          <input
            type="file"
            name="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            required
            className="text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Generating..." : "Upload & Generate"}
          </button>
        </form>
      </section>

      {/* Manual Create Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 p-6">
        <h2 className="mb-2 text-lg font-medium">Create Flashcards Manually</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Open the builder page to add as many flashcards as you want.
        </p>
        <Link
          href="/dashboard/create"
          className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Open Flashcard Builder
        </Link>
      </section>

      {/* Sets List */}
      <section>
        <h2 className="text-lg font-medium mb-4">Your Flashcard Sets</h2>
        {sets.length === 0 ? (
          <p className="text-zinc-500">No flashcard sets yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sets.map((set) => (
              <div
                key={set.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4"
              >
                <div>
                  <p className="font-medium">{set.set_name}</p>
                  <p className="text-sm text-zinc-500">
                    {set.card_count} cards &middot; {set.visibility} &middot;{" "}
                    {new Date(set.create_date).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`/api/flashcards/${set.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View JSON
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
