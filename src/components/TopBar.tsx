// import { Menu } from "lucide-react";
// import { ModeToggle } from "@/components/mode-togglet";

// interface TopBarProps {
//   onToggleSidebar: () => void;
// }

// export default function TopBar({ onToggleSidebar }: TopBarProps) {
//   return (
//     <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
//       {/* Subtle accent color border hint */}
//       <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/20" />
//       <div className="flex h-16 items-center justify-between px-6 relative z-10">
//         {/* left section  */}
//         <div className="flex items-center space-x-4">
//           {/* hamburger button */}
//           <button
//             onClick={onToggleSidebar}
//             className="p-2 rounded-md hover:bg-accent transition-colors md:hidden"
//             aria-label="Toggle sidebar"
//           >
//             <Menu className="h-6 w-6" />
//           </button>
//         </div>
//         {/* right section  */}
//         <div className="flex items-center space-x-4">
//           <ModeToggle />
//         </div>
//       </div>
//     </header>
//   );
// }

import { Menu, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-togglet";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Subtle accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/20" />

      <div className="flex h-16 items-center justify-between px-6">
        {/* Left section - Mobile hamburger */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-accent transition-colors md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Right section - Theme toggle and Logout */}
        <div className="flex items-center space-x-4 ml-auto">
          <ModeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
