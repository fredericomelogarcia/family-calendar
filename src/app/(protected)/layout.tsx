import { ToastContainer } from "@/components/ui/toast";
import { BottomNav, Sidebar } from "@/components/layout/navigation";
import { MainContent } from "@/components/layout/main-content";
import { SidebarProvider } from "@/components/layout/sidebar-context";

// Protected layout - light theme only
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SidebarProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <MainContent>{children}</MainContent>
        </div>
        <BottomNav />
      </SidebarProvider>
      <ToastContainer />
    </div>
  );
}
