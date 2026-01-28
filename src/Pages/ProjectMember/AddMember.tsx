import axios, { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
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
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Phonecode {
  id: number;
  country_name: string;
  phone_code: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  quantity: number;
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

// Schema - password validation is handled in onSubmit for edit mode flexibility
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "ZipCode is required"),
  phone_no: z.string().min(10, "Phone number must be at least 10 digits"),
  phone_code: z.number().min(1, "Phone code is required"),
  employee_id: z.string().min(1, "Employee ID is required"),
  role_id: z.number().min(1, "Role is required"),
  profile_picture: z.string().optional(),
  emailsend: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export interface EditMember {
  id: number;
  email: string;
  password?: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone_no: string;
  phone_code: number;
  profile_picture?: string;
  role_id: number;
  emailsend?: boolean;
}

type MemberFormProps = {
  user?: EditMember;
};

export default function AddMember({ user }: MemberFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!user;
  const { projectId } = useParams<{ projectId: string }>();
  const [phonecodes, setPhonecodes] = useState<Phonecode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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

  // Prepare default values for form
  const getDefaultValues = (): FormData => {
    if (!user) {
      return {
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        employee_id: "",
        phone_no: "",
        phone_code: 0,
        profile_picture: "",
        emailsend: false,
        role_id: 0,
      };
    }

    return {
      email: user.email || "",
      password: user.password || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      zipCode: user.zipCode || "",
      employee_id: user.employee_id || "",
      phone_no: user.phone_no || "",
      phone_code: user.phone_code || 0,
      profile_picture: user.profile_picture || "",
      emailsend: user.emailsend ?? false,
      role_id: user.role_id || 0,
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

  // Prefill form when user data is available
  useEffect(() => {
    if (user) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);

      // Set image preview if profile_picture exists
      if (user.profile_picture) {
        setImageUrl(user.profile_picture);
        setImagePreview(buildImageUrl(user.profile_picture));
      }
    }
  }, [user, reset, setValue]);

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

  // Fetch warehouses
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchRoles = async () => {
      try {
        const response = await apiClient.get(`/get_role/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setRoles(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch project roles",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "project roles data"));
        }
      }
    };

    fetchRoles();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const onSubmit = async (data: FormData) => {
    // Validate password for create mode
    if (!isEditMode && (!data.password || data.password.trim().length < 8)) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
        emailsend: data.emailsend ?? false,
      };

      // Always set client_id in edit mode (before password check)
      if (isEditMode && user?.id) {
        payload.client_id = user.id;
      } else if (isEditMode && !user?.id) {
        console.error("User ID is missing in edit mode", { user, isEditMode });
        toast.error("Unable to update: Missing tenant ID");
        setIsLoading(false);
        return;
      }

      // Remove password from payload if it's empty in edit mode
      if (isEditMode && (!data.password || data.password.trim() === "")) {
        delete payload.password;
      } else if (data.password) {
        // Ensure password meets requirements if provided
        if (data.password.trim().length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsLoading(false);
          return;
        }
      }

      if (isEditMode && user) {
        // Debug: Log the payload before sending
        console.log("Edit mode payload:", payload);

        // Update existing tenant
        const response = await apiClient.put(
          `/update_user/${user.id}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Project member updated successfully!");
          navigate(`/project/${projectId}/member`);
        }
      } else {
        // Create new tenant
        const response = await apiClient.post(
          "/create_project_members",
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Project member created successfully!");
          navigate(`/project/${projectId}/member`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update Member" : "create Member",
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit Member" : "Add Member"} />
      </div>
      <Separator />
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

          {/* Password */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">
              Password {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && (
                <span className="text-xs text-muted-foreground ml-1">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={
                isEditMode ? "Leave blank to keep current" : "Password"
              }
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.password?.message || "\u00A0"}
            </p>
          </div>

          {/* First Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="First Name"
              {...register("first_name")}
              aria-invalid={!!errors.first_name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.first_name?.message || "\u00A0"}
            </p>
          </div>

          {/* Last Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Last Name"
              {...register("last_name")}
              aria-invalid={!!errors.last_name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.last_name?.message || "\u00A0"}
            </p>
          </div>

          {/* Employee ID    */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="employee_id">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee_id"
              placeholder="Employee ID"
              {...register("employee_id")}
              aria-invalid={!!errors.employee_id}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.employee_id?.message || "\u00A0"}
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

          {/* Store ID */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="role_id">
              Role <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="role_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    const selectedRole = roles.find(
                      (role) => role.role_id === Number(val),
                    );
                    if (selectedRole) {
                      setValue("role_id", selectedRole.role_id);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      {roles.map((role) => (
                        // disable the role if the quantity is 0 and  user could not able to click on it
                        <SelectItem
                          className={
                            role.quantity === 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                          disabled={role.quantity === 0}
                          key={role.role_id}
                          value={role.role_id.toString()}
                        >
                          {role.role_name} - {role.quantity}{" "}
                          {role.quantity === 0 ? "(Disabled)" : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.role_id?.message || "\u00A0"}
            </p>
          </div>

          {/* Address */}
          <div className="grid w-full items-center gap-1.5">
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

          {/* City */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="city">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              placeholder="City"
              {...register("city")}
              aria-invalid={!!errors.city}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.city?.message || "\u00A0"}
            </p>
          </div>

          {/* State */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="state">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="state"
              placeholder="State"
              {...register("state")}
              aria-invalid={!!errors.state}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.state?.message || "\u00A0"}
            </p>
          </div>

          {/* Country */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Input
              id="country"
              placeholder="Country"
              {...register("country")}
              aria-invalid={!!errors.country}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.country?.message || "\u00A0"}
            </p>
          </div>

          {/* Zip Code */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="zipCode">
              Zip Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="zipCode"
              placeholder="Zip Code"
              {...register("zipCode")}
              aria-invalid={!!errors.zipCode}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.zipCode?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/project/${projectId}/member`)}
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
              "Update Member"
            ) : (
              "Create Member"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
