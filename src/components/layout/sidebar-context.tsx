"use client";

import { useState, useCallback, createContext, useContext } from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
});

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("zawly-sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);

  const setCollapsed = useCallback((v: boolean) => {
    setIsCollapsed(v);
    try {
      localStorage.setItem("zawly-sidebar-collapsed", String(v));
    } catch { /* localStorage unavailable */ }
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
