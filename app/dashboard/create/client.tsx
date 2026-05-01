"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Visibility = "private" | "public" | "unlisted";

type CardDraft = {
  front: string;
  back: string;
  link: string;
};

type Mode = "manual" | "ai";

export default function CreateSetClient() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("manual");

  // Shared
  const [setName, setSetName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [description, setDescription] = useState("");

  // Manual
  const [cards, setCards] = useState<CardDraft[]>([
    { front: "", back: "", link: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiError, setAiError] = useState("");

  function updateCard(index: number, field: keyof CardDraft, value: string) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function addCard() {
    setCards((prev) => [...prev, { front: "", back: "", link: "" }]);
  }

  function removeCard(index: number) {
    setCards((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }

    const trimmed = cards.map((c) => ({
      front: c.front.trim(),
      back: c.back.trim(),
      link: c.link.trim(),
    }));

    if (trimmed.some((c) => !c.front || !c.back)) {
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
        cards: trimmed,
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

  async function handleAISubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAiError("");

    if (!file) {
      setAiError("Please select a file.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    if (setName.trim()) fd.append("set_name", setName.trim());
    fd.append("visibility", visibility);

    setUploading(true);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        body: fd,
      });
      const raw = await res.text();
      let data: { error?: string; id?: string } | null = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { error: raw.startsWith("<!DOCTYPE") ? "Upload failed" : raw };
        }
      }
      if (!res.ok) {
        setAiError(data?.error || "Upload failed");
        setUploading(false);
        return;
      }
      if (data?.id) {
        router.push(`/dashboard/${data.id}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setAiError("Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Create Flashcard
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Build a set manually or let AI generate cards from a file.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex p-1 bg-white rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-1.5 text-sm rounded ${
            mode === "manual"
              ? "bg-red-500 text-white"
              : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`px-4 py-1.5 text-sm rounded ${
            mode === "ai"
              ? "bg-red-500 text-white"
              : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          AI Generate
        </button>
      </div>

      {/* Create Group panel */}
      <section className="bg-white shadow-md md:p-10 p-5 rounded-md">
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">
          Create Group
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Set details that apply to the whole flashcard group.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Set name</span>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="e.g. Cell Biology Chapter 3"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Visibility
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-medium text-zinc-700">
            Description{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Briefly describe this set..."
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
          <span className="text-xs text-zinc-400">
            {description.length}/500
          </span>
        </label>
      </section>

      {/* Mode-specific panel */}
      {mode === "manual" ? (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white shadow-md md:p-10 p-5 rounded-md space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Add Terms</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Add a Front (question), Back (answer), and optional source link.
              </p>
            </div>
            <span className="text-sm text-zinc-500">
              {cards.length} card{cards.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="rounded-md border border-zinc-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-sm font-semibold">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    disabled={cards.length === 1}
                    className="text-sm text-red-500 hover:text-red-600 disabled:text-zinc-300 disabled:cursor-not-allowed"
                  >
                    − Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={card.front}
                    onChange={(e) =>
                      updateCard(index, "front", e.target.value)
                    }
                    placeholder="Front (question)"
                    required
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    value={card.back}
                    onChange={(e) => updateCard(index, "back", e.target.value)}
                    placeholder="Back (answer)"
                    required
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <input
                  type="text"
                  value={card.link}
                  onChange={(e) => updateCard(index, "link", e.target.value)}
                  placeholder="Source link (optional)"
                  className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCard}
            className="text-red-500 hover:text-red-600 font-medium text-sm"
          >
            + Add more
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Set"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-zinc-600 hover:text-zinc-900 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleAISubmit}
          className="bg-white shadow-md md:p-10 p-5 rounded-md space-y-5"
        >
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Generate from File
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Upload a PDF, image (PNG/JPEG), or DOCX up to 10 MB. AI will
              generate flashcards automatically.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              File <span className="text-red-500">*</span>
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white hover:file:bg-red-600"
            />
          </label>

          {aiError && <p className="text-sm text-red-600">{aiError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {uploading ? "Generating..." : "Upload & Generate"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-zinc-600 hover:text-zinc-900 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
