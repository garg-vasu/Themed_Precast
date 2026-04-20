import { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom styles for React Quill to handle overflow properly
const quillStyles = `
  .ql-container {
    height: 250px !important;
    overflow-y: auto !important;
    border: none !important;
  }
  
  .ql-editor {
    min-height: 250px !important;
    max-height: 250px !important;
    overflow-y: auto !important;
    padding: 12px 15px !important;
  }
  
  .ql-toolbar {
    border: none !important;
    border-bottom: 1px solid #e5e7eb !important;
    background-color: #f9fafb !important;
  }
  
  .ql-container.ql-snow {
    border: none !important;
  }
`;

export type Variable = {
  key: string;
  description: string;
};

export type Template = {
  id: number;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  variables: Variable[];
  cc?: string[] | string;
  bcc?: string[] | string;
  created_by: any;
  created_at: string;
  updated_at: string;
  updated_by: any;
};

// const baseUrl = import.meta.env.VITE_BASE_URL; // Replaced by apiClient

// Form validation schema
const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name too long"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  body: z.string().min(1, "Email body is required"),
  template_type: z.string().min(1, "Template type is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  is_active: z.boolean().default(true),

  variables: z.array(
    z.object({
      key: z.string().min(1, "Variable key is required"),
      description: z.string().min(1, "Variable description is required"),
    }),
  ),
});

// Helper function to parse email addresses from comma-separated string
const parseEmailAddresses = (emailString: string): string[] => {
  if (!emailString || emailString.trim() === "") return [];

  return emailString
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate multiple email addresses
const validateEmailAddresses = (
  emailString: string,
): { isValid: boolean; invalidEmails: string[] } => {
  const emails = parseEmailAddresses(emailString);
  const invalidEmails = emails.filter((email) => !isValidEmail(email));

  return {
    isValid: invalidEmails.length === 0,
    invalidEmails,
  };
};

type FormData = z.infer<typeof templateSchema>;

export const demoTemplate: Template = {
  id: 1,
  name: "Welcome Email",
  subject: "Welcome to {{project_name}} 🎉",
  body: `
    <html>
      <body>
        <p>Dear {{client_name}},</p>
        
        <p>Welcome to <b>{{project_name}}</b>! Your account has been successfully created.</p>
        
        <p>Here are your login credentials:</p>
        <ul>
          <li>Email: {{email}}</li>
          <li>Password: {{password}}</li>
          <li>Role: {{role}}</li>
          <li>Organization: {{organization}}</li>
        </ul>
        
        <p>Please change your password after your first login.</p>
        
        <p>Best regards,<br/>
        {{company_name}} Team</p>
      </body>
    </html>
  `,
  template_type: "transactional",
  is_default: true,
  is_active: true,
  variables: [
    { key: "client_name", description: "Name of the client" },
    { key: "project_name", description: "Name of the project" },
    { key: "email", description: "Client's email address" },
    { key: "password", description: "Temporary password" },
    { key: "role", description: "Assigned role in the system" },
    { key: "organization", description: "Client's organization name" },
    { key: "company_name", description: "Your company's name" },
  ],
  cc: ["team@example.com", "manager@example.com"],
  bcc: ["audit@example.com", "compliance@example.com"],
  created_by: { id: 101, name: "Admin User" },
  created_at: "2025-09-01T10:00:00Z",
  updated_at: "2025-09-01T10:30:00Z",
  updated_by: { id: 102, name: "Editor User" },
};

// Quill editor modules and formats for production-grade editing
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "color",
  "background",
  "align",
  "link",
  "image",
];

export default function EditEmailTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    subject: "",
    body: "",
  });
  const [isVariablesCollapsed, setIsVariablesCollapsed] = useState(false);
  const [ccValidation, setCcValidation] = useState({
    isValid: true,
    invalidEmails: [] as string[],
  });
  const [bccValidation, setBccValidation] = useState({
    isValid: true,
    invalidEmails: [] as string[],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      template_type: "",
      cc: "",
      bcc: "",
      is_active: false,
      variables: [],
    },
  });

  const watchedValues = watch();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/email-templates/${id}`);
      if (response.status === 200) {
        const templateData = response.data;

        let parsedVariables = [];
        if (templateData.variables) {
          try {
            parsedVariables =
              typeof templateData.variables === "string"
                ? JSON.parse(templateData.variables)
                : templateData.variables;
          } catch (e) {
            console.error("Failed to parse variables:", e);
          }
        }

        setData({
          ...templateData,
          variables: parsedVariables,
        });

        // Set form values
        setValue("name", templateData.name || "");
        setValue("subject", templateData.subject || "");
        setValue("body", templateData.body || "");
        setValue("template_type", templateData.template_type || "");

        // Handle CC and BCC - convert arrays to comma-separated strings
        const ccValue = Array.isArray(templateData.cc)
          ? templateData.cc.join(", ")
          : templateData.cc || "";
        const bccValue = Array.isArray(templateData.bcc)
          ? templateData.bcc.join(", ")
          : templateData.bcc || "";

        setValue("cc", ccValue);
        setValue("bcc", bccValue);
        setValue("is_active", templateData.is_active || false);
        setValue("variables", parsedVariables);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching template details:", error);
      toast.error("Failed to load template");
      setLoading(false);
    }
  };

  const onSubmit = async (formData: FormData) => {
    setSaving(true);

    // Validate email addresses before submission
    const ccValidation = validateEmailAddresses(formData.cc || "");
    const bccValidation = validateEmailAddresses(formData.bcc || "");

    if (!ccValidation.isValid || !bccValidation.isValid) {
      const invalidEmails = [
        ...ccValidation.invalidEmails,
        ...bccValidation.invalidEmails,
      ];
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      setSaving(false);
      return;
    }

    try {
      // Convert string email inputs to arrays
      const processedData = {
        ...formData,
        cc: parseEmailAddresses(formData.cc || ""),
        bcc: parseEmailAddresses(formData.bcc || ""),
      };

      let response;
      if (id) {
        response = await apiClient.put(`/email-templates/${id}`, processedData);
      } else {
        response = await apiClient.post(`/email-templates`, processedData);
      }
      if (response.status === 200 || response.status === 201) {
        toast.success(
          id
            ? "Template updated successfully"
            : "Template created successfully",
        );
        navigate("/email-templates");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Variable copied to clipboard!");
  };

  const insertVariable = (variable: string) => {
    const quill = (document.querySelector(".ql-editor") as any)?.__quill;
    if (quill) {
      const range = quill.getSelection();
      quill.insertText(range ? range.index : 0, variable);
    }
  };

  // Real-time email validation
  const handleCcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("cc", value);
    const validation = validateEmailAddresses(value);
    setCcValidation(validation);
  };

  const handleBccChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("bcc", value);
    const validation = validateEmailAddresses(value);
    setBccValidation(validation);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 flex flex-col w-full">
      {/* Custom CSS for Quill Editor */}
      <style>{quillStyles}</style>

      <h4 className="text-lg sm:text-xl font-semibold capitalize text-purple-500 mb-2 sm:mb-0">
        {id ? "Edit Email Template" : "Create Email Template"}
      </h4>

      {/* Compact Template Variables */}
      <div className="mb-4 mt-4 p-4 bg-gray-50 rounded-lg border">
        <div
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => setIsVariablesCollapsed(!isVariablesCollapsed)}>
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Replacement Patterns
            </h3>
          </div>
          {isVariablesCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {!isVariablesCollapsed && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.variables.map((variable) => (
                    <TableRow key={variable.key}>
                      <TableCell>
                        <code className="text-sm text-blue-600 font-mono">
                          {`{{${variable.key}}}`}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {variable.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <button
                            onClick={() =>
                              copyToClipboard(`{{${variable.key}}}`)
                            }
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Copy variable">
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() =>
                              insertVariable(`{{${variable.key}}}`)
                            }
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Insert variable">
                            <Info className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 Click copy to copy variable syntax, or click insert to add
              directly to editor
            </p>
          </>
        )}
      </div>

      <div></div>
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* email name  */}
            <div className="space-y-1">
              <Label htmlFor="name">Email Template Name</Label>
              <Input
                {...register("name")}
                type="text"
                id="name"
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            {/* email type  */}
            <div className="space-y-1">
              <Label htmlFor="template_type">Email Type</Label>
              <Input
                {...register("template_type")}
                type="text"
                id="template_type"
                placeholder="Enter email type"
              />
              {errors.template_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.template_type.message}
                </p>
              )}
            </div>
            {/* email cc */}
            <div className="space-y-1">
              <Label htmlFor="cc">CC (Carbon Copy)</Label>
              <Input
                {...register("cc")}
                type="text"
                id="cc"
                placeholder="email1@example.com, email2@example.com"
                onChange={handleCcChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple email addresses with commas
                {watchedValues.cc &&
                  parseEmailAddresses(watchedValues.cc).length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({parseEmailAddresses(watchedValues.cc).length} email
                      {parseEmailAddresses(watchedValues.cc).length !== 1
                        ? "s"
                        : ""}
                      )
                    </span>
                  )}
              </p>
              {!ccValidation.isValid &&
                ccValidation.invalidEmails.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Invalid emails: {ccValidation.invalidEmails.join(", ")}
                  </p>
                )}
              {errors.cc && (
                <p className="text-red-500 text-sm mt-1">{errors.cc.message}</p>
              )}
            </div>
            {/* email bcc */}
            <div className="space-y-1">
              <Label htmlFor="bcc">BCC (Blind Carbon Copy)</Label>
              <Input
                {...register("bcc")}
                type="text"
                id="bcc"
                placeholder="email1@example.com, email2@example.com"
                onChange={handleBccChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple email addresses with commas
                {watchedValues.bcc &&
                  parseEmailAddresses(watchedValues.bcc).length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({parseEmailAddresses(watchedValues.bcc).length} email
                      {parseEmailAddresses(watchedValues.bcc).length !== 1
                        ? "s"
                        : ""}
                      )
                    </span>
                  )}
              </p>
              {!bccValidation.isValid &&
                bccValidation.invalidEmails.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Invalid emails: {bccValidation.invalidEmails.join(", ")}
                  </p>
                )}
              {errors.bcc && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bcc.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full ">
            <div className="w-full space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                {...register("subject")}
                type="text"
                id="subject"
                className="w-full"
                placeholder="Enter subject"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.subject.message}
                </p>
              )}
            </div>
          </div>

          {/* Smart Text Editor for Email Body */}
          <div className="w-full space-y-2">
            <Label htmlFor="body">Email Body *</Label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <ReactQuill
                theme="snow"
                value={watchedValues.body}
                onChange={(content) => setValue("body", content)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your email content here..."
                className="text-sm"
              />
            </div>
            {errors.body && (
              <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Use the toolbar above to format your text. You can make text bold,
              italic, add lists, and more. The editor will automatically scroll
              when content exceeds the visible area.
            </p>
          </div>

          {/* Active Template Checkbox */}
          <div className="w-full space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watchedValues.is_active}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
              <Label htmlFor="is_active">Send Immediately</Label>
            </div>
            <p className="text-xs text-gray-500 ml-11">
              Check this box to send the email immediately after the event takes
              place.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-purple-500 hover:bg-purple-600 text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
