"use client";

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
  const [creating, setCreating] = useState(false);

  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/flashcards/generate", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      setSets((prev) => [data, ...prev]);
      form.reset();
    } else {
      alert(data.error || "Upload failed");
    }

    setUploading(false);
  }

  async function handleManualCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      set_name: formData.get("set_name"),
      visibility: formData.get("visibility"),
      cards: [
        {
          front: formData.get("front"),
          back: formData.get("back"),
          link: formData.get("link") || "",
        },
      ],
    };

    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setSets((prev) => [data, ...prev]);
      form.reset();
    } else {
      alert(data.error || "Create failed");
    }

    setCreating(false);
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
        <h2 className="text-lg font-medium mb-4">Create Flashcard Manually</h2>
        <form onSubmit={handleManualCreate} className="flex flex-col gap-3">
          <input
            type="text"
            name="set_name"
            placeholder="Set name"
            required
            className="rounded border px-3 py-2"
          />
          <select name="visibility" className="rounded border px-3 py-2">
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
          <input
            type="text"
            name="front"
            placeholder="Card front (question)"
            required
            className="rounded border px-3 py-2"
          />
          <input
            type="text"
            name="back"
            placeholder="Card back (answer)"
            required
            className="rounded border px-3 py-2"
          />
          <input
            type="text"
            name="link"
            placeholder="Source link (optional)"
            className="rounded border px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Set"}
          </button>
        </form>
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
