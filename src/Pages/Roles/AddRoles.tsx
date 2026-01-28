import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

const schema = z.object({
  role_name: z
    .string()
    .min(1, "Role name is required")
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      "Role name can only contain letters, numbers, spaces, hyphens, and underscores",
    ),
});

type FormFields = z.infer<typeof schema>;

interface RoleFormProps {
  onSuccess: () => void;
}

export default function RoleForm({ onSuccess }: RoleFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      role_name: "",
    },
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setServerError(null);
    try {
      const response = await apiClient.post("/roles", data);
      if (response.data.message) {
        reset();
        onSuccess();
      } else {
        setServerError("Error creating role. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const message =
        error.response?.data?.message ||
        "Failed to create role. Please try again.";
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
            htmlFor="role_name"
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            Role Name
          </Label>
          <Input
            {...register("role_name")}
            type="text"
            id="role_name"
            placeholder="e.g., Admin, Manager, Viewer"
            className={`h-9 text-sm ${
              errors.role_name
                ? "border-destructive focus-visible:ring-destructive"
                : "focus-visible:ring-ring"
            }`}
            aria-invalid={!!errors.role_name}
            disabled={isSubmitting}
          />
          {errors.role_name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.role_name.message}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Choose a descriptive name for the role
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
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Create Role
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
