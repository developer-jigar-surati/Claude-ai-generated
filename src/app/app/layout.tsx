import TopNav from "@/components/TopNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
