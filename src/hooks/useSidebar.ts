import { useEffect, useState } from "react";

import { useIsMobile } from "./use-mobile";

interface UseSidebarReturn {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  isMobile: boolean;
}

export const useSidebar = (): UseSidebarReturn => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (window.innerWidth < 768) {
      return true;
    }
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const toggle = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);
  //   save to local storage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  //   handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        collapse();
      } else {
        // On desktop, restore the saved state or default to expanded
        const saved = localStorage.getItem("sidebar-collapsed");
        const shouldCollapse = saved ? JSON.parse(saved) : false;
        setIsCollapsed(shouldCollapse);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isCollapsed, toggle, collapse, expand, isMobile };
};
