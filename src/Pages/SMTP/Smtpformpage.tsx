import axios, { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/utils/apiClient";

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

const schema = z.object({
  smtp_host: z.string().min(1, "SMTP Host is required"),
  port: z.number({ invalid_type_error: "Port is required" }).min(1, "Port is required"),
  encryption: z.string().min(1, "Encryption is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  from_email: z.string().email("Invalid email").min(1, "From Email is required"),
  display_name: z.string().min(1, "Display Name is required"),
});

type FormData = z.infer<typeof schema>;

export interface SmtpSettings {
  id?: number;
  smtp_host: string;
  port: number;
  encryption: string;
  username: string;
  password?: string;
  from_email: string;
  display_name: string;
}

type SmtpFormProps = {
  settings?: SmtpSettings;
};

export default function Smtpformpage({ settings }: SmtpFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!settings;
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultValues = (): Partial<FormData> => {
    if (!settings) {
      return {
        smtp_host: "",
        port: 587,
        encryption: "TLS",
        username: "",
        password: "",
        from_email: "",
        display_name: "",
      };
    }
    return {
      smtp_host: settings.smtp_host || "",
      port: settings.port || 587,
      encryption: settings.encryption || "TLS",
      username: settings.username || "",
      password: settings.password || "",
      from_email: settings.from_email || "",
      display_name: settings.display_name || "",
    };
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (settings) {
      reset(getDefaultValues());
    }
  }, [settings, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
      };

      if (isEditMode && settings?.id) {
        payload.id = settings.id;
        
        const response = await apiClient.put(`/smtp_settings_update`, payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("SMTP Settings updated successfully!");
        }
      } else {
        const response = await apiClient.post("/smtp_settings_create", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("SMTP Settings created successfully!");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update settings" : "create settings",
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit SMTP Settings" : "SMTP Settings"} />
      </div>
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          
          {/* SMTP Host */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="smtp_host">
              SMTP Host <span className="text-red-500">*</span>
            </Label>
            <Input
              id="smtp_host"
              placeholder="e.g. smtp.gmail.com"
              {...register("smtp_host")}
              aria-invalid={!!errors.smtp_host}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.smtp_host?.message || "\u00A0"}
            </p>
          </div>

          {/* Port */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="port">
              Port <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-1">
                (587 recommended)
              </span>
            </Label>
            <Input
              id="port"
              type="number"
              placeholder="587"
              {...register("port", { valueAsNumber: true })}
              aria-invalid={!!errors.port}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.port?.message || "\u00A0"}
            </p>
          </div>

          {/* Encryption */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="encryption">
              Encryption <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="encryption"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Encryption" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Encryption Types</SelectLabel>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.encryption?.message || "\u00A0"}
            </p>
          </div>

          {/* Username */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              placeholder="Username"
              {...register("username")}
              aria-invalid={!!errors.username}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.username?.message || "\u00A0"}
            </p>
          </div>

          {/* Password */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">
              Password / App Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.password?.message || "\u00A0"}
            </p>
          </div>

          {/* From Email */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="from_email">
              From Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="from_email"
              type="email"
              placeholder="sender@example.com"
              {...register("from_email")}
              aria-invalid={!!errors.from_email}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.from_email?.message || "\u00A0"}
            </p>
          </div>

          {/* Display Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="display_name">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              placeholder="Display Name"
              {...register("display_name")}
              aria-invalid={!!errors.display_name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.display_name?.message || "\u00A0"}
            </p>
          </div>

        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
