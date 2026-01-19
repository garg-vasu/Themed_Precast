import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}
