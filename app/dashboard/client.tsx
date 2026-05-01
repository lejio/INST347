"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FlashcardSet {
  id: string;
  set_name: string;
  card_count: number;
  create_date: string;
  visibility: string;
}

const VISIBILITY_STYLES: Record<string, string> = {
  public: "bg-green-100 text-green-700",
  private: "bg-zinc-100 text-zinc-700",
  unlisted: "bg-amber-100 text-amber-700",
};

export default function DashboardClient({
  initialSets,
}: {
  initialSets: FlashcardSet[];
}) {
  const router = useRouter();
  const [sets, setSets] = useState(initialSets);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(set: FlashcardSet) {
    if (!confirm(`Delete "${set.set_name}"? This cannot be undone.`)) return;
    setDeletingId(set.id);
    const prev = sets;
    setSets((s) => s.filter((x) => x.id !== set.id));
    try {
      const res = await fetch(`/api/flashcards/${set.id}`, { method: "DELETE" });
      if (!res.ok) {
        setSets(prev);
        alert("Delete failed");
      } else {
        router.refresh();
      }
    } catch {
      setSets(prev);
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (sets.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-md p-10 md:p-20 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
          No flashcards yet
        </h2>
        <p className="text-zinc-500 mb-6">
          Create your first flashcard set to start studying.
        </p>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
        >
          Create Flashcard
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">My Flashcards</h1>
        <span className="text-sm text-zinc-500">
          {sets.length} set{sets.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sets.map((set) => {
          const badge =
            VISIBILITY_STYLES[set.visibility] ?? VISIBILITY_STYLES.private;
          return (
            <article
              key={set.id}
              className="bg-white rounded-md shadow-md p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="text-lg font-semibold text-zinc-900 line-clamp-2"
                  title={set.set_name}
                >
                  {set.set_name}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${badge}`}
                >
                  {set.visibility}
                </span>
              </div>

              <div className="text-sm text-zinc-500">
                {set.card_count} card{set.card_count === 1 ? "" : "s"}
              </div>
              <div className="text-xs text-zinc-400">
                Created {new Date(set.create_date).toLocaleDateString()}
              </div>

              <div className="mt-auto flex items-center justify-between pt-3">
                <Link
                  href={`/dashboard/${set.id}`}
                  className="text-red-500 hover:text-red-600 font-medium text-sm"
                >
                  View Card Set →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(set)}
                  disabled={deletingId === set.id}
                  aria-label={`Delete ${set.set_name}`}
                  className="text-red-500 hover:bg-red-50 rounded p-1.5 transition-colors disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
