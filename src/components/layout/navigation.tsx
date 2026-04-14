"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { House, CalendarBlank, Plus, Gear, Heart, SidebarSimple as SidebarCollapseIcon, Sidebar as SidebarExpandIcon } from "@phosphor-icons/react";
import { useSidebar } from "@/components/layout/sidebar-context";

const navItems = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/calendar", icon: CalendarBlank, label: "Calendar" },
  { href: "/events/new", icon: Plus, label: "Add", isSpecial: true },
  { href: "/support", icon: Heart, label: "Support" },
  { href: "/settings", icon: Gear, label: "Settings" },
];

export function BottomNav() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  if (!isSignedIn) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-area-bottom lg:hidden z-40 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== "/events/new" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <div key={`nav-special-${index}`} className="relative w-14 h-14 flex items-center justify-center">
                <Link
                  href={item.href}
                  className="absolute inset-0 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary-dark active:scale-95 transition-all duration-150"
                >
                  <Icon size={24} weight="bold" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={`nav-item-${index}`}
              href={item.href}
              className={cn(
              "flex flex-col items-center justify-center w-16 h-16 rounded-[--radius-sm] transition-all duration-150",
              isActive 
                ? "text-primary font-semibold" 
                : "text-text-secondary hover:text-text-primary"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  if (!isSignedIn) return null;

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 bg-surface border-r border-border flex-col z-40 overflow-hidden",
        "transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-24" : "w-72"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center flex-shrink-0 h-16 transition-all duration-200",
        isCollapsed ? "justify-center px-0" : "gap-3 px-6"
      )}>
        <div className="w-10 h-10 rounded-[--radius-md] bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
          <Image src="/icons/icon-192.png" alt="Zawly" width={40} height={40} className="rounded-[--radius-md]" />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary whitespace-nowrap">
            Zawly
          </span>
        )}
      </div>

      {/* Toggle */}
      <div className={cn("px-3 mb-2", isCollapsed && "px-2")}>
        <button
          onClick={toggle}
          className={cn(
            "w-full flex items-center rounded-[--radius-sm] text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors duration-150",
            isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <SidebarExpandIcon size={18} weight="bold" />
          ) : (
            <>
              <SidebarCollapseIcon size={18} weight="bold" />
              <span className="text-sm whitespace-nowrap">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.filter(item => !item.isSpecial).map((item) => {
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href) && item.href !== "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[--radius-md] transition-colors duration-150 h-11",
                isCollapsed ? "justify-center px-0" : "px-3",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              )}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}