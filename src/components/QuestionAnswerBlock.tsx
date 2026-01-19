import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Paper {
  id: number;
  name: string;
  project_id: number;
}

export interface Option {
  id: number;
  question_id: number;
  option_text: string;
}

export interface Question {
  id: number;
  project_id: number;
  paper_id: number;
  question_text: string;
  created_at: string;
  options: Option[];
}

export interface Data {
  paper: Paper;
  questions: Question[];
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
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`
    );
  }
  return "An unexpected error occurred. Please try again later.";
};

const answerSchema = z.object({
  answers: z
    .array(
      z.object({
        project_id: z.number(),
        question_id: z.number(),
        option_id: z.number().min(1, "Please select an option"),
        task_id: z.number(),
        stage_id: z.number(),
        comment: z.string(),
        image_path: z.string().nullable(),
      })
    )
    .min(1, "At least one answer is required"),
  status: z.object({
    activity_id: z.number(),
    status: z.string().min(1, "Status is required"),
  }),
});

type QuestionaryProp = {
  taskId: number;
  paperId: number;
  projectId: number;
  activityId: number;
  stage_id: number;
  close: () => void;
};

type FormData = z.infer<typeof answerSchema>;

const buildImageUrl = (fileName: string | null | undefined): string => {
  if (!fileName) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return fileName;
  return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
};

export default function QuestionAnswerBlock({
  paperId,
  projectId,
  close,
  stage_id,
  activityId,
}: QuestionaryProp) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{
    [key: number]: boolean;
  }>({});
  const [imagePreviews, setImagePreviews] = useState<{
    [key: number]: string;
  }>({});
  const [imageUrls, setImageUrls] = useState<{
    [key: number]: string;
  }>({});

  const getDefaultValues = (): Partial<FormData> => {
    return {
      answers: questions.map((question) => ({
        project_id: projectId,
        question_id: question.id,
        option_id: 0,
        task_id: activityId,
        stage_id: stage_id,
        comment: "",
        image_path: null,
      })),
      status: {
        activity_id: activityId,
        status: "",
      },
    };
  };

  const {
    handleSubmit,
    register,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: getDefaultValues(),
  });

  const fetchQuestions = useCallback(() => {
    const source = axios.CancelToken.source();

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await apiClient.get(`/questions/${paperId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          const data = response.data as Data;
          const qs = data.questions || [];
          if (!qs.length) {
            setLoadError("No questions available for this paper.");
          }
          setQuestions(qs);
        } else {
          const message =
            response.data?.message || "Failed to fetch questions.";
          setLoadError(message);
          toast.error(message);
          setQuestions([]);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          const message = getErrorMessage(err, "questions data");
          setLoadError(message);
          toast.error(message);
          setQuestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      source.cancel();
    };
  }, [paperId]);

  useEffect(() => {
    const cancel = fetchQuestions();
    return cancel;
  }, [fetchQuestions]);

  useEffect(() => {
    if (questions.length > 0) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [questions]);

  const handleImageUpload = async (file: File, questionIndex: number) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    // create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({
        ...prev,
        [questionIndex]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);

    setUploadingImages((prev) => ({ ...prev, [questionIndex]: true }));
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
          setImageUrls((prev) => ({
            ...prev,
            [questionIndex]: imageUrlValue,
          }));
          setValue(`answers.${questionIndex}.image_path`, imageUrlValue);
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
      setImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[questionIndex];
        return newPreviews;
      });
    } finally {
      setUploadingImages((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionIndex: number
  ): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, questionIndex);
    }
  };

  const removeImage = (questionIndex: number) => {
    setValue(`answers.${questionIndex}.image_path`, null);
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[questionIndex];
      return newPreviews;
    });
    setImageUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[questionIndex];
      return newUrls;
    });
    toast.success("Image removed");
  };

  const onSubmit = async (data: FormData) => {
    try {
      const response = await apiClient.post("/questions/answers", data);
      if (response.status === 200 || response.status === 201) {
        toast.success("Answers submitted successfully!");
        close();
      } else {
        toast.error(response.data?.message || "Failed to submit answers");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "submit answers");
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <p className="text-sm text-red-600">{loadError}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              fetchQuestions();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          No questions available for this paper.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>
                  Question {index + 1}: {question.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Input
                  type="hidden"
                  {...register(`answers.${index}.question_id`, {
                    value: question.id,
                  })}
                />
                <Input
                  type="hidden"
                  {...register(`answers.${index}.project_id`, {
                    value: projectId,
                  })}
                />
                <Input
                  type="hidden"
                  {...register(`answers.${index}.task_id`, {
                    value: activityId,
                  })}
                />
                <Input
                  type="hidden"
                  {...register(`answers.${index}.stage_id`, {
                    value: stage_id,
                  })}
                />

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor={`option-${index}`}>
                    Select Option <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name={`answers.${index}.option_id`}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) =>
                          field.onChange(Number(value) || 0)
                        }
                      >
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`option-${index}-${option.id}`}
                            />
                            <Label
                              htmlFor={`option-${index}-${option.id}`}
                              className="cursor-pointer"
                            >
                              {option.option_text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.answers?.[index]?.option_id?.message || "\u00A0"}
                  </p>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor={`comment-${index}`}>Comment</Label>
                  <Textarea
                    id={`comment-${index}`}
                    placeholder="Enter your comment here"
                    {...register(`answers.${index}.comment`)}
                    aria-invalid={!!errors.answers?.[index]?.comment}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.answers?.[index]?.comment?.message || "\u00A0"}
                  </p>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor={`image-${index}`}>Image Upload</Label>
                  <div className="flex flex-col gap-4">
                    {/* Image Preview Section */}
                    {(imagePreviews[index] ||
                      (imageUrls[index] &&
                        buildImageUrl(imageUrls[index]))) && (
                      <div className="relative inline-block w-fit">
                        <Avatar className="w-40 h-40 border-4 border-background shadow-lg ring-2 ring-ring ring-offset-2">
                          {imagePreviews[index] ||
                          (imageUrls[index] &&
                            buildImageUrl(imageUrls[index])) ? (
                            <AvatarImage
                              src={
                                imagePreviews[index] ||
                                buildImageUrl(imageUrls[index])
                              }
                              alt="Image preview"
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              <ImageIcon className="w-12 h-12" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {uploadingImages[index] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 shadow-lg"
                          onClick={() => removeImage(index)}
                          disabled={uploadingImages[index]}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Upload Button Section */}
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`image-${index}`}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                          uploadingImages[index] &&
                            "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {uploadingImages[index] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">
                              Uploading...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {imageUrls[index] || imagePreviews[index]
                                ? "Change Image"
                                : "Upload Image"}
                            </span>
                          </>
                        )}
                        <input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, index)}
                          disabled={uploadingImages[index]}
                        />
                      </label>
                      {uploadingImages[index] && (
                        <span className="text-xs text-muted-foreground">
                          Please wait while image is being uploaded...
                        </span>
                      )}
                    </div>
                  </div>
                  <Input
                    type="hidden"
                    {...register(`answers.${index}.image_path`)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="status.status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("status.activity_id", activityId);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="Inprogress">In Progress</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.status?.status?.message || "\u00A0"}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
