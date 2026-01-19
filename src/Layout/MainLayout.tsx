import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSidebar } from "@/hooks/useSidebar";

export default function MainLayout() {
  const { isCollapsed, toggle, collapse, expand, isMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay (below top bar, above content) */}
      {!isCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={collapse}
        />
      )}

      {/* Sidebar - Always fixed */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-150 ease-out ${
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        } ${isCollapsed ? "md:w-16" : "md:w-64"} w-64`}
        style={{ willChange: "transform" }}
      >
        <Sidebar isCollapsed={isCollapsed} onToggle={toggle} />
      </aside>

      {/* Main content area - with proper margin for sidebar */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-[margin-left] duration-150 ease-out ${
          isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
        style={{ willChange: "margin-left" }}
      >
        <TopBar onToggleSidebar={toggle} />
        <MainContent isSidebarCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
