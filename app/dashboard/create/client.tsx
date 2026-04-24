"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Visibility = "private" | "public" | "unlisted";

type CardDraft = {
  front: string;
  back: string;
  link: string;
};

export default function CreateSetClient() {
  const router = useRouter();
  const [setName, setSetName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [cards, setCards] = useState<CardDraft[]>([{ front: "", back: "", link: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateCard(index: number, field: keyof CardDraft, value: string) {
    setCards((prev) => prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)));
  }

  function addCard() {
    setCards((prev) => [...prev, { front: "", back: "", link: "" }]);
  }

  function removeCard(index: number) {
    setCards((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }

    const trimmedCards = cards.map((card) => ({
      front: card.front.trim(),
      back: card.back.trim(),
      link: card.link.trim(),
    }));

    const hasInvalidCard = trimmedCards.some((card) => !card.front || !card.back);
    if (hasInvalidCard) {
      setError("Each flashcard needs both a front and a back.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        set_name: setName.trim(),
        visibility,
        cards: trimmedCards,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Create failed");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Flashcard Set</h1>
          <p className="text-zinc-500">Add as many cards as you want, then save your set.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-200 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder="Set name"
            required
            className="rounded border px-3 py-2"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="rounded border px-3 py-2"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>

        <div className="space-y-4">
          {cards.map((card, index) => (
            <div key={index} className="rounded-lg border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-700">Card {index + 1}</h2>
                <button
                  type="button"
                  onClick={() => removeCard(index)}
                  disabled={cards.length === 1}
                  className="text-sm text-red-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={card.front}
                  onChange={(e) => updateCard(index, "front", e.target.value)}
                  placeholder="Front (question)"
                  className="w-full rounded border px-3 py-2"
                  required
                />
                <input
                  type="text"
                  value={card.back}
                  onChange={(e) => updateCard(index, "back", e.target.value)}
                  placeholder="Back (answer)"
                  className="w-full rounded border px-3 py-2"
                  required
                />
                <input
                  type="text"
                  value={card.link}
                  onChange={(e) => updateCard(index, "link", e.target.value)}
                  placeholder="Source link (optional)"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCard}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Add Another Card
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Set"}
        </button>
      </form>
    </div>
  );
}
