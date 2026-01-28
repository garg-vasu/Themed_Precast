import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, ImageIcon, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  password: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_admin: boolean;
  profile_picture: string;
  role_id: number;
  role_name: string;
  employee_id: string;
  first_access: string;
  last_access: string;
  created_at: string;
  updated_at: string;
}

export interface Phonecode {
  id: number;
  country_name: string;
  phone_code: string;
}
export interface Client {
  client_id: number;
  organization: string;
  user: User;
}

const schema = z.object({
  email: z.string().email().min(1, "Email is required"),
  organization_name: z.string().min(1, "Organization name is required"),
  attachment: z.array(z.string()).min(1, "Attachments are required"),
  contact_person: z.string().min(1, "Contact person is required"),
  address: z.string().min(1, "Address is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  gst_number: z.string().min(1, "GST number is required"),
  cin: z.string().min(1, "CIN is required"),
  phone_no: z.string().min(1, "Phone number is required"),
  profile_picture: z.string().optional(),
  phone_code: z.number().min(1, "Phone code is required"),
  client_id: z.number().min(1, "Client is required"),
});
type FormData = z.infer<typeof schema>;

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
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

type AddEndClientProps = {
  refresh: () => void;
  initialData: FormData | null;
  onClose: () => void;
};

export function AddEndClient({
  refresh,
  initialData,
  onClose,
}: AddEndClientProps) {
  const isEditMode = !!initialData;
  const [clients, setClients] = useState<Client[]>([]);
  const [phonecodes, setPhonecodes] = useState<Phonecode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Helper function to build image URL for display
  const buildImageUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return fileName;
    return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
  };

  // Fetch phone codes
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchPhonecodes = async () => {
      try {
        const response = await apiClient.get("/phonecodes", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPhonecodes(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch phonecodes");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "phonecodes data"));
        }
      }
    };

    fetchPhonecodes();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch clients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchClients = async () => {
      try {
        const response = await apiClient.get("/client", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setClients(response.data.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch clients");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "clients data"));
        }
      }
    };

    fetchClients();

    return () => {
      source.cancel();
    };
  }, []);

  // Prepare default values for form
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        email: "",
        organization_name: "",
        attachment: [],
        contact_person: "",
        address: "",
        abbreviation: "",
        gst_number: "",
        cin: "",
        phone_no: "",
        profile_picture: "",
        phone_code: 0,
        client_id: 0,
      };
    }

    return {
      email: initialData.email || "",
      organization_name: initialData.organization_name || "",
      attachment: initialData.attachment || [],
      contact_person: initialData.contact_person || "",
      address: initialData.address || "",
      abbreviation: initialData.abbreviation || "",
      gst_number: initialData.gst_number || "",
      cin: initialData.cin || "",
      phone_no: initialData.phone_no || "",
      profile_picture: initialData.profile_picture || "",
      phone_code: initialData.phone_code || 0,
      client_id: initialData.client_id || 0,
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // Prefill form when initialData is available
  useEffect(() => {
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);

      // Set image preview if profile_picture exists
      if (initialData.profile_picture) {
        setImageUrl(initialData.profile_picture);
        setImagePreview(buildImageUrl(initialData.profile_picture));
      }

      // Set attachments
      if (initialData.attachment && initialData.attachment.length > 0) {
        setAttachments(initialData.attachment);
        setValue("attachment", initialData.attachment);
      }
    }
  }, [initialData, reset, setValue]);

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
          setValue("profile_picture", imageUrlValue);
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
    setValue("profile_picture", "");
    toast.success("Image removed");
  };

  const handleAttachmentUpload = async (file: File) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setIsUploadingAttachment(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data?.file_name) {
          const fileName = response.data.file_name;
          const newAttachments = [...attachments, fileName];
          setAttachments(newAttachments);
          setValue("attachment", newAttachments);
          toast.success("File uploaded successfully!");
        } else {
          throw new Error("Invalid response format: Missing file name.");
        }
      } else {
        throw new Error("Failed to upload file.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "upload file");
      toast.error(errorMessage);
      console.error("File upload failed:", error);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        handleAttachmentUpload(file);
      });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue("attachment", newAttachments);
    toast.success("File removed");
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
      };

      if (isEditMode && initialData) {
        // Update existing end client
        const endClientId = (initialData as any)?.id || 0;
        if (!endClientId) {
          toast.error("End Client ID is missing");
          setIsLoading(false);
          return;
        }
        const response = await apiClient.put(
          `/end_clients/${endClientId}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("End Client updated successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Create new end client
        const response = await apiClient.post("/end_clients", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("End Client created successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update end client" : "create end client",
      );
      toast.error(errorMessage);
      // Refresh even on error to ensure data is up to date
      refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Picture Picker */}
        <div className="flex flex-col items-center gap-4 py-6 border-b">
          <Label className="text-base font-semibold">Profile Picture</Label>
          <div className="relative group">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg ring-2 ring-ring ring-offset-2">
                {imagePreview || (imageUrl && buildImageUrl(imageUrl)) ? (
                  <AvatarImage
                    src={imagePreview || buildImageUrl(imageUrl)}
                    alt="Profile picture"
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
              htmlFor="profile-upload"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                isUploadingImage && "opacity-50 cursor-not-allowed",
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
                    {imageUrl || imagePreview
                      ? "Change Picture"
                      : "Upload Picture"}
                  </span>
                </>
              )}
              <input
                id="profile-upload"
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
          {/* Email */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.email?.message || "\u00A0"}
            </p>
          </div>

          {/* Organization Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="organization_name">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organization_name"
              placeholder="Organization Name"
              {...register("organization_name")}
              aria-invalid={!!errors.organization_name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.organization_name?.message || "\u00A0"}
            </p>
          </div>

          {/* Contact Person */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="contact_person">
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_person"
              placeholder="Contact Person"
              {...register("contact_person")}
              aria-invalid={!!errors.contact_person}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.contact_person?.message || "\u00A0"}
            </p>
          </div>

          {/* Abbreviation */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="abbreviation">
              Abbreviation <span className="text-red-500">*</span>
            </Label>
            <Input
              id="abbreviation"
              placeholder="Abbreviation"
              {...register("abbreviation")}
              aria-invalid={!!errors.abbreviation}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.abbreviation?.message || "\u00A0"}
            </p>
          </div>

          {/* GST Number */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="gst_number">
              GST Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gst_number"
              placeholder="GST Number"
              {...register("gst_number")}
              aria-invalid={!!errors.gst_number}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.gst_number?.message || "\u00A0"}
            </p>
          </div>

          {/* CIN */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cin">
              CIN <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cin"
              placeholder="CIN"
              {...register("cin")}
              aria-invalid={!!errors.cin}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.cin?.message || "\u00A0"}
            </p>
          </div>

          {/* Phone Code */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone_code">
              Phone Code <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="phone_code"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    const selectedPhoneCode = phonecodes.find(
                      (code) => code.id === Number(val),
                    );
                    if (selectedPhoneCode) {
                      setValue("phone_code", selectedPhoneCode.id);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Phone Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Phone Codes</SelectLabel>
                      {phonecodes.map((code) => (
                        <SelectItem key={code.id} value={code.id.toString()}>
                          {code.phone_code} - {code.country_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.phone_code?.message || "\u00A0"}
            </p>
          </div>

          {/* Phone Number */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone_no">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone_no"
              type="tel"
              placeholder="Phone Number"
              {...register("phone_no")}
              aria-invalid={!!errors.phone_no}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.phone_no?.message || "\u00A0"}
            </p>
          </div>

          {/* Client */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="client_id">
              Client <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    const selectedClient = clients.find(
                      (client) => client.client_id === Number(val),
                    );
                    if (selectedClient) {
                      setValue("client_id", selectedClient.client_id);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Clients</SelectLabel>
                      {clients.map((client) => (
                        <SelectItem
                          key={client.client_id}
                          value={client.client_id.toString()}
                        >
                          {client.organization}
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

          {/* Address */}
          <div className="grid w-full items-center gap-1.5 md:col-span-2 lg:col-span-3">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Address"
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.address?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="mt-6 pt-6 border-t">
          <Label className="text-base font-semibold mb-4 block">
            Attachments <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-4">
            {/* Upload Button */}
            <div>
              <label
                htmlFor="attachment-upload"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors inline-block",
                  isUploadingAttachment && "opacity-50 cursor-not-allowed",
                )}
              >
                {isUploadingAttachment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Files</span>
                  </>
                )}
                <input
                  id="attachment-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                  disabled={isUploadingAttachment}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Max 10MB per file. You can upload multiple files.
              </p>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {attachment.split("/").pop() || `File ${index + 1}`}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errors.attachment && (
              <p className="text-sm text-red-600">
                {errors.attachment.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
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
              "Update End Client"
            ) : (
              "Create End Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
