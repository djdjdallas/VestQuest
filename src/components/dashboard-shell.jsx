import { DashboardNav } from "@/components/dashboard-nav";

export function DashboardShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 items-start md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-col overflow-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
