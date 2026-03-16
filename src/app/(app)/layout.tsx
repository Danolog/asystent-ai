import { TopNav } from "@/components/organisms/TopNav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      <ServiceWorkerRegistrar />
      <TopNav />
      <div className="flex flex-1 overflow-hidden pb-14 md:pb-0">{children}</div>
    </div>
  );
}
