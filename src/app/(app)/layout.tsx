import { TopNav } from "@/components/organisms/TopNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
