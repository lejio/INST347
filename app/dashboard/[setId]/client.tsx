"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Card = { front: string; back: string; link: string };

type SetMeta = {
  id: string;
  set_name: string;
  card_count: number;
  visibility: string;
  create_date: string;
};

export default function StudyClient({
  set,
  cards,
  canEdit,
}: {
  set: SetMeta;
  cards: Card[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = cards.length;
  const card = total > 0 ? cards[index] : null;

  function go(delta: number) {
    if (total === 0) return;
    setFlipped(false);
    setIndex((i) => (i + delta + total) % total);
  }

  function jump(i: number) {
    setFlipped(false);
    setIndex(i);
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? window.location.href : `/dashboard/${set.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert(url);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  function handleDownload() {
    const payload = {
      set_name: set.set_name,
      visibility: set.visibility,
      cards,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.set_name.replace(/[^\w-]+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${set.set_name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/flashcards/${set.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      alert("Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back to My Flashcards
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-1">
            {set.set_name}
          </h1>
          <p className="text-sm text-zinc-500 capitalize">
            {set.visibility} · {total} card{total === 1 ? "" : "s"} · Created{" "}
            {new Date(set.create_date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-2 text-sm rounded-md bg-white border border-zinc-200 hover:bg-zinc-50"
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-2 text-sm rounded-md bg-white border border-zinc-200 hover:bg-zinc-50"
          >
            Download
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 text-sm rounded-md bg-white border border-zinc-200 hover:bg-zinc-50"
          >
            Print
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-md shadow-md p-10 text-center text-zinc-500">
          This set has no cards yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Slider / current card */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="w-full bg-white shadow-md rounded-md p-8 md:p-12 min-h-[260px] md:min-h-[340px] flex flex-col items-center justify-center text-center transition hover:shadow-lg"
            >
              <span className="text-xs uppercase tracking-wider text-zinc-400 mb-3">
                {flipped ? "Back" : "Front"}
              </span>
              <p className="text-xl md:text-2xl font-medium text-zinc-900 whitespace-pre-wrap">
                {flipped ? card!.back : card!.front}
              </p>
              {flipped && card!.link && (
                <a
                  href={card!.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 text-sm text-red-500 hover:text-red-600 underline"
                >
                  Source
                </a>
              )}
              <span className="mt-6 text-xs text-zinc-400">
                Click to {flipped ? "show front" : "reveal back"}
              </span>
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => go(-1)}
                className="px-4 py-2 text-sm rounded-md bg-white border border-zinc-200 hover:bg-zinc-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-zinc-500">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Sidebar list */}
          <aside className="bg-white rounded-md shadow-md p-4 max-h-[560px] overflow-y-auto">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              All cards
            </h2>
            <ul className="space-y-1">
              {cards.map((c, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      i === index
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "hover:bg-zinc-50 text-zinc-700"
                    }`}
                  >
                    <span className="text-zinc-400 mr-2">{i + 1}.</span>
                    <span className="line-clamp-1">{c.front || "(empty)"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
