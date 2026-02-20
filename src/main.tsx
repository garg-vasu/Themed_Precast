/**
 * Theme System Documentation
 * =========================
 *
 * This application uses a dynamic theme system that supports:
 * - Theme modes: "light", "dark", or "system" (follows OS preference)
 * - Accent colors: "blue" (default), "green", "purple", "red", "orange"
 *
 * CSS Color Variables Explained:
 * -----------------------------
 *
 * General Colors:
 * - background: Main page background color
 *   • Light mode: White
 *   • Dark mode: Dark gray/black
 *   • Accent colors: No effect
 *
 * - foreground: Main text color
 *   • Light mode: Dark/black
 *   • Dark mode: Light/white
 *   • Accent colors: No effect
 *
 * - primary: Primary action color (buttons, links, highlights)
 *   • Light mode: Dark color
 *   • Dark mode: Light color
 *   • Accent colors: Changes to selected accent color (blue/green/purple/red/orange)
 *
 * - primary-foreground: Text color on primary backgrounds
 *   • Light mode: Light/white (for contrast)
 *   • Dark mode: Dark (for contrast)
 *   • Accent colors: Automatically adjusts for contrast
 *
 * - accent: Secondary highlight color (hover states, subtle backgrounds)
 *   • Light mode: Light gray with accent tint
 *   • Dark mode: Dark gray with accent tint
 *   • Accent colors: Subtle tint of selected accent color
 *
 * - accent-foreground: Text color on accent backgrounds
 *   • Light mode: Dark text
 *   • Dark mode: Light text
 *   • Accent colors: May use accent color for text
 *
 * Sidebar-Specific Colors:
 * -----------------------
 *
 * - sidebar: Sidebar background color
 *   • Light mode: Off-white
 *   • Dark mode: Dark gray
 *   • Accent colors: No effect (stays neutral)
 *
 * - sidebar-foreground: Sidebar text color
 *   • Light mode: Dark text
 *   • Dark mode: Light/white text
 *   • Accent colors: No effect (stays neutral for readability)
 *
 * - sidebar-primary: Active/highlighted sidebar items background
 *   • Light mode: Dark color
 *   • Dark mode: Light color
 *   • Accent colors: Changes to selected accent color (blue/green/purple/red/orange)
 *
 * - sidebar-primary-foreground: Text color on active sidebar items
 *   • Light mode: Light/white (for contrast)
 *   • Dark mode: Light/white (for contrast)
 *   • Accent colors: Always white/light for readability
 *
 * - sidebar-accent: Hover state background in sidebar
 *   • Light mode: Light gray with subtle accent tint
 *   • Dark mode: Dark gray with subtle accent tint
 *   • Accent colors: Subtle tint of selected accent color
 *
 * - sidebar-accent-foreground: Text color on sidebar hover states
 *   • Light mode: Dark text
 *   • Dark mode: White text (for readability)
 *   • Accent colors: Always white in dark mode, dark in light mode
 *
 * - sidebar-border: Sidebar border color
 *   • Light mode: Light gray
 *   • Dark mode: Semi-transparent white
 *   • Accent colors: No effect
 *
 * - sidebar-ring: Focus ring color for sidebar elements
 *   • Light mode: Gray
 *   • Dark mode: Gray
 *   • Accent colors: Changes to selected accent color
 *
 * How It Works:
 * ------------
 * When a user selects an accent color (e.g., "green"), the CSS class "accent-green"
 * is applied to the root element. This overrides the primary, accent, and sidebar
 * color variables with green-tinted values while maintaining proper contrast ratios.
 *
 * The theme provider manages both theme mode and accent color, persisting preferences
 * to localStorage and applying the appropriate CSS classes dynamically.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "./components/theme-provider.tsx";
import { RouterProvider } from "react-router";
import router from "./Routes.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" defaultAccentColor="blue">
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </ThemeProvider>,
);
