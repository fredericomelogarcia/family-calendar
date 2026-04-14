"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  // Only apply margin if signed in and NOT on the landing page
  const hasSidebar = isSignedIn && pathname !== "/";

  return (
    <main className={cn(
      "flex-1 overflow-y-auto pb-24 lg:pb-0 transition-[margin] duration-200",
      hasSidebar ? (isCollapsed ? "lg:ml-24" : "lg:ml-72") : "lg:ml-0"
    )}>
      {children}
    </main>
  );
}