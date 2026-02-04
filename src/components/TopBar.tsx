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
import { useContext } from "react";
import { UserContext } from "@/Provider/UserProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onToggleSidebar: () => void;
}

const buildAvatarSrc = (profilePicture?: string) => {
  if (!profilePicture) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return profilePicture;
  return `${baseUrl}/get-file?file=${encodeURIComponent(profilePicture)}`;
};

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  // Generate initials for avatar fallback
  const getInitials = () => {
    if (!user) return "U";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (
      (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
    );
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

        {/* Right section - Theme toggle and User Profile */}
        <div className="flex items-center space-x-3 ml-auto">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={buildAvatarSrc(user?.profile_picture)}
                    alt={user?.first_name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-white text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
