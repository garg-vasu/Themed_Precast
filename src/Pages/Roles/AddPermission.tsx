import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, AlertCircle } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

const schema = z.object({
  permission_name: z
    .string()
    .min(1, "Permission name is required")
    .min(2, "Permission name must be at least 2 characters")
    .max(100, "Permission name must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9_:\s-]+$/,
      "Permission name can only contain letters, numbers, spaces, hyphens, underscores, and colons",
    ),
});

type FormFields = z.infer<typeof schema>;

interface PermissionFormProps {
  onSuccess: () => void;
}

export default function PermissionForm({ onSuccess }: PermissionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      permission_name: "",
    },
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setServerError(null);
    try {
      const response = await apiClient.post("/permissions", data);
      if (response.data.message) {
        reset();
        onSuccess();
      } else {
        setServerError("Error creating permission. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const message =
        error.response?.data?.message ||
        "Failed to create permission. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label
            htmlFor="permission_name"
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            Permission Name
          </Label>
          <Input
            {...register("permission_name")}
            type="text"
            id="permission_name"
            placeholder="e.g., users:read, projects:write"
            className={`h-9 text-sm ${
              errors.permission_name
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-ring"
            }`}
            aria-invalid={!!errors.permission_name}
            disabled={isSubmitting}
          />
          {errors.permission_name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.permission_name.message}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Use format like "resource:action" (e.g., users:create)
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-9 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Create Permission
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
