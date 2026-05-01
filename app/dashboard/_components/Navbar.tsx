import Link from "next/link";
import SignOutButton from "../sign-out-button";

export default function Navbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-3 xl:px-20 lg:px-14 md:px-10 h-16">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-500 text-white font-bold">
            F
          </span>
          <span className="text-lg font-semibold text-zinc-900">FlashGen</span>
        </Link>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden sm:inline text-sm text-zinc-600">
              {userEmail}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
