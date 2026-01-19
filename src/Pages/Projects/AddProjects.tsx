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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiClient } from "@/utils/apiClient";
import MultiStockyard from "@/components/MultiStockyard/MultiStockyard";
import MultiRole, { type Role } from "@/components/multirole/mulitrole";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export type Template = {
  id: number;
  name: string;
  stages: null;
};

// schema of the form
const roleSchema = z.object({
  role_id: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});
const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  budget: z.string().min(1),
  priority: z.string().min(1),
  project_status: z.string().min(1),
  abbreviation: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  subscription_start_date: z.string().min(1),
  subscription_end_date: z.string().min(1),
  logo: z.string().optional(),
  user_no: z.string().optional(),
  client_id: z.number().min(1),
  roles: z.array(roleSchema).min(1, "Roles must be at least 1"),
  template_id: z.number().min(1),
  stockyards: z.array(z.number()).min(1, "Stockyards must be at least 1"),
});

type FormData = z.infer<typeof schema>;

// status will be Critical, Cancelled, Completed, Ongoing, Inactive
const statuses = [
  { value: "Critical", label: "Critical" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Completed", label: "Completed" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Inactive", label: "Inactive" },
];

// high, Medium , Low
const priority = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export interface Stockyard {
  id: number;
  yard_name: string;
  location: string;
  capacity: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
  tenant_id: number;
}

export interface EndClient {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

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

interface EditProject {
  project_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  description: string;
  name: string;
  abbreviation?: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  budget: string;
  client_name: string;
  client_id: number;
  logo: string;
  total_elements: number;
  completed_elements: number;
  progress: number;
  template_id: number;
  stockyards: editStockyard[];
  roles?: { role_id: number; quantity: number }[];
}

type editStockyard = {
  id: number;
  yard_name: string;
  location: string;
  created_at: string;
  updated_at: string;
  carpet_area: number;
};

type UserFormProps = {
  user?: EditProject;
};

export default function AddProjects({ user }: UserFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!user;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [openSubscriptionStartDate, setOpenSubscriptionStartDate] =
    useState(false);
  const [openSubscriptionEndDate, setOpenSubscriptionEndDate] = useState(false);
  const [stockyards, setStockyards] = useState<Stockyard[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [endClients, setEndClients] = useState<EndClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Helper function to build image URL for display
  const buildImageUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return fileName;
    return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    // formData.append("upload_location", "client_profile");

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data?.file_name) {
          const imageUrlValue = response.data.file_name;
          setImageUrl(imageUrlValue);
          setValue("logo", imageUrlValue);
          toast.success("Image uploaded successfully!");
        } else {
          throw new Error("Invalid response format: Missing image URL.");
        }
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "upload image");
      toast.error(errorMessage);
      console.error("Image upload failed:", error);
      setImagePreview("");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    setValue("logo", "");
    toast.success("Image removed");
  };

  // Helper function to parse date string to Date object
  const parseDate = (dateString: string | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  // Prepare default values for form
  const getDefaultValues = (): Partial<FormData> => {
    if (!user) {
      return {
        name: "",
        description: "",
        abbreviation: "",
        budget: "",
        priority: "",
        project_status: "",
        start_date: "",
        end_date: "",
        subscription_start_date: "",
        subscription_end_date: "",
        client_id: 0,
        template_id: 0,
        roles: [],
        stockyards: [],
      };
    }

    return {
      name: user.name || "",
      description: user.description || "",
      abbreviation: user.abbreviation || "",
      budget: user.budget || "",
      priority: user.priority || "",
      project_status: user.project_status || "",
      start_date: user.start_date || "",
      end_date: user.end_date || "",
      subscription_start_date: user.subscription_start_date || "",
      subscription_end_date: user.subscription_end_date || "",
      client_id: user.client_id || 0,
      template_id: user.template_id || 0,
      roles: user.roles || [],
      stockyards: user.stockyards?.map((sy) => sy.id) || [],
      logo: user.logo || "",
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  //   templates api call
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get("/get_template", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setTemplates(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch templates");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "templates data"));
        }
      }
    };

    fetchTemplates();

    return () => {
      source.cancel();
    };
  }, []);

  //   end clients api call
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      try {
        const response = await apiClient.get("/end_clients", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setEndClients(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      }
    };

    fetchEndClients();

    return () => {
      source.cancel();
    };
  }, []);

  //   stockyards api call
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchStockyards = async () => {
      try {
        const response = await apiClient.get("/stockyards", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setStockyards(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch stockyards");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stockyards data"));
        }
      }
    };

    fetchStockyards();

    return () => {
      source.cancel();
    };
  }, []);

  //   ROLES API CALL
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchRoles = async () => {
      try {
        const response = await apiClient.get("/get_roles", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setRoles(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch roles");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "roles data"));
        }
      }
    };

    fetchRoles();

    return () => {
      source.cancel();
    };
  }, []);

  // Prefill form when user data is available
  useEffect(() => {
    if (user) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);

      // Set dates
      const startDate = parseDate(user.start_date);
      const endDate = parseDate(user.end_date);
      const subStartDate = parseDate(user.subscription_start_date);
      const subEndDate = parseDate(user.subscription_end_date);

      if (startDate) setValue("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) setValue("end_date", format(endDate, "yyyy-MM-dd"));
      if (subStartDate)
        setValue("subscription_start_date", format(subStartDate, "yyyy-MM-dd"));
      if (subEndDate)
        setValue("subscription_end_date", format(subEndDate, "yyyy-MM-dd"));

      // Set image preview if logo exists
      if (user.logo) {
        setImageUrl(user.logo);
        setImagePreview(buildImageUrl(user.logo));
      }
    }
  }, [user, reset, setValue]);

  const handleRoleChange = (selectedRoleIds: number[]) => {
    const currentRoles: { role_id: number; quantity: number }[] =
      watch("roles") || [];
    const newRoles = selectedRoleIds.map((id) => {
      const existingRole = currentRoles.find((r) => r.role_id === id);
      return existingRole || { role_id: id, quantity: 1 };
    });
    setValue("roles", newRoles, { shouldValidate: true });
  };

  const handleStockyardChange = (value: number[]) => {
    setValue("stockyards", value, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        budget: data.budget.toString(),
      };

      if (isEditMode && user) {
        // Update existing project
        const response = await apiClient.put(
          `/projects/${user.project_id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Project updated successfully!");
          navigate("/projects");
        }
      } else {
        // Create new project
        const response = await apiClient.post("/projects", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Project created successfully!");
          navigate("/projects");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update project" : "create project"
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit Project" : "Add Project"} />
      </div>
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Picture Picker */}
        <div className="flex flex-col items-center gap-4 py-6 border-b">
          <Label className="text-base font-semibold">Project Logo</Label>
          <div className="relative group">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg ring-2 ring-ring ring-offset-2">
                {imagePreview || (imageUrl && buildImageUrl(imageUrl)) ? (
                  <AvatarImage
                    src={imagePreview || buildImageUrl(imageUrl)}
                    alt="Project logo"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                    <ImageIcon className="w-12 h-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            {(imagePreview || imageUrl) && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 rounded-full w-8 h-8 shadow-lg"
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <label
              htmlFor="logo-upload"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                isUploadingImage && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {imageUrl || imagePreview ? "Change Logo" : "Upload Logo"}
                  </span>
                </>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploadingImage}
              />
            </label>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Recommended: Square image, max 5MB. JPG, PNG, or GIF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project_name"
              placeholder="Project Name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.name?.message || "\u00A0"}
            </p>
          </div>
          {/* description */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_description">Project Description</Label>
            <Textarea
              id="project_description"
              placeholder="Project Description"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.description?.message || "\u00A0"}
            </p>
          </div>
          {/* ABBREVIATION */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_abbreviation">
              Project Abbreviation <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project_abbreviation"
              placeholder="Project Abbreviation"
              {...register("abbreviation")}
              aria-invalid={!!errors.abbreviation}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.abbreviation?.message || "\u00A0"}
            </p>
          </div>
          {/* project status */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_status">
              Project Status <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="project_status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    const selectedStatus = statuses.find(
                      (status) => status.value === val
                    );
                    if (selectedStatus) {
                      setValue("project_status", selectedStatus.value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Project Status</SelectLabel>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.project_status?.message || "\u00A0"}
            </p>
          </div>
          {/* priority */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_priority">
              Project Priority <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    const selectedPriority = priority.find(
                      (priority) => priority.value === val
                    );
                    if (selectedPriority) {
                      setValue("priority", selectedPriority.value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Project Priority</SelectLabel>
                      {priority.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.priority?.message || "\u00A0"}
            </p>
          </div>
          {/* template */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_template">
              Project Template <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="template_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    const selectedTemplate = templates.find(
                      (template) => template.id === Number(val)
                    );
                    if (selectedTemplate) {
                      setValue("template_id", selectedTemplate.id);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Project Templates</SelectLabel>
                      {templates.map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id.toString()}
                        >
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.template_id?.message || "\u00A0"}
            </p>
          </div>
          {/* end client  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_end_client">
              Project End Client <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    const selectedEndClient = endClients.find(
                      (endClient) => endClient.id === Number(val)
                    );
                    if (selectedEndClient) {
                      setValue("client_id", selectedEndClient.id);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select End Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>End Clients</SelectLabel>
                      {endClients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id.toString()}
                        >
                          {client.contact_person || client.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.client_id?.message || "\u00A0"}
            </p>
          </div>
          {/* start date  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="start_date" className="px-1">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenStartDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.start_date?.message || "\u00A0"}
            </p>
          </div>
          {/* end date */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="end_date" className="px-1">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenEndDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.end_date?.message || "\u00A0"}
            </p>
          </div>
          {/* subscription start date  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="subscription_start_date" className="px-1">
              Subscription Start Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="subscription_start_date"
              render={({ field }) => (
                <Popover
                  open={openSubscriptionStartDate}
                  onOpenChange={setOpenSubscriptionStartDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select subscription start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenSubscriptionStartDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.subscription_start_date?.message || "\u00A0"}
            </p>
          </div>
          {/* subscription end date */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="subscription_end_date" className="px-1">
              Subscription End Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="subscription_end_date"
              render={({ field }) => (
                <Popover
                  open={openSubscriptionEndDate}
                  onOpenChange={setOpenSubscriptionEndDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select subscription end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenSubscriptionEndDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.subscription_end_date?.message || "\u00A0"}
            </p>
          </div>
          {/* budget  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_budget">
              Budget <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project_budget"
              placeholder="Project Budget"
              {...register("budget")}
              type="number"
              aria-invalid={!!errors.budget}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.budget?.message || "\u00A0"}
            </p>
          </div>
          {/* stockyards selection  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="stockyards" className="px-1">
              Select Stockyards <span className="text-red-500">*</span>
            </Label>
            <MultiStockyard
              users={stockyards}
              onSelectionChange={handleStockyardChange}
              placeholder="Select stockyards..."
              initialSelected={watch("stockyards") || []}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.stockyards?.message || "\u00A0"}
            </p>
          </div>

          {/* SELECT ROLES  */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="roles" className="px-1">
              Select Roles <span className="text-red-500">*</span>
            </Label>
            <MultiRole
              users={roles}
              onSelectionChange={handleRoleChange}
              placeholder="Select roles..."
              initialSelected={watch("roles")?.map((r: any) => r.role_id) || []}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.roles?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Role Quantities Section */}
        {(watch("roles") || []).length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Role Quantities</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(watch("roles") || []).map((role: any, index: number) => {
                const roleObj = roles.find((r) => r.role_id === role.role_id);
                return (
                  <div
                    key={role.role_id}
                    className="flex items-center justify-between gap-3 bg-muted/50 p-3 rounded-lg border"
                  >
                    <Label className="capitalize min-w-0 truncate font-medium text-sm">
                      {roleObj?.role_name}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        {...register(`roles.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        className="w-20"
                        aria-invalid={!!errors.roles?.[index]?.quantity}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/projects")}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="min-w-[120px]"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update Project"
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
