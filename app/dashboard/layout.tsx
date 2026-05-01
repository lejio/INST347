import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "./_components/Navbar";
import SubNav from "./_components/SubNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar userEmail={session.user.email} />
      <main className="max-w-screen-2xl px-3 mx-auto my-8 mt-24 xl:px-20 lg:px-14 md:px-10">
        <SubNav />
        {children}
      </main>
    </div>
  );
}
