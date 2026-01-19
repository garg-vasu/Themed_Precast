import { Outlet } from "react-router";

export default function ProjectMainContent() {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden ">
      <main className="flex flex-col flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {/* footer  */}
      {/* hide in mobile  */}
      <div className="hidden md:block">
        <footer className="border-t border-border bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>© 2026 PreCast. All rights reserved.</span>
              </div>
              <div className="flex items-center space-x-4">
                <button className="hover:text-foreground transition-colors">
                  Privacy Policy
                </button>
                <button className="hover:text-foreground transition-colors">
                  Terms of Service
                </button>
                <button className="hover:text-foreground transition-colors">
                  Support
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
