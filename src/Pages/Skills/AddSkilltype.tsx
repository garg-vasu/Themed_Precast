import axios, { AxiosError } from "axios";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router";
import { useContext, useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { UserContext } from "@/Provider/UserProvider";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export interface User {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  first_access: string; // ISO date string
  last_access: string; // ISO date string
  profile_picture: string;
  is_admin: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role_id: number;
  role_name: string;
  suspended: boolean;
}

export interface ClientDetails {
  client_id: number;
  user_id: number;
  organization: string;
  user: User;
}

type SkillTypeProps = {
  refresh: () => void;
  initialData?: any;
  id?: number;
  onClose?: () => void;
};

const schema = z.object({
  name: z.string().nonempty("Skill type name is required"),
  client_id: z.number().optional(),
  skills: z
    .array(z.object({ value: z.string().min(1, "Skill is required") }))
    .min(1, "At least one skill is required"),
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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export default function AddSkilltype({
  refresh,
  initialData: propInitialData,
  id,
  onClose,
}: SkillTypeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const [endClients, setEndClients] = useState<ClientDetails[]>([]);
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        client_id: 0,
        skills: [],
      };
    }

    // Transform skills array to the expected format
    // Handle both string array and object array formats
    let skillsArray = [];
    if (initialData.skills && Array.isArray(initialData.skills)) {
      skillsArray = initialData.skills
        .map((skill: any) => {
          if (typeof skill === "string") {
            return { value: skill };
          } else if (skill && typeof skill === "object" && skill.name) {
            return { value: skill.name };
          } else if (skill && typeof skill === "object" && skill.value) {
            return { value: skill.value };
          }
          return { value: "" };
        })
        .filter((skill: any) => skill.value);
    }

    return {
      name: initialData.name || "",
      client_id: initialData.client_id || 0,
      skills: skillsArray,
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

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      try {
        const response = await apiClient.get("/client", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setEndClients(response.data.data);
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

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "skills",
  });

  const [newSkillValue, setNewSkillValue] = useState("");

  useEffect(() => {
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const handleAddSkill = () => {
    if (newSkillValue.trim()) {
      append({ value: newSkillValue.trim() });
      setNewSkillValue("");
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        name: data.name,
        skills: (data.skills ?? []).map((skill) => skill.value),
        client_id: data.client_id,
      };
      if (user?.role_name !== "superadmin") {
        delete payload.client_id;
      }
      if (isEditMode && user) {
        // Update existing skill type
        const response = await apiClient.put(
          `/skill-types/${initialData?.id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Skill type updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/skills");
          }
        }
      } else {
        // Create new skill type
        const response = await apiClient.post("/skill-types", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Skill type created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/skills");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update skill type" : "create skill type"
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      {/* <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit Skill Type" : "Add Skill Type"} />
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2  gap-4 mt-4">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="skill_type_name">
                Skill Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="skill_type_name"
                placeholder="Skill Type Name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* select a client */}
            {user?.role_name === "superadmin" && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="select_client">
                  Select a Client <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="client_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Clients</SelectLabel>
                          {endClients.map((client) => (
                            <SelectItem
                              key={client.client_id}
                              value={client.client_id.toString()}
                            >
                              {client.organization || client.user.first_name}
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
            )}
          </div>
        </div>
        <div className="mt-6">
          {/* First row - Input field for adding new skill */}
          <div className="mb-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 grid w-full items-center gap-1.5">
                <Label htmlFor="new_skill">
                  Add Skill <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new_skill"
                  placeholder="Enter skill name"
                  value={newSkillValue}
                  onChange={(e) => setNewSkillValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddSkill}
                disabled={!newSkillValue.trim()}
                className="mb-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-sm text-red-600 min-h-[20px] mt-1">
              {errors.skills?.message || "\u00A0"}
            </p>
          </div>

          {/* Second row - Display added skills in 3-4 column grid */}
          {fields.length > 0 && (
            <div className="mt-4">
              <Label className="mb-2 block">
                Added Skills ({fields.length})
              </Label>
              <div className="max-h-[200px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-1.5 p-1.5 border rounded-md bg-background min-w-0"
                    >
                      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <Controller
                          control={control}
                          name={`skills.${index}.value`}
                          render={({ field: skillField }) => (
                            <Input
                              {...skillField}
                              placeholder="Skill name"
                              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 truncate"
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate("/skills");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading
              ? "Saving..."
              : isEditMode
              ? "Update Skill Type"
              : "Create Skill Type"}
          </Button>
        </div>
      </form>
    </div>
  );
}
