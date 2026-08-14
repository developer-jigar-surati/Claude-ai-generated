import TopNav from "@/components/TopNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-[1400px] px-3 py-5 sm:px-4 sm:py-6">{children}</main>
    </div>
  );
}
