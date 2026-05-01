"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Queued");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

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

    setUploading(true);
    setProgress(0);
    setPhase("Requesting upload URL…");

    let jobId: string;
    try {
      // Step 1: get a SAS upload URL
      const sasRes = await fetch("/api/flashcards/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const sasData = await sasRes.json().catch(() => ({}));
      if (!sasRes.ok || !sasData?.uploadUrl || !sasData?.blobName) {
        setAiError(sasData?.error || "Failed to get upload URL");
        setUploading(false);
        return;
      }

      // Step 2: PUT the file directly to Azure Blob Storage
      setPhase("Uploading file to storage…");
      setProgress(5);
      const putRes = await fetch(sasData.uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });
      if (!putRes.ok) {
        setAiError(`Upload to storage failed (${putRes.status})`);
        setUploading(false);
        return;
      }

      // Step 3: kick off the generation job (small JSON payload)
      setPhase("Queuing generation…");
      const genRes = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobName: sasData.blobName,
          fileName: file.name,
          fileType: file.type,
          setName: setName.trim(),
          visibility,
        }),
      });
      const genData = await genRes.json().catch(() => ({}));
      if (!genRes.ok || !genData?.jobId) {
        setAiError(genData?.error || "Failed to start generation");
        setUploading(false);
        return;
      }
      jobId = genData.jobId;
    } catch {
      setAiError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    setPhase("Queued");
    setProgress(5);

    // Poll the job status
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/flashcards/jobs/${jobId}`);
        if (!res.ok) return;
        const job = await res.json();
        setProgress(typeof job.progress === "number" ? job.progress : 0);
        setPhase(job.phase || job.status);

        if (job.status === "succeeded") {
          stopPolling();
          if (job.set_id) {
            router.push(`/dashboard/${job.set_id}`);
          } else {
            router.push("/dashboard");
          }
          router.refresh();
        } else if (job.status === "failed") {
          stopPolling();
          setAiError(job.error || "Generation failed");
          setUploading(false);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
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
          Create Flashcard Set
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
              disabled={uploading}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white hover:file:bg-red-600 disabled:opacity-60"
            />
          </label>

          {uploading && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-zinc-200 bg-zinc-50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-700">
                  <svg
                    className="animate-spin h-4 w-4 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span className="font-medium">{phase}…</span>
                </div>
                <span className="text-zinc-500 tabular-nums">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                Generation runs in the background. You can leave this page open;
                we’ll redirect you when it’s done.
              </p>
            </div>
          )}

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
