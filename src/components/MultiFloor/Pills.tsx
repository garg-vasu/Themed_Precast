import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillsProps {
  image?: string;
  text: string;
  onClick: () => void;
  removable?: boolean;
}

export default function Pills({
  image,
  text,
  onClick,
  removable = true,
}: PillsProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-primary/10 text-primary border border-primary/20",
        "transition-all duration-200 hover:bg-primary/15",
        removable && "pr-1"
      )}
    >
      {image && (
        <img
          className="h-4 w-4 rounded-full object-cover"
          src={image}
          alt={text}
        />
      )}
      <span className="truncate max-w-[200px]">{text}</span>
      {removable && (
        <button
          type="button"
          className={cn(
            "ml-0.5 rounded-full p-0.5 transition-colors",
            "hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
            "flex items-center justify-center"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label={`Remove ${text}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

