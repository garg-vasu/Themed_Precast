import { Toaster as Sonner } from "sonner";

// Lightweight wrapper so we can import from a single place.
const Toaster = (props: Record<string, unknown>) => (
  <Sonner richColors position="top-right" {...props} />
);

export { Toaster };
