import {
  Home,
  Users,
  Settings,
  FileText,
  BarChart3,
  Mail,
  Bell,
  Menu,
  X,
  Command,
  AudioWaveform,
  GalleryVerticalEnd,
  Plus,
  ShoppingBasket,
  Calendar,
  UserStar,
  ShoppingBag,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "@/hooks/useSidebar";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Team = [
  {
    name: "Print24by7",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "InkPrint",
    logo: AudioWaveform,
    plan: "Startup",
  },
  // {
  //   name: "Evil Corp.",
  //   logo: Command,
  //   plan: "Free",
  // },
];

const navigationItems = [
  {
    name: "Dashboard",

    icon: Home,
    href: "/",
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: FileText,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: UserStar,
  },
  {
    name: "Suppliers",
    href: "/suppliers",
    icon: Users,
  },
  {
    name: "Products",
    href: "/products",
    icon: ShoppingBasket,
  },
  {
    name: "Purchase Orders",
    href: "/purchaseOrders",
    icon: ShoppingBag,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function ProjectSidebar({
  isCollapsed,
  onToggle,
}: SidebarProps) {
  const location = useLocation();

  const [activeTeam, setActiveTeam] = useState(Team[0]);
  const { isMobile } = useSidebar();
  const ActiveLogo = activeTeam.logo;

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      }  flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out`}
    >
      {/* header  */}
      <div
        className={`flex items-center h-16 ${
          isCollapsed ? "justify-center" : "justify-between"
        } p-4`}
      >
        {!isCollapsed && (
          // <DropdownMenu>
          //   <DropdownMenuTrigger asChild>
          //     <div className="data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent flex w-full p-2 items-center gap-2 data-[state=open]:text-sidebar-accent-foreground  rounded-lg">
          //       <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          //         <ActiveLogo className="size-4" />
          //       </div>
          //       <div className="grid flex-1 text-left text-sm leading-tight">
          //         <span className="truncate font-medium">
          //           {activeTeam.name}
          //         </span>
          //         <span className="truncate text-xs">{activeTeam.plan}</span>
          //       </div>
          //       <ChevronsUpDown className="ml-auto" />
          //     </div>
          //   </DropdownMenuTrigger>
          //   <DropdownMenuContent
          //     className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          //     align="start"
          //     side={isMobile ? "bottom" : "right"}
          //     sideOffset={4}
          //   >
          //     <DropdownMenuLabel className="text-muted-foreground text-xs">
          //       Teams
          //     </DropdownMenuLabel>
          //     {Team.map((team, index) => (
          //       <DropdownMenuItem
          //         key={team.name}
          //         onClick={() => setActiveTeam(team)}
          //         className="gap-2 p-2"
          //       >
          //         <div className="flex size-6 items-center justify-center rounded-md border">
          //           <team.logo className="size-3.5 shrink-0" />
          //         </div>
          //         {team.name}
          //         <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
          //       </DropdownMenuItem>
          //     ))}
          //   </DropdownMenuContent>
          // </DropdownMenu>

          // in place of that dropdown i want to display the comapny name and logo
          // company name will be Precast and use a demo logo for now
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                PC
              </span>
            </div>
            <span className="font-semibold text-lg">Precast</span>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* navigation  */}
      <nav className="flex-1 p-4    space-y-1">
        {/* Mobile team switcher placeholder removed; uncomment if needed */}
        {isMobile && !isCollapsed && null}
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={`flex items-center  ${
                isCollapsed ? "justify-center" : "justify-start"
              } space-x-3 text-foreground px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground "
                  : "hover:bg-sidebar-accent"
              }`}
              title={isCollapsed ? item.name : ""}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-sidebar-primary-foreground" : ""
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </NavLink>
      </div>
    </div>
  );
}
